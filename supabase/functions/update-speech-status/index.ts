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
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Invalid or missing API key');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { file_id, pipeline_id, status, audio_url, audio_duration, error_message, user_id, credits_cost, progress } = body;

    console.log('Received speech status update:', { file_id, pipeline_id, status });

    if (!file_id || !status) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: file_id and status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (status === 'completed') {
      const { error: updateError } = await supabase
        .from('files')
        .update({
          generation_status: 'completed',
          download_url: audio_url,
          preview_url: audio_url,
          progress: 100,
          error_message: null,
        })
        .eq('id', file_id);

      if (updateError) {
        console.error('Error updating file:', updateError);
        throw updateError;
      }

      // ALSO UPDATE PIPELINE if pipeline_id provided
      if (pipeline_id) {
        console.log('Updating pipeline voice output:', pipeline_id);
        const { error: pipelineError } = await supabase
          .from('pipelines')
          .update({
            voice_output: { 
              url: audio_url, 
              duration_seconds: audio_duration || 0,
              generated_at: new Date().toISOString() 
            },
            voice_complete: true,
            status: 'draft',
            progress: 100,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pipeline_id);

        if (pipelineError) {
          console.error('Pipeline update error:', pipelineError);
        } else {
          console.log('Pipeline updated successfully:', pipeline_id);
        }
      }

      console.log('Speech completed:', file_id);
    } else if (status === 'failed') {
      const { error: updateError } = await supabase
        .from('files')
        .update({
          generation_status: 'failed',
          error_message: error_message || 'Speech generation failed',
          progress: 0,
        })
        .eq('id', file_id);

      if (updateError) throw updateError;

      if (user_id && credits_cost) {
        await supabase.rpc('refund_credits', {
          p_user_id: user_id,
          p_amount: credits_cost,
          p_description: `Speech generation failed: ${error_message || 'Unknown error'}`,
        });
      }

      console.log('Speech failed:', file_id);
    } else if (status === 'processing') {
      const updateData: any = { generation_status: 'processing' };
      if (typeof progress === 'number') updateData.progress = progress;
      
      await supabase.from('files').update(updateData).eq('id', file_id);
      console.log('Speech processing:', file_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
