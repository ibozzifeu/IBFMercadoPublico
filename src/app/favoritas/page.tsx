'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/comun/Header'
import { TarjetaLicitacion } from '@/components/licitaciones/TarjetaLicitacion'
import { SkeletonCard } from '@/components/comun/Loading'
import { Licitacion } from '@/types/licitacion'
import { Star } from 'lucide-react'

export default function FavoritasPage() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoritas, setFavoritas] = useState<Set<string>>(new Set())

  const cargarFavoritas = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await window.fetch('/api/favoritos')
      if (!res.ok) throw new Error('Error al cargar favoritas')
      const data = await res.json()
      setLicitaciones(data.licitaciones ?? [])
      setFavoritas(new Set((data.licitaciones ?? []).map((l: Licitacion) => l.codigoExterno)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarFavoritas()
  }, [cargarFavoritas])

  const handleToggleFavorito = useCallback(async (codigoExterno: string) => {
    // Optimistic: quitar de la vista inmediatamente
    setFavoritas((prev) => {
      const next = new Set(prev)
      next.delete(codigoExterno)
      return next
    })
    setLicitaciones((prev) => prev.filter((l) => l.codigoExterno !== codigoExterno))

    try {
      await window.fetch('/api/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoExterno }),
      })
    } catch {
      // Si falla, recargar el estado real
      cargarFavoritas()
    }
  }, [cargarFavoritas])

  return (
    <>
      <Header countFavoritas={favoritas.size} />

      <main className='container max-w-7xl py-8'>
        <div className='mb-8 flex items-start gap-4'>
          <div>
            <h1 className='text-3xl font-bold flex items-center gap-3'>
              <Star className='h-7 w-7 fill-yellow-400 text-yellow-400' />
              Mis Favoritas
            </h1>
            <p className='text-muted-foreground mt-2'>
              Licitaciones que marcaste para seguimiento
            </p>
          </div>
        </div>

        {error && (
          <div className='mb-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive'>
            <p className='font-semibold'>Error</p>
            <p className='text-sm'>{error}</p>
            <button onClick={cargarFavoritas} className='text-sm underline mt-2 hover:no-underline'>
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : licitaciones.length === 0 ? (
          <div className='text-center py-20'>
            <Star className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
            <p className='text-muted-foreground text-lg mb-2'>No tienes licitaciones favoritas</p>
            <p className='text-muted-foreground text-sm'>
              Marca licitaciones con la estrella desde el listado principal para seguirlas aquí.
            </p>
          </div>
        ) : (
          <>
            <p className='text-sm text-muted-foreground mb-4'>
              {licitaciones.length} licitacion{licitaciones.length !== 1 ? 'es' : ''} en seguimiento
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {licitaciones.map((lic) => (
                <TarjetaLicitacion
                  key={lic.id}
                  licitacion={lic}
                  esFavorita={favoritas.has(lic.codigoExterno)}
                  onToggleFavorito={handleToggleFavorito}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}
