import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PipelineHeader from './PipelineHeader';
import PipelineTabNavigation from './PipelineTabNavigation';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { usePipelineRealtime } from '@/hooks/usePipelineRealtime';
import { useTags } from '@/hooks/useTags';
import { useFiles } from '@/hooks/useFiles';
import { usePipelines, DEFAULT_STAGES } from '@/hooks/usePipelines';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import MoGraphFirstFrameStage from './stages/MoGraphFirstFrameStage';
import MoGraphLastFrameStage from './stages/MoGraphLastFrameStage';
import MoGraphAnimateStage from './stages/MoGraphAnimateStage';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface MotionGraphicsPipelineModalProps {
  open: boolean;
  onClose: () => void;
  pipelineId: string | null;
  projectId: string;
  folderId?: string;
  initialStatus?: string;
  onSuccess?: () => void;
  statusOptions?: StatusOption[];
}

// Motion Graphics has 3 stages: First Frame, Last Frame, Animate
type MoGraphStage = 'first_frame' | 'last_frame' | 'animate';

const MOGRAPH_STAGES: { key: MoGraphStage; label: string }[] = [
  { key: 'first_frame', label: 'First Frame' },
  { key: 'last_frame', label: 'Last Frame' },
  { key: 'animate', label: 'Animate' },
];

