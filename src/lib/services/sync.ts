/**
 * Servicio de sincronización con API de Mercado Público
 */

import { db } from '@/lib/api/db'
import { obtenerLicitacionesActivas, obtenerDetalleLicitacion, extraerComprador } from '@/lib/api/mercadoPublico'
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

/**
 * Redacta DSNs y tokens de mensajes de error antes de persistir.
 * Evita que stack traces de Prisma filtren credenciales al historial.
 */
function sanitizarError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  return raw
    .replace(/postgres(ql)?:\/\/[^\s'"]+/gi, '[DSN]')
    .replace(/\b[a-f0-9]{32,}\b/gi, '[TOKEN]')
    .substring(0, 300)
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
    usuarioCargo: comprador.usuarioCargo ?? null,
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
    // Obtener lista de licitaciones activas (datos básicos)
    const respuesta = await obtenerLicitacionesActivas()
    const lista = respuesta.Listado ?? []

    // Determinar cuáles son nuevas (sin registro en BD) para enriquecer solo esas
    const codigosExistentes = new Set(
      (await db.licitacion.findMany({
        where: { codigoExterno: { in: lista.map((l) => l.CodigoExterno) } },
        select: { codigoExterno: true },
      })).map((l) => l.codigoExterno)
    )
    const nuevasEnLista = lista.filter((l) => !codigosExistentes.has(l.CodigoExterno))

    // Enriquecer con detalle solo las nuevas (2 concurrentes + delay para respetar rate limit)
    const CONCURRENCIA_API = 2
    const DELAY_ENTRE_LOTES_MS = 500
    const detallesNuevas = new Map<string, typeof lista[0]>()
    for (let i = 0; i < nuevasEnLista.length; i += CONCURRENCIA_API) {
      const lote = nuevasEnLista.slice(i, i + CONCURRENCIA_API)
      const resultados = await Promise.allSettled(
        lote.map((raw) => obtenerDetalleLicitacion(raw.CodigoExterno))
      )
      for (let j = 0; j < lote.length; j++) {
        const det = resultados[j]
        detallesNuevas.set(lote[j].CodigoExterno, det.status === 'fulfilled' && det.value ? det.value : lote[j])
      }
      if (i + CONCURRENCIA_API < nuevasEnLista.length) {
        await new Promise((r) => setTimeout(r, DELAY_ENTRE_LOTES_MS))
      }
    }

    // Combinar: existentes usan datos del listado, nuevas usan detalle completo
    const listadoEnriquecido = lista.map((raw) => detallesNuevas.get(raw.CodigoExterno) ?? raw)

    console.log(`📋 ${lista.length} total | ${codigosExistentes.size} existentes | ${nuevasEnLista.length} nuevas con detalle`)

    // ── NUEVAS: clasificar + crear con items ─────────────────────────────────
    const LOTE = 10
    const listaNew = listadoEnriquecido.filter((r) => !codigosExistentes.has(r.CodigoExterno))
    for (let i = 0; i < listaNew.length; i += LOTE) {
      const lote = listaNew.slice(i, i + LOTE)
      await Promise.all(
        lote.map(async (raw) => {
          try {
            const { datos, usedOllama: ollama, usedGPU: gpu } = await transformarLicitacion(raw)
            if (ollama) usedOllama = true
            if (gpu) usedGPU = true

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
              data: { ...datos, items: items.length > 0 ? { create: items } : undefined },
            })
            nuevas++
            procesadas++
          } catch (err) {
            const msg = `Error creando ${raw.CodigoExterno}: ${sanitizarError(err)}`
            errores.push(msg)
            console.error(msg)
          }
        })
      )
    }

    // ── EXISTENTES: actualizar campos básicos, descripción e items ──────────
    // Primero: obtener IDs de licitaciones existentes para optimizar transacciones
    const licitacionesIdMap = new Map(
      (await db.licitacion.findMany({
        where: { codigoExterno: { in: Array.from(codigosExistentes) } },
        select: { id: true, codigoExterno: true },
      })).map((l) => [l.codigoExterno, l.id])
    )

    const listaExistente = lista.filter((r) => codigosExistentes.has(r.CodigoExterno))
    for (let i = 0; i < listaExistente.length; i += LOTE) {
      const lote = listaExistente.slice(i, i + LOTE)
      await Promise.all(
        lote.map(async (raw) => {
          try {
            const comprador = extraerComprador(raw)
            const items = raw.Items?.Listado?.map((item, idx) => ({
              correlativo: item.Correlativo ?? idx + 1,
              nombreProducto: item.NombreProducto,
              descripcion: item.Descripcion ?? null,
              unidadMedida: item.UnidadMedida ?? 'Unidad',
              cantidad: item.Cantidad ?? 1,
              codigoProducto: item.CodigoProducto ?? null,
              codigoCategoria: item.CodigoCategoria ?? null,
            })) ?? []

            const licitacionId = licitacionesIdMap.get(raw.CodigoExterno)
            if (!licitacionId) return

            // Actualizar licitación e items en transacción atómica
            await db.$transaction(async (tx) => {
              // 1. Actualizar campos de la licitación
              await tx.licitacion.update({
                where: { id: licitacionId },
                data: {
                  nombre: raw.Nombre,
                  descripcion: raw.Descripcion ?? null,
                  estado: raw.Estado ?? 'Activa',
                  codigoEstado: raw.CodigoEstado,
                  fechaCierre: parsearFecha(raw.FechaCierre ?? raw.Fechas?.FechaCierre),
                  fechaPublicacion: parsearFecha(raw.Fechas?.FechaPublicacion),
                  moneda: raw.Moneda ?? null,
                  montoEstimado: raw.MontoEstimado ?? null,
                  itemsCantidad: raw.Items?.Cantidad ?? 0,
                  compradorNombre: comprador.compradorNombre ?? null,
                  compradorRegion: comprador.compradorRegion ?? null,
                },
              })

              // 2. Eliminar items viejos
              await tx.itemLicitacion.deleteMany({
                where: { licitacionId },
              })

              // 3. Crear items nuevos (si existen)
              if (items.length > 0) {
                await tx.itemLicitacion.createMany({
                  data: items.map((item) => ({ ...item, licitacionId })),
                })
              }
            })

            actualizadas++
            procesadas++
          } catch (err) {
            const msg = `Error actualizando ${raw.CodigoExterno}: ${sanitizarError(err)}`
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
    const msg = sanitizarError(error)

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
