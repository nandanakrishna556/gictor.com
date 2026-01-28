import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { generateFirstFrame } from '@/lib/pipeline-service';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import ActorSelectorPopover from '@/components/modals/ActorSelectorPopover';
import { Loader2, Download, Image as ImageIcon, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface FirstFrameStageProps {
  pipelineId: string;
  onContinue: () => void;
}

type FrameStyle = 'talking_head' | 'broll' | 'motion_graphics';
type SubStyle = 'ugc' | 'studio';
type AspectRatio = '9:16' | '16:9' | '1:1';
type Resolution = '1K' | '2K' | '4K';

export default function FirstFrameStage({ pipelineId, onContinue }: FirstFrameStageProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { pipeline, updateFirstFrame, updatePipeline } = usePipeline(pipelineId);

  // Input mode
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isSavingUpload, setIsSavingUpload] = useState(false);

  // Generation inputs
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('talking_head');
  const [subStyle, setSubStyle] = useState<SubStyle>('ugc');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [resolution, setResolution] = useState<Resolution>('2K');
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');

  // Upload state for reference images
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const initialLoadDoneRef = useRef(false);
  const generationInitiatedRef = useRef(false);

  // Dynamic credit cost based on resolution
  const creditCost = resolution === '4K' ? 0.15 : 0.1;

  // Derived state
  const hasOutput = pipeline?.first_frame_complete && pipeline?.first_frame_output?.url;
  const outputUrl = pipeline?.first_frame_output?.url;
  const isServerProcessing = pipeline?.status === 'processing';

  // Load saved state from pipeline
  useEffect(() => {
    if (!pipeline || initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    const input = pipeline.first_frame_input;
    if (input) {
      if (input.style) setFrameStyle(input.style as FrameStyle);
      if (input.substyle) setSubStyle(input.substyle as SubStyle);
      if (input.aspect_ratio) setAspectRatio(input.aspect_ratio as AspectRatio);
      if (input.resolution) setResolution(input.resolution as Resolution);
      if (input.actor_id) setSelectedActorId(input.actor_id as string);
      if (input.reference_images) setReferenceImages(input.reference_images as string[]);
      if (input.prompt) setPrompt(input.prompt as string);
      if (input.mode) setInputMode(input.mode as InputMode);
      if (input.uploaded_url) setUploadedImageUrl(input.uploaded_url as string);
    }
  }, [pipeline]);

  // Auto-save inputs (debounced)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveInputs = useCallback(() => {
    if (!pipeline || !initialLoadDoneRef.current) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      await updateFirstFrame({
        input: {
          mode: inputMode,
          style: frameStyle,
          substyle: subStyle,
          aspect_ratio: aspectRatio,
          resolution,
          actor_id: selectedActorId,
          reference_images: referenceImages,
          prompt,
          uploaded_url: uploadedImageUrl,
        } as any,
      });
    }, 1500);
  }, [pipeline, inputMode, frameStyle, subStyle, aspectRatio, resolution, selectedActorId, referenceImages, prompt, uploadedImageUrl, updateFirstFrame]);

  useEffect(() => {
    if (initialLoadDoneRef.current) {
      saveInputs();
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [frameStyle, subStyle, aspectRatio, resolution, selectedActorId, referenceImages, prompt, inputMode, uploadedImageUrl, saveInputs]);

  // Handle actor selection
  const handleActorSelect = (actorId: string | null) => {
    setSelectedActorId(actorId);
  };

  // Handle reference image upload
  const handleImageUploadFromFile = async (index: number, file: File) => {
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingIndex(index);

    try {
      const { uploadToR2 } = await import('@/lib/cloudflare-upload');
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

  // Handle save uploaded image
  const handleSaveUpload = async () => {
    if (!uploadedImageUrl) return;

    setIsSavingUpload(true);
    try {
      await updateFirstFrame({
        input: {
          mode: 'upload',
          uploaded_url: uploadedImageUrl,
        } as any,
        output: { url: uploadedImageUrl, generated_at: new Date().toISOString() },
        complete: true,
      });

      toast.success('Image saved!');
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
    } catch {
      toast.error('Failed to save image');
    } finally {
      setIsSavingUpload(false);
    }
  };

  // Handle generate
  const handleGenerate = async () => {
    if (!profile || !user) return;

    if ((profile.credits ?? 0) < creditCost) {
      toast.error('Insufficient credits', {
        description: `You need ${creditCost} credits but have ${profile.credits ?? 0}.`,
        action: {
          label: 'Buy Credits',
          onClick: () => (window.location.href = '/billing'),
        },
      });
      return;
    }

    generationInitiatedRef.current = true;
    setIsGenerating(true);

    try {
      // Update pipeline status to processing
      await updatePipeline({ status: 'processing' });

      const result = await generateFirstFrame(pipelineId, {
        prompt,
        image_type: subStyle,
        aspect_ratio: aspectRatio,
        reference_images: referenceImages,
      });

      if (!result.success) {
        throw new Error(result.error || 'Generation failed');
      }

      toast.success('Generation started!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to start generation');
      await updatePipeline({ status: 'draft' });
    } finally {
      setIsGenerating(false);
      generationInitiatedRef.current = false;
    }
  };

  const canGenerate = !isGenerating && !isServerProcessing && profile && (profile.credits ?? 0) >= creditCost;
  const showGenerating = isGenerating || (isServerProcessing && generationInitiatedRef.current);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Input Section - Scrollable */}
      <div className="w-1/2 h-full flex flex-col border-r border-border">
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Input</h3>

          {/* Generate/Upload Toggle */}
          <InputModeToggle mode={inputMode} onModeChange={setInputMode} uploadLabel="Upload" />

          {inputMode === 'upload' ? (
            /* Upload Mode UI */
            <div className="space-y-4">
              <SingleImageUpload
                value={uploadedImageUrl || undefined}
                onChange={(url) => setUploadedImageUrl(url || null)}
                aspectRatio="video"
                placeholder="Drag & drop your image or"
                showGenerateLink={false}
              />

              {uploadedImageUrl && (
                <Button onClick={handleSaveUpload} disabled={isSavingUpload} className="w-full">
                  {isSavingUpload ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Image <span className="text-emerald-400 ml-1">• Free</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            /* Generate Mode UI */
            <>
              {/* Style Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Style</label>
                <div className="space-y-2">
                  {/* Talking Head Option */}
                  <div 
                    onClick={() => setFrameStyle('talking_head')}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      frameStyle === 'talking_head' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                        frameStyle === 'talking_head' ? "border-primary" : "border-muted-foreground"
                      )}>
                        {frameStyle === 'talking_head' && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-medium">Talking Head</span>
                    </div>
                    {frameStyle === 'talking_head' && (
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

                  {/* B-Roll Option */}
                  <div 
                    onClick={() => setFrameStyle('broll')}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      frameStyle === 'broll' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                        frameStyle === 'broll' ? "border-primary" : "border-muted-foreground"
                      )}>
                        {frameStyle === 'broll' && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-medium">B-Roll</span>
                    </div>
                    {frameStyle === 'broll' && (
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

                  {/* Motion Graphics Option */}
                  <div 
                    onClick={() => setFrameStyle('motion_graphics')}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      frameStyle === 'motion_graphics' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                        frameStyle === 'motion_graphics' ? "border-primary" : "border-muted-foreground"
                      )}>
                        {frameStyle === 'motion_graphics' && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-medium">Motion Graphics</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {frameStyle === 'talking_head' && "Person looking directly at camera"}
                  {frameStyle === 'broll' && "Person captured mid-action, natural movement"}
                  {frameStyle === 'motion_graphics' && "Background only - colors, gradients, patterns"}
                </p>
              </div>

            {/* Actor Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Actor</label>
              <ActorSelectorPopover selectedActorId={selectedActorId} onSelect={handleActorSelect} />
            </div>

            {/* Aspect Ratio & Resolution */}
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
                      <SelectItem value="1K">1K • 0.1 credits</SelectItem>
                      <SelectItem value="2K">2K • 0.1 credits</SelectItem>
                      <SelectItem value="4K">4K • 0.15 credits</SelectItem>
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
                  const isDragging = draggingIndex === index;

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
                        <label
                          onDrop={(e) => handleDrop(index, e)}
                          onDragOver={(e) => handleDragOver(index, e)}
                          onDragLeave={handleDragLeave}
                          className={cn(
                            'aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all',
                            isUploading && 'pointer-events-none',
                            isDragging ? 'border-primary bg-primary/10 scale-105' : 'border-border hover:border-primary/50'
                          )}
                        >
                          {isUploading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <Plus className={cn('h-5 w-5', isDragging ? 'text-primary' : 'text-muted-foreground')} />
                              <span className={cn('text-xs', isDragging ? 'text-primary' : 'text-muted-foreground')}>
                                {isDragging ? 'Drop' : 'Add'}
                              </span>
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
                  placeholder={frameStyle === 'talking_head' 
                    ? "Describe the person, their expression, clothing, and setting (looking at camera)..."
                    : "Describe the scene, environment, and visual elements..."
                  }
                  rows={3}
                  className="resize-none"
                />
                {hasOutput && !showGenerating && (
                  <p className="text-xs text-muted-foreground">Describe what you'd like to change</p>
                )}
              </div>

              {/* Generate Section */}
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-medium">{creditCost} credits</span>
                </div>
                <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full">
                  {showGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" strokeWidth={1.5} />
                      Generating...
                    </>
                  ) : (
                    `Generate • ${creditCost} credits`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Output Section */}
      <div className="w-1/2 overflow-y-auto p-6 space-y-6 bg-muted/10">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Output</h3>

        {showGenerating || isServerProcessing ? (
          <div className="space-y-4">
            <div className="aspect-square rounded-xl bg-secondary/50 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">Generating your image...</p>
              </div>
            </div>
          </div>
        ) : hasOutput && outputUrl ? (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-xl border border-border overflow-hidden">
              <img src={outputUrl} alt="Generated frame" className="w-full object-contain" />
            </div>
            <Button variant="secondary" className="w-full" asChild>
              <a href={outputUrl} download="first-frame.png">
                <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Download Image
              </a>
            </Button>
            <Button onClick={onContinue} className="w-full">
              Continue to Speech
            </Button>
          </div>
        ) : (
          <div className="aspect-square rounded-xl bg-secondary/30 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="text-muted-foreground text-sm">Generated image will appear here</p>
            <p className="text-muted-foreground/70 text-xs">Configure inputs and click Generate</p>
          </div>
        )}
      </div>
    </div>
  );
}
