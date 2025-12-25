import { useState } from 'react';
import { Filter, Plus, Tag, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Tag as TagType } from '@/hooks/useTags';

interface FilterPopoverProps {
  tags: TagType[];
  selectedTags: string[];
  selectedStatuses: string[];
  selectedFileTypes: string[];
  onTagsChange: (tags: string[]) => void;
  onStatusesChange: (statuses: string[]) => void;
  onFileTypesChange: (types: string[]) => void;
  onCreateTag: () => void;
  onClearAll: () => void;
}

const statusOptions = [
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
];

const fileTypeOptions = [
  { value: 'first_frame', label: 'First Frame' },
  { value: 'talking_head', label: 'Talking Head' },
  { value: 'script', label: 'Script' },
];

export default function FilterPopover({
  tags,
  selectedTags,
  selectedStatuses,
  selectedFileTypes,
  onTagsChange,
  onStatusesChange,
  onFileTypesChange,
  onCreateTag,
  onClearAll,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);

  const activeFiltersCount = selectedTags.length + selectedStatuses.length + selectedFileTypes.length;

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  const toggleFileType = (type: string) => {
    if (selectedFileTypes.includes(type)) {
      onFileTypesChange(selectedFileTypes.filter((t) => t !== type));
    } else {
      onFileTypesChange([...selectedFileTypes, type]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filters</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
            <div className="space-y-1">
              {statusOptions.map((status) => (
                <label
                  key={status.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-secondary"
                >
                  <Checkbox
                    checked={selectedStatuses.includes(status.value)}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <div className={cn('h-2 w-2 rounded-full', status.color)} />
                  <span className="text-sm">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* File Type */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">File Type</h4>
            <div className="space-y-1">
              {fileTypeOptions.map((type) => (
                <label
                  key={type.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-secondary"
                >
                  <Checkbox
                    checked={selectedFileTypes.includes(type.value)}
                    onCheckedChange={() => toggleFileType(type.value)}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
              <button
                onClick={() => {
                  setOpen(false);
                  onCreateTag();
                }}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                New tag
              </button>
            </div>
            <div className="space-y-1">
              {tags.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  No tags created yet
                </p>
              ) : (
                tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-secondary"
                  >
                    <Checkbox
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <Tag className="h-3 w-3" style={{ color: tag.color }} />
                    <span className="text-sm">{tag.tag_name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
