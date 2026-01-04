import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Globe, MessageSquare, Mic, ImageIcon, User, Calendar } from 'lucide-react';
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
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-50 h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm border border-border/50"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Single Column Layout */}
        <div className="flex flex-col">

          {/* 1. Header - Profile Picture + Name */}
          <div className="p-6 pb-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-4">
              {actor.profile_image_url ? (
                <img
                  src={actor.profile_image_url}
                  alt={actor.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-border/50"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-border/50">
                  <User className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-foreground truncate">{actor.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {isGenerateMode ? 'AI Generated Actor' : 'Uploaded Actor'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* 2. 360° Profile Image */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                360° Profile
              </label>
              <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                {actor.profile_360_url ? (
                  <img
                    src={actor.profile_360_url}
                    alt={`${actor.name} 360° profile`}
                    className="w-full h-auto object-contain"
                  />
                ) : actor.profile_image_url ? (
                  <img
                    src={actor.profile_image_url}
                    alt={actor.name}
                    className="w-full h-auto object-contain"
                  />
                ) : (
                  <div className="aspect-video flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Actor Voice */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actor Voice
              </label>
              {actor.voice_url ? (
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20">
                  <AudioPlayer src={actor.voice_url} />
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20 text-center">
                  <p className="text-sm text-muted-foreground">No voice generated</p>
                </div>
              )}
            </div>

            {/* 4. Actor Details */}
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actor Details
              </label>
              
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                {/* Age & Gender Row */}
                {(actor.age || actor.gender) && (
                  <div className="grid grid-cols-2 gap-4">
                    {actor.age && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <User className="h-3.5 w-3.5" /> Age
                        </div>
                        <p className="text-sm font-medium text-foreground">{actor.age} years</p>
                      </div>
                    )}
                    {actor.gender && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <User className="h-3.5 w-3.5" /> Gender
                        </div>
                        <p className="text-sm font-medium text-foreground">{actor.gender}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Language & Accent Row */}
                {(actor.language || actor.accent) && (
                  <div className="grid grid-cols-2 gap-4">
                    {actor.language && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Globe className="h-3.5 w-3.5" /> Language
                        </div>
                        <p className="text-sm font-medium text-foreground">{actor.language}</p>
                      </div>
                    )}
                    {actor.accent && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" /> Accent
                        </div>
                        <p className="text-sm font-medium text-foreground">{actor.accent}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Mode: Show uploaded files info */}
                {!isGenerateMode && (
                  <>
                    {actor.custom_image_url && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <ImageIcon className="h-3.5 w-3.5" /> Source Image
                        </div>
                        <p className="text-sm font-medium text-foreground">Custom uploaded image</p>
                      </div>
                    )}
                    {actor.custom_audio_url && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mic className="h-3.5 w-3.5" /> Source Audio
                        </div>
                        <p className="text-sm font-medium text-foreground">Custom uploaded voice</p>
                      </div>
                    )}
                  </>
                )}

                {/* Creation Info */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Date(actor.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {isGenerateMode ? 'AI Generated' : 'Uploaded'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
