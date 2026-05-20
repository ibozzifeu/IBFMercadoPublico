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
import crypto from 'crypto'

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
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const usernameStr = credentials.username as string
        const passwordStr = credentials.password as string

        const targetUsername = process.env.AUTH_USERNAME || ''
        const targetPassword = process.env.AUTH_PASSWORD || ''

        const userBuffer = Buffer.from(usernameStr)
        const targetUserBuffer = Buffer.from(targetUsername)
        const passBuffer = Buffer.from(passwordStr)
        const targetPasswordBuffer = Buffer.from(targetPassword)

        // Strict length verification before using timingSafeEqual to prevent length-mismatch exceptions
        if (
          userBuffer.length === targetUserBuffer.length &&
          passBuffer.length === targetPasswordBuffer.length
        ) {
          const userMatch = crypto.timingSafeEqual(userBuffer, targetUserBuffer)
          const passMatch = crypto.timingSafeEqual(passBuffer, targetPasswordBuffer)

          if (userMatch && passMatch) {
            return { id: '1', name: usernameStr }
          }
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
