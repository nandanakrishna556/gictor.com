import { supabase } from '@/integrations/supabase/client';

export type GenerationType = 'first_frame' | 'lip_sync' | 'script' | 'speech' | 'b_roll';

// Error types for better user messaging
export type GenerationErrorType = 
  | 'network_error'
  | 'auth_error'
  | 'insufficient_credits'
  | 'service_unavailable'
  | 'validation_error'
  | 'rate_limit_exceeded'
  | 'unknown_error';

export interface GenerationError {
  type: GenerationErrorType;
  message: string;
  userMessage: string;
}

const getErrorMessage = (type: GenerationErrorType): string => {
  switch (type) {
    case 'network_error':
      return 'Unable to connect to the generation service. Please check your internet connection and try again.';
    case 'auth_error':
      return 'Authentication failed. Please log in again.';
    case 'insufficient_credits':
      return 'Insufficient credits. Please purchase more credits to continue.';
    case 'service_unavailable':
      return 'The generation service is temporarily unavailable. Please try again in a few minutes.';
    case 'validation_error':
      return 'Invalid request. Please check your inputs and try again.';
    case 'rate_limit_exceeded':
      return 'Too many requests. Please wait a moment and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

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

interface TalkingHeadQuickPayload extends BasePayload {
  image_url: string;
  audio_url: string;
  audio_duration: number;
}

type GenerationPayload = FirstFramePayload | TalkingHeadPayload | ScriptPayload | TalkingHeadQuickPayload;

export const CREDIT_COSTS = {
  first_frame: 0.1,
  lip_sync_per_second: 0.15,
  speech_per_1000_chars: 0.25,
  script: 0.25,
  frame: 0.1, // base cost for 1K/2K
  frame_4k: 0.15, // 4K resolution
  animate_per_second: 0.15,
};

export const getFrameCreditCost = (resolution: '1K' | '2K' | '4K'): number => {
  return resolution === '4K' ? 0.15 : 0.1;
};

export interface GenerationResult {
  success: boolean;
  file_id?: string;
  error?: GenerationError;
}

export async function startGeneration(
  type: GenerationType,
  payload: GenerationPayload
): Promise<GenerationResult> {
  try {
    // Create file record in database first
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
      return {
        success: false,
        error: {
          type: 'validation_error',
          message: dbError.message,
          userMessage: 'Failed to create file record. Please try again.',
        },
      };
    }

    // Get user for auth check only (credits handled server-side now)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Clean up file record
      await supabase.from('files').delete().eq('id', payload.file_id);
      return {
        success: false,
        error: {
          type: 'auth_error',
          message: 'User not authenticated',
          userMessage: getErrorMessage('auth_error'),
        },
      };
    }

    // SECURITY: Credits are now checked and deducted server-side in trigger-generation edge function
    // This prevents client-side manipulation of credit costs
    
    // Call secure edge function (handles credit deduction + n8n API key server-side)
    const { data, error: invokeError } = await supabase.functions.invoke('trigger-generation', {
      body: { type, payload },
    });

    if (invokeError) {
      console.error('Edge function error:', invokeError);
      
      // Determine error type
      let errorType: GenerationErrorType = 'service_unavailable';
      if (invokeError.message?.includes('rate limit')) {
        errorType = 'rate_limit_exceeded';
      } else if (invokeError.message?.includes('Unauthorized')) {
        errorType = 'auth_error';
      } else if (invokeError.message?.includes('Insufficient credits') || invokeError.message?.includes('402')) {
        errorType = 'insufficient_credits';
      }

      // Update file status to failed
      await supabase.from('files').update({
        status: 'failed',
        error_message: invokeError.message,
      }).eq('id', payload.file_id);

      // Note: Refunds are handled server-side in edge function

      return {
        success: false,
        error: {
          type: errorType,
          message: invokeError.message,
          userMessage: getErrorMessage(errorType),
        },
      };
    }

    if (!data?.success) {
      // Check for insufficient credits error from server
      const isInsufficientCredits = data?.error === 'Insufficient credits';
      
      // Update file status to failed
      await supabase.from('files').update({
        status: 'failed',
        error_message: data?.error || 'Generation failed',
      }).eq('id', payload.file_id);

      // Note: Refunds are handled server-side in edge function

      return {
        success: false,
        error: {
          type: isInsufficientCredits ? 'insufficient_credits' : 'service_unavailable',
          message: data?.error || 'Generation failed',
          userMessage: isInsufficientCredits 
            ? getErrorMessage('insufficient_credits') 
            : getErrorMessage('service_unavailable'),
        },
      };
    }

    return { success: true, file_id: payload.file_id };
  } catch (error) {
    console.error('Generation error:', error);
    return {
      success: false,
      error: {
        type: 'unknown_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        userMessage: getErrorMessage('unknown_error'),
      },
    };
  }
}
