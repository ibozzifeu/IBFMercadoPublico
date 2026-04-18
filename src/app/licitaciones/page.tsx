'use client'

import { useState } from 'react'
import { Header } from '@/components/comun/Header'
import { FiltrosCategorias } from '@/components/licitaciones/FiltrosCategorias'
import { BuscaTexto } from '@/components/licitaciones/BuscaTexto'
import { TarjetaLicitacion } from '@/components/licitaciones/TarjetaLicitacion'
import { SkeletonCard } from '@/components/comun/Loading'
import { useLicitaciones } from '@/lib/hooks/useLicitaciones'
import { RefreshCw } from 'lucide-react'

export default function LicitacionesPage() {
  const [categoria, setCategoria] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [ordenarPor, setOrdenarPor] = useState<'fechaCierre' | 'nombre'>('fechaCierre')
  const [sincronizando, setSincronizando] = useState(false)
  const [mensajeSync, setMensajeSync] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const { licitaciones, cargando, error, filtradas, refetch } = useLicitaciones({
    filtroCategoria: categoria,
    busqueda,
    ordenarPor,
  })

  async function handleSync() {
    setSincronizando(true)
    setMensajeSync(null)
    try {
      const res = await window.fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al sincronizar')
      setMensajeSync({
        tipo: 'ok',
        texto: `Sincronización completada: ${data.nuevas} nuevas, ${data.actualizadas} actualizadas`,
      })
      await refetch()
    } catch (err) {
      setMensajeSync({
        tipo: 'error',
        texto: err instanceof Error ? err.message : 'Error al sincronizar',
      })
    } finally {
      setSincronizando(false)
    }
  }

  return (
    <>
      <Header />

      <main className='container max-w-7xl py-8'>
        {/* Encabezado */}
        <div className='mb-8 flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold'>Licitaciones TI</h1>
            <p className='text-muted-foreground mt-2'>
              Monitorea en tiempo real las licitaciones de tecnología del Mercado Público de Chile
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={sincronizando}
            className='flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0'
          >
            <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
            {sincronizando ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* Mensaje sync */}
        {mensajeSync && (
          <div className={`mb-6 p-3 rounded-lg text-sm ${
            mensajeSync.tipo === 'ok'
              ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400'
              : 'bg-destructive/10 border border-destructive/50 text-destructive'
          }`}>
            {mensajeSync.texto}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className='mb-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive'>
            <p className='font-semibold'>Error</p>
            <p className='text-sm'>{error}</p>
            <button onClick={refetch} className='text-sm underline mt-2 hover:no-underline'>
              Reintentar
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className='space-y-4 mb-8'>
          {/* Búsqueda */}
          <BuscaTexto valor={busqueda} onChange={setBusqueda} />

          {/* Categorías */}
          <div>
            <p className='text-sm font-semibold mb-3'>Categoría</p>
            <FiltrosCategorias categoriaSeleccionada={categoria} onCategoriaChange={setCategoria} />
          </div>

          {/* Ordenamiento */}
          <div className='flex items-center gap-2'>
            <label className='text-sm font-semibold'>Ordenar por:</label>
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value as 'fechaCierre' | 'nombre')}
              className='px-3 py-2 rounded-md border border-input bg-background text-sm'
            >
              <option value='fechaCierre'>Fecha de Cierre (Urgentes primero)</option>
              <option value='nombre'>Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Resultados */}
        <div>
          <p className='text-sm text-muted-foreground mb-4'>
            {cargando ? 'Buscando...' : `${filtradas} licitaciones encontradas`}
          </p>

          {cargando ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : licitaciones.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-muted-foreground mb-4'>No se encontraron licitaciones</p>
              <button onClick={refetch} className='text-primary underline hover:no-underline'>
                Recargar
              </button>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {licitaciones.map((lic) => (
                <TarjetaLicitacion key={lic.id} licitacion={lic} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
