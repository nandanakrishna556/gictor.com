import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineThumbnailData } from '@/lib/file-thumbnails';

/**
 * Fetches first_frame_output and last_frame_output URLs for all pipelines
 * in a project, returning them as a Map keyed by pipeline ID.
 */
export function useProjectPipelineThumbnails(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`pipeline-thumbnails-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipelines',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pipeline-thumbnails', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

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
