'use client'

import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'

interface NotaFavoritoProps {
  codigoExterno: string
  notaInicial: string | null | undefined
  onGuardada?: (nota: string | null) => void
}

/**
 * Editor inline de nota para una licitación favorita.
 * Muestra la nota en modo lectura con un lápiz para editar,
 * o un textarea cuando está en modo edición.
 */
export function NotaFavorito({ codigoExterno, notaInicial, onGuardada }: NotaFavoritoProps) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(notaInicial ?? '')
  const [nota, setNota] = useState<string | null>(notaInicial ?? null)
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
        const notaGuardada = texto.trim() || null
        setNota(notaGuardada)
        setTexto(notaGuardada ?? '')
        setEditando(false)
        onGuardada?.(notaGuardada)
      }
    } finally {
      setGuardando(false)
    }
  }

  const handleCancelar = () => {
    setTexto(nota ?? '')
    setEditando(false)
  }

  if (editando) {
    return (
      <div className='space-y-2'>
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
    <div className='flex items-start gap-2'>
      {nota ? (
        <p className='text-sm text-muted-foreground flex-1 italic'>&ldquo;{nota}&rdquo;</p>
      ) : (
        <span className='text-sm text-muted-foreground flex-1'>Sin nota — haz click en el lápiz para añadir una</span>
      )}
      <button
        onClick={() => setEditando(true)}
        title='Editar nota'
        className='shrink-0 p-1 rounded hover:bg-muted transition-colors'
      >
        <Pencil className='h-4 w-4 text-muted-foreground' />
      </button>
    </div>
  )
}
