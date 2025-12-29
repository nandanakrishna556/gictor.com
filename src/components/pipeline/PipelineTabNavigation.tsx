import React from 'react';
import { cn } from '@/lib/utils';
import StageProgressIndicator from './StageProgressIndicator';

interface Stage {
  key: string;
  label: string;
}

interface PipelineTabNavigationProps {
  stages: Stage[];
  activeStage: string;
  onStageClick: (stageKey: string) => void;
  isStageComplete: (stageKey: string) => boolean;
  getStageProgress: (stageKey: string) => number;
  isStageAccessible?: (stageKey: string) => boolean;
}

export default function PipelineTabNavigation({
  stages,
  activeStage,
  onStageClick,
  isStageComplete,
  getStageProgress,
  isStageAccessible,
}: PipelineTabNavigationProps) {
  return (
    <div className="border-b bg-muted/20">
      <div className="flex">
        {stages.map((stage, index) => {
          const isComplete = isStageComplete(stage.key);
          const isAccessible = isStageAccessible ? isStageAccessible(stage.key) : true;
          const isActive = activeStage === stage.key;
          const progress = getStageProgress(stage.key);

          return (
            <button
              key={stage.key}
              onClick={() => onStageClick(stage.key)}
              disabled={!isAccessible}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-3 transition-all relative",
                isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                isActive 
                  ? "bg-[hsl(24,100%,60%)] text-white" 
                  : "bg-muted/30 hover:bg-muted/50 text-muted-foreground"
              )}
            >
              <StageProgressIndicator
                progress={progress}
                isComplete={isComplete}
                isActive={isActive}
                isAccessible={isAccessible}
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
  );
}
