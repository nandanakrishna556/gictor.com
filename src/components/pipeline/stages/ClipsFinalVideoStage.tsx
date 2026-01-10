import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Video, Image as ImageIcon, Loader2, Download, X, Upload, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { toast } from 'sonner';
import StageLayout from './StageLayout';

interface BRollFinalVideoStageProps {
  pipelineId: string;
  onComplete: () => void;
  stageNavigation?: React.ReactNode;
}

const GENERATION_STEPS = [
  { label: 'Preparing first frame', duration: 5 },
  { label: 'Analyzing motion prompt', duration: 5 },
  { label: 'Generating video frames', duration: 30 },
  { label: 'Rendering final video', duration: 15 },
  { label: 'Finalizing output', duration: 5 },
];

const TOTAL_ESTIMATED_TIME = GENERATION_STEPS.reduce((sum, step) => sum + step.duration, 0);

// B-Roll video cost is based on duration
const BROLL_CREDITS_PER_SECOND = 0.2;

export default function BRollFinalVideoStage({ pipelineId, onComplete, stageNavigation }: BRollFinalVideoStageProps) {
  const { pipeline, updateFinalVideo, updateFirstFrame, isUpdating } = usePipeline(pipelineId);
  
  const [resolution, setResolution] = useState<string>(pipeline?.final_video_input?.resolution || '720p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Custom first frame upload
  const [customFirstFrame, setCustomFirstFrame] = useState<string | null>(null);
  const [isDraggingFirstFrame, setIsDraggingFirstFrame] = useState(false);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);

  // Get outputs from previous stages
  const originalFirstFrameUrl = pipeline?.first_frame_output?.url;
  const promptText = pipeline?.script_output?.text || '';
  const promptInput = pipeline?.script_input as any;
  const durationSeconds = promptInput?.duration_seconds || 5;
  const cameraMotion = promptInput?.camera_motion || 'static';
  const motionIntensity = promptInput?.motion_intensity || 50;

  // Use custom upload if available, otherwise use original
  const firstFrameUrl = customFirstFrame || originalFirstFrameUrl;

  const estimatedCost = durationSeconds * BROLL_CREDITS_PER_SECOND;
  const hasFirstFrame = !!firstFrameUrl;
  const hasPrompt = !!promptText;
  const canGenerate = hasFirstFrame && hasPrompt;
  const hasOutput = !!pipeline?.final_video_output?.url;
  const outputVideo = pipeline?.final_video_output;
  const isProcessing = pipeline?.status === 'processing';

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
        
        let accumulated = 0;
        for (let i = 0; i < GENERATION_STEPS.length; i++) {
          accumulated += GENERATION_STEPS[i].duration;
          if (newElapsed <= accumulated) {
            setCurrentStep(i);
            break;
          }
        }
        
        const progress = Math.min(95, (newElapsed / TOTAL_ESTIMATED_TIME) * 100);
        setGenerationProgress(progress);
        
        return newElapsed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing]);

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

  const formatCredits = (credits: number) => {
    const rounded = Math.round(credits * 1000) / 1000;
    return rounded.toString();
  };

  const handleFirstFrameUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const url = URL.createObjectURL(file);
    setCustomFirstFrame(url);
    toast.success('First frame uploaded');
  };

  const handleFirstFrameFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFirstFrameUpload(file);
  };

  const handleFirstFrameDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFirstFrame(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFirstFrameUpload(file);
  };

  const handleRemoveFirstFrame = async () => {
    setCustomFirstFrame(null);
    if (firstFrameInputRef.current) {
      firstFrameInputRef.current.value = '';
    }
    await updateFirstFrame({ output: null });
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error('Missing inputs', { description: 'Please provide first frame and motion prompt' });
      return;
    }

    setIsGenerating(true);
    try {
      await updateFinalVideo({
        input: { resolution: resolution as '480p' | '720p' | '1080p' },
        status: 'processing',
      });

      // Call the n8n webhook for B-Roll video generation
      const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';
      const N8N_API_KEY = import.meta.env.VITE_N8N_API_KEY || '';

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': N8N_API_KEY,
        },
        body: JSON.stringify({ 
          type: 'pipeline_final_video_b_roll',
          payload: {
            pipeline_id: pipelineId,
            first_frame_url: firstFrameUrl,
            motion_prompt: promptText,
            duration_seconds: durationSeconds,
            camera_motion: cameraMotion,
            motion_intensity: motionIntensity,
            resolution,
            pipeline_type: 'b_roll',
          }
        }),
      });

      if (!response.ok) {
        await updateFinalVideo({ status: 'failed' });
        toast.error('Generation failed');
        return;
      }

      toast.success('B-Roll video generation started!');
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
        <input
          ref={firstFrameInputRef}
          type="file"
          accept="image/*"
          onChange={handleFirstFrameFileChange}
          className="hidden"
        />
        {firstFrameUrl ? (
          <div className="relative w-full max-w-[200px] group">
            <img 
              src={firstFrameUrl} 
              alt="First frame" 
              className="w-full h-auto max-h-[150px] object-contain rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemoveFirstFrame}
              className="absolute left-2 top-2 rounded-full bg-foreground/80 p-1.5 text-background backdrop-blur transition-all duration-200 hover:bg-foreground opacity-0 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div 
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDraggingFirstFrame 
                ? "border-primary bg-primary/10" 
                : "border-muted-foreground/30 hover:border-primary/50"
            )}
            onClick={() => firstFrameInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingFirstFrame(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDraggingFirstFrame(false); }}
            onDrop={handleFirstFrameDrop}
          >
            <Upload className={cn("h-6 w-6 mx-auto mb-2", isDraggingFirstFrame ? "text-primary" : "text-muted-foreground")} />
            <p className="text-sm text-muted-foreground">
              {isDraggingFirstFrame ? "Drop image here" : "Drag & drop or click to upload"}
            </p>
          </div>
        )}
      </div>

      {/* Motion Prompt Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Motion Settings
        </div>
        {promptText ? (
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-3">{promptText}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-secondary px-2 py-1 rounded">{durationSeconds}s</span>
              <span className="bg-secondary px-2 py-1 rounded">{cameraMotion}</span>
              {cameraMotion !== 'static' && (
                <span className="bg-secondary px-2 py-1 rounded">{motionIntensity}% intensity</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No motion prompt set</p>
        )}
      </div>

      {/* Resolution */}
      <div className="space-y-2">
        <Label>Resolution</Label>
        <Select value={resolution} onValueChange={setResolution}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="480p">480p (Fast)</SelectItem>
            <SelectItem value="720p">720p (Standard)</SelectItem>
            <SelectItem value="1080p">1080p (High Quality)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const creditsInfo = (
    <p className="text-xs text-center text-muted-foreground">
      {BROLL_CREDITS_PER_SECOND} credits per second ({durationSeconds}s = {formatCredits(estimatedCost)} credits)
    </p>
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
              <p className="text-lg font-medium">Generating your B-Roll video...</p>
              <p className="text-sm text-primary font-medium">
                {GENERATION_STEPS[currentStep]?.label || 'Processing...'}
              </p>
            </div>
            
            <div className="space-y-2">
            </div>
            
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
          <p className="text-lg font-medium">Generate B-Roll Video</p>
          <p className="text-sm text-muted-foreground">
            Animate your first frame with the motion settings
          </p>
          {creditsInfo}
        </div>
      )}
    </div>
  );

  const outputActions = hasOutput ? (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <a href={outputVideo?.url} download>
          <Download className="h-4 w-4 mr-2" />
          Download
        </a>
      </Button>
    </div>
  ) : undefined;

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRemix={handleGenerate}
      isGenerating={isGenerating || isUpdating || isProcessing}
      canContinue={hasOutput}
      onContinue={onComplete}
      generateLabel={isProcessing ? 'Generating...' : 'Generate Video'}
      creditsCost={`${formatCredits(estimatedCost)} Credits`}
      outputActions={outputActions}
      generateDisabled={!canGenerate}
    />
  );
}
