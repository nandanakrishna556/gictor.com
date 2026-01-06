import { cn } from '@/lib/utils';
import { useGenerationProgress } from '@/hooks/useGenerationProgress';

interface GeneratingOverlayProps {
  status: string;
  generationStartedAt: string | null;
  estimatedDurationSeconds: number | null;
  label?: string;
  className?: string;
}

export function GeneratingOverlay({ 
  status,
  generationStartedAt,
  estimatedDurationSeconds,
  label = 'Generating...', 
  className,
}: GeneratingOverlayProps) {
  const progress = useGenerationProgress({
    status,
    generationStartedAt,
    estimatedDurationSeconds,
  });

  // Circumference for SVG circle (2 * PI * r where r=16)
  const circumference = 100.53;
  const strokeDasharray = `${(progress * circumference) / 100} ${circumference}`;

  return (
    <div className={cn(
      "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted",
      className
    )}>
      {/* Circular Progress Indicator */}
      <div className="relative">
        <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-muted-foreground/20"
            strokeWidth="2"
          />
          {/* Progress circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-primary transition-all duration-300"
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
          />
        </svg>
        {/* Center percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      
      {/* Label */}
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
