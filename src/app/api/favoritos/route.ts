/**
 * API de favoritos — marca licitaciones para seguimiento.
 *
 * GET  /api/favoritos           → lista todas las licitaciones favoritas con sus datos completos
 * GET  /api/favoritos?codigo=X  → verifica si una licitación específica es favorita (sin exponer la lista completa)
 * POST /api/favoritos           → toggle: agrega si no existe, elimina si ya existe
 *
 * El modelo Favorito usa codigoExterno (no el id interno) como clave única para que los
 * favoritos sobrevivan al purge+recreate que ocurre en cada sincronización con Mercado Público.
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/api/db'
import { checkRateLimit, getClientIp, rateLimitHeaders } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

// Formato de códigos de Mercado Público (ej: 750563-143-LE23).
// Valida antes de hacer cualquier consulta a BD para evitar registros basura.
const MP_CODIGO_RE = /^[\w-]{5,50}$/

export async function GET(request: NextRequest) {
  const limit = await checkRateLimit(getClientIp(request))
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.', success: false },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  // Modo puntual: verifica un solo código sin retornar la lista completa.
  // Usado por la página de detalle para inicializar el estado del botón estrella.
  const codigoParam = request.nextUrl.searchParams.get('codigo')
  if (codigoParam) {
    const favorito = await db.favorito.findUnique({ where: { codigoExterno: codigoParam } })
    return NextResponse.json(
      { esFavorita: !!favorito, nota: favorito?.nota ?? null, success: true },
      { headers: rateLimitHeaders(limit) }
    )
  }

  // Modo lista: retorna todas las licitaciones favoritas con sus datos completos.
  // Preserva el orden de inserción (más reciente primero) mediante el join manual.
  try {
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1'))
    const limitParams = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '50')))
    const skip = (page - 1) * limitParams

    const [totalFavoritos, favoritos] = await Promise.all([
      db.favorito.count(),
      db.favorito.findMany({
        orderBy: { creadoEn: 'desc' },
        skip,
        take: limitParams,
      })
    ])

    const codigos = favoritos.map((f) => f.codigoExterno)

    // Join manual en lugar de relación Prisma: Favorito no tiene FK a Licitacion
    // para que los favoritos sobrevivan al purge del sync (las licitaciones se recrean).
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

    // Restaurar el orden de favoritos (findMany no garantiza orden de la cláusula IN)
    const notasPorCodigo = new Map(favoritos.map((f) => [f.codigoExterno, f.nota]))
    const licitacionesPorCodigo = new Map(licitaciones.map((l) => [l.codigoExterno, l]))

    const resultado = codigos
      .map((codigo) => {
        const lic = licitacionesPorCodigo.get(codigo)
        if (!lic) return null // Licitación purgada del sync pero aún en favoritos
        return { ...lic, esFavorita: true, notaFavorita: notasPorCodigo.get(codigo) ?? null }
      })
      .filter(Boolean)

    return NextResponse.json(
      {
        licitaciones: resultado,
        total: totalFavoritos,
        pagina: page,
        totalPaginas: Math.ceil(totalFavoritos / limitParams),
        porPagina: limitParams,
        success: true
      },
      { headers: rateLimitHeaders(limit) }
    )
  } catch (error) {
    console.error('Error en GET /api/favoritos:', error)
    return NextResponse.json({ error: 'Error al obtener favoritos', success: false }, { status: 500 })
  }
}

/**
 * PATCH /api/favoritos — actualiza la nota de un favorito existente.
 * Body: { codigoExterno: string, nota: string | null }
 */
export async function PATCH(request: NextRequest) {
  const limit = await checkRateLimit(getClientIp(request))
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en 1 minuto.', success: false },
      { status: 429, headers: rateLimitHeaders(limit) }
    )
  }

  try {
    const body = await request.json()
    const { codigoExterno, nota } = body as { codigoExterno?: string; nota?: string | null }

    if (!codigoExterno || typeof codigoExterno !== 'string' || !MP_CODIGO_RE.test(codigoExterno)) {
      return NextResponse.json({ error: 'codigoExterno inválido', success: false }, { status: 400 })
    }

    // nota null elimina la nota; string vacío también se trata como null
    const notaFinal = nota && nota.trim().length > 0 ? nota.trim().substring(0, 500) : null

    const favorito = await db.favorito.update({
      where: { codigoExterno },
      data: { nota: notaFinal },
    })

    return NextResponse.json({ favorito, success: true }, { headers: rateLimitHeaders(limit) })
  } catch (error) {
    console.error('Error en PATCH /api/favoritos:', error)
    return NextResponse.json({ error: 'Error al actualizar nota', success: false }, { status: 500 })
  }
}

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
    const { codigoExterno } = body as { codigoExterno?: string }

    // Validar formato antes de tocar la BD (evita registros basura y simplifica debugging)
    if (!codigoExterno || typeof codigoExterno !== 'string' || !MP_CODIGO_RE.test(codigoExterno)) {
      return NextResponse.json(
        { error: 'codigoExterno inválido', success: false },
        { status: 400 }
      )
    }

    // Toggle: si ya existe → quitar favorito; si no → agregar
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
