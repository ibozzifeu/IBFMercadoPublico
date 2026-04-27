'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/comun/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/comun/Card'
import { Badge } from '@/components/comun/Badge'
import { Button } from '@/components/comun/Button'
import { Loading } from '@/components/comun/Loading'
import { Licitacion } from '@/types/licitacion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Building2, Calendar, DollarSign, FileText, ArrowLeft, Zap, Star } from 'lucide-react'
import Link from 'next/link'

export default function DetalleLicitacionPage() {
  const params = useParams()
  const codigo = params.codigo as string

  const [licitacion, setLicitacion] = useState<Licitacion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [analisisIA, setAnalisisIA] = useState<string | null>(null)
  const [esFavorita, setEsFavorita] = useState(false)
  const [toggleandoFavorito, setToggleandoFavorito] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true)
        setError(null)

        const [resDetalle, resFavoritos] = await Promise.all([
          window.fetch(`/api/licitaciones/${codigo}`),
          window.fetch('/api/favoritos'),
        ])

        if (!resDetalle.ok) {
          throw new Error('No se pudo obtener la licitación')
        }

        const data = await resDetalle.json()
        setLicitacion(data.licitacion)
        const analisisPrevio = data.licitacion?.analisisIA?.[0]?.contenido
        if (analisisPrevio) setAnalisisIA(analisisPrevio)

        if (resFavoritos.ok) {
          const dataFav = await resFavoritos.json()
          const codigos: string[] = (dataFav.licitaciones ?? []).map((l: { codigoExterno: string }) => l.codigoExterno)
          setEsFavorita(codigos.includes(codigo))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setCargando(false)
      }
    }

    cargar()
  }, [codigo])

  const handleToggleFavorito = async () => {
    if (toggleandoFavorito) return
    try {
      setToggleandoFavorito(true)
      const response = await window.fetch('/api/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoExterno: codigo }),
      })
      if (response.ok) {
        const data = await response.json()
        setEsFavorita(data.esFavorita)
      }
    } finally {
      setToggleandoFavorito(false)
    }
  }

  const handleAnalizarIA = async () => {
    if (!licitacion) return

    try {
      setAnalizando(true)
      const response = await window.fetch('/api/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licitacionId: licitacion.id }),
      })

      if (!response.ok) {
        throw new Error('Error al analizar')
      }

      const data = await response.json()
      setAnalisisIA(data.analisis?.contenido)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar')
    } finally {
      setAnalizando(false)
    }
  }

  if (cargando) {
    return (
      <>
        <Header />
        <main className='container max-w-4xl py-8'>
          <Loading message='Cargando detalles de la licitación...' />
        </main>
      </>
    )
  }

  if (error || !licitacion) {
    return (
      <>
        <Header />
        <main className='container max-w-4xl py-8'>
          <Link href='/licitaciones' className='inline-flex items-center gap-2 text-primary hover:underline mb-6'>
            <ArrowLeft className='h-4 w-4' />
            Volver
          </Link>
          <div className='p-6 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive'>
            <p className='font-semibold'>{error || 'Licitación no encontrada'}</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />

      <main className='container max-w-4xl py-8'>
        {/* Encabezado con botón volver */}
        <div className='mb-6'>
          <Link href='/licitaciones' className='inline-flex items-center gap-2 text-primary hover:underline mb-4'>
            <ArrowLeft className='h-4 w-4' />
            Volver al Listado
          </Link>

          <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
              <h1 className='text-3xl font-bold'>{licitacion.nombre}</h1>
              <p className='text-muted-foreground mt-2'>Código: {licitacion.codigoExterno}</p>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              <button
                onClick={handleToggleFavorito}
                disabled={toggleandoFavorito}
                title={esFavorita ? 'Quitar de favoritas' : 'Agregar a favoritas'}
                className='p-2 rounded hover:bg-muted transition-colors disabled:opacity-50'
              >
                <Star
                  className={`h-5 w-5 transition-colors ${esFavorita ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'}`}
                />
              </button>
              <Badge>{licitacion.categoria}</Badge>
            </div>
          </div>
        </div>

        {/* Grid de información */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
          {/* Estado */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm'>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={licitacion.estado === 'Publicada' ? 'active' : 'closed'}>{licitacion.estado}</Badge>
            </CardContent>
          </Card>

          {/* Monto */}
          {licitacion.montoEstimado && (
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm flex items-center gap-2'>
                  <DollarSign className='h-4 w-4' />
                  Monto Estimado
                </CardTitle>
              </CardHeader>
              <CardContent className='text-2xl font-bold'>
                ${licitacion.montoEstimado.toLocaleString()} {licitacion.moneda}
              </CardContent>
            </Card>
          )}

          {/* Fecha de cierre */}
          {licitacion.fechaCierre && (
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  Fecha de Cierre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='font-semibold'>{format(new Date(licitacion.fechaCierre), 'd MMMM yyyy', { locale: es })}</p>
                <p className='text-sm text-muted-foreground'>{format(new Date(licitacion.fechaCierre), 'HH:mm', { locale: es })}</p>
              </CardContent>
            </Card>
          )}

          {/* Número de items */}
          {licitacion.itemsCantidad > 0 && (
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm flex items-center gap-2'>
                  <FileText className='h-4 w-4' />
                  Productos/Servicios
                </CardTitle>
              </CardHeader>
              <CardContent className='text-2xl font-bold'>{licitacion.itemsCantidad}</CardContent>
            </Card>
          )}
        </div>

        {/* Información del comprador */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Building2 className='h-5 w-5' />
              Información del Comprador
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {licitacion.compradorNombre && (
              <div>
                <p className='text-sm text-muted-foreground'>Organismo</p>
                <p className='font-semibold'>{licitacion.compradorNombre}</p>
              </div>
            )}
            {licitacion.compradorUnidad && (
              <div>
                <p className='text-sm text-muted-foreground'>Unidad de Compra</p>
                <p className='font-semibold'>{licitacion.compradorUnidad}</p>
              </div>
            )}
            {licitacion.compradorRegion && (
              <div>
                <p className='text-sm text-muted-foreground'>Región</p>
                <p className='font-semibold'>{licitacion.compradorRegion}</p>
              </div>
            )}
            {licitacion.usuarioNombre && (
              <div>
                <p className='text-sm text-muted-foreground'>Responsable</p>
                <p className='font-semibold'>{licitacion.usuarioNombre}</p>
                {licitacion.usuarioCargo && <p className='text-sm text-muted-foreground'>{licitacion.usuarioCargo}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Descripción */}
        {licitacion.descripcion && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm whitespace-pre-wrap'>{licitacion.descripcion}</p>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        {licitacion.items && licitacion.items.length > 0 && (
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Productos y Servicios Solicitados</CardTitle>
              <CardDescription>Total: {licitacion.items.length} items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left py-2 px-2'>#</th>
                      <th className='text-left py-2 px-2'>Producto/Servicio</th>
                      <th className='text-right py-2 px-2'>Cantidad</th>
                      <th className='text-left py-2 px-2'>Unidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licitacion.items.map((item) => (
                      <tr key={item.id} className='border-b hover:bg-muted/50'>
                        <td className='py-2 px-2'>{item.correlativo}</td>
                        <td className='py-2 px-2'>
                          <div>
                            <p className='font-semibold'>{item.nombreProducto}</p>
                            {item.descripcion && <p className='text-xs text-muted-foreground line-clamp-2'>{item.descripcion}</p>}
                          </div>
                        </td>
                        <td className='py-2 px-2 text-right'>{item.cantidad.toLocaleString()}</td>
                        <td className='py-2 px-2'>{item.unidadMedida}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Análisis IA */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Zap className='h-5 w-5' />
                Análisis con IA
              </CardTitle>
              <CardDescription>Generado con Gemini</CardDescription>
            </div>
            <Button onClick={handleAnalizarIA} disabled={analizando} size='sm'>
              {analizando ? 'Analizando...' : 'Analizar'}
            </Button>
          </CardHeader>

          <CardContent>
            {analisisIA ? (
              <div className='prose prose-sm max-w-none dark:prose-invert'>
                <div className='whitespace-pre-wrap text-sm'>{analisisIA}</div>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>Haz click en &quot;Analizar&quot; para generar un análisis automático con IA</p>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  )
}
