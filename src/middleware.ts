import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth) {
    // Rutas API → devolver 401 en lugar de redirigir
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }
    // Páginas → redirigir al login
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: [
    '/api/licitaciones/:path*',
    '/api/analizar/:path*',
    '/api/sync',
    '/licitaciones/:path*',
    '/dashboard/:path*',
  ],
}
