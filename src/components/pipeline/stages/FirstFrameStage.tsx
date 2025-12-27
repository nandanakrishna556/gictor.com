import React, { useState } from 'react';
import { usePipeline } from '@/hooks/usePipeline';
import { generateFirstFrame } from '@/lib/pipeline-service';
import { PIPELINE_CREDITS } from '@/types/pipeline';
import StageLayout from './StageLayout';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { toast } from 'sonner';

interface FirstFrameStageProps {
  pipelineId: string;
  onContinue: () => void;
}

export default function FirstFrameStage({ pipelineId, onContinue }: FirstFrameStageProps) {
  const { pipeline, updateFirstFrame, isUpdating } = usePipeline(pipelineId);
  
  const [mode, setMode] = useState<'generate' | 'upload'>(pipeline?.first_frame_input?.mode || 'generate');
  const [prompt, setPrompt] = useState(pipeline?.first_frame_input?.prompt || '');
  const [imageType, setImageType] = useState<'ugc' | 'studio'>(pipeline?.first_frame_input?.image_type || 'ugc');
  const [aspectRatio, setAspectRatio] = useState<string>(pipeline?.first_frame_input?.aspect_ratio || '9:16');
  const [referenceImages, setReferenceImages] = useState<string[]>(pipeline?.first_frame_input?.reference_images || []);
  const [uploadedUrl, setUploadedUrl] = useState(pipeline?.first_frame_input?.uploaded_url || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const hasOutput = !!pipeline?.first_frame_output?.url;
  const outputUrl = pipeline?.first_frame_output?.url;

  const handleGenerate = async () => {
    if (mode === 'upload') {
      if (!uploadedUrl) {
        toast.error('Please upload an image first');
        return;
      }
      await updateFirstFrame({
        input: { mode: 'upload', uploaded_url: uploadedUrl },
        output: { url: uploadedUrl, generated_at: new Date().toISOString() },
        complete: true,
      });
      toast.success('Image saved');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      await updateFirstFrame({
        input: { mode: 'generate', prompt, image_type: imageType, aspect_ratio: aspectRatio as '1:1' | '9:16' | '16:9', reference_images: referenceImages },
      });

      const result = await generateFirstFrame(pipelineId, {
        prompt,
        image_type: imageType,
        aspect_ratio: aspectRatio,
        reference_images: referenceImages,
      });

      if (!result.success) {
        toast.error(result.error || 'Generation failed');
      } else {
        toast.success('Generation started');
      }
    } catch (error) {
      toast.error('Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleContinue = () => {
    if (hasOutput) {
      updateFirstFrame({ complete: true });
      onContinue();
    }
  };

  const inputContent = (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="space-y-2">
        <Label>Mode</Label>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'generate' | 'upload')} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="generate" id="generate" />
            <Label htmlFor="generate" className="font-normal cursor-pointer">Generate</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="upload" id="upload" />
            <Label htmlFor="upload" className="font-normal cursor-pointer">Upload</Label>
          </div>
        </RadioGroup>
      </div>

      {mode === 'generate' ? (
        <>
          {/* Image Type */}
          <div className="space-y-2">
            <Label>Image Type</Label>
            <RadioGroup value={imageType} onValueChange={(v) => setImageType(v as 'ugc' | 'studio')} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ugc" id="ugc" />
                <Label htmlFor="ugc" className="font-normal cursor-pointer">UGC Style</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="studio" id="studio" />
                <Label htmlFor="studio" className="font-normal cursor-pointer">Studio</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={4}
            />
          </div>

          {/* Reference Images */}
          <div className="space-y-2">
            <Label>Reference Images (optional)</Label>
            <SingleImageUpload
              value={referenceImages[0] || ''}
              onChange={(url) => setReferenceImages(url ? [url] : [])}
              className="h-32"
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label>Upload Image</Label>
          <SingleImageUpload
            value={uploadedUrl}
            onChange={setUploadedUrl}
            className="h-48"
          />
        </div>
      )}
    </div>
  );

  const outputContent = outputUrl ? (
    <div className="flex items-center justify-center h-full">
      <img 
        src={outputUrl} 
        alt="Generated first frame" 
        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
      />
    </div>
  ) : null;

  return (
    <StageLayout
      inputTitle="First Frame Input"
      inputContent={inputContent}
      outputTitle="First Frame Output"
      outputContent={outputContent}
      hasOutput={hasOutput}
      onGenerate={handleGenerate}
      onRegenerate={handleRegenerate}
      onContinue={handleContinue}
      isGenerating={isGenerating || isUpdating}
      canContinue={hasOutput}
      generateLabel={mode === 'upload' ? 'Save Image' : 'Generate'}
      creditsCost={mode === 'upload' ? 'Free' : `${PIPELINE_CREDITS.first_frame} credits`}
      showEditButton={false}
    />
  );
}
