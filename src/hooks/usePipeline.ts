import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  Pipeline, 
  FirstFrameInput, 
  FirstFrameOutput,
  LastFrameOutput,
  ScriptInput,
  ScriptOutput,
  VoiceInput,
  VoiceOutput,
  FinalVideoInput,
  FinalVideoOutput
} from '@/types/pipeline';
import type { Json } from '@/integrations/supabase/types';

// Helper to safely parse JSONB fields
function parsePipeline(data: any): Pipeline {
  return {
    ...data,
    first_frame_input: (data.first_frame_input || {}) as FirstFrameInput,
    first_frame_output: data.first_frame_output as FirstFrameOutput | null,
    last_frame_output: data.last_frame_output as LastFrameOutput | null,
    script_input: (data.script_input || {}) as ScriptInput,
    script_output: data.script_output as ScriptOutput | null,
    voice_input: (data.voice_input || {}) as VoiceInput,
    voice_output: data.voice_output as VoiceOutput | null,
    final_video_input: (data.final_video_input || {}) as FinalVideoInput,
    final_video_output: data.final_video_output as FinalVideoOutput | null,
    tags: data.tags || [],
    display_status: data.display_status || null,
    pipeline_type: data.pipeline_type || 'talking_head',
    progress: data.progress ?? 0,
    generation_started_at: data.generation_started_at || null,
    estimated_duration_seconds: data.estimated_duration_seconds || null,
    last_frame_complete: data.last_frame_complete || false,
  } as Pipeline;
}

