import { useState, useRef } from 'react';
import { MoreHorizontal, Trash2, Play, Pause, AlertCircle, Loader2, UserCircle } from 'lucide-react';
import { Actor } from '@/hooks/useActors';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActorCardProps {
  actor: Actor;
  onDelete: (id: string) => void;
}

export function ActorCard({ actor, onDelete }: ActorCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayVoice = () => {
    if (!actor.voice_url) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(actor.voice_url);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const isProcessing = actor.status === 'processing';
  const isFailed = actor.status === 'failed';
  const isCompleted = actor.status === 'completed';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-subtle transition-shadow duration-200 hover:shadow-elevated">
      {/* Thumbnail Area */}
      <div className="relative aspect-square bg-muted/50 overflow-hidden">
        {isProcessing && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Creating actor...</span>
            {actor.progress > 0 && (
              <span className="text-xs text-muted-foreground">{actor.progress}%</span>
            )}
          </div>
        )}

        {isFailed && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <span className="text-sm text-center text-destructive">
              {actor.error_message || 'Failed to create actor'}
            </span>
          </div>
        )}

        {isCompleted && (
          <>
            {actor.profile_image_url ? (
              <img
                src={actor.profile_image_url}
                alt={actor.name}
                className="h-full w-full object-contain animate-fade-in"
                onLoad={(e) => e.currentTarget.classList.add('animate-fade-in')}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserCircle className="h-16 w-16 text-muted-foreground" strokeWidth={1} />
              </div>
            )}

            {/* Play voice overlay */}
            {actor.voice_url && (
              <button
                onClick={handlePlayVoice}
                className={cn(
                  'absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200',
                  'opacity-0 group-hover:opacity-100'
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-foreground" fill="currentColor" />
                  ) : (
                    <Play className="h-5 w-5 text-foreground ml-0.5" fill="currentColor" />
                  )}
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="flex items-center justify-between p-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground">{actor.name}</h3>
          {(actor.gender || actor.age) && (
            <p className="text-xs text-muted-foreground">
              {[actor.gender, actor.age].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-md p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onDelete(actor.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function ActorCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-2/3 skeleton" />
        <div className="h-3 w-1/3 skeleton" />
      </div>
    </div>
  );
}
