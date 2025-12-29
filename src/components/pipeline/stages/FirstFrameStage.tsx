import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { Upload, Sparkles, Download, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePipeline } from '@/hooks/usePipeline';
import { generateFirstFrame } from '@/lib/pipeline-service';
import { PIPELINE_CREDITS } from '@/types/pipeline';
import { toast } from 'sonner';
import StageLayout from './StageLayout';

interface FirstFrameStageProps {
  pipelineId: string;
  onContinue: () => void;
}

type InputMode = 'generate' | 'upload';

export default function FirstFrameStage({ pipelineId, onContinue }: FirstFrameStageProps) {
  const { pipeline, updateFirstFrame, isUpdating } = usePipeline(pipelineId);
  
  // Input state
  const [mode, setMode] = useState<InputMode>('generate');
  const [prompt, setPrompt] = useState('');
  const [imageType, setImageType] = useState<'ugc' | 'studio'>('ugc');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9'>('9:16');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [uploadedUrl, setUploadedUrl] = useState('');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing data
  useEffect(() => {
    if (pipeline?.first_frame_input) {
      const input = pipeline.first_frame_input;
      setMode(input.mode || 'generate');
      setPrompt(input.prompt || '');
      setImageType(input.image_type || 'ugc');
      setAspectRatio(input.aspect_ratio || '9:16');
      setReferenceImages(input.reference_images || []);
      setUploadedUrl(input.uploaded_url || '');
    }
  }, [pipeline?.first_frame_input]);

  // Save input changes
  const saveInput = async () => {
    await updateFirstFrame({
      input: {
        mode,
        prompt,
        image_type: imageType,
        aspect_ratio: aspectRatio,
        reference_images: referenceImages,
        uploaded_url: uploadedUrl,
      },
    });
  };

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(saveInput, 500);
    return () => clearTimeout(timer);
  }, [mode, prompt, imageType, aspectRatio, referenceImages, uploadedUrl]);

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

    setIsGenerating(true);
    try {
      const previousImageUrl = isEditing ? pipeline?.first_frame_output?.url : undefined;
      
      const result = await generateFirstFrame(
        pipelineId,
        { prompt, image_type: imageType, aspect_ratio: aspectRatio, reference_images: referenceImages },
        isEditing,
        previousImageUrl
      );

      if (!result.success) {
        toast.error(result.error || 'Generation failed');
        return;
      }

      toast.success('First frame generation started!');
    } catch (error) {
      toast.error('Failed to start generation');
    } finally {
      setIsGenerating(false);
      setIsEditing(false);
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
      // Image was removed - clear the output
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
          {/* Image Type */}
          <div className="space-y-2">
            <Label>Image type</Label>
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setImageType('ugc')}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  imageType === 'ugc'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                UGC
              </button>
              <button
                type="button"
                onClick={() => setImageType('studio')}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  imageType === 'studio'
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
            <Select value={aspectRatio} onValueChange={(v) => setAspectRatio(v as '1:1' | '9:16' | '16:9')}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
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
    } catch (error) {
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
    } catch (error) {
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
      creditsCost={mode === 'upload' ? 'Free' : `${PIPELINE_CREDITS.first_frame} Credits`}
      isAIGenerated={wasAIGenerated}
      outputActions={hasOutput ? outputActions : undefined}
    />
  );
}
