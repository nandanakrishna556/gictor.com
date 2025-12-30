import React from 'react';
import { FileText, Image as ImageIcon, Video, Film, Folder, Mic, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FileType = 'first_frame' | 'talking_head' | 'script' | 'clips' | 'b_roll' | 'folder' | 'audio' | 'voice';

interface FileTypeIconProps {
  fileType: FileType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FILE_TYPE_CONFIG: Record<FileType, { icon: LucideIcon; label: string; color?: string }> = {
  first_frame: {
    icon: ImageIcon,
    label: 'First Frame',
    color: 'text-blue-500',
  },
  talking_head: {
    icon: Video,
    label: 'Talking Head',
    color: 'text-primary',
  },
  clips: {
    icon: Film,
    label: 'Clips',
    color: 'text-primary',
  },
  b_roll: {
    icon: Film,
    label: 'Clips',
    color: 'text-primary',
  },
  script: {
    icon: FileText,
    label: 'Script',
    color: 'text-muted-foreground',
  },
  audio: {
    icon: Mic,
    label: 'Audio',
    color: 'text-violet-500',
  },
  voice: {
    icon: Mic,
    label: 'Voice',
    color: 'text-violet-500',
  },
  folder: {
    icon: Folder,
    label: 'Folder',
    color: 'text-amber-500',
  },
};

const SIZE_CLASSES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function FileTypeIcon({ fileType, className, size = 'md' }: FileTypeIconProps) {
  const config = FILE_TYPE_CONFIG[fileType] || FILE_TYPE_CONFIG.script;
  const Icon = config.icon;
  
  return (
    <Icon 
      className={cn(
        SIZE_CLASSES[size],
        config.color,
        className
      )}
      strokeWidth={1.5}
    />
  );
}

export function getFileTypeLabel(fileType: FileType): string {
  return FILE_TYPE_CONFIG[fileType]?.label || 'Unknown';
}

export function getFileTypeIcon(fileType: FileType): LucideIcon {
  return FILE_TYPE_CONFIG[fileType]?.icon || FileText;
}
