import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

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

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW = 60 * 1000;

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
  audio_url: z.string().url().optional(),
  error_message: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
  user_id: z.string().uuid().optional(),
  credits_cost: z.number().positive().optional(),
});

type PipelineUpdateInput = z.infer<typeof PipelineUpdateSchema>;
type FileUpdateInput = z.infer<typeof FileUpdateSchema>;

// IMPORTANT: This key must match what n8n sends
const N8N_API_KEY = 'gictor-n8n-secret-2024';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('cf-connecting-ip') || 'unknown';
  const { allowed, remaining } = checkRateLimit(clientIP);

  if (!allowed) {
    return new Response(
      JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
    );
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('N8N_WEBHOOK_SECRET');
    
    // Accept BOTH env var OR hardcoded key for n8n
    if (!apiKey || (apiKey !== expectedKey && apiKey !== N8N_API_KEY)) {
      console.error('Unauthorized - invalid API key');
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

    if (type?.startsWith('pipeline_')) {
      const parseResult = PipelineUpdateSchema.safeParse(body);
      if (!parseResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request', details: parseResult.error.issues }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return handlePipelineUpdate(supabase, parseResult.data, corsHeaders, remaining);
    }

    const parseResult = FileUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request', details: parseResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    return handleFileUpdate(supabase, parseResult.data, corsHeaders, remaining);

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// deno-lint-ignore no-explicit-any
async function handlePipelineUpdate(supabase: any, body: PipelineUpdateInput, corsHeaders: Record<string, string>, _remaining: number) {
  const { type, pipeline_id, status, output } = body;
  console.log('Processing pipeline update:', { type, pipeline_id, status });

  // deno-lint-ignore no-explicit-any
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  switch (type) {
    case 'pipeline_first_frame':
    case 'pipeline_first_frame_b_roll':
      if (status === 'completed' && output) {
        updates.first_frame_output = output;
        updates.first_frame_complete = true;
        updates.status = 'draft';
      }
      break;
    case 'pipeline_script':
      if (status === 'completed' && output) {
        updates.script_output = output;
        updates.script_complete = true;
        updates.status = 'draft';
      }
      break;
    case 'pipeline_voice':
      if (status === 'completed' && output) {
        updates.voice_output = output;
        updates.voice_complete = true;
        updates.status = 'draft';
      }
      break;
    case 'pipeline_final_video':
      if (status === 'completed' && output) {
        updates.final_video_output = output;
        updates.status = 'completed';
      }
      break;
  }

  const { error } = await supabase.from('pipelines').update(updates).eq('id', pipeline_id);
  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  console.log('Pipeline updated:', pipeline_id);
  return new Response(JSON.stringify({ success: true, pipeline_id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// deno-lint-ignore no-explicit-any
async function handleFileUpdate(supabase: any, body: FileUpdateInput, corsHeaders: Record<string, string>, _remaining: number) {
  const { file_id, status, progress, preview_url, download_url, script_output, audio_url, error_message, metadata } = body;

  // deno-lint-ignore no-explicit-any
  const updateData: Record<string, any> = {
    generation_status: status,
    updated_at: new Date().toISOString(),
  };

  if (typeof progress === 'number') updateData.progress = progress;

  if (status === 'completed') {
    if (preview_url) updateData.preview_url = preview_url;
    if (download_url) updateData.download_url = download_url;
    if (script_output) updateData.script_output = script_output;
    updateData.metadata = metadata || {};
    updateData.error_message = null;
    updateData.progress = progress ?? 100;
  } else if (status === 'failed') {
    updateData.error_message = error_message || 'Generation failed';
    updateData.progress = 0;
  }

  console.log('Updating file:', file_id, updateData);

  const { error } = await supabase.from('files').update(updateData).eq('id', file_id);
  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  console.log('File updated:', file_id);

  // ========== ALSO UPDATE PIPELINE ==========
  // Pipeline ID can come from metadata OR from file_id if it's actually a pipeline ID
  // (some workflows use the pipeline_id as file_id for simplicity)
  const pipelineIdFromMetadata = metadata?.pipeline_id as string | undefined;
  const stage = metadata?.stage as string | undefined;
  // Also check common alternative field names from n8n
  const frameType = metadata?.frame_type as string | undefined;
  
  // Use pipeline_id from metadata, or fall back to file_id if it looks like a pipeline was targeted
  const pipelineId = pipelineIdFromMetadata || file_id;
  // Determine stage from metadata.stage or metadata.frame_type
  const effectiveStage = stage || (frameType === 'first' ? 'first_frame' : frameType === 'last' ? 'last_frame' : undefined);
  
  console.log('Pipeline sync check:', { pipelineId, effectiveStage, status, hasPreviewUrl: !!preview_url, hasDownloadUrl: !!download_url });
  
  if (pipelineId) {
    // deno-lint-ignore no-explicit-any
    const pipelineUpdates: Record<string, any> = { 
      updated_at: new Date().toISOString(),
    };
    
    // Handle progress updates for processing status
    if (status === 'processing' && typeof progress === 'number') {
      pipelineUpdates.progress = progress;
    }
    
    // Handle completion - update the appropriate output field
    if (status === 'completed') {
      pipelineUpdates.progress = 100;
      
      const outputUrl = preview_url || download_url;
      
      if (effectiveStage === 'first_frame' || effectiveStage === 'frame' || effectiveStage === 'first') {
        pipelineUpdates.first_frame_output = { url: outputUrl, generated_at: new Date().toISOString() };
        pipelineUpdates.first_frame_complete = true;
        pipelineUpdates.status = 'draft';
        console.log('Updating first_frame_output:', outputUrl);
      } 
      else if (effectiveStage === 'last_frame' || effectiveStage === 'last') {
        pipelineUpdates.last_frame_output = { url: outputUrl, generated_at: new Date().toISOString() };
        pipelineUpdates.last_frame_complete = true;
        pipelineUpdates.status = 'draft';
        console.log('Updating last_frame_output:', outputUrl);
      }
      else if (effectiveStage === 'speech' || effectiveStage === 'voice') {
        pipelineUpdates.voice_output = { url: outputUrl || audio_url, generated_at: new Date().toISOString() };
        pipelineUpdates.voice_complete = true;
        pipelineUpdates.status = 'draft';
      }
      else if (effectiveStage === 'lip_sync' || effectiveStage === 'final_video' || effectiveStage === 'animate') {
        pipelineUpdates.final_video_output = { url: outputUrl, generated_at: new Date().toISOString() };
        pipelineUpdates.status = 'completed';
      }
      // If no stage specified but we have output, try to update first_frame by default for frame generations
      else if (outputUrl) {
        // Check if this file_id is actually a pipeline by querying
        const { data: existingPipeline } = await supabase
          .from('pipelines')
          .select('id, first_frame_complete')
          .eq('id', pipelineId)
          .single();
        
        if (existingPipeline && !existingPipeline.first_frame_complete) {
          pipelineUpdates.first_frame_output = { url: outputUrl, generated_at: new Date().toISOString() };
          pipelineUpdates.first_frame_complete = true;
          pipelineUpdates.status = 'draft';
          console.log('Auto-detected first_frame update for pipeline:', pipelineId);
        }
      }
    }
    
    // Handle failure
    if (status === 'failed') {
      pipelineUpdates.status = 'failed';
      pipelineUpdates.progress = 0;
    }
    
    // Only update if we have meaningful changes
    if (Object.keys(pipelineUpdates).length > 1) {
      const { error: pipelineError } = await supabase.from('pipelines').update(pipelineUpdates).eq('id', pipelineId);
      if (pipelineError) {
        console.error('Pipeline update error:', pipelineError);
      } else {
        console.log('Pipeline updated:', pipelineId, pipelineUpdates);
      }
    }
  }

  return new Response(JSON.stringify({ success: true, file_id, status }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
