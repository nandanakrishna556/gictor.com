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
      actor_id,
      status,
      sora_video_url,
      voice_url,
      profile_image_url,
      sora_prompt,
      error_message,
      user_id,
      credits_cost,
    } = body;

    console.log('Received actor status update:', { actor_id, status });

    if (!actor_id || !status) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: actor_id and status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (status === 'completed') {
      // Update actor with all URLs and set progress to 100
      const { error: updateError } = await supabase
        .from('actors')
        .update({
          status: 'completed',
          sora_video_url,
          voice_url,
          profile_image_url,
          sora_prompt,
          progress: 100,
          error_message: null,
        })
        .eq('id', actor_id);

      if (updateError) {
        console.error('Error updating actor:', updateError);
        throw updateError;
      }

      console.log('Actor updated successfully:', actor_id);
    } else if (status === 'failed') {
      // Update actor with error message and reset progress
      const { error: updateError } = await supabase
        .from('actors')
        .update({
          status: 'failed',
          error_message: error_message || 'Unknown error occurred',
          progress: 0,
        })
        .eq('id', actor_id);

      if (updateError) {
        console.error('Error updating actor:', updateError);
        throw updateError;
      }

      // Refund credits if user_id and credits_cost provided
      if (user_id && credits_cost) {
        const { error: refundError } = await supabase.rpc('refund_credits', {
          p_user_id: user_id,
          p_amount: credits_cost,
          p_description: `Actor creation failed: ${error_message || 'Unknown error'}`,
        });

        if (refundError) {
          console.error('Error refunding credits:', refundError);
        } else {
          console.log('Credits refunded for user:', user_id);
        }
      }

      console.log('Actor marked as failed:', actor_id);
    } else if (status === 'processing') {
      // Update progress if provided
      const { progress } = body;
      if (typeof progress === 'number') {
        const { error: updateError } = await supabase
          .from('actors')
          .update({ progress })
          .eq('id', actor_id);

        if (updateError) {
          console.error('Error updating progress:', updateError);
          throw updateError;
        }
      }
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
