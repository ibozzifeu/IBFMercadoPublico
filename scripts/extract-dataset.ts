/**
 * Script para extraer dataset de licitaciones de la BD
 * Split 70% entrenamiento, 30% prueba
 * Salida: data/train.jsonl y data/test.jsonl
 */

import { db } from '../src/lib/api/db'
import * as fs from 'fs'
import * as path from 'path'

interface DatasetRecord {
  text: string
  categoria: string
}

const BATCH_SIZE = 500

async function extraerDataset() {
  console.log('📊 Extrayendo dataset de licitaciones...')

  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Leer en batches para no agotar memoria
  const registros: DatasetRecord[] = []
  const statsCategoria: Record<string, number> = {}
  let cursor: string | undefined
  let totalLeidas = 0

  do {
    // Excluir No TI y categorías legacy — Ollama solo clasifica licitaciones TI confirmadas
    const EXCLUIR = ['No TI', 'Tecnología General', 'Software/Sistemas',
      'Hardware/Equipos', 'Redes/Telecomunicaciones', 'Seguridad TI']

    const batch = await db.licitacion.findMany({
      where: { categoria: { notIn: EXCLUIR } },
      include: { items: { take: 20 } },
      orderBy: { creadoEn: 'desc' },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })

    if (batch.length === 0) break

    cursor = batch[batch.length - 1].id
    totalLeidas += batch.length
    process.stdout.write(`\r  Leyendo: ${totalLeidas} licitaciones...`)

    for (const lic of batch) {
      // Combinar texto: nombre + descripción + items
      const textos = [lic.nombre, lic.descripcion || '']

      if (lic.items && lic.items.length > 0) {
        textos.push(
          ...lic.items.map((item) => `${item.nombreProducto} ${item.descripcion || ''}`)
        )
      }

      const textoCompleto = textos.filter(Boolean).join(' ').trim()

      if (textoCompleto.length > 10) {
        registros.push({ text: textoCompleto, categoria: lic.categoria })
        statsCategoria[lic.categoria] = (statsCategoria[lic.categoria] || 0) + 1
      }
    }
  } while (true)

  console.log(`\nTotal de licitaciones leídas: ${totalLeidas}`)

  console.log(`\n📈 Estadísticas por categoría:`)
  Object.entries(statsCategoria).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`)
  })

  // Balanced sampling: limitar cada categoría al máximo de la más pequeña × 3
  // para no sesgar el modelo hacia categorías dominantes
  const porCategoria: Record<string, DatasetRecord[]> = {}
  for (const r of registros) {
    if (!porCategoria[r.categoria]) porCategoria[r.categoria] = []
    porCategoria[r.categoria].push(r)
  }

  const minSize = Math.min(...Object.values(porCategoria).map((v) => v.length))
  const maxPorCategoria = Math.max(minSize * 3, minSize) // hasta 3× el mínimo

  const registrosBalanceados: DatasetRecord[] = []
  for (const [cat, items] of Object.entries(porCategoria)) {
    const cuota = Math.min(items.length, maxPorCategoria)
    const muestra = items.sort(() => Math.random() - 0.5).slice(0, cuota)
    registrosBalanceados.push(...muestra)
    console.log(`  ${cat}: ${items.length} total → ${cuota} en dataset`)
  }

  // Shuffle final
  registrosBalanceados.sort(() => Math.random() - 0.5)

  // Split 70/30
  const splitIndex = Math.floor(registrosBalanceados.length * 0.7)
  const train = registrosBalanceados.slice(0, splitIndex)
  const test = registrosBalanceados.slice(splitIndex)

  console.log(`\n✂️ Split dataset:`)
  console.log(`  Entrenamiento (70%): ${train.length} registros`)
  console.log(`  Prueba (30%): ${test.length} registros`)

  // Guardar en formato JSONL
  const trainFile = path.join(dataDir, 'train.jsonl')
  const testFile = path.join(dataDir, 'test.jsonl')

  fs.writeFileSync(
    trainFile,
    train.map((r) => JSON.stringify(r)).join('\n')
  )

  fs.writeFileSync(testFile, test.map((r) => JSON.stringify(r)).join('\n'))

  console.log(`\n✅ Dataset guardado:`)
  console.log(`  ${trainFile}`)
  console.log(`  ${testFile}`)

  // Mostrar ejemplo
  console.log(`\n📝 Ejemplo de registro:`)
  console.log(JSON.stringify(train[0], null, 2))

  await db.$disconnect()
}

extraerDataset().catch((err) => {
  console.error('❌ Error al extraer dataset:', err)
  process.exit(1)
})
