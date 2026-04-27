'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/comun/Header'
import { TarjetaLicitacion } from '@/components/licitaciones/TarjetaLicitacion'
import { SkeletonCard } from '@/components/comun/Loading'
import { Licitacion } from '@/types/licitacion'
import { Star, Pencil, Check, X } from 'lucide-react'

interface NotaEditorProps {
  codigoExterno: string
  notaInicial: string | null | undefined
  onGuardada: (codigo: string, nota: string | null) => void
}

/** Componente inline para ver y editar la nota de una licitación favorita */
function NotaEditor({ codigoExterno, notaInicial, onGuardada }: NotaEditorProps) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(notaInicial ?? '')
  const [guardando, setGuardando] = useState(false)

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const res = await window.fetch('/api/favoritos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoExterno, nota: texto || null }),
      })
      if (res.ok) {
        onGuardada(codigoExterno, texto || null)
        setEditando(false)
      }
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    setTexto(notaInicial ?? '')
    setEditando(false)
  }

  if (editando) {
    return (
      <div className='mt-2 space-y-2'>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, 500))}
          placeholder='Añade una nota sobre esta licitación...'
          rows={3}
          className='w-full text-sm px-3 py-2 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring'
          autoFocus
        />
        <div className='flex items-center gap-2'>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className='flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
          >
            <Check className='h-3 w-3' />
            Guardar
          </button>
          <button
            onClick={handleCancelar}
            className='flex items-center gap-1 px-3 py-1 text-xs rounded-md border border-input hover:bg-muted'
          >
            <X className='h-3 w-3' />
            Cancelar
          </button>
          <span className='text-xs text-muted-foreground ml-auto'>{texto.length}/500</span>
        </div>
      </div>
    )
  }

  return (
    <div className='mt-2 flex items-start gap-2'>
      {notaInicial ? (
        <p className='text-xs text-muted-foreground flex-1 italic'>"{notaInicial}"</p>
      ) : (
        <span className='text-xs text-muted-foreground flex-1'>Sin nota</span>
      )}
      <button
        onClick={() => setEditando(true)}
        title='Editar nota'
        className='shrink-0 p-1 rounded hover:bg-muted transition-colors'
      >
        <Pencil className='h-3 w-3 text-muted-foreground' />
      </button>
    </div>
  )
}

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
                    <NotaEditor
                      codigoExterno={lic.codigoExterno}
                      notaInicial={notas.get(lic.codigoExterno)}
                      onGuardada={handleNotaGuardada}
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
