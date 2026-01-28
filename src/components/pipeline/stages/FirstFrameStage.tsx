import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { Upload, Download, Copy, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { useActors, Actor } from '@/hooks/useActors';
import { useProfile } from '@/hooks/useProfile';
import { generateFirstFrame } from '@/lib/pipeline-service';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { uploadToR2 } from '@/lib/cloudflare-upload';
import ActorSelectorPopover from '@/components/modals/ActorSelectorPopover';

interface FirstFrameStageProps {
  pipelineId: string;
  onContinue: () => void;
}

type SubStyle = 'ugc' | 'studio';
type AspectRatio = '9:16' | '16:9' | '1:1';
type Resolution = '1K' | '2K' | '4K';

export default function FirstFrameStage({ pipelineId, onContinue }: FirstFrameStageProps) {
  const { pipeline, updateFirstFrame, isUpdating } = usePipeline(pipelineId);
  const { actors } = useActors();
  const { profile } = useProfile();
  
  // Input mode
  const [mode, setMode] = useState<InputMode>('generate');
  
  // Input state - matches FrameModal for talking_head style
  const [subStyle, setSubStyle] = useState<SubStyle>('ugc');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [uploadedUrl, setUploadedUrl] = useState('');
  
  // Upload state for reference images
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Prevent overwriting prompt during typing
  const initialLoadDone = useRef(false);
  const generationInitiatedRef = useRef(false);

  // Get available actors with 360 priority
  const availableActors = actors?.filter(
    (actor) => actor.status === 'completed' && (actor.profile_360_url || actor.profile_image_url)
  ) || [];

  // Dynamic credit cost based on resolution
  const creditCost = resolution === '4K' ? 0.15 : 0.1;

  // Load existing data
  useEffect(() => {
    if (pipeline?.first_frame_input && !initialLoadDone.current) {
      initialLoadDone.current = true;
      const input = pipeline.first_frame_input;
      setMode(input.mode || 'generate');
      setSubStyle(input.substyle || input.image_type || 'ugc');
      setAspectRatio(input.aspect_ratio || '9:16');
      setSelectedActorId(input.actor_id || null);
      setReferenceImages(input.reference_images || []);
      setPrompt(input.prompt || '');
      setResolution(input.resolution || '2K');
      setUploadedUrl(input.uploaded_url || '');
    }
  }, [pipeline?.first_frame_input]);

  // Save input changes with debounce
  const saveInput = useCallback(async () => {
    if (!pipelineId || generationInitiatedRef.current) return;
    
    await updateFirstFrame({
      input: {
        mode,
        style: 'talking_head',
        substyle: subStyle,
        image_type: subStyle, // Keep for backward compatibility
        aspect_ratio: aspectRatio,
        actor_id: selectedActorId || undefined,
        reference_images: referenceImages,
        prompt,
        resolution,
        uploaded_url: uploadedUrl,
      },
    });
  }, [mode, subStyle, aspectRatio, selectedActorId, referenceImages, prompt, resolution, uploadedUrl, pipelineId, updateFirstFrame]);

  // Auto-save on changes
  useEffect(() => {
    if (!initialLoadDone.current) return;
    const timer = setTimeout(saveInput, 1500);
    return () => clearTimeout(timer);
  }, [saveInput]);

  // Handle actor selection
  const handleActorSelect = (actorId: string | null) => {
    setSelectedActorId(actorId);
  };

  // Handle reference image upload
  const handleImageUploadFromFile = async (index: number, file: File) => {
    if (!file) return;

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
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUploadFromFile(index, file);
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingIndex(null);
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUploadFromFile(index, file);
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingIndex(null);
  };

  const handleRemoveImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (mode === 'upload') {
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

    // Check credits
    if ((profile?.credits ?? 0) < creditCost) {
      toast.error('Insufficient credits', { 
        description: `You need ${creditCost} credits but have ${profile?.credits ?? 0}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    generationInitiatedRef.current = true;
    setIsGenerating(true);

    try {
      const previousImageUrl = isEditing ? pipeline?.first_frame_output?.url : undefined;
      
      const result = await generateFirstFrame(
        pipelineId,
        { 
          prompt, 
          image_type: subStyle, 
          aspect_ratio: aspectRatio, 
          reference_images: referenceImages,
        },
        isEditing,
        previousImageUrl
      );

      if (!result.success) {
        toast.error(result.error || 'Generation failed');
        return;
      }

      toast.success('First frame generation started!');
    } catch {
      toast.error('Failed to start generation');
    } finally {
      setIsGenerating(false);
      setIsEditing(false);
      generationInitiatedRef.current = false;
    }
  };

  const handleRegenerate = async () => {
    setIsEditing(false);
    await handleGenerate();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setPrompt('');
  };

  const handleUploadComplete = async (url: string | undefined) => {
    if (url) {
      setUploadedUrl(url);
      await updateFirstFrame({
        input: { mode: 'upload', uploaded_url: url },
        output: { url, generated_at: new Date().toISOString() },
        complete: true,
      });
    } else {
      setUploadedUrl('');
      await updateFirstFrame({
        input: { mode: 'upload', uploaded_url: '' },
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

  const hasOutput = !!pipeline?.first_frame_output?.url;
  const outputUrl = pipeline?.first_frame_output?.url;

  const inputContent = (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <InputModeToggle
        mode={mode}
        onModeChange={setMode}
        uploadLabel="Upload"
      />

      {mode === 'generate' ? (
        <>
          {/* Sub-style Toggle (UGC/Studio) */}
          <div className="space-y-2">
            <Label>Style</Label>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setSubStyle('ugc')}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  subStyle === 'ugc'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                UGC
              </button>
              <button
                type="button"
                onClick={() => setSubStyle('studio')}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  subStyle === 'studio'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Studio
              </button>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label>Aspect ratio</Label>
            <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as AspectRatio)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label>Resolution</Label>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {(['1K', '2K', '4K'] as Resolution[]).map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setResolution(res)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                    resolution === res
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {res}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {resolution === '4K' ? '0.15 credits' : '0.1 credits'}
            </p>
          </div>

          {/* Actor Selector */}
          <div className="space-y-2">
            <Label>Actor (optional)</Label>
            <ActorSelectorPopover
              selectedActorId={selectedActorId}
              onSelect={handleActorSelect}
            />
          </div>

          {/* Reference Images */}
          <div className="space-y-2">
            <Label>Reference images (optional)</Label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((index) => (
                <div key={index} className="relative">
                  {referenceImages[index] ? (
                    <div className="relative aspect-square group">
                      <img
                        src={referenceImages[index]}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 z-10 rounded-full bg-foreground/80 p-1 text-background opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className={cn(
                        "flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                        draggingIndex === index
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-secondary/50",
                        uploadingIndex === index && "opacity-50 pointer-events-none"
                      )}
                      onDrop={(e) => handleDrop(index, e)}
                      onDragOver={(e) => handleDragOver(index, e)}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(index, e)}
                        disabled={uploadingIndex === index}
                      />
                      {uploadingIndex === index ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      )}
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label>
              Prompt {isEditing && <span className="text-primary text-xs ml-2">(Edit Mode)</span>}
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isEditing ? "Describe the changes you want..." : "Describe the image you want to generate..."}
              className="min-h-32 rounded-xl resize-none"
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label>Upload first frame image</Label>
          <SingleImageUpload
            value={uploadedUrl}
            onChange={handleUploadComplete}
          />
        </div>
      )}
    </div>
  );

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
    } catch {
      toast.error('Failed to download image');
    }
  };

  const handleCopy = async () => {
    if (!outputUrl) return;
    try {
      const response = await fetch(outputUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      toast.success('Image copied to clipboard');
    } catch {
      toast.error('Failed to copy image');
    }
  };

  const outputContent = outputUrl ? (
    <div className="w-full max-w-md mx-auto">
      <img
        src={outputUrl}
        alt="Generated first frame"
        className="w-full rounded-xl shadow-lg"
      />
    </div>
  ) : null;

  const outputActions = (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
      <Button variant="ghost" size="sm" onClick={handleCopy}>
        <Copy className="h-4 w-4 mr-2" />
        Copy
      </Button>
    </div>
  );

  // Check if output was AI generated (not uploaded)
  const wasAIGenerated = pipeline?.first_frame_input?.mode === 'generate';

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRemix={handleRegenerate}
      onEdit={handleEdit}
      onContinue={handleContinue}
      isGenerating={isGenerating || isUpdating}
      canContinue={hasOutput}
      generateLabel={mode === 'upload' ? 'Use Uploaded Image' : (isEditing ? 'Edit Image' : 'Generate First Frame')}
      creditsCost={mode === 'upload' ? 'Free' : `${creditCost} Credits`}
      isAIGenerated={wasAIGenerated}
      outputActions={hasOutput ? outputActions : undefined}
      emptyStateIcon={<ImageIcon className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />}
      emptyStateTitle="Generated image will appear here"
      emptyStateSubtitle="Enter a prompt and generate your first frame"
    />
  );
}
