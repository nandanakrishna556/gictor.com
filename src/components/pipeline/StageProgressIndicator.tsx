import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageProgressIndicatorProps {
  progress: number; // 0-100
  isComplete: boolean;
  isActive: boolean;
  isAccessible?: boolean;
  stageNumber: number;
  size?: number;
}

export default function StageProgressIndicator({
  progress,
  isComplete,
  isActive,
  isAccessible = true,
  stageNumber,
  size = 28,
}: StageProgressIndicatorProps) {
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle and progress ring */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          className={isActive ? "text-primary-foreground/30" : "text-border"}
        />
        {/* Progress arc - only show if in progress (not complete) */}
        {progress > 0 && !isComplete && !isActive && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-primary transition-all duration-500"
          />
        )}
        {/* Complete ring */}
        {isComplete && !isActive && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="none"
            className="text-primary"
          />
        )}
      </svg>

      {/* Inner circle with number or checkmark */}
      <div
        className={cn(
          "absolute inset-0 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
          isActive
            ? "bg-primary-foreground text-primary"
            : isComplete
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        )}
      >
        {isComplete ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <span>{stageNumber}</span>
        )}
      </div>
    </div>
  );
}
