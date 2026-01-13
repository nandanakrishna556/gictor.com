import { supabase } from '@/integrations/supabase/client';
import { 
  PIPELINE_CREDITS, 
  calculateVoiceCost, 
  calculateVideoCost 
} from '@/types/pipeline';
import { getEstimatedDuration } from '@/utils/generationEstimates';

export type PipelineGenerationType = 
  | 'pipeline_first_frame' 
  | 'pipeline_first_frame_b_roll'
  | 'pipeline_script' 
  | 'pipeline_voice' 
  | 'pipeline_final_video';

interface GenerationResult {
  success: boolean;
  error?: string;
}

// Call edge function which handles credit deduction and n8n proxy securely
// SECURITY: All credit operations are now handled server-side to prevent manipulation
async function executeGeneration(
  type: PipelineGenerationType,
  payload: Record<string, unknown>,
  _creditsCost: number // Kept for backwards compatibility but not used (server calculates)
): Promise<GenerationResult> {
  try {
    // Get user for auth check only
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // SECURITY: Credits are now checked and deducted server-side in trigger-generation edge function
    // This prevents client-side manipulation of credit costs

    // Call secure edge function (handles credit deduction + n8n API key server-side)
    const { data, error } = await supabase.functions.invoke('trigger-generation', {
      body: { 
        type, 
        payload,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      // Refunds are handled server-side in edge function
      return { success: false, error: error.message || 'Generation service error' };
    }

    if (!data?.success) {
      // Refunds are handled server-side in edge function
      return { success: false, error: data?.error || 'Generation failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Generation error:', error);
    return { success: false, error: 'Network error' };
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

// Generate B-Roll First Frame (differentiated from Talking Head)
export async function generateBRollFirstFrame(
  pipelineId: string,
  input: {
    prompt: string;
    aspect_ratio: string;
    reference_images?: string[];
  },
  isEdit: boolean = false,
  previousImageUrl?: string
): Promise<GenerationResult> {
  const referenceImages = isEdit && previousImageUrl 
    ? [previousImageUrl, ...(input.reference_images || [])]
    : (input.reference_images || []);

  return executeGeneration('pipeline_first_frame_b_roll', {
    pipeline_id: pipelineId,
    prompt: input.prompt,
    aspect_ratio: input.aspect_ratio,
    reference_images: referenceImages,
    is_edit: isEdit,
    pipeline_type: 'clips',
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
