import { supabase } from '@/integrations/supabase/client';
import { 
  PIPELINE_CREDITS, 
  calculateVoiceCost, 
  calculateVideoCost 
} from '@/types/pipeline';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY || '';

export type PipelineGenerationType = 
  | 'pipeline_first_frame' 
  | 'pipeline_script' 
  | 'pipeline_voice' 
  | 'pipeline_final_video';

interface GenerationResult {
  success: boolean;
  error?: string;
}

// Deduct credits and call n8n
async function executeGeneration(
  type: PipelineGenerationType,
  payload: Record<string, unknown>,
  creditsCost: number
): Promise<GenerationResult> {
  try {
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Check credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.credits || 0) < creditsCost) {
      return { success: false, error: 'Insufficient credits' };
    }

    // Deduct credits
    await supabase
      .from('profiles')
      .update({ credits: (profile.credits || 0) - creditsCost })
      .eq('id', user.id);

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: -creditsCost,
      transaction_type: 'usage',
      description: `Pipeline ${type.replace('pipeline_', '')} generation`
    });

    // Call n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_API_KEY,
      },
      body: JSON.stringify({ 
        type, 
        payload: {
          ...payload,
          user_id: user.id,
          credits_cost: creditsCost,
        }
      }),
    });

    if (!response.ok) {
      // Refund on failure
      await refundCredits(user.id, creditsCost, type);
      return { success: false, error: 'Generation service error' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

// Refund helper
async function refundCredits(userId: string, amount: number, type: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({ credits: (profile.credits || 0) + amount })
      .eq('id', userId);

    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: amount,
      transaction_type: 'refund',
      description: `Refund for failed ${type} generation`
    });
  }
}

// Generate First Frame
export async function generateFirstFrame(
  pipelineId: string,
  input: {
    prompt: string;
    image_type: 'ugc' | 'studio';
    aspect_ratio: string;
    reference_images?: string[];
  },
  isEdit: boolean = false,
  previousImageUrl?: string
): Promise<GenerationResult> {
  const referenceImages = isEdit && previousImageUrl 
    ? [previousImageUrl, ...(input.reference_images || [])]
    : (input.reference_images || []);

  return executeGeneration('pipeline_first_frame', {
    pipeline_id: pipelineId,
    prompt: input.prompt,
    image_type: input.image_type,
    aspect_ratio: input.aspect_ratio,
    reference_images: referenceImages,
    is_edit: isEdit,
  }, PIPELINE_CREDITS.first_frame);
}

// Generate Script
export async function generateScript(
  pipelineId: string,
  input: {
    description: string;
    script_type: string;
    duration_seconds: number;
  },
  isEdit: boolean = false,
  previousScript?: string
): Promise<GenerationResult> {
  return executeGeneration('pipeline_script', {
    pipeline_id: pipelineId,
    description: input.description,
    script_type: input.script_type,
    duration_seconds: input.duration_seconds,
    previous_script: isEdit ? previousScript : undefined,
    is_edit: isEdit,
  }, PIPELINE_CREDITS.script);
}

// Generate Voice
export async function generateVoice(
  pipelineId: string,
  input: {
    script_text: string;
    voice_id: string;
    voice_settings?: {
      stability: number;
      similarity: number;
      speed: number;
    };
  }
): Promise<GenerationResult> {
  const charCount = input.script_text.length;
  const cost = calculateVoiceCost(charCount);

  return executeGeneration('pipeline_voice', {
    pipeline_id: pipelineId,
    script_text: input.script_text,
    voice_id: input.voice_id,
    voice_settings: input.voice_settings,
    char_count: charCount,
  }, cost);
}

// Generate Final Video
export async function generateFinalVideo(
  pipelineId: string,
  input: {
    first_frame_url: string;
    audio_url: string;
    audio_duration_seconds: number;
    resolution?: string;
  }
): Promise<GenerationResult> {
  const cost = calculateVideoCost(input.audio_duration_seconds);

  return executeGeneration('pipeline_final_video', {
    pipeline_id: pipelineId,
    first_frame_url: input.first_frame_url,
    audio_url: input.audio_url,
    audio_duration_seconds: input.audio_duration_seconds,
    resolution: input.resolution || '720p',
  }, cost);
}

// Get audio duration from URL (client-side)
export function getAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', () => {
      reject(new Error('Failed to load audio'));
    });
    audio.src = audioUrl;
  });
}
