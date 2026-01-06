import { useState, useEffect } from 'react';

interface GenerationProgressOptions {
  status: string;
  generationStartedAt: string | null;
  estimatedDurationSeconds: number | null;
}

export function useGenerationProgress({
  status,
  generationStartedAt,
  estimatedDurationSeconds,
}: GenerationProgressOptions) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If completed, return 100%
    if (status === 'completed') {
      setProgress(100);
      return;
    }
    
    // If not processing or missing data, return 0
    if (status !== 'processing' || !generationStartedAt || !estimatedDurationSeconds) {
      setProgress(0);
      return;
    }

    const startTime = new Date(generationStartedAt).getTime();
    const duration = estimatedDurationSeconds * 1000; // Convert to ms

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const rawProgress = (elapsed / duration) * 100;

      // Smart progress curve:
      // - Progress normally up to 85%
      // - Slow down significantly from 85-95%
      // - Crawl from 95-99% (never hit 100 until actually complete)
      let displayProgress: number;
      
      if (rawProgress <= 85) {
        displayProgress = rawProgress;
      } else if (rawProgress <= 100) {
        // Slow down: map 85-100 raw to 85-95 display
        displayProgress = 85 + ((rawProgress - 85) / 15) * 10;
      } else if (rawProgress <= 150) {
        // Crawl: map 100-150 raw to 95-99 display
        displayProgress = 95 + ((rawProgress - 100) / 50) * 4;
      } else {
        // Cap at 99% until actually complete
        displayProgress = 99;
      }

      setProgress(Math.min(99, Math.max(0, displayProgress)));
    };

    // Update immediately
    updateProgress();

    // Then update every second
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [status, generationStartedAt, estimatedDurationSeconds]);

  return progress;
}
