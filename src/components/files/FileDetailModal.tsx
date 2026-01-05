import React, { useState } from 'react';
import { X, Download, Loader2, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/components/ui/video-player';
import { ScriptViewer } from '@/components/ui/script-viewer';

interface FileDetailModalProps {
  file: {
    id: string;
    name: string;
    file_type: 'first_frame' | 'talking_head' | 'script';
    status: 'processing' | 'completed' | 'failed';
    preview_url?: string | null;
    download_url?: string | null;
    error_message?: string | null;
    metadata?: Record<string, any>;
  };
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export const FileDetailModal: React.FC<FileDetailModalProps> = ({ file, isOpen, onClose, onRetry }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!file.download_url) return;
    setIsDownloading(true);
    try {
      const response = await fetch(file.download_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = file.file_type === 'talking_head' ? 'mp4' : file.file_type === 'script' ? 'txt' : 'jpg';
      a.download = `${file.name}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">{file.name}</h2>
            <Badge variant="secondary" className="mt-1 capitalize">
              {file.file_type.replace('_', ' ')}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Processing State */}
        {file.status === 'processing' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-lg font-medium">Generating...</h3>
            <p className="text-muted-foreground">This usually takes 10-60 seconds</p>
          </div>
        )}

        {/* Failed State */}
        {file.status === 'failed' && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium">Generation Failed</h3>
            <p className="text-muted-foreground text-center">{file.error_message || 'An error occurred'}</p>
            <p className="text-sm text-green-600">✓ Credits have been refunded</p>
            {onRetry && (
              <Button onClick={onRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        )}

        {/* First Frame Completed */}
        {file.status === 'completed' && file.file_type === 'first_frame' && file.preview_url && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border">
              <img 
                src={file.preview_url} 
                alt={file.name} 
                className="w-full h-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDownload} disabled={isDownloading} className="gap-2">
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download Image
              </Button>
              <Button variant="outline" asChild>
                <a href={file.preview_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Talking Head Completed */}
        {file.status === 'completed' && file.file_type === 'talking_head' && file.preview_url && (
          <div className="space-y-4">
            <VideoPlayer src={file.preview_url} title={file.name} />
            <Button onClick={handleDownload} disabled={isDownloading} className="gap-2">
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download Video
            </Button>
          </div>
        )}

        {/* Script Completed */}
        {file.status === 'completed' && file.file_type === 'script' && file.metadata?.script_content && (
          <ScriptViewer 
            scriptContent={file.metadata.script_content} 
            metadata={file.metadata}
            title={file.name}
          />
        )}

        {/* Generation Details */}
        {file.metadata && file.file_type !== 'script' && Object.keys(file.metadata).length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Generation Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {file.metadata.aspect_ratio && (
                <>
                  <span className="text-muted-foreground">Aspect Ratio</span>
                  <span>{file.metadata.aspect_ratio}</span>
                </>
              )}
              {file.metadata.image_type && (
                <>
                  <span className="text-muted-foreground">Style</span>
                  <span className="capitalize">{file.metadata.image_type}</span>
                </>
              )}
              {file.metadata.resolution && (
                <>
                  <span className="text-muted-foreground">Resolution</span>
                  <span>{file.metadata.resolution}</span>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
