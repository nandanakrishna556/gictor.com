import { supabase } from '@/integrations/supabase/client';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY || '';

export type GenerationType = 'first_frame' | 'talking_head' | 'script';

interface BasePayload {
  file_id: string;
  user_id: string;
  project_id: string;
  folder_id?: string;
  file_name: string;
  tags?: string[];
  credits_cost: number;
}

interface FirstFramePayload extends BasePayload {
  prompt: string;
  image_type: 'ugc' | 'studio';
  aspect_ratio: '1:1' | '9:16' | '16:9';
  reference_images?: string[];
}

interface TalkingHeadPayload extends BasePayload {
  script: string;
  voice_id: string;
  image_url: string;
  resolution?: '480p' | '720p' | '1080p';
}

interface ScriptPayload extends BasePayload {
  description: string;
  script_type: 'sales' | 'educational' | 'entertainment' | 'tutorial' | 'story' | 'other';
  duration_seconds: number;
}

type GenerationPayload = FirstFramePayload | TalkingHeadPayload | ScriptPayload;

export const CREDIT_COSTS = {
  first_frame: 0.25,
  talking_head: 1.0,
  script: 0.5,
};

export async function startGeneration(
  type: GenerationType,
  payload: GenerationPayload
): Promise<{ success: boolean; file_id?: string; error?: string }> {
  try {
    // Create file record in database
    const { error: dbError } = await supabase.from('files').insert([{
      id: payload.file_id,
      name: payload.file_name,
      file_type: type,
      status: 'processing',
      project_id: payload.project_id,
      folder_id: payload.folder_id || null,
      tags: payload.tags || [],
      metadata: {} as any,
      generation_params: payload as any,
    }]);

    if (dbError) {
      console.error('Failed to create file record:', dbError);
      return { success: false, error: 'Failed to start generation' };
    }

    // Deduct credits using direct update (deduct_credits function may not be in types yet)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Get current credits and deduct
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({ credits: (profile.credits || 0) - payload.credits_cost })
          .eq('id', user.id);
        
        // Log transaction
        await supabase.from('credit_transactions').insert([{
          user_id: user.id,
          amount: -payload.credits_cost,
          transaction_type: 'usage',
          description: `${type} generation`
        }]);
      }
    }

    // Send to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_API_KEY,
      },
      body: JSON.stringify({ type, payload }),
    });

    if (!response.ok) {
      // Update file status to failed
      await supabase.from('files').update({
        status: 'failed',
        error_message: 'Failed to connect to generation service',
      }).eq('id', payload.file_id);
      return { success: false, error: 'Failed to connect to generation service' };
    }

    return { success: true, file_id: payload.file_id };
  } catch (error) {
    console.error('Generation error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
