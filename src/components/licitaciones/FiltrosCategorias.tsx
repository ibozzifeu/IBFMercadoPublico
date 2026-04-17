'use client'

import { Badge } from '@/components/comun/Badge'
import { Button } from '@/components/comun/Button'
import { Categoria } from '@/types/licitacion'

interface FiltrosCategoriesProps {
  categoriaSeleccionada: string
  onCategoriaChange: (categoria: string) => void
}

const categorias = [
  { valor: 'todas', label: 'Todas', variant: 'default' as const },
  { valor: Categoria.SOFTWARE, label: 'Software/Sistemas', variant: 'software' as const },
  { valor: Categoria.HARDWARE, label: 'Hardware/Equipos', variant: 'hardware' as const },
  { valor: Categoria.REDES, label: 'Redes/Telecom', variant: 'networks' as const },
  { valor: Categoria.SEGURIDAD, label: 'Seguridad TI', variant: 'security' as const },
  { valor: Categoria.SERVICIOS, label: 'Servicios TI', variant: 'services' as const },
  { valor: Categoria.GENERAL, label: 'Tecnología General', variant: 'general' as const },
]

export function FiltrosCategorias({ categoriaSeleccionada, onCategoriaChange }: FiltrosCategoriesProps) {
  return (
    <div className='flex flex-wrap gap-2'>
      {categorias.map((cat) => (
        <Button
          key={cat.valor}
          onClick={() => onCategoriaChange(cat.valor)}
          variant={categoriaSeleccionada === cat.valor ? 'default' : 'outline'}
          size='sm'
        >
          {cat.label}
        </Button>
      ))}
    </div>
  )
}
