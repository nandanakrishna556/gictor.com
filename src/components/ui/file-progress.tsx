import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileProgressProps {
  // Kept for backwards compatibility but no longer rendered as a percentage.
  progress?: number;
  status: string;
  className?: string;
}

export function FileProgress({ status, className }: FileProgressProps) {
  const isProcessing = status === 'processing';

  if (!isProcessing) return null;

  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" strokeWidth={1.5} />
      <span className="text-muted-foreground font-medium">Generating...</span>
    </div>
  );
}
