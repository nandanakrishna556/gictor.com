import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

const DEFAULT_PIPELINES: Omit<Pipeline, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Default Pipeline',
    stages: [
      { id: 'processing', name: 'Processing', color: 'bg-amber-500' },
      { id: 'completed', name: 'Completed', color: 'bg-green-500' },
      { id: 'failed', name: 'Failed', color: 'bg-red-500' },
    ],
  },
  {
    name: 'Review Pipeline',
    stages: [
      { id: 'processing', name: 'Processing', color: 'bg-amber-500' },
      { id: 'review', name: 'Review', color: 'bg-blue-500' },
      { id: 'approved', name: 'Approved', color: 'bg-emerald-500' },
      { id: 'completed', name: 'Completed', color: 'bg-green-500' },
    ],
  },
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
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the data to match our interface
      return (data || []).map((p) => ({
        ...p,
        stages: (p.stages as unknown as PipelineStage[]) || [],
      })) as Pipeline[];
    },
    enabled: !!user?.id,
  });

  const createPipelineMutation = useMutation({
    mutationFn: async (pipeline: { name: string; stages: PipelineStage[] }) => {
      const { data, error } = await supabase
        .from('user_pipelines')
        .insert({
          user_id: user!.id,
          name: pipeline.name,
          stages: JSON.parse(JSON.stringify(pipeline.stages)),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({
        title: 'Pipeline created',
        description: 'Your pipeline has been created.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create pipeline.',
        variant: 'destructive',
      });
    },
  });

  const updatePipelineMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string; stages?: PipelineStage[] } }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.stages) updateData.stages = JSON.parse(JSON.stringify(updates.stages));

      const { data, error } = await supabase
        .from('user_pipelines')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });

  const deletePipelineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_pipelines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast({
        title: 'Pipeline deleted',
        description: 'The pipeline has been deleted.',
      });
    },
  });

  // Combine default pipelines with user pipelines
  const allPipelines = [
    ...DEFAULT_PIPELINES.map((p, index) => ({
      ...p,
      id: `default-${index}`,
      user_id: '',
      created_at: '',
      updated_at: '',
      isDefault: true,
    })),
    ...(pipelines || []).map(p => ({ ...p, isDefault: false })),
  ];

  return {
    pipelines: allPipelines,
    isLoading,
    createPipeline: createPipelineMutation.mutateAsync,
    updatePipeline: updatePipelineMutation.mutateAsync,
    deletePipeline: deletePipelineMutation.mutateAsync,
  };
}
