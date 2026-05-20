import { NextRequest, NextResponse } from 'next/server'
import { sincronizarLicitaciones } from '@/lib/services/sync'
import { auth } from '@/auth'
import { timingSafeEqual } from 'crypto'
import { Buffer } from 'buffer'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  // Aceptar sesión NextAuth (llamada desde la UI) o CRON_SECRET (llamada externa)
  const session = await auth()
  const secret = request.headers.get('x-cron-secret')

  const secretBuffer = Buffer.from(secret || 'invalid')
  const envSecretBuffer = Buffer.from(process.env.CRON_SECRET || '')

  const isValidCron = secretBuffer.length === envSecretBuffer.length && timingSafeEqual(secretBuffer, envSecretBuffer)

  if (!session && !isValidCron) {
    return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 })
  }

  try {
    const resultado = await sincronizarLicitaciones()

    return NextResponse.json({
      success: true,
      ...resultado,
      errores: resultado.errores.length > 0 ? resultado.errores : undefined,
    })
  } catch (error) {
    console.error('Error en sincronización:', error)
    return NextResponse.json(
      { error: 'Error durante la sincronización', success: false },
      { status: 500 }
    )
  }
}
