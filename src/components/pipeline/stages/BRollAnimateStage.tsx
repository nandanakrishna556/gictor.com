import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Video, Image as ImageIcon, Loader2, Download, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { useQueryClient } from '@tanstack/react-query';

interface BRollAnimateStageProps {
  pipelineId: string;
  onComplete: () => void;
}

const CREDIT_COST_PER_SECOND = 0.15;

const DURATION_OPTIONS = [
  { value: 4, label: '4 seconds' },
  { value: 6, label: '6 seconds' },
  { value: 8, label: '8 seconds' },
  { value: 10, label: '10 seconds' },
  { value: 12, label: '12 seconds' },
];

export default function BRollAnimateStage({ pipelineId, onComplete }: BRollAnimateStageProps) {
  const { pipeline, updateVoice, updateFinalVideo, isUpdating } = usePipeline(pipelineId);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  
  // Use voice_input/voice_output for animate settings (since it's unused in B-Roll)
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(8);
  const [cameraFixed, setCameraFixed] = useState(false);
  
  // Custom frame uploads (override the generated ones)
  const [customFirstFrame, setCustomFirstFrame] = useState<string | null>(null);
  const [customLastFrame, setCustomLastFrame] = useState<string | null>(null);
  const [isDraggingFirst, setIsDraggingFirst] = useState(false);
  const [isDraggingLast, setIsDraggingLast] = useState(false);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  
  // Generation state
  const [localGenerating, setLocalGenerating] = useState(false);
  const isLocalGeneratingRef = useRef(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastShownRef = useRef<string | null>(null);

  // Get frames from pipeline
  const originalFirstFrame = pipeline?.first_frame_output?.url;
  const originalLastFrame = (pipeline?.script_output as any)?.last_frame_url;
  
  // Use custom if available, otherwise use original
  const firstFrameUrl = customFirstFrame || originalFirstFrame;
  const lastFrameUrl = customLastFrame || originalLastFrame;
  
  // Output from final_video_output
  const outputVideo = pipeline?.final_video_output;
  const hasOutput = !!outputVideo?.url;
  
  // Check if processing
  const isProcessing = pipeline?.status === 'processing' && pipeline?.current_stage === 'final_video';
  const isGenerating = localGenerating || isProcessing;
  
  // Credit cost
  const creditCost = Math.ceil(duration * CREDIT_COST_PER_SECOND * 100) / 100;
  
  // Can generate
  const canGenerate = !!firstFrameUrl && !isGenerating && profile && (profile.credits ?? 0) >= creditCost;

  // Load existing data from voice_input (repurposed for animate settings)
  useEffect(() => {
    if (pipeline?.voice_input) {
      const input = pipeline.voice_input as any;
      if (input.animation_type === 'broll') {
        setPrompt(input.prompt || '');
        setDuration(input.duration || 8);
        setCameraFixed(input.camera_fixed || false);
      }
    }
    
    // Initialize prev status
    if (prevStatusRef.current === null && pipeline) {
      prevStatusRef.current = pipeline.status;
      if (hasOutput) {
        toastShownRef.current = pipelineId;
      }
    }
  }, [pipeline?.voice_input, pipeline?.status, hasOutput, pipelineId]);

  // Handle status transitions
  useEffect(() => {
    if (!pipeline) return;
    
    const currentStatus = pipeline.status;
    const prevStatus = prevStatusRef.current;
    
    if (isLocalGeneratingRef.current && currentStatus === 'processing') {
      isLocalGeneratingRef.current = false;
      setLocalGenerating(false);
    }
    
    // Completed transition
    if (prevStatus === 'processing' && currentStatus === 'completed' && pipeline.final_video_output?.url) {
      if (toastShownRef.current !== pipelineId + '_animate') {
        toastShownRef.current = pipelineId + '_animate';
        toast.success('Video generated!');
        queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      }
      setLocalGenerating(false);
    }
    
    // Failed
    if (prevStatus === 'processing' && currentStatus === 'failed') {
      toast.error('Generation failed');
      setLocalGenerating(false);
    }
    
    prevStatusRef.current = currentStatus;
  }, [pipeline, pipelineId, queryClient]);

  // Save input changes
  const saveInput = async () => {
    await updateVoice({
      input: {
        animation_type: 'broll',
        prompt,
        duration,
        camera_fixed: cameraFixed,
        first_frame_url: firstFrameUrl,
        last_frame_url: lastFrameUrl,
      } as any,
    });
  };

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(saveInput, 500);
    return () => clearTimeout(timer);
  }, [prompt, duration, cameraFixed, firstFrameUrl, lastFrameUrl]);

  const handleFrameUpload = (file: File, isFirst: boolean) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const url = URL.createObjectURL(file);
    if (isFirst) {
      setCustomFirstFrame(url);
    } else {
      setCustomLastFrame(url);
    }
    toast.success(`${isFirst ? 'First' : 'Last'} frame uploaded`);
  };

  const handleDrop = (e: React.DragEvent, isFirst: boolean) => {
    e.preventDefault();
    if (isFirst) setIsDraggingFirst(false);
    else setIsDraggingLast(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFrameUpload(file, isFirst);
  };

  const handleGenerate = async () => {
    if (!firstFrameUrl) {
      toast.error('Please add a first frame');
      return;
    }

    if (!profile || (profile.credits ?? 0) < creditCost) {
      toast.error(`Insufficient credits. You need ${creditCost.toFixed(2)} credits.`);
      return;
    }

    // Immediate feedback
    isLocalGeneratingRef.current = true;
    setLocalGenerating(true);

    try {
      // Save input first
      await saveInput();

      // Update pipeline status
      await updateFinalVideo({
        input: { resolution: '720p' },
        status: 'processing',
      });

      // Call edge function for animate generation
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'animate',
          payload: {
            pipeline_id: pipelineId,
            file_id: pipelineId, // Use pipeline_id as identifier
            first_frame_url: firstFrameUrl,
            last_frame_url: lastFrameUrl || null,
            prompt: prompt || null,
            duration,
            camera_fixed: cameraFixed,
            animation_type: 'broll',
            aspect_ratio: '16:9',
            pipeline_type: 'clips',
          },
        },
      });

      if (error || !data?.success) {
        await updateFinalVideo({ status: 'failed' });
        throw new Error(error?.message || data?.error || 'Generation failed');
      }

      toast.success('Animation generation started!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start generation');
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const inputContent = (
    <div className="space-y-6">
      {/* First Frame */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="h-4 w-4 text-primary" />
          First Frame {!firstFrameUrl && <span className="text-destructive">*</span>}
        </div>
        <input
          ref={firstFrameInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFrameUpload(e.target.files[0], true)}
          className="hidden"
        />
        {firstFrameUrl ? (
          <div className="relative w-full max-w-[150px] group">
            <img src={firstFrameUrl} alt="First frame" className="w-full h-auto max-h-[100px] object-contain rounded-lg" />
            <button
              type="button"
              onClick={() => setCustomFirstFrame(null)}
              className="absolute left-2 top-2 rounded-full bg-foreground/80 p-1 text-background opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
              isDraggingFirst ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50"
            )}
            onClick={() => firstFrameInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingFirst(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDraggingFirst(false); }}
            onDrop={(e) => handleDrop(e, true)}
          >
            <Upload className={cn("h-5 w-5 mx-auto mb-1", isDraggingFirst ? "text-primary" : "text-muted-foreground")} />
            <p className="text-xs text-muted-foreground">Upload first frame</p>
          </div>
        )}
      </div>

      {/* Last Frame (Optional) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          Last Frame <span className="text-muted-foreground text-xs">(optional)</span>
        </div>
        <input
          ref={lastFrameInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFrameUpload(e.target.files[0], false)}
          className="hidden"
        />
        {lastFrameUrl ? (
          <div className="relative w-full max-w-[150px] group">
            <img src={lastFrameUrl} alt="Last frame" className="w-full h-auto max-h-[100px] object-contain rounded-lg" />
            <button
              type="button"
              onClick={() => setCustomLastFrame(null)}
              className="absolute left-2 top-2 rounded-full bg-foreground/80 p-1 text-background opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
              isDraggingLast ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50"
            )}
            onClick={() => lastFrameInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingLast(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDraggingLast(false); }}
            onDrop={(e) => handleDrop(e, false)}
          >
            <Upload className={cn("h-5 w-5 mx-auto mb-1", isDraggingLast ? "text-muted-foreground" : "text-muted-foreground")} />
            <p className="text-xs text-muted-foreground">Upload last frame</p>
          </div>
        )}
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <Label>Motion prompt (optional)</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe how the scene should animate..."
          className="min-h-20 rounded-xl resize-none"
        />
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label>Duration</Label>
        <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value.toString()}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Camera Fixed */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Static camera</Label>
          <p className="text-xs text-muted-foreground">Keep the camera position fixed</p>
        </div>
        <Switch checked={cameraFixed} onCheckedChange={setCameraFixed} />
      </div>
    </div>
  );

  const outputContent = hasOutput && outputVideo ? (
    <div className="w-full max-w-lg mx-auto space-y-4">
      <video src={outputVideo.url} controls className="w-full aspect-video rounded-xl bg-black" />
      <span className="text-sm text-muted-foreground block text-center">
        Duration: {formatDuration(outputVideo.duration_seconds)}
      </span>
    </div>
  ) : isProcessing ? (
    <div className="flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div>
        <p className="text-lg font-medium">Generating video...</p>
        <p className="text-sm text-muted-foreground">This may take a few minutes</p>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center text-center gap-2 min-h-[300px]">
      <Video className="h-16 w-16 text-muted-foreground/50" />
      <p className="text-lg font-medium">Generate Animation</p>
      <p className="text-sm text-muted-foreground">
        Animate your frames into a video
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        {CREDIT_COST_PER_SECOND} credits/second ({duration}s = {creditCost.toFixed(2)} credits)
      </p>
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
      onContinue={onComplete}
      isGenerating={isGenerating || isUpdating}
      canContinue={hasOutput}
      generateLabel={isProcessing ? 'Generating...' : 'Generate Animation'}
      creditsCost={`${creditCost.toFixed(2)} Credits`}
      generateDisabled={!canGenerate}
      outputActions={outputActions}
    />
  );
}