export default function MotionGraphicsPipelineModal({
  open,
  onClose,
  pipelineId,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
  statusOptions: passedStatusOptions,
}: MotionGraphicsPipelineModalProps) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { tags } = useTags();
  const { createFile } = useFiles(projectId);
  const { defaultStages } = usePipelines();
  
  // Core state
  const initialStatusRef = useRef(initialStatus);
  initialStatusRef.current = initialStatus;
  
  const {
    pipeline,
    isLoading,
    updatePipeline,
    updateFirstFrame,
  } = usePipeline(pipelineId);

  // UI state
  const [activeStage, setActiveStage] = useState<MoGraphStage>('first_frame');
  const [name, setName] = useState('Untitled');
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [displayStatus, setDisplayStatus] = useState<string>('draft');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const pipelineLoadedRef = useRef(false);

  // Use the passed status options from the Kanban, or fall back to default stages
  const statusOptions = passedStatusOptions || defaultStages.map(stage => ({
    value: stage.id,
    label: stage.name,
    color: stage.color,
  }));
  
  // Auto-save indicator states
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to check if projectId is a valid UUID
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Subscribe to realtime updates
  usePipelineRealtime(pipelineId);

  // Map pipeline's current_stage to Motion Graphics stage
  const mapPipelineStageToMoGraph = (stage: string): MoGraphStage => {
    if (stage === 'first_frame') return 'first_frame';
    if (stage === 'script') return 'last_frame'; // We use script stage for last frame
    if (stage === 'voice' || stage === 'final_video') return 'animate';
    return 'first_frame';
  };

  // Sync pipeline data when loaded
  useEffect(() => {
    if (pipeline && !pipelineLoadedRef.current) {
      pipelineLoadedRef.current = true;
      setActiveStage(mapPipelineStageToMoGraph(pipeline.current_stage));
      setName(pipeline.name);
      setDisplayStatus(pipeline.display_status || initialStatusRef.current || 'draft');
      setSelectedTags(pipeline.tags || []);
    }
  }, [pipeline]);

  // Sync projectId/folderId from props
  useEffect(() => {
    if (projectId && isValidUUID(projectId)) {
      setCurrentProjectId(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    setCurrentFolderId(folderId);
  }, [folderId]);

  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    if (!pipelineId || !hasUnsavedChanges) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await updatePipeline({ 
          name, 
          tags: selectedTags 
        });
        
        // Sync the linked file's name and displayStatus
        const { data: linkedFile } = await supabase
          .from('files')
          .select('id')
          .eq('generation_params->>pipeline_id', pipelineId)
          .single();
        
        if (linkedFile) {
          await supabase
            .from('files')
            .update({ name, status: displayStatus })
            .eq('id', linkedFile.id);
        }
        
        // Also update pipeline's display_status
        await supabase
          .from('pipelines')
          .update({ display_status: displayStatus })
          .eq('id', pipelineId);
        
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        
        queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
        queryClient.invalidateQueries({ queryKey: ['pipelines', currentProjectId] });
      } catch (error) {
        setSaveStatus('idle');
      }
    }, 2000);
  }, [pipelineId, hasUnsavedChanges, name, displayStatus, selectedTags, updatePipeline, queryClient, currentProjectId]);

  // Trigger auto-save when unsaved changes occur
  useEffect(() => {
    if (hasUnsavedChanges && pipelineLoadedRef.current) {
      triggerAutoSave();
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, name, displayStatus, selectedTags, triggerAutoSave]);

  const handleStageClick = (stage: MoGraphStage) => {
    setActiveStage(stage);
    // Map MoGraph stage back to pipeline stage
    let pipelineStage: string;
    switch (stage) {
      case 'first_frame': pipelineStage = 'first_frame'; break;
      case 'last_frame': pipelineStage = 'script'; break;
      case 'animate': pipelineStage = 'final_video'; break;
      default: pipelineStage = 'first_frame';
    }
    updatePipeline({ current_stage: pipelineStage as any });
  };

  const isStageComplete = (stage: MoGraphStage): boolean => {
    if (!pipeline) return false;
    switch (stage) {
      case 'first_frame': return pipeline.first_frame_complete;
      case 'last_frame': return pipeline.script_complete;
      case 'animate': return pipeline.status === 'completed';
      default: return false;
    }
  };

  const getStageProgress = (stage: MoGraphStage): number => {
    if (!pipeline) return 0;
    
    switch (stage) {
      case 'first_frame': {
        if (pipeline.first_frame_complete) return 100;
        const hasInput = pipeline.first_frame_input?.prompt || pipeline.first_frame_input?.uploaded_url;
        const hasOutput = pipeline.first_frame_output?.url;
        if (hasOutput) return 90;
        if (hasInput) return 40;
        return 0;
      }
      case 'last_frame': {
        if (pipeline.script_complete) return 100;
        const scriptOutput = pipeline.script_output as any;
        const hasOutput = scriptOutput?.last_frame_url;
        if (hasOutput) return 90;
        const hasInput = (pipeline.script_input as any)?.prompt;
        if (hasInput) return 40;
        return 0;
      }
      case 'animate': {
        if (pipeline.status === 'completed') return 100;
        const hasOutput = pipeline.final_video_output?.url;
        if (hasOutput) return 90;
        if (pipeline.status === 'processing') return 50;
        return 0;
      }
      default: return 0;
    }
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    setHasUnsavedChanges(true);
  };

  const handleLocationChange = (newProjectId: string, newFolderId?: string) => {
    setCurrentProjectId(newProjectId);
    setCurrentFolderId(newFolderId);
    setHasUnsavedChanges(true);
  };

  const handleStatusChange = (newStatus: string) => {
    setDisplayStatus(newStatus);
    setHasUnsavedChanges(true);
  };

  const toggleTag = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    setHasUnsavedChanges(true);
  };

  const currentStatusOption = statusOptions.find(s => s.value === displayStatus) || statusOptions[0];

  const handleSave = async () => {
    if (!pipelineId) {
      toast.error('No pipeline to save');
      return;
    }
    
    try {
      setSaveStatus('saving');
      
      await updatePipeline({ 
        name, 
        tags: selectedTags 
      });
      
      await supabase
        .from('pipelines')
        .update({ display_status: displayStatus })
        .eq('id', pipelineId);
      
      const { data: linkedFile } = await supabase
        .from('files')
        .select('id')
        .eq('generation_params->>pipeline_id', pipelineId)
        .single();
      
      if (linkedFile) {
        await supabase
          .from('files')
          .update({ name, status: displayStatus })
          .eq('id', linkedFile.id);
      }
      
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      queryClient.invalidateQueries({ queryKey: ['files', currentProjectId] });
      queryClient.invalidateQueries({ queryKey: ['pipelines', currentProjectId] });
      
      onSuccess?.();
    } catch (error) {
      setSaveStatus('idle');
      toast.error('Failed to save changes');
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      pipelineLoadedRef.current = false;
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    setHasUnsavedChanges(false);
    pipelineLoadedRef.current = false;
    onClose();
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    setShowUnsavedWarning(false);
    pipelineLoadedRef.current = false;
    onClose();
  };

  // Show nothing until pipeline data is loaded
  if (!pipeline && pipelineId) {
    return null;
  }

  return (
    <>
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmClose}>Don't save</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndClose}>Save changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[900px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-lg">
        <PipelineHeader
          title="Motion Graphics"
          name={name}
          onNameChange={handleNameChange}
          projectId={currentProjectId}
          folderId={currentFolderId}
          onLocationChange={handleLocationChange}
          displayStatus={displayStatus}
          onStatusChange={handleStatusChange}
          statusOptions={statusOptions}
          currentStatusOption={currentStatusOption}
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onCreateTag={async (tagName, color) => {
            const { data, error } = await supabase
              .from('user_tags')
              .insert({
                user_id: profile?.id,
                tag_name: tagName,
                color,
              })
              .select()
              .single();
            
            if (!error && data) {
              setSelectedTags(prev => [...prev, data.id]);
              setHasUnsavedChanges(true);
              queryClient.invalidateQueries({ queryKey: ['tags'] });
              toast.success('Tag created');
            }
          }}
          saveStatus={saveStatus}
          onClose={handleClose}
        />

        <PipelineTabNavigation
          stages={MOGRAPH_STAGES}
          activeStage={activeStage}
          onStageClick={handleStageClick}
          isStageComplete={isStageComplete}
          getStageProgress={getStageProgress}
        />

        {/* Stage Content */}
        <div className="flex-1 overflow-hidden">
          {pipelineId && (
            <>
              {activeStage === 'first_frame' && (
                <MoGraphFirstFrameStage
                  pipelineId={pipelineId}
                  onComplete={() => setActiveStage('last_frame')}
                />
              )}
              {activeStage === 'last_frame' && (
                <MoGraphLastFrameStage
                  pipelineId={pipelineId}
                  onComplete={() => setActiveStage('animate')}
                />
              )}
              {activeStage === 'animate' && (
                <MoGraphAnimateStage
                  pipelineId={pipelineId}
                  onComplete={() => {
                    toast.success('Motion graphics video generated successfully!');
                    onSuccess?.();
                    onClose();
                  }}
                />
              )}
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
    </>
  );
}
