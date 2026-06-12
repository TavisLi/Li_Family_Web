import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-white/20 bg-white/10 backdrop-blur-md',
        'before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent',
        className,
      )}
    />
  )
}

export function PageSkeleton() {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-5 py-10">
      <div className="space-y-4">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-14 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="aspect-[4/3]" />
        <Skeleton className="aspect-[4/3]" />
        <Skeleton className="aspect-[4/3]" />
      </div>
    </div>
  )
}