export function usePipeline(pipelineId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pipeline with polling when processing
  const { data: pipeline, isLoading } = useQuery({
    queryKey: ['pipeline', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return null;
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('id', pipelineId)
        .single();
      if (error) throw error;
      return parsePipeline(data);
    },
    enabled: !!pipelineId,
    // Poll every 2 seconds when pipeline is processing
    refetchInterval: (query) => {
      const pipelineData = query.state.data;
      return pipelineData?.status === 'processing' ? 2000 : false;
    },
  });

  // Create pipeline
  const createPipeline = useMutation({
    mutationFn: async (params: { 
      projectId: string; 
      folderId?: string; 
      name?: string;
      status?: string;
      displayStatus?: string;
      pipelineType?: 'lip_sync' | 'talking_head' | 'clips';
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('pipelines')
        .insert({
          project_id: params.projectId,
          folder_id: params.folderId || null,
          user_id: user.id,
          name: params.name || 'Untitled',
          status: params.status || 'draft',
          display_status: params.displayStatus || null,
          current_stage: 'first_frame',
          pipeline_type: params.pipelineType || 'talking_head',
        })
        .select()
        .single();
      
      if (error) throw error;
      return parsePipeline(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });

  // Update pipeline metadata
  const updatePipeline = useMutation({
    mutationFn: async (updates: Partial<Pick<Pipeline, 'name' | 'tags' | 'current_stage' | 'status'>>) => {
      if (!pipelineId) throw new Error('No pipeline selected');
      
      const { data, error } = await supabase
        .from('pipelines')
        .update(updates)
        .eq('id', pipelineId)
        .select()
        .single();
      
      if (error) throw error;
      return parsePipeline(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    },
  });

  // Update First Frame stage
  const updateFirstFrame = useMutation({
    mutationFn: async (params: { 
      input?: FirstFrameInput; 
      output?: FirstFrameOutput | null;
      complete?: boolean;
    }) => {
      if (!pipelineId) throw new Error('No pipeline selected');
      
      const updates: Record<string, Json | boolean> = {};
      if (params.input !== undefined) updates.first_frame_input = params.input as unknown as Json;
      if (params.output !== undefined) updates.first_frame_output = params.output as unknown as Json;
      if (params.complete !== undefined) updates.first_frame_complete = params.complete;
      
      const { data, error } = await supabase
        .from('pipelines')
        .update(updates)
        .eq('id', pipelineId)
        .select()
        .single();
      
      if (error) throw error;
      return parsePipeline(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    },
  });

  // Update Script stage
  const updateScript = useMutation({
    mutationFn: async (params: { 
      input?: ScriptInput; 
      output?: ScriptOutput | null;
      complete?: boolean;
    }) => {
      if (!pipelineId) throw new Error('No pipeline selected');
      
      const updates: Record<string, Json | boolean> = {};
      if (params.input !== undefined) updates.script_input = params.input as unknown as Json;
      if (params.output !== undefined) updates.script_output = params.output as unknown as Json;
      if (params.complete !== undefined) updates.script_complete = params.complete;
      
      const { data, error } = await supabase
        .from('pipelines')
        .update(updates)
        .eq('id', pipelineId)
        .select()
        .single();
      
      if (error) throw error;
      return parsePipeline(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    },
  });

  // Update Voice stage
  const updateVoice = useMutation({
    mutationFn: async (params: { 
      input?: VoiceInput; 
      output?: VoiceOutput | null;
      complete?: boolean;
    }) => {
      if (!pipelineId) throw new Error('No pipeline selected');
      
      const updates: Record<string, Json | boolean> = {};
      if (params.input !== undefined) updates.voice_input = params.input as unknown as Json;
      if (params.output !== undefined) updates.voice_output = params.output as unknown as Json;
      if (params.complete !== undefined) updates.voice_complete = params.complete;
      
      const { data, error } = await supabase
        .from('pipelines')
        .update(updates)
        .eq('id', pipelineId)
        .select()
        .single();
      
      if (error) throw error;
      return parsePipeline(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    },
  });

  // Update Final Video stage
  const updateFinalVideo = useMutation({
    mutationFn: async (params: { 
      input?: FinalVideoInput; 
      output?: FinalVideoOutput | null;
      status?: Pipeline['status'];
      outputFileId?: string;
    }) => {
      if (!pipelineId) throw new Error('No pipeline selected');
      
      const updates: Record<string, Json | boolean | string> = {};
      if (params.input !== undefined) updates.final_video_input = params.input as unknown as Json;
      if (params.output !== undefined) updates.final_video_output = params.output as unknown as Json;
      if (params.status !== undefined) updates.status = params.status;
      if (params.outputFileId !== undefined) updates.output_file_id = params.outputFileId;
      
      const { data, error } = await supabase
        .from('pipelines')
        .update(updates)
        .eq('id', pipelineId)
        .select()
        .single();
      
      if (error) throw error;
      return parsePipeline(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    },
  });

  // Delete pipeline
  const deletePipeline = useMutation({
    mutationFn: async () => {
      if (!pipelineId) throw new Error('No pipeline selected');
      
      const { error } = await supabase
        .from('pipelines')
        .delete()
        .eq('id', pipelineId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    },
  });

  // Check if can proceed to final video
  const canProceedToFinalVideo = pipeline?.first_frame_complete && 
    pipeline?.script_complete && 
    pipeline?.voice_complete;

  return {
    pipeline,
    isLoading,
    canProceedToFinalVideo,
    createPipeline: createPipeline.mutateAsync,
    updatePipeline: updatePipeline.mutateAsync,
    updateFirstFrame: updateFirstFrame.mutateAsync,
    updateScript: updateScript.mutateAsync,
    updateVoice: updateVoice.mutateAsync,
    updateFinalVideo: updateFinalVideo.mutateAsync,
    deletePipeline: deletePipeline.mutateAsync,
    isCreating: createPipeline.isPending,
    isUpdating: updatePipeline.isPending || 
      updateFirstFrame.isPending || 
      updateScript.isPending || 
      updateVoice.isPending ||
      updateFinalVideo.isPending,
  };
}

// Hook for listing pipelines
export function usePipelines(projectId: string, folderId?: string) {
  return useQuery({
    queryKey: ['pipelines', projectId, folderId],
    queryFn: async () => {
      let query = supabase
        .from('pipelines')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
      
      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else {
        query = query.is('folder_id', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(parsePipeline);
    },
    enabled: !!projectId,
  });
}
