import { supabase } from '@/integrations/supabase/client';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY || '';

export type GenerationType = 'first_frame' | 'talking_head' | 'script';

// Error types for better user messaging
export type GenerationErrorType = 
  | 'network_error'
  | 'auth_error'
  | 'insufficient_credits'
  | 'service_unavailable'
  | 'validation_error'
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

type GenerationPayload = FirstFramePayload | TalkingHeadPayload | ScriptPayload;

export const CREDIT_COSTS = {
  first_frame: 0.25,
  talking_head: 1.0,
  script: 0.5,
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
  // Validate webhook URL is configured
  if (!N8N_WEBHOOK_URL) {
    console.error('N8N_WEBHOOK_URL is not configured');
    return {
      success: false,
      error: {
        type: 'service_unavailable',
        message: 'Webhook URL not configured',
        userMessage: getErrorMessage('service_unavailable'),
      },
    };
  }

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

    // Deduct credits
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

    // Get current credits and deduct
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Clean up file record
      await supabase.from('files').delete().eq('id', payload.file_id);
      return {
        success: false,
        error: {
          type: 'auth_error',
          message: 'Failed to fetch user profile',
          userMessage: 'Unable to verify your credits. Please try again.',
        },
      };
    }

    if ((profile.credits || 0) < payload.credits_cost) {
      // Clean up file record
      await supabase.from('files').delete().eq('id', payload.file_id);
      return {
        success: false,
        error: {
          type: 'insufficient_credits',
          message: 'Not enough credits',
          userMessage: getErrorMessage('insufficient_credits'),
        },
      };
    }

    // Deduct credits
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

    // Send to n8n webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': N8N_API_KEY,
        },
        body: JSON.stringify({ type, payload }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const statusCode = response.status;
        let errorType: GenerationErrorType = 'service_unavailable';
        let errorMessage = 'Generation service returned an error';

        if (statusCode === 401 || statusCode === 403) {
          errorType = 'auth_error';
          errorMessage = 'Authentication with generation service failed';
        } else if (statusCode === 400 || statusCode === 422) {
          errorType = 'validation_error';
          errorMessage = 'Invalid generation request';
        } else if (statusCode >= 500) {
          errorType = 'service_unavailable';
          errorMessage = 'Generation service is temporarily unavailable';
        }

        // Update file status to failed
        await supabase.from('files').update({
          status: 'failed',
          error_message: errorMessage,
        }).eq('id', payload.file_id);

        // Refund credits
        await refundCredits(user.id, payload.credits_cost, type);

        return {
          success: false,
          error: {
            type: errorType,
            message: errorMessage,
            userMessage: getErrorMessage(errorType),
          },
        };
      }

      return { success: true, file_id: payload.file_id };
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Determine error type
      const isAbortError = fetchError instanceof DOMException && fetchError.name === 'AbortError';
      const isNetworkError = fetchError instanceof TypeError;

      // Update file status to failed
      await supabase.from('files').update({
        status: 'failed',
        error_message: isAbortError ? 'Request timed out' : 'Network error',
      }).eq('id', payload.file_id);

      // Refund credits
      await refundCredits(user.id, payload.credits_cost, type);

      return {
        success: false,
        error: {
          type: isAbortError ? 'service_unavailable' : 'network_error',
          message: isAbortError ? 'Request timed out' : 'Network error',
          userMessage: isAbortError
            ? 'The request timed out. Please try again.'
            : getErrorMessage('network_error'),
        },
      };
    }
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

// Helper function to refund credits
async function refundCredits(userId: string, amount: number, type: GenerationType) {
  try {
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

      await supabase.from('credit_transactions').insert([{
        user_id: userId,
        amount: amount,
        transaction_type: 'refund',
        description: `Refund for failed ${type} generation`
      }]);
    }
  } catch (error) {
    console.error('Failed to refund credits:', error);
  }
}
