'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Licitacion } from '@/types/licitacion'

interface UseLicitacionesOptions {
  filtroCategoria?: string
  busqueda?: string
  ordenarPor?: 'fechaCierre' | 'nombre'
  limite?: number
}

interface UseLicitacionesResult {
  licitaciones: Licitacion[]
  cargando: boolean
  error: string | null
  total: number
  filtradas: number
  pagina: number
  totalPaginas: number
  irAPagina: (p: number) => void
  refetch: () => Promise<void>
}

export function useLicitaciones(opciones: UseLicitacionesOptions = {}): UseLicitacionesResult {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtradas, setFiltradas] = useState(0)
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)

  const { filtroCategoria, busqueda, ordenarPor, limite = 30 } = opciones

  // Referencia a la página actual para usarla dentro del callback sin re-crearla
  const paginaRef = useRef(pagina)
  paginaRef.current = pagina

  const cargar = useCallback(async (paginaACargar?: number) => {
    const p = paginaACargar ?? paginaRef.current
    try {
      setCargando(true)
      setError(null)

      const params = new URLSearchParams()
      if (filtroCategoria && filtroCategoria !== 'todas') params.append('categoria', filtroCategoria)
      if (busqueda) params.append('busqueda', busqueda)
      if (ordenarPor) params.append('ordenarPor', ordenarPor)
      params.append('page', String(p))
      params.append('limit', String(limite))

      const response = await window.fetch(`/api/licitaciones?${params.toString()}`)
      if (!response.ok) throw new Error('Error al obtener licitaciones')

      const data = await response.json()
      setLicitaciones(data.licitaciones || [])
      setFiltradas(data.filtradas || 0)
      setTotal(data.total || 0)
      setPagina(data.pagina || 1)
      setTotalPaginas(data.totalPaginas || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLicitaciones([])
    } finally {
      setCargando(false)
    }
  }, [filtroCategoria, busqueda, ordenarPor, limite])

  // Al cambiar filtros, volver a página 1
  useEffect(() => {
    setPagina(1)
    cargar(1)
  }, [cargar])

  const irAPagina = useCallback((p: number) => {
    setPagina(p)
    cargar(p)
  }, [cargar])

  return {
    licitaciones,
    cargando,
    error,
    total,
    filtradas,
    pagina,
    totalPaginas,
    irAPagina,
    refetch: () => cargar(paginaRef.current),
  }
}
