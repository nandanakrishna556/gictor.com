import { useState } from 'react';
import { MoreHorizontal, Trash2, AlertCircle, Loader2, UserCircle, User } from 'lucide-react';
import { Actor } from '@/hooks/useActors';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActorDetailsModal } from '@/components/modals/ActorDetailsModal';
import { AudioPlayer } from '@/components/ui/AudioPlayer';

interface ActorCardProps {
  actor: Actor;
  onDelete: (id: string) => void;
}

export function ActorCard({ actor, onDelete }: ActorCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const isProcessing = actor.status === 'processing';
  const isFailed = actor.status === 'failed';
  const isCompleted = actor.status === 'completed';

  return (
    <>
      <div
        onClick={() => isCompleted && setShowDetails(true)}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card",
          "transition-all duration-200 hover:border-border hover:shadow-lg",
          "aspect-[9/16]",
          isCompleted && "cursor-pointer"
        )}
      >
        {/* Thumbnail - Takes most of the space */}
        <div className="relative flex-1 bg-muted/50 overflow-hidden">
          {/* Processing State */}
          {isProcessing && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Creating...</span>
            </div>
          )}

          {/* Failed State */}
          {isFailed && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <span className="text-xs text-center text-destructive line-clamp-2">
                {actor.error_message || 'Failed'}
              </span>
            </div>
          )}

          {/* Completed - Show Profile Image */}
          {isCompleted && (
            <>
              {actor.profile_image_url ? (
                <img
                  src={actor.profile_image_url}
                  alt={actor.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted/30">
                  <UserCircle className="h-16 w-16 text-muted-foreground/50" strokeWidth={1} />
                </div>
              )}
            </>
          )}

          {/* Menu Button */}
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

        {/* Info Section with Profile Picture */}
        <div className="flex flex-col gap-2 p-3 bg-card">
          {/* Profile Picture + Name Row */}
          <div className="flex items-center gap-2.5">
            {isCompleted && actor.profile_image_url ? (
              <img
                src={actor.profile_image_url}
                alt={actor.name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-foreground">{actor.name}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {[actor.gender, actor.age && `${actor.age}y`].filter(Boolean).join(" • ")}
              </p>
            </div>
          </div>

          {/* Audio Player */}
          {isCompleted && actor.voice_url ? (
            <div onClick={(e) => e.stopPropagation()}>
              <AudioPlayer src={actor.voice_url} compact />
            </div>
          ) : (
            <div className="py-2 text-center">
              <span className="text-xs text-muted-foreground">
                {isProcessing ? 'Generating...' : 'No voice available'}
              </span>
            </div>
          )}
        </div>
      </div>

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
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card aspect-[9/16]">
      <div className="flex-1 skeleton" />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full skeleton shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-3/4 skeleton rounded" />
            <div className="h-3 w-1/2 skeleton rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30">
          <div className="h-8 w-8 rounded-full skeleton shrink-0" />
          <div className="flex-1 h-1.5 skeleton rounded-full" />
        </div>
      </div>
    </div>
  );
}
