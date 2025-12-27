import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = req.headers.get('x-api-key')
    const expectedKey = Deno.env.get('N8N_WEBHOOK_SECRET')
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Unauthorized request - invalid API key')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { type } = body

    console.log('Received update request:', { type, ...body })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle pipeline stage updates
    if (type?.startsWith('pipeline_')) {
      return handlePipelineUpdate(supabase, body, corsHeaders)
    }

    // Handle regular file updates (existing logic)
    return handleFileUpdate(supabase, body, corsHeaders)

  } catch (error) {
    console.error('Edge function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handlePipelineUpdate(supabase: any, body: any, corsHeaders: any) {
  const { type, pipeline_id, status, output, error_message, user_id, credits_cost } = body

  if (!pipeline_id) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing pipeline_id' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('Processing pipeline update:', { type, pipeline_id, status })

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }

  // Determine which stage to update
  switch (type) {
    case 'pipeline_first_frame':
      if (status === 'completed' && output) {
        updates.first_frame_output = output
        updates.first_frame_complete = true
      } else if (status === 'failed') {
        updates.first_frame_output = null
        if (user_id && credits_cost) {
          await refundCredits(supabase, user_id, credits_cost, 'first_frame', pipeline_id)
        }
      }
      break

    case 'pipeline_script':
      if (status === 'completed' && output) {
        updates.script_output = output
        updates.script_complete = true
      } else if (status === 'failed') {
        updates.script_output = null
        if (user_id && credits_cost) {
          await refundCredits(supabase, user_id, credits_cost, 'script', pipeline_id)
        }
      }
      break

    case 'pipeline_voice':
      if (status === 'completed' && output) {
        updates.voice_output = output
        updates.voice_complete = true
      } else if (status === 'failed') {
        updates.voice_output = null
        if (user_id && credits_cost) {
          await refundCredits(supabase, user_id, credits_cost, 'voice', pipeline_id)
        }
      }
      break

    case 'pipeline_final_video':
      if (status === 'completed' && output) {
        updates.final_video_output = output
        updates.status = 'completed'
        
        // Create a file record for the final output
        const { data: pipeline } = await supabase
          .from('pipelines')
          .select('project_id, folder_id, name, tags')
          .eq('id', pipeline_id)
          .single()

        if (pipeline) {
          const { data: file } = await supabase
            .from('files')
            .insert({
              project_id: pipeline.project_id,
              folder_id: pipeline.folder_id,
              name: pipeline.name,
              file_type: 'talking_head',
              status: 'completed',
              tags: pipeline.tags,
              preview_url: output.url,
              download_url: output.url,
              metadata: { pipeline_id, duration: output.duration_seconds },
              progress: 100,
            })
            .select()
            .single()

          if (file) {
            updates.output_file_id = file.id
            console.log('Created file record:', file.id)
          }
        }
      } else if (status === 'failed') {
        updates.status = 'failed'
        if (user_id && credits_cost) {
          await refundCredits(supabase, user_id, credits_cost, 'final_video', pipeline_id)
        }
      }
      break

    default:
      console.error('Unknown pipeline type:', type)
      return new Response(
        JSON.stringify({ success: false, error: 'Unknown pipeline type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
  }

  const { error } = await supabase
    .from('pipelines')
    .update(updates)
    .eq('id', pipeline_id)

  if (error) {
    console.error('Pipeline update error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('Pipeline updated successfully:', pipeline_id)

  return new Response(
    JSON.stringify({ success: true, pipeline_id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleFileUpdate(supabase: any, body: any, corsHeaders: any) {
  const { file_id, status, preview_url, download_url, error_message, metadata, user_id, credits_cost } = body

  if (!file_id || !status) {
    console.error('Missing required fields:', { file_id, status })
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields: file_id, status' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Validate status value
  if (!['completed', 'failed', 'processing'].includes(status)) {
    console.error('Invalid status value:', status)
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid status. Must be: completed, failed, or processing' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'completed') {
    if (preview_url) updateData.preview_url = preview_url
    if (download_url) updateData.download_url = download_url
    updateData.metadata = metadata || {}
    updateData.error_message = null
    updateData.progress = 100
  } else if (status === 'failed') {
    updateData.error_message = error_message || 'Generation failed'
    updateData.preview_url = null
    updateData.download_url = null
    updateData.metadata = metadata || {}
    updateData.progress = 0
    
    if (user_id && credits_cost) {
      await refundCredits(supabase, user_id, credits_cost, 'file', file_id)
    }
  }

  console.log('Updating file with data:', updateData)

  const { error } = await supabase
    .from('files')
    .update(updateData)
    .eq('id', file_id)

  if (error) {
    console.error('Update error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to update file', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  console.log('File updated successfully:', file_id)

  return new Response(
    JSON.stringify({ success: true, file_id, status }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function refundCredits(supabase: any, userId: string, amount: number, type: string, referenceId: string) {
  try {
    console.log('Refunding credits:', { userId, amount, type, referenceId })
    
    const { error: refundError } = await supabase.rpc('refund_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_description: `Refund for failed ${type} generation (${referenceId})`
    })

    if (refundError) {
      console.error('Refund error:', refundError)
    } else {
      console.log('Credits refunded successfully')
    }
  } catch (error) {
    console.error('Refund error:', error)
  }
}
