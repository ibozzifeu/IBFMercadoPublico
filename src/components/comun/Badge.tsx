import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        // Categorías TI
        software: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        hardware: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        networks: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
        security: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        services: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        // Estados
        active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        awarded: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
