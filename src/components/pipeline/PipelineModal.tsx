import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, X, Check, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
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
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(pipelineId);
  const [activeStage, setActiveStage] = useState<PipelineStage>('first_frame');
  const [name, setName] = useState('Untitled');
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);

  // Initialize state when pipeline loads
  useEffect(() => {
    if (pipeline) {
      setActiveStage(pipeline.current_stage);
      setName(pipeline.name);
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

  const handleClose = () => {
    onClose();
    if (pipeline?.status === 'completed') {
      onSuccess?.();
    }
  };

  const effectivePipelineId = currentPipelineId || pipelineId;

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="flex flex-col border-b bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">Talking Head</h2>
            </div>
          </div>
          
          {/* Metadata row */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">File name</span>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-40 h-8"
              />
            </div>
            
            <LocationSelector
              projectId={currentProjectId}
              folderId={currentFolderId}
              onLocationChange={handleLocationChange}
            />
          </div>
        </div>

        {/* Stage Navigation */}
        <div className="flex items-center justify-center gap-4 py-4 border-b bg-background">
          {STAGES.map((stage, index) => {
            const isComplete = isStageComplete(stage.key);
            const isAccessible = isStageAccessible(stage.key);
            const isActive = activeStage === stage.key;

            return (
              <React.Fragment key={stage.key}>
                {index > 0 && (
                  <div className={cn(
                    "w-12 h-0.5",
                    isComplete || isStageComplete(STAGES[index - 1].key) ? "bg-primary" : "bg-border"
                  )} />
                )}
                <button
                  onClick={() => handleStageClick(stage.key)}
                  disabled={!isAccessible}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all",
                    isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    isComplete 
                      ? "bg-primary text-primary-foreground" 
                      : isActive 
                        ? "bg-primary/20 text-primary border-2 border-primary" 
                        : "bg-muted text-muted-foreground"
                  )}>
                    {isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : !isAccessible ? (
                      <Lock className="h-4 w-4" />
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

        {/* Stage Content */}
        <div className="flex-1 overflow-auto">
          {effectivePipelineId && (
            <>
              {activeStage === 'first_frame' && (
                <FirstFrameStage
                  pipelineId={effectivePipelineId}
                  onContinue={() => setActiveStage('script')}
                />
              )}
              {activeStage === 'script' && (
                <ScriptStage
                  pipelineId={effectivePipelineId}
                  onContinue={() => setActiveStage('voice')}
                />
              )}
              {activeStage === 'voice' && (
                <VoiceStage
                  pipelineId={effectivePipelineId}
                  onContinue={() => setActiveStage('final_video')}
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
                />
              )}
            </>
          )}
        </div>

        {/* Credits display */}
        <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/30">
          <span className="text-sm text-muted-foreground">
            Available Credits: {profile?.credits?.toFixed(2) || '0.00'}
          </span>
          <span className="text-xs text-muted-foreground">
            Progress is automatically saved
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
