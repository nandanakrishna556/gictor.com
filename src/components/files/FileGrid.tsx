import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Download,
  MoreHorizontal,
  Trash2,
  Plus,
  Tag,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Search,
  Paperclip,
  Pencil,
  Image,
  Video,
  FileText,
  MousePointer2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FileProgress } from '@/components/ui/file-progress';
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
import ConfirmDeleteDialog from '@/components/modals/ConfirmDeleteDialog';

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
  onEditPipeline?: (pipeline: Pipeline | null) => void;
  onEditDefaultPipeline?: () => void;
  onCreateNew?: (initialStatus?: string) => void;
  onCreateTag?: () => void;
  onDeleteTag?: (id: string) => void;
  onDeleteFile?: (id: string) => void;
  onDeleteFolder?: (id: string) => void;
  onFileClick?: (file: File) => void;
  onUpdateFileStatus?: (id: string, status: string) => void;
  onUpdateFileTags?: (id: string, tags: string[]) => void;
  onUpdateFileName?: (id: string, name: string) => void;
  onUpdateFolderStatus?: (id: string, status: string) => void;
  onUpdateFolderTags?: (id: string, tags: string[]) => void;
  onUpdateFolderName?: (id: string, name: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdateStatus?: (ids: string[], status: string) => void;
  onBulkUpdateTags?: (ids: string[], tags: string[]) => void;
  defaultStages?: PipelineStage[];
  selectMode?: boolean;
  onSelectModeChange?: (mode: boolean) => void;
}

const fileTypeLabels: Record<string, string> = {
  first_frame: 'First Frame',
  talking_head: 'Talking Head',
  script: 'Script',
  folder: 'Folder',
};

const fileTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  first_frame: Image,
  talking_head: Video,
  script: FileText,
};

