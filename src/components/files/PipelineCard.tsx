import React from 'react';
import { Loader2, Play, AlertCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileTypeIcon, FileType, getFileTypeLabel } from '@/components/ui/file-type-icon';
import { StatusBadge, StatusType } from '@/components/ui/status-badge';

export type PipelineStatus = 'processing' | 'completed' | 'failed';

interface PipelineCardProps {
  id: string;
  name: string;
  pipelineType: FileType;
  status: PipelineStatus;
  previewUrl?: string | null;
  thumbnailUrl?: string | null; // For showing preview while processing
  errorMessage?: string | null;
  tags?: string[];
  progress?: number;
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
}

// Preview placeholder for different pipeline types
const PreviewPlaceholder: React.FC<{ 
  pipelineType: FileType; 
  label?: string;
}> = ({ pipelineType, label }) => {
  const displayLabel = label || `${getFileTypeLabel(pipelineType)} Ready`;
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
      <FileTypeIcon fileType={pipelineType} size="lg" className="h-12 w-12 opacity-50" />
      <span className="text-sm text-muted-foreground">{displayLabel}</span>
    </div>
  );
};

// Processing state with optional thumbnail
const ProcessingPreview: React.FC<{ 
  thumbnailUrl?: string | null;
  pipelineType: FileType;
  progress?: number;
}> = ({ thumbnailUrl, pipelineType, progress }) => {
  const showThumbnail = thumbnailUrl && (pipelineType === 'talking_head' || pipelineType === 'clips' || pipelineType === 'b_roll');
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
      {showThumbnail ? (
        <>
          <img 
            src={thumbnailUrl} 
            alt="Processing thumbnail" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Generating{progress ? ` ${progress}%` : '...'}
            </span>
          </div>
        </>
      ) : (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Generating{progress ? ` ${progress}%` : '...'}
          </span>
        </>
      )}
    </div>
  );
};

// Video preview with hover play
const VideoPreview: React.FC<{ 
  previewUrl: string; 
  name: string;
}> = ({ previewUrl, name }) => {
  return (
    <div className="relative w-full h-full">
      <video 
        src={previewUrl} 
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
        onMouseEnter={(e) => e.currentTarget.play()}
        onMouseLeave={(e) => {
          e.currentTarget.pause();
          e.currentTarget.currentTime = 0;
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
          <Play className="h-6 w-6 text-primary-foreground ml-0.5" />
        </div>
      </div>
    </div>
  );
};

// Image preview
const ImagePreview: React.FC<{ 
  previewUrl: string; 
  name: string;
}> = ({ previewUrl, name }) => {
  return (
    <img 
      src={previewUrl} 
      alt={name} 
      className="w-full h-full object-cover"
    />
  );
};

// Failed state
const FailedPreview: React.FC<{ 
  errorMessage?: string | null;
}> = ({ errorMessage }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/5 p-4">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <span className="text-sm text-destructive text-center line-clamp-2">
        {errorMessage || 'Generation failed'}
      </span>
      <span className="text-xs text-muted-foreground">Credits refunded</span>
    </div>
  );
};

// Main card component
export const PipelineCard: React.FC<PipelineCardProps> = ({ 
  id, 
  name, 
  pipelineType, 
  status, 
  previewUrl, 
  thumbnailUrl,
  errorMessage, 
  tags = [],
  progress,
  onClick, 
  onDelete, 
  onRename 
}) => {
  const isVideo = pipelineType === 'talking_head' || pipelineType === 'clips' || pipelineType === 'b_roll';
  const isImage = pipelineType === 'first_frame';
  const hasPreview = status === 'completed' && previewUrl;

  const renderPreview = () => {
    // Failed state
    if (status === 'failed') {
      return <FailedPreview errorMessage={errorMessage} />;
    }

    // Processing state
    if (status === 'processing') {
      return (
        <ProcessingPreview 
          thumbnailUrl={thumbnailUrl} 
          pipelineType={pipelineType}
          progress={progress}
        />
      );
    }

    // Completed state with preview
    if (hasPreview) {
      if (isVideo) {
        return <VideoPreview previewUrl={previewUrl} name={name} />;
      }
      if (isImage) {
        return <ImagePreview previewUrl={previewUrl} name={name} />;
      }
    }

    // Completed but no preview (fallback placeholder)
    return <PreviewPlaceholder pipelineType={pipelineType} />;
  };

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
        {renderPreview()}

        {/* Actions menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onRename}>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
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
            <FileTypeIcon fileType={pipelineType} />
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
