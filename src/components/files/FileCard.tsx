import React from 'react';
import { Play, AlertCircle, MoreHorizontal, Trash2, Pencil, FileText, Mic } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileTypeIcon, FileType } from '@/components/ui/file-type-icon';
import { StatusBadge } from '@/components/ui/status-badge';
import { GeneratingOverlay } from '@/components/ui/GeneratingOverlay';

interface FileCardProps {
  id: string;
  name: string;
  fileType: FileType;
  status: 'processing' | 'completed' | 'failed';
  previewUrl?: string | null;
  errorMessage?: string | null;
  tags?: string[];
  generationStartedAt?: string | null;
  estimatedDurationSeconds?: number | null;
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
}

// Video file types that should show video preview
const VIDEO_FILE_TYPES = ['lip_sync', 'talking_head', 'clips', 'b_roll', 'veo3', 'motion_graphics'];

// Audio file types
const AUDIO_FILE_TYPES = ['speech', 'audio', 'voice'];

const getGeneratingLabel = (fileType: string) => {
  switch (fileType) {
    case 'lip_sync': 
    case 'talking_head':
      return 'Generating video...';
    case 'speech': 
    case 'audio':
      return 'Generating audio...';
    case 'first_frame': 
      return 'Generating image...';
    case 'script': 
      return 'Writing script...';
    case 'b_roll':
    case 'clips':
      return 'Generating B-Roll...';
    case 'motion_graphics':
      return 'Generating Motion Graphics...';
    default: 
      return 'Generating...';
  }
};

export const FileCard: React.FC<FileCardProps> = ({ 
  id, 
  name, 
  fileType, 
  status, 
  previewUrl, 
  errorMessage, 
  tags = [], 
  generationStartedAt,
  estimatedDurationSeconds,
  onClick, 
  onDelete, 
  onRename 
}) => {
  const isVideoType = VIDEO_FILE_TYPES.includes(fileType);
  const isAudioType = AUDIO_FILE_TYPES.includes(fileType);
  const hasVideoThumbnail = isVideoType && previewUrl;

  return (
    <div 
      className={cn(
        "group relative rounded-lg border bg-card overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
        status === 'failed' && "border-destructive/30"
      )}
      onClick={onClick}
    >
      {/* Preview area */}
      <div className="aspect-video bg-muted relative overflow-hidden">
        {status === 'processing' && (
          <GeneratingOverlay
            status={status}
            generationStartedAt={generationStartedAt ?? null}
            estimatedDurationSeconds={estimatedDurationSeconds ?? null}
            label={getGeneratingLabel(fileType)}
          />
        )}

        {status === 'completed' && previewUrl && fileType === 'first_frame' && (
          <img 
            src={previewUrl} 
            alt={name} 
            className="w-full h-full object-cover opacity-0"
            onLoad={(e) => {
              e.currentTarget.classList.remove('opacity-0');
              e.currentTarget.classList.add('animate-image-fade-in');
            }}
          />
        )}

        {status === 'completed' && hasVideoThumbnail && (
          <div className="relative w-full h-full pointer-events-none">
            <video 
              src={`${previewUrl}#t=0.1`}
              className="w-full h-full object-contain opacity-0"
              muted
              playsInline
              preload="metadata"
              onLoadedData={(e) => {
                e.currentTarget.classList.remove('opacity-0');
                e.currentTarget.classList.add('animate-image-fade-in');
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-foreground/10">
              <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                <Play className="h-6 w-6 text-primary-foreground ml-0.5" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        )}

        {status === 'completed' && fileType === 'script' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
            <FileText className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">Script Ready</span>
          </div>
        )}

        {status === 'completed' && isAudioType && (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Mic className="h-8 w-8 text-orange-500" strokeWidth={1.5} />
            </div>
          </div>
        )}

        {status === 'completed' && !hasVideoThumbnail && isVideoType && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
            <FileTypeIcon fileType={fileType} size="lg" className="h-12 w-12 opacity-50" />
            <span className="text-sm text-muted-foreground">Video Ready</span>
          </div>
        )}

        {status === 'failed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/5 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
            <span className="text-sm text-destructive text-center line-clamp-2">
              {errorMessage || 'Generation failed'}
            </span>
            <span className="text-xs text-muted-foreground">Credits refunded</span>
          </div>
        )}

        {/* Actions menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onRename}>
                <Pencil className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info section */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileTypeIcon fileType={fileType} />
            <span className="text-sm font-medium truncate">{name}</span>
          </div>
          <StatusBadge status={status} />
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
