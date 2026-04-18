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
    const searchParams = request.nextUrl.searchParams
    const categoria = searchParams.get('categoria')
    const busqueda = searchParams.get('busqueda')
    const ordenarPor = searchParams.get('ordenarPor') || 'fechaCierre'

    // Construir filtros
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

    // Ordenar
    const orderBy: Record<string, string> =
      ordenarPor === 'nombre' ? { nombre: 'asc' } : { fechaCierre: 'asc' }

    // Obtener total sin filtros para estadísticas
    const total = await db.licitacion.count()
    const filtradas = await db.licitacion.count({ where })

    // Obtener licitaciones
    const licitaciones = await db.licitacion.findMany({
      where,
      orderBy,
      take: 100,
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

    return NextResponse.json(
      { licitaciones, total, filtradas, success: true },
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
