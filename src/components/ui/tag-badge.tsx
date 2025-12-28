import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { X, Plus, Check, GripVertical } from 'lucide-react';

export interface TagData {
  id: string;
  tag_name: string;
  color: string;
}

// Preset colors for tag creation
const TAG_COLORS = [
  '#007AFF', // Blue
  '#34C759', // Green
  '#FF9500', // Orange
  '#FF3B30', // Red
  '#AF52DE', // Purple
  '#5856D6', // Indigo
  '#FF2D55', // Pink
  '#00C7BE', // Teal
  '#FFD60A', // Yellow
  '#8E8E93', // Gray
];

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
  isDraggable?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function TagSelectorItem({
  tag,
  selected,
  onToggle,
  onDelete,
  showDelete = false,
  isDraggable = false,
  dragHandleProps,
}: TagSelectorItemProps) {
  return (
    <div
      className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {isDraggable && (
        <div 
          {...dragHandleProps}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3" />
        </div>
      )}
      <div className={cn(
        'h-4 w-4 rounded border flex items-center justify-center transition-colors',
        selected 
          ? 'bg-primary border-primary text-primary-foreground' 
          : 'border-border'
      )}>
        {selected && <Check className="h-3 w-3" />}
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

// Inline tag creator with color picker
interface InlineTagCreatorProps {
  onCreateTag: (name: string, color: string) => void;
  placeholder?: string;
  className?: string;
}

export function InlineTagCreator({
  onCreateTag,
  placeholder = 'New tag...',
  className,
}: InlineTagCreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (trimmedName && trimmedName.length <= 50) {
      onCreateTag(trimmedName, selectedColor);
      setName('');
      setSelectedColor(TAG_COLORS[0]);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-secondary',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Plus className="h-3 w-3" />
          Add tag
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3 bg-popover" 
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 50))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="h-8 text-sm"
            autoFocus
            maxLength={50}
          />
          
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Color</span>
            <div className="flex flex-wrap gap-1.5">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition-all hover:scale-110',
                    selectedColor === color 
                      ? 'border-foreground scale-110' 
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div 
              className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
              style={{ 
                backgroundColor: `${selectedColor}20`, 
                color: selectedColor 
              }}
            >
              <span 
                className="h-2 w-2 rounded-full" 
                style={{ backgroundColor: selectedColor }} 
              />
              {name || 'Preview'}
            </div>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!name.trim()}
              className="h-7"
            >
              Create
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Complete tag selector with list and inline creator
interface TagSelectorProps {
  tags: TagData[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag?: (name: string, color: string) => void;
  onDeleteTag?: (tagId: string) => void;
  onReorderTags?: (reorderedTags: TagData[]) => void;
  showDelete?: boolean;
  enableDragDrop?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function TagSelector({
  tags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  onDeleteTag,
  onReorderTags,
  showDelete = false,
  enableDragDrop = false,
  emptyMessage = 'No tags available',
  className,
}: TagSelectorProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorderTags) return;
    
    const items = Array.from(tags);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onReorderTags(items);
  };

  const renderTagItems = () => {
    if (tags.length === 0) {
      return <p className="text-xs text-muted-foreground py-2">{emptyMessage}</p>;
    }

    if (enableDragDrop && onReorderTags) {
      return (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tags">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1"
              >
                {tags.map((tag, index) => (
                  <Draggable key={tag.id} draggableId={tag.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          snapshot.isDragging && 'opacity-90 bg-secondary rounded-md shadow-md'
                        )}
                      >
                        <TagSelectorItem
                          tag={tag}
                          selected={selectedTagIds.includes(tag.id)}
                          onToggle={() => onToggleTag(tag.id)}
                          onDelete={onDeleteTag ? () => onDeleteTag(tag.id) : undefined}
                          showDelete={showDelete}
                          isDraggable
                          dragHandleProps={provided.dragHandleProps ?? undefined}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      );
    }

    return tags.map((tag) => (
      <TagSelectorItem
        key={tag.id}
        tag={tag}
        selected={selectedTagIds.includes(tag.id)}
        onToggle={() => onToggleTag(tag.id)}
        onDelete={onDeleteTag ? () => onDeleteTag(tag.id) : undefined}
        showDelete={showDelete}
      />
    ));
  };

  return (
    <div className={cn('space-y-1', className)}>
      {renderTagItems()}
      {onCreateTag && (
        <div className="pt-1 border-t mt-2">
          <InlineTagCreator onCreateTag={onCreateTag} />
        </div>
      )}
    </div>
  );
}

// Export preset colors for external use
export { TAG_COLORS };
