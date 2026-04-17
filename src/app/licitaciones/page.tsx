'use client'

import { useState, useCallback } from 'react'
import { Header } from '@/components/comun/Header'
import { FiltrosCategorias } from '@/components/licitaciones/FiltrosCategorias'
import { BuscaTexto } from '@/components/licitaciones/BuscaTexto'
import { TarjetaLicitacion } from '@/components/licitaciones/TarjetaLicitacion'
import { Loading, SkeletonCard } from '@/components/comun/Loading'
import { useLicitaciones } from '@/lib/hooks/useLicitaciones'

export default function LicitacionesPage() {
  const [categoria, setCategoria] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [ordenarPor, setOrdenarPor] = useState<'fechaCierre' | 'nombre'>('fechaCierre')

  const { licitaciones, cargando, error, filtradas, refetch } = useLicitaciones({
    filtroCategoria: categoria,
    busqueda,
    ordenarPor,
  })

  return (
    <>
      <Header />

      <main className='container max-w-7xl py-8'>
        {/* Encabezado */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold'>Licitaciones TI</h1>
          <p className='text-muted-foreground mt-2'>
            Monitorea en tiempo real las licitaciones de tecnología del Mercado Público de Chile
          </p>
        </div>

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
              onChange={(e) => setOrdenarPor(e.target.value as any)}
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
