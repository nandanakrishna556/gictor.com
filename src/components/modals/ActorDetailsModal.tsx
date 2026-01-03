import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, User, Calendar, Globe, MessageSquare, Grid3X3, Mic, ImageIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Actor } from '@/hooks/useActors';
import { cn } from '@/lib/utils';

interface ActorDetailsModalProps {
  actor: Actor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActorDetailsModal({ actor, open, onOpenChange }: ActorDetailsModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFullGrid, setShowFullGrid] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setShowFullGrid(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [open, actor]);

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

  const isGenerateMode = actor.mode === 'generate';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="flex-1">{actor.name}</DialogTitle>
            <Badge variant="secondary" className="shrink-0">
              {isGenerateMode ? 'AI Generated' : 'Uploaded'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Image Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {showFullGrid ? '360° Profile Grid' : 'Profile Picture'}
              </p>
              {actor.profile_360_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFullGrid(!showFullGrid)}
                  className="text-xs h-8 rounded-lg"
                >
                  <Grid3X3 className="h-3.5 w-3.5 mr-1.5" />
                  {showFullGrid ? 'Show Front' : 'Show 360° Grid'}
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
                  <User className="h-20 w-20 text-muted-foreground" strokeWidth={1} />
                </div>
              )}
            </div>
          </div>

          {/* Voice Preview */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Voice Preview</p>
            {actor.voice_url ? (
              <button
                onClick={handlePlayPause}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-xl border bg-muted/30',
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
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </button>
            ) : (
              <div className="p-3 rounded-xl border bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">No voice available</p>
              </div>
            )}
          </div>

          {/* Actor Details */}
          {isGenerateMode && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Actor Details</p>
              <div className="grid grid-cols-2 gap-3">
                {actor.age && (
                  <div className="p-3 rounded-xl border bg-muted/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3" /> Age
                    </div>
                    <p className="text-sm font-medium">{actor.age} years old</p>
                  </div>
                )}
                {actor.gender && (
                  <div className="p-3 rounded-xl border bg-muted/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <User className="h-3 w-3" /> Gender
                    </div>
                    <p className="text-sm font-medium">{actor.gender}</p>
                  </div>
                )}
                {actor.language && (
                  <div className="p-3 rounded-xl border bg-muted/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Globe className="h-3 w-3" /> Language
                    </div>
                    <p className="text-sm font-medium">{actor.language}</p>
                  </div>
                )}
                {actor.accent && (
                  <div className="p-3 rounded-xl border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Accent</p>
                    <p className="text-sm font-medium">{actor.accent}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Uploaded Assets (Upload mode only) */}
          {!isGenerateMode && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Uploaded Assets</p>
              <div className="grid grid-cols-2 gap-3">
                {actor.custom_image_url && (
                  <div className="p-3 rounded-xl border bg-muted/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <ImageIcon className="h-3 w-3" /> Original Image
                    </div>
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={actor.custom_image_url}
                        alt="Original"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {actor.custom_audio_url && (
                  <div className="p-3 rounded-xl border bg-muted/30">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Mic className="h-3 w-3" /> Original Audio
                    </div>
                    <audio src={actor.custom_audio_url} controls className="w-full" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other Instructions */}
          {actor.other_instructions && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MessageSquare className="h-4 w-4" /> Other Instructions
              </div>
              <div className="p-3 rounded-xl border bg-muted/30">
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