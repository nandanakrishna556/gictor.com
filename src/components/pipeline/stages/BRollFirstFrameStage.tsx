import React, { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { Upload, Sparkles, Download, Copy, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StageLayout from './StageLayout';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';

interface BRollFirstFrameStageProps {
  pipelineId: string;
  onComplete: () => void;
}

type InputMode = 'generate' | 'upload';

const CREDIT_COST = 0.25;

export default function BRollFirstFrameStage({ pipelineId, onComplete }: BRollFirstFrameStageProps) {
  const { pipeline, updateFirstFrame, isUpdating } = usePipeline(pipelineId);
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  
  // Input state
  const [mode, setMode] = useState<InputMode>('generate');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9'>('16:9');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [uploadedUrl, setUploadedUrl] = useState('');
  
  // Generation state
  const [localGenerating, setLocalGenerating] = useState(false);
  const isLocalGeneratingRef = useRef(false);
  const prevStatusRef = useRef<string | null>(null);
  const toastShownRef = useRef<string | null>(null);

  // Derive from pipeline
  const isProcessing = pipeline?.status === 'processing' && pipeline?.current_stage === 'first_frame';
  const isGenerating = localGenerating || isProcessing;
  const hasOutput = !!pipeline?.first_frame_output?.url;
  const outputUrl = pipeline?.first_frame_output?.url;

  // Load existing data
  useEffect(() => {
    if (pipeline?.first_frame_input) {
      const input = pipeline.first_frame_input;
      setMode(input.mode || 'generate');
      setPrompt(input.prompt || '');
      setAspectRatio(input.aspect_ratio || '16:9');
      setReferenceImages(input.reference_images || []);
      setUploadedUrl(input.uploaded_url || '');
      
      // Initialize prev status
      if (prevStatusRef.current === null) {
        prevStatusRef.current = pipeline.status;
        if (hasOutput) {
          toastShownRef.current = pipelineId;
        }
      }
    }
  }, [pipeline?.first_frame_input, pipeline?.status, hasOutput, pipelineId]);

  // Handle status transitions
  useEffect(() => {
    if (!pipeline) return;
    
    const currentStatus = pipeline.status;
    const prevStatus = prevStatusRef.current;
    
    if (isLocalGeneratingRef.current && currentStatus === 'processing') {
      isLocalGeneratingRef.current = false;
      setLocalGenerating(false);
    }
    
    // Completed transition
    if (prevStatus === 'processing' && currentStatus !== 'processing' && pipeline.first_frame_output?.url) {
      if (toastShownRef.current !== pipelineId) {
        toastShownRef.current = pipelineId;
        toast.success('First frame generated!');
        queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineId] });
      }
      setLocalGenerating(false);
    }
    
    prevStatusRef.current = currentStatus;
  }, [pipeline, pipelineId, queryClient]);

  // Save input changes
  const saveInput = async () => {
    await updateFirstFrame({
      input: {
        mode,
        prompt,
        aspect_ratio: aspectRatio,
        reference_images: referenceImages,
        uploaded_url: uploadedUrl,
        image_type: 'b_roll' as any,
      } as any,
    });
  };

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(saveInput, 500);
    return () => clearTimeout(timer);
  }, [mode, prompt, aspectRatio, referenceImages, uploadedUrl]);

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

    if (!profile || (profile.credits ?? 0) < CREDIT_COST) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST} credits.`);
      return;
    }

    // Immediate feedback
    isLocalGeneratingRef.current = true;
    setLocalGenerating(true);

    try {
      // Save input first
      await saveInput();

      // Call edge function for frame generation
      const { data, error } = await supabase.functions.invoke('trigger-generation', {
        body: {
          type: 'pipeline_first_frame_b_roll',
          payload: {
            pipeline_id: pipelineId,
            prompt,
            aspect_ratio: aspectRatio,
            reference_images: referenceImages,
            frame_type: 'first',
            pipeline_type: 'clips',
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
    }
  };

  const handleUploadComplete = async (url: string | undefined) => {
    if (url) {
      setUploadedUrl(url);
      await updateFirstFrame({
        input: { mode: 'upload', uploaded_url: url, image_type: 'b_roll' } as any,
        output: { url, generated_at: new Date().toISOString() },
        complete: true,
      });
    } else {
      setUploadedUrl('');
      await updateFirstFrame({
        input: { mode: 'upload', uploaded_url: '', image_type: 'b_roll' } as any,
        output: null,
        complete: false,
      });
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

  const handleCopy = async () => {
    if (!outputUrl) return;
    try {
      const response = await fetch(outputUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success('Image copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy image');
    }
  };

  const inputContent = (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        <button
          type="button"
          onClick={() => setMode('generate')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
            mode === 'generate'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Generate
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
            mode === 'upload'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Upload className="h-4 w-4" />
          Upload
        </button>
      </div>

      {mode === 'generate' ? (
        <>
          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label>Aspect ratio</Label>
            <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as '1:1' | '9:16' | '16:9')}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference Images */}
          <div className="space-y-2">
            <Label>Reference images (optional)</Label>
            <ImageUpload onImagesChange={setReferenceImages} maxFiles={3} />
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the first frame of your video..."
              className="min-h-32 rounded-xl resize-none"
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label>Upload first frame image</Label>
          <SingleImageUpload value={uploadedUrl} onChange={handleUploadComplete} />
        </div>
      )}
    </div>
  );

  const outputContent = outputUrl ? (
    <div className="w-full max-w-md mx-auto">
      <img src={outputUrl} alt="Generated first frame" className="w-full rounded-xl shadow-lg" />
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center text-center gap-2 min-h-[300px]">
      <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
      <p className="text-lg font-medium">Generate First Frame</p>
      <p className="text-sm text-muted-foreground">Create the starting frame for your video</p>
    </div>
  );

  const outputActions = hasOutput ? (
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
  ) : undefined;

  const wasAIGenerated = pipeline?.first_frame_input?.mode === 'generate';

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
      generateLabel={mode === 'upload' ? 'Use Uploaded Image' : 'Generate First Frame'}
      creditsCost={mode === 'upload' ? 'Free' : `${CREDIT_COST} Credits`}
      isAIGenerated={wasAIGenerated}
      outputActions={outputActions}
    />
  );
}
