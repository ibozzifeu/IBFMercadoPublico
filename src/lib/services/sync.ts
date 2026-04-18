/**
 * Servicio de sincronización con API de Mercado Público
 */

import { db } from '@/lib/api/db'
import { obtenerLicitacionesActivas, extraerComprador } from '@/lib/api/mercadoPublico'
import { parsearFecha } from '@/lib/utils/fechas'
import { clasificarLicitacion } from '@/lib/services/clasificador'
import { clasificarConOllama, isOllamaAvailable } from '@/lib/api/ollama'
import { MercadoPublicoLicitacion } from '@/types/api'

interface ResultadoSync {
  procesadas: number
  nuevas: number
  actualizadas: number
  errores: string[]
  duracionMs: number
  usedOllama: boolean
  usedGPU: boolean
}

interface TransformResultado {
  datos: {
    codigoExterno: string
    nombre: string
    descripcion: string | null
    estado: string
    codigoEstado: number
    fechaCierre: Date | null
    fechaCreacion: Date | null
    fechaPublicacion: Date | null
    moneda: string | null
    montoEstimado: number | null
    categoria: string
    confianzaClasificacion: number
    tipoLicitacion: string | null
    codigoTipo: number | null
    itemsCantidad: number
    etapas: number
    compradorNombre: string | null
    compradorOrganismo: string | null
    compradorUnidad: string | null
    compradorRut: string | null
    compradorCodigoUnidad: string | null
    compradorRegion: string | null
    compradorComuna: string | null
    compradorDireccion: string | null
    usuarioNombre: string | null
    usuarioCargo: string | null
    usuarioEmail: string | null
    usuarioRut: string | null
  }
  usedOllama: boolean
  usedGPU: boolean
}

/**
 * Transformar licitación de la API al formato Prisma
 */
async function transformarLicitacion(raw: MercadoPublicoLicitacion): Promise<TransformResultado> {
  // Nombres de productos para clasificación
  const productos = raw.Items?.Listado?.map((i) => i.NombreProducto) ?? []

  let categoria: string
  let confianza: number
  let usedOllama = false
  let usedGPU = false

  // Intentar con Ollama, fallback a heurístico
  try {
    const ollamaAvailable = await isOllamaAvailable()
    if (ollamaAvailable) {
      const resultado = await clasificarConOllama(
        raw.Nombre,
        raw.Descripcion,
        productos
      )
      categoria = resultado.categoria
      confianza = resultado.confianza
      usedOllama = true
      usedGPU = resultado.usedGPU
    } else {
      // Fallback a clasificador heurístico
      const resultado = clasificarLicitacion(
        raw.Nombre,
        raw.Descripcion,
        productos
      )
      categoria = resultado.categoria
      confianza = resultado.confianza
    }
  } catch (err) {
    // Si Ollama falla, usar heurístico
    console.warn(`Ollama falló, usando clasificador heurístico: ${err instanceof Error ? err.message : String(err)}`)
    const resultado = clasificarLicitacion(
      raw.Nombre,
      raw.Descripcion,
      productos
    )
    categoria = resultado.categoria
    confianza = resultado.confianza
  }

  const comprador = extraerComprador(raw)

  const datos: TransformResultado['datos'] = {
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
    confianzaClasificacion: confianza,
    tipoLicitacion: raw.Tipo ?? null,
    codigoTipo: raw.CodigoTipo ?? null,
    itemsCantidad: raw.Items?.Cantidad ?? 0,
    etapas: raw.Etapas ?? 1,
    compradorNombre: comprador.compradorNombre ?? null,
    compradorOrganismo: comprador.compradorOrganismo ?? null,
    compradorUnidad: comprador.compradorUnidad ?? null,
    compradorRut: comprador.compradorRut ?? null,
    compradorCodigoUnidad: comprador.compradorCodigoUnidad ?? null,
    compradorRegion: comprador.compradorRegion ?? null,
    compradorComuna: comprador.compradorComuna ?? null,
    compradorDireccion: comprador.compradorDireccion ?? null,
    usuarioNombre: comprador.usuarioNombre ?? null,
    usuarioCargo: null,
    usuarioEmail: null,
    usuarioRut: comprador.usuarioRut ?? null,
  }

  return {
    datos,
    usedOllama,
    usedGPU,
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
  let usedOllama = false
  let usedGPU = false

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
            const { datos, usedOllama: ollama, usedGPU: gpu } = await transformarLicitacion(raw)

            if (ollama) usedOllama = true
            if (gpu) usedGPU = true

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

    // Log de resumen
    console.log(`✅ Sync completado: ${procesadas} procesadas, ${nuevas} nuevas, ${actualizadas} actualizadas`)
    if (usedOllama) {
      console.log(`🤖 Clasificación: ${usedGPU ? '✅ GPU NVIDIA' : '⚠️ CPU'}`)
    } else {
      console.log(`📊 Clasificación: Heurístico (Ollama no disponible)`)
    }

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

    return { procesadas, nuevas, actualizadas, errores, duracionMs, usedOllama, usedGPU }
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
