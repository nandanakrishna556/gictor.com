import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Film, Loader2, Download, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { uploadToR2 } from '@/lib/cloudflare-upload';

interface MoGraphAnimateStageProps {
  pipelineId: string;
  onComplete: () => void;
}

const CREDIT_COST_PER_SECOND = 0.15;

export default function MoGraphAnimateStage({ pipelineId, onComplete }: MoGraphAnimateStageProps) {
  const { user } = useAuth();
  const { pipeline, updateVoice, updateFinalVideo, isUpdating } = usePipeline(pipelineId);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  
  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  
  // Input state - Motion Graphics defaults
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [duration, setDuration] = useState(8);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cameraFixed, setCameraFixed] = useState(true); // Motion graphics typically use fixed camera
  
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
  const originalLastFrame = (pipeline?.script_output as any)?.last_frame_url;
  
  // Use custom if available, otherwise use original
  const effectiveFirstFrame = firstFrameUrl || originalFirstFrame;
  const effectiveLastFrame = lastFrameUrl || originalLastFrame;
  
  // Output from final_video_output
  const outputVideo = pipeline?.final_video_output;
  const hasOutput = !!outputVideo?.url;
  
  // Check if processing
  const isProcessing = pipeline?.status === 'processing' && pipeline?.current_stage === 'final_video';
  const isGenerating = localGenerating || isProcessing;
  
  // Credit cost
  const creditCost = Math.ceil(duration * CREDIT_COST_PER_SECOND * 100) / 100;
  
  // Validation - Motion Graphics requires both frames for transitions
  const hasRequiredInputs = effectiveFirstFrame && effectiveLastFrame;
  const canGenerate = hasRequiredInputs && !isGenerating && profile && (profile.credits ?? 0) >= creditCost;

  // Load existing data from voice_input (repurposed for animate settings)
  useEffect(() => {
    if (pipeline?.voice_input) {
      const input = pipeline.voice_input as any;
      if (input.animation_type === 'motion_graphics') {
        setDuration(input.duration || 8);
        setCameraFixed(input.camera_fixed ?? true);
        setAspectRatio(input.aspect_ratio || '9:16');
        setAudioEnabled(input.audio_enabled || false);
      }
    }
    
    if (prevStatusRef.current === null && pipeline) {
      prevStatusRef.current = pipeline.status;
      if (hasOutput) {
        toastShownRef.current = pipelineId;
      }
    }
  }, [pipeline?.voice_input, pipeline?.status, hasOutput, pipelineId]);

  // Auto-populate frames from previous stages
  useEffect(() => {
    if (originalFirstFrame && !firstFrameUrl) {
      setFirstFrameUrl(originalFirstFrame);
    }
  }, [originalFirstFrame]);
  
  useEffect(() => {
    if (originalLastFrame && !lastFrameUrl) {
      setLastFrameUrl(originalLastFrame);
    }
  }, [originalLastFrame]);

  // Handle status transitions
  useEffect(() => {
    if (!pipeline) return;
    
    const currentStatus = pipeline.status;
    const prevStatus = prevStatusRef.current;
    
    if (isLocalGeneratingRef.current && currentStatus === 'processing') {
      isLocalGeneratingRef.current = false;
      setLocalGenerating(false);
    }
    
    if (prevStatus === 'processing' && currentStatus === 'completed' && pipeline.final_video_output?.url) {
      if (toastShownRef.current !== pipelineId + '_animate') {
        toastShownRef.current = pipelineId + '_animate';
        toast.success('Motion graphics video generated!');
        queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      }
      setLocalGenerating(false);
    }
    
    if (prevStatus === 'processing' && currentStatus === 'failed') {
      toast.error('Generation failed');
      setLocalGenerating(false);
    }
    
    prevStatusRef.current = currentStatus;
  }, [pipeline, pipelineId, queryClient]);

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
    if (!effectiveFirstFrame || !effectiveLastFrame) {
      toast.error('Motion graphics requires both first and last frames for transitions');
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

    isLocalGeneratingRef.current = true;
    setLocalGenerating(true);

    try {
      // Save input first
      await updateVoice({
        input: {
          animation_type: 'motion_graphics',
          duration,
          camera_fixed: cameraFixed,
          aspect_ratio: aspectRatio,
          audio_enabled: audioEnabled,
          first_frame_url: effectiveFirstFrame,
          last_frame_url: effectiveLastFrame,
        } as any,
      });

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
            file_id: pipelineId,
            first_frame_url: effectiveFirstFrame,
            last_frame_url: effectiveLastFrame,
            duration,
            camera_fixed: cameraFixed,
            animation_type: 'motion_graphics',
            aspect_ratio: aspectRatio,
            audio_enabled: audioEnabled,
            pipeline_type: 'motion_graphics',
            credits_cost: creditCost,
          },
        },
      });

      if (error || !data?.success) {
        await updateFinalVideo({ status: 'failed' });
        throw new Error(error?.message || data?.error || 'Generation failed');
      }

      toast.success('Motion graphics generation started!');
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
              {/* Animation Type - Locked to Motion Graphics */}
              <div className="space-y-2">
                <Label>Animation Type</Label>
                <div className="p-3 rounded-lg border border-primary bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <span className="text-sm font-medium">Motion Graphics (Transitions)</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Creates smooth motion graphics transitions between first and last frames
                </p>
              </div>
              
              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={aspectRatio === '9:16' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAspectRatio('9:16')}
                  >
                    9:16 Portrait
                  </Button>
                  <Button
                    type="button"
                    variant={aspectRatio === '16:9' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAspectRatio('16:9')}
                  >
                    16:9 Landscape
                  </Button>
                </div>
              </div>
              
              {/* Duration Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Duration</Label>
                  <span className="text-sm font-medium">{duration}s</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={12}
                  step={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>4s</span>
                  <span>12s</span>
                </div>
              </div>

              {/* Audio Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audio</Label>
                  <p className="text-xs text-muted-foreground">Generate accompanying audio</p>
                </div>
                <Switch
                  checked={audioEnabled}
                  onCheckedChange={setAudioEnabled}
                />
              </div>

              {/* Camera Toggle */}
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <Label>Camera</Label>
                  <p className="text-xs text-muted-foreground">
                    {cameraFixed ? 'Static (fixed position)' : 'Dynamic (moves naturally)'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!cameraFixed ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCameraFixed(false)}
                  >
                    Dynamic
                  </Button>
                  <Button
                    type="button"
                    variant={cameraFixed ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCameraFixed(true)}
                  >
                    Static
                  </Button>
                </div>
              </div>
              
              {/* Frame Previews */}
              <div className="space-y-3">
                <Label>Frames</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* First Frame */}
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">First Frame</span>
                    <div className="aspect-video relative rounded-lg border border-border overflow-hidden bg-muted">
                      {effectiveFirstFrame ? (
                        <>
                          <img src={effectiveFirstFrame} alt="First frame" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setFirstFrameUrl('')}
                            className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/80">
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
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          )}
                        </label>
                      )}
                    </div>
                  </div>
                  
                  {/* Last Frame */}
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Last Frame</span>
                    <div className="aspect-video relative rounded-lg border border-border overflow-hidden bg-muted">
                      {effectiveLastFrame ? (
                        <>
                          <img src={effectiveLastFrame} alt="Last frame" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setLastFrameUrl('')}
                            className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/80">
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
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          )}
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                {!hasRequiredInputs && inputMode === 'generate' && (
                  <p className="text-xs text-amber-500">
                    Both first and last frames are required for motion graphics transitions
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Generate Button - only show in generate mode */}
        {inputMode === 'generate' && (
          <div className="shrink-0 p-4 border-t border-border">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>Generate Animation • {creditCost.toFixed(2)} Credits</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Output Section */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Output</h3>
          
          {isGenerating ? (
            <div className="aspect-video rounded-xl bg-secondary/30 border-2 border-dashed border-border flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" strokeWidth={1.5} />
              <p className="text-muted-foreground text-sm">Generating motion graphics...</p>
            </div>
          ) : hasOutput && outputVideo?.url ? (
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-xl border border-border overflow-hidden">
                <video 
                  src={outputVideo.url} 
                  controls 
                  className="w-full"
                  autoPlay
                  loop
                />
              </div>
              <Button variant="secondary" className="w-full" asChild>
                <a href={outputVideo.url} download={`motion-graphics-${Date.now()}.mp4`}>
                  <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Download Video
                </a>
              </Button>
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-secondary/30 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
              <Film className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="text-muted-foreground text-sm">No output yet</p>
              <p className="text-muted-foreground/70 text-xs">Add both frames and click Generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
