import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Video, Image as ImageIcon, FileAudio, Loader2, Download, Sparkles, X, Upload, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { generateFinalVideo } from '@/lib/pipeline-service';
import { calculateVideoCost } from '@/types/pipeline';
import { toast } from 'sonner';
import StageLayout from './StageLayout';

interface FinalVideoStageProps {
  pipelineId: string;
  onComplete: () => void;
}

const GENERATION_STEPS = [
  { label: 'Preparing assets', duration: 5 },
  { label: 'Processing first frame', duration: 10 },
  { label: 'Syncing audio', duration: 15 },
  { label: 'Rendering video', duration: 45 },
  { label: 'Finalizing output', duration: 10 },
];

const TOTAL_ESTIMATED_TIME = GENERATION_STEPS.reduce((sum, step) => sum + step.duration, 0);

export default function FinalVideoStage({ pipelineId, onComplete }: FinalVideoStageProps) {
  const { pipeline, updateFinalVideo, updateScript, updateFirstFrame, updateVoice, isUpdating } = usePipeline(pipelineId);
  
  const [resolution, setResolution] = useState<string>(pipeline?.final_video_input?.resolution || '720p');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isScriptOpen, setIsScriptOpen] = useState(false);
  const [editableScript, setEditableScript] = useState('');
  const [isScriptEditing, setIsScriptEditing] = useState(false);
  
  // Custom uploads
  const [customFirstFrame, setCustomFirstFrame] = useState<string | null>(null);
  const [customVoice, setCustomVoice] = useState<{ url: string; duration: number } | null>(null);
  const [isDraggingFirstFrame, setIsDraggingFirstFrame] = useState(false);
  const [isDraggingVoice, setIsDraggingVoice] = useState(false);
  
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  // Get outputs from previous stages
  const originalFirstFrameUrl = pipeline?.first_frame_output?.url;
  const originalScriptText = pipeline?.script_output?.text;
  const originalVoiceUrl = pipeline?.voice_output?.url;
  const originalVoiceDuration = pipeline?.voice_output?.duration_seconds || 0;

  // Use custom uploads if available, otherwise use originals
  const firstFrameUrl = customFirstFrame || originalFirstFrameUrl;
  const scriptText = editableScript || originalScriptText || '';
  const voiceUrl = customVoice?.url || originalVoiceUrl;
  const voiceDurationRaw = customVoice?.duration || originalVoiceDuration;
  const voiceDuration = Math.floor(voiceDurationRaw);

  const estimatedCost = calculateVideoCost(voiceDuration);
  const hasFirstFrame = !!firstFrameUrl;
  const hasVoice = !!voiceUrl;
  const canGenerate = hasFirstFrame && hasVoice;
  const hasOutput = !!pipeline?.final_video_output?.url;
  const outputVideo = pipeline?.final_video_output;
  const isProcessing = pipeline?.status === 'processing';

  // Initialize editable script when pipeline loads
  useEffect(() => {
    if (originalScriptText && !editableScript) {
      setEditableScript(originalScriptText);
    }
  }, [originalScriptText]);

  const formatCredits = (credits: number) => {
    const rounded = Math.round(credits * 1000) / 1000;
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

  const handleVoiceUpload = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setCustomVoice({ url, duration: audio.duration });
      toast.success('Voice file uploaded');
    };
    audio.onerror = () => {
      toast.error('Could not load audio file');
    };
  };

  const handleVoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVoiceUpload(file);
  };

  const handleVoiceDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingVoice(false);
    const file = e.dataTransfer.files[0];
    if (file) handleVoiceUpload(file);
  };

  const handleRemoveFirstFrame = async () => {
    setCustomFirstFrame(null);
    if (firstFrameInputRef.current) {
      firstFrameInputRef.current.value = '';
    }
    // Also clear the original if we want to allow re-upload
    await updateFirstFrame({ output: null });
  };

  const handleRemoveVoice = async () => {
    setCustomVoice(null);
    if (voiceInputRef.current) {
      voiceInputRef.current.value = '';
    }
    // Also clear the original voice
    await updateVoice({ output: null });
  };

  const handleSaveScript = async () => {
    if (editableScript !== originalScriptText) {
      const charCount = editableScript.length;
      const estimatedDuration = Math.ceil(charCount / 15); // Rough estimate: 15 chars per second
      await updateScript({
        output: { text: editableScript, char_count: charCount, estimated_duration: estimatedDuration }
      });
      toast.success('Script saved');
    }
    setIsScriptEditing(false);
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error('Missing inputs', { description: 'Please provide first frame and voice audio' });
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

      {/* Script Preview - Collapsible & Editable */}
      <div className="space-y-2">
        <Collapsible open={isScriptOpen} onOpenChange={setIsScriptOpen}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
              <Sparkles className="h-4 w-4 text-primary" />
              Script
              {isScriptOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            {isScriptOpen && (
              <div className="flex items-center gap-1">
                {isScriptEditing ? (
                  <Button variant="ghost" size="sm" onClick={handleSaveScript}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setIsScriptEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
            )}
          </div>
          <CollapsibleContent className="mt-2">
            {isScriptEditing ? (
              <Textarea
                value={editableScript}
                onChange={(e) => setEditableScript(e.target.value)}
                className="min-h-[120px] text-sm"
                placeholder="Enter your script..."
              />
            ) : scriptText ? (
              <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{scriptText}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No script available</p>
            )}
          </CollapsibleContent>
        </Collapsible>
        {!isScriptOpen && scriptText && (
          <p className="text-xs text-muted-foreground truncate">{scriptText.substring(0, 50)}...</p>
        )}
      </div>

      {/* Voice Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileAudio className="h-4 w-4 text-primary" />
          Voice {voiceDuration > 0 && `(${formatDuration(voiceDuration)})`}
        </div>
        <input
          ref={voiceInputRef}
          type="file"
          accept="audio/*"
          onChange={handleVoiceFileChange}
          className="hidden"
        />
        {voiceUrl ? (
          <div className="relative group">
            <button
              type="button"
              onClick={handleRemoveVoice}
              className="absolute -top-2 -left-2 z-10 rounded-full bg-foreground/80 p-1.5 text-background backdrop-blur transition-all duration-200 hover:bg-foreground opacity-0 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
            <audio src={voiceUrl} controls className="w-full h-10" />
          </div>
        ) : (
          <div 
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDraggingVoice 
                ? "border-primary bg-primary/10" 
                : "border-muted-foreground/30 hover:border-primary/50"
            )}
            onClick={() => voiceInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingVoice(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDraggingVoice(false); }}
            onDrop={handleVoiceDrop}
          >
            <Upload className={cn("h-6 w-6 mx-auto mb-2", isDraggingVoice ? "text-primary" : "text-muted-foreground")} />
            <p className="text-sm text-muted-foreground">
              {isDraggingVoice ? "Drop audio here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A</p>
          </div>
        )}
      </div>
    </div>
  );

  const creditsInfo = hasVoice ? (
    <p className="text-xs text-center text-muted-foreground">
      0.2 credits per second ({formatDuration(voiceDuration)} = {formatCredits(estimatedCost)} credits)
    </p>
  ) : null;

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
          <p className="text-sm text-muted-foreground">
            {canGenerate 
              ? 'Click generate to create your final video' 
              : 'Upload first frame and voice audio to generate'}
          </p>
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
      generateDisabled={!canGenerate}
      canContinue={hasOutput}
      generateLabel={
        isGenerating || isProcessing 
          ? 'Generating Final Video...' 
          : `Generate Final Video • ${formatCredits(estimatedCost)} Credits`
      }
      creditsCost=""
      creditsInfo={creditsInfo}
      outputActions={outputActions}
    />
  );
}