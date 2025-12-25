import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image,
  Video,
  FileText,
  Download,
  MoreHorizontal,
  Trash2,
  Copy,
  Plus,
  Archive,
  Folder,
  GripVertical,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import type { File, Folder as FolderType } from '@/hooks/useFiles';

interface FileGridProps {
  files: File[];
  folders: FolderType[];
  projectId: string;
  viewMode: 'grid' | 'kanban';
  onCreateNew?: () => void;
  onDeleteFile?: (id: string) => void;
  onDeleteFolder?: (id: string) => void;
  onUpdateFileStatus?: (id: string, status: string) => void;
}

const fileTypeLabels = {
  first_frame: 'First Frame',
  talking_head: 'Talking Head',
  script: 'Script',
};

const statusOptions = [
  { value: 'processing', label: 'Processing', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-500' },
  { value: 'review', label: 'Review', color: 'bg-blue-500' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-500' },
];

const pipelines = [
  { id: 'default', name: 'Default Pipeline', statuses: ['processing', 'completed', 'failed'] },
  { id: 'review', name: 'Review Pipeline', statuses: ['processing', 'review', 'approved', 'completed'] },
];

export default function FileGrid({
  files,
  folders,
  projectId,
  viewMode,
  onCreateNew,
  onDeleteFile,
  onDeleteFolder,
  onUpdateFileStatus,
}: FileGridProps) {
  const navigate = useNavigate();
  const [selectedPipeline, setSelectedPipeline] = useState(pipelines[0]);

  if (viewMode === 'kanban') {
    return (
      <div className="space-y-4">
        {/* Pipeline Selector */}
        <div className="flex items-center gap-3">
          <Select
            value={selectedPipeline.id}
            onValueChange={(id) => setSelectedPipeline(pipelines.find(p => p.id === id) || pipelines[0])}
          >
            <SelectTrigger className="w-48 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {selectedPipeline.statuses.map((status) => {
            const statusConfig = statusOptions.find(s => s.value === status);
            const statusFiles = files.filter((f) => f.status === status);

            return (
              <div
                key={status}
                className="min-w-80 flex-1 rounded-2xl bg-secondary/30 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2.5 w-2.5 rounded-full', statusConfig?.color)} />
                    <h3 className="font-medium text-foreground">
                      {statusConfig?.label || status}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {statusFiles.length}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {statusFiles.map((file) => (
                    <KanbanCard
                      key={file.id}
                      file={file}
                      onDelete={onDeleteFile}
                      onStatusChange={onUpdateFileStatus}
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
          onDelete={onDeleteFile}
          onStatusChange={onUpdateFileStatus}
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
      
      <h3 className="text-base font-semibold text-card-foreground text-center px-4">{folder.name}</h3>

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
  onDelete,
  onStatusChange,
}: { 
  file: File; 
  compact?: boolean;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}) {
  const isProcessing = file.status === 'processing';
  const isFailed = file.status === 'failed';
  const currentStatus = statusOptions.find(s => s.value === file.status) || statusOptions[0];

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
          <h3 className="truncate font-medium text-card-foreground">
            {file.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'text-xs',
              file.file_type === 'first_frame' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              file.file_type === 'talking_head' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
              file.file_type === 'script' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            )}
          >
            {fileTypeLabels[file.file_type]}
          </Badge>
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
              <div className={cn('h-2 w-2 rounded-full', currentStatus.color)} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
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
  onDelete,
  onStatusChange,
}: { 
  file: File;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}) {
  const currentStatus = statusOptions.find(s => s.value === file.status) || statusOptions[0];

  return (
    <div className="group rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:border-primary hover:scale-[1.01]">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-card-foreground">{file.name}</h4>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                file.file_type === 'first_frame' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                file.file_type === 'talking_head' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                file.file_type === 'script' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              )}
            >
              {fileTypeLabels[file.file_type]}
            </Badge>
          </div>
          
          {/* Status Selector */}
          <div className="mt-2">
            <Select
              value={file.status || 'processing'}
              onValueChange={(value) => onStatusChange?.(file.id, value)}
            >
              <SelectTrigger className="h-6 w-full rounded-md text-xs">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', currentStatus.color)} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
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
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-1 opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
