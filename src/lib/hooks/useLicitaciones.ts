'use client'

import { useEffect, useState, useCallback } from 'react'
import { Licitacion } from '@/types/licitacion'

interface UseLicitacionesOptions {
  filtroCategoria?: string
  busqueda?: string
  ordenarPor?: 'fechaCierre' | 'nombre'
}

interface UseLicitacionesResult {
  licitaciones: Licitacion[]
  cargando: boolean
  error: string | null
  total: number
  filtradas: number
  refetch: () => Promise<void>
}

export function useLicitaciones(opciones: UseLicitacionesOptions = {}): UseLicitacionesResult {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtradas, setFiltradas] = useState(0)

  const { filtroCategoria, busqueda, ordenarPor } = opciones

  const cargar = useCallback(async () => {
    try {
      setCargando(true)
      setError(null)

      const params = new URLSearchParams()
      if (filtroCategoria && filtroCategoria !== 'todas') {
        params.append('categoria', filtroCategoria)
      }
      if (busqueda) {
        params.append('busqueda', busqueda)
      }
      if (ordenarPor) {
        params.append('ordenarPor', ordenarPor)
      }

      const response = await window.fetch(`/api/licitaciones?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Error al obtener licitaciones')
      }

      const data = await response.json()
      setLicitaciones(data.licitaciones || [])
      setFiltradas(data.filtradas || data.licitaciones?.length || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLicitaciones([])
    } finally {
      setCargando(false)
    }
  }, [filtroCategoria, busqueda, ordenarPor])

  useEffect(() => {
    cargar()
  }, [cargar])

  return {
    licitaciones,
    cargando,
    error,
    total: licitaciones.length,
    filtradas,
    refetch: cargar,
  }
}
