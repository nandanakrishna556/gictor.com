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
    const expectedKey = Deno.env.get('N8N_WEBHOOK_SECRET')
    
    if (!expectedKey) {
      console.error('N8N_WEBHOOK_SECRET not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Unauthorized: Invalid API key')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { pipeline_id, status, stage, output_url, output_data, duration_seconds, progress } = body

    console.log('Update Pipeline Status:', { pipeline_id, status, stage, output_url, progress })

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

    // Add progress if provided
    if (typeof progress === 'number') {
      updateData.progress = progress
    }

    // Handle different stages
    if (stage === 'first_frame' || stage === 'frame' || stage === 'first') {
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
        updateData.progress = 100
      }
    } 
    else if (stage === 'last_frame' || stage === 'last') {
      if (output_url) {
        updateData.last_frame_output = { 
          url: output_url, 
          generated_at: new Date().toISOString(), 
          ...(output_data || {}) 
        }
      }
      if (status === 'completed') {
        updateData.last_frame_complete = true
        updateData.status = 'draft'
        updateData.progress = 100
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
        updateData.progress = 100
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
        updateData.progress = 100
      }
    }

    // Handle processing status
    if (status === 'processing') {
      updateData.status = 'processing'
    }

    if (status === 'failed') {
      updateData.status = 'failed'
      updateData.progress = 0
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

    // ========== SYNC LINKED FILE ROW ==========
    // When a pipeline's terminal stage finishes, the file row that represents
    // this pipeline in the project grid/kanban must also be marked completed,
    // otherwise the card stays stuck on the "Generating..." overlay even
    // though the modal already shows the finished output.
    try {
      const isTerminalStage = stage === 'lip_sync' || stage === 'final_video' || stage === 'animate'
      if (isTerminalStage && (status === 'completed' || status === 'failed')) {
        // Find the file linked to this pipeline (either via pipelines.output_file_id
        // or via files.generation_params.pipeline_id).
        let linkedFileId: string | null = (pipeline?.output_file_id as string | null) || null
        if (!linkedFileId) {
          const { data: linkedFile } = await supabase
            .from('files')
            .select('id')
            .eq('project_id', pipeline.project_id)
            .filter('generation_params->>pipeline_id', 'eq', pipeline_id)
            .maybeSingle()
          linkedFileId = linkedFile?.id ?? null
        }

        if (linkedFileId) {
          const finalUrl = output_url || (pipeline?.final_video_output as { url?: string } | null)?.url || null
          const fileUpdate: Record<string, any> = {
            updated_at: new Date().toISOString(),
          }
          if (status === 'completed') {
            fileUpdate.generation_status = 'completed'
            fileUpdate.progress = 100
            if (finalUrl) {
              fileUpdate.download_url = finalUrl
              fileUpdate.preview_url = finalUrl
            }
          } else if (status === 'failed') {
            fileUpdate.generation_status = 'failed'
          }
          const { error: fileSyncErr } = await supabase
            .from('files')
            .update(fileUpdate)
            .eq('id', linkedFileId)
          if (fileSyncErr) {
            console.error('File sync error:', fileSyncErr)
          } else {
            console.log('Synced linked file row:', linkedFileId, fileUpdate)
            // Also persist output_file_id on the pipeline if missing
            if (!pipeline?.output_file_id) {
              await supabase
                .from('pipelines')
                .update({ output_file_id: linkedFileId })
                .eq('id', pipeline_id)
            }
          }
        } else {
          console.warn('No linked file found for pipeline:', pipeline_id)
        }
      }
    } catch (syncErr) {
      console.error('File sync exception:', syncErr)
    }

    // ========== REFUND CREDITS ON FAILURE ==========
    if (status === 'failed') {
      try {
        // Prefer values echoed by n8n; otherwise fall back to values
        // we persisted on the pipeline row when the stage was triggered.
        let refundUserId = body.user_id as string | undefined
        let refundAmount = body.credits_cost as number | undefined

        if (!refundUserId || typeof refundAmount !== 'number' || refundAmount <= 0) {
          const { data: pipelineRow } = await supabase
            .from('pipelines')
            .select('user_id, last_credits_cost, last_credits_stage')
            .eq('id', pipeline_id)
            .single()
          if (pipelineRow) {
            refundUserId = refundUserId || (pipelineRow.user_id as string | undefined)
            const fallbackAmount = pipelineRow.last_credits_cost as number | null | undefined
            if ((typeof refundAmount !== 'number' || refundAmount <= 0) && typeof fallbackAmount === 'number' && fallbackAmount > 0) {
              refundAmount = fallbackAmount
            }
          }
        }

        if (refundUserId && typeof refundAmount === 'number' && refundAmount > 0) {
          const stageLabelMap: Record<string, string> = {
            first_frame: 'first frame generation',
            last_frame: 'last frame generation',
            script: 'script generation',
            voice: 'voice generation',
            speech: 'speech generation',
            animate: 'animation',
            final_video: 'final video generation',
            lip_sync: 'lip sync',
            lipsync: 'lip sync',
          };
          const rawStage = (stage || '').toString().toLowerCase().replace(/^pipeline_/, '');
          const stageLabel = stageLabelMap[rawStage] || (rawStage ? rawStage.replace(/_/g, ' ') : 'pipeline stage');
          await supabase.rpc('refund_credits', {
            p_user_id: refundUserId,
            p_amount: refundAmount,
            p_description: `Refund: ${stageLabel} failed`,
          })
          console.log('Refunded pipeline credits:', { user_id: refundUserId, amount: refundAmount })
        } else {
          console.warn('Could not refund pipeline credits: missing user_id or amount', { pipeline_id })
        }
      } catch (refundErr) {
        console.error('Pipeline refund error:', refundErr)
      }
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
