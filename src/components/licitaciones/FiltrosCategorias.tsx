'use client'

import { Button } from '@/components/comun/Button'
import { Categoria } from '@/types/licitacion'

interface FiltrosCategoriesProps {
  categoriaSeleccionada: string
  onCategoriaChange: (categoria: string) => void
}

const categorias = [
  { valor: 'todas', label: 'Todas', variant: 'default' as const },
  { valor: Categoria.CLOUD, label: 'Cloud', variant: 'software' as const },
  { valor: Categoria.INFRA, label: 'Infraestructura TI', variant: 'software' as const },
  { valor: Categoria.HARDWARE, label: 'Hardware y Equipos TI', variant: 'hardware' as const },
  { valor: Categoria.REDES_SEGURIDAD, label: 'Redes y Seguridad', variant: 'security' as const },
  { valor: Categoria.SOFTWARE, label: 'Software y Licencias', variant: 'networks' as const },
  { valor: Categoria.SERVICIOS, label: 'Servicios TI', variant: 'services' as const },
  { valor: Categoria.TELECOM, label: 'Telecomunicaciones', variant: 'general' as const },
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
