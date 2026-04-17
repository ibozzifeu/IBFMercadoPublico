import { NextRequest, NextResponse } from 'next/server'
import { sincronizarLicitaciones } from '@/lib/services/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // segundos (Vercel limit en plan Pro)

export async function POST(request: NextRequest) {
  // Verificar CRON_SECRET — protege el endpoint de llamadas externas
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
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
