'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/comun/Header'
import { TarjetaLicitacion } from '@/components/licitaciones/TarjetaLicitacion'
import { SkeletonCard } from '@/components/comun/Loading'
import { Licitacion } from '@/types/licitacion'
import { Star, AlertTriangle, Clock } from 'lucide-react'
import { diasHastaCierre } from '@/lib/utils/fechas'
import { NotaFavorito } from '@/components/licitaciones/NotaFavorito'
import Link from 'next/link'

export default function FavoritasPage() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoritas, setFavoritas] = useState<Set<string>>(new Set())
  // Mapa de notas por codigoExterno para actualizaciones optimistas
  const [notas, setNotas] = useState<Map<string, string | null>>(new Map())

  const cargarFavoritas = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await window.fetch('/api/favoritos')
      if (!res.ok) throw new Error('Error al cargar favoritas')
      const data = await res.json()
      const lista: Licitacion[] = data.licitaciones ?? []
      setLicitaciones(lista)
      setFavoritas(new Set(lista.map((l) => l.codigoExterno)))
      setNotas(new Map(lista.map((l) => [l.codigoExterno, l.notaFavorita ?? null])))
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
    setFavoritas((prev) => { const next = new Set(prev); next.delete(codigoExterno); return next })
    setLicitaciones((prev) => prev.filter((l) => l.codigoExterno !== codigoExterno))
    try {
      await window.fetch('/api/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoExterno }),
      })
    } catch {
      cargarFavoritas()
    }
  }, [cargarFavoritas])

  const handleNotaGuardada = useCallback((codigo: string, nota: string | null) => {
    setNotas((prev) => new Map(prev).set(codigo, nota))
  }, [])

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

        {/* Banner de cierre próximo — licitaciones favoritas que cierran en ≤ 3 días */}
        {!cargando && (() => {
          const urgentes = licitaciones.filter((l) => {
            const dias = diasHastaCierre(l.fechaCierre?.toString())
            return dias !== null && dias <= 3
          })
          if (urgentes.length === 0) return null
          return (
            <div className='mb-6 rounded-lg border-l-4 border-amber-500 bg-amber-100 dark:bg-amber-900 p-4'>
              <div className='flex items-center gap-2 mb-3'>
                <AlertTriangle className='h-4 w-4 text-amber-700 dark:text-amber-200 shrink-0' />
                <p className='text-sm font-semibold text-amber-900 dark:text-amber-100'>
                  {urgentes.length} favorita{urgentes.length !== 1 ? 's' : ''} con cierre próximo
                </p>
              </div>
              <ul className='space-y-2'>
                {urgentes.map((l) => {
                  const dias = diasHastaCierre(l.fechaCierre?.toString())
                  const esCritica = dias === 0
                  return (
                    <li key={l.codigoExterno} className='flex items-center justify-between gap-3'>
                      <Link
                        href={`/licitaciones/${l.codigoExterno}`}
                        className='text-sm font-medium text-amber-900 dark:text-amber-100 hover:underline truncate flex-1'
                      >
                        {l.nombre}
                      </Link>
                      <span className={`flex items-center gap-1 text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${
                        esCritica
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}>
                        <Clock className='h-3 w-3' />
                        {esCritica ? '¡Hoy!' : `${dias}d`}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })()}

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
                <div key={lic.id} className='flex flex-col'>
                  <TarjetaLicitacion
                    licitacion={lic}
                    esFavorita={favoritas.has(lic.codigoExterno)}
                    onToggleFavorito={handleToggleFavorito}
                  />
                  <div className='px-3 pb-3 -mt-1 bg-card border border-t-0 border-border rounded-b-lg'>
                    <NotaFavorito
                      codigoExterno={lic.codigoExterno}
                      notaInicial={notas.get(lic.codigoExterno)}
                      onGuardada={(nota) => handleNotaGuardada(lic.codigoExterno, nota)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}
