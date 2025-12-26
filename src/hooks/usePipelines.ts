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
  is_default?: boolean;
}

export const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'draft', name: 'Draft', color: 'bg-slate-500' },
  { id: 'review', name: 'Review', color: 'bg-blue-500' },
  { id: 'approved', name: 'Approved', color: 'bg-emerald-500' },
  { id: 'rejected', name: 'Rejected', color: 'bg-red-500' },
];

const DEFAULT_PIPELINE_NAME = '__default__';

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
      
      // Parse stages from JSON and mark default pipeline
      return (data || []).map(p => ({
        ...p,
        stages: (p.stages as unknown as PipelineStage[]) || DEFAULT_STAGES,
        is_default: p.name === DEFAULT_PIPELINE_NAME,
      })) as Pipeline[];
    },
    enabled: !!user?.id,
  });

  // Get the default pipeline if it exists
  const defaultPipeline = pipelines?.find(p => p.name === DEFAULT_PIPELINE_NAME);
  const defaultStages = defaultPipeline?.stages || DEFAULT_STAGES;

  // Filter out the internal default pipeline from the visible list
  const visiblePipelines = (pipelines || []).filter(p => p.name !== DEFAULT_PIPELINE_NAME);

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

  // Update or create default pipeline stages
  const updateDefaultStagesMutation = useMutation({
    mutationFn: async (stages: PipelineStage[]) => {
      if (defaultPipeline) {
        // Update existing default pipeline
        const { data, error } = await supabase
          .from('user_pipelines')
          .update({ stages: stages as unknown as Json })
          .eq('id', defaultPipeline.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create default pipeline
        const { data, error } = await supabase
          .from('user_pipelines')
          .insert({
            user_id: user!.id,
            name: DEFAULT_PIPELINE_NAME,
            stages: stages as unknown as Json,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', user?.id] });
      toast({
        title: 'Default pipeline updated',
        description: 'Your default pipeline stages have been saved.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update default pipeline. Please try again.',
        variant: 'destructive',
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
    pipelines: visiblePipelines,
    isLoading,
    createPipeline: createPipelineMutation.mutateAsync,
    updatePipeline: updatePipelineMutation.mutateAsync,
    deletePipeline: deletePipelineMutation.mutateAsync,
    updateDefaultStages: updateDefaultStagesMutation.mutateAsync,
    defaultStages,
    defaultPipeline,
  };
}
