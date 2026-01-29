import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('N8N_WEBHOOK_SECRET');
    const N8N_API_KEY = 'gictor-n8n-secret-2024';
    
    if (!apiKey || (apiKey !== expectedKey && apiKey !== N8N_API_KEY)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { file_id, status, video_url, progress, error_message, user_id, credits_cost } = body;

    console.log('Animate status update:', { file_id, status, video_url });

    if (!file_id || !status) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing file_id or status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (status === 'completed') {
      // Update files table
      await supabase
        .from('files')
        .update({
          generation_status: 'completed',
          download_url: video_url,
          preview_url: video_url,
          progress: 100,
          error_message: null,
        })
        .eq('id', file_id);

      // ALSO update pipelines table - THIS IS THE FIX
      await supabase
        .from('pipelines')
        .update({
          final_video_output: { url: video_url, generated_at: new Date().toISOString() },
          status: 'completed',
          progress: 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', file_id);

      console.log('Animate completed, pipeline updated:', file_id);
    } else if (status === 'failed') {
      await supabase
        .from('files')
        .update({
          generation_status: 'failed',
          error_message: error_message || 'Animation failed',
          progress: 0,
        })
        .eq('id', file_id);

      await supabase
        .from('pipelines')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', file_id);

      if (user_id && credits_cost) {
        await supabase.rpc('refund_credits', {
          p_user_id: user_id,
          p_amount: credits_cost,
          p_description: `Animation failed: ${error_message || 'Unknown error'}`,
        });
      }
    } else if (status === 'processing') {
      const updateData: Record<string, unknown> = { generation_status: 'processing' };
      if (typeof progress === 'number') updateData.progress = progress;
      
      await supabase.from('files').update(updateData).eq('id', file_id);
      await supabase
        .from('pipelines')
        .update({ progress: progress || 50, status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', file_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
