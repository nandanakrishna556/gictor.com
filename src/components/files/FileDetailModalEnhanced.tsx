import React, { useState } from 'react';
import { X, Download, Loader2, RefreshCw, AlertCircle, Copy, Image, FileText, Link2, Wand2, CircleUser } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoPlayer } from '@/components/ui/video-player';
import { ScriptViewer } from '@/components/ui/script-viewer';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface FileDetailModalEnhancedProps {
  file: {
    id: string;
    name: string;
    file_type: string;
    status: string;
    generation_status?: string | null;
    preview_url?: string | null;
    download_url?: string | null;
    error_message?: string | null;
    metadata?: Json;
    generation_params?: Json;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

const fileTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  first_frame: Image,
  lip_sync: Wand2,
  talking_head: CircleUser,
  speech: FileText,
  script: FileText,
};

const fileTypeLabels: Record<string, string> = {
  first_frame: 'First Frame',
  lip_sync: 'Lip Sync',
  talking_head: 'Lip Sync', // backward compatibility
  speech: 'Speech',
  script: 'Script',
};

export const FileDetailModalEnhanced: React.FC<FileDetailModalEnhancedProps> = ({ 
  file, 
  isOpen, 
  onClose, 
  onRetry 
}) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  if (!file) return null;

  const metadata = file.metadata as Record<string, any> | null;
  const generationParams = file.generation_params as Record<string, any> | null;

  const handleDownload = async () => {
    if (!file.download_url && !file.preview_url) return;
    setIsDownloading(true);
    try {
      const url = file.download_url || file.preview_url!;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const ext = file.file_type === 'talking_head' ? 'mp4' : file.file_type === 'script' ? 'txt' : 'jpg';
      a.download = `${file.name}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast({
        title: 'Download started',
        description: `Downloading ${file.name}`,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download the file',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!file.preview_url) return;
    setIsCopying(true);
    try {
      const response = await fetch(file.preview_url);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      toast({
        title: 'Copied!',
        description: 'Image copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy image. Try Copy URL instead.',
        variant: 'destructive',
      });
    } finally {
      setIsCopying(false);
    }
  };

  const handleCopyUrl = async () => {
    const url = file.preview_url || file.download_url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'URL Copied',
        description: 'Image URL copied to clipboard',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy URL',
        variant: 'destructive',
      });
    }
  };

  const FileIcon = fileTypeIcons[file.file_type] || Image;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Left Panel - Generation Inputs */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-secondary/30 p-4 md:p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Generation Details</h3>
            </div>

            <div className="space-y-4">
              {/* File Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {fileTypeLabels[file.file_type] || file.file_type}
                </Badge>
              </div>

              {/* Generation Parameters */}
              {generationParams && Object.keys(generationParams).length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground">Parameters</h4>
                  <div className="space-y-2 text-sm">
                    {generationParams.prompt && (
                      <div>
                        <span className="text-muted-foreground">Prompt</span>
                        <p className="mt-1 text-foreground bg-background rounded-md p-2 text-xs">
                          {generationParams.prompt}
                        </p>
                      </div>
                    )}
                    {generationParams.aspect_ratio && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aspect Ratio</span>
                        <span>{generationParams.aspect_ratio}</span>
                      </div>
                    )}
                    {generationParams.image_type && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Style</span>
                        <span className="capitalize">{generationParams.image_type}</span>
                      </div>
                    )}
                    {generationParams.resolution && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolution</span>
                        <span>{generationParams.resolution}</span>
                      </div>
                    )}
                    {generationParams.location && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span>{generationParams.location}</span>
                      </div>
                    )}
                    {generationParams.character && (
                      <div>
                        <span className="text-muted-foreground">Character</span>
                        <p className="mt-1 text-foreground">{generationParams.character}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {metadata && Object.keys(metadata).length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground">Metadata</h4>
                  <div className="space-y-2 text-sm">
                    {metadata.aspect_ratio && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Output Ratio</span>
                        <span>{metadata.aspect_ratio}</span>
                      </div>
                    )}
                    {metadata.resolution && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Output Resolution</span>
                        <span>{metadata.resolution}</span>
                      </div>
                    )}
                    {metadata.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{metadata.duration}s</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header - Single close button */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Preview</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {/* Processing State */}
              {file.generation_status === 'processing' && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <h3 className="text-lg font-medium">Generating...</h3>
                  <p className="text-muted-foreground">This usually takes 10-60 seconds</p>
                </div>
              )}

              {/* Failed State */}
              {file.generation_status === 'failed' && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
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

              {/* Completed - Image */}
              {file.generation_status === 'completed' && file.file_type === 'first_frame' && file.preview_url && (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden border bg-secondary/30">
                    <img 
                      src={file.preview_url} 
                      alt={file.name} 
                      className="w-full h-auto max-h-[60vh] object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Completed - Video */}
              {file.generation_status === 'completed' && file.file_type === 'talking_head' && file.preview_url && (
                <div className="space-y-4">
                  <VideoPlayer src={file.preview_url} title={file.name} />
                </div>
              )}

              {/* Completed - Script */}
              {file.generation_status === 'completed' && file.file_type === 'script' && metadata?.script_content && (
                <ScriptViewer 
                  scriptContent={metadata.script_content} 
                  metadata={metadata}
                  title={file.name}
                />
              )}
            </div>

            {/* Actions */}
            {(file.preview_url || file.download_url) && (
              <div className="flex flex-wrap gap-2 p-4 border-t border-border">
                <Button onClick={handleDownload} disabled={isDownloading} className="gap-2">
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download
                </Button>
                {file.file_type === 'first_frame' && (
                  <>
                    <Button variant="outline" onClick={handleCopy} disabled={isCopying} className="gap-2">
                      {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      Copy Image
                    </Button>
                    <Button variant="outline" onClick={handleCopyUrl} className="gap-2">
                      <Link2 className="h-4 w-4" />
                      Copy URL
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
