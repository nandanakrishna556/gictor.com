import { useState } from 'react';
import { Filter, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Tag } from '@/hooks/useTags';

export interface FilterState {
  statuses: string[];
  fileTypes: string[];
  tags: string[];
}

interface FilterPopoverProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  tags: Tag[];
  onCreateTag: () => void;
}

const FILE_TYPES = [
  { value: 'first_frame', label: 'First Frame' },
  { value: 'talking_head', label: 'Talking Head' },
  { value: 'script', label: 'Script' },
];

const STATUSES = [
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
];

export default function FilterPopover({
  filters,
  onFiltersChange,
  tags,
  onCreateTag,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const toggleFileType = (type: string) => {
    const newTypes = filters.fileTypes.includes(type)
      ? filters.fileTypes.filter((t) => t !== type)
      : [...filters.fileTypes, type];
    onFiltersChange({ ...filters, fileTypes: newTypes });
  };

  const toggleTag = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter((t) => t !== tagId)
      : [...filters.tags, tagId];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearFilters = () => {
    onFiltersChange({ statuses: [], fileTypes: [], tags: [] });
  };

  const activeFiltersCount =
    filters.statuses.length + filters.fileTypes.length + filters.tags.length;

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
      <PopoverContent align="start" className="w-72 p-4">
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              Status
            </Label>
            <div className="space-y-1">
              {STATUSES.map((status) => (
                <div key={status.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={filters.statuses.includes(status.value)}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <div
                    className={cn('h-2 w-2 rounded-full', status.color)}
                  />
                  <Label
                    htmlFor={`status-${status.value}`}
                    className="text-sm font-normal"
                  >
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* File Type Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              File Type
            </Label>
            <div className="space-y-1">
              {FILE_TYPES.map((type) => (
                <div key={type.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={filters.fileTypes.includes(type.value)}
                    onCheckedChange={() => toggleFileType(type.value)}
                  />
                  <Label
                    htmlFor={`type-${type.value}`}
                    className="text-sm font-normal"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium uppercase text-muted-foreground">
                Tags
              </Label>
              <button
                onClick={() => {
                  setOpen(false);
                  onCreateTag();
                }}
                className="text-xs text-primary hover:underline"
              >
                <Plus className="inline h-3 w-3" /> New
              </button>
            </div>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium transition-all',
                      filters.tags.includes(tag.id)
                        ? 'ring-2 ring-offset-1'
                        : 'opacity-70 hover:opacity-100'
                    )}
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderColor: tag.color,
                    }}
                  >
                    {tag.tag_name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No tags yet</p>
            )}
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="w-full gap-2 text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Clear all filters
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
