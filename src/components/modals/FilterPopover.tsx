import { useState } from 'react';
import { SlidersHorizontal, Plus, Tag, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  onDeleteTag?: (id: string) => void;
  onClearAll: () => void;
}

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
];

const fileTypeOptions = [
  { value: 'first_frame', label: 'First Frame' },
  { value: 'talking_head', label: 'Lip Sync' },
  { value: 'speech', label: 'Speech' },
  { value: 'script', label: 'Script' },
  { value: 'folder', label: 'Folder' },
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
  onDeleteTag,
  onClearAll,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [fileTypeOpen, setFileTypeOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

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
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
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

          {/* Status - Collapsible */}
          <Collapsible open={statusOpen} onOpenChange={setStatusOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
              <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
              {statusOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1">
              {statusOptions.map((status) => (
                <label
                  key={status.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-secondary"
                  onClick={() => toggleStatus(status.value)}
                >
                  <Checkbox
                    checked={selectedStatuses.includes(status.value)}
                    onCheckedChange={() => toggleStatus(status.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className={cn('h-2 w-2 rounded-full', status.color)} />
                  <span className="text-sm">{status.label}</span>
                </label>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* File Type - Collapsible */}
          <Collapsible open={fileTypeOpen} onOpenChange={setFileTypeOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
              <h4 className="text-sm font-medium text-muted-foreground">File Type</h4>
              {fileTypeOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1">
              {fileTypeOptions.map((type) => (
                <label
                  key={type.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-secondary"
                  onClick={() => toggleFileType(type.value)}
                >
                  <Checkbox
                    checked={selectedFileTypes.includes(type.value)}
                    onCheckedChange={() => toggleFileType(type.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Tags - Collapsible */}
          <Collapsible open={tagsOpen} onOpenChange={setTagsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-1">
              <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onCreateTag();
                  }}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" strokeWidth={1.5} />
                  New tag
                </button>
                {tagsOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1">
              {tags.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  No tags created yet
                </p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 rounded-md p-2 hover:bg-secondary cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    <Checkbox
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Tag className="h-3 w-3 flex-shrink-0" style={{ color: tag.color }} strokeWidth={1.5} />
                    <span className="flex-1 text-sm truncate">{tag.tag_name}</span>
                    {onDeleteTag && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTag(tag.id);
                        }}
                        className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Delete tag"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </PopoverContent>
    </Popover>
  );
}