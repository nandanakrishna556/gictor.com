import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useFileRealtime(projectId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`files-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'files',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const file = payload.new as any;
          
          if (file.generation_status === 'completed') {
            toast.success('Generation complete!', { description: `${file.name} is ready` });
          } else if (file.generation_status === 'failed') {
            toast.error('Generation failed', { description: file.error_message || 'Please try again' });
            // Refresh profile to get updated credits (refund should have happened)
            queryClient.invalidateQueries({ queryKey: ['profile'] });
          }
          
          // Refresh files list
          queryClient.invalidateQueries({ queryKey: ['files', projectId] });
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [projectId, queryClient]);
}