const defaultStatusOptions = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
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
  onEditPipeline,
  onEditDefaultPipeline,
  onCreateNew,
  onCreateTag,
  onDeleteTag,
  onDeleteFile,
  onDeleteFolder,
  onFileClick,
  onUpdateFileStatus,
  onUpdateFileTags,
  onUpdateFileName,
  onUpdateFolderStatus,
  onUpdateFolderTags,
  onUpdateFolderName,
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkUpdateTags,
  defaultStages,
  selectMode = false,
  onSelectModeChange,
}: FileGridProps) {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const bulkMode = selectMode;
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (e.key === 'Escape' && bulkMode) {
      clearSelection();
    }

    if (e.key === 'Delete' && bulkMode && selectedItems.size > 0) {
      e.preventDefault();
      setShowBulkDeleteDialog(true);
    }
  }, [bulkMode, selectedItems.size]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages: PipelineStage[] = currentPipeline?.stages || defaultStages || [
    { id: 'draft', name: 'Draft', color: 'bg-slate-500' },
    { id: 'review', name: 'Review', color: 'bg-blue-500' },
    { id: 'approved', name: 'Approved', color: 'bg-emerald-500' },
    { id: 'rejected', name: 'Rejected', color: 'bg-red-500' },
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
    onSelectModeChange?.(false);
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
        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmDeleteDialog
          open={showBulkDeleteDialog}
          onOpenChange={setShowBulkDeleteDialog}
          onConfirm={() => {
            handleBulkDelete();
            setShowBulkDeleteDialog(false);
          }}
          title="Delete Selected Items"
          description={`Are you sure you want to delete ${selectedItems.size} selected item${selectedItems.size === 1 ? '' : 's'}? This action cannot be undone.`}
        />

        {/* Bulk Actions Bar */}
        {bulkMode && (
          <BulkActionsBar
            selectedCount={selectedItems.size}
            stages={stages}
            tags={tags}
            onSelectAll={selectAll}
            onClear={clearSelection}
            onDeleteRequest={() => setShowBulkDeleteDialog(true)}
            onStatusChange={handleBulkStatusChange}
            onTagToggle={handleBulkTagToggle}
          />
        )}

        {/* Pipeline Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
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
            {(onEditPipeline || onEditDefaultPipeline) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (currentPipeline) {
                    onEditPipeline?.(currentPipeline);
                  } else {
                    onEditDefaultPipeline?.();
                  }
                }}
                className="h-8 w-8"
                title="Edit pipeline"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onCreatePipeline} className="gap-2">
            <Plus className="h-4 w-4" />
            New Pipeline
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
                                  isRenaming={renamingItemId === item.id}
                                  onStartRename={() => setRenamingItemId(item.id)}
                                  onCancelRename={() => setRenamingItemId(null)}
                                  onSaveRename={(newName) => {
                                    if (item.itemType === 'file') {
                                      onUpdateFileName?.(item.id, newName);
                                    } else {
                                      onUpdateFolderName?.(item.id, newName);
                                    }
                                    setRenamingItemId(null);
                                  }}
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
                            onClick={() => onCreateNew(stage.id)}
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
      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={() => {
          handleBulkDelete();
          setShowBulkDeleteDialog(false);
        }}
        title="Delete Selected Items"
        description={`Are you sure you want to delete ${selectedItems.size} selected item${selectedItems.size === 1 ? '' : 's'}? This action cannot be undone.`}
      />

      {/* Bulk Actions Bar */}
      {bulkMode && (
        <BulkActionsBar
          selectedCount={selectedItems.size}
          stages={stages}
          tags={tags}
          onSelectAll={selectAll}
          onClear={clearSelection}
          onDeleteRequest={() => setShowBulkDeleteDialog(true)}
          onStatusChange={handleBulkStatusChange}
          onTagToggle={handleBulkTagToggle}
        />
      )}

      <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7">
        {/* Create New Card - First item */}
        {onCreateNew && (
          <button
            onClick={() => onCreateNew()}
            className="group relative flex aspect-[2/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card transition-colors duration-200 hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10 transition-all duration-200 group-hover:bg-primary/20">
              <Plus className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
            </div>
            <span className="mt-3 sm:mt-4 text-sm sm:text-base font-medium text-muted-foreground transition-all duration-200 group-hover:text-primary">
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
              isRenaming={renamingItemId === item.id}
              onStartRename={() => setRenamingItemId(item.id)}
              onCancelRename={() => setRenamingItemId(null)}
              onSaveRename={(newName) => {
                onUpdateFolderName?.(item.id, newName);
                setRenamingItemId(null);
              }}
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
              isRenaming={renamingItemId === item.id}
              onStartRename={() => setRenamingItemId(item.id)}
              onCancelRename={() => setRenamingItemId(null)}
              onSaveRename={(newName) => {
                onUpdateFileName?.(item.id, newName);
                setRenamingItemId(null);
              }}
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
  onDeleteRequest,
  onStatusChange,
  onTagToggle,
}: {
  selectedCount: number;
  stages: PipelineStage[];
  tags: TagType[];
  onSelectAll: () => void;
  onClear: () => void;
  onDeleteRequest: () => void;
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
        onClick={onDeleteRequest}
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
  isRenaming,
  onStartRename,
  onCancelRename,
  onSaveRename,
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
  isRenaming: boolean;
  onStartRename: () => void;
  onCancelRename: () => void;
  onSaveRename: (name: string) => void;
  onSelect: () => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onTagsChange?: (id: string, tags: string[]) => void;
  onCreateTag?: () => void;
  onDeleteTag?: (id: string) => void;
  onCreateNew?: () => void;
}) {
  const navigate = useNavigate();
  const [renameValue, setRenameValue] = useState(folder.name);
  
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
    if (isRenaming) return;
    if (bulkMode) {
      e.preventDefault();
      onSelect();
    } else {
      navigate(`/projects/${projectId}/folder/${folder.id}`);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (renameValue.trim()) {
        onSaveRename(renameValue.trim());
      } else {
        onCancelRename();
      }
    } else if (e.key === 'Escape') {
      setRenameValue(folder.name);
      onCancelRename();
    }
  };

  const handleRenameBlur = () => {
    if (renameValue.trim() && renameValue !== folder.name) {
      onSaveRename(renameValue.trim());
    } else {
      setRenameValue(folder.name);
      onCancelRename();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative flex aspect-[2/3] cursor-pointer flex-col rounded-2xl border bg-amber-50/50 transition-colors duration-200 hover:border-primary dark:bg-card dark:border-border/50 overflow-hidden',
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
      <div className="p-3 sm:p-4 pb-0" onClick={(e) => e.stopPropagation()}>
        {isRenaming ? (
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameBlur}
            className="h-8 text-sm font-semibold"
            autoFocus
          />
        ) : (
          <h3 className="truncate text-sm sm:text-base font-semibold text-card-foreground">{folder.name}</h3>
        )}
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
      <div className="flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 min-w-0">

        {/* Status Row - Two Column Layout */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xs text-muted-foreground w-9 sm:w-10 shrink-0">Status</span>
          <Select
            value={effectiveStatus}
            onValueChange={(value) => onStatusChange?.(folder.id, value)}
          >
            <SelectTrigger
              className={cn(
                'h-6 sm:h-7 w-fit max-w-[calc(100%-3rem)] rounded-md text-xs border-0 px-2 sm:px-3 py-1 text-white gap-1',
                currentStage?.color
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate">{currentStage?.name || 'Select status'}</span>
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
              className="flex items-center gap-2 sm:gap-3 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-muted-foreground w-9 sm:w-10 shrink-0">Tags</span>
              <div className="flex flex-1 items-center gap-1 min-w-0 overflow-hidden">
                {folderTags.length > 0 ? (
                  <>
                    {folderTags.slice(0, 1).map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <span
                          key={tagId}
                          className="rounded px-1.5 py-0.5 text-xs truncate max-w-[60px] sm:max-w-[80px]"
                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                        >
                          {tag.tag_name}
                        </span>
                      );
                    })}
                    {folderTags.length > 1 && (
                      <span className="text-xs text-muted-foreground shrink-0">+{folderTags.length - 1}</span>
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
        <DropdownMenuContent align="end" className="bg-card border shadow-lg">
          <DropdownMenuItem 
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
          >
            <Pencil className="h-4 w-4" />
            Rename
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
  isRenaming,
  onStartRename,
  onCancelRename,
  onSaveRename,
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
  isRenaming: boolean;
  onStartRename: () => void;
  onCancelRename: () => void;
  onSaveRename: (name: string) => void;
  onSelect: () => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onTagsChange?: (id: string, tags: string[]) => void;
  onCreateTag?: () => void;
  onDeleteTag?: (id: string) => void;
  onCreateNew?: () => void;
}) {
  const [renameValue, setRenameValue] = useState(file.name);
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
    if (isRenaming) return;
    if (bulkMode) {
      e.preventDefault();
      onSelect();
    }
    // Non-bulk click can open file details if needed
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (renameValue.trim()) {
        onSaveRename(renameValue.trim());
      } else {
        onCancelRename();
      }
    } else if (e.key === 'Escape') {
      setRenameValue(file.name);
      onCancelRename();
    }
  };

  const handleRenameBlur = () => {
    if (renameValue.trim() && renameValue !== file.name) {
      onSaveRename(renameValue.trim());
    } else {
      setRenameValue(file.name);
      onCancelRename();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative flex aspect-[2/3] cursor-pointer flex-col rounded-2xl border bg-card transition-colors duration-200 hover:border-primary overflow-hidden',
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

      {/* Card Name at Top with Icon */}
      <div className="p-3 sm:p-4 pb-2" onClick={(e) => e.stopPropagation()}>
        {isRenaming ? (
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameBlur}
            className="h-8 text-sm font-medium"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            {(() => {
              const FileIcon = fileTypeIcons[file.file_type] || FileText;
              return (
                <FileIcon className={cn(
                  'h-4 w-4 flex-shrink-0',
                  file.file_type === 'first_frame' && 'text-blue-500',
                  file.file_type === 'talking_head' && 'text-purple-500',
                  file.file_type === 'script' && 'text-amber-500'
                )} />
              );
            })()}
            <h3 className="truncate text-sm sm:text-base font-medium text-card-foreground">{file.name}</h3>
          </div>
        )}
      </div>

      {/* Preview Area - contained with object-contain to prevent cutoff */}
      <div className="relative flex flex-1 items-center justify-center bg-secondary overflow-hidden">
        {file.preview_url ? (
          <img
            src={file.preview_url}
            alt={file.name}
            className="h-full w-full object-contain"
          />
        ) : isProcessing ? (
          <div className="shimmer h-full w-full" />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            {(() => {
              const FileIcon = fileTypeIcons[file.file_type] || FileText;
              return <FileIcon className="h-12 w-12 text-muted-foreground/50" />;
            })()}
          </div>
        )}
        
        {/* Progress Overlay */}
        {isProcessing && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3">
            <FileProgress progress={file.progress || 0} status={file.status} />
          </div>
        )}
      </div>

      {/* Info - Status and Tags */}
      <div className="flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 min-w-0 bg-card">

        {/* Status Row - Two Column Layout */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xs text-muted-foreground w-9 sm:w-10 shrink-0">Status</span>
          <Select
            value={effectiveStatus}
            onValueChange={(value) => onStatusChange?.(file.id, value)}
          >
            <SelectTrigger
              className={cn(
                'h-6 sm:h-7 w-fit max-w-[calc(100%-3rem)] rounded-md text-xs border-0 px-2 sm:px-3 py-1 text-white gap-1',
                currentStage?.color
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate">{currentStage?.name || 'Select status'}</span>
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
              className="flex items-center gap-2 sm:gap-3 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs text-muted-foreground w-9 sm:w-10 shrink-0">Tags</span>
              <div className="flex flex-1 items-center gap-1 min-w-0 overflow-hidden">
                {fileTags.length > 0 ? (
                  <>
                    {fileTags.slice(0, 1).map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <span
                          key={tagId}
                          className="rounded px-1.5 py-0.5 text-xs truncate max-w-[60px] sm:max-w-[80px]"
                          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                        >
                          {tag.tag_name}
                        </span>
                      );
                    })}
                    {fileTags.length > 1 && (
                      <span className="text-xs text-muted-foreground shrink-0">+{fileTags.length - 1}</span>
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
        <DropdownMenuContent align="end" className="bg-card border shadow-lg">
          <DropdownMenuItem 
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onStartRename();
            }}
          >
            <Pencil className="h-4 w-4" />
            Rename
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
  isRenaming,
  onStartRename,
  onCancelRename,
  onSaveRename,
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
  isRenaming: boolean;
  onStartRename: () => void;
  onCancelRename: () => void;
  onSaveRename: (name: string) => void;
  onSelect: () => void;
  onDelete?: (id: string) => void;
  onTagsChange?: (id: string, tags: string[]) => void;
  onDeleteTag?: (id: string) => void;
  onCreateTag?: () => void;
}) {
  const navigate = useNavigate();
  const [renameValue, setRenameValue] = useState(item.name);
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
    if (isRenaming) return;
    if (bulkMode) {
      onSelect();
    } else if (isFolder) {
      navigate(`/projects/${projectId}/folder/${item.id}`);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (renameValue.trim()) {
        onSaveRename(renameValue.trim());
      } else {
        onCancelRename();
      }
    } else if (e.key === 'Escape') {
      setRenameValue(item.name);
      onCancelRename();
    }
  };

  const handleRenameBlur = () => {
    if (renameValue.trim() && renameValue !== item.name) {
      onSaveRename(renameValue.trim());
    } else {
      setRenameValue(item.name);
      onCancelRename();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:border-primary',
        isDragging && 'rotate-2 scale-105 shadow-lg',
        isFolder && 'bg-amber-50/50 dark:bg-card dark:border-border/50',
        isSelected && 'border-primary ring-2 ring-primary/20'
      )}
    >
      {/* Thumbnail Preview - Show for files with preview_url */}
      {!isFolder && (item as File).preview_url && (
        <div className="relative h-32 w-full bg-secondary">
          <img
            src={(item as File).preview_url!}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      {!isFolder && !(item as File).preview_url && (item as File).status === 'processing' && (
        <div className="relative h-32 w-full bg-secondary">
          <div className="shimmer h-full w-full" />
          {/* Progress Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3">
            <FileProgress progress={(item as File).progress || 0} status={(item as File).status} />
          </div>
        </div>
      )}

      <div className="p-3">
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
        
        <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
          {isRenaming ? (
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameBlur}
              className="h-7 text-sm font-medium"
              autoFocus
            />
          ) : (
            <h4 className="truncate text-sm font-medium text-card-foreground">{item.name}</h4>
          )}
          
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
            <DropdownMenuItem 
              className="gap-2"
              onClick={() => onStartRename()}
            >
              <Pencil className="h-4 w-4" />
              Rename
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
    </div>
  );
}
