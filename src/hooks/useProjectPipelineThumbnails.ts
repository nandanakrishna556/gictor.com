import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineThumbnailData } from '@/lib/file-thumbnails';

/**
 * Fetches first_frame_output and last_frame_output URLs for all pipelines
 * in a project, returning them as a Map keyed by pipeline ID.
 */
export function useProjectPipelineThumbnails(projectId: string) {
  return useQuery({
    queryKey: ['pipeline-thumbnails', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipelines')
        .select('id, first_frame_output, last_frame_output')
        .eq('project_id', projectId);

      if (error) throw error;

      const map = new Map<string, PipelineThumbnailData>();
      for (const p of data || []) {
        const firstFrame = p.first_frame_output as { url?: string } | null;
        const lastFrame = p.last_frame_output as { url?: string } | null;
        if (firstFrame?.url || lastFrame?.url) {
          map.set(p.id, {
            firstFrameUrl: firstFrame?.url,
            lastFrameUrl: lastFrame?.url,
          });
        }
      }
      return map;
    },
    enabled: !!projectId,
    staleTime: 30_000, // cache for 30 seconds
  });
}
