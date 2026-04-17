import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/api/db'
import { checkRateLimit, rateLimitHeaders } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { codigo: string } }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const limit = checkRateLimit(ip)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.', success: false },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  try {
    const { codigo } = params

    const licitacion = await db.licitacion.findUnique({
      where: { codigoExterno: codigo },
      include: {
        items: {
          orderBy: { correlativo: 'asc' },
          take: 200,
        },
        analisisIA: {
          orderBy: { creadoEn: 'desc' },
          take: 1,
        },
      },
    })

    if (!licitacion) {
      return NextResponse.json(
        { error: 'Licitación no encontrada', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({ licitacion, success: true })
  } catch (error) {
    console.error('Error en GET /api/licitaciones/[codigo]:', error)
    return NextResponse.json(
      { error: 'Error al obtener licitación', success: false },
      { status: 500 }
    )
  }
}
