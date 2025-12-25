import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Image,
  Video,
  FileText,
  Download,
  MoreHorizontal,
  Trash2,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { File, Folder } from '@/hooks/useFiles';

interface FileGridProps {
  files: File[];
  folders: Folder[];
  projectId: string;
  viewMode: 'grid' | 'kanban';
}

const fileTypeIcons = {
  first_frame: Image,
  talking_head: Video,
  script: FileText,
};

const fileTypeLabels = {
  first_frame: 'First Frame',
  talking_head: 'Talking Head',
  script: 'Script',
};

export default function FileGrid({
  files,
  folders,
  projectId,
  viewMode,
}: FileGridProps) {
  const navigate = useNavigate();

  if (viewMode === 'kanban') {
    const statuses = ['processing', 'completed', 'failed'];
    const statusLabels = {
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
    };

    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <div
            key={status}
            className="min-w-72 flex-1 rounded-2xl bg-secondary/50 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-foreground">
                {statusLabels[status as keyof typeof statusLabels]}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {files.filter((f) => f.status === status).length}
              </Badge>
            </div>
            <div className="space-y-3">
              {files
                .filter((f) => f.status === status)
                .map((file) => (
                  <FileCard key={file.id} file={file} compact />
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {folders.map((folder) => (
        <div
          key={folder.id}
          onClick={() => navigate(`/projects/${projectId}/folder/${folder.id}`)}
          className="group relative cursor-pointer rounded-2xl border border-border bg-card p-6 shadow-apple transition-apple hover-lift"
        >
          <div className="mb-6 flex aspect-[4/3] items-center justify-center rounded-xl bg-primary/10">
            <FolderOpen className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">{folder.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">Folder</p>
        </div>
      ))}

      {files.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}

function FileCard({ file, compact = false }: { file: File; compact?: boolean }) {
  const Icon = fileTypeIcons[file.file_type];
  const isProcessing = file.status === 'processing';
  const isFailed = file.status === 'failed';

  return (
    <div
      className={cn(
        'group relative cursor-pointer rounded-2xl border bg-card shadow-apple transition-apple hover-lift',
        isProcessing && 'animate-pulse-subtle',
        isFailed && 'border-destructive/50',
        compact ? 'p-4' : 'border-border p-6'
      )}
    >
      {/* Preview */}
      <div
        className={cn(
          'mb-5 flex items-center justify-center rounded-xl bg-secondary',
          compact ? 'h-24' : 'aspect-[4/5]'
        )}
      >
        {file.preview_url ? (
          <img
            src={file.preview_url}
            alt={file.name}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : isProcessing ? (
          <div className="shimmer h-full w-full rounded-xl" />
        ) : (
          <Icon className="h-10 w-10 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-card-foreground">
            {file.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                file.file_type === 'first_frame' && 'bg-blue-100 text-blue-700',
                file.file_type === 'talking_head' && 'bg-purple-100 text-purple-700',
                file.file_type === 'script' && 'bg-amber-100 text-amber-700'
              )}
            >
              {fileTypeLabels[file.file_type]}
            </Badge>
            {isProcessing && (
              <span className="text-xs text-muted-foreground">
                Generating...
              </span>
            )}
            {isFailed && (
              <span className="text-xs text-destructive">Failed</span>
            )}
          </div>
        </div>

        {file.status === 'completed' && file.download_url && (
          <a
            href={file.download_url}
            download
            className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-apple hover:bg-secondary group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute right-3 top-3 rounded-lg p-1.5 opacity-0 transition-apple hover:bg-secondary group-hover:opacity-100"
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
          <DropdownMenuItem className="gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
