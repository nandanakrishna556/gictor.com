import React, { useState } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import LocationSelector from './LocationSelector';
import { ImageUpload } from '@/components/ui/image-upload';
import type { Tag } from '@/hooks/useTags';
import { cn } from '@/lib/utils';
import { startGeneration, CREDIT_COSTS } from '@/lib/generation-service';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface FirstFrameFormProps {
  projectId: string;
  folderId?: string;
  onSuccess: () => void;
  initialStatus?: string;
  tags?: Tag[];
  onCreateTag?: () => void;
  statusOptions?: StatusOption[];
}

const defaultStatusOptions: StatusOption[] = [
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
];

export default function FirstFrameForm({
  projectId,
  folderId,
  onSuccess,
  initialStatus,
  tags = [],
  onCreateTag,
  statusOptions,
}: FirstFrameFormProps) {
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  
  const { user } = useAuth();
  const { profile } = useProfile();

  // Use provided status options or default
  const availableStatusOptions = statusOptions || defaultStatusOptions;
  
  // Get initial status - use initialStatus if valid, otherwise first option
  const getInitialStatus = () => {
    if (initialStatus && availableStatusOptions.some(s => s.value === initialStatus)) {
      return initialStatus;
    }
    return availableStatusOptions[0]?.value || 'processing';
  };

  const [fileName, setFileName] = useState('Untitled');
  const [selectedStatus, setSelectedStatus] = useState(getInitialStatus);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [imageType, setImageType] = useState<'ugc' | 'studio'>('ugc');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  // Update selectedStatus when initialStatus or statusOptions change
  React.useEffect(() => {
    setSelectedStatus(getInitialStatus());
  }, [initialStatus, statusOptions]);

  const creditCost = CREDIT_COSTS.first_frame;
  const hasEnoughCredits = (profile?.credits ?? 0) >= creditCost;

  const currentStatusOption = availableStatusOptions.find(s => s.value === selectedStatus) || availableStatusOptions[0];

  const handleLocationChange = (newProjectId: string, newFolderId?: string) => {
    setCurrentProjectId(newProjectId);
    setCurrentFolderId(newFolderId);
  };

  const handleReferenceImagesChange = (urls: string[]) => {
    setReferenceImageUrls(urls);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      toast.error('Missing prompt', { description: 'Please describe the image you want to generate.' });
      return;
    }

    if (!hasEnoughCredits) {
      toast.error('Insufficient credits', { 
        description: 'You don\'t have enough credits to generate this image.',
        action: {
          label: 'Buy Credits',
          onClick: () => window.location.href = '/billing',
        },
      });
      return;
    }

    if (!user) {
      toast.error('Not authenticated', { description: 'Please log in to continue.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await startGeneration('first_frame', {
        file_id: uuidv4(),
        user_id: user.id,
        project_id: currentProjectId,
        folder_id: currentFolderId,
        file_name: fileName,
        credits_cost: creditCost,
        prompt,
        image_type: imageType,
        aspect_ratio: aspectRatio as '1:1' | '9:16' | '16:9',
        reference_images: referenceImageUrls,
        tags: selectedTags,
      });

      if (result.success) {
        toast.success('Generation started', { description: 'Your first frame is being generated.' });
        onSuccess();
      } else {
        const errorMessage = result.error?.userMessage || 'Failed to start generation. Please try again.';
        toast.error('Error', { description: errorMessage });
      }
    } catch (error) {
      toast.error('Error', { description: 'Failed to start generation. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-6">
      <div className="space-y-6">
        {/* File Name, Location, Status, Tags - All in one row */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px] space-y-2">
            <Label htmlFor="fileName">File name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Location</Label>
            <LocationSelector
              projectId={currentProjectId}
              folderId={currentFolderId}
              onLocationChange={handleLocationChange}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[130px] rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', currentStatusOption.color)} />
                  <span>{currentStatusOption.label}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', status.color)} />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 min-w-[100px] items-center gap-2 rounded-xl border border-input bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  {selectedTags.length > 0 ? (
                    <div className="flex flex-1 flex-wrap items-center gap-1">
                      {selectedTags.slice(0, 2).map((tagId) => {
                        const tag = tags.find((t) => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <span
                            key={tagId}
                            className="rounded px-1.5 py-0.5 text-xs"
                            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                          >
                            {tag.tag_name}
                          </span>
                        );
                      })}
                      {selectedTags.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{selectedTags.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="flex-1 text-left text-muted-foreground">Tags</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-52 bg-card border shadow-lg">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  {tags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No tags available</p>
                  ) : (
                    tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary cursor-pointer"
                        onClick={() => toggleTag(tag.id)}
                      >
                        <Checkbox
                          checked={selectedTags.includes(tag.id)}
                          onCheckedChange={() => toggleTag(tag.id)}
                        />
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1 text-sm truncate">{tag.tag_name}</span>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => onCreateTag?.()}
                    className="flex w-full items-center gap-2 rounded-md p-1.5 text-sm text-primary hover:bg-secondary mt-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create new tag
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Image Type */}
        <div className="space-y-2">
          <Label>Image type</Label>
          <div className="flex rounded-xl border border-border bg-secondary/50 p-1">
            <button
              type="button"
              onClick={() => setImageType('ugc')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
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
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
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
          <ImageUpload
            maxFiles={5}
            folder="first-frame-references"
            onImagesChange={handleReferenceImagesChange}
            placeholder="Drag & drop reference images or"
          />
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
          className="h-12 w-full gap-2 rounded-xl bg-primary font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
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
