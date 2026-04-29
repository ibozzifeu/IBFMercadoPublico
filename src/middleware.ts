/**
 * Middleware de autorización — protege rutas con sesión NextAuth.
 *
 * Lógica de respuesta según el tipo de ruta:
 * - API routes  → 401 JSON: permite que fetch() del cliente capture el error en vez de seguir una redirección HTML
 * - Páginas     → redirect a /login: comportamiento estándar de autenticación web
 *
 * Rutas excluidas del matcher (sin autenticación):
 * - /login            → pública por definición
 * - /api/sync         → usa x-cron-secret en lugar de sesión (cron jobs no tienen cookie de sesión)
 * - /api/auth/**      → manejado internamente por NextAuth
 */
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth) {
    // Devolver JSON en lugar de redirect para no romper los fetch() del cliente
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  // El matcher limita qué rutas entran al middleware.
  // Next.js bypassa el middleware para rutas no listadas, lo que mejora el rendimiento.
  matcher: [
    '/api/licitaciones/:path*',
    '/api/analizar/:path*',
    '/api/favoritos/:path*',
    '/licitaciones/:path*',
    '/favoritas/:path*',
    '/dashboard/:path*',
  ],
}
