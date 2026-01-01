import { useState, useId } from 'react';
import { ChevronDown, X, Upload, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { uploadToR2, validateFile } from '@/lib/cloudflare-upload';
import { CreateActorInput } from '@/hooks/useActors';
import { cn } from '@/lib/utils';

interface CreateActorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateActorInput) => Promise<unknown>;
  isCreating: boolean;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary'];
const AGE_OPTIONS = ['Teen 13-19', 'Young Adult 20-35', 'Adult 36-55', 'Senior 55+'];
const ACCENT_OPTIONS = [
  'American General',
  'American Southern',
  'American New York',
  'British RP',
  'British Cockney',
  'Australian',
  'Irish',
  'Scottish',
  'Indian',
  'French',
  'German',
  'Spanish',
  'Italian',
];

export default function CreateActorModal({
  open,
  onOpenChange,
  onSubmit,
  isCreating,
}: CreateActorModalProps) {
  const audioInputId = useId();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  // Basic fields
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [accent, setAccent] = useState('');
  
  // Custom assets
  const [customImageUrl, setCustomImageUrl] = useState<string>();
  const [customAudioUrl, setCustomAudioUrl] = useState<string>();
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  
  // Physical appearance
  const [heightBuild, setHeightBuild] = useState('');
  const [skin, setSkin] = useState('');
  const [face, setFace] = useState('');
  const [eyes, setEyes] = useState('');
  const [hair, setHair] = useState('');
  const [distinctive, setDistinctive] = useState('');
  
  // Personality
  const [traits, setTraits] = useState('');
  const [behavior, setBehavior] = useState('');
  const [quirks, setQuirks] = useState('');
  
  // Voice
  const [tone, setTone] = useState('');
  const [pitch, setPitch] = useState('');
  const [rhythm, setRhythm] = useState('');

  const handleAudioUpload = async (file: File) => {
    const validation = validateFile(file, {
      allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'],
      maxSize: 50 * 1024 * 1024, // 50MB
    });
    
    if (!validation.valid) {
      return;
    }

    setIsUploadingAudio(true);
    try {
      const url = await uploadToR2(file, { folder: 'actor-audio' });
      setCustomAudioUrl(url);
    } catch (error) {
      console.error('Audio upload failed:', error);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const physicalDetails: Record<string, string> = {};
    if (heightBuild) physicalDetails.height_build = heightBuild;
    if (skin) physicalDetails.skin = skin;
    if (face) physicalDetails.face = face;
    if (eyes) physicalDetails.eyes = eyes;
    if (hair) physicalDetails.hair = hair;
    if (distinctive) physicalDetails.distinctive = distinctive;

    const personalityDetails: Record<string, string> = {};
    if (traits) personalityDetails.traits = traits;
    if (behavior) personalityDetails.behavior = behavior;
    if (quirks) personalityDetails.quirks = quirks;

    const voiceDetails: Record<string, string> = {};
    if (tone) voiceDetails.tone = tone;
    if (pitch) voiceDetails.pitch = pitch;
    if (rhythm) voiceDetails.rhythm = rhythm;

    await onSubmit({
      name: name.trim(),
      gender: gender || undefined,
      age: age || undefined,
      accent: accent || undefined,
      physical_details: Object.keys(physicalDetails).length > 0 ? physicalDetails : undefined,
      personality_details: Object.keys(personalityDetails).length > 0 ? personalityDetails : undefined,
      voice_details: Object.keys(voiceDetails).length > 0 ? voiceDetails : undefined,
      custom_image_url: customImageUrl,
      custom_audio_url: customAudioUrl,
    });

    // Reset form
    setName('');
    setGender('');
    setAge('');
    setAccent('');
    setCustomImageUrl(undefined);
    setCustomAudioUrl(undefined);
    setHeightBuild('');
    setSkin('');
    setFace('');
    setEyes('');
    setHair('');
    setDistinctive('');
    setTraits('');
    setBehavior('');
    setQuirks('');
    setTone('');
    setPitch('');
    setRhythm('');
    setAdvancedOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Actor</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actor-name">Actor Name *</Label>
              <Input
                id="actor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter actor name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Age Range</Label>
                <Select value={age} onValueChange={setAge}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Accent</Label>
              <Select value={accent} onValueChange={setAccent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select accent" />
                </SelectTrigger>
                <SelectContent>
                  {ACCENT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Base Assets */}
          <div className="rounded-xl border p-4 space-y-3">
            <div>
              <h3 className="text-sm font-medium">Custom Base Assets (Optional)</h3>
              <p className="text-xs text-muted-foreground">
                Upload your own image or voice to use as the base for the actor
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Base Image</Label>
                <SingleImageUpload
                  value={customImageUrl}
                  onChange={setCustomImageUrl}
                  aspectRatio="square"
                  showGenerateLink={false}
                  placeholder="Drop image or"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Base Voice</Label>
                {customAudioUrl ? (
                  <div className="flex items-center justify-between rounded-xl border-2 border-dashed p-4 aspect-square">
                    <span className="text-sm text-muted-foreground">Audio uploaded</span>
                    <button
                      type="button"
                      onClick={() => setCustomAudioUrl(undefined)}
                      className="rounded-full p-1 hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingAudio && document.getElementById(audioInputId)?.click()}
                    className={cn(
                      'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 aspect-square transition-all duration-200',
                      'border-border hover:border-primary/50 hover:bg-secondary/50'
                    )}
                  >
                    {isUploadingAudio ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground text-center">
                          Drop audio or <span className="font-medium text-primary">browse</span>
                        </p>
                      </>
                    )}
                    <input
                      id={audioInputId}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Customization */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium hover:bg-muted/50">
                Advanced Customization
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', advancedOpen && 'rotate-180')}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6 pt-4">
              {/* Physical Appearance */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Physical Appearance</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="e.g., Tall and athletic"
                    value={heightBuild}
                    onChange={(e) => setHeightBuild(e.target.value)}
                  />
                  <Input
                    placeholder="e.g., Fair with freckles"
                    value={skin}
                    onChange={(e) => setSkin(e.target.value)}
                  />
                  <Input
                    placeholder="e.g., Oval with high cheekbones"
                    value={face}
                    onChange={(e) => setFace(e.target.value)}
                  />
                  <Input
                    placeholder="e.g., Deep brown, almond-shaped"
                    value={eyes}
                    onChange={(e) => setEyes(e.target.value)}
                  />
                  <Input
                    placeholder="e.g., Long wavy black hair"
                    value={hair}
                    onChange={(e) => setHair(e.target.value)}
                  />
                  <Input
                    placeholder="e.g., Dimples when smiling"
                    value={distinctive}
                    onChange={(e) => setDistinctive(e.target.value)}
                  />
                </div>
              </div>

              {/* Personality */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Personality</h4>
                <Textarea
                  placeholder="e.g., Warm, confident, approachable, witty"
                  value={traits}
                  onChange={(e) => setTraits(e.target.value)}
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="e.g., Maintains eye contact, uses hand gestures"
                    value={behavior}
                    onChange={(e) => setBehavior(e.target.value)}
                  />
                  <Input
                    placeholder="e.g., Tilts head when listening, subtle smile"
                    value={quirks}
                    onChange={(e) => setQuirks(e.target.value)}
                  />
                </div>
              </div>

              {/* Voice Characteristics */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Voice Characteristics</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="e.g., Warm and friendly"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  />
                  <Input
                    placeholder="e.g., Medium-low"
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                  />
                  <Input
                    placeholder="e.g., Measured, thoughtful"
                    value={rhythm}
                    onChange={(e) => setRhythm(e.target.value)}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Actor • 1 credit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
