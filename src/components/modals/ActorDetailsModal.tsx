import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X, Globe, MessageSquare, Mic, ImageIcon, User, Calendar, Layers
} from 'lucide-react';
import { useEffect } from 'react';
import { Actor } from '@/hooks/useActors';
import { AudioPlayer } from '@/components/ui/AudioPlayer';

interface ActorDetailsModalProps {
  actor: Actor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActorDetailsModal({ actor, open, onOpenChange }: ActorDetailsModalProps) {
  useEffect(() => {
    if (!open) {
      // Reset any state when modal closes
    }
  }, [open]);

  if (!actor) return null;

  const isGenerateMode = actor.mode === 'generate';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        {/* Close Button */}
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
              {/* Header with Profile Picture */}
              <div className="flex items-center gap-3">
                {actor.profile_image_url ? (
                  <img
                    src={actor.profile_image_url}
                    alt={actor.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-foreground">{actor.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    Input details & generation info
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
                        <AudioPlayer src={actor.custom_audio_url} />
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

              {/* ACTOR IMAGE - Now shows 360° Profile Grid */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actor Image (360° Profile)
                </label>
                <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                  {actor.profile_360_url ? (
                    <img
                      src={actor.profile_360_url}
                      alt={`${actor.name} 360° profile`}
                      className="w-full object-contain"
                    />
                  ) : actor.profile_image_url ? (
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

              {/* ACTOR VOICE */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Actor Voice
                </label>
                {actor.voice_url ? (
                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <AudioPlayer src={actor.voice_url} />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-center">
                    <p className="text-sm text-muted-foreground">No voice generated</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
