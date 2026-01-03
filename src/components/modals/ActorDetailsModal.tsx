import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X, Play, Pause, Grid3X3, UserCircle, Sparkles, Upload, Globe, MessageSquare, Mic, ImageIcon, User, Calendar
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Actor } from '@/hooks/useActors';
import { cn } from '@/lib/utils';

interface ActorDetailsModalProps {
  actor: Actor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActorDetailsModal({ actor, open, onOpenChange }: ActorDetailsModalProps) {
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [showFullGrid, setShowFullGrid] = useState(false);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) {
      setIsVoicePlaying(false);
      setShowFullGrid(false);
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.currentTime = 0;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [open]);

  if (!actor) return null;

  const handleVoicePlayPause = () => {
    if (!voiceAudioRef.current || !actor.voice_url) return;
    if (isVoicePlaying) {
      voiceAudioRef.current.pause();
    } else {
      voiceAudioRef.current.play();
    }
    setIsVoicePlaying(!isVoicePlaying);
  };

  const isGenerateMode = actor.mode === 'generate';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="grid md:grid-cols-2 max-h-[85vh]">
          {/* LEFT SIDE - Inputs */}
          <div className="bg-muted/30 p-6 overflow-y-auto border-r">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  isGenerateMode ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                )}>
                  {isGenerateMode ? (
                    <Sparkles className="h-5 w-5" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">Input Details</p>
                  <p className="text-xs text-muted-foreground">
                    {isGenerateMode ? 'AI generation parameters' : 'Uploaded assets'}
                  </p>
                </div>
              </div>

              {/* Actor Name */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actor Name
                </p>
                <div className="p-3 rounded-xl border bg-background">
                  <p className="font-medium">{actor.name}</p>
                </div>
              </div>

              {/* Generate Mode Inputs */}
              {isGenerateMode && (
                <>
                  {/* Age & Gender Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {actor.age && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Age
                        </p>
                        <div className="p-3 rounded-xl border bg-background">
                          <p className="font-medium">{actor.age} years</p>
                        </div>
                      </div>
                    )}
                    {actor.gender && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <User className="h-3 w-3" /> Gender
                        </p>
                        <div className="p-3 rounded-xl border bg-background">
                          <p className="font-medium">{actor.gender}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Language & Accent Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {actor.language && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Language
                        </p>
                        <div className="p-3 rounded-xl border bg-background">
                          <p className="font-medium">{actor.language}</p>
                        </div>
                      </div>
                    )}
                    {actor.accent && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> Accent
                        </p>
                        <div className="p-3 rounded-xl border bg-background">
                          <p className="font-medium">{actor.accent}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Instructions */}
                  {actor.other_instructions && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Other Instructions
                      </p>
                      <div className="p-3 rounded-xl border bg-background">
                        <p className="text-sm whitespace-pre-wrap">{actor.other_instructions}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Upload Mode Inputs */}
              {!isGenerateMode && (
                <>
                  {/* Uploaded Image */}
                  {actor.custom_image_url && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> Uploaded Image
                      </p>
                      <div className="aspect-square max-w-[200px] rounded-xl overflow-hidden border bg-background">
                        <img
                          src={actor.custom_image_url}
                          alt="Original"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Uploaded Audio */}
                  {actor.custom_audio_url && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Mic className="h-3 w-3" /> Uploaded Voice
                      </p>
                      <div className="p-3 rounded-xl border bg-background">
                        <audio src={actor.custom_audio_url} controls className="w-full h-10" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Creation Mode Badge */}
              <div className="pt-4 mt-auto border-t">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Creation Mode
                  </p>
                  <Badge variant="secondary">
                    {isGenerateMode ? 'AI Generated' : 'Uploaded'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Created {new Date(actor.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Outputs */}
          <div className="p-6 overflow-y-auto bg-background">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Generated Outputs</p>
                  <p className="text-xs text-muted-foreground">AI-generated assets</p>
                </div>
              </div>

              {/* Front Profile Picture */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {showFullGrid ? '360° Profile Grid' : 'Front Profile'}
                  </p>
                  {actor.profile_360_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullGrid(!showFullGrid)}
                      className="h-7 text-xs rounded-lg"
                    >
                      <Grid3X3 className="h-3 w-3 mr-1.5" />
                      {showFullGrid ? 'Show Front' : 'Show 360°'}
                    </Button>
                  )}
                </div>
                <div className="aspect-square w-full max-w-[280px] mx-auto rounded-xl overflow-hidden bg-muted/50 border">
                  {actor.sora_video_url && !showFullGrid ? (
                    <video
                      ref={videoRef}
                      src={actor.sora_video_url}
                      className="h-full w-full object-contain animate-fade-in"
                      controls
                      loop
                      playsInline
                    />
                  ) : showFullGrid && actor.profile_360_url ? (
                    <img
                      src={actor.profile_360_url}
                      alt={`${actor.name} 360° grid`}
                      className="h-full w-full object-contain animate-fade-in"
                    />
                  ) : actor.profile_image_url ? (
                    <img
                      src={actor.profile_image_url}
                      alt={actor.name}
                      className="h-full w-full object-contain animate-fade-in"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <UserCircle className="h-20 w-20 text-muted-foreground" strokeWidth={1} />
                    </div>
                  )}
                </div>
              </div>

              {/* Generated Voice */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Generated Voice
                </p>
                {actor.voice_url ? (
                  <button
                    onClick={handleVoicePlayPause}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border",
                      "bg-muted/30 hover:bg-muted/50 transition-colors"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      isVoicePlaying ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    )}>
                      {isVoicePlaying ? (
                        <Pause className="h-4 w-4" fill="currentColor" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">Index TTS Voice Clone</p>
                      <p className="text-xs text-muted-foreground">
                        {isVoicePlaying ? 'Playing...' : 'Click to preview'}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="p-4 rounded-xl border bg-muted/30 text-center">
                    <p className="text-sm text-muted-foreground">No voice generated</p>
                  </div>
                )}
                <audio
                  ref={voiceAudioRef}
                  src={actor.voice_url || ''}
                  onEnded={() => setIsVoicePlaying(false)}
                  className="hidden"
                />
              </div>

              {/* 360° Profile Grid Preview */}
              {actor.profile_360_url && !showFullGrid && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    360° Profile Grid
                  </p>
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted/50 border">
                    <img
                      src={actor.profile_360_url}
                      alt={`${actor.name} 360° grid`}
                      className="h-full w-full object-contain animate-fade-in cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setShowFullGrid(true)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
