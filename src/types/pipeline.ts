export type PipelineStage = 'first_frame' | 'script' | 'voice' | 'final_video';

export type PipelineType = 'lip_sync' | 'talking_head' | 'clips';

export type StageMode = 'generate' | 'upload' | 'paste';

export interface FirstFrameInput {
  mode: 'generate' | 'upload';
  // Generate mode
  prompt?: string;
  image_type?: 'ugc' | 'studio';
  aspect_ratio?: '1:1' | '9:16' | '16:9';
  reference_images?: string[];
  // Upload mode
  uploaded_url?: string;
}

export interface FirstFrameOutput {
  url: string;
  generated_at: string;
  generation_id?: string;
}

export interface ScriptInput {
  mode: 'generate' | 'paste';
  // Generate mode
  description?: string;
  script_type?: 'sales' | 'educational' | 'entertainment' | 'tutorial' | 'story' | 'other';
  duration_seconds?: number;
  // Paste mode
  pasted_text?: string;
}

export interface ScriptOutput {
  text: string;
  char_count: number;
  estimated_duration: number;
  generated_at?: string;
  generation_id?: string;
}

export interface VoiceInput {
  mode: 'generate' | 'upload';
  // Generate mode
  voice_id?: string;
  voice_settings?: {
    stability: number;
    similarity: number;
    speed: number;
  };
  // Upload mode
  uploaded_url?: string;
}

export interface VoiceOutput {
  url: string;
  duration_seconds: number;
  generated_at?: string;
  generation_id?: string;
}

export interface FinalVideoInput {
  resolution?: '480p' | '720p' | '1080p';
}

export interface FinalVideoOutput {
  url: string;
  duration_seconds: number;
  generated_at: string;
}

export interface Pipeline {
  id: string;
  project_id: string;
  folder_id: string | null;
  user_id: string;
  name: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  display_status: string | null; // Kanban column status
  tags: string[];
  pipeline_type: PipelineType;
  
  current_stage: PipelineStage;
  first_frame_complete: boolean;
  script_complete: boolean;
  voice_complete: boolean;
  
  first_frame_input: FirstFrameInput;
  first_frame_output: FirstFrameOutput | null;
  
  script_input: ScriptInput;
  script_output: ScriptOutput | null;
  
  voice_input: VoiceInput;
  voice_output: VoiceOutput | null;
  
  final_video_input: FinalVideoInput;
  final_video_output: FinalVideoOutput | null;
  
  output_file_id: string | null;
  
  created_at: string;
  updated_at: string;
}

// Credit costs
export const PIPELINE_CREDITS = {
  first_frame: 0.25,        // per generation/edit/regenerate
  script: 0.25,             // per generation/edit/regenerate
  voice_per_1000_chars: 0.25, // per 1000 characters
  video_per_second: 0.2,       // per second of audio
};

// Calculate voice generation cost
export function calculateVoiceCost(charCount: number): number {
  return Math.ceil(charCount / 1000) * PIPELINE_CREDITS.voice_per_1000_chars;
}

// Calculate final video cost based on audio duration
export function calculateVideoCost(audioDurationSeconds: number): number {
  return audioDurationSeconds * PIPELINE_CREDITS.video_per_second;
}
