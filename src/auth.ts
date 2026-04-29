/**
 * Configuración NextAuth v5 — autenticación de un solo usuario.
 *
 * Single-user: las credenciales viven en variables de entorno (AUTH_USERNAME/AUTH_PASSWORD).
 * Para multi-usuario, reemplazar Credentials por un provider con base de datos (ej. Prisma Adapter).
 *
 * Exporta: handlers (para /api/auth/[...nextauth]), auth (para middleware y server components),
 *          signIn y signOut (para acciones de servidor).
 */
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Requerido en entornos con proxy inverso (Docker, Vercel, Nginx) donde el
  // header Host puede no coincidir con AUTH_URL
  trustHost: true,

  providers: [
    Credentials({
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      /**
       * Valida credenciales contra variables de entorno.
       * Retorna el objeto User si son correctas, o null para rechazar (NextAuth lanza CredentialsSignin).
       * El id '1' es fijo porque la app es single-user — no hay tabla de usuarios.
       */
      authorize(credentials) {
        if (
          credentials.username === process.env.AUTH_USERNAME &&
          credentials.password === process.env.AUTH_PASSWORD
        ) {
          return { id: '1', name: credentials.username as string }
        }
        return null
      },
    }),
  ],

  pages: {
    signIn: '/login', // Página de login personalizada (reemplaza la UI por defecto de NextAuth)
  },

  session: {
    strategy: 'jwt',       // Sin tabla de sesiones en BD; el token viaja en cookie httpOnly firmada
    maxAge: 8 * 60 * 60,  // 8 horas — cubre una jornada laboral completa sin re-autenticar
  },
})
