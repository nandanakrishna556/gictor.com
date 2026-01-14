import { useState } from 'react';
import { User, Search, Check } from 'lucide-react';
import { useActors, Actor } from '@/hooks/useActors';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ActorSelectorPopoverProps {
  selectedActorId: string | null;
  onSelect: (actorId: string | null, actor?: Actor) => void;
  showVoicePreview?: boolean;
  className?: string;
}

export default function ActorSelectorPopover({
  selectedActorId,
  onSelect,
  showVoicePreview = false,
  className,
}: ActorSelectorPopoverProps) {
  const { actors } = useActors();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter completed actors with profile images
  const availableActors = actors?.filter(
    (actor) => actor.status === 'completed' && actor.profile_image_url
  ) || [];

  // Filter by search
  const filteredActors = availableActors.filter((actor) =>
    actor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedActor = availableActors.find((a) => a.id === selectedActorId);

  const handleSelect = (actorId: string | null, actor?: Actor) => {
    onSelect(actorId, actor);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-auto py-3', className)}
        >
          {selectedActor ? (
            <div className="flex items-center gap-3">
              <img
                src={selectedActor.profile_image_url || ''}
                alt={selectedActor.name}
                className="h-6 w-6 rounded-full object-cover"
              />
              <div className="text-left">
                <p className="font-medium text-sm">{selectedActor.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[selectedActor.gender, selectedActor.age && `${selectedActor.age}y`].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Select an actor...</span>
          )}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        <div className="p-3 border-b border-border">
          <Input
            placeholder="Search actors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto p-2">
          <div className="grid grid-cols-3 gap-2">
            {/* No Actor Card */}
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                'flex flex-col rounded-lg border bg-card transition-all hover:border-primary/50',
                !selectedActorId && 'border-primary ring-2 ring-primary/20'
              )}
            >
              {/* Preview area - square aspect ratio */}
              <div className="aspect-square w-full bg-muted/50 rounded-t-lg flex flex-col items-center justify-center gap-1">
                <User className="h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
                <span className="text-xs text-muted-foreground">No actor</span>
              </div>
              {/* Info section - fixed height */}
              <div className="h-11 px-2 py-1.5 flex items-center gap-1.5 border-t border-border">
                <div className={cn(
                  'h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0',
                  !selectedActorId && 'ring-2 ring-primary'
                )}>
                  <span className="text-xs text-muted-foreground">—</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-medium truncate">None</p>
                  <p className="text-[10px] text-muted-foreground truncate">No actor selected</p>
                </div>
              </div>
            </button>

            {/* Actor Cards */}
            {filteredActors.map((actor) => {
              const isSelected = selectedActorId === actor.id;
              return (
                <button
                  key={actor.id}
                  onClick={() => handleSelect(actor.id, actor)}
                  className={cn(
                    'flex flex-col rounded-lg border bg-card transition-all hover:border-primary/50 overflow-hidden',
                    isSelected && 'border-primary ring-2 ring-primary/20'
                  )}
                >
                  {/* Preview area - 360° grid with error handling */}
                  <div className="aspect-square w-full relative bg-muted">
                    {actor.profile_360_url ? (
                      <img
                        src={actor.profile_360_url}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to profile image if 360 fails
                          const target = e.currentTarget;
                          if (actor.profile_image_url && target.src !== actor.profile_image_url) {
                            target.src = actor.profile_image_url;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                    ) : actor.profile_image_url ? (
                      <img
                        src={actor.profile_image_url}
                        alt={actor.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    {actor.profile_360_url && (
                      <span className="absolute top-1 right-1 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
                        360°
                      </span>
                    )}
                  </div>
                  {/* Info section - fixed height */}
                  <div className="h-11 px-2 py-1.5 flex items-center gap-1.5 border-t border-border">
                    {actor.profile_image_url ? (
                      <img
                        src={actor.profile_image_url}
                        alt={actor.name}
                        className={cn(
                          'h-5 w-5 rounded-full object-cover shrink-0 bg-muted',
                          isSelected && 'ring-2 ring-primary'
                        )}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={cn(
                        'h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0',
                        isSelected && 'ring-2 ring-primary'
                      )}>
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium truncate">{actor.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {[actor.gender, actor.age && `${actor.age}y`].filter(Boolean).join(' • ') || '—'}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredActors.length === 0 && searchQuery && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No actors found
            </div>
          )}

          {availableActors.length === 0 && (
            <div className="py-6 text-center text-sm">
              <p className="text-muted-foreground">No actors available.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create an actor first in the Actors page.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
