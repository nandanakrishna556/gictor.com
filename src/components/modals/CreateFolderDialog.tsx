import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import LocationSelector from '@/components/forms/LocationSelector';
import type { Tag } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, status: string, tags: string[]) => void;
  projectId: string;
  folderId?: string;
  initialStatus?: string;
  tags?: Tag[];
  onCreateTag?: () => void;
}

const defaultStatusOptions = [
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
];

export default function CreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  projectId,
  folderId,
  initialStatus,
  tags = [],
  onCreateTag,
}: CreateFolderDialogProps) {
  const [name, setName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || 'processing');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [currentFolderId, setCurrentFolderId] = useState(folderId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStatusOption = defaultStatusOptions.find(s => s.value === selectedStatus) || defaultStatusOptions[0];

  const handleLocationChange = (newProjectId: string, newFolderId?: string) => {
    setCurrentProjectId(newProjectId);
    setCurrentFolderId(newFolderId);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), selectedStatus, selectedTags);
      setName('');
      setSelectedStatus(initialStatus || 'processing');
      setSelectedTags([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('');
      setSelectedStatus(initialStatus || 'processing');
      setSelectedTags([]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name, Location, Status, Tags - All in one row */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[140px] space-y-2">
                <Label htmlFor="folderName">Folder name</Label>
                <Input
                  id="folderName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter folder name"
                  className="rounded-xl"
                  autoFocus
                />
              </div>

              <LocationSelector
                projectId={currentProjectId}
                folderId={currentFolderId}
                onLocationChange={handleLocationChange}
              />

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[130px] rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', currentStatusOption.color)} />
                      <span>{currentStatusOption.label}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {defaultStatusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2 w-2 rounded-full', status.color)} />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 min-w-[100px] items-center gap-2 rounded-xl border border-input bg-background px-3 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      {selectedTags.length > 0 ? (
                        <div className="flex flex-1 flex-wrap items-center gap-1">
                          {selectedTags.slice(0, 2).map((tagId) => {
                            const tag = tags.find((t) => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <span
                                key={tagId}
                                className="rounded px-1.5 py-0.5 text-xs"
                                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                              >
                                {tag.tag_name}
                              </span>
                            );
                          })}
                          {selectedTags.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{selectedTags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="flex-1 text-left text-muted-foreground">Tags</span>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-52 bg-card border shadow-lg">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium mb-2">Tags</h4>
                      {tags.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No tags available</p>
                      ) : (
                        tags.map((tag) => (
                          <div
                            key={tag.id}
                            className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary cursor-pointer"
                            onClick={() => toggleTag(tag.id)}
                          >
                            <Checkbox
                              checked={selectedTags.includes(tag.id)}
                              onCheckedChange={() => toggleTag(tag.id)}
                            />
                            <span
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="flex-1 text-sm truncate">{tag.tag_name}</span>
                          </div>
                        ))
                      )}
                      <button
                        type="button"
                        onClick={() => onCreateTag?.()}
                        className="flex w-full items-center gap-2 rounded-md p-1.5 text-sm text-primary hover:bg-secondary mt-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Create new tag
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="rounded-xl"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
