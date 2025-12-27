import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
        (payload) => {
          const pipeline = payload.new as any;
          
          // Check for stage completions
          if (payload.old) {
            const oldPipeline = payload.old as any;
            
            // First frame completed
            if (!oldPipeline.first_frame_complete && pipeline.first_frame_complete) {
              toast.success('First frame ready!');
            }
            
            // Script completed
            if (!oldPipeline.script_complete && pipeline.script_complete) {
              toast.success('Script ready!');
            }
            
            // Voice completed
            if (!oldPipeline.voice_complete && pipeline.voice_complete) {
              toast.success('Voice ready!');
            }
            
            // Final video completed
            if (oldPipeline.status !== 'completed' && pipeline.status === 'completed') {
              toast.success('Final video is ready!');
            }
            
            // Generation failed
            if (oldPipeline.status !== 'failed' && pipeline.status === 'failed') {
              toast.error('Generation failed', { description: 'Credits have been refunded' });
            }
          }
          
          // Refresh pipeline data
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
