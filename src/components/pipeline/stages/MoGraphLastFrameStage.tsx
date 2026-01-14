import React, { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { InputModeToggle, InputMode } from '@/components/ui/input-mode-toggle';
import { Upload, Sparkles, Download, Image as ImageIcon, Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface MoGraphLastFrameStageProps {
  pipelineId: string;
  onComplete: () => void;
  onContinue: () => void;
}

type AspectRatio = '9:16' | '16:9' | '1:1';
type Resolution = '1K' | '2K' | '4K';

const CREDIT_COST = 0.25;

export default function MoGraphLastFrameStage({ pipelineId, onComplete, onContinue }: MoGraphLastFrameStageProps) {
  const { pipeline, updateScript, isUpdating } = usePipeline(pipelineId);
  const { profile } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Input state - Motion Graphics specific (no actor, no substyle)
  const [inputMode, setInputMode] = useState<InputMode>('generate');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [resolution, setResolution] = useState<Resolution>('2K');
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
  const creditCost = resolution === '4K' ? 0.5 : 0.25;

  // Derive output URL from script_output (repurposed for last frame)
  const lastFrameData = pipeline?.script_output as any;
  const outputUrl = lastFrameData?.last_frame_url; 
  const isServerProcessing = pipeline?.status === 'processing' && pipeline?.current_stage === 'script';
  const isGenerating = localGenerating || (isServerProcessing && generationInitiatedRef.current);
  const hasOutput = !!outputUrl;

  // Track if initial load is done
  const initialLoadDone = useRef(false);
  
  // Load existing data only on first mount
  useEffect(() => {
    if (pipeline?.script_input && !initialLoadDone.current) {
      initialLoadDone.current = true;
      const input = pipeline.script_input as any;
      if (input.frame_type === 'last') {
        setInputMode(input.mode || 'generate');
        setAspectRatio(input.aspect_ratio || '9:16');
        setResolution(input.resolution || '2K');
        setReferenceImages(input.reference_images || []);
        setPrompt(input.prompt || '');
        setUploadedUrl(input.uploaded_url || '');
      }
    }
    
    if (prevStatusRef.current === null && pipeline) {
      prevStatusRef.current = pipeline.status;
      if (hasOutput) {
        toastShownRef.current = pipelineId + '_last';
      }
    }
  }, [pipeline?.script_input, pipeline?.status, hasOutput, pipelineId]);

  // Handle status transitions
  useEffect(() => {
    if (!pipeline) return;
    
    const currentStatus = pipeline.status;
    const prevStatus = prevStatusRef.current;
    
    if (generationInitiatedRef.current && currentStatus === 'processing') {
      isLocalGeneratingRef.current = false;
      setLocalGenerating(false);
    }
    
    const lastFrameOutput = pipeline.script_output as any;
    if (generationInitiatedRef.current && prevStatus === 'processing' && currentStatus !== 'processing' && lastFrameOutput?.last_frame_url) {
      if (toastShownRef.current !== pipelineId + '_last') {
        toastShownRef.current = pipelineId + '_last';
        toast.success('Last frame generated!');
        queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      }
      setLocalGenerating(false);
      generationInitiatedRef.current = false;
    }
    
    prevStatusRef.current = currentStatus;
  }, [pipeline, pipelineId, queryClient]);

  // Save input changes
  const saveInput = async () => {
    await updateScript({
      input: {
        mode: inputMode,
        frame_type: 'last',
        style: 'motion_graphics',
        aspect_ratio: aspectRatio,
        resolution,
        reference_images: referenceImages,
        prompt,
        uploaded_url: uploadedUrl,
      } as any,
    });
  };

  // Auto-save on changes (excluding prompt)
  useEffect(() => {
    const timer = setTimeout(saveInput, 500);
    return () => clearTimeout(timer);
  }, [inputMode, aspectRatio, resolution, referenceImages, uploadedUrl]);
  
  // Separate debounced save for prompt
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
      const fileName = `${user.id}/reference-images/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);

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

  const handleGenerate = async () => {
    if (inputMode === 'upload') {
      if (!uploadedUrl) {
        toast.error('Please upload an image first');
        return;
      }
      await updateScript({
        output: { last_frame_url: uploadedUrl, generated_at: new Date().toISOString() } as any,
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
      toast.error(`Insufficient credits. You need ${creditCost} credits.`);
      return;
    }

    isLocalGeneratingRef.current = true;
    generationInitiatedRef.current = true;
    setLocalGenerating(true);

    try {
      await saveInput();

      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'pipeline_last_frame_b_roll',
          payload: {
            pipeline_id: pipelineId,
            prompt,
            frame_type: 'last',
            style: 'motion_graphics',
            aspect_ratio: aspectRatio,
            frame_resolution: resolution,
            reference_images: referenceImages,
            pipeline_type: 'motion_graphics',
            credits_cost: creditCost,
          },
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Generation failed');
      }

      toast.success('Last frame generation started!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start generation');
      setLocalGenerating(false);
      isLocalGeneratingRef.current = false;
    }
  };

  const handleUploadComplete = async (url: string | undefined) => {
    if (url) {
      setUploadedUrl(url);
      await updateScript({
        input: { mode: 'upload', uploaded_url: url, frame_type: 'last', style: 'motion_graphics' } as any,
        output: { last_frame_url: url, generated_at: new Date().toISOString() } as any,
        complete: true,
      });
    } else {
      setUploadedUrl('');
      await updateScript({
        input: { mode: 'upload', uploaded_url: '', frame_type: 'last', style: 'motion_graphics' } as any,
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
          {/* Frame Type - Last Frame locked */}
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

          {/* Style - Motion Graphics locked */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Style</label>
            <div className="p-3 rounded-lg border border-primary bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="text-sm font-medium">Motion Graphics</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Background only - colors, gradients, patterns
            </p>
          </div>

          {/* Aspect Ratio & Resolution */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Aspect Ratio</label>
              <Select value={aspectRatio} onValueChange={(v: AspectRatio) => setAspectRatio(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">9:16 Portrait</SelectItem>
                  <SelectItem value="16:9">16:9 Landscape</SelectItem>
                  <SelectItem value="1:1">1:1 Square</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resolution</label>
              <Select value={resolution} onValueChange={(v: Resolution) => setResolution(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1K">1K (1024px)</SelectItem>
                  <SelectItem value="2K">2K (2048px)</SelectItem>
                  <SelectItem value="4K">4K (4096px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference Images */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Reference Images (optional)</label>
            <p className="text-xs text-muted-foreground mb-2">Add up to 3 reference images</p>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((index) => (
                <div key={index} className="aspect-square relative">
                  {referenceImages[index] ? (
                    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border">
                      <img
                        src={referenceImages[index]}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
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
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      )}
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
              placeholder="Describe your last frame... e.g., 'The gradient transitions to warm orange and gold tones, geometric shapes dissolve into soft particles'"
              className="min-h-[100px] resize-none"
            />
          </div>
        </>
      )}
    </div>
  );

  const generateDisabled = !aspectRatio || (!prompt && inputMode === 'generate');

  const outputContent = outputUrl ? (
    <div className="rounded-xl border border-border overflow-hidden">
      <img src={outputUrl} alt="Generated last frame" className="w-full object-contain" />
    </div>
  ) : null;

  const outputActions = hasOutput && outputUrl ? (
    <Button variant="secondary" className="w-full" asChild>
      <a href={outputUrl} download={`mograph-last-frame-${Date.now()}.png`}>
        <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
        Download Image
      </a>
    </Button>
  ) : undefined;

  return (
    <StageLayout
      inputContent={inputContent}
      outputContent={outputContent}
      isGenerating={isGenerating}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onContinue={onContinue}
      canContinue={hasOutput}
      generateLabel={inputMode === 'upload' ? 'Save' : 'Generate Last Frame'}
      creditsCost={inputMode === 'upload' ? '' : `${creditCost} Credits`}
      generateDisabled={generateDisabled}
      outputActions={outputActions}
      emptyStateTitle="Generated image will appear here"
      emptyStateSubtitle="Describe your motion graphics last frame"
    />
  );
}
