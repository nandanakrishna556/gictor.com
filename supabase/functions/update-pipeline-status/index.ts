import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = req.headers.get('x-api-key')
    const expectedKey = Deno.env.get('N8N_API_KEY')
    
    if (!expectedKey || apiKey !== expectedKey) {
      console.error('Unauthorized: Invalid API key')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { pipeline_id, status, stage, output_url, output_data, duration_seconds } = body

    console.log('Update Pipeline Status:', { pipeline_id, status, stage, output_url })

    if (!pipeline_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'pipeline_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }

    // Handle different stages
    if (stage === 'first_frame' || stage === 'frame') {
      if (output_url) {
        updateData.first_frame_output = { 
          url: output_url, 
          generated_at: new Date().toISOString(), 
          ...(output_data || {}) 
        }
      }
      if (status === 'completed') {
        updateData.first_frame_complete = true
        updateData.status = 'draft'
      }
    } 
    else if (stage === 'speech' || stage === 'voice') {
      if (output_url) {
        updateData.voice_output = { 
          url: output_url, 
          duration_seconds: duration_seconds || 0,
          generated_at: new Date().toISOString(), 
          ...(output_data || {}) 
        }
      }
      if (status === 'completed') {
        updateData.voice_complete = true
        updateData.status = 'draft'
      }
    }
    else if (stage === 'lip_sync' || stage === 'final_video' || stage === 'animate') {
      if (output_url) {
        updateData.final_video_output = { 
          url: output_url, 
          duration_seconds: duration_seconds || 0,
          generated_at: new Date().toISOString(), 
          ...(output_data || {}) 
        }
      }
      if (status === 'completed') {
        updateData.status = 'completed'
      }
    }

    if (status === 'failed') {
      updateData.status = 'failed'
    }

    const { data: pipeline, error: updateError } = await supabase
      .from('pipelines')
      .update(updateData)
      .eq('id', pipeline_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Pipeline updated successfully:', pipeline_id)

    return new Response(
      JSON.stringify({ success: true, pipeline }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
