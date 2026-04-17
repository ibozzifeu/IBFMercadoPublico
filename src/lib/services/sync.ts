/**
 * Servicio de sincronización con API de Mercado Público
 */

import { db } from '@/lib/api/db'
import { obtenerLicitacionesActivas, parsearFecha, extraerComprador } from '@/lib/api/mercadoPublico'
import { clasificarLicitacion } from '@/lib/services/clasificador'
import { MercadoPublicoLicitacion } from '@/types/api'

interface ResultadoSync {
  procesadas: number
  nuevas: number
  actualizadas: number
  errores: string[]
  duracionMs: number
}

/**
 * Transformar licitación de la API al formato Prisma
 */
function transformarLicitacion(raw: MercadoPublicoLicitacion) {
  const comprador = extraerComprador(raw)

  // Nombres de productos para clasificación
  const productos = raw.Items?.Listado?.map((i) => i.NombreProducto) ?? []

  const { categoria } = clasificarLicitacion(
    raw.Nombre,
    raw.Descripcion,
    productos
  )

  return {
    codigoExterno: raw.CodigoExterno,
    nombre: raw.Nombre,
    descripcion: raw.Descripcion ?? null,
    estado: raw.Estado ?? 'Activa',
    codigoEstado: raw.CodigoEstado,
    fechaCierre: parsearFecha(raw.FechaCierre ?? raw.Fechas?.FechaCierre),
    fechaCreacion: parsearFecha(raw.Fechas?.FechaCreacion),
    fechaPublicacion: parsearFecha(raw.Fechas?.FechaPublicacion),
    moneda: raw.Moneda ?? null,
    montoEstimado: raw.MontoEstimado ?? null,
    categoria,
    tipoLicitacion: raw.Tipo ?? null,
    codigoTipo: raw.CodigoTipo ?? null,
    itemsCantidad: raw.Items?.Cantidad ?? 0,
    etapas: raw.Etapas ?? 1,
    ...comprador,
  }
}

/**
 * Sincronizar licitaciones activas desde Mercado Público
 */
export async function sincronizarLicitaciones(): Promise<ResultadoSync> {
  const inicio = Date.now()
  const errores: string[] = []
  let nuevas = 0
  let actualizadas = 0
  let procesadas = 0

  // Registrar inicio de sincronización
  const historial = await db.historialSincronizacion.create({
    data: {
      estado: 'ejecutando',
      licitacionesProcesadas: 0,
      licitacionesNuevas: 0,
      licitacionesActualizadas: 0,
    },
  })

  try {
    // Obtener licitaciones activas de la API
    const respuesta = await obtenerLicitacionesActivas()
    const lista = respuesta.Listado ?? []

    // Procesar en lotes de 10 para no saturar la BD
    const LOTE = 10
    for (let i = 0; i < lista.length; i += LOTE) {
      const lote = lista.slice(i, i + LOTE)

      await Promise.all(
        lote.map(async (raw) => {
          try {
            const datos = transformarLicitacion(raw)

            // Verificar si ya existe
            const existente = await db.licitacion.findUnique({
              where: { codigoExterno: raw.CodigoExterno },
              select: { id: true },
            })

            if (existente) {
              // Actualizar
              await db.licitacion.update({
                where: { codigoExterno: raw.CodigoExterno },
                data: datos,
              })
              actualizadas++
            } else {
              // Crear con sus items
              const items = raw.Items?.Listado?.map((item, idx) => ({
                correlativo: item.Correlativo ?? idx + 1,
                nombreProducto: item.NombreProducto,
                descripcion: item.Descripcion ?? null,
                unidadMedida: item.UnidadMedida ?? 'Unidad',
                cantidad: item.Cantidad ?? 1,
                codigoProducto: item.CodigoProducto ?? null,
                codigoCategoria: item.CodigoCategoria ?? null,
              })) ?? []

              await db.licitacion.create({
                data: {
                  ...datos,
                  items: items.length > 0 ? { create: items } : undefined,
                },
              })
              nuevas++
            }

            procesadas++
          } catch (err) {
            const msg = `Error en ${raw.CodigoExterno}: ${err instanceof Error ? err.message : String(err)}`
            errores.push(msg)
            console.error(msg)
          }
        })
      )
    }

    const duracionMs = Date.now() - inicio

    // Actualizar historial como exitoso
    await db.historialSincronizacion.update({
      where: { id: historial.id },
      data: {
        estado: errores.length === 0 ? 'exitosa' : 'parcial',
        licitacionesProcesadas: procesadas,
        licitacionesNuevas: nuevas,
        licitacionesActualizadas: actualizadas,
        duracionSegundos: duracionMs / 1000,
        errorMensaje: errores.length > 0 ? errores.slice(0, 5).join('\n') : null,
      },
    })

    return { procesadas, nuevas, actualizadas, errores, duracionMs }
  } catch (error) {
    const duracionMs = Date.now() - inicio
    const msg = error instanceof Error ? error.message : 'Error desconocido'

    await db.historialSincronizacion.update({
      where: { id: historial.id },
      data: {
        estado: 'fallida',
        duracionSegundos: duracionMs / 1000,
        errorMensaje: msg,
      },
    })

    throw error
  }
}
