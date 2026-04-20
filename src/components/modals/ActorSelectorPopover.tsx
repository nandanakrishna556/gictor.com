import { useState, useRef, useEffect } from 'react';
import { User, Search, Check, Plus, ImageIcon, Mic, Play, Pause } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActors, Actor } from '@/hooks/useActors';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface ActorSelectorPopoverProps {
  selectedActorId: string | null;
  onSelect: (actorId: string | null, actor?: Actor) => void;
  showVoicePreview?: boolean;
  className?: string;
  /** When true, shows checkboxes to choose whether to pass image/voice. */
  showAssetToggles?: boolean;
  useImage?: boolean;
  useVoice?: boolean;
  onUseImageChange?: (value: boolean) => void;
  onUseVoiceChange?: (value: boolean) => void;
}

export default function ActorSelectorPopover({
  selectedActorId,
  onSelect,
  showVoicePreview = false,
  className,
  showAssetToggles = false,
  useImage = true,
  useVoice = true,
  onUseImageChange,
  onUseVoiceChange,
}: ActorSelectorPopoverProps) {
  const { actors } = useActors();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter completed actors with profile images (prefer 360 URL)
  const availableActors = actors?.filter(
    (actor) => actor.status === 'completed' && (actor.profile_360_url || actor.profile_image_url)
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

  const hasImage = !!(selectedActor?.profile_image_url || selectedActor?.profile_360_url);
  const voiceUrl = selectedActor?.voice_url || selectedActor?.custom_audio_url || null;
  const hasVoice = !!voiceUrl;

  // Per-card voice preview (single audio element, only one plays at a time)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingActorId, setPlayingActorId] = useState<string | null>(null);

  // Stop playback when popover closes
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingActorId(null);
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleActorVoice = (e: React.MouseEvent, actorId: string, url: string | null) => {
    e.stopPropagation();
    if (!url) return;

    // If this actor is already playing -> pause
    if (playingActorId === actorId && audioRef.current) {
      audioRef.current.pause();
      setPlayingActorId(null);
      return;
    }

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audio.addEventListener('ended', () => setPlayingActorId(null));
    audioRef.current = audio;
    audio.play().catch(() => setPlayingActorId(null));
    setPlayingActorId(actorId);
  };


  return (
    <div className="space-y-2">
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
                src={selectedActor.profile_360_url || selectedActor.profile_image_url || ''}
                alt={selectedActor.name}
                className="h-6 w-6 rounded-full object-cover bg-muted"
                onError={(e) => {
                  if (selectedActor.profile_image_url && e.currentTarget.src !== selectedActor.profile_image_url) {
                    e.currentTarget.src = selectedActor.profile_image_url;
                  }
                }}
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
      <PopoverContent className="w-[380px] p-0 flex flex-col max-h-[min(480px,calc(100vh-100px))]" align="start" onWheel={(e) => e.stopPropagation()}>
        <div className="p-3 border-b border-border shrink-0">
          <Input
            placeholder="Search actors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2">
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
        {/* Create New Actor button */}
        <div className="border-t border-border p-2 shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setOpen(false);
              navigate('/actors');
            }}
          >
            <Plus className="h-4 w-4" />
            Create New Actor
          </Button>
        </div>
      </PopoverContent>
    </Popover>

    {showAssetToggles && selectedActor && (
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Choose what to send to generation
        </p>
        <div className="grid grid-cols-2 gap-2">
          {/* Image toggle card */}
          <button
            type="button"
            disabled={!hasImage}
            onClick={() => onUseImageChange?.(!(hasImage && useImage))}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg border bg-card p-2.5 text-left transition-all',
              hasImage && useImage
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border hover:border-primary/40',
              !hasImage && 'opacity-50 cursor-not-allowed hover:border-border',
            )}
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
              {hasImage && (selectedActor.profile_image_url || selectedActor.profile_360_url) ? (
                <img
                  src={selectedActor.profile_image_url || selectedActor.profile_360_url || ''}
                  alt={selectedActor.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">Actor image</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                {hasImage ? 'Visual reference' : 'Not available'}
              </p>
            </div>
            <div
              className={cn(
                'h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors',
                hasImage && useImage
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/40 bg-background',
              )}
            >
              {hasImage && useImage && <Check className="h-3 w-3" strokeWidth={3} />}
            </div>
          </button>

          {/* Voice toggle card */}
          <button
            type="button"
            disabled={!hasVoice}
            onClick={() => onUseVoiceChange?.(!(hasVoice && useVoice))}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg border bg-card p-2.5 text-left transition-all',
              hasVoice && useVoice
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border hover:border-primary/40',
              !hasVoice && 'opacity-50 cursor-not-allowed hover:border-border',
            )}
          >
            <button
              type="button"
              disabled={!hasVoice}
              onClick={toggleVoicePreview}
              className={cn(
                'h-10 w-10 shrink-0 rounded-md flex items-center justify-center transition-colors',
                hasVoice
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
              aria-label={isPlayingVoice ? 'Pause voice preview' : 'Play voice preview'}
            >
              {isPlayingVoice ? (
                <Pause className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Play className="h-4 w-4 ml-0.5" strokeWidth={2} />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">Actor voice</p>
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                {hasVoice ? 'Audio reference' : 'Not available'}
              </p>
            </div>
            <div
              className={cn(
                'h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors',
                hasVoice && useVoice
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/40 bg-background',
              )}
            >
              {hasVoice && useVoice && <Check className="h-3 w-3" strokeWidth={3} />}
            </div>
          </button>
        </div>
      </div>
    )}
    </div>
  );
}
