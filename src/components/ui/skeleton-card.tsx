import { cn } from '@/lib/utils';

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'grid' | 'kanban';
}

export function SkeletonCard({ className, variant = 'grid' }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border bg-card overflow-hidden',
        variant === 'grid' ? 'aspect-[2/3]' : 'aspect-auto',
        className
      )}
    >
      {/* Header skeleton */}
      <div className="p-3 sm:p-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="skeleton h-4 w-4 rounded-sm" />
          <div className="skeleton h-4 flex-1 max-w-[120px]" />
        </div>
      </div>
      
      {/* Preview area skeleton */}
      <div className="flex-1 skeleton" />

      {/* Info section skeleton */}
      <div className="flex flex-col gap-1.5 sm:gap-2 p-3 sm:p-4 bg-card">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="skeleton h-3 w-10" />
          <div className="skeleton h-6 w-16 rounded-md" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="skeleton h-3 w-10" />
          <div className="skeleton h-5 w-12 rounded" />
          <div className="skeleton h-5 w-14 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties} />
      ))}
    </div>
  );
}
