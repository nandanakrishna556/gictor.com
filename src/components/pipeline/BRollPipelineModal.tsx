import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, X, Check, Loader2 } from 'lucide-react';
import StageProgressIndicator from './StageProgressIndicator';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { usePipelineRealtime } from '@/hooks/usePipelineRealtime';
import { useTags } from '@/hooks/useTags';
import { useFiles } from '@/hooks/useFiles';
import { usePipelines, DEFAULT_STAGES } from '@/hooks/usePipelines';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { TagList, TagSelector } from '@/components/ui/tag-badge';

import BRollFirstFrameStage from './stages/BRollFirstFrameStage';
import BRollPromptStage from './stages/BRollPromptStage';
import BRollFinalVideoStage from './stages/BRollFinalVideoStage';
import LocationSelector from '@/components/forms/LocationSelector';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface BRollPipelineModalProps {
  open: boolean;
  onClose: () => void;
  pipelineId: string | null;
  projectId: string;
  folderId?: string;
  initialStatus?: string;
  onSuccess?: () => void;
  statusOptions?: StatusOption[];
}

// B-Roll has 3 stages: First Frame, Prompt, Final Video
type BRollStage = 'first_frame' | 'prompt' | 'final_video';

const BROLL_STAGES: { key: BRollStage; label: string }[] = [
  { key: 'first_frame', label: 'First Frame' },
  { key: 'prompt', label: 'Prompt' },
  { key: 'final_video', label: 'Final Video' },
];

export default function BRollPipelineModal({
  open,
  onClose,
  pipelineId,
  projectId,
  folderId,
  initialStatus,
  onSuccess,
  statusOptions: passedStatusOptions,
}: BRollPipelineModalProps) {
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
  const [activeStage, setActiveStage] = useState<BRollStage>('first_frame');
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

  // Map pipeline's current_stage to B-Roll stage
  const mapPipelineStageToBRoll = (stage: string): BRollStage => {
    if (stage === 'first_frame') return 'first_frame';
    if (stage === 'script') return 'prompt'; // We use script stage for prompt
    if (stage === 'final_video') return 'final_video';
    return 'first_frame';
  };

  // Sync pipeline data when loaded
  useEffect(() => {
    if (pipeline && !pipelineLoadedRef.current) {
      pipelineLoadedRef.current = true;
      setActiveStage(mapPipelineStageToBRoll(pipeline.current_stage));
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

  const handleStageClick = (stage: BRollStage) => {
    setActiveStage(stage);
    // Map B-Roll stage back to pipeline stage
    const pipelineStage = stage === 'prompt' ? 'script' : stage;
    updatePipeline({ current_stage: pipelineStage as any });
  };

  const isStageComplete = (stage: BRollStage): boolean => {
    if (!pipeline) return false;
    switch (stage) {
      case 'first_frame': return pipeline.first_frame_complete;
      case 'prompt': return pipeline.script_complete; // We use script_complete for prompt
      case 'final_video': return pipeline.status === 'completed';
      default: return false;
    }
  };

  const getStageProgress = (stage: BRollStage): number => {
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
      case 'prompt': {
        if (pipeline.script_complete) return 100;
        // B-roll stores motion_prompt in script_input - check for any input
        const hasInput = pipeline.script_input?.description || pipeline.script_input?.pasted_text;
        if (hasInput) return 60;
        return 0;
      }
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
        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-3 flex-wrap">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">B-Roll</h2>
          
          <div className="h-5 w-px bg-border" />
          
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-32 h-8"
          />
          
          <LocationSelector
            projectId={currentProjectId}
            folderId={currentFolderId}
            onLocationChange={handleLocationChange}
          />
          
          <Select value={displayStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className={cn(
              "h-8 w-fit rounded-md text-xs border-0 px-3 py-1 text-white gap-1",
              currentStatusOption.color
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', opt.color)} />
                    {opt.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer hover:bg-secondary/50 rounded-md px-2 py-1 transition-colors">
                {selectedTags.length > 0 ? (
                  <TagList 
                    tags={tags} 
                    selectedTagIds={selectedTags} 
                    maxVisible={2} 
                    size="sm"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">+ Add tag</span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 bg-popover">
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              <TagSelector
                tags={tags}
                selectedTagIds={selectedTags}
                onToggleTag={toggleTag}
                onCreateTag={async (name, color) => {
                  const { data, error } = await supabase
                    .from('user_tags')
                    .insert({
                      user_id: profile?.id,
                      tag_name: name,
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
                enableDragDrop
              />
            </PopoverContent>
          </Popover>
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Auto-save indicator and Close button */}
          <div className="flex items-center gap-3">
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Saved</span>
                  </>
                )}
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stage Tabs */}
        <div className="border-b bg-muted/20">
          <div className="flex">
            {BROLL_STAGES.map((stage, index) => {
              const isComplete = isStageComplete(stage.key);
              const isActive = activeStage === stage.key;
              const progress = getStageProgress(stage.key);

              return (
                <button
                  key={stage.key}
                  onClick={() => handleStageClick(stage.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-all relative cursor-pointer",
                    isActive 
                      ? "bg-[hsl(24,100%,60%)] text-white" 
                      : "bg-muted/30 hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <StageProgressIndicator
                    progress={progress}
                    isComplete={isComplete}
                    isActive={isActive}
                    stageNumber={index + 1}
                  />
                  <span className={cn(
                    "text-sm font-medium transition-colors whitespace-nowrap",
                    isActive ? "text-primary-foreground" : isComplete ? "text-primary" : "text-muted-foreground"
                  )}>
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Content */}
        <div className="flex-1 overflow-hidden">
          {pipelineId && (
            <>
              {activeStage === 'first_frame' && (
                <BRollFirstFrameStage
                  pipelineId={pipelineId}
                  onComplete={() => setActiveStage('prompt')}
                />
              )}
              {activeStage === 'prompt' && (
                <BRollPromptStage
                  pipelineId={pipelineId}
                  onContinue={() => setActiveStage('final_video')}
                />
              )}
              {activeStage === 'final_video' && (
                <BRollFinalVideoStage
                  pipelineId={pipelineId}
                  onComplete={() => {
                    toast.success('B-Roll video generated successfully!');
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
