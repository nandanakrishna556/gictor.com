import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import ActorSelectorPopover from '@/components/modals/ActorSelectorPopover';
import { Upload, Sparkles, Download, Image as ImageIcon, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDownload } from '@/lib/download-file';
import { usePipeline } from '@/hooks/usePipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Actor, useActors } from '@/hooks/useActors';
import { uploadToR2 } from '@/lib/cloudflare-upload';
import { PromptTemplateChips } from '@/components/ui/prompt-template-chips';

interface BRollLastFrameStageProps {
  pipelineId: string;
  onComplete: () => void;
}

type Style = 'talking_head' | 'broll';
type SubStyle = 'ugc' | 'studio';
type AspectRatio = '9:16' | '16:9' | '1:1';
type CameraPerspective = '1st_person' | '3rd_person';
type Resolution = '1K' | '2K' | '4K';

// Helper to check if a string is a valid URL
const isValidHttpUrl = (str: string | null | undefined): boolean => {
  if (!str) return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const CREDIT_COST = 0.25;

// Last frame uses script_input/script_output since we need separate storage from first_frame
export default function BRollLastFrameStage({ pipelineId, onComplete }: BRollLastFrameStageProps) {
  const { pipeline, updateScript, updatePipeline, isUpdating } = usePipeline(pipelineId);
  const { profile } = useProfile();
  const { user } = useAuth();
  const { actors } = useActors();
  const queryClient = useQueryClient();
  const { download, isDownloading } = useDownload();
  
  // Input state - matching FrameModal structure with B-Roll defaults
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  const [style, setStyle] = useState<Style>('broll'); // Default to B-Roll for B-Roll pipeline
  const [subStyle, setSubStyle] = useState<SubStyle>('ugc');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [cameraPerspective, setCameraPerspective] = useState<CameraPerspective>('3rd_person');
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  
  // Upload state for reference images
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  
  // Generation state - local only for instant feedback before server confirms
  const [localGenerating, setLocalGenerating] = useState(false);
  const isLocalGeneratingRef = useRef(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastShownRef = useRef<string | null>(null);

  // Dynamic credit cost based on resolution
  const creditCost = resolution === '4K' ? 0.15 : 0.1;

  // Derive output URL from last_frame_output - server is source of truth for generating state
  const outputUrl = pipeline?.last_frame_output?.url;
  const isServerProcessing = pipeline?.status === 'processing' && pipeline?.current_stage === 'last_frame';
  const isGenerating = localGenerating || isServerProcessing; // Show generating if local OR server says so
  const hasOutput = !!outputUrl;

  // Track if initial load is done to prevent overwriting user input
  const initialLoadDone = useRef(false);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestInputRef = useRef<any>(null);
  const hasUserInteractedRef = useRef(false);
  const hydratedStateKeyRef = useRef<string | null>(null);

  const markUserInteracted = useCallback(() => {
    hasUserInteractedRef.current = true;
  }, []);
  
  // Load existing data from script_input (repurposed for last frame)
  useEffect(() => {
    if (!pipeline || hasUserInteractedRef.current) return;

    const rawInput = pipeline.script_input as any;
    const input = rawInput?.frame_type === 'last' ? rawInput : null;
    const storedReferenceImages = Array.isArray(input?.reference_images) ? (input.reference_images as string[]) : [];
    const firstFrameReferenceUrl = pipeline.first_frame_output?.url;
    const resolvedReferenceImages = firstFrameReferenceUrl && !storedReferenceImages.includes(firstFrameReferenceUrl)
      ? [firstFrameReferenceUrl, ...storedReferenceImages].slice(0, 3)
      : storedReferenceImages;
    const nextHydrationKey = JSON.stringify({
      mode: input?.mode ?? 'generate',
      style: input?.style ?? 'broll',
      subStyle: input?.substyle ?? 'ugc',
      aspectRatio: input?.aspect_ratio ?? '9:16',
      cameraPerspective: input?.camera_perspective ?? '3rd_person',
      resolution: input?.resolution ?? '2K',
      selectedActorId: input?.actor_id ?? null,
      referenceImages: resolvedReferenceImages,
      prompt: input?.prompt ?? input?.description ?? '',
      uploadedUrl: input?.uploaded_url ?? '',
      lastFrameUrl: pipeline.last_frame_output?.url ?? null,
    });

    if (hydratedStateKeyRef.current === nextHydrationKey) return;

    hydratedStateKeyRef.current = nextHydrationKey;
    initialLoadDone.current = true;

    setInputMode((input?.mode as InputMode) || 'generate');
    setStyle((input?.style as Style) || 'broll');
    setSubStyle((input?.substyle as SubStyle) || 'ugc');
    setAspectRatio((input?.aspect_ratio as AspectRatio) || '9:16');
    setCameraPerspective((input?.camera_perspective as CameraPerspective) || '3rd_person');
    setResolution((input?.resolution as Resolution) || '2K');
    setSelectedActorId((input?.actor_id as string) || null);
    setReferenceImages(resolvedReferenceImages);
    setPrompt((input?.prompt || input?.description || '') as string);
    setUploadedUrl((input?.uploaded_url as string) || '');

    if (prevStatusRef.current === null) {
      prevStatusRef.current = pipeline.status;
      if (hasOutput) {
        toastShownRef.current = `${pipelineId}_last`;
      }
    }
  }, [
    pipeline?.script_input,
    pipeline?.first_frame_output?.url,
    pipeline?.last_frame_output?.url,
    pipeline?.status,
    hasOutput,
    pipelineId,
  ]);

  // Handle status transitions - show toasts on completion
  useEffect(() => {
    if (!pipeline) return;
    
    const currentStatus = pipeline.status;
    const prevStatus = prevStatusRef.current;
    
    // Server confirmed processing - clear local generating state
    if (currentStatus === 'processing' && pipeline.current_stage === 'last_frame') {
      isLocalGeneratingRef.current = false;
      setLocalGenerating(false);
    }
    
    // Completed transition - show success toast
    if (prevStatus === 'processing' && currentStatus !== 'processing' && pipeline.last_frame_output?.url) {
      if (toastShownRef.current !== pipelineId + '_last') {
        toastShownRef.current = pipelineId + '_last';
        toast.success('Last frame generated!');
        queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      }
      setLocalGenerating(false);
    }
    
    prevStatusRef.current = currentStatus;
  }, [pipeline, pipelineId, queryClient]);

  // Sync selectedActor object when we have an ID but no actor object (e.g., restored from DB)
  useEffect(() => {
    if (selectedActorId && !selectedActor && actors?.length) {
      const actor = actors.find(a => a.id === selectedActorId);
      if (actor) {
        setSelectedActor(actor);
      }
    }
  }, [selectedActorId, selectedActor, actors]);

  useEffect(() => {
    latestInputRef.current = {
      mode: inputMode,
      frame_type: 'last',
      style,
      substyle: subStyle,
      aspect_ratio: aspectRatio,
      camera_perspective: style === 'broll' ? cameraPerspective : null,
      resolution,
      actor_id: (style === 'talking_head' || style === 'broll') ? selectedActorId : null,
      reference_images: referenceImages,
      prompt,
      description: prompt,
      uploaded_url: uploadedUrl,
    };

    if (!initialLoadDone.current) return;

    queryClient.setQueryData(['pipeline', pipelineId], (current: any) => {
      if (!current) return current;

      const previousInput = current.script_input ?? null;
      const nextInput = latestInputRef.current;

      if (JSON.stringify(previousInput) === JSON.stringify(nextInput)) {
        return current;
      }

      return {
        ...current,
        script_input: nextInput,
      };
    });
  }, [
    pipelineId,
    queryClient,
    inputMode,
    style,
    subStyle,
    aspectRatio,
    cameraPerspective,
    resolution,
    selectedActorId,
    referenceImages,
    prompt,
    uploadedUrl,
  ]);

  const persistInput = useCallback(async () => {
    if (!pipelineId || !latestInputRef.current) return;

    await updateScript({
      input: latestInputRef.current as any,
    });
  }, [pipelineId, updateScript]);


  // Auto-save inputs (debounced)
  useEffect(() => {
    if (!initialLoadDone.current || !hasUserInteractedRef.current) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      void persistInput();
    }, 800);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [
    inputMode,
    style,
    subStyle,
    aspectRatio,
    cameraPerspective,
    resolution,
    selectedActorId,
    referenceImages,
    prompt,
    uploadedUrl,
    persistInput,
  ]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      if (initialLoadDone.current && hasUserInteractedRef.current) {
        void persistInput();
      }
    };
  }, [persistInput]);

  // Handle reference image upload
  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    markUserInteracted();
    setUploadingIndex(index);

    try {
      // Use Cloudflare R2 for publicly accessible URLs
      const publicUrl = await uploadToR2(file, { folder: 'reference-images' });

      setReferenceImages((prev) => {
        const newImages = [...prev];
        newImages[index] = publicUrl;
        return newImages.filter(Boolean);
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    markUserInteracted();
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleActorSelect = (actorId: string | null, actor?: Actor) => {
    markUserInteracted();
    setSelectedActorId(actorId);
    setSelectedActor(actor || null);
  };

  const handleGenerate = async () => {
    // Handle upload mode - just save the uploaded image
    if (inputMode === 'upload' && uploadedUrl) {
      await updateScript({
        output: {
          url: uploadedUrl,
          frame_type: 'last',
          type: 'last_frame',
          generated: false,
          char_count: 0,
          estimated_duration: 0,
          generated_at: new Date().toISOString(),
        } as any,
        complete: true,
      });
      toast.success('Last frame saved!');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!profile || (profile.credits ?? 0) < creditCost) {
      toast.error('Insufficient credits', { 
        description: `You need ${creditCost} credits but have ${(profile?.credits ?? 0).toFixed(2)}.`,
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
      // Save input first
      await persistInput();

      // Get fresh session - CRITICAL
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please log in again.');
      }

      // Filter reference images - schema requires valid URLs only
      const validReferenceImages = referenceImages.filter(img => isValidHttpUrl(img));

      // Validate actor_360_url before sending (for face reference in n8n)
      const validActor360Url = isValidHttpUrl(selectedActor?.profile_360_url) 
        ? selectedActor?.profile_360_url 
        : undefined;

      // Update pipeline status to processing
      await updatePipeline({ status: 'processing', current_stage: 'last_frame' });

      // Call edge function with 'frame' type
      // IMPORTANT: metadata.stage tells update-file-status which pipeline field to update
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'frame',
          payload: {
            file_id: pipelineId,
            pipeline_id: pipelineId,
            user_id: sessionData.session.user.id,
            project_id: pipeline?.project_id || undefined,
            frame_type: 'last',
            style,
            substyle: subStyle,
            prompt: prompt.trim(),
            aspect_ratio: aspectRatio,
            camera_perspective: style === 'broll' ? cameraPerspective : undefined,
            frame_resolution: resolution,
            reference_images: validReferenceImages.length > 0 ? validReferenceImages : undefined,
            actor_id: (style === 'talking_head' || style === 'broll') && selectedActorId ? selectedActorId : undefined,
            actor_360_url: validActor360Url,
            supabase_url: import.meta.env.VITE_SUPABASE_URL,
            // Metadata for n8n to pass back in callback - tells update-file-status which field to update
            metadata: {
              pipeline_id: pipelineId,
              stage: 'last_frame',
            },
          },
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      toast.success('Last frame generation started!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // DON'T reset localGenerating here - let the polling detect completion
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start generation');
      await updatePipeline({ status: 'draft' });
      // Only reset on error
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
    }
  };

  const handleUploadComplete = async (url: string | undefined) => {
    if (url) {
      setUploadedUrl(url);
      await updateScript({
        input: { mode: 'upload' as any, uploaded_url: url, frame_type: 'last' } as any,
        output: { last_frame_url: url, text: '', char_count: 0, estimated_duration: 0, generated_at: new Date().toISOString() } as any,
        complete: true,
      });
    } else {
      setUploadedUrl('');
      await updateScript({
        input: { mode: 'upload' as any, uploaded_url: '', frame_type: 'last' } as any,
        output: null,
        complete: false,
      });
    }
  };

  // Don't render form until pipeline data has been hydrated to avoid flash of empty fields
  if (!pipeline || !hydratedStateKeyRef.current) {
    return (
      <div className="flex flex-1 overflow-hidden h-full">
        <div className="w-1/2 flex flex-col overflow-hidden border-r p-6 space-y-4">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-24 w-full rounded-md bg-muted animate-pulse" />
          <div className="h-40 w-full rounded-xl bg-muted animate-pulse" />
        </div>
        <div className="w-1/2 flex flex-col overflow-hidden p-6 space-y-4">
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          <div className="flex-1 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const inputContent = (
    <div className="space-y-5">
      {/* Generate Mode UI */}
          {/* Camera Perspective */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Camera Perspective</label>
            <div className="flex gap-2">
              <Button
                variant={cameraPerspective === '1st_person' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                  onClick={() => {
                    markUserInteracted();
                    setCameraPerspective('1st_person');
                  }}
              >
                1st Person
              </Button>
              <Button
                variant={cameraPerspective === '3rd_person' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                  onClick={() => {
                    markUserInteracted();
                    setCameraPerspective('3rd_person');
                  }}
              >
                3rd Person
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {cameraPerspective === '1st_person'
                ? "POV shot - viewer sees through the subject's eyes"
                : "Observer view - camera captures the subject from outside"}
            </p>
          </div>

          {/* Actor Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Actor</label>
            <ActorSelectorPopover selectedActorId={selectedActorId} onSelect={handleActorSelect} />
          </div>

          {/* Sub-Style & Aspect Ratio - Same Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sub-Style</label>
              <div className="flex gap-1">
                <Button
                  variant={subStyle === 'ugc' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => {
                    markUserInteracted();
                    setSubStyle('ugc');
                  }}
                >
                  UGC
                </Button>
                <Button
                  variant={subStyle === 'studio' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => {
                    markUserInteracted();
                    setSubStyle('studio');
                  }}
                >
                  Studio
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Aspect Ratio</label>
              <Select
                value={aspectRatio}
                onValueChange={(v) => {
                  markUserInteracted();
                  setAspectRatio(v as AspectRatio);
                }}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                  <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference Images */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Reference Images (Optional, up to 3)</label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((index) => {
                const imageUrl = referenceImages[index];
                const isUploading = uploadingIndex === index;

                return (
                  <div key={index} className="relative">
                    {imageUrl ? (
                      <div className="aspect-square rounded-lg border border-border overflow-hidden group relative">
                        <img
                          src={imageUrl}
                          alt={`Reference ${index + 1}`}
                          className="w-full h-full object-contain bg-muted"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className={cn(
                        "aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:border-primary/50",
                        isUploading && "pointer-events-none"
                      )}>
                        {isUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Plus className="h-5 w-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Add</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(index, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => {
                markUserInteracted();
                setPrompt(e.target.value);
              }}
              placeholder="Describe the setting of this scene, actor's expression, clothing and the action they are performing"
              className="min-h-24 rounded-xl resize-none"
            />
            <PromptTemplateChips
              onSelect={(p) => {
                markUserInteracted();
                setPrompt(p);
              }}
            />
          </div>
    </div>
  );

  const outputContent = outputUrl ? (
    <div className="rounded-xl border border-border overflow-hidden">
      <img src={outputUrl} alt="Generated last frame" className="w-full object-contain" />
    </div>
  ) : null;

  const outputActions = hasOutput && outputUrl ? (
    <Button
      variant="secondary"
      className="w-full"
      disabled={isDownloading}
      onClick={() => void download(outputUrl, 'last-frame.png')}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" strokeWidth={1.5} />
      ) : (
        <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
      )}
      {isDownloading ? 'Downloading...' : 'Download Image'}
    </Button>
  ) : undefined;

  const wasAIGenerated = (pipeline?.script_input as any)?.mode === 'generate';

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRemix={handleGenerate}
      onContinue={onComplete}
      isGenerating={isGenerating}
      canContinue={hasOutput}
      generateLabel={`Generate Last Frame • ${creditCost} Credits`}
      creditsCost=""
      isAIGenerated={wasAIGenerated}
      outputActions={outputActions}
      generatingLabel="Generating last frame..."
    />
  );
}
