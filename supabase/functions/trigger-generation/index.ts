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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ============= Rate Limiting =============
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 50; // requests per window (lower for generation)
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
const PipelinePayloadSchema = z.object({
  type: z.enum([
    'pipeline_first_frame', 
    'pipeline_first_frame_b_roll', 
    'pipeline_script', 
    'pipeline_voice', 
    'pipeline_final_video'
  ]),
  payload: z.object({
    pipeline_id: z.string().uuid(),
    prompt: z.string().max(2000).optional(),
    image_type: z.enum(['ugc', 'studio']).optional(),
    aspect_ratio: z.string().optional(),
    reference_images: z.array(z.string().url()).max(5).optional(),
    is_edit: z.boolean().optional(),
    description: z.string().max(2000).optional(),
    script_type: z.string().optional(),
    duration_seconds: z.number().positive().max(1800).optional(),
    previous_script: z.string().max(10000).optional(),
    script_text: z.string().max(10000).optional(),
    voice_id: z.string().optional(),
    voice_settings: z.object({
      stability: z.number().min(0).max(1).optional(),
      similarity: z.number().min(0).max(1).optional(),
      speed: z.number().min(0.5).max(2).optional(),
    }).optional(),
    char_count: z.number().optional(),
    first_frame_url: z.string().url().optional(),
    audio_url: z.string().url().optional(),
    audio_duration_seconds: z.number().positive().max(300).optional(),
    resolution: z.string().optional(),
    pipeline_type: z.string().optional(),
    credits_cost: z.number().positive().optional(),
  }),
});

const ActorPayloadSchema = z.object({
  type: z.literal('create_actor'),
  payload: z.object({
    actor_id: z.string().uuid(),
    user_id: z.string().uuid(),
    mode: z.enum(['generate', 'upload']),
    name: z.string().max(255),
    age: z.number().optional(),
    gender: z.string().optional(),
    language: z.string().optional(),
    accent: z.string().optional(),
    dialect: z.string().optional(),
    other_instructions: z.string().max(2000).optional(),
    custom_image_url: z.string().url().optional().nullable(),
    custom_audio_url: z.string().url().optional().nullable(),
    credits_cost: z.number().positive(),
    supabase_url: z.string().url(),
  }),
});

const FilePayloadSchema = z.object({
  type: z.enum(['first_frame', 'lip_sync', 'talking_head', 'script', 'speech', 'audio', 'b_roll', 'animate', 'frame']),
  payload: z.object({
    file_id: z.string().uuid(),
    project_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    folder_id: z.string().uuid().nullable().optional(),
    file_name: z.string().max(255).optional(),
    tags: z.array(z.string()).optional(),
    credits_cost: z.number().positive(),
    prompt: z.string().max(2000).optional(),
    image_type: z.enum(['ugc', 'studio']).optional(),
    aspect_ratio: z.enum(['1:1', '9:16', '16:9']).optional(),
    reference_images: z.array(z.string().url()).max(5).optional(),
    script: z.string().max(10000).optional(),
    voice_id: z.string().optional(),
    image_url: z.string().url().optional(),
    audio_url: z.string().url().optional(),
    audio_duration: z.number().positive().max(600).optional(),
    resolution: z.enum(['480p', '720p', '1080p']).optional(),
    description: z.string().max(2000).optional(),
    script_type: z.enum(['sales', 'educational', 'entertainment', 'tutorial', 'story', 'other']).optional(),
    duration_seconds: z.number().positive().max(1800).optional(),
    // Speech-specific fields
    actor_voice_url: z.string().url().optional(),
    supabase_url: z.string().url().optional(),
    // Animate-specific fields
    first_frame_url: z.string().url().optional(),
    last_frame_url: z.string().url().optional(),
    animation_type: z.enum(['broll', 'motion_graphics']).optional(),
    // Frame-specific fields
    frame_type: z.enum(['first', 'last']).optional(),
    style: z.enum(['talking_head', 'broll', 'motion_graphics']).optional(),
    substyle: z.enum(['ugc', 'studio']).nullable().optional(),
    actor_id: z.string().uuid().nullable().optional(),
    actor_360_url: z.string().url().nullable().optional(),
    output_image_url: z.string().url().nullable().optional(),
    camera_perspective: z.enum(['1st_person', '3rd_person']).nullable().optional(),
    frame_resolution: z.enum(['1K', '2K', '4K']).optional(),
  }),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated via Supabase JWT
    const authHeader = req.headers.get('Authorization');
    const origin = req.headers.get('Origin');
    
    console.log('Auth header present:', !!authHeader);
    console.log('Origin:', origin);
    
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - missing auth header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role key to bypass RLS and validate the token
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract token from header
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token directly
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    console.log('Auth debug:', { 
      hasToken: !!token, 
      tokenPrefix: token?.substring(0, 20),
      userId: userData?.user?.id, 
      authError: authError?.message 
    });
    
    if (authError || !userData?.user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = userData.user;

    // Rate limit per user (more secure than IP)
    const { allowed, remaining } = checkRateLimit(user.id);
    if (!allowed) {
      console.warn('Rate limit exceeded for user:', user.id);
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

    const body = await req.json();
    const { type } = body;

    console.log('Received generation request:', { type, userId: user.id });

    // Validate input based on type
    // deno-lint-ignore no-explicit-any
    let validatedBody: any;
    if (type?.startsWith('pipeline_')) {
      const parseResult = PipelinePayloadSchema.safeParse(body);
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
      validatedBody = parseResult.data;
    } else if (type === 'create_actor') {
      const parseResult = ActorPayloadSchema.safeParse(body);
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
      validatedBody = parseResult.data;
    } else {
      const parseResult = FilePayloadSchema.safeParse(body);
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
      validatedBody = parseResult.data;
    }

    // Get n8n configuration (server-side secrets)
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    const n8nApiKey = Deno.env.get('N8N_API_KEY');

    if (!n8nWebhookUrl || !n8nApiKey) {
      console.error('N8N configuration missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward request to n8n with the secret API key (server-side only)
    const n8nPayload = {
      ...validatedBody,
      payload: {
        ...validatedBody.payload,
        user_id: user.id,
      }
    };

    console.log('Forwarding to n8n:', { type: validatedBody.type });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': n8nApiKey, // Server-side secret - never exposed to client
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('N8N error:', response.status, errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Generation service error',
            status: response.status 
          }),
          { 
            status: response.status >= 500 ? 502 : response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Try to parse response as JSON, handle empty/non-JSON responses
      let responseData = {};
      const responseText = await response.text();
      
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          console.log('N8N returned non-JSON response:', responseText.substring(0, 100));
          responseData = { message: 'Generation started' };
        }
      }
      
      console.log('N8N response received successfully');

      return new Response(
        JSON.stringify({ success: true, ...responseData }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(remaining),
          } 
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        console.error('N8N request timed out');
        return new Response(
          JSON.stringify({ success: false, error: 'Request timed out' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('N8N fetch error:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Network error' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
