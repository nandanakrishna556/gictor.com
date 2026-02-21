import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Film, Loader2, Download, Upload, X } from 'lucide-react';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { uploadToR2 } from '@/lib/cloudflare-upload';

interface BRollAnimateStageProps {
  pipelineId: string;
  onComplete: () => void;
}

const CREDIT_COST_PER_SECOND = 0.15;

export default function BRollAnimateStage({ pipelineId, onComplete }: BRollAnimateStageProps) {
  const { user } = useAuth();
  const { pipeline, updateVoice, updateFinalVideo, isUpdating } = usePipeline(pipelineId);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  
  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  
  // Input state
  const [animationType, setAnimationType] = useState<'broll' | 'motion_graphics'>('broll');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [duration, setDuration] = useState(8);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cameraFixed, setCameraFixed] = useState(false);
  const [prompt, setPrompt] = useState('');
  
  // Custom frame uploads (override the generated ones)
  const [firstFrameUrl, setFirstFrameUrl] = useState('');
  const [lastFrameUrl, setLastFrameUrl] = useState('');
  const [isUploadingFirst, setIsUploadingFirst] = useState(false);
  const [isUploadingLast, setIsUploadingLast] = useState(false);
  
  // Upload mode state
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  
  // Generation state
  const [localGenerating, setLocalGenerating] = useState(false);
  const isLocalGeneratingRef = useRef(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastShownRef = useRef<string | null>(null);

  // Get frames from pipeline (from previous stages)
  const originalFirstFrame = pipeline?.first_frame_output?.url;
  // Last frame is stored in last_frame_output by BRollLastFrameStage
  const originalLastFrame = pipeline?.last_frame_output?.url;
  
  // Use custom if available, otherwise use original
  const effectiveFirstFrame = firstFrameUrl || originalFirstFrame;
  const effectiveLastFrame = lastFrameUrl || originalLastFrame;
  
  // Output from final_video_output
  const outputVideo = pipeline?.final_video_output;
  const hasOutput = !!outputVideo?.url;
  
  // Check if THIS SPECIFIC stage is processing (not any other stage)
  const pipelineStatus = pipeline?.status;
  const pipelineStage = pipeline?.current_stage;
  const isServerProcessingThisStage = pipelineStatus === 'processing' && pipelineStage === 'final_video';
  
  // CRITICAL: If we have output, we are NOT generating - output takes precedence
  // Only show generating if: localGenerating (optimistic) OR server confirms THIS stage is processing
  // NEVER show generating if pipeline is processing a DIFFERENT stage (e.g., first_frame)
  const isGenerating = hasOutput ? false : (localGenerating || isServerProcessingThisStage);
  
  // Credit cost
  const creditCost = Math.ceil(duration * CREDIT_COST_PER_SECOND * 100) / 100;
  
  // Validation
  const isMotionGraphics = animationType === 'motion_graphics';
  const hasRequiredInputs = effectiveFirstFrame && (!isMotionGraphics || effectiveLastFrame);
  const canGenerate = hasRequiredInputs && !isGenerating && profile && (profile.credits ?? 0) >= creditCost;

  // Track if we've already loaded the initial data
  const initialLoadDoneRef = useRef(false);
  
  // Load existing data from voice_input (repurposed for animate settings)
  useEffect(() => {
    if (pipeline?.voice_input) {
      const input = pipeline.voice_input as any;
      if (input.animation_type) {
        setAnimationType(input.animation_type);
        setPrompt(input.prompt || '');
        setDuration(input.duration || 8);
        setCameraFixed(input.camera_fixed || false);
        setAspectRatio(input.aspect_ratio || '9:16');
        setAudioEnabled(input.audio_enabled || false);
      }
    }
    
    // Initialize prev status for toast tracking only
    // DO NOT set localGenerating here - isProcessing handles active generation detection
    if (prevStatusRef.current === null && pipeline) {
      prevStatusRef.current = pipeline.status;
      if (hasOutput) {
        toastShownRef.current = pipelineId;
      }
    }
  }, [pipeline?.voice_input, pipeline?.status, hasOutput, pipelineId]);

  // Auto-populate frames from previous stages when they become available
  useEffect(() => {
    // Only auto-populate if user hasn't manually cleared the frame
    if (originalFirstFrame && !firstFrameUrl) {
      setFirstFrameUrl(originalFirstFrame);
    }
  }, [originalFirstFrame]);
  
  useEffect(() => {
    if (originalLastFrame && !lastFrameUrl) {
      setLastFrameUrl(originalLastFrame);
    }
  }, [originalLastFrame]);

  // Handle status transitions - clear localGenerating and show toasts
  useEffect(() => {
    if (!pipeline) return;
    
    const currentStatus = pipeline.status;
    const currentStage = pipeline.current_stage;
    const prevStatus = prevStatusRef.current;
    
    // Clear localGenerating when server confirms THIS stage is processing
    // OR when server is processing a DIFFERENT stage (we definitely shouldn't show generating)
    if (currentStatus === 'processing') {
      if (currentStage === 'final_video' && localGenerating) {
        // Server confirmed - let isServerProcessingThisStage take over
        setLocalGenerating(false);
        isLocalGeneratingRef.current = false;
      } else if (currentStage !== 'final_video' && localGenerating) {
        // Another stage is processing - definitely not us
        setLocalGenerating(false);
        isLocalGeneratingRef.current = false;
      }
    }
    
    // Completed transition - show success toast
    if (prevStatus === 'processing' && currentStatus === 'completed' && pipeline.final_video_output?.url) {
      if (toastShownRef.current !== pipelineId + '_animate') {
        toastShownRef.current = pipelineId + '_animate';
        toast.success('Video generated!');
        queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      }
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
    }
    
    // Failed
    if (prevStatus === 'processing' && currentStatus === 'failed') {
      toast.error('Generation failed');
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
    }
    
    prevStatusRef.current = currentStatus;
  }, [pipeline, pipelineId, queryClient, localGenerating]);

  // Handle file upload
  const handleFileUpload = async (uploadedFile: File, isFirstFrame: boolean) => {
    if (!user) return;
    
    const setUploading = isFirstFrame ? setIsUploadingFirst : setIsUploadingLast;
    const setUrl = isFirstFrame ? setFirstFrameUrl : setLastFrameUrl;
    
    setUploading(true);
    
    try {
      // Use Cloudflare R2 for publicly accessible URLs
      const publicUrl = await uploadToR2(uploadedFile, { folder: 'animate-frames' });
      
      setUrl(publicUrl);
      toast.success(`${isFirstFrame ? 'First' : 'Last'} frame uploaded`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!effectiveFirstFrame) {
      toast.error('Please add a first frame');
      return;
    }

    if (!profile || (profile.credits ?? 0) < creditCost) {
      toast.error('Insufficient credits', { 
        description: `You need ${creditCost.toFixed(2)} credits but have ${profile?.credits ?? 0}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    // Immediate feedback
    isLocalGeneratingRef.current = true;
    setLocalGenerating(true);

    try {
      // Get fresh session - REQUIRED
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Save input first
      await updateVoice({
        input: {
          animation_type: animationType,
          prompt,
          duration,
          camera_fixed: cameraFixed,
          aspect_ratio: aspectRatio,
          audio_enabled: audioEnabled,
          first_frame_url: effectiveFirstFrame,
          last_frame_url: effectiveLastFrame,
        } as any,
      });

      // Update pipeline status and current stage for proper tracking
      await supabase
        .from('pipelines')
        .update({ 
          status: 'processing', 
          current_stage: 'final_video',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pipelineId);

      // Call edge function for animate generation
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'animate',
          payload: {
            pipeline_id: pipelineId,
            file_id: pipelineId,
            user_id: sessionData.session.user.id,
            project_id: pipeline?.project_id || null,
            first_frame_url: effectiveFirstFrame,
            last_frame_url: effectiveLastFrame || null,
            prompt: prompt || null,
            duration,
            camera_fixed: cameraFixed,
            animation_type: animationType,
            aspect_ratio: aspectRatio,
            audio_enabled: audioEnabled,
            credits_cost: creditCost,
            supabase_url: import.meta.env.VITE_SUPABASE_URL,
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

  const handleSaveUpload = async () => {
    if (!uploadedVideoUrl) return;
    setIsSavingUpload(true);
    try {
      await updateFinalVideo({
        output: { url: uploadedVideoUrl, duration_seconds: 0, generated_at: new Date().toISOString() },
        status: 'completed',
      });
      
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      toast.success('Video saved!');
      onComplete();
    } catch (error) {
      toast.error('Failed to save video');
    } finally {
      setIsSavingUpload(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Input Section */}
      <div className="w-1/2 flex flex-col overflow-hidden border-r">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Input</h3>
          
          {/* Generate/Upload Toggle */}
          <InputModeToggle
            mode={inputMode}
            onModeChange={setInputMode}
            uploadLabel="Upload"
          />

          {inputMode === 'upload' ? (
            /* Upload Mode UI */
            <div className="space-y-4">
              <Label>Upload Video</Label>
              {uploadedVideoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <video src={uploadedVideoUrl} controls className="w-full h-40 object-cover" />
                  <button
                    onClick={() => setUploadedVideoUrl(null)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f || !user) return;
                      
                      const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
                      if (!validTypes.includes(f.type)) {
                        toast.error('Please upload MP4, MOV, or WebM video');
                        return;
                      }
                      if (f.size > 500 * 1024 * 1024) {
                        toast.error('Video must be less than 500MB');
                        return;
                      }
                      
                      setIsUploadingVideo(true);
                      try {
                        // Use Cloudflare R2 for publicly accessible URLs
                        const publicUrl = await uploadToR2(f, { folder: 'videos' });
                        setUploadedVideoUrl(publicUrl);
                        toast.success('Video uploaded');
                      } catch (error) {
                        toast.error('Failed to upload video');
                      } finally {
                        setIsUploadingVideo(false);
                      }
                    }}
                    disabled={isUploadingVideo}
                  />
                  {isUploadingVideo ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
                  ) : (
                    <>
                      <Film className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1.5} />
                      <span className="text-sm text-muted-foreground">Upload your video</span>
                      <span className="text-xs text-muted-foreground/70">MP4, MOV, WebM up to 500MB</span>
                    </>
                  )}
                </label>
              )}
              
              {uploadedVideoUrl && (
                <Button
                  onClick={handleSaveUpload}
                  disabled={isSavingUpload}
                  className="w-full"
                >
                  {isSavingUpload ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>Save Video <span className="text-emerald-400 ml-1">• Free</span></>
                  )}
                </Button>
              )}
            </div>
          ) : (
            /* Generate Mode UI */
            <>
              {/* First Frame Upload */}
              <div className="space-y-2">
                <Label>First Frame</Label>
                {effectiveFirstFrame ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={effectiveFirstFrame} alt="First frame" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setFirstFrameUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, true);
                      }}
                      disabled={isUploadingFirst}
                    />
                    {isUploadingFirst ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1.5} />
                        <span className="text-sm text-muted-foreground">Upload first frame</span>
                        <span className="text-xs text-muted-foreground/70">PNG, JPG up to 10MB</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              
              {/* Last Frame Upload */}
              <div className="space-y-2">
                <Label>Last Frame</Label>
                {effectiveLastFrame ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={effectiveLastFrame} alt="Last frame" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setLastFrameUrl('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                    >
                      <X className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f, false);
                      }}
                      disabled={isUploadingLast}
                    />
                    {isUploadingLast ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1.5} />
                        <span className="text-sm text-muted-foreground">Upload last frame</span>
                        <span className="text-xs text-muted-foreground/70">PNG, JPG up to 10MB</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              
              {/* Prompt */}
              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the motion you want (e.g., 'gentle camera pan across the scene')"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  AI will enhance your prompt or analyze the images if left empty
                </p>
              </div>
            </>
          )}
        </div>

        {/* Sticky Generate Button (Generate mode only) */}
        {inputMode === 'generate' && (
          <div className="shrink-0 p-4 border-t bg-background">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />
                  Generating...
                </>
              ) : (
                <>Generate Animation • {creditCost.toFixed(2)} credits</>
              )}
            </Button>
          </div>
        )}
      </div>
      
      {/* Output Section */}
      <div className="w-1/2 flex flex-col overflow-hidden bg-muted/10">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Output</h3>
        
          {isGenerating && (
            <div className="space-y-4">
              <div className="aspect-video rounded-xl bg-secondary/50 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground">Generating animation...</p>
                </div>
              </div>
            </div>
          )}
        
          {hasOutput && outputVideo?.url && (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-xl overflow-hidden border border-border">
                <video
                  src={outputVideo.url}
                  controls
                  className="w-full"
                  autoPlay
                  muted
                  loop
                />
              </div>
              <Button variant="secondary" className="w-full" asChild>
                <a href={outputVideo.url} download>
                  <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Download Video
                </a>
              </Button>
            </div>
          )}
        
          {!isGenerating && !hasOutput && (
            <div className="aspect-video rounded-xl bg-secondary/30 border-2 border-dashed border-border flex items-center justify-center">
              <div className="text-center">
                <Film className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No output yet</p>
                <p className="text-muted-foreground/70 text-xs mt-1">Upload images and click generate</p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Continue Button */}
        {hasOutput && outputVideo?.url && !isGenerating && (
          <div className="shrink-0 p-4 border-t bg-background">
            <Button onClick={onComplete} className="w-full">
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}