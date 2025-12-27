import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, X, Check, Lock, Loader2, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { usePipelineRealtime } from '@/hooks/usePipelineRealtime';
import { useTags } from '@/hooks/useTags';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import type { PipelineStage } from '@/types/pipeline';
import { toast } from 'sonner';

import FirstFrameStage from './stages/FirstFrameStage';
import ScriptStage from './stages/ScriptStage';
import VoiceStage from './stages/VoiceStage';
import FinalVideoStage from './stages/FinalVideoStage';
import LocationSelector from '@/components/forms/LocationSelector';

interface PipelineModalProps {
  open: boolean;
  onClose: () => void;
  pipelineId: string | null;
  projectId: string;
  folderId?: string;
  onSuccess?: () => void;
}

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'first_frame', label: 'First Frame' },
  { key: 'script', label: 'Script' },
  { key: 'voice', label: 'Voice' },
  { key: 'final_video', label: 'Final Video' },
];

export default function PipelineModal({
  open,
  onClose,
  pipelineId,
  projectId,
  folderId,
  onSuccess,
}: PipelineModalProps) {
  const {
    pipeline,
    isLoading,
    canProceedToFinalVideo,
    createPipeline,
    updatePipeline,
    isCreating,
  } = usePipeline(pipelineId);

  const { profile } = useProfile();
  const { tags } = useTags();
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(pipelineId);
  const [activeStage, setActiveStage] = useState<PipelineStage>('first_frame');
  const [name, setName] = useState('Untitled');
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [status, setStatus] = useState<'draft' | 'processing' | 'completed' | 'failed'>('draft');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'bg-slate-500' },
    { value: 'review', label: 'Review', color: 'bg-blue-500' },
    { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
  ];

  // Subscribe to realtime updates for this pipeline
  const effectivePipelineId = currentPipelineId || pipelineId;
  usePipelineRealtime(effectivePipelineId);

  // Initialize state when pipeline loads
  useEffect(() => {
    if (pipeline) {
      setActiveStage(pipeline.current_stage);
      setName(pipeline.name);
      setStatus(pipeline.status || 'draft');
      setSelectedTags(pipeline.tags || []);
    }
  }, [pipeline]);

  // Create pipeline if not exists
  useEffect(() => {
    if (open && !pipelineId && !currentPipelineId && !isCreating) {
      createPipeline({
        projectId: currentProjectId,
        folderId: currentFolderId,
        name: 'Untitled',
      }).then((newPipeline) => {
        setCurrentPipelineId(newPipeline.id);
      }).catch(() => {
        toast.error('Failed to create pipeline');
        onClose();
      });
    }
  }, [open, pipelineId, currentPipelineId, isCreating, createPipeline, currentProjectId, currentFolderId, onClose]);

  const handleStageClick = (stage: PipelineStage) => {
    // Can freely switch between first 3 stages
    if (stage === 'final_video') {
      if (!canProceedToFinalVideo) {
        toast.error('Complete all stages first', {
          description: 'You need to complete First Frame, Script, and Voice stages before generating the final video.',
        });
        return;
      }
    }
    setActiveStage(stage);
    updatePipeline({ current_stage: stage });
  };

  const isStageComplete = (stage: PipelineStage): boolean => {
    if (!pipeline) return false;
    switch (stage) {
      case 'first_frame': return pipeline.first_frame_complete;
      case 'script': return pipeline.script_complete;
      case 'voice': return pipeline.voice_complete;
      case 'final_video': return pipeline.status === 'completed';
      default: return false;
    }
  };

  const isStageAccessible = (stage: PipelineStage): boolean => {
    if (stage === 'final_video') return canProceedToFinalVideo || false;
    return true; // First 3 stages are always accessible
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    updatePipeline({ name: newName });
  };

  const handleLocationChange = (newProjectId: string, newFolderId?: string) => {
    setCurrentProjectId(newProjectId);
    setCurrentFolderId(newFolderId);
  };

  const handleStatusChange = (newStatus: string) => {
    const typedStatus = newStatus as 'draft' | 'processing' | 'completed' | 'failed';
    setStatus(typedStatus);
    updatePipeline({ status: typedStatus });
  };

  const toggleTag = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(t => t !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newTags);
    updatePipeline({ tags: newTags });
  };

  const currentStatusOption = statusOptions.find(s => s.value === status) || statusOptions[0];

  const handleClose = () => {
    onClose();
    if (pipeline?.status === 'completed') {
      onSuccess?.();
    }
  };


  if (isLoading || isCreating) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl h-[90vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading pipeline...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleSave = () => {
    toast.success('Pipeline saved successfully');
    onSuccess?.();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-lg">
        {/* Header */}
        <div className="flex items-center gap-4 border-b bg-muted/30 px-6 py-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">Talking Head</h2>
          </div>
          
          <div className="h-6 w-px bg-border" />
          
          {/* Spacer to push save/close to right */}
          <div className="flex-1" />
          
          {/* Save and Close buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} className="h-8">
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Secondary row with name, location, status, tags */}
        <div className="flex items-center gap-4 border-b bg-muted/20 px-6 py-3 flex-wrap">
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-36 h-8"
          />
          
          <LocationSelector
            projectId={currentProjectId}
            folderId={currentFolderId}
            onLocationChange={handleLocationChange}
          />
          <Select value={status} onValueChange={handleStatusChange}>
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
                  <>
                    {selectedTags.slice(0, 2).map((tagId) => {
                      const tag = tags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <Badge
                          key={tagId}
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                        >
                          {tag.tag_name}
                        </Badge>
                      );
                    })}
                    {selectedTags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{selectedTags.length - 2}</span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">+ Add tag</span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52">
              <div className="space-y-1">
                <h4 className="text-sm font-medium mb-2">Tags</h4>
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary cursor-pointer"
                      onClick={() => toggleTag(tag.id)}
                    >
                      <Checkbox checked={selectedTags.includes(tag.id)} />
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="flex-1 text-sm truncate">{tag.tag_name}</span>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Stage Content */}
        <div className="flex-1 overflow-hidden">
          {effectivePipelineId && (
            <>
              {activeStage === 'first_frame' && (
                <FirstFrameStage
                  pipelineId={effectivePipelineId}
                  onContinue={() => setActiveStage('script')}
                  stageNavigation={renderStageNavigation()}
                />
              )}
              {activeStage === 'script' && (
                <ScriptStage
                  pipelineId={effectivePipelineId}
                  onContinue={() => setActiveStage('voice')}
                  stageNavigation={renderStageNavigation()}
                />
              )}
              {activeStage === 'voice' && (
                <VoiceStage
                  pipelineId={effectivePipelineId}
                  onContinue={() => setActiveStage('final_video')}
                  stageNavigation={renderStageNavigation()}
                />
              )}
              {activeStage === 'final_video' && (
                <FinalVideoStage
                  pipelineId={effectivePipelineId}
                  onComplete={() => {
                    toast.success('Video generated successfully!');
                    onSuccess?.();
                    onClose();
                  }}
                  stageNavigation={renderStageNavigation()}
                />
              )}
            </>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );

  function renderStageNavigation() {
    return (
      <div className="flex items-center gap-3">
        {STAGES.map((stage, index) => {
          const isComplete = isStageComplete(stage.key);
          const isAccessible = isStageAccessible(stage.key);
          const isActive = activeStage === stage.key;

          return (
            <React.Fragment key={stage.key}>
              {index > 0 && (
                <div className={cn(
                  "w-8 h-0.5",
                  isComplete || isStageComplete(STAGES[index - 1].key) ? "bg-primary" : "bg-border"
                )} />
              )}
              <button
                onClick={() => handleStageClick(stage.key)}
                disabled={!isAccessible}
                className={cn(
                  "flex items-center gap-2 transition-all",
                  isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  isComplete 
                    ? "bg-primary text-primary-foreground" 
                    : isActive 
                      ? "bg-primary/20 text-primary border-2 border-primary" 
                      : "bg-muted text-muted-foreground"
                )}>
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : !isAccessible ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {stage.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}
