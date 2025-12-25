import { useState } from 'react';
import { Upload, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFiles } from '@/hooks/useFiles';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface FirstFrameFormProps {
  projectId: string;
  folderId?: string;
  onSuccess: () => void;
}

export default function FirstFrameForm({
  projectId,
  folderId,
  onSuccess,
}: FirstFrameFormProps) {
  const { createFile } = useFiles(projectId, folderId);
  const { profile, deductCredits } = useProfile();
  const { toast } = useToast();

  const [fileName, setFileName] = useState('Untitled');
  const [imageType, setImageType] = useState<'ugc' | 'studio'>('ugc');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const creditCost = 0.25;
  const hasEnoughCredits = (profile?.credits ?? 0) >= creditCost;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (referenceImages.length + files.length > 5) {
      toast({
        title: 'Too many images',
        description: 'You can upload up to 5 reference images.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingImages(true);

    // For demo, we'll just use object URLs
    // In production, upload to cloud storage
    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      newImages.push(url);
    }

    setReferenceImages((prev) => [...prev, ...newImages]);
    setUploadingImages(false);
  };

  const removeImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast({
        title: 'Missing prompt',
        description: 'Please describe the image you want to generate.',
        variant: 'destructive',
      });
      return;
    }

    if (!hasEnoughCredits) {
      toast({
        title: 'Insufficient credits',
        description: 'Please purchase more credits to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create file record
      const fileId = crypto.randomUUID();
      await createFile({
        id: fileId,
        project_id: projectId,
        folder_id: folderId || null,
        name: fileName,
        file_type: 'first_frame',
        status: 'processing',
        generation_params: {
          image_type: imageType,
          aspect_ratio: aspectRatio,
          reference_images: referenceImages,
          prompt,
        },
      });

      // Deduct credits
      await deductCredits(creditCost);

      toast({
        title: 'Generation started',
        description: 'Your first frame is being generated.',
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start generation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-6">
        {/* File Name */}
        <div className="space-y-2">
          <Label htmlFor="fileName">File name</Label>
          <Input
            id="fileName"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="rounded-xl"
          />
        </div>

        {/* Image Type */}
        <div className="space-y-2">
          <Label>Image type</Label>
          <div className="flex rounded-xl border border-border bg-secondary/50 p-1">
            <button
              type="button"
              onClick={() => setImageType('ugc')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-apple ${
                imageType === 'ugc'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              UGC
            </button>
            <button
              type="button"
              onClick={() => setImageType('studio')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-apple ${
                imageType === 'studio'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Studio
            </button>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label>Aspect ratio</Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
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
          <div className="flex flex-wrap gap-3">
            {referenceImages.map((url, index) => (
              <div key={index} className="group relative">
                <img
                  src={url}
                  alt={`Reference ${index + 1}`}
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-apple group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {referenceImages.length < 5 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-apple hover:border-primary hover:text-primary">
                <Upload className="h-5 w-5" />
                <span className="mt-1 text-xs">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload up to 5 reference images
          </p>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            className="min-h-24 rounded-xl resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || !hasEnoughCredits || !prompt.trim()}
          className="h-12 w-full gap-2 rounded-xl bg-primary font-medium text-primary-foreground transition-apple hover:opacity-90"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate First Frame • {creditCost} Credits
            </>
          )}
        </Button>
        {!hasEnoughCredits && (
          <p className="text-center text-sm text-destructive">
            Insufficient credits. Please purchase more.
          </p>
        )}
      </div>
    </form>
  );
}
