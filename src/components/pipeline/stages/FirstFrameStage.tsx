import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import ActorSelectorPopover from '@/components/modals/ActorSelectorPopover';
import { Download, Image as ImageIcon, Loader2, Plus, X } from 'lucide-react';
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

interface FirstFrameStageProps {
  pipelineId: string;
  onContinue: () => void;
}

type Style = 'talking_head' | 'broll' | 'motion_graphics';
type SubStyle = 'ugc' | 'studio';
type AspectRatio = '9:16' | '16:9' | '1:1';
type CameraPerspective = '1st_person' | '3rd_person';
type Resolution = '1K' | '2K' | '4K';

export default function FirstFrameStage({ pipelineId, onContinue }: FirstFrameStageProps) {
  const { pipeline, updateFirstFrame, isUpdating } = usePipeline(pipelineId);
  const { profile } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Input state - matching FrameModal structure with Talking Head defaults
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  const [style, setStyle] = useState<Style>('talking_head'); // Default to Talking Head for this pipeline
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
  
  // Generation state
  const [localGenerating, setLocalGenerating] = useState(false);
  const isLocalGeneratingRef = useRef(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastShownRef = useRef<string | null>(null);
  const generationInitiatedRef = useRef(false);

  // Dynamic credit cost based on resolution
  const creditCost = resolution === '4K' ? 0.15 : 0.1;

  // Derive from pipeline
  const isServerProcessing = pipeline?.status === 'processing' && pipeline?.current_stage === 'first_frame';
  const isGenerating = localGenerating || (isServerProcessing && generationInitiatedRef.current);
  const hasOutput = !!pipeline?.first_frame_output?.url;
  const outputUrl = pipeline?.first_frame_output?.url;

  // Track if initial load is done to prevent overwriting user input
  const initialLoadDone = useRef(false);
  
  // Load existing data only on first mount
  useEffect(() => {
    if (pipeline?.first_frame_input && !initialLoadDone.current) {
      initialLoadDone.current = true;
      const input = pipeline.first_frame_input as any;
      setInputMode(input.mode || 'generate');
      setStyle(input.style || 'talking_head');
      setSubStyle(input.substyle || 'ugc');
      setAspectRatio(input.aspect_ratio || '9:16');
      setCameraPerspective(input.camera_perspective || '3rd_person');
      setResolution(input.resolution || '2K');
      setSelectedActorId(input.actor_id || null);
      setReferenceImages(input.reference_images || []);
      setPrompt(input.prompt || '');
      setUploadedUrl(input.uploaded_url || '');
    }
    
    // Initialize prev status
    if (prevStatusRef.current === null && pipeline) {
      prevStatusRef.current = pipeline.status;
      if (hasOutput) {
        toastShownRef.current = pipelineId;
      }
    }
  }, [pipeline?.first_frame_input, pipeline?.status, hasOutput, pipelineId]);

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
    if (generationInitiatedRef.current && prevStatus === 'processing' && currentStatus !== 'processing' && pipeline.first_frame_output?.url) {
      if (toastShownRef.current !== pipelineId) {
        toastShownRef.current = pipelineId;
        toast.success('First frame generated!');
        queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      }
      setLocalGenerating(false);
      generationInitiatedRef.current = false;
    }
    
    prevStatusRef.current = currentStatus;
  }, [pipeline, pipelineId, queryClient]);

  // Save input changes
  const saveInput = async () => {
    await updateFirstFrame({
      input: {
        mode: inputMode,
        frame_type: 'first',
        style,
        substyle: style !== 'motion_graphics' ? subStyle : null,
        aspect_ratio: aspectRatio,
        camera_perspective: style === 'broll' ? cameraPerspective : null,
        resolution,
        actor_id: (style === 'talking_head' || style === 'broll') ? selectedActorId : null,
        reference_images: referenceImages,
        prompt,
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
    if (inputMode === 'upload') {
      if (!uploadedUrl) {
        toast.error('Please upload an image first');
        return;
      }
      await updateFirstFrame({
        output: {
          url: uploadedUrl,
          generated_at: new Date().toISOString(),
        },
        complete: true,
      });
      toast.success('First frame saved!');
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

    // Immediate feedback
    isLocalGeneratingRef.current = true;
    generationInitiatedRef.current = true;
    setLocalGenerating(true);

    try {
      await saveInput();

      // Set pipeline status to processing BEFORE triggering generation
      // This ensures UI shows loading state and polling starts
      await supabase
        .from('pipelines')
        .update({ status: 'processing', current_stage: 'first_frame' })
        .eq('id', pipelineId);

      // Also sync linked file to show processing in project grid
      const { data: linkedFiles } = await supabase
        .from('files')
        .select('id')
        .eq('generation_params->>pipeline_id', pipelineId);

      if (linkedFiles && linkedFiles.length > 0) {
        await supabase
          .from('files')
          .update({ generation_status: 'processing' })
          .eq('id', linkedFiles[0].id);
      }

      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'pipeline_first_frame',
          payload: {
            pipeline_id: pipelineId,
            prompt,
            frame_type: 'first',
            style,
            substyle: style !== 'motion_graphics' ? subStyle : null,
            aspect_ratio: aspectRatio,
            camera_perspective: style === 'broll' ? cameraPerspective : null,
            frame_resolution: resolution,
            actor_id: (style === 'talking_head' || style === 'broll') ? selectedActorId : null,
            actor_360_url: (style === 'talking_head' || style === 'broll') ? selectedActor?.profile_360_url : null,
            reference_images: referenceImages,
            pipeline_type: 'lip_sync',
            credits_cost: creditCost,
          },
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Generation failed');
      }

      toast.success('First frame generation started!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start generation');
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
      // Reset pipeline status on error
      await supabase
        .from('pipelines')
        .update({ status: 'draft' })
        .eq('id', pipelineId);
    }
  };

  const handleUploadComplete = async (url: string | undefined) => {
    if (url) {
      setUploadedUrl(url);
      await updateFirstFrame({
        input: { mode: 'upload', uploaded_url: url, frame_type: 'first' } as any,
        output: { url, generated_at: new Date().toISOString() },
        complete: true,
      });
    } else {
      setUploadedUrl('');
      await updateFirstFrame({
        input: { mode: 'upload', uploaded_url: '', frame_type: 'first' } as any,
        output: null,
        complete: false,
      });
    }
  };

  const handleContinue = () => {
    if (pipeline?.first_frame_output?.url) {
      updateFirstFrame({ complete: true });
      onContinue();
    }
  };

  const handleDownload = async () => {
    if (!outputUrl) return;
    try {
      const response = await fetch(outputUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `first-frame-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
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
        <>
          {/* Style Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Style</label>
            <div className="space-y-2">
              {/* Talking Head - Default selected */}
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

              {/* B-Roll */}
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
              {style === 'motion_graphics' && "Background only - colors, gradients, patterns"}
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
                  ? "First person view - camera shows what subject sees"
                  : "Observer view - camera captures the subject from outside"}
              </p>
            </div>
          )}

          {/* Actor Selector - Show for Talking Head and B-Roll */}
          {(style === 'talking_head' || style === 'broll') && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Actor</label>
              <ActorSelectorPopover
                selectedActorId={selectedActorId}
                onSelect={handleActorSelect}
              />
            </div>
          )}

          {/* Aspect Ratio and Resolution Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Aspect Ratio</label>
              <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resolution</label>
              <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1K">1K • {0.1} credits</SelectItem>
                  <SelectItem value="2K">2K • {0.1} credits</SelectItem>
                  <SelectItem value="4K">4K • {0.15} credits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference Images - Up to 3 individual slots */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Reference Images (Optional, up to 3)</label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={cn(
                    "aspect-square rounded-lg border-2 border-dashed flex items-center justify-center relative overflow-hidden transition-all",
                    referenceImages[index]
                      ? "border-border"
                      : "border-border hover:border-primary/50 cursor-pointer"
                  )}
                >
                  {referenceImages[index] ? (
                    <>
                      <img
                        src={referenceImages[index]}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 hover:bg-background flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : uploadingIndex === index ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(index, e)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the action, scene, and environment (person will be captured mid-action)..."
              className="min-h-24 resize-none"
            />
          </div>
        </>
      )}
    </div>
  );

  const outputContent = outputUrl ? (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <img
        src={outputUrl}
        alt="Generated first frame"
        className="w-full rounded-xl shadow-lg"
      />
    </div>
  ) : null;

  const outputActions = outputUrl ? (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <Download className="h-4 w-4 mr-2" />
      Download Image
    </Button>
  ) : null;

  const wasAIGenerated = inputMode === 'generate';

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRemix={handleGenerate}
      onContinue={handleContinue}
      isGenerating={isGenerating || isUpdating}
      canContinue={hasOutput}
      generateLabel={inputMode === 'upload' ? 'Save • Free' : `Generate First Frame • ${creditCost} Credits`}
      creditsCost={inputMode === 'upload' ? 'Free' : `${creditCost} Credits`}
      isAIGenerated={wasAIGenerated}
      outputActions={outputActions}
      emptyStateIcon={<ImageIcon className="h-12 w-12 text-muted-foreground/50" />}
      emptyStateTitle="No first frame yet"
      emptyStateSubtitle="Generate or upload an image to get started"
    />
  );
}
