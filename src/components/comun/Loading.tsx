import { cn } from '@/lib/utils/cn'

interface LoadingProps {
  className?: string
  message?: string
}

export function Loading({ className, message = 'Cargando...' }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-12', className)}>
      <div className='relative h-12 w-12'>
        <div className='absolute inset-0 rounded-full border-4 border-muted'></div>
        <div className='absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary'></div>
      </div>
      {message && <p className='text-sm text-muted-foreground'>{message}</p>}
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

export function SkeletonCard() {
  return (
    <div className='space-y-4 rounded-lg border border-border p-6'>
      <Skeleton className='h-4 w-3/4' />
      <Skeleton className='h-4 w-1/2' />
      <div className='space-y-2'>
        <Skeleton className='h-3 w-full' />
        <Skeleton className='h-3 w-5/6' />
      </div>
    </div>
  )
}
