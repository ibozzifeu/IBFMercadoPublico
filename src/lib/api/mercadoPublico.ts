/**
 * Cliente para API de Mercado Público
 */

import axios from 'axios'
import { MercadoPublicoResponse } from '@/types/api'

const API_BASE_URL = process.env.MP_BASE_URL
const API_TICKET = process.env.MP_TICKET

if (!API_BASE_URL) {
  throw new Error('MP_BASE_URL no está configurado')
}

if (!API_TICKET) {
  console.warn('MP_TICKET no está configurado')
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

/**
 * Obtener licitaciones activas
 */
export async function obtenerLicitacionesActivas(
  limite: number = 100
): Promise<MercadoPublicoResponse> {
  try {
    const response = await client.get<MercadoPublicoResponse>('/licitaciones.json', {
      params: {
        estado: 'activas',
        ticket: API_TICKET,
      },
    })

    return response.data
  } catch (error) {
    console.error('Error al obtener licitaciones activas:', error)
    throw new Error('No se pudieron obtener licitaciones del Mercado Público')
  }
}

/**
 * Obtener licitación por código
 */
export async function obtenerLicitacionPorCodigo(
  codigo: string
): Promise<MercadoPublicoResponse> {
  try {
    const response = await client.get<MercadoPublicoResponse>('/licitaciones.json', {
      params: {
        codigo,
        ticket: API_TICKET,
      },
    })

    return response.data
  } catch (error) {
    console.error(`Error al obtener licitación ${codigo}:`, error)
    throw new Error(`No se pudo obtener la licitación ${codigo}`)
  }
}

/**
 * Parsear fecha de Mercado Público
 */
export function parsearFecha(fecha?: string | null): Date | null {
  if (!fecha) return null

  try {
    return new Date(fecha)
  } catch {
    return null
  }
}

/**
 * Extraer información del comprador
 */
export function extraerComprador(data: any) {
  return {
    compradorNombre: data.Comprador?.NombreOrganismo,
    compradorOrganismo: data.Comprador?.CodigoOrganismo,
    compradorUnidad: data.Comprador?.NombreUnidad,
    compradorRut: data.Comprador?.RutUnidad,
    compradorCodigoUnidad: data.Comprador?.CodigoUnidad,
    compradorRegion: data.Comprador?.RegionUnidad,
    compradorComuna: data.Comprador?.ComunaUnidad,
    compradorDireccion: data.Comprador?.DireccionUnidad,
    usuarioNombre: data.Comprador?.NombreUsuario,
    usuarioCargo: data.Comprador?.CargoUsuario,
    usuarioRut: data.Comprador?.RutUsuario,
  }
}

/**
 * Contar días hasta cierre
 */
export function diasHastaCierre(fechaCierre?: string | null): number | null {
  if (!fechaCierre) return null

  const fecha = parsearFecha(fechaCierre)
  if (!fecha) return null

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  fecha.setHours(0, 0, 0, 0)

  const diferencia = fecha.getTime() - hoy.getTime()
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24))

  return dias >= 0 ? dias : 0
}

/**
 * Determinar urgencia de una licitación
 */
export function determinarUrgencia(dias: number | null): 'critica' | 'alta' | 'media' | 'baja' {
  if (dias === null) return 'baja'
  if (dias === 0) return 'critica'
  if (dias <= 3) return 'alta'
  if (dias <= 7) return 'media'
  return 'baja'
}
