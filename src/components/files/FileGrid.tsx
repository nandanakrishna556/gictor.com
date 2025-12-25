import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Download,
  MoreHorizontal,
  Trash2,
  Copy,
  Plus,
  Archive,
  Tag,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Search,
  Paperclip,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { File, Folder as FolderType } from '@/hooks/useFiles';
import type { Pipeline, PipelineStage } from '@/hooks/usePipelines';
import type { Tag as TagType } from '@/hooks/useTags';

interface FileGridProps {
  files: File[];
  folders: FolderType[];
  projectId: string;
  viewMode: 'grid' | 'kanban';
  pipelines: Pipeline[];
  tags: TagType[];
  selectedPipelineId: string | null;
  onPipelineChange: (id: string | null) => void;
  onCreatePipeline: () => void;
  onCreateNew?: () => void;
  onCreateTag?: () => void;
  onDeleteTag?: (id: string) => void;
  onDeleteFile?: (id: string) => void;
  onDeleteFolder?: (id: string) => void;
  onUpdateFileStatus?: (id: string, status: string) => void;
  onUpdateFileTags?: (id: string, tags: string[]) => void;
  onUpdateFolderStatus?: (id: string, status: string) => void;
  onUpdateFolderTags?: (id: string, tags: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdateStatus?: (ids: string[], status: string) => void;
  onBulkUpdateTags?: (ids: string[], tags: string[]) => void;
}

const fileTypeLabels: Record<string, string> = {
  first_frame: 'First Frame',
  talking_head: 'Talking Head',
  script: 'Script',
  folder: 'Folder',
};

const defaultStatusOptions = [
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
];

// Combined item type for unified handling
type GridItem = (File & { itemType: 'file' }) | (FolderType & { itemType: 'folder' });

export default function FileGrid({
  files,
  folders,
  projectId,
  viewMode,
  pipelines,
  tags,
  selectedPipelineId,
  onPipelineChange,
  onCreatePipeline,
  onCreateNew,
  onCreateTag,
  onDeleteTag,
  onDeleteFile,
  onDeleteFolder,
  onUpdateFileStatus,
  onUpdateFileTags,
  onUpdateFolderStatus,
  onUpdateFolderTags,
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkUpdateTags,
}: FileGridProps) {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages: PipelineStage[] = currentPipeline?.stages || [
    { id: 'processing', name: 'Processing', color: 'bg-amber-500' },
    { id: 'completed', name: 'Completed', color: 'bg-green-500' },
    { id: 'failed', name: 'Failed', color: 'bg-red-500' },
  ];

  // Combine files and folders into unified items
  const allItemsUnfiltered: GridItem[] = [
    ...folders.map((f) => ({ ...f, itemType: 'folder' as const, file_type: 'folder' })),
    ...files.map((f) => ({ ...f, itemType: 'file' as const })),
  ];

  // Filter by search query
  const allItems = allItemsUnfiltered.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(allItems.map((i) => i.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setBulkMode(false);
  };

  const handleBulkDelete = () => {
    const fileIds = Array.from(selectedItems).filter((id) =>
      files.some((f) => f.id === id)
    );
    if (fileIds.length > 0 && onBulkDelete) {
      onBulkDelete(fileIds);
    }
    // Delete folders individually
    Array.from(selectedItems)
      .filter((id) => folders.some((f) => f.id === id))
      .forEach((id) => onDeleteFolder?.(id));
    clearSelection();
  };

  const handleBulkStatusChange = (status: string) => {
    const fileIds = Array.from(selectedItems).filter((id) =>
      files.some((f) => f.id === id)
    );
    if (fileIds.length > 0 && onBulkUpdateStatus) {
      onBulkUpdateStatus(fileIds, status);
    }
    // Update folder statuses individually
    Array.from(selectedItems)
      .filter((id) => folders.some((f) => f.id === id))
      .forEach((id) => onUpdateFolderStatus?.(id, status));
  };

  const handleBulkTagToggle = (tagId: string, add: boolean) => {
    // For simplicity, we'll update files individually
    Array.from(selectedItems).forEach((id) => {
      const file = files.find((f) => f.id === id);
      const folder = folders.find((f) => f.id === id);
      
      if (file) {
        const currentTags = file.tags || [];
        const newTags = add
          ? [...new Set([...currentTags, tagId])]
          : currentTags.filter((t) => t !== tagId);
        onUpdateFileTags?.(id, newTags);
      } else if (folder) {
        const currentTags = folder.tags || [];
        const newTags = add
          ? [...new Set([...currentTags, tagId])]
          : currentTags.filter((t) => t !== tagId);
        onUpdateFolderTags?.(id, newTags);
      }
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    // Check if it's a file or folder
    const file = files.find((f) => f.id === draggableId);
    const folder = folders.find((f) => f.id === draggableId);
    
    if (file) {
      onUpdateFileStatus?.(draggableId, newStatus);
    } else if (folder) {
      onUpdateFolderStatus?.(draggableId, newStatus);
    }
  };

  if (viewMode === 'kanban') {
    return (
      <div className="space-y-4">
        {/* Bulk Actions Bar */}
        {bulkMode && (
          <BulkActionsBar
            selectedCount={selectedItems.size}
            stages={stages}
            tags={tags}
            onSelectAll={selectAll}
            onClear={clearSelection}
            onDelete={handleBulkDelete}
            onStatusChange={handleBulkStatusChange}
            onTagToggle={handleBulkTagToggle}
          />
        )}

        {/* Pipeline Selector */}
        <div className="flex items-center gap-3">
          <Select
            value={selectedPipelineId || 'default'}
            onValueChange={(id) => onPipelineChange(id === 'default' ? null : id)}
          >
            <SelectTrigger className="w-48 rounded-lg">
              <SelectValue placeholder="Select pipeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Pipeline</SelectItem>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={onCreatePipeline} className="gap-2">
            <Plus className="h-4 w-4" />
            New Pipeline
          </Button>
          <Button
            variant={bulkMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setBulkMode(!bulkMode)}
          >
            {bulkMode ? 'Cancel Selection' : 'Select'}
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage, stageIndex) => {
              // Default status is first stage - filter items with no status to first stage
              const stageItems = allItems.filter((item) => {
                const itemStatus = item.status;
                if (!itemStatus || itemStatus === 'active') {
                  return stageIndex === 0; // No status = first stage
                }
                return itemStatus === stage.id;
              });

              return (
                <Droppable key={stage.id} droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'min-w-80 flex-1 rounded-2xl bg-secondary/30 p-4 transition-colors',
                        snapshot.isDraggingOver && 'bg-primary/10'
                      )}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2.5 w-2.5 rounded-full', stage.color)} />
                          <h3 className="font-medium text-foreground">{stage.name}</h3>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {stageItems.length}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {stageItems.map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <KanbanCard
                                  item={item}
                                  tags={tags}
                                  projectId={projectId}
                                  isDragging={snapshot.isDragging}
                                  isSelected={selectedItems.has(item.id)}
                                  bulkMode={bulkMode}
                                  onSelect={() => toggleSelection(item.id)}
                                  onDelete={
                                    item.itemType === 'file'
                                      ? onDeleteFile
                                      : onDeleteFolder
                                  }
                                  onTagsChange={
                                    item.itemType === 'file'
                                      ? onUpdateFileTags
                                      : onUpdateFolderTags
                                  }
                                  onDeleteTag={onDeleteTag}
                                  onCreateTag={onCreateTag}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {/* Add Card Button */}
                        {onCreateNew && (
                          <button
                            onClick={onCreateNew}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-3 text-sm text-muted-foreground transition-all hover:border-primary hover:text-primary"
                          >
                            <Plus className="h-4 w-4" />
                            Add card
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {bulkMode && (
        <BulkActionsBar
          selectedCount={selectedItems.size}
          stages={stages}
          tags={tags}
          onSelectAll={selectAll}
          onClear={clearSelection}
          onDelete={handleBulkDelete}
          onStatusChange={handleBulkStatusChange}
          onTagToggle={handleBulkTagToggle}
        />
      )}

      {/* Search and Select Mode Toggle */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={bulkMode ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setBulkMode(!bulkMode)}
        >
          {bulkMode ? 'Cancel Selection' : 'Select'}
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Create New Card - First item */}
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="group relative flex aspect-[2/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card transition-colors duration-200 hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-all duration-200 group-hover:bg-primary/20">
              <Plus className="h-7 w-7 text-primary" />
            </div>
            <span className="mt-4 text-base font-medium text-muted-foreground transition-all duration-200 group-hover:text-primary">
              Create new
            </span>
          </button>
        )}

        {/* All Items (Folders first, then Files) */}
        {allItems.map((item) =>
          item.itemType === 'folder' ? (
            <FolderCard
              key={item.id}
              folder={item}
              projectId={projectId}
              stages={stages}
              tags={tags}
              isSelected={selectedItems.has(item.id)}
              bulkMode={bulkMode}
              onSelect={() => toggleSelection(item.id)}
              onDelete={onDeleteFolder}
              onStatusChange={onUpdateFolderStatus}
              onTagsChange={onUpdateFolderTags}
              onCreateTag={onCreateTag}
              onDeleteTag={onDeleteTag}
              onCreateNew={onCreateNew}
            />
          ) : (
            <FileCard
              key={item.id}
              file={item}
              stages={stages}
              tags={tags}
              isSelected={selectedItems.has(item.id)}
              bulkMode={bulkMode}
              onSelect={() => toggleSelection(item.id)}
              onDelete={onDeleteFile}
              onStatusChange={onUpdateFileStatus}
              onTagsChange={onUpdateFileTags}
              onCreateTag={onCreateTag}
              onDeleteTag={onDeleteTag}
              onCreateNew={onCreateNew}
            />
          )
        )}
      </div>
    </div>
  );
}

function BulkActionsBar({
  selectedCount,
  stages,
  tags,
  onSelectAll,
  onClear,
  onDelete,
  onStatusChange,
  onTagToggle,
}: {
  selectedCount: number;
  stages: PipelineStage[];
  tags: TagType[];
  onSelectAll: () => void;
  onClear: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  onTagToggle: (tagId: string, add: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="flex-1" />
      
      <Button variant="outline" size="sm" onClick={onSelectAll}>
        Select All
      </Button>

      {/* Status Change */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={selectedCount === 0}>
            Change Status
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="space-y-1">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => onStatusChange(stage.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-secondary"
              >
                <div className={cn('h-2 w-2 rounded-full', stage.color)} />
                {stage.name}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Tag Assignment */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" disabled={selectedCount === 0}>
            <Tag className="mr-2 h-4 w-4" />
            Tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Add/Remove Tags</h4>
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tags available</p>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-1">
                  <button
                    onClick={() => onTagToggle(tag.id, true)}
                    className="flex flex-1 items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-secondary"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.tag_name}
                  </button>
                  <button
                    onClick={() => onTagToggle(tag.id, false)}
                    className="rounded p-1 text-muted-foreground hover:bg-secondary"
                    title="Remove tag"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={selectedCount === 0}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      <Button variant="ghost" size="sm" onClick={onClear}>
        Cancel
      </Button>
    </div>
  );
}

function FolderCard({
  folder,
  projectId,
  stages,
  tags,
  isSelected,
  bulkMode,
  onSelect,
  onDelete,
  onStatusChange,
  onTagsChange,
  onCreateTag,
  onDeleteTag,
  onCreateNew,
}: {
  folder: FolderType;
  projectId: string;
  stages: PipelineStage[];
  tags: TagType[];
  isSelected: boolean;
  bulkMode: boolean;
  onSelect: () => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onTagsChange?: (id: string, tags: string[]) => void;
  onCreateTag?: () => void;
  onDeleteTag?: (id: string) => void;
  onCreateNew?: () => void;
}) {
  const navigate = useNavigate();
  // Default status to first stage if not set
  const effectiveStatus = folder.status && folder.status !== 'active' ? folder.status : stages[0]?.id || 'processing';
  const currentStage = stages.find((s) => s.id === effectiveStatus) || stages[0];
  const folderTags = folder.tags || [];

  const toggleTag = (tagId: string) => {
    if (folderTags.includes(tagId)) {
      onTagsChange?.(folder.id, folderTags.filter((t) => t !== tagId));
    } else {
      onTagsChange?.(folder.id, [...folderTags, tagId]);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (bulkMode) {
      e.preventDefault();
      onSelect();
    } else {
      navigate(`/projects/${projectId}/folder/${folder.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative flex aspect-[2/3] cursor-pointer flex-col rounded-2xl border bg-amber-50/50 transition-colors duration-200 hover:border-primary dark:bg-amber-950/20',
        isSelected && 'border-primary ring-2 ring-primary/20'
      )}
    >
      {/* Selection Checkbox */}
      {bulkMode && (
        <div className="absolute left-3 top-3 z-10">
          <Checkbox checked={isSelected} />
        </div>
      )}

      {/* Card Name at Top */}
      <div className="p-4 pb-0">
        <h3 className="text-center text-base font-semibold text-card-foreground">{folder.name}</h3>
      </div>

      {/* Apple-inspired Folder Icon */}
      <div className="flex flex-1 items-center justify-center">
        <div className="relative">
          <svg
            width="80"
            height="64"
            viewBox="0 0 80 64"
            fill="none"
            className="text-amber-400 dark:text-amber-500"
          >
            <path
              d="M4 12C4 7.58172 7.58172 4 12 4H28L34 12H68C72.4183 12 76 15.5817 76 20V52C76 56.4183 72.4183 60 68 60H12C7.58172 60 4 56.4183 4 52V12Z"
              fill="currentColor"
              opacity="0.3"
            />
            <path
              d="M4 20C4 15.5817 7.58172 12 12 12H68C72.4183 12 76 15.5817 76 20V52C76 56.4183 72.4183 60 68 60H12C7.58172 60 4 56.4183 4 52V20Z"
              fill="currentColor"
            />
            <path
              d="M4 12C4 7.58172 7.58172 4 12 4H26C28.2091 4 30.2091 5.2 31.2 7.1L34 12H4V12Z"
              fill="currentColor"
              opacity="0.8"
            />
          </svg>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-col gap-2 p-4">

        {/* Status Row - Two Column Layout */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-10 shrink-0">Status</span>
          <Select
            value={effectiveStatus}
            onValueChange={(value) => onStatusChange?.(folder.id, value)}
          >
            <SelectTrigger
              className={cn(
                'h-7 w-fit rounded-md text-xs border-0 px-3 py-1 text-white gap-1',
                currentStage?.color
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {currentStage?.name || 'Select status'}
            </SelectTrigger>
            <SelectContent className="bg-card border shadow-lg">
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', stage.color)} />
                    {stage.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags Row - Two Column Layout with Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <div
              className="flex items-center gap-3 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-muted-foreground w-10 shrink-0">Tags</span>
              <div className="flex flex-1 items-center gap-1.5">
                {folderTags.length > 0 ? (
                  <>
                    {folderTags.slice(0, 2).map((tagId) => {
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
                    {folderTags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{folderTags.length - 2}</span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">+ Add tag</span>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-52 bg-card border shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              {tags.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tags available</p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTag(tag.id);
                    }}
                  >
                    <Checkbox
                      checked={folderTags.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 text-sm truncate">{tag.tag_name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteTag?.(tag.id);
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Delete tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateTag?.();
                }}
                className="flex w-full items-center gap-2 rounded-md p-1.5 text-sm text-primary hover:bg-secondary mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Create new tag
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute right-3 top-3 rounded-lg p-1.5 opacity-0 transition-all duration-200 hover:bg-secondary group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onCreateNew && (
            <>
              <DropdownMenuItem
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateNew();
                }}
              >
                <Plus className="h-4 w-4" />
                Create new
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <DropdownMenuItem className="gap-2" onSelect={(e) => e.preventDefault()}>
                <Tag className="h-4 w-4" />
                Assign Tags
              </DropdownMenuItem>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tags</h4>
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 hover:bg-secondary"
                    >
                      <Checkbox
                        checked={folderTags.includes(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.tag_name}</span>
                    </label>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2">
            <Archive className="h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(folder.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FileCard({
  file,
  stages,
  tags,
  isSelected,
  bulkMode,
  onSelect,
  onDelete,
  onStatusChange,
  onTagsChange,
  onCreateTag,
  onDeleteTag,
  onCreateNew,
}: {
  file: File;
  stages: PipelineStage[];
  tags: TagType[];
  isSelected: boolean;
  bulkMode: boolean;
  onSelect: () => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onTagsChange?: (id: string, tags: string[]) => void;
  onCreateTag?: () => void;
  onDeleteTag?: (id: string) => void;
  onCreateNew?: () => void;
}) {
  const isProcessing = file.status === 'processing';
  const isFailed = file.status === 'failed';
  // Default status to first stage if not set
  const effectiveStatus = file.status || stages[0]?.id || 'processing';
  const currentStage = stages.find((s) => s.id === effectiveStatus) || stages[0];
  const fileTags = file.tags || [];

  const toggleTag = (tagId: string) => {
    if (fileTags.includes(tagId)) {
      onTagsChange?.(file.id, fileTags.filter((t) => t !== tagId));
    } else {
      onTagsChange?.(file.id, [...fileTags, tagId]);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (bulkMode) {
      e.preventDefault();
      onSelect();
    }
    // Non-bulk click can open file details if needed
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative flex aspect-[2/3] cursor-pointer flex-col rounded-2xl border bg-card transition-colors duration-200 hover:border-primary',
        isProcessing && 'animate-pulse-subtle',
        isFailed && 'border-destructive/50',
        isSelected && 'border-primary ring-2 ring-primary/20'
      )}
    >
      {/* Selection Checkbox */}
      {bulkMode && (
        <div className="absolute left-3 top-3 z-10">
          <Checkbox checked={isSelected} />
        </div>
      )}

      {/* Card Name at Top */}
      <div className="p-4 pb-0">
        <h3 className="truncate font-medium text-card-foreground">{file.name}</h3>
      </div>

      {/* Preview Area */}
      <div className="flex flex-1 items-center justify-center rounded-t-2xl bg-secondary">
        {file.preview_url ? (
          <img
            src={file.preview_url}
            alt={file.name}
            className="h-full w-full rounded-t-2xl object-cover"
          />
        ) : isProcessing ? (
          <div className="shimmer h-full w-full rounded-t-2xl" />
        ) : null}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4">

        <Badge
          variant="secondary"
          className={cn(
            'w-fit text-xs',
            file.file_type === 'first_frame' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            file.file_type === 'talking_head' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            file.file_type === 'script' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          )}
        >
          {fileTypeLabels[file.file_type] || file.file_type}
        </Badge>

        {/* Status Row - Two Column Layout */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-10 shrink-0">Status</span>
          <Select
            value={effectiveStatus}
            onValueChange={(value) => onStatusChange?.(file.id, value)}
          >
            <SelectTrigger
              className={cn(
                'h-7 w-fit rounded-md text-xs border-0 px-3 py-1 text-white gap-1',
                currentStage?.color
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {currentStage?.name || 'Select status'}
            </SelectTrigger>
            <SelectContent className="bg-card border shadow-lg">
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', stage.color)} />
                    {stage.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags Row - Two Column Layout with Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <div
              className="flex items-center gap-3 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-muted-foreground w-10 shrink-0">Tags</span>
              <div className="flex flex-1 items-center gap-1.5">
                {fileTags.length > 0 ? (
                  <>
                    {fileTags.slice(0, 2).map((tagId) => {
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
                    {fileTags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{fileTags.length - 2}</span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">+ Add tag</span>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-52 bg-card border shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <h4 className="text-sm font-medium mb-2">Tags</h4>
              {tags.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tags available</p>
              ) : (
                tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTag(tag.id);
                    }}
                  >
                    <Checkbox
                      checked={fileTags.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1 text-sm truncate">{tag.tag_name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteTag?.(tag.id);
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Delete tag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateTag?.();
                }}
                className="flex w-full items-center gap-2 rounded-md p-1.5 text-sm text-primary hover:bg-secondary mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                Create new tag
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Download button */}
      {file.status === 'completed' && file.download_url && (
        <a
          href={file.download_url}
          download
          className="absolute bottom-20 right-3 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all duration-200 hover:bg-secondary group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-4 w-4" />
        </a>
      )}

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute right-3 top-3 rounded-lg p-1.5 opacity-0 transition-all duration-200 hover:bg-secondary group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onCreateNew && (
            <>
              <DropdownMenuItem
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateNew();
                }}
              >
                <Plus className="h-4 w-4" />
                Create new
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <DropdownMenuItem className="gap-2" onSelect={(e) => e.preventDefault()}>
                <Tag className="h-4 w-4" />
                Assign Tags
              </DropdownMenuItem>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tags</h4>
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 hover:bg-secondary"
                    >
                      <Checkbox
                        checked={fileTags.includes(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.tag_name}</span>
                    </label>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2">
            <Copy className="h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <Archive className="h-4 w-4" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(file.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function KanbanCard({
  item,
  tags,
  projectId,
  isDragging,
  isSelected,
  bulkMode,
  onSelect,
  onDelete,
  onTagsChange,
  onDeleteTag,
  onCreateTag,
}: {
  item: GridItem;
  tags: TagType[];
  projectId: string;
  isDragging: boolean;
  isSelected: boolean;
  bulkMode: boolean;
  onSelect: () => void;
  onDelete?: (id: string) => void;
  onTagsChange?: (id: string, tags: string[]) => void;
  onDeleteTag?: (id: string) => void;
  onCreateTag?: () => void;
}) {
  const navigate = useNavigate();
  const itemTags = item.tags || [];
  const isFolder = item.itemType === 'folder';

  const toggleTag = (tagId: string) => {
    if (itemTags.includes(tagId)) {
      onTagsChange?.(item.id, itemTags.filter((t) => t !== tagId));
    } else {
      onTagsChange?.(item.id, [...itemTags, tagId]);
    }
  };

  const handleClick = () => {
    if (bulkMode) {
      onSelect();
    } else if (isFolder) {
      navigate(`/projects/${projectId}/folder/${item.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group rounded-xl border bg-card p-3 transition-all duration-200 hover:border-primary',
        isDragging && 'rotate-2 scale-105 shadow-lg',
        isFolder && 'bg-amber-50/50 dark:bg-amber-950/20',
        isSelected && 'border-primary ring-2 ring-primary/20'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Selection Checkbox */}
        {bulkMode && (
          <Checkbox checked={isSelected} onClick={(e) => e.stopPropagation()} />
        )}
        
        {/* Folder Icon for folders */}
        {isFolder && (
          <svg
            width="24"
            height="20"
            viewBox="0 0 80 64"
            fill="none"
            className="mt-0.5 flex-shrink-0 text-amber-400"
          >
            <path
              d="M4 20C4 15.5817 7.58172 12 12 12H68C72.4183 12 76 15.5817 76 20V52C76 56.4183 72.4183 60 68 60H12C7.58172 60 4 56.4183 4 52V20Z"
              fill="currentColor"
            />
          </svg>
        )}
        
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-card-foreground">{item.name}</h4>
          
          {/* File type badge */}
          {!isFolder && (
            <Badge
              variant="secondary"
              className={cn(
                'mt-1.5 text-xs',
                (item as File).file_type === 'first_frame' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                (item as File).file_type === 'talking_head' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                (item as File).file_type === 'script' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              )}
            >
              {fileTypeLabels[(item as File).file_type] || (item as File).file_type}
            </Badge>
          )}

          {/* Tags - Clickable with Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="mt-2 flex w-full items-center gap-3 rounded-md p-1 -m-1 hover:bg-secondary/50 transition-colors text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-muted-foreground w-8">Tags</span>
                {itemTags.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1">
                    {itemTags.slice(0, 2).map((tagId) => {
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
                    {itemTags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{itemTags.length - 2}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">+ Add tag</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 bg-card border shadow-lg" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-1">
                <h4 className="text-sm font-medium mb-2">Tags</h4>
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTag(tag.id);
                      }}
                    >
                      <Checkbox
                        checked={itemTags.includes(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1 text-sm truncate">{tag.tag_name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onDeleteTag?.(tag.id);
                        }}
                        className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Delete tag"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateTag?.();
                  }}
                  className="flex w-full items-center gap-2 rounded-md p-1.5 text-sm text-primary hover:bg-secondary mt-2"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create new tag
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded p-1 opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Popover>
              <PopoverTrigger asChild>
                <DropdownMenuItem className="gap-2" onSelect={(e) => e.preventDefault()}>
                  <Tag className="h-4 w-4" />
                  Assign Tags
                </DropdownMenuItem>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-52 bg-card border shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  {tags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No tags available</p>
                  ) : (
                    tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 rounded-md p-1.5 hover:bg-secondary cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTag(tag.id);
                        }}
                      >
                        <Checkbox
                          checked={itemTags.includes(tag.id)}
                          onCheckedChange={() => toggleTag(tag.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1 text-sm truncate">{tag.tag_name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDeleteTag?.(tag.id);
                          }}
                          className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Delete tag"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateTag?.();
                    }}
                    className="flex w-full items-center gap-2 rounded-md p-1.5 text-sm text-primary hover:bg-secondary mt-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create new tag
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <Copy className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Archive className="h-4 w-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive"
              onClick={() => onDelete?.(item.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
