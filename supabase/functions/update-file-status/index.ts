import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// ============= CORS Configuration =============
const ALLOWED_ORIGINS = [
  'https://gictor.com',
  'https://www.gictor.com',
  'https://promptgeist-studio.lovable.app',
  'https://lovable.dev',
  'https://lovableproject.com',
  Deno.env.get('ALLOWED_ORIGIN') || '',
].filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || 
    origin.endsWith('.lovable.app') || 
    origin.endsWith('.lovable.dev') ||
    origin.endsWith('.lovableproject.com')
  );
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-api-key, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ============= Rate Limiting =============
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (record.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT - record.count };
}

// ============= Input Validation Schemas =============
const PipelineUpdateSchema = z.object({
  type: z.enum(['pipeline_first_frame', 'pipeline_first_frame_b_roll', 'pipeline_script', 'pipeline_voice', 'pipeline_final_video']),
  pipeline_id: z.string().uuid(),
  status: z.enum(['completed', 'failed', 'processing']).optional(),
  output: z.object({
    url: z.string().url(),
    duration_seconds: z.number().optional(),
  }).optional(),
  error_message: z.string().max(1000).optional(),
  user_id: z.string().uuid().optional(),
  credits_cost: z.number().positive().optional(),
});

const FileUpdateSchema = z.object({
  file_id: z.string().uuid(),
  status: z.enum(['completed', 'failed', 'processing']),
  generation_status: z.enum(['completed', 'failed', 'processing']).optional(),
  progress: z.number().min(0).max(100).optional(),
  preview_url: z.string().url().optional(),
  download_url: z.string().url().optional(),
  script_output: z.string().max(50000).optional(),
  error_message: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
  user_id: z.string().uuid().optional(),
  credits_cost: z.number().positive().optional(),
});

