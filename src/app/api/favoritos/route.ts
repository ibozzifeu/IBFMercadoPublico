import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/api/db'
import { checkRateLimit, rateLimitHeaders } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const limit = checkRateLimit(ip)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.', success: false },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  try {
    const favoritos = await db.favorito.findMany({
      orderBy: { creadoEn: 'desc' },
    })

    const codigos = favoritos.map((f) => f.codigoExterno)

    const licitaciones = await db.licitacion.findMany({
      where: { codigoExterno: { in: codigos } },
      select: {
        id: true,
        codigoExterno: true,
        nombre: true,
        descripcion: true,
        estado: true,
        codigoEstado: true,
        fechaCierre: true,
        fechaCreacion: true,
        moneda: true,
        montoEstimado: true,
        categoria: true,
        compradorNombre: true,
        compradorOrganismo: true,
        compradorUnidad: true,
        compradorRegion: true,
        usuarioNombre: true,
        usuarioCargo: true,
        itemsCantidad: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    })

    // Preservar orden de favoritos (más reciente primero) y añadir nota
    const notasPorCodigo = new Map(favoritos.map((f) => [f.codigoExterno, f.nota]))
    const licitacionesPorCodigo = new Map(licitaciones.map((l) => [l.codigoExterno, l]))

    const resultado = codigos
      .map((codigo) => {
        const lic = licitacionesPorCodigo.get(codigo)
        if (!lic) return null
        return { ...lic, esFavorita: true, notaFavorita: notasPorCodigo.get(codigo) ?? null }
      })
      .filter(Boolean)

    return NextResponse.json(
      { licitaciones: resultado, total: resultado.length, success: true },
      { headers: rateLimitHeaders(limit) }
    )
  } catch (error) {
    console.error('Error en GET /api/favoritos:', error)
    return NextResponse.json({ error: 'Error al obtener favoritos', success: false }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const limit = checkRateLimit(ip)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.', success: false },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  try {
    const body = await request.json()
    const { codigoExterno } = body as { codigoExterno?: string }

    if (!codigoExterno || typeof codigoExterno !== 'string') {
      return NextResponse.json(
        { error: 'codigoExterno requerido', success: false },
        { status: 400 }
      )
    }

    const existente = await db.favorito.findUnique({ where: { codigoExterno } })

    if (existente) {
      await db.favorito.delete({ where: { codigoExterno } })
      return NextResponse.json({ esFavorita: false, success: true }, { headers: rateLimitHeaders(limit) })
    } else {
      await db.favorito.create({ data: { codigoExterno } })
      return NextResponse.json({ esFavorita: true, success: true }, { headers: rateLimitHeaders(limit) })
    }
  } catch (error) {
    console.error('Error en POST /api/favoritos:', error)
    return NextResponse.json({ error: 'Error al actualizar favorito', success: false }, { status: 500 })
  }
}
