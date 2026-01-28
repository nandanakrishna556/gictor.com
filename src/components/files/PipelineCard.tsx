import React from 'react';
import { Play, AlertCircle, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
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
import { StatusBadge } from '@/components/ui/status-badge';
import { GeneratingOverlay } from '@/components/ui/GeneratingOverlay';

export type PipelineStatus = 'processing' | 'completed' | 'failed';

interface PipelineCardProps {
  id: string;
  name: string;
  pipelineType: FileType;
  status: PipelineStatus;
  previewUrl?: string | null;
  thumbnailUrl?: string | null; // For showing preview while processing
  firstFrameUrl?: string | null; // First frame output URL
  lastFrameUrl?: string | null; // Last frame output URL
  errorMessage?: string | null;
  tags?: string[];
  progress?: number;
  generationStartedAt?: string | null;
  estimatedDurationSeconds?: number | null;
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
}

// Preview placeholder for different pipeline types
const PreviewPlaceholder: React.FC<{ 
  pipelineType: FileType; 
  label?: string;
  firstFrameUrl?: string | null;
  lastFrameUrl?: string | null;
}> = ({ pipelineType, label, firstFrameUrl, lastFrameUrl }) => {
  // For B-Roll types, prefer last frame, then first frame
  const thumbnailUrl = (pipelineType === 'clips' || pipelineType === 'b_roll') 
    ? (lastFrameUrl || firstFrameUrl) 
    : firstFrameUrl;
  
  if (thumbnailUrl) {
    return (
      <img 
        src={thumbnailUrl} 
        alt="Thumbnail" 
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }

  const displayLabel = label || `${getFileTypeLabel(pipelineType)} Ready`;
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
      <FileTypeIcon fileType={pipelineType} size="lg" className="h-12 w-12 opacity-50" />
      <span className="text-sm text-muted-foreground">{displayLabel}</span>
    </div>
  );
};

// Processing state with optional thumbnail - uses GeneratingOverlay for smart progress
const ProcessingPreview: React.FC<{ 
  thumbnailUrl?: string | null;
  pipelineType: FileType;
  generationStartedAt?: string | null;
  estimatedDurationSeconds?: number | null;
}> = ({ thumbnailUrl, pipelineType, generationStartedAt, estimatedDurationSeconds }) => {
  const showThumbnail = thumbnailUrl && (pipelineType === 'talking_head' || pipelineType === 'clips' || pipelineType === 'b_roll');
  
  const getGeneratingLabel = () => {
    switch (pipelineType) {
      case 'talking_head': return 'Generating video...';
      case 'clips': return 'Generating B-Roll...';
      case 'b_roll': return 'Generating B-Roll...';
      case 'first_frame': return 'Generating image...';
      case 'speech': return 'Generating audio...';
      case 'script': return 'Writing script...';
      default: return 'Generating...';
    }
  };

  return (
    <div className="absolute inset-0">
      {showThumbnail && (
        <img 
          src={thumbnailUrl} 
          alt="Processing thumbnail" 
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
      )}
      <GeneratingOverlay
        status="processing"
        generationStartedAt={generationStartedAt}
        estimatedDurationSeconds={estimatedDurationSeconds}
        label={getGeneratingLabel()}
      />
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
          <Play className="h-6 w-6 text-primary-foreground ml-0.5" strokeWidth={1.5} />
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
      <AlertCircle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
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
  firstFrameUrl,
  lastFrameUrl,
  errorMessage, 
  tags = [],
  generationStartedAt,
  estimatedDurationSeconds,
  onClick, 
  onDelete, 
  onRename 
}) => {
  const isVideo = pipelineType === 'talking_head' || pipelineType === 'clips' || pipelineType === 'b_roll';
  const isImage = pipelineType === 'first_frame';
  const hasPreview = status === 'completed' && previewUrl;
  
  // Determine thumbnail based on pipeline type
  const effectiveThumbnailUrl = thumbnailUrl || (
    (pipelineType === 'clips' || pipelineType === 'b_roll') 
      ? (lastFrameUrl || firstFrameUrl) 
      : firstFrameUrl
  );

  const renderPreview = () => {
    // Failed state
    if (status === 'failed') {
      return <FailedPreview errorMessage={errorMessage} />;
    }

    // Processing state
    if (status === 'processing') {
      return (
        <ProcessingPreview 
          thumbnailUrl={effectiveThumbnailUrl} 
          pipelineType={pipelineType}
          generationStartedAt={generationStartedAt}
          estimatedDurationSeconds={estimatedDurationSeconds}
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

    // Completed but no preview (fallback placeholder - use first/last frame as thumbnail)
    return <PreviewPlaceholder pipelineType={pipelineType} firstFrameUrl={firstFrameUrl} lastFrameUrl={lastFrameUrl} />;
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
                <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover" onClick={(e) => e.stopPropagation()}>
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
