import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Video, Image as ImageIcon, FileAudio, Loader2, Download, CheckCircle, Sparkles } from 'lucide-react';
import { usePipeline } from '@/hooks/usePipeline';
import { generateFinalVideo } from '@/lib/pipeline-service';
import { calculateVideoCost } from '@/types/pipeline';
import { toast } from 'sonner';
import StageLayout from './StageLayout';

interface FinalVideoStageProps {
  pipelineId: string;
  onComplete: () => void;
  stageNavigation?: React.ReactNode;
}

const GENERATION_STEPS = [
  { label: 'Preparing assets', duration: 5 },
  { label: 'Processing first frame', duration: 10 },
  { label: 'Syncing audio', duration: 15 },
  { label: 'Rendering video', duration: 45 },
  { label: 'Finalizing output', duration: 10 },
];

const TOTAL_ESTIMATED_TIME = GENERATION_STEPS.reduce((sum, step) => sum + step.duration, 0);

export default function FinalVideoStage({ pipelineId, onComplete, stageNavigation }: FinalVideoStageProps) {
  const { pipeline, updateFinalVideo, isUpdating } = usePipeline(pipelineId);
  
  const [resolution, setResolution] = useState<string>(pipeline?.final_video_input?.resolution || '720p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Get outputs from previous stages
  const firstFrameUrl = pipeline?.first_frame_output?.url;
  const scriptText = pipeline?.script_output?.text;
  const voiceUrl = pipeline?.voice_output?.url;
  const voiceDurationRaw = pipeline?.voice_output?.duration_seconds || 0;
  const voiceDuration = Math.floor(voiceDurationRaw); // Use whole seconds for billing

  const estimatedCost = calculateVideoCost(voiceDuration);
  const hasAllInputs = firstFrameUrl && scriptText && voiceUrl;
  const hasOutput = !!pipeline?.final_video_output?.url;
  const outputVideo = pipeline?.final_video_output;
  const isProcessing = pipeline?.status === 'processing';

  // Format credits to show exact value without unnecessary trailing zeros
  const formatCredits = (credits: number) => {
    // Round to 3 decimal places to avoid floating point issues
    const rounded = Math.round(credits * 1000) / 1000;
    // Remove trailing zeros but keep at least 2 decimal places if needed
    return rounded.toString();
  };

  // Progress simulation during generation
  useEffect(() => {
    if (!isProcessing) {
      setGenerationProgress(0);
      setCurrentStep(0);
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newElapsed = prev + 1;
        
        // Calculate current step based on elapsed time
        let accumulated = 0;
        for (let i = 0; i < GENERATION_STEPS.length; i++) {
          accumulated += GENERATION_STEPS[i].duration;
          if (newElapsed <= accumulated) {
            setCurrentStep(i);
            break;
          }
        }
        
        // Calculate progress (cap at 95% until actually complete)
        const progress = Math.min(95, (newElapsed / TOTAL_ESTIMATED_TIME) * 100);
        setGenerationProgress(progress);
        
        return newElapsed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // When output arrives, complete the progress
  useEffect(() => {
    if (hasOutput && isProcessing) {
      setGenerationProgress(100);
    }
  }, [hasOutput, isProcessing]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = () => {
    const remaining = Math.max(0, TOTAL_ESTIMATED_TIME - elapsedTime);
    if (remaining <= 0) return 'Almost done...';
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    if (mins > 0) return `~${mins}m ${secs}s remaining`;
    return `~${secs}s remaining`;
  };

  const handleGenerate = async () => {
    if (!hasAllInputs) {
      toast.error('Missing inputs', { description: 'Please complete all previous stages first' });
      return;
    }

    setIsGenerating(true);
    try {
      await updateFinalVideo({
        input: { resolution: resolution as '480p' | '720p' | '1080p' },
        status: 'processing',
      });

      const result = await generateFinalVideo(pipelineId, {
        first_frame_url: firstFrameUrl!,
        audio_url: voiceUrl!,
        audio_duration_seconds: voiceDuration,
        resolution,
      });

      if (!result.success) {
        toast.error(result.error || 'Generation failed');
        await updateFinalVideo({ status: 'failed' });
        return;
      }

      toast.success('Final video generation started!');
    } catch (error) {
      toast.error('Failed to start generation');
      await updateFinalVideo({ status: 'failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  const inputContent = (
    <div className="space-y-6">
      <h3 className="font-medium text-lg">Summary</h3>

      {/* First Frame Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="h-4 w-4 text-primary" />
          First Frame
        </div>
        {firstFrameUrl ? (
          <div className="w-full max-w-[200px]">
            <img 
              src={firstFrameUrl} 
              alt="First frame" 
              className="w-full h-auto max-h-[150px] object-contain rounded-lg"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not completed</p>
        )}
      </div>

      {/* Script Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Script
        </div>
        {scriptText ? (
          <div className="bg-muted/50 rounded-lg p-3 max-h-24 overflow-y-auto">
            <p className="text-sm text-muted-foreground line-clamp-4">{scriptText}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not completed</p>
        )}
      </div>

      {/* Voice Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileAudio className="h-4 w-4 text-primary" />
          Voice ({formatDuration(voiceDuration)})
        </div>
        {voiceUrl ? (
          <audio src={voiceUrl} controls className="w-full h-10" />
        ) : (
          <p className="text-sm text-muted-foreground">Not completed</p>
        )}
      </div>

      {/* Cost info */}
      <p className="text-xs text-center text-muted-foreground pt-2 border-t">
        0.2 credits per second ({formatDuration(voiceDuration)} = {formatCredits(estimatedCost)} credits)
      </p>
    </div>
  );

  const outputContent = (
    <div className="flex items-center justify-center min-h-[300px]">
      {hasOutput && outputVideo ? (
        <div className="w-full max-w-lg space-y-4">
          <video 
            src={outputVideo.url} 
            controls 
            className="w-full aspect-video rounded-xl bg-black"
          />
          <span className="text-sm text-muted-foreground block text-center">
            Duration: {formatDuration(outputVideo.duration_seconds)}
          </span>
        </div>
      ) : isProcessing ? (
        <div className="flex flex-col items-center justify-center text-center gap-6 w-full max-w-md">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="w-full space-y-3">
            <div className="space-y-1">
              <p className="text-lg font-medium">Generating your video...</p>
              <p className="text-sm text-primary font-medium">
                {GENERATION_STEPS[currentStep]?.label || 'Processing...'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Progress value={generationProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(generationProgress)}% complete</span>
                <span>{formatTimeRemaining()}</span>
              </div>
            </div>
            
            {/* Step indicators */}
            <div className="flex justify-center gap-1.5 pt-2">
              {GENERATION_STEPS.map((step, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    idx < currentStep 
                      ? 'bg-primary' 
                      : idx === currentStep 
                        ? 'bg-primary/60 animate-pulse' 
                        : 'bg-muted'
                  }`}
                  title={step.label}
                />
              ))}
            </div>
          </div>
        </div>
      ) : pipeline?.status === 'failed' ? (
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <p className="text-lg font-medium text-destructive">Generation failed</p>
          <p className="text-sm text-muted-foreground">Please try again</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <Video className="h-16 w-16 text-muted-foreground/50" />
          <p className="text-lg font-medium">No video generated yet</p>
          <p className="text-sm text-muted-foreground">Complete all stages and generate your final video</p>
        </div>
      )}
    </div>
  );

  const outputActions = hasOutput && outputVideo && (
    <Button variant="ghost" size="sm" asChild>
      <a href={outputVideo.url} download>
        <Download className="h-4 w-4 mr-1.5" />
        Download
      </a>
    </Button>
  );

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onContinue={onComplete}
      isGenerating={isGenerating || isProcessing}
      canContinue={hasOutput}
      generateLabel={
        isGenerating || isProcessing 
          ? 'Generating Final Video...' 
          : `Generate Final Video • ${formatCredits(estimatedCost)} Credits`
      }
      creditsCost=""
      outputActions={outputActions}
      stageNavigation={stageNavigation}
    />
  );
}
