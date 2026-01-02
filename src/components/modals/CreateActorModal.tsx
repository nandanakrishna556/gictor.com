import { useState, useId } from 'react';
import { ArrowLeft, Sparkles, Upload, Minus, Plus, Loader2, Music, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { SingleImageUpload } from '@/components/ui/single-image-upload';
import { uploadToR2, validateFile } from '@/lib/cloudflare-upload';
import { useActors, CreateActorInput } from '@/hooks/useActors';
import { LANGUAGES } from '@/constants/languages';
import { cn } from '@/lib/utils';

interface CreateActorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'choose' | 'generate' | 'upload';

export default function CreateActorModal({ open, onOpenChange }: CreateActorModalProps) {
  const audioInputId = useId();
  const { createActor, isCreating } = useActors();
  const [step, setStep] = useState<Step>('choose');

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | undefined>(undefined);
  const [gender, setGender] = useState('');
  const [language, setLanguage] = useState('');
  const [accent, setAccent] = useState('');
  const [otherInstructions, setOtherInstructions] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState<string>();
  const [customAudioUrl, setCustomAudioUrl] = useState<string>();
  const [audioFileName, setAudioFileName] = useState('');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const resetForm = () => {
    setStep('choose');
    setName('');
    setAge(undefined);
    setGender('');
    setLanguage('');
    setAccent('');
    setOtherInstructions('');
    setCustomImageUrl(undefined);
    setCustomAudioUrl(undefined);
    setAudioFileName('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    const input: CreateActorInput = {
      name: name.trim(),
      mode: step === 'generate' ? 'generate' : 'upload',
      age: age,
      gender: gender || undefined,
      language: language || undefined,
      accent: accent || undefined,
      other_instructions: otherInstructions || undefined,
      custom_image_url: customImageUrl,
      custom_audio_url: customAudioUrl,
    };

    try {
      await createActor(input);
      handleClose();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAudioUpload = async (file: File) => {
    const validation = validateFile(file, {
      allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/x-m4a', 'audio/ogg'],
      maxSize: 50 * 1024 * 1024,
    });

    if (!validation.valid) return;

    setIsUploadingAudio(true);
    try {
      const url = await uploadToR2(file, { folder: 'actor-audio' });
      setCustomAudioUrl(url);
      setAudioFileName(file.name);
    } catch (error) {
      console.error('Audio upload failed:', error);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const removeAudio = () => {
    setCustomAudioUrl(undefined);
    setAudioFileName('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {step !== 'choose' && (
            <button
              onClick={() => setStep('choose')}
              className="absolute left-4 top-4 p-1 rounded-md hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <DialogTitle className="text-center">
            {step === 'choose' && 'Create Actor'}
            {step === 'generate' && 'Generate AI Actor'}
            {step === 'upload' && 'Upload Your Actor'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Choose Path */}
        {step === 'choose' && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <button
              onClick={() => setStep('generate')}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card shadow-subtle hover:shadow-elevated hover:border-primary hover:bg-muted/50 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-foreground">Generate AI Actor</h3>
                <p className="text-xs text-muted-foreground mt-1">AI creates the actor</p>
              </div>
            </button>

            <button
              onClick={() => setStep('upload')}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card shadow-subtle hover:shadow-elevated hover:border-primary hover:bg-muted/50 transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-foreground">Upload Your Own</h3>
                <p className="text-xs text-muted-foreground mt-1">Use your own media</p>
              </div>
            </button>
          </div>
        )}

        {/* Step 2A: Generate AI Actor */}
        {step === 'generate' && (
          <div className="space-y-4 py-4">
            {/* Actor Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Actor Name</Label>
              <Input
                id="name"
                placeholder="Enter actor name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Age + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setAge((a) => Math.max(1, (a || 25) - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={age ?? ''}
                    onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="text-center"
                    placeholder="—"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setAge((a) => Math.min(120, (a || 25) + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Language + Accent - 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Accent <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                <Input
                  placeholder="e.g., Southern American, British RP"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                />
              </div>
            </div>

            {/* Other Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Other Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Describe appearance, personality, voice style..."
                value={otherInstructions}
                onChange={(e) => setOtherInstructions(e.target.value)}
                rows={3}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Actor • 1 credit'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2B: Upload Your Own */}
        {step === 'upload' && (
          <div className="space-y-4 py-4">
            {/* Actor Name */}
            <div className="space-y-2">
              <Label htmlFor="upload-name">Actor Name</Label>
              <Input
                id="upload-name"
                placeholder="Enter actor name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Image + Audio Upload */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Image</Label>
                <SingleImageUpload
                  value={customImageUrl}
                  onChange={setCustomImageUrl}
                  aspectRatio="square"
                  showGenerateLink={false}
                  placeholder="Drop image or"
                />
              </div>

              <div className="space-y-2">
                <Label>Base Voice</Label>
                {customAudioUrl ? (
                  <div className="relative aspect-square rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2">
                    <Music className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
                      {audioFileName || 'Audio uploaded'}
                    </span>
                    <button
                      onClick={removeAudio}
                      className="absolute top-2 left-2 h-6 w-6 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingAudio && document.getElementById(audioInputId)?.click()}
                    className={cn(
                      'relative aspect-square rounded-xl border-2 border-dashed border-border bg-muted/30',
                      'flex flex-col items-center justify-center gap-2 cursor-pointer',
                      'hover:border-primary hover:bg-primary/5 transition-all'
                    )}
                  >
                    {isUploadingAudio ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground text-center">
                          MP3, WAV, M4A
                        </span>
                      </>
                    )}
                    <input
                      id={audioInputId}
                      type="file"
                      accept="audio/mp3,audio/wav,audio/m4a,audio/mpeg,audio/x-m4a"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleAudioUpload(e.target.files[0])}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Actor • 1 credit'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
