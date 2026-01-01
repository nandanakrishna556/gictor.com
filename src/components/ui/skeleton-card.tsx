import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'flex aspect-[2/3] flex-col rounded-md border bg-card overflow-hidden',
        className
      )}
    >
      {/* Header skeleton */}
      <div className="p-3 sm:p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-sm skeleton-shimmer" />
          <div className="h-4 flex-1 rounded-sm skeleton-shimmer" />
        </div>
      </div>
      
      {/* Preview area skeleton */}
      <div className="flex-1 skeleton-shimmer" />
      
      {/* Info section skeleton */}
      <div className="flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-10 rounded-sm skeleton-shimmer" />
          <div className="h-6 w-20 rounded-sm skeleton-shimmer" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 rounded-sm skeleton-shimmer" />
          <div className="h-5 w-16 rounded-sm skeleton-shimmer" />
          <div className="h-5 w-12 rounded-sm skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