type PipelineUpdateInput = z.infer<typeof PipelineUpdateSchema>;
type FileUpdateInput = z.infer<typeof FileUpdateSchema>;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 
                   'unknown';
  const { allowed, remaining } = checkRateLimit(clientIP);

  if (!allowed) {
    console.warn('Rate limit exceeded for IP:', clientIP);
    return new Response(
      JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60',
        } 
      }
    );
  }

  try {
    // API Key validation
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('N8N_WEBHOOK_SECRET');
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Unauthorized request - invalid API key from IP:', clientIP);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { type } = body;

    console.log('Received update request:', { type, ip: clientIP });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle pipeline stage updates with validation
    if (type?.startsWith('pipeline_')) {
      const parseResult = PipelineUpdateSchema.safeParse(body);
      if (!parseResult.success) {
        console.error('Validation error:', parseResult.error.issues);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid request', 
            details: parseResult.error.issues 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return handlePipelineUpdate(supabase, parseResult.data, corsHeaders, remaining);
    }

    // Handle regular file updates with validation
    const parseResult = FileUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('Validation error:', parseResult.error.issues);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request', 
          details: parseResult.error.issues 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    return handleFileUpdate(supabase, parseResult.data, corsHeaders, remaining);

  } catch (error) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// deno-lint-ignore no-explicit-any
async function handlePipelineUpdate(
  supabase: any, 
  body: PipelineUpdateInput, 
  corsHeaders: Record<string, string>,
  remaining: number
) {
  const { type, pipeline_id, status, output, user_id, credits_cost } = body;

  console.log('Processing pipeline update:', { type, pipeline_id, status });

  // deno-lint-ignore no-explicit-any
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  switch (type) {
    case 'pipeline_first_frame':
    case 'pipeline_first_frame_b_roll':
      if (status === 'completed' && output) {
        updates.first_frame_output = output;
        updates.first_frame_complete = true;
      } else if (status === 'failed') {
        updates.first_frame_output = null;
        if (user_id && credits_cost) {
          await refundCredits(supabase, user_id, credits_cost, 'first_frame', pipeline_id);
        }
      }
      break;

    case 'pipeline_script':
      if (status === 'completed' && output) {
        updates.script_output = output;
        updates.script_complete = true;
      } else if (status === 'failed') {
        updates.script_output = null;
        if (user_id && credits_cost) {
          await refundCredits(supabase, user_id, credits_cost, 'script', pipeline_id);
        }
      }
      break;

    case 'pipeline_voice':
      if (status === 'completed' && output) {
        updates.voice_output = output;
        updates.voice_complete = true;
      } else if (status === 'failed') {
        updates.voice_output = null;
        if (user_id && credits_cost) {
          await refundCredits(supabase, user_id, credits_cost, 'voice', pipeline_id);
        }
      }
      break;

    case 'pipeline_final_video':
      if (status === 'completed' && output) {
        updates.final_video_output = output;
        updates.status = 'completed';
        
        const { data: pipeline } = await supabase
          .from('pipelines')
          .select('project_id, folder_id, name, tags, pipeline_type')
          .eq('id', pipeline_id)
          .single();

        if (pipeline) {
          const { data: file } = await supabase
            .from('files')
            .insert({
              project_id: pipeline.project_id,
              folder_id: pipeline.folder_id,
              name: pipeline.name,
              file_type: pipeline.pipeline_type || 'talking_head',
              status: 'completed',
              tags: pipeline.tags,
              preview_url: output.url,
              download_url: output.url,
              metadata: { pipeline_id, duration: output.duration_seconds },
              progress: 100,
            })
            .select()
            .single();

          if (file) {
            updates.output_file_id = file.id;
            console.log('Created file record:', file.id);
          }
        }
      } else if (status === 'failed') {
        updates.status = 'failed';
        if (user_id && credits_cost) {
          await refundCredits(supabase, user_id, credits_cost, 'final_video', pipeline_id);
        }
      }
      break;

    default:
      console.error('Unknown pipeline type:', type);
      return new Response(
        JSON.stringify({ success: false, error: 'Unknown pipeline type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
  }

  const { error } = await supabase
    .from('pipelines')
    .update(updates)
    .eq('id', pipeline_id);

  if (error) {
    console.error('Pipeline update error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Pipeline updated successfully:', pipeline_id);

  return new Response(
    JSON.stringify({ success: true, pipeline_id }),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(remaining),
      } 
    }
  );
}

// deno-lint-ignore no-explicit-any
async function handleFileUpdate(
  supabase: any, 
  body: FileUpdateInput, 
  corsHeaders: Record<string, string>,
  remaining: number
) {
  const { file_id, status, generation_status, progress, preview_url, download_url, script_output, error_message, metadata, user_id, credits_cost } = body;

  // deno-lint-ignore no-explicit-any
  const updateData: Record<string, any> = {
    generation_status: status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    if (preview_url) updateData.preview_url = preview_url;
    if (download_url) updateData.download_url = download_url;
    if (script_output) updateData.script_output = script_output;
    updateData.metadata = metadata || {};
    updateData.error_message = null;
    updateData.progress = progress ?? 100;
  } else if (status === 'failed') {
    updateData.error_message = error_message || 'Generation failed';
    updateData.preview_url = null;
    updateData.download_url = null;
    updateData.metadata = metadata || {};
    updateData.progress = 0;
    
    if (user_id && credits_cost) {
      await refundCredits(supabase, user_id, credits_cost, 'file', file_id);
    }
  }

  console.log('Updating file with data:', updateData);

  const { error } = await supabase
    .from('files')
    .update(updateData)
    .eq('id', file_id);

  if (error) {
    console.error('Update error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update file', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('File updated successfully:', file_id);

  return new Response(
    JSON.stringify({ success: true, file_id, status }),
    { 
      status: 200, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(remaining),
      } 
    }
  );
}

// deno-lint-ignore no-explicit-any
async function refundCredits(
  supabase: any, 
  userId: string, 
  amount: number, 
  type: string, 
  referenceId: string
) {
  try {
    console.log('Refunding credits:', { userId, amount, type, referenceId });
    
    const { error: refundError } = await supabase.rpc('refund_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: `Refund for failed ${type} generation (${referenceId})`
    });

    if (refundError) {
      console.error('Refund error:', refundError);
    } else {
      console.log('Credits refunded successfully');
    }
  } catch (error) {
    console.error('Refund error:', error);
  }
}
