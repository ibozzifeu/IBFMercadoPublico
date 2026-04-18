/**
 * Backfill inicial de descripciones e items para licitaciones sin detalle.
 * Reanudable: solo procesa registros con descripcion IS NULL.
 * Uso: npm run backfill:detalles
 */

import { db } from '../src/lib/api/db'
import axios from 'axios'

const API_BASE_URL = process.env.MP_BASE_URL!
const API_TICKET = process.env.MP_TICKET!
const CONCURRENCIA = 2
const DELAY_MS = 800
const LOTE_BD = 50

interface DetalleAPI {
  CodigoExterno: string
  Nombre: string
  Descripcion?: string
  Estado?: string
  Comprador?: Record<string, string | undefined>
  Fechas?: Record<string, string | undefined>
  MontoEstimado?: number | null
  Moneda?: string
  Items?: {
    Cantidad: number
    Listado: Array<{
      Correlativo: number
      CodigoProducto?: number
      CodigoCategoria?: string
      NombreProducto: string
      Descripcion?: string
      UnidadMedida: string
      Cantidad: number
    }>
  }
}

async function fetchDetalle(codigo: string): Promise<DetalleAPI | null> {
  try {
    const res = await axios.get(`${API_BASE_URL}/licitaciones.json`, {
      params: { codigo, ticket: API_TICKET },
      timeout: 20000,
    })
    return res.data?.Listado?.[0] ?? null
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : null
    if (status === 429) {
      console.warn(`  ⏳ Rate limit (429) para ${codigo}, skip`)
    } else {
      console.warn(`  ⚠️  Error ${status ?? 'red'} para ${codigo}`)
    }
    return null
  }
}

function parsearFecha(val?: string | null): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

async function main() {
  console.log('🔍 Contando registros sin descripción...')
  const total = await db.licitacion.count({ where: { descripcion: null } })
  console.log(`📋 ${total} licitaciones a procesar\n`)

  if (total === 0) {
    console.log('✅ Todas las licitaciones ya tienen descripción.')
    await db.$disconnect()
    return
  }

  let procesadas = 0
  let actualizadas = 0
  let sinDetalle = 0
  const inicio = Date.now()
  let cursor: string | undefined

  while (true) {
    // Leer siguiente lote sin descripción
    const lote = await db.licitacion.findMany({
      where: { descripcion: null },
      select: { id: true, codigoExterno: true },
      take: LOTE_BD,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    })

    if (lote.length === 0) break

    // Procesar en sublotes de CONCURRENCIA
    for (let i = 0; i < lote.length; i += CONCURRENCIA) {
      const sublote = lote.slice(i, i + CONCURRENCIA)

      const resultados = await Promise.allSettled(
        sublote.map((l) => fetchDetalle(l.codigoExterno))
      )

      for (let j = 0; j < sublote.length; j++) {
        const item = sublote[j]
        const res = resultados[j]
        const detalle = res.status === 'fulfilled' ? res.value : null

        if (!detalle) {
          sinDetalle++
          // Marcar con string vacío para no reintentar indefinidamente
          await db.licitacion.update({
            where: { id: item.id },
            data: { descripcion: '' },
          })
        } else {
          const items = detalle.Items?.Listado?.map((it, idx) => ({
            correlativo: it.Correlativo ?? idx + 1,
            nombreProducto: it.NombreProducto,
            descripcion: it.Descripcion ?? null,
            unidadMedida: it.UnidadMedida ?? 'Unidad',
            cantidad: it.Cantidad ?? 1,
            codigoProducto: it.CodigoProducto ?? null,
            codigoCategoria: it.CodigoCategoria ?? null,
          })) ?? []

          await db.licitacion.update({
            where: { id: item.id },
            data: {
              descripcion: detalle.Descripcion ?? '',
              montoEstimado: detalle.MontoEstimado ?? null,
              moneda: detalle.Moneda ?? null,
              itemsCantidad: detalle.Items?.Cantidad ?? 0,
              fechaCierre: parsearFecha(detalle.Fechas?.FechaCierre),
              fechaCreacion: parsearFecha(detalle.Fechas?.FechaCreacion),
              fechaPublicacion: parsearFecha(detalle.Fechas?.FechaPublicacion),
              compradorNombre: detalle.Comprador?.NombreOrganismo ?? null,
              compradorOrganismo: detalle.Comprador?.CodigoOrganismo ?? null,
              compradorUnidad: detalle.Comprador?.NombreUnidad ?? null,
              compradorRut: detalle.Comprador?.RutUnidad ?? null,
              compradorCodigoUnidad: detalle.Comprador?.CodigoUnidad ?? null,
              compradorRegion: detalle.Comprador?.RegionUnidad ?? null,
              compradorComuna: detalle.Comprador?.ComunaUnidad ?? null,
              compradorDireccion: detalle.Comprador?.DireccionUnidad ?? null,
              usuarioNombre: detalle.Comprador?.NombreUsuario ?? null,
              usuarioCargo: detalle.Comprador?.CargoUsuario ?? null,
              // Upsert items solo si vienen del detalle
              ...(items.length > 0
                ? {
                    items: {
                      deleteMany: {},
                      create: items,
                    },
                  }
                : {}),
            },
          })
          actualizadas++
        }
        procesadas++
      }

      // Delay entre sublotes para respetar rate limit
      if (i + CONCURRENCIA < lote.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS))
      }
    }

    // Delay entre lotes grandes
    await new Promise((r) => setTimeout(r, DELAY_MS))

    cursor = lote[lote.length - 1].id

    // Progreso
    const pct = ((procesadas / total) * 100).toFixed(1)
    const elapsed = (Date.now() - inicio) / 1000
    const eta = procesadas > 0 ? ((elapsed / procesadas) * (total - procesadas)).toFixed(0) : '?'
    process.stdout.write(
      `\r⏳ ${procesadas}/${total} (${pct}%) | ✅ ${actualizadas} actualizadas | ⚠️  ${sinDetalle} sin detalle | ETA ~${eta}s   `
    )
  }

  console.log(`\n\n✅ Backfill completado: ${actualizadas} actualizadas, ${sinDetalle} sin detalle disponible`)
  await db.$disconnect()
}

main().catch((err) => {
  console.error('Error fatal:', err)
  process.exit(1)
})
