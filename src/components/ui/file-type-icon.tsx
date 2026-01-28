import React from 'react';
import { FileText, Image as ImageIcon, Folder, Mic, Sparkles, LucideIcon, CircleUser, Wand2, Clapperboard, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FileType = 'first_frame' | 'lip_sync' | 'talking_head' | 'script' | 'clips' | 'b_roll' | 'folder' | 'speech' | 'audio' | 'voice' | 'veo3' | 'animate' | 'frame' | 'motion_graphics';

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
  frame: {
    icon: ImageIcon,
    label: 'Frame',
    color: 'text-cyan-500',
  },
  lip_sync: {
    icon: Wand2,
    label: 'Lip Sync',
    color: 'text-primary',
  },
  // Legacy: talking_head maps to lip_sync display
  talking_head: {
    icon: CircleUser,
    label: 'Talking Head',
    color: 'text-primary',
  },
  clips: {
    icon: Clapperboard,
    label: 'Clips',
    color: 'text-primary',
  },
  // Legacy: veo3 now maps to b_roll display
  veo3: {
    icon: Clapperboard,
    label: 'B-Roll',
    color: 'text-primary',
  },
  b_roll: {
    icon: Clapperboard,
    label: 'B-Roll',
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
  speech: {
    icon: Mic,
    label: 'Speech',
    color: 'text-violet-500',
  },
  voice: {
    icon: Mic,
    label: 'Voice',
    color: 'text-violet-500',
  },
  animate: {
    icon: PlayCircle,
    label: 'Animate',
    color: 'text-blue-500',
  },
  motion_graphics: {
    icon: Sparkles,
    label: 'Motion Graphics',
    color: 'text-primary',
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
