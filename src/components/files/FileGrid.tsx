import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  MoreHorizontal,
  Trash2,
  Copy,
  Plus,
  Archive,
  GripVertical,
  Tag,
  X,
} from 'lucide-react';
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
  onDeleteFile?: (id: string) => void;
  onDeleteFolder?: (id: string) => void;
  onUpdateFileStatus?: (id: string, status: string) => void;
  onUpdateFileTags?: (id: string, tags: string[]) => void;
}

const fileTypeLabels: Record<string, string> = {
  first_frame: 'First Frame',
  talking_head: 'Talking Head',
  script: 'Script',
};

const defaultStatusOptions = [
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
];

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
  onDeleteFile,
  onDeleteFolder,
  onUpdateFileStatus,
  onUpdateFileTags,
}: FileGridProps) {
  const navigate = useNavigate();

  const currentPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages: PipelineStage[] = currentPipeline?.stages || [
    { id: 'processing', name: 'Processing', color: 'bg-amber-500' },
    { id: 'completed', name: 'Completed', color: 'bg-green-500' },
    { id: 'failed', name: 'Failed', color: 'bg-red-500' },
  ];

  if (viewMode === 'kanban') {
    return (
      <div className="space-y-4">
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
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageFiles = files.filter((f) => f.status === stage.id);

            return (
              <div
                key={stage.id}
                className="min-w-80 flex-1 rounded-2xl bg-secondary/30 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2.5 w-2.5 rounded-full', stage.color)} />
                    <h3 className="font-medium text-foreground">{stage.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageFiles.length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {stageFiles.map((file) => (
                    <KanbanCard
                      key={file.id}
                      file={file}
                      stages={stages}
                      tags={tags}
                      onDelete={onDeleteFile}
                      onStatusChange={onUpdateFileStatus}
                      onTagsChange={onUpdateFileTags}
                    />
                  ))}

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
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Create New Card - First item */}
      {onCreateNew && (
        <button
          onClick={onCreateNew}
          className="group relative flex aspect-[2/3] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:scale-[1.02]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-all duration-200 group-hover:bg-primary/20">
            <Plus className="h-7 w-7 text-primary" />
          </div>
          <span className="mt-4 text-base font-medium text-muted-foreground transition-all duration-200 group-hover:text-primary">
            Create new
          </span>
        </button>
      )}

      {/* Folders */}
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          projectId={projectId}
          onDelete={onDeleteFolder}
        />
      ))}

      {/* Files */}
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          stages={stages}
          tags={tags}
          onDelete={onDeleteFile}
          onStatusChange={onUpdateFileStatus}
          onTagsChange={onUpdateFileTags}
        />
      ))}
    </div>
  );
}

