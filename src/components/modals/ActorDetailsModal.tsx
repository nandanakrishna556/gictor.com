import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X, Grid3X3, UserCircle, Settings2, FolderUp, Globe, MessageSquare, Mic, ImageIcon, User, Calendar, Video, Layers
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
  const [showFullGrid, setShowFullGrid] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) {
      setShowFullGrid(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [open]);

  if (!actor) return null;

  const isGenerateMode = actor.mode === 'generate';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        {/* Close Button - Always visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 h-9 w-9 rounded-xl bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm border border-border/50"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="grid md:grid-cols-2 max-h-[85vh]">
          {/* LEFT SIDE - Inputs */}
          <div className="bg-muted/30 p-6 overflow-y-auto border-r border-border/50">
            <div className="space-y-5 animate-fade-in">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Settings2 className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Input Details</p>
                  <p className="text-xs text-muted-foreground">
                    {isGenerateMode ? 'AI generation parameters' : 'Uploaded assets'}
                  </p>
                </div>
              </div>

              {/* Actor Name */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actor Name
                </p>
                <div className="p-3.5 rounded-xl border border-border/60 bg-background">
                  <p className="font-semibold text-foreground">{actor.name}</p>
                </div>
              </div>

              {/* Generate Mode Inputs */}
              {isGenerateMode && (
                <>
                  {/* Age & Gender Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {actor.age && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" /> Age
                        </p>
                        <div className="p-3.5 rounded-xl border border-border/60 bg-background">
                          <p className="font-medium text-foreground">{actor.age} years</p>
                        </div>
                      </div>
                    )}
                    {actor.gender && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <User className="h-3 w-3" /> Gender
                        </p>
                        <div className="p-3.5 rounded-xl border border-border/60 bg-background">
                          <p className="font-medium text-foreground">{actor.gender}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Language & Accent Row */}
                  <div className="grid grid-cols-2 gap-3">
                    {actor.language && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Globe className="h-3 w-3" /> Language
                        </p>
                        <div className="p-3.5 rounded-xl border border-border/60 bg-background">
                          <p className="font-medium text-foreground">{actor.language}</p>
                        </div>
                      </div>
                    )}
                    {actor.accent && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="h-3 w-3" /> Accent
                        </p>
                        <div className="p-3.5 rounded-xl border border-border/60 bg-background">
                          <p className="font-medium text-foreground">{actor.accent}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Instructions */}
                  {actor.other_instructions && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" /> Other Instructions
                      </p>
                      <div className="p-3.5 rounded-xl border border-border/60 bg-background">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{actor.other_instructions}</p>
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
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="h-3 w-3" /> Uploaded Image
                      </p>
                      <div className="aspect-square max-w-[200px] rounded-xl overflow-hidden border border-border/60 bg-background">
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
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Mic className="h-3 w-3" /> Uploaded Voice
                      </p>
                      <div className="p-3.5 rounded-xl border border-border/60 bg-background">
                        <audio src={actor.custom_audio_url} controls className="w-full h-10" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Creation Mode Badge */}
              <div className="pt-4 mt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Creation Mode
                  </p>
                  <Badge variant="secondary" className="font-medium">
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

          {/* RIGHT SIDE - Generated Outputs */}
          <div className="p-6 overflow-y-auto bg-background">
            <div className="space-y-5 animate-fade-in" style={{ animationDelay: '50ms' }}>
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                  <Layers className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Generated Outputs</p>
                  <p className="text-xs text-muted-foreground">AI-generated assets</p>
                </div>
              </div>

              {/* 1. ACTOR IMAGE (Middle Frame) */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actor Image
                </label>
                <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                  {actor.profile_image_url ? (
                    <img
                      src={actor.profile_image_url}
                      alt={actor.name}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center">
                      <User className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              </div>

              {/* 2. ACTOR AUDIO */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actor Voice
                </label>
                {actor.voice_url ? (
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-1">
                    <audio
                      src={actor.voice_url}
                      controls
                      className="w-full h-10"
                      preload="none"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-center">
                    <p className="text-sm text-muted-foreground">No voice generated</p>
                  </div>
                )}
              </div>

              {/* 3. SORA 2 VIDEO (Generate mode only) */}
              {actor.mode === 'generate' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sample Video
                  </label>
                  {actor.sora_video_url ? (
                    <div className="rounded-xl overflow-hidden border border-border/50 bg-black">
                      <video
                        ref={videoRef}
                        src={actor.sora_video_url}
                        controls
                        className="w-full aspect-video"
                        preload="none"
                      />
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-center aspect-video flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">No video generated</p>
                    </div>
                  )}
                </div>
              )}

              {/* 360° Grid (optional, collapsible) */}
              {actor.profile_360_url && (
                <details className="group">
                  <summary className="text-xs font-medium text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground transition-colors">
                    360° Profile Grid
                  </summary>
                  <div className="mt-2 rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                    <img
                      src={actor.profile_360_url}
                      alt="360° profile"
                      className="w-full object-contain"
                    />
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
