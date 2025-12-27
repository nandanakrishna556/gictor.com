import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export function usePipelineRealtime(pipelineId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pipelineId) return;

    const channel = supabase
      .channel(`pipeline-${pipelineId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pipelines',
          filter: `id=eq.${pipelineId}`,
        },
        () => {
          // Just refresh pipeline data - no toasts for stage completions
          // Toasts are shown in individual stage components when needed
          queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
          queryClient.invalidateQueries({ queryKey: ['profile'] }); // Refresh credits
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pipelineId, queryClient]);
}
