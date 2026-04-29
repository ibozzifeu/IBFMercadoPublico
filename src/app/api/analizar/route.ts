import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/api/db'
import { generarResumenEjecutivo } from '@/lib/api/gemini'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const limit = await checkRateLimit(getClientIp(request))
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.', success: false },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  try {
    const body = await request.json()
    const { licitacionId } = body

    if (!licitacionId) {
      return NextResponse.json(
        { error: 'licitacionId es requerido', success: false },
        { status: 400 }
      )
    }

    // Buscar la licitación
    const licitacion = await db.licitacion.findUnique({
      where: { id: licitacionId },
      include: {
        items: true,
      },
    })

    if (!licitacion) {
      return NextResponse.json(
        { error: 'Licitación no encontrada', success: false },
        { status: 404 }
      )
    }

    // Verificar si ya existe un análisis reciente
    const analisisExistente = await db.analisisIA.findFirst({
      where: {
        licitacionId,
        tipoAnalisis: 'resumen_ejecutivo',
      },
    })

    if (analisisExistente) {
      return NextResponse.json({
        analisis: analisisExistente,
        success: true,
        cached: true,
      })
    }

    // Generar análisis con Gemini (mapear null → undefined para compatibilidad de tipos)
    const contenido = await generarResumenEjecutivo({
      ...licitacion,
      descripcion: licitacion.descripcion ?? undefined,
      items: licitacion.items.map((i) => ({ ...i, descripcion: i.descripcion ?? undefined })),
    })

    // Guardar análisis en base de datos
    const analisis = await db.analisisIA.create({
      data: {
        licitacionId,
        tipoAnalisis: 'resumen_ejecutivo',
        contenido,
      },
    })

    return NextResponse.json({
      analisis,
      success: true,
      cached: false,
    })
  } catch (error) {
    console.error('Error en POST /api/analizar:', error)
    return NextResponse.json(
      { error: 'Error al analizar licitación', success: false },
      { status: 500 }
    )
  }
}
