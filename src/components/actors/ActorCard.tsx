import { useState, useRef } from 'react';
import { MoreHorizontal, Trash2, Play, Pause, AlertCircle, Loader2, UserCircle, Volume2 } from 'lucide-react';
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

  const handleThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
        style={{ aspectRatio: '2/3' }}
      >
        {/* Thumbnail Area - 1:1 aspect ratio at top */}
        <div 
          className="relative aspect-square bg-muted/50 overflow-hidden shrink-0"
          onClick={handleThumbnailClick}
        >
          {/* Processing State */}
          {isProcessing && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground font-medium">Creating actor...</span>
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
              <AlertCircle className="h-10 w-10 text-destructive" />
              <span className="text-sm text-center text-destructive line-clamp-2 font-medium">
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
                <div className="flex h-full w-full items-center justify-center bg-muted/30">
                  <UserCircle className="h-20 w-20 text-muted-foreground" strokeWidth={1} />
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 via-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm text-xs font-medium text-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                    Click to view details
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Menu Button - Top Right */}
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="rounded-lg p-1.5 bg-background/80 backdrop-blur-sm opacity-0 transition-opacity hover:bg-background group-hover:opacity-100 shadow-sm">
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

        {/* Info Section - Below thumbnail, fills remaining space */}
        <div className="flex flex-col flex-1 gap-2 p-3">
          {/* Actor Name & Details */}
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">{actor.name}</h3>
            {(actor.gender || actor.age) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {[actor.gender, actor.age ? `${actor.age}y` : null].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>

          {/* Voice Player - Only show when completed and has voice */}
          {isCompleted && actor.voice_url && (
            <button
              onClick={handlePlayVoice}
              className={cn(
                "flex items-center gap-2.5 w-full p-2.5 rounded-xl mt-auto",
                "bg-muted/50 hover:bg-muted transition-colors",
                isPlaying && "bg-primary/10 hover:bg-primary/15"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
                isPlaying 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-primary/10 text-primary"
              )}>
                {isPlaying ? (
                  <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
                )}
              </div>
              <div className="min-w-0 text-left flex-1">
                <p className="text-xs font-medium text-foreground truncate">Voice Preview</p>
                <p className="text-[10px] text-muted-foreground">
                  {isPlaying ? 'Playing...' : 'Tap to play'}
                </p>
              </div>
              <Volume2 className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isPlaying ? "text-primary" : "text-muted-foreground/50"
              )} />
            </button>
          )}

          {/* No voice fallback for completed */}
          {isCompleted && !actor.voice_url && (
            <div className="py-2.5 text-center mt-auto rounded-xl bg-muted/30">
              <p className="text-xs text-muted-foreground">No voice available</p>
            </div>
          )}

          {/* Processing/Failed state placeholder */}
          {!isCompleted && (
            <div className="py-2.5 text-center mt-auto rounded-xl bg-muted/30">
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
    <div 
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
      style={{ aspectRatio: '2/3' }}
    >
      {/* 1:1 Thumbnail skeleton */}
      <div className="aspect-square skeleton shrink-0" />
      
      {/* Info section skeleton */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <div className="space-y-1.5">
          <div className="h-4 w-2/3 skeleton rounded" />
          <div className="h-3 w-1/3 skeleton rounded" />
        </div>
        
        {/* Voice player skeleton */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 mt-auto">
          <div className="h-9 w-9 rounded-full skeleton shrink-0" />
          <div className="space-y-1 flex-1">
            <div className="h-3 w-16 skeleton rounded" />
            <div className="h-2 w-12 skeleton rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
