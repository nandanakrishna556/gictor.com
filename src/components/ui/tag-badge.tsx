import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface TagData {
  id: string;
  tag_name: string;
  color: string;
}

interface TagBadgeProps {
  tag: TagData;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'solid';
  removable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function TagBadge({
  tag,
  size = 'md',
  variant = 'default',
  removable = false,
  onClick,
  onRemove,
  className,
}: TagBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0 gap-0.5',
    md: 'text-xs px-2 py-0.5 gap-1',
    lg: 'text-sm px-2.5 py-1 gap-1.5',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5',
  };

  const getStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: tag.color,
          color: 'white',
          borderColor: tag.color,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: tag.color,
          borderColor: tag.color,
        };
      default:
        return {
          backgroundColor: `${tag.color}20`,
          color: tag.color,
          borderColor: `${tag.color}40`,
        };
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        sizeClasses[size],
        'font-medium border transition-colors',
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      style={getStyles()}
      onClick={onClick ? handleClick : undefined}
    >
      {variant !== 'solid' && (
        <span 
          className={cn('rounded-full flex-shrink-0', dotSizes[size])} 
          style={{ backgroundColor: tag.color }}
        />
      )}
      <span className="truncate">{tag.tag_name}</span>
      {removable && onRemove && (
        <button
          onClick={handleRemove}
          className="rounded-full hover:bg-black/10 p-0.5 -mr-0.5"
        >
          <X className={iconSizes[size]} />
        </button>
      )}
    </Badge>
  );
}

// Tag list display component for showing multiple tags with overflow
interface TagListProps {
  tags: TagData[];
  selectedTagIds?: string[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'solid';
  onTagClick?: (tag: TagData) => void;
  onTagRemove?: (tag: TagData) => void;
  className?: string;
}

export function TagList({
  tags,
  selectedTagIds,
  maxVisible = 3,
  size = 'md',
  variant = 'default',
  onTagClick,
  onTagRemove,
  className,
}: TagListProps) {
  // Filter to selected tags if selectedTagIds provided
  const displayTags = selectedTagIds 
    ? tags.filter(t => selectedTagIds.includes(t.id))
    : tags;

  const visibleTags = displayTags.slice(0, maxVisible);
  const overflowCount = displayTags.length - maxVisible;

  if (displayTags.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {visibleTags.map((tag) => (
        <TagBadge
          key={tag.id}
          tag={tag}
          size={size}
          variant={variant}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
          removable={!!onTagRemove}
          onRemove={onTagRemove ? () => onTagRemove(tag) : undefined}
        />
      ))}
      {overflowCount > 0 && (
        <Badge 
          variant="outline" 
          className={cn(
            'text-muted-foreground border-border',
            size === 'sm' && 'text-[10px] px-1.5 py-0',
            size === 'md' && 'text-xs px-2 py-0.5',
            size === 'lg' && 'text-sm px-2.5 py-1',
          )}
        >
          +{overflowCount}
        </Badge>
      )}
    </div>
  );
}

// Tag selector item for popover menus
interface TagSelectorItemProps {
  tag: TagData;
  selected: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export function TagSelectorItem({
  tag,
  selected,
  onToggle,
  onDelete,
  showDelete = false,
}: TagSelectorItemProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <div className={cn(
        'h-4 w-4 rounded border flex items-center justify-center transition-colors',
        selected 
          ? 'bg-primary border-primary text-primary-foreground' 
          : 'border-border'
      )}>
        {selected && <span className="text-xs">✓</span>}
      </div>
      <span 
        className="h-2 w-2 rounded-full flex-shrink-0" 
        style={{ backgroundColor: tag.color }} 
      />
      <span className="flex-1 text-sm truncate">{tag.tag_name}</span>
      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
