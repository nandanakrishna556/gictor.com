import type { File } from '@/hooks/useFiles';

export interface PipelineThumbnailData {
  firstFrameUrl?: string;
  lastFrameUrl?: string;
  /** Live pipeline status (draft / processing / completed / failed). */
  status?: string | null;
  /** Stage currently being generated (first_frame / last_frame / voice / speech / final_video / ...). */
  currentStage?: string | null;
  /** Pipeline kind (talking_head / clips / lip_sync / ...). */
  pipelineType?: string | null;
  generationStartedAt?: string | null;
  estimatedDurationSeconds?: number | null;
}

/**
 * Human-friendly "Generating ..." label for an in-flight pipeline stage,
 * shown on file cards in the grid / kanban view while any stage of the
 * underlying multi-stage pipeline is running.
 *
 * NOTE: For B-Roll / Clips pipelines, the stages are remapped onto shared
 * DB columns:
 *   - DB `script`       → UI "Last Frame"
 *   - DB `voice`        → UI "Animate"
 *   - DB `final_video`  → UI "Animate" (final render)
 * Talking Head pipelines use the natural mapping.
 */
export function getPipelineStageGeneratingLabel(
  pipelineType?: string | null,
  currentStage?: string | null
): string {
  const isClips = pipelineType === 'clips' || pipelineType === 'b_roll';

  if (isClips) {
    switch (currentStage) {
      case 'first_frame':
        return 'Generating first frame...';
      case 'last_frame':
      case 'script': // DB alias for Last Frame in B-Roll
        return 'Generating last frame...';
      case 'animate':
      case 'voice': // DB alias for Animate in B-Roll
      case 'final_video':
        return 'Generating Clips...';
      default:
        return 'Generating...';
    }
  }

  // Talking Head / Lip Sync / generic
  switch (currentStage) {
    case 'first_frame':
      return 'Generating first frame...';
    case 'last_frame':
      return 'Generating last frame...';
    case 'voice':
    case 'speech':
      return 'Generating speech...';
    case 'script':
      return 'Writing script...';
    case 'animate':
      return 'Generating animation...';
    case 'lip_sync':
    case 'final_video':
      if (pipelineType === 'talking_head' || pipelineType === 'lip_sync') return 'Generating lip sync...';
      return 'Generating video...';
    default:
      return 'Generating...';
  }
}

/**
 * Resolve any in-flight pipeline info for a file via its generation_params.pipeline_id.
 * Returns null when the file isn't linked to a pipeline or the pipeline isn't processing.
 */
export function getFilePipelineGenerationInfo(
  file: File,
  pipelineThumbnails?: Map<string, PipelineThumbnailData>
): {
  isProcessing: boolean;
  label: string;
  generationStartedAt: string | null;
  estimatedDurationSeconds: number | null;
} | null {
  if (!pipelineThumbnails) return null;
  // Defensive: if the file already has a finished output, never show a generating overlay,
  // even if the linked pipeline row hasn't flipped to completed yet.
  if (file.download_url || file.preview_url) return null;
  if (file.generation_status === 'completed' || file.generation_status === 'failed') return null;
  const genParams = file.generation_params as Record<string, unknown> | null;
  const pipelineId = (genParams?.pipeline_id as string) || null;
  if (!pipelineId) return null;
  const data = pipelineThumbnails.get(pipelineId);
  if (!data || data.status !== 'processing') return null;
  return {
    isProcessing: true,
    label: getPipelineStageGeneratingLabel(data.pipelineType, data.currentStage),
    generationStartedAt: data.generationStartedAt ?? null,
    estimatedDurationSeconds: data.estimatedDurationSeconds ?? null,
  };
}

// File types whose preview/download_url is a video and can serve as a thumbnail
const VIDEO_FILE_TYPES = new Set([
  'lip_sync',
  'talking_head',
  'clips',
  'b_roll',
  'animate',
  'seedance',
  'veo3',
  'motion_graphics',
]);

/**
 * Returns the playable video URL for a completed file, if applicable.
 * Used to render a <video> element as a thumbnail (frame at t=0.1).
 */
export function getFileVideoUrl(file: File): string | null {
  if (!VIDEO_FILE_TYPES.has(file.file_type)) return null;
  return file.download_url || file.preview_url || null;
}

/**
 * Compute the thumbnail image URL for a file card based on file type.
 * 
 * Rules:
 * - lip_sync / talking_head → first frame image
 * - frame / first_frame → the image itself (preview_url)
 * - animate → last frame image
 * - b_roll / clips → last frame image
 * - speech / script → null (use flat icon)
 */
export function getFileThumbnailUrl(
  file: File,
  pipelineThumbnails?: Map<string, PipelineThumbnailData>
): string | null {
  const genParams = file.generation_params as Record<string, unknown> | null;
  const pipelineId = (genParams?.pipeline_id as string) || null;
  const pipelineData = pipelineId ? pipelineThumbnails?.get(pipelineId) : undefined;

  switch (file.file_type) {
    case 'lip_sync':
    case 'talking_head':
      // First frame image: check gen_params first, then pipeline
      return (
        (genParams?.image_url as string) ||
        (genParams?.first_frame_url as string) ||
        pipelineData?.firstFrameUrl ||
        null
      );

    case 'frame':
    case 'first_frame':
      // The image itself
      return file.preview_url || file.download_url || null;

    case 'animate':
      // Prefer last frame, fallback to first frame
      return (
        (genParams?.last_frame_url as string) ||
        pipelineData?.lastFrameUrl ||
        (genParams?.first_frame_url as string) ||
        pipelineData?.firstFrameUrl ||
        null
      );

    case 'b_roll':
    case 'clips':
      // Last frame from pipeline, fallback to first frame
      return (
        pipelineData?.lastFrameUrl ||
        pipelineData?.firstFrameUrl ||
        (genParams?.last_frame_url as string) ||
        (genParams?.first_frame_url as string) ||
        null
      );

    case 'seedance':
      return (
        (genParams?.last_frame_url as string) ||
        (genParams?.first_frame_url as string) ||
        null
      );

    // speech, script, and others → flat icon
    default:
      return null;
  }
}
