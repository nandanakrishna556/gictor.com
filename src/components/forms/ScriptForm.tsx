import React, { useState } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
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
import { useFiles } from '@/hooks/useFiles';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import LocationSelector from './LocationSelector';
import type { Tag } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface ScriptFormProps {
  projectId: string;
  folderId?: string;
  onSuccess: () => void;
  initialStatus?: string;
  tags?: Tag[];
  onCreateTag?: () => void;
  statusOptions?: StatusOption[];
}

const scriptTypes = [
  'Sales',
  'Educational',
  'Entertainment',
  'Tutorial',
  'Story',
  'Other',
];

const defaultStatusOptions: StatusOption[] = [
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
];

export default function ScriptForm({
  projectId,
  folderId,
  onSuccess,
  initialStatus,
  tags = [],
  onCreateTag,
  statusOptions,
}: ScriptFormProps) {
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  
  const { createFile } = useFiles(currentProjectId, currentFolderId);
  const { profile, deductCredits } = useProfile();
  const { toast } = useToast();

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
  const [duration, setDuration] = useState(60);
  const [scriptType, setScriptType] = useState('Sales');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update selectedStatus when initialStatus or statusOptions change
  React.useEffect(() => {
    setSelectedStatus(getInitialStatus());
  }, [initialStatus, statusOptions]);

  const creditCost = 0.5;
  const hasEnoughCredits = (profile?.credits ?? 0) >= creditCost;
  const estimatedCharacters = Math.round(duration * 15);

  const currentStatusOption = availableStatusOptions.find(s => s.value === selectedStatus) || availableStatusOptions[0];

  const handleLocationChange = (newProjectId: string, newFolderId?: string) => {
    setCurrentProjectId(newProjectId);
    setCurrentFolderId(newFolderId);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast({
        title: 'Missing description',
        description: 'Please describe what the script should be about.',
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
      const fileId = crypto.randomUUID();
      await createFile({
        id: fileId,
        project_id: currentProjectId,
        folder_id: currentFolderId || null,
        name: fileName,
        file_type: 'script',
        status: selectedStatus,
        tags: selectedTags,
        generation_params: {
          duration_seconds: duration,
          script_type: scriptType,
          description,
        },
      });

      await deductCredits(creditCost);

      toast({
        title: 'Generation started',
        description: 'Your script is being generated.',
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

        {/* Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Estimated duration</Label>
            <span className="text-sm font-medium text-foreground">
              {formatDuration(duration)}
            </span>
          </div>
          <Slider
            value={[duration]}
            onValueChange={([v]) => setDuration(v)}
            min={30}
            max={600}
            step={30}
          />
          <p className="text-sm text-muted-foreground">
            ~{estimatedCharacters.toLocaleString()} characters
          </p>
        </div>

        {/* Script Type */}
        <div className="space-y-2">
          <Label>Script type</Label>
          <Select value={scriptType} onValueChange={setScriptType}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scriptTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Brief description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what the script should be about..."
            className="min-h-32 resize-none rounded-xl"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || !hasEnoughCredits || !description.trim()}
          className="h-12 w-full gap-2 rounded-xl bg-primary font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Script • {creditCost} Credits
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
