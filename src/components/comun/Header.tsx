'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  className?: string
  countFavoritas?: number
}

export function Header({ className, countFavoritas }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header className={cn('sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      <div className='container flex h-16 max-w-7xl items-center justify-between'>
        {/* Logo */}
        <Link href='/' className='flex items-center space-x-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground'>
            <span className='text-lg font-bold'>MP</span>
          </div>
          <span className='hidden font-bold sm:inline-block'>MercadoPublico TI</span>
        </Link>

        {/* Nav */}
        <nav className='flex items-center space-x-6 text-sm'>
          <Link
            href='/licitaciones'
            className={cn(
              'transition-colors hover:text-foreground/80',
              pathname === '/licitaciones' ? 'text-foreground font-medium' : 'text-foreground/60'
            )}
          >
            Licitaciones
          </Link>
          <Link
            href='/favoritas'
            className={cn(
              'flex items-center gap-1.5 transition-colors hover:text-foreground/80',
              pathname === '/favoritas' ? 'text-foreground font-medium' : 'text-foreground/60'
            )}
          >
            <Star className={cn('h-4 w-4', pathname === '/favoritas' ? 'fill-yellow-400 text-yellow-400' : '')} />
            Mis Favoritas
            {typeof countFavoritas === 'number' && countFavoritas > 0 && (
              <span className='inline-flex items-center justify-center rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold h-5 min-w-5 px-1'>
                {countFavoritas}
              </span>
            )}
          </Link>
          <a
            href='https://www.mercadopublico.cl'
            target='_blank'
            rel='noopener noreferrer'
            className='transition-colors hover:text-foreground/80 text-foreground/60'
          >
            Mercado Público
          </a>
        </nav>
      </div>
    </header>
  )
}
