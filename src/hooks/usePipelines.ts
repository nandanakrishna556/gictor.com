import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

export interface Pipeline {
  id: string;
  user_id: string;
  name: string;
  stages: PipelineStage[];
  created_at: string;
  updated_at: string;
}

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'processing', name: 'Processing', color: 'bg-amber-500' },
  { id: 'review', name: 'Review', color: 'bg-blue-500' },
  { id: 'approved', name: 'Approved', color: 'bg-emerald-500' },
  { id: 'completed', name: 'Completed', color: 'bg-green-500' },
];

export function usePipelines() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pipelines, isLoading } = useQuery({
    queryKey: ['pipelines', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_pipelines')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse stages from JSON
      return (data || []).map(p => ({
        ...p,
        stages: (p.stages as unknown as PipelineStage[]) || DEFAULT_STAGES,
      })) as Pipeline[];
    },
    enabled: !!user?.id,
  });

  const createPipelineMutation = useMutation({
    mutationFn: async ({ name, stages }: { name: string; stages: PipelineStage[] }) => {
      const { data, error } = await supabase
        .from('user_pipelines')
        .insert({
          user_id: user!.id,
          name,
          stages: stages as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        stages: data.stages as unknown as PipelineStage[],
      } as Pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', user?.id] });
      toast({
        title: 'Pipeline created',
        description: 'Your pipeline has been created.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create pipeline. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updatePipelineMutation = useMutation({
    mutationFn: async ({ id, name, stages }: { id: string; name: string; stages: PipelineStage[] }) => {
      const { data, error } = await supabase
        .from('user_pipelines')
        .update({ name, stages: stages as unknown as Json })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        stages: data.stages as unknown as PipelineStage[],
      } as Pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', user?.id] });
      toast({
        title: 'Pipeline updated',
        description: 'Your pipeline has been updated.',
      });
    },
  });

  const deletePipelineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_pipelines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', user?.id] });
      toast({
        title: 'Pipeline deleted',
        description: 'The pipeline has been deleted.',
      });
    },
  });

  return {
    pipelines: pipelines || [],
    isLoading,
    createPipeline: createPipelineMutation.mutateAsync,
    updatePipeline: updatePipelineMutation.mutateAsync,
    deletePipeline: deletePipelineMutation.mutateAsync,
    defaultStages: DEFAULT_STAGES,
  };
}
