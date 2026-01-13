import { Sparkles, Clipboard, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export type InputMode = 'generate' | 'upload';

interface InputModeToggleProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  uploadLabel?: string;
  className?: string;
}

export function InputModeToggle({
  mode,
  onModeChange,
  uploadLabel = 'Upload',
  className,
}: InputModeToggleProps) {
  const isUploadMode = mode === 'upload';
  const UploadIcon = uploadLabel === 'Paste' ? Clipboard : Upload;

  return (
    <div className={cn("flex rounded-lg border border-border p-1 bg-muted/30", className)}>
      <button
        type="button"
        onClick={() => onModeChange('generate')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
          mode === 'generate'
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
      >
        <Sparkles className="h-4 w-4" />
        Generate
      </button>
      <button
        type="button"
        onClick={() => onModeChange('upload')}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
          isUploadMode
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
      >
        <UploadIcon className="h-4 w-4" />
        {uploadLabel}
      </button>
    </div>
  );
}
