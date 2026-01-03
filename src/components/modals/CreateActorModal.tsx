import { useState, useId } from 'react';
import { ArrowLeft, Wand2, FolderUp, Minus, Plus, Loader2, Music, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState('');
  const [language, setLanguage] = useState('');
  const [accent, setAccent] = useState('');
  const [otherInstructions, setOtherInstructions] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState<string>();
  const [customAudioUrl, setCustomAudioUrl] = useState<string>();
  const [audioFileName, setAudioFileName] = useState('');
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);

  const resetForm = () => {
    setStep('choose');
    setName('');
    setAge(25);
    setGender('');
    setLanguage('');
    setAccent('');
    setOtherInstructions('');
    setCustomImageUrl(undefined);
    setCustomAudioUrl(undefined);
    setAudioFileName('');
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset step after modal closes
    setTimeout(() => resetForm(), 300);
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

  const isGenerateFormValid = name.trim() && gender && language;
  const isUploadFormValid = name.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            {step !== 'choose' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep('choose')}
                className="h-9 w-9 rounded-xl hover:bg-muted/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-lg font-semibold">
              {step === 'choose' && 'Create Actor'}
              {step === 'generate' && 'Generate AI Actor'}
              {step === 'upload' && 'Upload Your Actor'}
            </DialogTitle>
          </div>
          
          {/* CLOSE BUTTON */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-9 w-9 rounded-xl hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="p-6">
          {/* STEP 1: Choose Mode */}
          {step === 'choose' && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              {/* Generate AI Actor Card */}
              <button
                onClick={() => setStep('generate')}
                className={cn(
                  "group relative flex flex-col items-center justify-center",
                  "p-6 sm:p-8 rounded-2xl",
                  "bg-gradient-to-b from-background to-muted/50",
                  "border-2 border-border/60",
                  "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10",
                  "transition-all duration-300 ease-out",
                  "hover:-translate-y-1",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background"
                )}
              >
                {/* Icon Container */}
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
                  <Wand2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" strokeWidth={1.5} />
                </div>
                
                {/* Text */}
                <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1">
                  Generate AI Actor
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  AI creates the actor for you
                </p>
                
                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </button>

              {/* Upload Your Own Card */}
              <button
                onClick={() => setStep('upload')}
                className={cn(
                  "group relative flex flex-col items-center justify-center",
                  "p-6 sm:p-8 rounded-2xl",
                  "bg-gradient-to-b from-background to-muted/50",
                  "border-2 border-border/60",
                  "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10",
                  "transition-all duration-300 ease-out",
                  "hover:-translate-y-1",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background"
                )}
              >
                {/* Icon Container */}
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-orange-500/10 mb-4 group-hover:bg-orange-500/20 group-hover:scale-105 transition-all duration-300">
                  <FolderUp className="h-8 w-8 sm:h-10 sm:w-10 text-orange-500" strokeWidth={1.5} />
                </div>
                
                {/* Text */}
                <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1">
                  Upload Your Own
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Use your own media files
                </p>
                
                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </button>
            </div>
          )}

          {/* STEP 2A: Generate Form */}
          {step === 'generate' && (
            <div className="space-y-5 animate-fade-in">
              {/* Actor Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Actor Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter actor name"
                  className="h-12 rounded-xl bg-muted/40 border-border/60 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Age & Gender Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Age */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Age</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAge(Math.max(1, age - 1))}
                      className="h-12 w-12 rounded-xl border-border/60 hover:bg-muted/80 shrink-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || 25)}
                      className="h-12 rounded-xl bg-muted/40 border-border/60 text-center font-semibold text-lg"
                      min={1}
                      max={100}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAge(Math.min(100, age + 1))}
                      className="h-12 w-12 rounded-xl border-border/60 hover:bg-muted/80 shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20">
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

              {/* Language & Accent Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Language */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/40 border-border/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20">
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

                {/* Accent */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Accent (Optional)
                  </Label>
                  <Input
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    placeholder="e.g., British, Southern"
                    className="h-12 rounded-xl bg-muted/40 border-border/60 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Other Instructions */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Other Instructions (Optional)
                </Label>
                <Textarea
                  value={otherInstructions}
                  onChange={(e) => setOtherInstructions(e.target.value)}
                  placeholder="Describe appearance, personality, voice style, clothing, background setting..."
                  className="min-h-[100px] rounded-xl bg-muted/40 border-border/60 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 resize-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 rounded-xl border-border/60 font-medium hover:bg-muted/80 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!isGenerateFormValid || isCreating}
                  className={cn(
                    "flex-1 h-12 rounded-xl font-medium",
                    "bg-gradient-to-r from-primary to-primary/90",
                    "hover:from-primary/95 hover:to-primary/85",
                    "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                    "disabled:opacity-50 disabled:shadow-none",
                    "transition-all duration-300"
                  )}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Actor • 1 credit'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2B: Upload Form */}
          {step === 'upload' && (
            <div className="space-y-5 animate-fade-in">
              {/* Actor Name */}
              <div className="space-y-2">
                <Label htmlFor="upload-name" className="text-sm font-medium">
                  Actor Name
                </Label>
                <Input
                  id="upload-name"
                  placeholder="Enter actor name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl bg-muted/40 border-border/60 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Image + Audio Upload */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Base Image</Label>
                  <SingleImageUpload
                    value={customImageUrl}
                    onChange={setCustomImageUrl}
                    aspectRatio="square"
                    showGenerateLink={false}
                    placeholder="Drop image or"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Base Voice</Label>
                  {customAudioUrl ? (
                    <div className="relative aspect-square rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-2">
                      <Music className="h-8 w-8 text-primary" />
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
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingAudio(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingAudio(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingAudio(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && file.type.startsWith('audio/')) {
                          handleAudioUpload(file);
                        }
                      }}
                      className={cn(
                        'relative aspect-square rounded-xl border-2 border-dashed',
                        'flex flex-col items-center justify-center gap-2 cursor-pointer',
                        'hover:border-primary hover:bg-primary/5 transition-all duration-200',
                        isDraggingAudio ? 'border-primary bg-primary/10' : 'border-border/60 bg-muted/30'
                      )}
                    >
                      {isUploadingAudio ? (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <FolderUp className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground text-center">
                            {isDraggingAudio ? 'Drop audio file' : 'MP3, WAV, M4A'}
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 rounded-xl border-border/60 font-medium hover:bg-muted/80 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!isUploadFormValid || isCreating}
                  className={cn(
                    "flex-1 h-12 rounded-xl font-medium",
                    "bg-gradient-to-r from-primary to-primary/90",
                    "hover:from-primary/95 hover:to-primary/85",
                    "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                    "disabled:opacity-50 disabled:shadow-none",
                    "transition-all duration-300"
                  )}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Actor • 1 credit'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
