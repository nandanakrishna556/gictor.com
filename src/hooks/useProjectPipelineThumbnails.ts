import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineThumbnailData } from '@/lib/file-thumbnails';

/**
 * Fetches first_frame_output, last_frame_output URLs and live status info for
 * all pipelines in a project, returning them as a Map keyed by pipeline ID.
 *
 * Status info is used by file cards to show a "Generating <stage>..." overlay
 * even when the underlying file row hasn't flipped to processing yet (e.g.
 * while First Frame / Speech / Last Frame stages are running on the pipeline).
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
        .select('id, first_frame_output, last_frame_output, status, current_stage, pipeline_type, generation_started_at, estimated_duration_seconds')
        .eq('project_id', projectId);

      if (error) throw error;

      const map = new Map<string, PipelineThumbnailData>();
      for (const p of data || []) {
        const firstFrame = p.first_frame_output as { url?: string } | null;
        const lastFrame = p.last_frame_output as { url?: string } | null;
        map.set(p.id, {
          firstFrameUrl: firstFrame?.url,
          lastFrameUrl: lastFrame?.url,
          status: p.status ?? null,
          currentStage: p.current_stage ?? null,
          pipelineType: p.pipeline_type ?? null,
          generationStartedAt: p.generation_started_at ?? null,
          estimatedDurationSeconds: p.estimated_duration_seconds ?? null,
        });
      }
      return map;
    },
    enabled: !!projectId,
    // Poll every 2s so the in-grid label updates as the pipeline advances
    // through stages even if a realtime event is briefly missed.
    refetchInterval: 2000,
    staleTime: 1000,
  });
}
