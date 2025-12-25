import { useState } from 'react';
import { Upload, Sparkles, ChevronDown, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useFiles } from '@/hooks/useFiles';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface TalkingHeadFormProps {
  projectId: string;
  folderId?: string;
  onSuccess: () => void;
}

const voices = [
  { id: 'voice_1', name: 'Sarah', gender: 'female', accent: 'American' },
  { id: 'voice_2', name: 'Michael', gender: 'male', accent: 'British' },
  { id: 'voice_3', name: 'Emma', gender: 'female', accent: 'Australian' },
  { id: 'voice_4', name: 'James', gender: 'male', accent: 'American' },
];

const characterLimits = [120, 240, 360, 480, 600, 720, 840, 960];

export default function TalkingHeadForm({
  projectId,
  folderId,
  onSuccess,
}: TalkingHeadFormProps) {
  const { createFile } = useFiles(projectId, folderId);
  const { profile, deductCredits } = useProfile();
  const { toast } = useToast();

  const [fileName, setFileName] = useState('Untitled');
  const [firstFrameUrl, setFirstFrameUrl] = useState('');
  const [maxCharacters, setMaxCharacters] = useState('240');
  const [script, setScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(voices[0]);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1,
    stability: 0.5,
    similarity: 0.75,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterCount = script.length;
  const maxChars = parseInt(maxCharacters);
  const isOverLimit = characterCount > maxChars;
  const estimatedDuration = Math.ceil(characterCount / 120) * 8;
  const creditCost = Math.max(1, Math.ceil(characterCount / 120));
  const hasEnoughCredits = (profile?.credits ?? 0) >= creditCost;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setFirstFrameUrl(url);
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
        project_id: projectId,
        folder_id: folderId || null,
        name: fileName,
        file_type: 'talking_head',
        status: 'processing',
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
                className="absolute right-2 top-2 rounded-lg bg-background/80 p-1.5 text-foreground backdrop-blur transition-apple hover:bg-background"
              >
                Change
              </button>
            </div>
          ) : (
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition-apple hover:border-primary hover:text-primary">
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
          <div className="flex items-center justify-between">
            <Label>Script</Label>
            <Select value={maxCharacters} onValueChange={setMaxCharacters}>
              <SelectTrigger className="h-8 w-32 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {characterLimits.map((limit) => (
                  <SelectItem key={limit} value={limit.toString()}>
                    {limit} chars
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground">
            ~{estimatedDuration} seconds estimated
          </p>

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
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 transition-apple hover:bg-secondary/50"
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
                    'flex w-full items-center justify-between rounded-lg p-3 transition-apple',
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
          className="h-12 w-full gap-2 rounded-xl bg-primary font-medium text-primary-foreground transition-apple hover:opacity-90"
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
