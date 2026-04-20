import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Always return 200 with structured payload so n8n never sees a 502/non-2xx
function ok(body: Record<string, unknown> = { success: true }) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function processUpdate(body: Record<string, any>) {
  try {
    const { file_id, status, video_url, progress, error_message, user_id, credits_cost, metadata } = body;
    const pipeline_id = metadata?.pipeline_id || body.pipeline_id || file_id;

    console.log('Animate status update:', { file_id, pipeline_id, status, video_url });

    if (!file_id || !status) {
      console.error('Missing file_id or status');
      return;
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (status === 'completed') {
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

      const { error: pipelineError } = await supabase
        .from('pipelines')
        .update({
          final_video_output: { url: video_url, generated_at: new Date().toISOString() },
          status: 'completed',
          progress: 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pipeline_id);

      if (pipelineError) {
        console.error('Pipeline update error:', pipelineError);
      } else {
        console.log('Pipeline updated with video:', pipeline_id);
      }
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
        .eq('id', pipeline_id);

      if (user_id && credits_cost) {
        const cleanError = error_message ? error_message.trim().replace(/\.$/, '').toLowerCase() : '';
        const description = cleanError
          ? `Refund: animation failed (${cleanError})`
          : 'Refund: animation failed';
        await supabase.rpc('refund_credits', {
          p_user_id: user_id,
          p_amount: credits_cost,
          p_description: description,
        });
      }
    } else if (status === 'processing') {
      const updateData: Record<string, unknown> = { generation_status: 'processing' };
      if (typeof progress === 'number') updateData.progress = progress;

      await supabase.from('files').update(updateData).eq('id', file_id);

      await supabase
        .from('pipelines')
        .update({ progress: progress || 50, status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', pipeline_id);
    }
  } catch (err) {
    console.error('processUpdate error:', err);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('N8N_WEBHOOK_SECRET');

    if (!expectedKey) {
      console.error('N8N_WEBHOOK_SECRET not configured');
      return ok({ success: false, error: 'Server configuration error' });
    }

    if (!apiKey || apiKey !== expectedKey) {
      console.error('Invalid API key');
      return ok({ success: false, error: 'Unauthorized' });
    }

    const body = await req.json();

    // Run DB updates in background; respond to n8n immediately to avoid 502s
    // @ts-ignore - EdgeRuntime is provided by Supabase Deno runtime
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processUpdate(body));
    } else {
      processUpdate(body);
    }

    return ok({ success: true, queued: true });
  } catch (error) {
    console.error('Error:', error);
    return ok({ success: false, error: 'Internal error' });
  }
});
