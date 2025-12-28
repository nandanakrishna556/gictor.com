import React, { useState, useCallback, useId } from 'react';
import { uploadToR2, validateFile, UploadOptions } from '@/lib/cloudflare-upload';
import { X, Loader2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SingleImageUploadProps {
  /** Current image URL value */
  value?: string;
  /** Callback when URL changes */
  onChange: (url: string | undefined) => void;
  /** Optional click handler for "generate" link */
  onGenerateClick?: () => void;
  /** Optional subfolder in R2 bucket */
  folder?: string;
  /** Custom max file size in bytes */
  maxSize?: number;
  /** Custom allowed MIME types */
  allowedTypes?: string[];
  /** Additional CSS classes */
  className?: string;
  /** Aspect ratio class for the container */
  aspectRatio?: 'video' | 'square' | 'auto';
  /** Placeholder text */
  placeholder?: string;
  /** Show "or generate one" link */
  showGenerateLink?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export const SingleImageUpload: React.FC<SingleImageUploadProps> = ({
  value,
  onChange,
  onGenerateClick,
  folder = 'uploads',
  maxSize,
  allowedTypes,
  className,
  aspectRatio = 'video',
  placeholder = 'Drag & drop image or',
  showGenerateLink = true,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  const uploadOptions: UploadOptions = { folder, maxSize, allowedTypes };

  const aspectRatioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    auto: '',
  }[aspectRatio];

  const handleUpload = async (file: File) => {
    if (disabled) return;

    const validation = validateFile(file, uploadOptions);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      const url = await uploadToR2(file, uploadOptions);
      onChange(url);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setPreview(null);
      onChange(undefined);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [disabled]);

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onChange(undefined);
    setError(null);
  };

  const displayImage = value || preview;

  return (
    <div className={cn('space-y-2', className)}>
      {displayImage ? (
        <div className="relative group">
          <div className={cn('overflow-hidden rounded-xl bg-secondary', aspectRatioClass)}>
            <img
              src={displayImage}
              alt="Uploaded image"
              className="h-full w-full object-contain"
            />
            
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
          
          {!isUploading && !disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -left-2 -top-2 z-10 rounded-full bg-foreground/80 p-1.5 text-background backdrop-blur transition-all duration-200 hover:bg-foreground opacity-0 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onClick={() => !disabled && document.getElementById(inputId)?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200',
            aspectRatioClass,
            disabled
              ? 'cursor-not-allowed border-muted bg-muted/50'
              : isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-secondary/50',
            error && 'border-destructive bg-destructive/5'
          )}
        >
          <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {placeholder} <span className="font-medium text-primary">browse</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            JPG, PNG, WebP • Max {Math.round((maxSize || 10 * 1024 * 1024) / 1024 / 1024)}MB
          </p>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled}
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </div>
      )}
      
      {error && (
        <div className="flex items-center justify-between text-sm text-destructive">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => document.getElementById(inputId)?.click()}
            className="inline-flex items-center gap-1 text-destructive hover:text-destructive/80"
          >
            <RefreshCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      )}
      
      {onGenerateClick && !displayImage && showGenerateLink && !disabled && (
        <button
          type="button"
          onClick={onGenerateClick}
          className="text-sm text-primary hover:underline"
        >
          or generate one →
        </button>
      )}
    </div>
  );
};

export const useSingleImageUploadStatus = (value?: string, isUploading?: boolean) => ({
  hasImage: !!value,
  isReady: !!value && !isUploading,
});
