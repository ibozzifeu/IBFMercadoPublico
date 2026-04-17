'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
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
          <Link href='/licitaciones' className='transition-colors hover:text-foreground/80 text-foreground/60'>
            Licitaciones
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
