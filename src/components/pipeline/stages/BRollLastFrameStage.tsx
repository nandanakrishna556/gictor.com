import React, { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import ActorSelectorPopover from '@/components/modals/ActorSelectorPopover';
import { Upload, Sparkles, Download, Image as ImageIcon, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Actor } from '@/hooks/useActors';
import { uploadToR2 } from '@/lib/cloudflare-upload';

interface BRollLastFrameStageProps {
  pipelineId: string;
  onComplete: () => void;
}

type Style = 'talking_head' | 'broll' | 'motion_graphics';
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
  const queryClient = useQueryClient();
  
  // Input state - matching FrameModal structure with B-Roll defaults
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  const [style, setStyle] = useState<Style>('broll'); // Default to B-Roll for B-Roll pipeline
  const [subStyle, setSubStyle] = useState<SubStyle>('ugc');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [cameraPerspective, setCameraPerspective] = useState<CameraPerspective>('3rd_person');
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  
  // Upload state for reference images
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  
  // Generation state
  const [localGenerating, setLocalGenerating] = useState(false);
  const isLocalGeneratingRef = useRef(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastShownRef = useRef<string | null>(null);
  const generationInitiatedRef = useRef(false); // Track if user initiated generation

  // Dynamic credit cost based on resolution
  const creditCost = resolution === '4K' ? 0.15 : 0.1;

  // Derive output URL from script_output (repurposed for last frame)
  const lastFrameData = pipeline?.script_output as any;
  const outputUrl = lastFrameData?.last_frame_url;
  const isServerProcessing = pipeline?.status === 'processing' && pipeline?.current_stage === 'last_frame';
  // Only show generating state if: (1) user clicked generate (localGenerating), OR (2) server is processing AND we initiated it
  const isGenerating = localGenerating || (isServerProcessing && generationInitiatedRef.current);
  const hasOutput = !!outputUrl;

  // Track if initial load is done to prevent overwriting user input
  const initialLoadDone = useRef(false);
  
  // Load existing data from script_input (repurposed for last frame) - only on first mount
  useEffect(() => {
    if (pipeline?.script_input && !initialLoadDone.current) {
      const input = pipeline.script_input as any;
      if (input.frame_type === 'last') {
        initialLoadDone.current = true;
        setInputMode(input.mode || 'generate');
        setStyle(input.style || 'broll');
        setSubStyle(input.substyle || 'ugc');
        setAspectRatio(input.aspect_ratio || '16:9');
        setCameraPerspective(input.camera_perspective || '3rd_person');
        setResolution(input.resolution || '2K');
        setSelectedActorId(input.actor_id || null);
        setReferenceImages(input.reference_images || []);
        setPrompt(input.prompt || input.description || '');
        setUploadedUrl(input.uploaded_url || '');
      }
    }
    
    // Initialize prev status
    if (prevStatusRef.current === null && pipeline) {
      prevStatusRef.current = pipeline.status;
      if (hasOutput) {
        toastShownRef.current = pipelineId;
      }
    }
  }, [pipeline?.script_input, pipeline?.status, hasOutput, pipelineId]);

  // Handle status transitions
  useEffect(() => {
    if (!pipeline) return;
    
    const currentStatus = pipeline.status;
    const prevStatus = prevStatusRef.current;
    
    // Server confirmed processing - clear local generating state
    if (generationInitiatedRef.current && currentStatus === 'processing') {
      isLocalGeneratingRef.current = false;
      setLocalGenerating(false);
    }
    
    // Completed transition - only react if we initiated generation
    const lastFrameOutput = pipeline.script_output as any;
    if (generationInitiatedRef.current && prevStatus === 'processing' && currentStatus !== 'processing' && lastFrameOutput?.last_frame_url) {
      if (toastShownRef.current !== pipelineId + '_last') {
        toastShownRef.current = pipelineId + '_last';
        toast.success('Last frame generated!');
        queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      }
      setLocalGenerating(false);
      generationInitiatedRef.current = false; // Reset after completion
    }
    
    prevStatusRef.current = currentStatus;
  }, [pipeline, pipelineId, queryClient]);

  // Auto-add first frame output as reference image if available
  useEffect(() => {
    const firstFrameUrl = pipeline?.first_frame_output?.url;
    if (firstFrameUrl && !referenceImages.includes(firstFrameUrl)) {
      setReferenceImages(prev => {
        if (prev.includes(firstFrameUrl)) return prev;
        return [firstFrameUrl, ...prev].slice(0, 3); // Keep max 3
      });
    }
  }, [pipeline?.first_frame_output?.url]);

  // Save input changes (using script fields)
  const saveInput = async () => {
    await updateScript({
      input: {
        mode: inputMode,
        frame_type: 'last',
        style,
        substyle: style !== 'motion_graphics' ? subStyle : null,
        aspect_ratio: aspectRatio,
        camera_perspective: style === 'broll' ? cameraPerspective : null,
        resolution,
        actor_id: (style === 'talking_head' || style === 'broll') ? selectedActorId : null,
        reference_images: referenceImages,
        prompt,
        description: prompt,
        uploaded_url: uploadedUrl,
      } as any,
    });
  };

  // Auto-save on changes (excluding prompt to prevent typing interruption)
  useEffect(() => {
    const timer = setTimeout(saveInput, 500);
    return () => clearTimeout(timer);
  }, [inputMode, style, subStyle, aspectRatio, cameraPerspective, resolution, selectedActorId, referenceImages, uploadedUrl]);
  
  // Separate debounced save for prompt (longer delay)
  useEffect(() => {
    const timer = setTimeout(saveInput, 1500);
    return () => clearTimeout(timer);
  }, [prompt]);

  // Handle reference image upload
  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

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
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleActorSelect = (actorId: string | null, actor?: Actor) => {
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
        description: `You need ${creditCost} credits but have ${profile?.credits ?? 0}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    // Immediate feedback - mark that user initiated generation
    isLocalGeneratingRef.current = true;
    generationInitiatedRef.current = true;
    setLocalGenerating(true);

    try {
      // Save input first
      await saveInput();

      // Get fresh session - CRITICAL
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Session expired. Please log in again.');
      }

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
            project_id: pipeline?.project_id || null,
            frame_type: 'last',
            style: style,
            substyle: style !== 'motion_graphics' ? subStyle : null,
            prompt: prompt,
            aspect_ratio: aspectRatio,
            frame_resolution: resolution,
            reference_images: referenceImages.filter(url => url && url.startsWith('http')),
            actor_id: (style === 'talking_head' || style === 'broll') ? selectedActorId : null,
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
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start generation');
      await updatePipeline({ status: 'draft' });
    } finally {
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

  const inputContent = (
    <div className="space-y-5">
      {/* Generate/Upload Toggle */}
      <InputModeToggle
        mode={inputMode}
        onModeChange={setInputMode}
        uploadLabel="Upload"
      />

      {inputMode === 'upload' ? (
        /* Upload Mode UI */
        <div className="space-y-4">
          <SingleImageUpload
            value={uploadedUrl || undefined}
            onChange={handleUploadComplete}
            aspectRatio="video"
            placeholder="Drag & drop your image or"
            showGenerateLink={false}
          />
        </div>
      ) : (
        /* Generate Mode UI */
        <>
          {/* Frame Type - Last Frame pre-selected and locked */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Frame Type</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 opacity-50" disabled>
                First Frame
              </Button>
              <Button variant="default" size="sm" className="flex-1" disabled>
                Last Frame
              </Button>
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Style</label>
            <div className="space-y-2">
              {/* Talking Head */}
              <div
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                  style === 'talking_head'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setStyle('talking_head')}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    style === 'talking_head' ? "border-primary" : "border-muted-foreground"
                  )}>
                    {style === 'talking_head' && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium">Talking Head</span>
                </div>
                {style === 'talking_head' && (
                  <div className="flex gap-1">
                    <Button
                      variant={subStyle === 'ugc' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={(e) => { e.stopPropagation(); setSubStyle('ugc'); }}
                    >
                      UGC
                    </Button>
                    <Button
                      variant={subStyle === 'studio' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={(e) => { e.stopPropagation(); setSubStyle('studio'); }}
                    >
                      Studio
                    </Button>
                  </div>
                )}
              </div>

              {/* B-Roll - Default selected */}
              <div
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                  style === 'broll' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
                onClick={() => setStyle('broll')}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    style === 'broll' ? "border-primary" : "border-muted-foreground"
                  )}>
                    {style === 'broll' && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium">B-Roll</span>
                </div>
                {style === 'broll' && (
                  <div className="flex gap-1">
                    <Button
                      variant={subStyle === 'ugc' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={(e) => { e.stopPropagation(); setSubStyle('ugc'); }}
                    >
                      UGC
                    </Button>
                    <Button
                      variant={subStyle === 'studio' ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={(e) => { e.stopPropagation(); setSubStyle('studio'); }}
                    >
                      Studio
                    </Button>
                  </div>
                )}
              </div>

              {/* Motion Graphics */}
              <div
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                  style === 'motion_graphics'
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setStyle('motion_graphics')}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    style === 'motion_graphics' ? "border-primary" : "border-muted-foreground"
                  )}>
                    {style === 'motion_graphics' && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium">Motion Graphics</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {style === 'talking_head' && "Person looking directly at camera"}
              {style === 'broll' && "Person captured mid-action, natural movement"}
              {style === 'motion_graphics' && "Graphics & elements - icons, shapes, text areas"}
            </p>
          </div>

          {/* Camera Perspective - Only show for B-Roll */}
          {style === 'broll' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Camera Perspective</label>
              <div className="flex gap-2">
                <Button
                  variant={cameraPerspective === '1st_person' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setCameraPerspective('1st_person')}
                >
                  1st Person
                </Button>
                <Button
                  variant={cameraPerspective === '3rd_person' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setCameraPerspective('3rd_person')}
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
          )}

          {/* Actor Selector - Show for Talking Head and B-Roll */}
          {(style === 'talking_head' || style === 'broll') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Actor</label>
              <ActorSelectorPopover selectedActorId={selectedActorId} onSelect={handleActorSelect} />
            </div>
          )}

          {/* Aspect Ratio & Resolution - Same Row */}
          <div className="space-y-2">
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">Aspect Ratio</label>
                <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                    <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">Resolution</label>
                <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1K">1K • 0.25 credits</SelectItem>
                    <SelectItem value="2K">2K • 0.25 credits</SelectItem>
                    <SelectItem value="4K">4K • 0.5 credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                style === 'motion_graphics'
                  ? "Describe the graphics: icons, shapes, text areas, call-to-action elements..."
                  : style === 'broll'
                    ? "Describe the action, scene, and environment (person will be captured mid-action)..."
                    : "Describe the person, their expression, clothing, and setting (looking at camera)..."
              }
              className="min-h-24 rounded-xl resize-none"
            />
          </div>
        </>
      )}
    </div>
  );

  const outputContent = outputUrl ? (
    <div className="rounded-xl border border-border overflow-hidden">
      <img src={outputUrl} alt="Generated last frame" className="w-full object-contain" />
    </div>
  ) : null;

  const outputActions = hasOutput && outputUrl ? (
    <Button variant="secondary" className="w-full" asChild>
      <a href={outputUrl} download={`last-frame-${Date.now()}.png`}>
        <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
        Download Image
      </a>
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
      isGenerating={isGenerating || isUpdating}
      canContinue={hasOutput}
      generateLabel={inputMode === 'upload' ? 'Save • Free' : `Generate Last Frame • ${creditCost} Credits`}
      creditsCost=""
      isAIGenerated={wasAIGenerated}
      outputActions={outputActions}
    />
  );
}
