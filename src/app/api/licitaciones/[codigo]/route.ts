import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/api/db'
import { checkRateLimit, rateLimitHeaders } from '@/lib/ratelimit'
import { obtenerDetalleLicitacion } from '@/lib/api/mercadoPublico'

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

    // Si falta descripción, enriquecer on-demand desde API MP
    if (!licitacion.descripcion) {
      try {
        const detalle = await obtenerDetalleLicitacion(codigo)
        if (detalle?.Descripcion) {
          // Actualizar en BD
          await db.licitacion.update({
            where: { codigoExterno: codigo },
            data: { descripcion: detalle.Descripcion },
          })
          // Actualizar items también si no existen
          if (detalle.Items?.Listado && detalle.Items.Listado.length > 0 && licitacion.items.length === 0) {
            const items = detalle.Items.Listado.map((item, idx) => ({
              correlativo: item.Correlativo ?? idx + 1,
              nombreProducto: item.NombreProducto,
              descripcion: item.Descripcion ?? null,
              unidadMedida: item.UnidadMedida ?? 'Unidad',
              cantidad: item.Cantidad ?? 1,
              codigoProducto: item.CodigoProducto ?? null,
              codigoCategoria: item.CodigoCategoria ?? null,
            }))
            await db.itemLicitacion.createMany({
              data: items.map((i) => ({ ...i, licitacionId: licitacion.id })),
            })
            // Refrescar items desde BD
            licitacion.items = await db.itemLicitacion.findMany({
              where: { licitacionId: licitacion.id },
              orderBy: { correlativo: 'asc' },
              take: 200,
            })
          }
          licitacion.descripcion = detalle.Descripcion
        }
      } catch (err) {
        // Silencioso: si falla, retornar lo que tenemos
        console.warn(`No se pudo enriquecer ${codigo} on-demand:`, err instanceof Error ? err.message : err)
      }
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
