import { cn } from '@/lib/utils';

interface FileProgressProps {
  progress: number;
  status: string;
  className?: string;
}

export function FileProgress({ progress, status, className }: FileProgressProps) {
  const isProcessing = status === 'processing';
  
  if (!isProcessing) return null;

  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress || 0));
  
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Generating...</span>
        <span className="font-medium text-primary">{normalizedProgress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
}