function FolderCard({
  folder,
  projectId,
  onDelete,
}: {
  folder: FolderType;
  projectId: string;
  onDelete?: (id: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${projectId}/folder/${folder.id}`)}
      className="group relative flex aspect-[2/3] cursor-pointer flex-col items-center justify-center rounded-2xl border border-border bg-amber-50/50 transition-all duration-200 hover:border-primary hover:scale-[1.02] dark:bg-amber-950/20"
    >
      {/* Apple-inspired Folder Icon */}
      <div className="relative mb-4">
        <svg
          width="80"
          height="64"
          viewBox="0 0 80 64"
          fill="none"
          className="text-amber-400 dark:text-amber-500"
        >
          {/* Folder back */}
          <path
            d="M4 12C4 7.58172 7.58172 4 12 4H28L34 12H68C72.4183 12 76 15.5817 76 20V52C76 56.4183 72.4183 60 68 60H12C7.58172 60 4 56.4183 4 52V12Z"
            fill="currentColor"
            opacity="0.3"
          />
          {/* Folder front */}
          <path
            d="M4 20C4 15.5817 7.58172 12 12 12H68C72.4183 12 76 15.5817 76 20V52C76 56.4183 72.4183 60 68 60H12C7.58172 60 4 56.4183 4 52V20Z"
            fill="currentColor"
          />
          {/* Folder tab */}
          <path
            d="M4 12C4 7.58172 7.58172 4 12 4H26C28.2091 4 30.2091 5.2 31.2 7.1L34 12H4V12Z"
            fill="currentColor"
            opacity="0.8"
          />
        </svg>
      </div>

      <h3 className="px-4 text-center text-base font-semibold text-card-foreground">{folder.name}</h3>

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
  compact = false,
  stages,
  tags,
  onDelete,
  onStatusChange,
  onTagsChange,
}: {
  file: File;
  compact?: boolean;
  stages: PipelineStage[];
  tags: TagType[];
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onTagsChange?: (id: string, tags: string[]) => void;
}) {
  const isProcessing = file.status === 'processing';
  const isFailed = file.status === 'failed';
  const currentStage = stages.find((s) => s.id === file.status) || defaultStatusOptions.find((s) => s.value === file.status);
  const fileTags = file.tags || [];

  const toggleTag = (tagId: string) => {
    if (fileTags.includes(tagId)) {
      onTagsChange?.(file.id, fileTags.filter((t) => t !== tagId));
    } else {
      onTagsChange?.(file.id, [...fileTags, tagId]);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer flex-col rounded-2xl border bg-card transition-all duration-200 hover:border-primary hover:scale-[1.02]',
        isProcessing && 'animate-pulse-subtle',
        isFailed && 'border-destructive/50',
        compact ? 'p-4' : 'aspect-[2/3] border-border'
      )}
    >
      {/* Preview Area */}
      <div
        className={cn(
          'flex flex-1 items-center justify-center rounded-t-2xl bg-secondary',
          compact && 'h-24 rounded-2xl'
        )}
      >
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
        <div className="flex items-start justify-between">
          <h3 className="truncate font-medium text-card-foreground">{file.name}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'text-xs',
              file.file_type === 'first_frame' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              file.file_type === 'talking_head' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
              file.file_type === 'script' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            )}
          >
            {fileTypeLabels[file.file_type] || file.file_type}
          </Badge>

          {/* File Tags */}
          {fileTags.slice(0, 2).map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className="rounded-full px-2 py-0.5 text-xs text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.tag_name}
              </span>
            );
          })}
          {fileTags.length > 2 && (
            <span className="text-xs text-muted-foreground">+{fileTags.length - 2}</span>
          )}
        </div>

        {/* Status Selector */}
        <Select
          value={file.status || 'processing'}
          onValueChange={(value) => onStatusChange?.(file.id, value)}
        >
          <SelectTrigger
            className="h-7 w-full rounded-lg text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full', currentStage?.color || 'bg-gray-500')} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
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

      {/* Download button */}
      {file.status === 'completed' && file.download_url && (
        <a
          href={file.download_url}
          download
          className="absolute bottom-16 right-3 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all duration-200 hover:bg-secondary group-hover:opacity-100"
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
          {/* Tag Assignment */}
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
  file,
  stages,
  tags,
  onDelete,
  onStatusChange,
  onTagsChange,
}: {
  file: File;
  stages: PipelineStage[];
  tags: TagType[];
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onTagsChange?: (id: string, tags: string[]) => void;
}) {
  const currentStage = stages.find((s) => s.id === file.status);
  const fileTags = file.tags || [];

  const toggleTag = (tagId: string) => {
    if (fileTags.includes(tagId)) {
      onTagsChange?.(file.id, fileTags.filter((t) => t !== tagId));
    } else {
      onTagsChange?.(file.id, [...fileTags, tagId]);
    }
  };

  return (
    <div className="group rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:border-primary hover:scale-[1.01]">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-card-foreground">{file.name}</h4>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                file.file_type === 'first_frame' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                file.file_type === 'talking_head' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                file.file_type === 'script' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              )}
            >
              {fileTypeLabels[file.file_type] || file.file_type}
            </Badge>
            {fileTags.slice(0, 1).map((tagId) => {
              const tag = tags.find((t) => t.id === tagId);
              if (!tag) return null;
              return (
                <span
                  key={tagId}
                  className="rounded-full px-2 py-0.5 text-xs text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.tag_name}
                </span>
              );
            })}
          </div>

          {/* Status Selector */}
          <div className="mt-2">
            <Select
              value={file.status || 'processing'}
              onValueChange={(value) => onStatusChange?.(file.id, value)}
            >
              <SelectTrigger className="h-6 w-full rounded-md text-xs">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', currentStage?.color || 'bg-gray-500')} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
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
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-1 opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100">
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
              onClick={() => onDelete?.(file.id)}
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
