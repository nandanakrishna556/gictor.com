import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Play, AlertCircle, MoreHorizontal, Trash2, Pencil, FileText, Film, Mic, Video, Download } from 'lucide-react';
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

interface FileCardProps {
  id: string;
  name: string;
  fileType: FileType;
  status: 'processing' | 'completed' | 'failed';
  previewUrl?: string | null;
  downloadUrl?: string | null;
  generationParams?: { image_url?: string } | null;
  errorMessage?: string | null;
  tags?: string[];
  onClick: () => void;
  onDelete: () => void;
  onRename: () => void;
}

// Video file types that should show video preview
const VIDEO_FILE_TYPES = ['talking_head', 'clips', 'b_roll', 'lip_sync', 'veo3'];

// Audio file types
const AUDIO_FILE_TYPES = ['audio', 'voice'];

export const FileCard: React.FC<FileCardProps> = ({ 
  id, 
  name, 
  fileType, 
  status, 
  previewUrl, 
  downloadUrl,
  generationParams,
  errorMessage, 
  tags = [], 
  onClick, 
  onDelete, 
  onRename 
}) => {
  const isVideoType = VIDEO_FILE_TYPES.includes(fileType);
  const isAudioType = AUDIO_FILE_TYPES.includes(fileType);
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle hover preview for videos
  useEffect(() => {
    if (isHovering && videoRef.current && downloadUrl) {
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovering, downloadUrl]);

  // Get poster image from preview URL or generation params
  const posterImage = previewUrl || generationParams?.image_url;

  return (
    <div 
      className={cn(
        "group relative rounded-lg border bg-card overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
        status === 'failed' && "border-destructive/30"
      )}
      onClick={onClick}
    >
      {/* Preview area */}
      <div 
        className="aspect-square bg-muted relative overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {status === 'processing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">Generating...</span>
          </div>
        )}

        {status === 'completed' && previewUrl && fileType === 'first_frame' && (
          <img 
            src={previewUrl} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        )}

        {status === 'completed' && downloadUrl && isVideoType && (
          <>
            <video 
              ref={videoRef}
              src={downloadUrl} 
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              poster={posterImage || undefined}
            />
            {!isHovering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" strokeWidth={1.5} />
                </div>
              </div>
            )}
          </>
        )}

        {status === 'completed' && !downloadUrl && isVideoType && posterImage && (
          <img 
            src={posterImage} 
            alt={name}
            className="w-full h-full object-cover"
          />
        )}

        {status === 'completed' && fileType === 'script' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
            <FileText className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">Script Ready</span>
          </div>
        )}

        {status === 'completed' && isAudioType && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
            <Mic className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
            <span className="text-sm text-muted-foreground">Audio Ready</span>
          </div>
        )}

        {status === 'completed' && !downloadUrl && !posterImage && isVideoType && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted">
            <Video className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
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

        {/* Download button */}
        {downloadUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(downloadUrl, '_blank');
            }}
            className="absolute bottom-2 right-2 p-1.5 rounded-md bg-background/80 hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
          >
            <Download className="h-4 w-4" strokeWidth={1.5} />
          </button>
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
