export type GenerationType = 'create_actor' | 'speech' | 'lip_sync' | 'first_frame' | 'script' | 'b_roll';

interface SpeechParams {
  characterCount: number;
}

interface LipSyncParams {
  audioDurationSeconds: number;
}

interface EstimationParams {
  type: GenerationType;
  speechParams?: SpeechParams;
  lipSyncParams?: LipSyncParams;
}

/**
 * Calculate estimated duration in seconds for a generation task
 */
export function getEstimatedDuration(params: EstimationParams): number {
  const { type, speechParams, lipSyncParams } = params;

  switch (type) {
    case 'create_actor':
      // Fixed 6 minutes for actor creation
      return 360;

    case 'speech':
      // 5 seconds per 20 characters, minimum 10 seconds
      if (!speechParams?.characterCount) return 30;
      const speechSeconds = (speechParams.characterCount / 20) * 5;
      return Math.max(10, Math.ceil(speechSeconds));

    case 'lip_sync':
      // 4 minutes per 8 seconds of audio, minimum 2 minutes
      if (!lipSyncParams?.audioDurationSeconds) return 240;
      const lipSyncSeconds = (lipSyncParams.audioDurationSeconds / 8) * 240;
      return Math.max(120, Math.ceil(lipSyncSeconds));

    case 'first_frame':
      // Image generation: ~30 seconds
      return 30;

    case 'script':
      // Script generation: ~20 seconds
      return 20;

    case 'b_roll':
      // B-roll video generation: ~2 minutes
      return 120;

    default:
      // Default fallback: 1 minute
      return 60;
  }
}

/**
 * Get a human-readable time remaining string
 */
export function getTimeRemaining(
  generationStartedAt: string,
  estimatedDurationSeconds: number
): string {
  const startTime = new Date(generationStartedAt).getTime();
  const now = Date.now();
  const elapsed = (now - startTime) / 1000;
  const remaining = Math.max(0, estimatedDurationSeconds - elapsed);

  if (remaining <= 0) {
    return 'Almost done...';
  } else if (remaining < 60) {
    return `~${Math.ceil(remaining)}s remaining`;
  } else {
    const minutes = Math.ceil(remaining / 60);
    return `~${minutes}m remaining`;
  }
}
