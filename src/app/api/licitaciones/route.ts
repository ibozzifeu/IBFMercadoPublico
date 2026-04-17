import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/api/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoria = searchParams.get('categoria')
    const busqueda = searchParams.get('busqueda')
    const ordenarPor = searchParams.get('ordenarPor') || 'fechaCierre'

    // Construir filtros
    const where: any = {}

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
    let orderBy: any = {}
    if (ordenarPor === 'nombre') {
      orderBy = { nombre: 'asc' }
    } else {
      orderBy = { fechaCierre: 'asc' }
    }

    // Obtener total sin filtros para estadísticas
    const total = await prisma.licitacion.count()
    const filtradas = await prisma.licitacion.count({ where })

    // Obtener licitaciones
    const licitaciones = await prisma.licitacion.findMany({
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

    return NextResponse.json({
      licitaciones,
      total,
      filtradas,
      success: true,
    })
  } catch (error) {
    console.error('Error en GET /api/licitaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener licitaciones', success: false },
      { status: 500 }
    )
  }
}
