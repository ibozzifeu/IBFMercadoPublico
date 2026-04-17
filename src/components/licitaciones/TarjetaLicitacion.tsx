'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/comun/Card'
import { Badge } from '@/components/comun/Badge'
import { Button } from '@/components/comun/Button'
import { Licitacion } from '@/types/licitacion'
import { diasHastaCierre, determinarUrgencia } from '@/lib/utils/fechas'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { Clock, Building2, FileText } from 'lucide-react'

interface TarjetaLicitacionProps {
  licitacion: Licitacion
}

export function TarjetaLicitacion({ licitacion }: TarjetaLicitacionProps) {
  const dias = diasHastaCierre(licitacion.fechaCierre?.toString())
  const urgencia = dias !== null ? determinarUrgencia(dias) : 'baja'

  const colorUrgencia: Record<string, string> = {
    critica: 'destructive',
    alta: 'pending',
    media: 'pending',
    baja: 'default',
  }

  const labelUrgencia: Record<string, string> = {
    critica: '¡Hoy!',
    alta: 'Urgente',
    media: 'Próximo',
    baja: 'Normal',
  }

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-base line-clamp-2'>{licitacion.nombre}</CardTitle>
            <CardDescription className='text-xs mt-1'>{licitacion.codigoExterno}</CardDescription>
          </div>
          <Badge variant={urgencia as any}>{labelUrgencia[urgencia]}</Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-3'>
        {/* Categoría y Estado */}
        <div className='flex flex-wrap gap-2'>
          <Badge variant={licitacion.categoria.toLowerCase().replace(/[/\s]/g, '') as any}>{licitacion.categoria}</Badge>
          <Badge variant={licitacion.estado === 'Publicada' ? 'active' : 'closed'}>{licitacion.estado}</Badge>
        </div>

        {/* Información principal */}
        <div className='grid grid-cols-2 gap-2 text-sm'>
          <div className='flex items-center gap-2'>
            <Building2 className='h-4 w-4 text-muted-foreground flex-shrink-0' />
            <span className='truncate text-muted-foreground'>{licitacion.compradorNombre || 'N/A'}</span>
          </div>

          {dias !== null && (
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 text-muted-foreground flex-shrink-0' />
              <span className='text-muted-foreground'>{dias} días</span>
            </div>
          )}

          {licitacion.montoEstimado && (
            <div className='text-muted-foreground'>${licitacion.montoEstimado.toLocaleString()} {licitacion.moneda}</div>
          )}

          {licitacion.itemsCantidad > 0 && (
            <div className='flex items-center gap-2'>
              <FileText className='h-4 w-4 text-muted-foreground flex-shrink-0' />
              <span className='text-muted-foreground'>{licitacion.itemsCantidad} items</span>
            </div>
          )}
        </div>

        {/* Descripción truncada */}
        {licitacion.descripcion && (
          <p className='text-xs text-muted-foreground line-clamp-2'>{licitacion.descripcion}</p>
        )}

        {/* Fecha de cierre */}
        {licitacion.fechaCierre && (
          <p className='text-xs text-muted-foreground'>
            Cierra: {format(new Date(licitacion.fechaCierre), 'd MMMM yyyy HH:mm', { locale: es })}
          </p>
        )}

        {/* Botón de detalle */}
        <Link href={`/licitaciones/${licitacion.codigoExterno}`} className='inline-block'>
          <Button variant='default' size='sm' className='w-full'>
            Ver Detalle
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
