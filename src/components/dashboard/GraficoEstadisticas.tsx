'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/comun/Card'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Categoria } from '@/types/licitacion'

interface CategoriaChartProps {
  data: Record<string, number>
}

const COLORES_CATEGORIA: Record<string, string> = {
  [Categoria.CLOUD]: '#0ea5e9',
  [Categoria.HARDWARE]: '#8b5cf6',
  [Categoria.REDES_SEGURIDAD]: '#ef4444',
  [Categoria.SOFTWARE]: '#3b82f6',
  [Categoria.SERVICIOS]: '#f59e0b',
  [Categoria.TELECOM]: '#10b981',
  [Categoria.NO_TI]: '#6b7280',
}

export function GraficoCategoriasBarras({ data }: CategoriaChartProps) {
  const chartData = Object.entries(data).map(([categoria, cantidad]) => ({
    name: categoria.replace('Tecnología General', 'General'),
    cantidad,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Licitaciones por Categoría</CardTitle>
        <CardDescription>Distribución de licitaciones activas de TI</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' angle={-45} textAnchor='end' height={80} interval={0} tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey='cantidad' fill='#3b82f6' />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function GraficoCategoriaTarta({ data }: CategoriaChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, cantidad]) => cantidad > 0)
    .map(([categoria, cantidad]) => ({
      name: categoria.replace('Tecnología General', 'General'),
      value: cantidad,
      color: COLORES_CATEGORIA[categoria] || '#6b7280',
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Categorías</CardTitle>
        <CardDescription>Proporción de licitaciones por tipo</CardDescription>
      </CardHeader>
      <CardContent className='flex justify-center'>
        <ResponsiveContainer width='100%' height={250}>
          <PieChart>
            <Pie data={chartData} cx='50%' cy='50%' labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill='#8884d8' dataKey='value'>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
