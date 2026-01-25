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
    // Verify API key
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
    const {
      pipeline_id,
      stage,
      status,
      output_url,
      duration_seconds,
      error_message,
      user_id,
      credits_cost,
    } = body;

    console.log('Received pipeline status update:', { pipeline_id, stage, status });

    if (!pipeline_id || !stage || !status) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: pipeline_id, stage, and status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build update object based on stage
    const updateData: Record<string, unknown> = {};
    
    if (status === 'completed') {
      // Update the appropriate stage output based on stage type
      switch (stage) {
        case 'first_frame':
          updateData.first_frame_output = {
            url: output_url,
            generated_at: new Date().toISOString(),
          };
          updateData.first_frame_complete = true;
          break;
          
        case 'script':
          updateData.script_output = {
            text: body.script_text || '',
            generated_at: new Date().toISOString(),
          };
          updateData.script_complete = true;
          break;
          
        case 'voice':
        case 'speech':
          updateData.voice_output = {
            url: output_url,
            duration_seconds: duration_seconds || null,
            generated_at: new Date().toISOString(),
          };
          updateData.voice_complete = true;
          break;
          
        case 'final_video':
          updateData.final_video_output = {
            url: output_url,
            duration_seconds: duration_seconds || null,
            generated_at: new Date().toISOString(),
          };
          break;
          
        default:
          console.warn('Unknown stage:', stage);
      }
      
      // Reset pipeline status to draft (no longer processing)
      updateData.status = 'draft';
      
    } else if (status === 'failed') {
      // Reset pipeline status and don't mark stage as complete
      updateData.status = 'draft';
      
      // Refund credits if user_id and credits_cost provided
      if (user_id && credits_cost) {
        const { error: refundError } = await supabase.rpc('refund_credits', {
          p_user_id: user_id,
          p_amount: credits_cost,
          p_description: `Pipeline ${stage} generation failed: ${error_message || 'Unknown error'}`,
        });

        if (refundError) {
          console.error('Error refunding credits:', refundError);
        } else {
          console.log('Credits refunded for user:', user_id);
        }
      }
      
    } else if (status === 'processing') {
      updateData.status = 'processing';
    }

    // Update the pipeline
    const { error: updateError } = await supabase
      .from('pipelines')
      .update(updateData)
      .eq('id', pipeline_id);

    if (updateError) {
      console.error('Error updating pipeline:', updateError);
      throw updateError;
    }

    console.log('Pipeline updated successfully:', { pipeline_id, stage, status });

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
