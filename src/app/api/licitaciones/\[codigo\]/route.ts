import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/api/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { codigo: string } }
) {
  try {
    const { codigo } = params

    // Buscar licitación por código
    const licitacion = await prisma.licitacion.findUnique({
      where: { codigoExterno: codigo },
      include: {
        items: {
          orderBy: { correlativo: 'asc' },
        },
        analisisIA: {
          orderBy: { creadoEn: 'desc' },
        },
      },
    })

    if (!licitacion) {
      return NextResponse.json(
        { error: 'Licitación no encontrada', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      licitacion,
      success: true,
    })
  } catch (error) {
    console.error('Error en GET /api/licitaciones/[codigo]:', error)
    return NextResponse.json(
      { error: 'Error al obtener licitación', success: false },
      { status: 500 }
    )
  }
}
