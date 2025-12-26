import { useState } from 'react';
import { Upload, Sparkles, ChevronDown, Play, Star, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { cn } from '@/lib/utils';
import { useFiles } from '@/hooks/useFiles';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import LocationSelector from './LocationSelector';
import type { Tag } from '@/hooks/useTags';

interface TalkingHeadFormProps {
  projectId: string;
  folderId?: string;
  onSuccess: () => void;
  initialStatus?: string;
  tags?: Tag[];
  onCreateTag?: () => void;
}

const voices = [
  { id: 'voice_1', name: 'Sarah', gender: 'female', accent: 'American' },
  { id: 'voice_2', name: 'Michael', gender: 'male', accent: 'British' },
  { id: 'voice_3', name: 'Emma', gender: 'female', accent: 'Australian' },
  { id: 'voice_4', name: 'James', gender: 'male', accent: 'American' },
];

const CHARS_PER_BLOCK = 120;
const SECONDS_PER_BLOCK = 8;

const defaultStatusOptions = [
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
];

export default function TalkingHeadForm({
  projectId,
  folderId,
  onSuccess,
  initialStatus,
  tags = [],
  onCreateTag,
}: TalkingHeadFormProps) {
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  
  const { createFile } = useFiles(currentProjectId, currentFolderId);
  const { profile, deductCredits } = useProfile();
  const { toast } = useToast();

  const [fileName, setFileName] = useState('Untitled');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || 'processing');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [firstFrameUrl, setFirstFrameUrl] = useState('');
  const [characterBlocks, setCharacterBlocks] = useState(2);
  const [script, setScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(voices[0]);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1,
    stability: 0.5,
    similarity: 0.75,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxChars = characterBlocks * CHARS_PER_BLOCK;
  const characterCount = script.length;
  const isOverLimit = characterCount > maxChars;
  
  const estimatedDuration = Math.max(SECONDS_PER_BLOCK, Math.ceil(characterCount / CHARS_PER_BLOCK) * SECONDS_PER_BLOCK);
  const creditCost = Math.max(1, Math.ceil(characterCount / CHARS_PER_BLOCK));
  const hasEnoughCredits = (profile?.credits ?? 0) >= creditCost;

  const currentStatusOption = defaultStatusOptions.find(s => s.value === selectedStatus) || defaultStatusOptions[0];

  const handleLocationChange = (newProjectId: string, newFolderId?: string) => {
    setCurrentProjectId(newProjectId);
    setCurrentFolderId(newFolderId);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setFirstFrameUrl(url);
  };

  const decrementBlocks = () => {
    if (characterBlocks > 1) {
      setCharacterBlocks(characterBlocks - 1);
    }
  };

  const incrementBlocks = () => {
    if (characterBlocks < 10) {
      setCharacterBlocks(characterBlocks + 1);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstFrameUrl) {
      toast({
        title: 'Missing first frame',
        description: 'Please upload a first frame image.',
        variant: 'destructive',
      });
      return;
    }

    if (!script.trim()) {
      toast({
        title: 'Missing script',
        description: 'Please enter a script for the talking head.',
        variant: 'destructive',
      });
      return;
    }

    if (isOverLimit) {
      toast({
        title: 'Script too long',
        description: 'Please increase the character limit or shorten your script.',
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
        file_type: 'talking_head',
        status: selectedStatus,
        tags: selectedTags,
        generation_params: {
          first_frame_url: firstFrameUrl,
          script,
          voice_id: selectedVoice.id,
          voice_settings: voiceSettings,
        },
      });

      await deductCredits(creditCost);

      toast({
        title: 'Generation started',
        description: 'Your talking head video is being generated.',
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
                {defaultStatusOptions.map((status) => (
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

        {/* First Frame Upload */}
        <div className="space-y-2">
          <Label>First frame</Label>
          {firstFrameUrl ? (
            <div className="relative aspect-[9/16] max-h-48 overflow-hidden rounded-xl bg-secondary">
              <img
                src={firstFrameUrl}
                alt="First frame"
                className="h-full w-full object-contain"
              />
              <button
                type="button"
                onClick={() => setFirstFrameUrl('')}
                className="absolute right-2 top-2 rounded-lg bg-background/80 p-1.5 text-foreground backdrop-blur transition-all duration-200 hover:bg-background"
              >
                Change
              </button>
            </div>
          ) : (
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary">
              <Upload className="mb-2 h-8 w-8" />
              <span className="text-sm font-medium">Upload first frame</span>
              <span className="text-xs">or drag and drop</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>

        {/* Script Section */}
        <div className="space-y-3">
          <Label>Script</Label>

          <div className="relative">
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your script..."
              className={cn(
                'min-h-32 resize-none rounded-xl',
                isOverLimit && 'border-destructive focus-visible:ring-destructive'
              )}
            />
            <div
              className={cn(
                'absolute bottom-2 right-2 text-xs',
                isOverLimit ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {characterCount} / {maxChars}
            </div>
          </div>

          {/* Character limit toggle & estimated time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decrementBlocks}
                disabled={characterBlocks <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-all duration-200 hover:bg-secondary disabled:opacity-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-20 text-center text-sm font-medium">
                {maxChars} chars
              </span>
              <button
                type="button"
                onClick={incrementBlocks}
                disabled={characterBlocks >= 10}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-all duration-200 hover:bg-secondary disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              ~{estimatedDuration} seconds
            </p>
          </div>

          {isOverLimit && (
            <p className="text-sm text-destructive">
              Increase max characters to continue
            </p>
          )}
        </div>

        {/* Voice Selector */}
        <Collapsible open={voiceOpen} onOpenChange={setVoiceOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:bg-secondary/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-lg">🎙️</span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">
                    {selectedVoice.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedVoice.gender} • {selectedVoice.accent}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-muted-foreground transition-transform',
                  voiceOpen && 'rotate-180'
                )}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4">
            <div className="space-y-2">
              {voices.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => setSelectedVoice(voice)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg p-3 transition-all duration-200',
                    selectedVoice.id === voice.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-secondary'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                    <div className="text-left">
                      <p className="font-medium">{voice.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {voice.gender} • {voice.accent}
                      </p>
                    </div>
                  </div>
                  <button type="button">
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </button>
                </button>
              ))}
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Speed</span>
                  <span className="text-muted-foreground">
                    {voiceSettings.speed}x
                  </span>
                </div>
                <Slider
                  value={[voiceSettings.speed]}
                  onValueChange={([v]) =>
                    setVoiceSettings((s) => ({ ...s, speed: v }))
                  }
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Stability</span>
                  <span className="text-muted-foreground">
                    {voiceSettings.stability}
                  </span>
                </div>
                <Slider
                  value={[voiceSettings.stability]}
                  onValueChange={([v]) =>
                    setVoiceSettings((s) => ({ ...s, stability: v }))
                  }
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Similarity</span>
                  <span className="text-muted-foreground">
                    {voiceSettings.similarity}
                  </span>
                </div>
                <Slider
                  value={[voiceSettings.similarity]}
                  onValueChange={([v]) =>
                    setVoiceSettings((s) => ({ ...s, similarity: v }))
                  }
                  min={0}
                  max={1}
                  step={0.05}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Submit */}
      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !hasEnoughCredits ||
            !script.trim() ||
            !firstFrameUrl ||
            isOverLimit
          }
          className="h-12 w-full gap-2 rounded-xl bg-primary font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Talking Head • {creditCost} Credits
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
