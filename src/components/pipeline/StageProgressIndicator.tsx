import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageProgressIndicatorProps {
  progress: number; // 0-100
  isComplete: boolean;
  isActive: boolean;
  isAccessible?: boolean;
  size?: number;
}

export default function StageProgressIndicator({
  progress,
  isComplete,
  isActive,
  isAccessible = true,
  size = 48,
}: StageProgressIndicatorProps) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          className="text-border"
        />
        {/* Progress arc */}
        {progress > 0 && !isComplete && (
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
        {isComplete && (
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

      {/* Inner circle */}
      <div
        className={cn(
          "absolute inset-1.5 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
          isComplete
            ? "bg-primary text-primary-foreground"
            : isActive
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
        )}
      >
        {isComplete && <Check className="h-5 w-5" />}
      </div>
    </div>
  );
}
