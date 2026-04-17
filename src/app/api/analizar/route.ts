import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/api/db'
import { analizarConGemini } from '@/lib/api/gemini'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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
    const licitacion = await prisma.licitacion.findUnique({
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
    const analisisExistente = await prisma.analisisIA.findFirst({
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

    // Generar análisis con Gemini
    const contenido = await analizarConGemini(licitacion)

    // Guardar análisis en base de datos
    const analisis = await prisma.analisisIA.create({
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
