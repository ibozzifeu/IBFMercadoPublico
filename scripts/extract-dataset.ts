/**
 * Script para extraer dataset de licitaciones de la BD
 * Split 70% entrenamiento, 30% prueba
 * Salida: data/train.jsonl y data/test.jsonl
 */

import { db } from '../src/lib/api/db'
import { Categoria } from '../src/types/licitacion'
import * as fs from 'fs'
import * as path from 'path'

interface DatasetRecord {
  text: string
  categoria: string
}

async function extraerDataset() {
  console.log('📊 Extrayendo dataset de licitaciones...')

  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Obtener todas las licitaciones con sus items
  const licitaciones = await db.licitacion.findMany({
    where: {
      categoria: {
        not: 'Tecnología General',
      },
    },
    include: {
      items: true,
    },
    orderBy: {
      creadoEn: 'desc',
    },
  })

  console.log(`Total de licitaciones encontradas: ${licitaciones.length}`)

  // Preparar registros
  const registros: DatasetRecord[] = []
  const statsCategoria: Record<string, number> = {}

  for (const lic of licitaciones) {
    // Combinar texto: nombre + descripción + items
    const textos = [lic.nombre, lic.descripcion || '']

    if (lic.items && lic.items.length > 0) {
      textos.push(
        ...lic.items.map((item) => `${item.nombreProducto} ${item.descripcion || ''}`)
      )
    }

    const textoCompleto = textos.filter(Boolean).join(' ').trim()

    if (textoCompleto.length > 10) {
      registros.push({
        text: textoCompleto,
        categoria: lic.categoria,
      })

      // Contar por categoría
      statsCategoria[lic.categoria] = (statsCategoria[lic.categoria] || 0) + 1
    }
  }

  console.log(`\n📈 Estadísticas por categoría:`)
  Object.entries(statsCategoria).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`)
  })

  // Shuffle registros
  registros.sort(() => Math.random() - 0.5)

  // Split 70/30
  const splitIndex = Math.floor(registros.length * 0.7)
  const train = registros.slice(0, splitIndex)
  const test = registros.slice(splitIndex)

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
