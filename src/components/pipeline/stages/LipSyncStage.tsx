import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Play, Pause, Download, X, Loader2, Video, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { uploadToR2, validateFile } from '@/lib/cloudflare-upload';
import { supabase } from '@/integrations/supabase/client';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioPlayer } from '@/components/ui/audio-player';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Input mode
  const [mode, setMode] = useState<InputMode>('generate');
  
  // Input state - use first frame from pipeline
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  
  // Upload mode state
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Generation state
  const [localGenerating, setLocalGenerating] = useState(false);
  const generationInitiatedRef = useRef(false);

  // Fetch linked file for realtime updates
  const { data: linkedFile } = useQuery({
    queryKey: ['pipeline-lipsync-file', pipelineId],
    queryFn: async () => {
      const { data } = await supabase
        .from('files')
        .select('*')
        .eq('generation_params->>pipeline_id', pipelineId)
        .eq('file_type', 'lip_sync')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!pipelineId,
    refetchInterval: (query) => {
      const file = query.state.data;
      return (localGenerating || file?.generation_status === 'processing') ? 2000 : false;
    },
  });

  // Calculate credit cost
  const creditCost = Math.max(MIN_CREDIT_COST, Math.ceil(audioDuration * CREDIT_COST_PER_SECOND * 100) / 100);

  // Derive generating state from linked file
  const isServerProcessing = linkedFile?.generation_status === 'processing';
  const isGenerating = localGenerating || (isServerProcessing && generationInitiatedRef.current);

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

  // Watch linked file for completion and sync to pipeline
  useEffect(() => {
    if (!linkedFile || !generationInitiatedRef.current) return;
    
    if (linkedFile.generation_status === 'completed' && linkedFile.download_url) {
      // Sync to pipeline
      updateFinalVideo({
        output: { 
          url: linkedFile.download_url, 
          duration_seconds: audioDuration, 
          generated_at: new Date().toISOString() 
        },
      });
      
      // Clean up the temporary file
      supabase.from('files').delete().eq('id', linkedFile.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['pipeline-lipsync-file', pipelineId] });
      });
      
      setLocalGenerating(false);
      generationInitiatedRef.current = false;
      toast.success('Lip sync video generated!');
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } else if (linkedFile.generation_status === 'failed') {
      setLocalGenerating(false);
      generationInitiatedRef.current = false;
      toast.error(linkedFile.error_message || 'Lip sync generation failed');
    }
  }, [linkedFile, pipelineId, queryClient, updateFinalVideo, audioDuration]);

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
    if (!imageUrl || !audioUrl) {
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
    generationInitiatedRef.current = true;

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Create a temporary file record (same as standalone LipSyncModal)
      const { data: newFile, error: createError } = await supabase
        .from('files')
        .insert({
          name: 'Pipeline Lip Sync',
          file_type: 'lip_sync',
          project_id: pipeline?.project_id,
          status: 'draft',
          generation_status: 'processing',
          generation_started_at: new Date().toISOString(),
          estimated_duration_seconds: Math.max(120, Math.ceil((audioDuration / 8) * 240)),
          generation_params: { 
            pipeline_id: pipelineId,
            first_frame_url: imageUrl,
            audio_url: audioUrl,
            audio_duration: audioDuration,
          }
        })
        .select()
        .single();

      if (createError || !newFile) {
        throw new Error('Failed to create file record');
      }

      // Use 'lip_sync' type like standalone LipSyncModal
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'lip_sync',
          payload: {
            file_id: newFile.id,
            user_id: sessionData.session.user.id,
            project_id: pipeline?.project_id,
            image_url: imageUrl,
            audio_url: audioUrl,
            audio_duration: audioDuration,
            duration_seconds: audioDuration,
            resolution: '720p',
            credits_cost: creditCost,
            supabase_url: import.meta.env.VITE_SUPABASE_URL,
          },
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      toast.success('Lip sync generation started!');
      queryClient.invalidateQueries({ queryKey: ['pipeline-lipsync-file', pipelineId] });
    } catch (error) {
      console.error('Generation error:', error);
      setLocalGenerating(false);
      generationInitiatedRef.current = false;
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
  const canGenerate = mode === 'upload' ? !!uploadedVideoUrl : (!!imageUrl && !!audioUrl && audioDuration > 0);

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
          {/* First Frame Preview */}
          <div className="space-y-2">
            <Label>First Frame</Label>
            {imageUrl ? (
              <div className="aspect-square rounded-xl overflow-hidden bg-secondary/30">
                <img 
                  src={imageUrl} 
                  alt="First frame" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-xl bg-secondary/30 border-2 border-dashed border-border flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Complete First Frame stage first</p>
              </div>
            )}
          </div>

          {/* Audio Preview */}
          <div className="space-y-2">
            <Label>Speech Audio</Label>
            {audioUrl ? (
              <div className="space-y-2">
                <audio src={audioUrl} controls className="w-full" />
                <p className="text-xs text-muted-foreground">
                  Duration: {Math.floor(audioDuration / 60)}:{Math.floor(audioDuration % 60).toString().padStart(2, '0')}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-secondary/30 border-2 border-dashed border-border flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Complete Speech stage first</p>
              </div>
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
            <Upload className={cn("h-8 w-8 mb-2", isDragging ? "text-primary" : "text-muted-foreground")} />
            <p className="text-sm text-muted-foreground">
              {isUploadingVideo ? 'Uploading...' : isDragging ? 'Drop your video file here' : 'Drag & drop or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">MP4, MOV, WebM • Max 500MB</p>
          </label>
          {uploadedVideoUrl && (
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
      emptyStateIcon={<Video className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />}
      emptyStateTitle="Generated video will appear here"
      emptyStateSubtitle="Provide first frame and speech audio"
    />
  );
}
