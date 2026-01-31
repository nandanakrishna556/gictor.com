import React, { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Download, X, Loader2, AlertCircle, Mic, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { uploadToR2, validateFile } from '@/lib/cloudflare-upload';
import { supabase } from '@/integrations/supabase/client';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { useQueryClient } from '@tanstack/react-query';

interface LipSyncStageProps {
  pipelineId: string;
  onComplete: () => void;
}

const MAX_AUDIO_SECONDS = 600; // 10 minutes
const CREDIT_COST_PER_SECOND = 0.15;
const MIN_CREDIT_COST = 0.15;

export default function LipSyncStage({ pipelineId, onComplete }: LipSyncStageProps) {
  const { pipeline, updateFinalVideo, isUpdating } = usePipeline(pipelineId);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  
  // Input mode
  const [mode, setMode] = useState<InputMode>('generate');
  
  // Input state - use first frame and audio from pipeline
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioError] = useState<string | null>(null);
  
  // Upload mode state (for first frame override)
  const [overrideImageUrl, setOverrideImageUrl] = useState<string | undefined>();
  const [overrideAudioUrl, setOverrideAudioUrl] = useState<string | undefined>();
  const [overrideAudioDuration, setOverrideAudioDuration] = useState<number>(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  
  // Upload video state
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Generation state - local only for instant feedback before server confirms
  const [localGenerating, setLocalGenerating] = useState(false);

  // Get the actual image and audio to use (override or from pipeline)
  const effectiveImageUrl = overrideImageUrl || imageUrl;
  const effectiveAudioUrl = overrideAudioUrl || audioUrl;
  const effectiveAudioDuration = overrideAudioUrl ? overrideAudioDuration : audioDuration;

  // Calculate credit cost
  const creditCost = Math.max(MIN_CREDIT_COST, Math.ceil(effectiveAudioDuration * CREDIT_COST_PER_SECOND * 100) / 100);
  
  // Derive generating state from server - server is source of truth
  // Only show generating if server is processing THIS specific stage
  const pipelineStatus = pipeline?.status;
  const pipelineStage = pipeline?.current_stage;
  const isServerProcessingThisStage = pipelineStatus === 'processing' && pipelineStage === 'lip_sync';
  // Force generating to false if we already have output
  const hasOutputForGenerating = !!pipeline?.final_video_output?.url;
  const isGenerating = hasOutputForGenerating ? false : (localGenerating || isServerProcessingThisStage);

  // Load existing data from pipeline
  useEffect(() => {
    if (pipeline) {
      // Get first frame from pipeline
      if (pipeline.first_frame_output?.url) {
        setImageUrl(pipeline.first_frame_output.url);
      }
      // Get audio from voice output
      if (pipeline.voice_output?.url) {
        setAudioUrl(pipeline.voice_output.url);
        setAudioDuration(pipeline.voice_output.duration_seconds || 0);
      }
    }
  }, [pipeline]);

  // Auto-detect audio duration from audio element
  useEffect(() => {
    if (effectiveAudioUrl && audioDuration === 0 && !overrideAudioUrl) {
      const audio = new Audio(effectiveAudioUrl);
      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && audio.duration > 0) {
          setAudioDuration(audio.duration);
        }
      });
      audio.addEventListener('error', () => {
        // Set default duration to allow generation
        setAudioDuration(2);
      });
    }
  }, [effectiveAudioUrl, audioDuration, overrideAudioUrl]);

  // Handle completion toasts
  useEffect(() => {
    if (pipeline) {
      if (pipeline.status === 'completed' && pipeline.final_video_output?.url) {
        if (localGenerating) {
          setLocalGenerating(false);
          toast.success('Lip sync video generated!');
        }
      } else if (pipeline.status === 'failed') {
        if (localGenerating) {
          setLocalGenerating(false);
          toast.error('Generation failed');
        }
      } else if (pipeline.status === 'processing' && pipeline.current_stage === 'lip_sync') {
        // Server confirmed processing - clear local state
        setLocalGenerating(false);
      }
    }
  }, [pipeline, localGenerating]);

  // Audio upload handlers
  const processAudioFile = async (file: File) => {
    const audioAllowedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
      'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm'
    ];
    
    const validation = validateFile(file, {
      allowedTypes: audioAllowedTypes,
      maxSize: 50 * 1024 * 1024
    });
    
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }
    
    setIsUploadingAudio(true);
    
    try {
      const duration = await getAudioDuration(file);
      
      if (duration > MAX_AUDIO_SECONDS) {
        toast.error(`Audio must be less than ${MAX_AUDIO_SECONDS / 60} minutes`);
        setIsUploadingAudio(false);
        return;
      }
      
      const url = await uploadToR2(file, {
        folder: 'lip-sync-audio',
        allowedTypes: audioAllowedTypes,
        maxSize: 50 * 1024 * 1024
      });
      
      setOverrideAudioUrl(url);
      setOverrideAudioDuration(duration);
      toast.success('Audio uploaded');
    } catch (error) {
      toast.error('Failed to upload audio');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => reject(new Error('Failed to load audio'));
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleAudioDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAudio(true);
  }, []);

  const handleAudioDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAudio(false);
  }, []);

  const handleAudioDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAudio(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processAudioFile(files[0]);
    }
  }, []);

  const handleRemoveOverrideAudio = () => {
    setOverrideAudioUrl(undefined);
    setOverrideAudioDuration(0);
  };

  const handleGenerate = async () => {
    if (mode === 'upload') {
      if (!uploadedVideoUrl) {
        toast.error('Please upload a video first');
        return;
      }
      // Save uploaded video as final output
      await updateFinalVideo({
        output: { 
          url: uploadedVideoUrl, 
          duration_seconds: 0, 
          generated_at: new Date().toISOString() 
        },
      });
      toast.success('Video saved!');
      onComplete();
      return;
    }

    // Generate mode
    if (!effectiveImageUrl || !effectiveAudioUrl) {
      toast.error('First frame and speech audio are required');
      return;
    }

    if ((profile?.credits ?? 0) < creditCost) {
      toast.error('Insufficient credits', { 
        description: `You need ${creditCost.toFixed(2)} credits but have ${profile?.credits ?? 0}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    setLocalGenerating(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Update pipeline status
      await supabase
        .from('pipelines')
        .update({
          status: 'processing',
          current_stage: 'lip_sync',
          final_video_input: {
            first_frame_url: effectiveImageUrl,
            audio_url: effectiveAudioUrl,
            audio_duration: effectiveAudioDuration,
          },
        })
        .eq('id', pipelineId);

      // Prepare payload for edge function
      const requestPayload = {
        type: 'lip_sync',
        payload: {
          file_id: pipelineId,
          pipeline_id: pipelineId,
          user_id: sessionData.session.user.id,
          project_id: pipeline?.project_id || null,
          image_url: effectiveImageUrl,
          audio_url: effectiveAudioUrl,
          audio_duration: effectiveAudioDuration,
          credits_cost: creditCost,
          supabase_url: import.meta.env.VITE_SUPABASE_URL,
        },
      };

      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: requestPayload,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      toast.success('Lip sync generation started!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Generation error:', error);
      setLocalGenerating(false);
      toast.error('Failed to start generation');
    }
  };

  const processVideoFile = async (file: File) => {
    const validation = validateFile(file, {
      allowedTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
      maxSize: 500 * 1024 * 1024, // 500MB
    });

    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setIsUploadingVideo(true);
    try {
      const url = await uploadToR2(file, {
        folder: 'pipeline-lipsync-uploads',
        allowedTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'],
        maxSize: 500 * 1024 * 1024,
      });
      setUploadedVideoUrl(url);
      toast.success('Video uploaded!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload video');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processVideoFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processVideoFile(files[0]);
    }
  }, []);

  const handleRemoveVideo = () => {
    setUploadedVideoUrl(null);
  };

  const hasOutput = !!pipeline?.final_video_output?.url || !!uploadedVideoUrl;
  const outputVideo = pipeline?.final_video_output;
  // Remove duration requirement - will auto-detect or allow generation without
  const canGenerate = mode === 'upload' ? !!uploadedVideoUrl : (!!effectiveImageUrl && !!effectiveAudioUrl);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownloadVideo = async () => {
    const videoUrl = outputVideo?.url;
    if (!videoUrl) return;
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lip-sync-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Video downloaded');
    } catch (error) {
      toast.error('Failed to download video');
    }
  };

  const inputContent = (
    <div className="space-y-6">
      <InputModeToggle
        mode={mode}
        onModeChange={setMode}
        uploadLabel="Upload"
      />

      {mode === 'generate' ? (
        <>
          {/* First Frame Preview/Override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>First Frame</Label>
              {overrideImageUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setOverrideImageUrl(undefined)}
                >
                  Reset
                </Button>
              )}
            </div>
            {effectiveImageUrl ? (
              <div className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden bg-secondary/30">
                  <img 
                    src={effectiveImageUrl} 
                    alt="First frame" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => {
                    setOverrideImageUrl(undefined);
                    setImageUrl(undefined);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
                {!overrideImageUrl && (
                  <p className="text-xs text-muted-foreground mt-2">From First Frame stage • Drop new image to override</p>
                )}
              </div>
            ) : (
              <SingleImageUpload
                value={overrideImageUrl}
                onChange={setOverrideImageUrl}
              />
            )}
          </div>

          {/* Audio Preview/Override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Speech Audio</Label>
              {overrideAudioUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={handleRemoveOverrideAudio}
                >
                  Reset
                </Button>
              )}
            </div>
            {effectiveAudioUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <audio src={effectiveAudioUrl} controls className="flex-1" />
                  <button
                    onClick={() => {
                      setOverrideAudioUrl(undefined);
                      setAudioUrl(undefined);
                      setAudioDuration(0);
                      setOverrideAudioDuration(0);
                    }}
                    className="p-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Duration: {formatDuration(effectiveAudioDuration)}
                  {!overrideAudioUrl && ' • From Speech stage'}
                </p>
              </div>
            ) : (
              <label 
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors",
                  isDraggingAudio 
                    ? "border-primary bg-primary/10" 
                    : "hover:border-primary/50 hover:bg-secondary/50"
                )}
                onDragOver={handleAudioDragOver}
                onDragLeave={handleAudioDragLeave}
                onDrop={handleAudioDrop}
              >
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processAudioFile(file);
                  }}
                  disabled={isUploadingAudio}
                />
                {isUploadingAudio ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Mic className={cn("h-6 w-6 mb-2", isDraggingAudio ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-sm text-muted-foreground">
                      {isDraggingAudio ? 'Drop audio here' : 'Upload audio or complete Speech stage'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A • Max 50MB</p>
                  </>
                )}
              </label>
            )}
            {audioError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {audioError}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Upload Mode */
        <div className="space-y-4">
          <Label>Upload lip sync video</Label>
          {uploadedVideoUrl ? (
            <div className="relative group">
              <button
                type="button"
                onClick={handleRemoveVideo}
                className="absolute -top-2 -left-2 z-10 rounded-full bg-foreground/80 p-1.5 text-background backdrop-blur transition-all duration-200 hover:bg-foreground opacity-0 group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
              <video src={uploadedVideoUrl} controls className="w-full rounded-xl" />
            </div>
          ) : (
            <label 
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors",
                isDragging 
                  ? "border-primary bg-primary/10" 
                  : "hover:border-primary/50 hover:bg-secondary/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploadingVideo}
              />
              {isUploadingVideo ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className={cn("h-8 w-8 mb-2", isDragging ? "text-primary" : "text-muted-foreground")} />
                  <p className="text-sm text-muted-foreground">
                    {isDragging ? 'Drop your video file here' : 'Drag & drop or click to browse'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WebM • Max 500MB</p>
                </>
              )}
            </label>
          )}
        </div>
      )}
    </div>
  );

  const outputContent = outputVideo ? (
    <div className="space-y-4">
      <div className="aspect-video rounded-xl overflow-hidden bg-black">
        <video 
          src={outputVideo.url} 
          controls 
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  ) : null;

  const outputActions = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleDownloadVideo}>
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
    </div>
  );

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRemix={handleGenerate}
      onContinue={onComplete}
      isGenerating={isGenerating || isUploadingVideo || isUpdating}
      canContinue={hasOutput}
      generateLabel={mode === 'upload' ? 'Save Video • Free' : 'Generate Lip Sync'}
      creditsCost={mode === 'upload' ? '' : `${creditCost.toFixed(2)} credits`}
      generateDisabled={!canGenerate}
      isAIGenerated={mode === 'generate'}
      outputActions={hasOutput ? outputActions : undefined}
      emptyStateIcon={<Wand2 className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />}
      emptyStateTitle="Generated video will appear here"
      emptyStateSubtitle="Provide first frame and speech audio"
    />
  );
}
