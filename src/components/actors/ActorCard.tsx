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
import { ActorDetailsModal } from '@/components/modals/ActorDetailsModal';

interface ActorCardProps {
  actor: Actor;
  onDelete: (id: string) => void;
}

export function ActorCard({ actor, onDelete }: ActorCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleCardClick = () => {
    if (isCompleted) {
      setShowDetails(true);
    }
  };

  const isProcessing = actor.status === 'processing';
  const isFailed = actor.status === 'failed';
  const isCompleted = actor.status === 'completed';

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-subtle transition-all duration-200 hover:shadow-elevated",
          isCompleted && "cursor-pointer"
        )}
      >
        {/* Thumbnail Area - 1:1 aspect ratio */}
        <div className="relative aspect-square bg-muted/50 overflow-hidden">
          {/* Processing State */}
          {isProcessing && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Creating actor...</span>
              {actor.progress && actor.progress > 0 && (
                <div className="w-full max-w-[80%] h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${actor.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Failed State */}
          {isFailed && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <span className="text-sm text-center text-destructive line-clamp-2">
                {actor.error_message || 'Failed to create actor'}
              </span>
            </div>
          )}

          {/* Completed State - Show Profile Image */}
          {isCompleted && (
            <>
              {actor.profile_image_url ? (
                <img
                  src={actor.profile_image_url}
                  alt={actor.name}
                  className="h-full w-full object-cover opacity-0 transition-opacity duration-300"
                  onLoad={(e) => {
                    e.currentTarget.classList.remove('opacity-0');
                    e.currentTarget.classList.add('animate-fade-in');
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserCircle className="h-16 w-16 text-muted-foreground" strokeWidth={1} />
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </>
          )}

          {/* Menu Button - Top Right */}
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="rounded-md p-1.5 bg-background/80 backdrop-blur-sm opacity-0 transition-opacity hover:bg-background group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(actor.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info Section - Below thumbnail */}
        <div className="flex flex-col gap-2 p-3">
          {/* Actor Name & Details */}
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-foreground">{actor.name}</h3>
            {(actor.gender || actor.age) && (
              <p className="text-xs text-muted-foreground">
                {[actor.gender, actor.age ? `${actor.age}y` : null].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>

          {/* Voice Player - Only show when completed and has voice */}
          {isCompleted && actor.voice_url && (
            <button
              onClick={handlePlayVoice}
              className={cn(
                "flex items-center gap-2 w-full p-2 rounded-lg",
                "bg-muted/50 hover:bg-muted transition-colors",
                isPlaying && "bg-primary/10"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                "bg-primary/10 text-primary",
                isPlaying && "bg-primary text-primary-foreground"
              )}>
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5" fill="currentColor" />
                ) : (
                  <Play className="h-3.5 w-3.5 ml-0.5" fill="currentColor" />
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-medium truncate">Voice Preview</p>
                <p className="text-[10px] text-muted-foreground">
                  {isPlaying ? 'Playing...' : 'Tap to play'}
                </p>
              </div>
            </button>
          )}

          {/* No voice fallback for completed */}
          {isCompleted && !actor.voice_url && (
            <div className="py-2 text-center">
              <p className="text-xs text-muted-foreground">No voice available</p>
            </div>
          )}

          {/* Processing/Failed state placeholder */}
          {!isCompleted && (
            <div className="py-2 text-center">
              <p className="text-xs text-muted-foreground">
                {isProcessing ? 'Generating voice...' : 'Voice unavailable'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <ActorDetailsModal
        actor={actor}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  );
}

export function ActorCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* 1:1 Thumbnail skeleton */}
      <div className="aspect-square skeleton" />
      
      {/* Info section skeleton */}
      <div className="p-3 space-y-2">
        <div className="space-y-1.5">
          <div className="h-4 w-2/3 skeleton rounded" />
          <div className="h-3 w-1/3 skeleton rounded" />
        </div>
        
        {/* Voice player skeleton */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
          <div className="h-8 w-8 rounded-full skeleton" />
          <div className="space-y-1 flex-1">
            <div className="h-3 w-16 skeleton rounded" />
            <div className="h-2 w-12 skeleton rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
