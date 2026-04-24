import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Film, Loader2, Download, Upload, X, Search, User, Play, Pause, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { downloadFile } from '@/lib/download-file';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { uploadToR2 } from '@/lib/cloudflare-upload';
import { Slider } from '@/components/ui/slider';
import { useActors, Actor } from '@/hooks/useActors';

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
  const { actors } = useActors();
  
  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  
  // Input state
  const [animationType, setAnimationType] = useState<'broll' | 'motion_graphics'>('broll');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('9:16');
  const [duration, setDuration] = useState(8);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cameraFixed, setCameraFixed] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [actorSearchOpen, setActorSearchOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  // B-Roll only sends the actor's voice (image is never passed)
  const useActorImage = false;
  const useActorVoice = true;

  // Available actors with voice
  const availableActors = (actors || []).filter(
    (actor) => actor.status === 'completed' && (actor.voice_url || actor.custom_audio_url)
  );
  
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
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestInputRef = useRef<any>(null);
  const isLocalGeneratingRef = useRef(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastShownRef = useRef<string | null>(null);
  const hasUserInteractedRef = useRef(false);
  const hydratedStateKeyRef = useRef<string | null>(null);

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

  const markUserInteracted = useCallback(() => {
    hasUserInteractedRef.current = true;
  }, []);
  
  // Load existing data from voice_input (repurposed for animate settings)
  useEffect(() => {
    if (!pipeline || hasUserInteractedRef.current) return;

    const input = pipeline.voice_input as any;
    const firstFrameInput = pipeline.first_frame_input as any;
    const lastFrameInput = pipeline.script_input as any;
    const resolvedFirstFrameUrl = (input?.first_frame_url as string) || pipeline.first_frame_output?.url || '';
    const resolvedLastFrameUrl = (input?.last_frame_url as string) || pipeline.last_frame_output?.url || '';
    // Pre-fill actor from animate input, or fall back to first/last frame stages
    const resolvedActorId =
      (input?.actor_id as string) ||
      (lastFrameInput?.actor_id as string) ||
      (firstFrameInput?.actor_id as string) ||
      null;
    // Inherit aspect ratio from animate input, then last frame, then first frame
    const resolvedAspectRatio =
      (input?.aspect_ratio as string) ||
      (lastFrameInput?.aspect_ratio as string) ||
      (firstFrameInput?.aspect_ratio as string) ||
      '9:16';
    const nextHydrationKey = JSON.stringify({
      animationType: input?.animation_type ?? 'broll',
      prompt: input?.prompt ?? '',
      duration: input?.duration ?? 8,
      cameraFixed: input?.camera_fixed ?? false,
      aspectRatio: resolvedAspectRatio,
      audioEnabled: input?.audio_enabled ?? false,
      actorId: resolvedActorId,
      firstFrameUrl: resolvedFirstFrameUrl,
      lastFrameUrl: resolvedLastFrameUrl,
    });

    if (hydratedStateKeyRef.current === nextHydrationKey) return;

    hydratedStateKeyRef.current = nextHydrationKey;
    initialLoadDoneRef.current = true;

    setAnimationType((input?.animation_type as 'broll' | 'motion_graphics') || 'broll');
    setPrompt((input?.prompt as string) || '');
    setDuration((input?.duration as number) || 8);
    setCameraFixed(Boolean(input?.camera_fixed));
    setAspectRatio(resolvedAspectRatio as '16:9' | '9:16' | '1:1');
    setAudioEnabled(Boolean(input?.audio_enabled));
    setSelectedActorId(resolvedActorId);
    // useActorImage/useActorVoice are constants for B-Roll (voice only)

    setFirstFrameUrl(resolvedFirstFrameUrl);
    setLastFrameUrl(resolvedLastFrameUrl);

    if (prevStatusRef.current === null) {
      prevStatusRef.current = pipeline.status;
      if (hasOutput) {
        toastShownRef.current = pipelineId;
      }
    }
  }, [
    pipeline?.voice_input,
    pipeline?.first_frame_input,
    pipeline?.script_input,
    pipeline?.first_frame_output?.url,
    pipeline?.last_frame_output?.url,
    pipeline?.status,
    hasOutput,
    pipelineId,
  ]);


  useEffect(() => {
    latestInputRef.current = {
      animation_type: animationType,
      prompt,
      duration,
      camera_fixed: cameraFixed,
      aspect_ratio: aspectRatio,
      audio_enabled: audioEnabled,
      actor_id: selectedActorId,
      use_actor_image: useActorImage,
      use_actor_voice: useActorVoice,
      first_frame_url: effectiveFirstFrame,
      last_frame_url: effectiveLastFrame,
    };

    if (!initialLoadDoneRef.current) return;

    queryClient.setQueryData(['pipeline', pipelineId], (current: any) => {
      if (!current) return current;

      const previousInput = current.voice_input ?? null;
      const nextInput = latestInputRef.current;

      if (JSON.stringify(previousInput) === JSON.stringify(nextInput)) {
        return current;
      }

      return {
        ...current,
        voice_input: nextInput,
      };
    });
  }, [
    pipelineId,
    queryClient,
    animationType,
    prompt,
    duration,
    cameraFixed,
    aspectRatio,
    audioEnabled,
    selectedActorId,
    useActorImage,
    useActorVoice,
    effectiveFirstFrame,
    effectiveLastFrame,
  ]);

  // Sync selectedActor object when we have an ID but no actor object (e.g., restored from DB)
  useEffect(() => {
    if (selectedActorId && actors?.length) {
      const actor = actors.find((a) => a.id === selectedActorId);
      if (actor && actor.id !== selectedActor?.id) {
        setSelectedActor(actor);
      }
    } else if (!selectedActorId && selectedActor) {
      setSelectedActor(null);
    }
  }, [selectedActorId, actors, selectedActor]);

  const persistInputs = useCallback(async () => {
    if (!pipelineId || !latestInputRef.current) return;

    await updateVoice({
      input: latestInputRef.current as any,
    });
  }, [pipelineId, updateVoice]);

  useEffect(() => {
    if (!initialLoadDoneRef.current || !hasUserInteractedRef.current) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      void persistInputs();
    }, 800);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [
    animationType,
    prompt,
    duration,
    cameraFixed,
    aspectRatio,
    audioEnabled,
    selectedActorId,
    useActorImage,
    useActorVoice,
    effectiveFirstFrame,
    effectiveLastFrame,
    persistInputs,
  ]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      if (initialLoadDoneRef.current && hasUserInteractedRef.current) {
        void persistInputs();
      }
    };
  }, [persistInputs]);

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
    
    markUserInteracted();
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
        description: `You need ${creditCost.toFixed(2)} credits but have ${(profile?.credits ?? 0).toFixed(2)}.`,
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
      await persistInputs();

      // Update pipeline status and current stage for proper tracking
      await supabase
        .from('pipelines')
        .update({ 
          status: 'processing', 
          current_stage: 'final_video',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pipelineId);

      const generationStartedAt = new Date().toISOString();
      const nextGenerationParams = {
        pipeline_id: pipelineId,
        pipeline_type: pipeline?.pipeline_type || 'clips',
        first_frame_url: effectiveFirstFrame,
        last_frame_url: effectiveLastFrame,
        duration,
        prompt,
      };

      if (pipeline?.project_id) {
        queryClient.setQueriesData({ queryKey: ['files', pipeline.project_id] }, (current: any) =>
          Array.isArray(current)
            ? current.map((file) => {
                const params = file?.generation_params as Record<string, unknown> | null;
                return params?.pipeline_id === pipelineId
                  ? {
                      ...file,
                      generation_status: 'processing',
                      generation_started_at: generationStartedAt,
                      estimated_duration_seconds: duration,
                      generation_params: {
                        ...(params || {}),
                        ...nextGenerationParams,
                      },
                    }
                  : file;
              })
            : current
        );

        queryClient.setQueryData(['pipeline-thumbnails', pipeline.project_id], (current: any) => {
          const next = new Map<string, any>(current ? Array.from((current as Map<string, any>).entries()) : []);
          next.set(pipelineId, {
            firstFrameUrl: effectiveFirstFrame || undefined,
            lastFrameUrl: effectiveLastFrame || undefined,
          });
          return next;
        });
      }

      await supabase
        .from('files')
        .update({
          generation_status: 'processing',
          generation_started_at: generationStartedAt,
          estimated_duration_seconds: duration,
          generation_params: nextGenerationParams as any,
        })
        .contains('generation_params', { pipeline_id: pipelineId });

      if (pipeline?.project_id) {
        queryClient.invalidateQueries({ queryKey: ['files', pipeline.project_id] });
      }

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
            actor_id: selectedActorId || null,
            actor_image_url: selectedActorId && useActorImage
              ? (selectedActor?.profile_image_url || selectedActor?.profile_360_url || null)
              : null,
            actor_voice_url: selectedActorId && useActorVoice
              ? (selectedActor?.voice_url || selectedActor?.custom_audio_url || null)
              : null,
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
      // Close modal immediately - generation continues in background
      onComplete();
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

  // Don't render form until pipeline data has been hydrated to avoid flash of empty fields
  if (!pipeline || !hydratedStateKeyRef.current) {
    return (
      <div className="flex flex-1 overflow-hidden h-full">
        <div className="w-1/2 flex flex-col overflow-hidden border-r p-6 space-y-4">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-40 w-full rounded-xl bg-muted animate-pulse" />
          <div className="h-40 w-full rounded-xl bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-24 w-full rounded-md bg-muted animate-pulse" />
        </div>
        <div className="w-1/2 flex flex-col overflow-hidden p-6 space-y-4">
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          <div className="flex-1 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Input Section */}
      <div className="w-1/2 flex flex-col overflow-hidden border-r">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Input</h3>
          
          {/* Actor Voice Selector (matches Talking Head Speech tab) */}
              <div className="space-y-2">
                <Label>Actor Voice (Optional)</Label>
                <Popover open={actorSearchOpen} onOpenChange={setActorSearchOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={actorSearchOpen}
                      className="w-full justify-between h-auto py-3"
                    >
                      {selectedActor ? (
                        <div className="flex items-center gap-3">
                          {selectedActor.profile_image_url ? (
                            <img
                              src={selectedActor.profile_image_url}
                              alt={selectedActor.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="text-left">
                            <p className="font-medium">{selectedActor.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[selectedActor.gender, selectedActor.age && `${selectedActor.age}y`]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Select an actor voice...</span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0 z-50" align="start" sideOffset={4}>
                    <Command>
                      <CommandInput placeholder="Search actors..." />
                      <CommandList className="max-h-[240px] overflow-y-auto">
                        <CommandEmpty>
                          {availableActors.length === 0 ? (
                            <div className="py-6 text-center text-sm">
                              <p className="text-muted-foreground">No actors with voice available.</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Create an actor first in the Actors page.
                              </p>
                            </div>
                          ) : (
                            'No actor found.'
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {/* None option */}
                          <CommandItem
                            value="__none__"
                            onSelect={() => {
                              markUserInteracted();
                              setSelectedActorId(null);
                              setSelectedActor(null);
                              setActorSearchOpen(false);
                            }}
                            className="cursor-pointer py-3"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <X className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">No actor voice</p>
                                <p className="text-xs text-muted-foreground">Generate without an actor voice</p>
                              </div>
                              {!selectedActorId && <Check className="ml-auto h-4 w-4" />}
                            </div>
                          </CommandItem>
                          {availableActors.map((actor) => (
                            <CommandItem
                              key={actor.id}
                              value={actor.name}
                              onSelect={() => {
                                markUserInteracted();
                                setSelectedActorId(actor.id);
                                setSelectedActor(actor);
                                setActorSearchOpen(false);
                              }}
                              className="cursor-pointer py-3"
                            >
                              <div className="flex items-center gap-3 w-full">
                                {actor.profile_image_url ? (
                                  <img
                                    src={actor.profile_image_url}
                                    alt={actor.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{actor.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {[actor.gender, actor.age && `${actor.age}y`, actor.language]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </p>
                                </div>
                                {(actor.voice_url || actor.custom_audio_url) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const audio = document.getElementById(
                                        `broll-preview-audio-${actor.id}`
                                      ) as HTMLAudioElement;
                                      if (audio) {
                                        if (audio.paused) {
                                          document
                                            .querySelectorAll('audio[id^="broll-preview-audio-"]')
                                            .forEach((a) => {
                                              (a as HTMLAudioElement).pause();
                                              (a as HTMLAudioElement).currentTime = 0;
                                            });
                                          setPlayingAudioId(actor.id);
                                          audio.play();
                                          audio.onended = () => setPlayingAudioId(null);
                                        } else {
                                          audio.pause();
                                          audio.currentTime = 0;
                                          setPlayingAudioId(null);
                                        }
                                      }
                                    }}
                                    className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors"
                                  >
                                    {playingAudioId === actor.id ? (
                                      <Pause className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Play className="h-4 w-4 text-primary" />
                                    )}
                                  </button>
                                )}
                                {selectedActorId === actor.id && <Check className="ml-auto h-4 w-4" />}
                                {(actor.voice_url || actor.custom_audio_url) && (
                                  <audio
                                    id={`broll-preview-audio-${actor.id}`}
                                    src={(actor.voice_url || actor.custom_audio_url) as string}
                                    preload="none"
                                    className="hidden"
                                  />
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selected Actor Voice Preview */}
              {selectedActor && (selectedActor.voice_url || selectedActor.custom_audio_url) && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedActor.profile_image_url ? (
                      <img
                        src={selectedActor.profile_image_url}
                        alt={selectedActor.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{selectedActor.name}</p>
                      <p className="text-xs text-muted-foreground">Voice Preview</p>
                    </div>
                  </div>
                  <AudioPlayer src={(selectedActor.voice_url || selectedActor.custom_audio_url) as string} />
                </div>
              )}

              {/* First Frame Upload */}
              <div className="space-y-2">
                <Label>First Frame</Label>
                {effectiveFirstFrame ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={effectiveFirstFrame} alt="First frame" className="w-full h-40 object-cover" />
                    <button
                      onClick={() => {
                        markUserInteracted();
                        setFirstFrameUrl('');
                      }}
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
                      onClick={() => {
                        markUserInteracted();
                        setLastFrameUrl('');
                      }}
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
              
              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <div className="flex gap-1">
                  {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                    <Button
                      key={ratio}
                      type="button"
                      variant={aspectRatio === ratio ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-9"
                      onClick={() => {
                        markUserInteracted();
                        setAspectRatio(ratio);
                      }}
                    >
                      {ratio}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Duration Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Duration</Label>
                  <span className="text-sm font-medium tabular-nums">{duration}s</span>
                </div>
                <Slider
                  min={4}
                  max={15}
                  step={1}
                  value={[duration]}
                  onValueChange={(v) => {
                    markUserInteracted();
                    setDuration(v[0] ?? 8);
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>4s</span>
                  <span>15s</span>
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => {
                    markUserInteracted();
                    setPrompt(e.target.value);
                  }}
                  placeholder="Describe the scene and any actions or camera movement (e.g., 'a man walks through a forest at sunset, slow dolly in')"
                  rows={3}
                />
              </div>

        </div>

        {/* Sticky Generate Button */}
        {(
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
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => downloadFile(outputVideo.url, `clips-${Date.now()}.mp4`)}
              >
                <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Download Video
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