import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/api/db'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const limit = await checkRateLimit(getClientIp(request))
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.', success: false },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const categoria = searchParams.get('categoria')
    const busqueda = searchParams.get('busqueda')
    const ordenarPor = searchParams.get('ordenarPor') || 'fechaCierre'

    // Paginación: page es 1-based, limit máximo 100 para evitar respuestas excesivas
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const porPagina = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30')))
    const skip = (page - 1) * porPagina

    const where: Record<string, unknown> = {}

    if (categoria && categoria !== 'todas') {
      where.categoria = categoria
    }

    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { descripcion: { contains: busqueda, mode: 'insensitive' } },
        { codigoExterno: { contains: busqueda, mode: 'insensitive' } },
      ]
    }

    const orderBy: Record<string, string> =
      ordenarPor === 'nombre' ? { nombre: 'asc' } : { fechaCierre: 'asc' }

    const [total, filtradas, licitaciones, favoritosDB] = await Promise.all([
      db.licitacion.count(),
      db.licitacion.count({ where }),
      db.licitacion.findMany({
        where,
        orderBy,
        skip,
        take: porPagina,
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
      }),
      db.favorito.findMany({ select: { codigoExterno: true } }),
    ])

    const codigosFavoritos = new Set(favoritosDB.map((f) => f.codigoExterno))
    const resultado = licitaciones.map((l) => ({ ...l, esFavorita: codigosFavoritos.has(l.codigoExterno) }))

    return NextResponse.json(
      {
        licitaciones: resultado,
        total,
        filtradas,
        pagina: page,
        totalPaginas: Math.ceil(filtradas / porPagina),
        porPagina,
        success: true,
      },
      { headers: rateLimitHeaders(limit) }
    )
  } catch (error) {
    console.error('Error en GET /api/licitaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener licitaciones', success: false },
      { status: 500 }
    )
  }
}
