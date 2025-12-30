import React, { useState, useCallback, useId } from 'react';
import { uploadToR2, validateFile, UploadOptions } from '@/lib/cloudflare-upload';
import { X, Upload, Loader2, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url?: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface ImageUploadProps {
  /** Maximum number of images allowed */
  maxFiles?: number;
  /** Callback when uploaded URLs change */
  onImagesChange: (urls: string[]) => void;
  /** Optional subfolder in R2 bucket */
  folder?: string;
  /** Custom max file size in bytes */
  maxSize?: number;
  /** Custom allowed MIME types */
  allowedTypes?: string[];
  /** Additional CSS classes */
  className?: string;
  /** Custom placeholder text */
  placeholder?: string;
  /** Show file size limit in UI */
  showSizeLimit?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  maxFiles = 5,
  onImagesChange,
  folder = 'uploads',
  maxSize,
  allowedTypes,
  className,
  placeholder = 'Drag & drop images or',
  showSizeLimit = true,
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  const uploadOptions: UploadOptions = { folder, maxSize, allowedTypes };

  const updateParent = useCallback((imgs: UploadedImage[]) => {
    const successfulUrls = imgs
      .filter((img) => img.status === 'success' && img.url)
      .map((img) => img.url!);
    onImagesChange(successfulUrls);
  }, [onImagesChange]);

  const handleUpload = async (file: File) => {
    // Pre-validate
    const validation = validateFile(file, uploadOptions);
    if (!validation.valid) {
      const id = crypto.randomUUID();
      const preview = URL.createObjectURL(file);
      setImages((prev) => [...prev, { id, file, preview, status: 'error', error: validation.error }]);
      return;
    }

    const id = crypto.randomUUID();
    const preview = URL.createObjectURL(file);
    
    const newImage: UploadedImage = {
      id,
      file,
      preview,
      status: 'uploading',
    };
    
    setImages((prev) => {
      const updated = [...prev, newImage];
      return updated.slice(0, maxFiles);
    });

    try {
      const url = await uploadToR2(file, uploadOptions);
      
      setImages((prev) => {
        const updated = prev.map((img) =>
          img.id === id ? { ...img, url, status: 'success' as const } : img
        );
        updateParent(updated);
        return updated;
      });
    } catch (error) {
      setImages((prev) => {
        const updated = prev.map((img) =>
          img.id === id
            ? { ...img, status: 'error' as const, error: (error as Error).message }
            : img
        );
        updateParent(updated);
        return updated;
      });
    }
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - images.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);
    
    filesToUpload.forEach(handleUpload);
  }, [images.length, maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      const updated = prev.filter((img) => img.id !== id);
      updateParent(updated);
      return updated;
    });
  }, [updateParent]);

  const retryUpload = useCallback((id: string) => {
    const image = images.find((img) => img.id === id);
    if (image) {
      removeImage(id);
      handleUpload(image.file);
    }
  }, [images, removeImage]);

  return (
    <div className={cn('space-y-3', className)}>
      {images.length < maxFiles && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById(inputId)?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-200',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-secondary/50'
          )}
        >
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {placeholder} <span className="text-primary font-medium">browse</span>
          </p>
          {showSizeLimit && (
            <p className="mt-1 text-xs text-muted-foreground">
              Max {maxFiles} images, {Math.round((maxSize || 10 * 1024 * 1024) / 1024 / 1024)}MB each
            </p>
          )}
          <input
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative h-20 w-20 overflow-hidden rounded-xl"
            >
              <img
                src={image.preview}
                alt="Upload preview"
                className="h-full w-full object-cover"
              />
              
              {image.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              
              {image.status === 'error' && (
                <div
                  onClick={(e) => { e.stopPropagation(); retryUpload(image.id); }}
                  title={image.error}
                  className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-background/80 text-xs text-foreground"
                >
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="mt-1">Retry</span>
                </div>
              )}
              
              {image.status === 'success' && (
                <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-success">
                  <Check className="h-3 w-3 text-success-foreground" />
                </div>
              )}
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(image.id);
                }}
                className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/70 opacity-0 transition-opacity hover:bg-foreground/90 group-hover:opacity-100"
              >
                <X className="h-3 w-3 text-background" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const useImageUploadStatus = (images: UploadedImage[]) => {
  const isUploading = images.some(img => img.status === 'uploading');
  const hasErrors = images.some(img => img.status === 'error');
  const allComplete = images.length > 0 && images.every(img => img.status === 'success');
  
  return { isUploading, hasErrors, allComplete };
};
