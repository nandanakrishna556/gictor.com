import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagList, TagSelector, TagData } from '@/components/ui/tag-badge';
import LocationSelector from '@/components/forms/LocationSelector';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface PipelineHeaderProps {
  title: string;
  name: string;
  onNameChange: (name: string) => void;
  projectId: string;
  folderId?: string;
  onLocationChange: (projectId: string, folderId?: string) => void;
  displayStatus: string;
  onStatusChange: (status: string) => void;
  statusOptions: StatusOption[];
  currentStatusOption: StatusOption;
  tags: TagData[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => Promise<void>;
  saveStatus: 'idle' | 'saving' | 'saved';
  onClose: () => void;
}

export default function PipelineHeader({
  title,
  name,
  onNameChange,
  projectId,
  folderId,
  onLocationChange,
  displayStatus,
  onStatusChange,
  statusOptions,
  currentStatusOption,
  tags,
  selectedTags,
  onToggleTag,
  onCreateTag,
  saveStatus,
  onClose,
}: PipelineHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-3 flex-wrap">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-lg font-semibold">{title}</h2>
      
      <div className="h-5 w-px bg-border" />
      
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="w-28 h-7 text-sm"
      />
      
      <LocationSelector
        projectId={projectId}
        folderId={folderId}
        onLocationChange={onLocationChange}
      />
      
      <Select value={displayStatus} onValueChange={onStatusChange}>
        <SelectTrigger className={cn(
          "h-7 w-fit rounded-md text-xs border-0 px-3 py-1 text-white gap-1",
          currentStatusOption.color
        )}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <div className={cn('h-2 w-2 rounded-full', opt.color)} />
                {opt.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-secondary/50 rounded-md px-2 py-1 transition-colors">
            {selectedTags.length > 0 ? (
              <TagList 
                tags={tags} 
                selectedTagIds={selectedTags} 
                maxVisible={1} 
                size="sm"
              />
            ) : (
              <span className="text-xs text-muted-foreground">+ Add tag</span>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-52 bg-popover">
          <h4 className="text-sm font-medium mb-2">Tags</h4>
          <TagSelector
            tags={tags}
            selectedTagIds={selectedTags}
            onToggleTag={onToggleTag}
            onCreateTag={onCreateTag}
            enableDragDrop
          />
        </PopoverContent>
      </Popover>
      
      {/* Spacer to push save/close to right */}
      <div className="flex-1" />
      
      {/* Auto-save indicator and Close button */}
      <div className="flex items-center gap-3">
        {saveStatus !== 'idle' && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-500">Saved</span>
              </>
            )}
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
