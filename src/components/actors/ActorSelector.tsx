import { Check, UserCircle } from 'lucide-react';
import { Actor, useActors } from '@/hooks/useActors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ActorSelectorProps {
  value?: string;
  onChange: (actor: Actor | null) => void;
  type?: 'image' | 'voice' | 'both';
  placeholder?: string;
  className?: string;
}

export function ActorSelector({
  value,
  onChange,
  type = 'both',
  placeholder = 'Select actor',
  className,
}: ActorSelectorProps) {
  const { actors } = useActors();

  // Filter actors based on type and status
  const filteredActors = actors?.filter((actor) => {
    if (actor.status !== 'completed') return false;
    
    if (type === 'image') return !!actor.profile_image_url;
    if (type === 'voice') return !!actor.voice_url;
    if (type === 'both') return !!actor.profile_image_url && !!actor.voice_url;
    
    return true;
  }) || [];

  const selectedActor = filteredActors.find((a) => a.id === value);

  const handleValueChange = (newValue: string) => {
    if (newValue === 'none') {
      onChange(null);
    } else {
      const actor = filteredActors.find((a) => a.id === newValue);
      onChange(actor || null);
    }
  };

  return (
    <Select value={value || 'none'} onValueChange={handleValueChange}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder}>
          {selectedActor ? (
            <div className="flex items-center gap-2">
              {selectedActor.profile_image_url ? (
                <img
                  src={selectedActor.profile_image_url}
                  alt={selectedActor.name}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              )}
              <span>{selectedActor.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No actor</span>
        </SelectItem>
        {filteredActors.map((actor) => (
          <SelectItem key={actor.id} value={actor.id}>
            <div className="flex items-center gap-2">
              {actor.profile_image_url ? (
                <img
                  src={actor.profile_image_url}
                  alt={actor.name}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              )}
              <span>{actor.name}</span>
              {(actor.gender || actor.age) && (
                <span className="text-xs text-muted-foreground">
                  {[actor.gender, actor.age].filter(Boolean).join(' • ')}
                </span>
              )}
              {value === actor.id && <Check className="ml-auto h-4 w-4" />}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
