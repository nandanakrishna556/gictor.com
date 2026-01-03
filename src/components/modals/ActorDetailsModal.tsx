import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, User, Calendar, Globe, MessageSquare, Video } from 'lucide-react';
import { useState, useRef } from 'react';
import { Actor } from '@/hooks/useActors';
import { cn } from '@/lib/utils';

interface ActorDetailsModalProps {
  actor: Actor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActorDetailsModal({ actor, open, onOpenChange }: ActorDetailsModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!actor) return null;

  const handlePlayPause = () => {
    if (!audioRef.current || !actor.voice_url) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{actor.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Image & Video Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {actor.sora_video_url ? '360° Profile Video' : '360° Profile'}
            </p>
            <div className="aspect-square w-full max-w-[280px] mx-auto rounded-xl overflow-hidden bg-muted/50 border">
              {actor.sora_video_url ? (
                <video
                  src={actor.sora_video_url}
                  className="h-full w-full object-contain animate-fade-in"
                  controls
                  loop
                  playsInline
                />
              ) : actor.profile_image_url ? (
                <img
                  src={actor.profile_image_url}
                  alt={actor.name}
                  className="h-full w-full object-contain animate-fade-in"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User className="h-20 w-20 text-muted-foreground" strokeWidth={1} />
                </div>
              )}
            </div>
          </div>

          {/* Voice Preview Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Voice Preview</p>
            {actor.voice_url ? (
              <button
                onClick={handlePlayPause}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border bg-muted/30',
                  'hover:bg-muted/50 transition-colors'
                )}
              >
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  'bg-primary text-primary-foreground'
                )}>
                  {isPlaying ? (
                    <Pause className="h-4 w-4" fill="currentColor" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Cloned Voice Sample</p>
                  <p className="text-xs text-muted-foreground">Click to preview</p>
                </div>
                <audio
                  ref={audioRef}
                  src={actor.voice_url}
                  onEnded={handleAudioEnded}
                />
              </button>
            ) : (
              <div className="p-3 rounded-lg border bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">No voice available</p>
              </div>
            )}
          </div>

          {/* Actor Details Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Actor Details</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Mode */}
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Creation Mode</p>
                <Badge variant="secondary">
                  {actor.mode === 'generate' ? 'AI Generated' : 'Uploaded'}
                </Badge>
              </div>

              {/* Age */}
              {actor.age && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" /> Age
                  </div>
                  <p className="text-sm font-medium">{actor.age} years old</p>
                </div>
              )}

              {/* Gender */}
              {actor.gender && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <User className="h-3 w-3" /> Gender
                  </div>
                  <p className="text-sm font-medium">{actor.gender}</p>
                </div>
              )}

              {/* Language */}
              {actor.language && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Globe className="h-3 w-3" /> Language
                  </div>
                  <p className="text-sm font-medium">{actor.language}</p>
                </div>
              )}

              {/* Accent */}
              {actor.accent && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Accent</p>
                  <p className="text-sm font-medium">{actor.accent}</p>
                </div>
              )}
            </div>
          </div>

          {/* Other Instructions */}
          {actor.other_instructions && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MessageSquare className="h-4 w-4" /> Other Instructions
              </div>
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-sm whitespace-pre-wrap">{actor.other_instructions}</p>
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Created {new Date(actor.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
