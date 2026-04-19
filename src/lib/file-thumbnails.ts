import type { File } from '@/hooks/useFiles';

export interface PipelineThumbnailData {
  firstFrameUrl?: string;
  lastFrameUrl?: string;
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

    // speech, script, and others → flat icon
    default:
      return null;
  }
}
