import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key')
    const expectedKey = Deno.env.get('N8N_WEBHOOK_SECRET')
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Unauthorized request - invalid API key')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { file_id, status, preview_url, download_url, error_message, metadata, user_id, credits_cost } = await req.json()

    console.log('Received update request:', { file_id, status, user_id, credits_cost })

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

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update file record
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
    }

    console.log('Updating file with data:', updateData)

    const { error: updateError } = await supabase
      .from('files')
      .update(updateData)
      .eq('id', file_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update file', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('File updated successfully')

    // Refund credits if failed
    if (status === 'failed' && user_id && credits_cost) {
      console.log('Refunding credits:', { user_id, credits_cost })
      
      const { error: refundError } = await supabase.rpc('refund_credits', {
        p_user_id: user_id,
        p_amount: credits_cost,
        p_description: `Refund for failed generation (file: ${file_id})`
      })

      if (refundError) {
        console.error('Refund error:', refundError)
        // Don't fail the whole request, just log it
      } else {
        console.log('Credits refunded successfully')
      }
    }

    return new Response(
      JSON.stringify({ success: true, file_id, status }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
