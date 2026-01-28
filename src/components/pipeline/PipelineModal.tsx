import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import PipelineHeader from './PipelineHeader';
import PipelineTabNavigation from './PipelineTabNavigation';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { usePipelineRealtime } from '@/hooks/usePipelineRealtime';
import { useTags } from '@/hooks/useTags';
import { useFiles } from '@/hooks/useFiles';
import { usePipelines, DEFAULT_STAGES } from '@/hooks/usePipelines';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineStage } from '@/types/pipeline';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import FirstFrameStage from './stages/FirstFrameStage';
import ScriptStage from './stages/ScriptStage';
import SpeechStage from './stages/SpeechStage';
import LipSyncStage from './stages/LipSyncStage';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface PipelineModalProps {
  open: boolean;
  onClose: () => void;
  pipelineId: string | null;
  projectId: string;
  folderId?: string;
  initialStatus?: string;
  onSuccess?: () => void;
  statusOptions?: StatusOption[];
}

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'first_frame', label: 'First Frame' },
  { key: 'script', label: 'Script' },
  { key: 'speech', label: 'Speech' },
  { key: 'lip_sync', label: 'Lip Sync' },
];

export default function PipelineModal({
  open,
  onClose,
  pipelineId,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
  statusOptions: passedStatusOptions,
}: PipelineModalProps) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const { tags } = useTags();
  const { createFile } = useFiles(projectId);
  const { defaultStages } = usePipelines();
  
  // Core state
  const initialStatusRef = useRef(initialStatus);
  
  // Capture initialStatus in ref immediately on mount
  initialStatusRef.current = initialStatus;
  
  // Use the provided pipelineId directly - pipeline creation now happens in CreateNewModal
  const {
    pipeline,
    isLoading,
    canProceedToFinalVideo,
    updatePipeline,
  } = usePipeline(pipelineId);

  // UI state
  const [activeStage, setActiveStage] = useState<PipelineStage>('first_frame');
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

  // Sync pipeline data when loaded
  useEffect(() => {
    if (pipeline && !pipelineLoadedRef.current) {
      pipelineLoadedRef.current = true;
      setActiveStage(pipeline.current_stage);
      setName(pipeline.name);
      // Use display_status for Kanban column, fall back to initialStatus or 'draft'
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

  // Auto-save functionality - saves to pipelines table only (no file cards for workflows)
  const triggerAutoSave = useCallback(() => {
    if (!pipelineId || !hasUnsavedChanges) return;
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        
        // Update pipeline with name, tags, and display_status
        await updatePipeline({ 
          name, 
          tags: selectedTags 
        });
        
        // Update pipeline's display_status for Kanban column
        await supabase
          .from('pipelines')
          .update({ display_status: displayStatus })
          .eq('id', pipelineId);
        
        setHasUnsavedChanges(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        
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


  const handleStageClick = (stage: PipelineStage) => {
    // All stages are freely accessible
    setActiveStage(stage);
    updatePipeline({ current_stage: stage });
  };

  const isStageComplete = (stage: PipelineStage): boolean => {
    if (!pipeline) return false;
    switch (stage) {
      case 'first_frame': return pipeline.first_frame_complete;
      case 'script': return pipeline.script_complete;
      case 'speech':
      case 'voice': return pipeline.voice_complete;
      case 'lip_sync':
      case 'final_video': return pipeline.status === 'completed';
      default: return false;
    }
  };

  const getStageProgress = (stage: PipelineStage): number => {
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
      case 'script': {
        if (pipeline.script_complete) return 100;
        const hasInput = pipeline.script_input?.description || pipeline.script_input?.pasted_text;
        const hasOutput = pipeline.script_output?.text;
        if (hasOutput) return 90;
        if (hasInput) return 40;
        return 0;
      }
      case 'speech':
      case 'voice': {
        if (pipeline.voice_complete) return 100;
        const hasOutput = pipeline.voice_output?.url;
        if (hasOutput) return 90;
        return 0;
      }
      case 'lip_sync':
      case 'final_video': {
        if (pipeline.status === 'completed') return 100;
        const hasOutput = pipeline.final_video_output?.url;
        if (hasOutput) return 90;
        if (pipeline.status === 'processing') return 50;
        return 0;
      }
      default: return 0;
    }
  };

  const isStageAccessible = (stage: PipelineStage): boolean => {
    return true; // All stages are always accessible
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
      
      // Update the pipeline with name and tags
      await updatePipeline({ 
        name, 
        tags: selectedTags 
      });
      
      // Update the pipeline's display_status for Kanban column
      await supabase
        .from('pipelines')
        .update({ display_status: displayStatus })
        .eq('id', pipelineId);
      
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      // Invalidate queries to refresh pipelines
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
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    setShowUnsavedWarning(false);
  };


  // Show nothing until pipeline data is loaded - no loading flash
  // The pipeline is created before this modal opens, so data should be available quickly
  if (!pipeline && pipelineId) {
    return null; // Return nothing to prevent loading flash
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
          title="Talking Head"
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
          stages={STAGES}
          activeStage={activeStage}
          onStageClick={handleStageClick}
          isStageComplete={isStageComplete}
          getStageProgress={getStageProgress}
          isStageAccessible={isStageAccessible}
        />

        {/* Stage Content */}
        <div className="flex-1 overflow-hidden">
          {pipelineId && (
            <>
              {activeStage === 'first_frame' && (
                <FirstFrameStage
                  pipelineId={pipelineId}
                  onContinue={() => setActiveStage('script')}
                />
              )}
              {activeStage === 'script' && (
                <ScriptStage
                  pipelineId={pipelineId}
                  onContinue={() => setActiveStage('speech')}
                />
              )}
              {activeStage === 'speech' && (
                <SpeechStage
                  pipelineId={pipelineId}
                  onContinue={() => setActiveStage('lip_sync')}
                />
              )}
              {activeStage === 'lip_sync' && (
                <LipSyncStage
                  pipelineId={pipelineId}
                  onComplete={() => {
                    toast.success('Video generated successfully!');
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
