import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface GeneratingOverlayProps {
  // Kept for backwards compatibility. Status is no longer used to drive a percentage.
  status?: string;
  generationStartedAt?: string | null;
  estimatedDurationSeconds?: number | null;
  label?: string;
  className?: string;
}

export function GeneratingOverlay({ 
  label = 'Generating...', 
  className,
}: GeneratingOverlayProps) {
  return (
    <div className={cn(
      "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted",
      className
    )}>
      <Loader2 className="h-10 w-10 animate-spin text-primary" strokeWidth={1.5} />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
