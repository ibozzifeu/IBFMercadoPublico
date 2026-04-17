import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'MercadoPublico TI - Monitor de Licitaciones',
  description: 'Monitor inteligente de licitaciones de TI en el Mercado Público de Chile',
  keywords: ['licitaciones', 'mercado público', 'TI', 'tecnología', 'Chile'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  )
}
