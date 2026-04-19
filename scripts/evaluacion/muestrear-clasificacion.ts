/**
 * Genera un reporte en markdown con muestras por categoría y banda de confianza
 * para revisión manual de errores de clasificación.
 *
 * Salida: data/evaluacion-clasificacion.md
 */

import { db } from '../../src/lib/api/db'
import * as fs from 'fs'
import * as path from 'path'

const MUESTRAS_POR_BANDA = 8

type Banda = 'alta' | 'media' | 'baja' | 'cero'

const RANGOS: Record<Banda, { min: number; max: number; label: string }> = {
  alta: { min: 70, max: 100, label: '≥70 (alta)' },
  media: { min: 40, max: 69.99, label: '40–69 (media)' },
  baja: { min: 0.01, max: 39.99, label: '1–39 (baja)' },
  cero: { min: 0, max: 0, label: '=0 (sin clasificar)' },
}

interface Fila {
  codigoExterno: string
  nombre: string
  descripcion: string | null
  categoria: string
  confianzaClasificacion: number | null
  itemsNombres: string[]
}

async function obtenerMuestra(categoria: string, banda: Banda): Promise<Fila[]> {
  const r = RANGOS[banda]
  const where =
    banda === 'cero'
      ? { categoria, confianzaClasificacion: 0 }
      : {
          categoria,
          confianzaClasificacion: { gte: r.min, lte: r.max },
        }

  const registros = await db.licitacion.findMany({
    where,
    select: {
      codigoExterno: true,
      nombre: true,
      descripcion: true,
      categoria: true,
      confianzaClasificacion: true,
      items: { select: { nombreProducto: true }, take: 5 },
    },
    take: MUESTRAS_POR_BANDA,
    orderBy: { id: 'asc' },
  })

  return registros.map((r) => ({
    ...r,
    itemsNombres: r.items.map((i) => i.nombreProducto),
  }))
}

function truncar(s: string | null, n: number): string {
  if (!s) return '—'
  const limpio = s.replace(/\s+/g, ' ').trim()
  return limpio.length > n ? limpio.slice(0, n) + '…' : limpio
}

async function main() {
  console.log('📊 Generando reporte de evaluación...')

  const categorias = await db.licitacion.groupBy({
    by: ['categoria'],
    _count: true,
    orderBy: { _count: { categoria: 'desc' } },
  })

  const lineas: string[] = []
  lineas.push('# Evaluación de Clasificación — Muestreo Manual')
  lineas.push('')
  lineas.push(`Generado: ${new Date().toISOString()}`)
  lineas.push('')
  lineas.push('## Leyenda')
  lineas.push('')
  lineas.push('- ✅ = clasificación correcta  |  ❌ = mal clasificada  |  ⚠️ = ambigua')
  lineas.push('- Marcar junto al código externo. Objetivo: detectar patrones de error.')
  lineas.push('')
  lineas.push('## Resumen por categoría')
  lineas.push('')
  lineas.push('| Categoría | Total | ≥70 | 40–69 | 1–39 | =0 |')
  lineas.push('|-----------|------:|----:|------:|-----:|---:|')

  for (const c of categorias) {
    const counts = await Promise.all(
      (['alta', 'media', 'baja', 'cero'] as Banda[]).map(async (b) => {
        const r = RANGOS[b]
        return b === 'cero'
          ? await db.licitacion.count({ where: { categoria: c.categoria, confianzaClasificacion: 0 } })
          : await db.licitacion.count({
              where: { categoria: c.categoria, confianzaClasificacion: { gte: r.min, lte: r.max } },
            })
      })
    )
    lineas.push(
      `| ${c.categoria} | ${c._count} | ${counts[0]} | ${counts[1]} | ${counts[2]} | ${counts[3]} |`
    )
  }
  lineas.push('')

  for (const c of categorias) {
    lineas.push(`---`)
    lineas.push('')
    lineas.push(`## ${c.categoria} (${c._count} total)`)
    lineas.push('')
    for (const banda of ['alta', 'media', 'baja', 'cero'] as Banda[]) {
      const muestras = await obtenerMuestra(c.categoria, banda)
      if (muestras.length === 0) continue

      lineas.push(`### Confianza ${RANGOS[banda].label} — ${muestras.length} muestras`)
      lineas.push('')
      for (const m of muestras) {
        const conf = m.confianzaClasificacion?.toFixed(0) ?? '—'
        lineas.push(`**[ ] \`${m.codigoExterno}\` — confianza ${conf}**`)
        lineas.push(`- **Nombre:** ${m.nombre}`)
        if (m.itemsNombres.length > 0) {
          lineas.push(`- **Items:** ${m.itemsNombres.slice(0, 3).join(' | ')}`)
        }
        lineas.push(`- **Descripción:** ${truncar(m.descripcion, 200)}`)
        lineas.push('')
      }
    }
  }

  const outPath = path.join(process.cwd(), 'data', 'evaluacion-clasificacion.md')
  fs.writeFileSync(outPath, lineas.join('\n'))

  console.log(`✅ Reporte generado en ${outPath}`)
  console.log(`   Total de muestras: ${categorias.length} categorías × 4 bandas × ${MUESTRAS_POR_BANDA} = hasta ${categorias.length * 4 * MUESTRAS_POR_BANDA}`)

  await db.$disconnect()
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
