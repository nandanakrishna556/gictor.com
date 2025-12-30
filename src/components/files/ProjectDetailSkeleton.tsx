import { Skeleton } from '@/components/ui/skeleton';

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Grid of file card skeletons */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            {/* Thumbnail skeleton */}
            <Skeleton className="aspect-video w-full" />
            
            {/* Content skeleton */}
            <div className="p-3 space-y-3">
              {/* Title */}
              <Skeleton className="h-4 w-3/4" />
              
              {/* Meta row */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
