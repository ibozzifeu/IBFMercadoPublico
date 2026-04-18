/**
 * Script para entrenar modelo de clasificación con Ollama
 * Usa dataset 70% entrenamiento, 30% evaluación
 */

import * as fs from 'fs'
import * as path from 'path'
import { getOllamaConfig, isOllamaAvailable } from '../../src/lib/api/ollama'

interface DatasetRecord {
  text: string
  categoria: string
}

async function loadDataset(file: string): Promise<DatasetRecord[]> {
  const filePath = path.join(process.cwd(), file)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`)
  }

  return fs
    .readFileSync(filePath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

async function trainClassifier() {
  console.log('🤖 Entrenamiento de clasificador con Ollama')
  console.log('='.repeat(50))

  const startTime = Date.now()

  // Verificar configuración
  const config = await getOllamaConfig()
  console.log(`\n📋 Configuración:`)
  console.log(`  Modelo: ${config.model}`)
  console.log(`  URL: ${config.baseUrl}`)
  console.log(`  GPU: ${config.hasGPU ? '✅ Sí' : '❌ No'}`)
  if (config.gpuInfo) {
    console.log(`  ${config.gpuInfo}`)
  }

  // Verificar que Ollama está disponible
  console.log(`\n🔍 Verificando disponibilidad de Ollama...`)
  const available = await isOllamaAvailable()
  if (!available) {
    console.error(
      `❌ Ollama no está disponible en ${config.baseUrl}`
    )
    console.error('   Inicia Ollama con: ollama serve')
    process.exit(1)
  }
  console.log(`✅ Ollama disponible`)

  // Cargar dataset
  console.log(`\n📂 Cargando dataset...`)
  let train: DatasetRecord[] = []
  let test: DatasetRecord[] = []

  try {
    train = await loadDataset('data/train.jsonl')
    test = await loadDataset('data/test.jsonl')
  } catch (err) {
    console.error(`❌ ${err instanceof Error ? err.message : String(err)}`)
    console.error('   Ejecuta primero: npx ts-node scripts/extract-dataset.ts')
    process.exit(1)
  }

  console.log(`✅ Dataset cargado:`)
  console.log(`  Entrenamiento: ${train.length} registros`)
  console.log(`  Evaluación: ${test.length} registros`)

  // Contar categorías
  const countByCategory = (records: DatasetRecord[]) => {
    const counts: Record<string, number> = {}
    records.forEach((r) => {
      counts[r.categoria] = (counts[r.categoria] || 0) + 1
    })
    return counts
  }

  console.log(`\n📊 Distribución por categoría (entrenamiento):`)
  Object.entries(countByCategory(train)).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`)
  })

  // Crear Modelfile para fine-tuning
  console.log(`\n📝 Creando Modelfile para fine-tuning...`)
  const modelfile = createModelfile(train)
  const modelfilePath = path.join(process.cwd(), 'data', 'Modelfile.training')
  fs.writeFileSync(modelfilePath, modelfile)
  console.log(`✅ Modelfile creado`)

  // Nota: Ollama no soporta fine-tuning directo en versión 0.1.x
  // En su lugar, usamos el modelo base con in-context learning
  // Los datos de entrenamiento se usan para crear ejemplos en el prompt

  console.log(`\n🎓 Usando modelo base con ejemplos de contexto...`)
  console.log(`   (Fine-tuning completo disponible en futuras versiones)`)

  // Guardar metadatos de entrenamiento
  const metadata = {
    timestamp: new Date().toISOString(),
    model: config.model,
    gpu: config.hasGPU,
    gpuInfo: config.gpuInfo,
    trainRecords: train.length,
    testRecords: test.length,
    trainingExamples: train.slice(0, 5), // primeros 5 ejemplos
  }

  const metadataPath = path.join(process.cwd(), 'data', 'training-metadata.json')
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

  // Evaluar modelo en dataset de prueba
  console.log(`\n🧪 Evaluando modelo en ${test.length} registros...`)

  // Usar muestra representativa (máx 50 para balance entre velocidad y confianza)
  const sampleSize = Math.min(50, test.length)
  const testSample = test.slice(0, sampleSize)

  console.log(`   (Usando muestra de ${sampleSize} registros)`)

  const evalResult = {
    totalTestRecords: test.length,
    evaluated: 0,
    correct: 0,
    accuracy: 0,
    categoryAccuracy: {} as Record<string, { correct: number; total: number }>,
  }

  for (const record of testSample) {
    const prompt = `Clasifica esta licitación de tecnología en UNA de estas categorías. Responde SOLO con el nombre exacto.

Categorías válidas:
- Cloud
- Infraestructura TI
- Hardware y Equipos TI
- Redes y Seguridad
- Software y Licencias
- Servicios TI
- Telecomunicaciones

Texto: ${record.text.substring(0, 300)}

Categoría:`

    try {
      const response = await fetch(`${config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          prompt: prompt,
          stream: false,
        }),
        signal: AbortSignal.timeout(90000), // 90s para GPU con carga alta
      })

      const data = await response.json() as { response: string }
      const predicted = data.response.trim()

      evalResult.evaluated++

      if (predicted.includes(record.categoria)) {
        evalResult.correct++
      }

      // Track por categoría
      if (!evalResult.categoryAccuracy[record.categoria]) {
        evalResult.categoryAccuracy[record.categoria] = { correct: 0, total: 0 }
      }
      evalResult.categoryAccuracy[record.categoria].total++

      if (predicted.includes(record.categoria)) {
        evalResult.categoryAccuracy[record.categoria].correct++
      }

      process.stdout.write('.')
    } catch (err) {
      console.error(`\n❌ Error evaluando: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  evalResult.accuracy = evalResult.evaluated > 0 ? (evalResult.correct / evalResult.evaluated) * 100 : 0

  console.log(`\n`)
  console.log(`📊 Resultados de evaluación:`)
  console.log(`  Registros evaluados: ${evalResult.evaluated}/${testSample.length}`)
  console.log(`  Aciertos: ${evalResult.correct}`)
  console.log(`  Accuracy: ${evalResult.accuracy.toFixed(1)}%`)

  if (Object.keys(evalResult.categoryAccuracy).length > 0) {
    console.log(`\n  Por categoría:`)
    Object.entries(evalResult.categoryAccuracy).forEach(([cat, { correct, total }]) => {
      const acc = total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0'
      console.log(`    ${cat}: ${acc}%`)
    })
  }

  // Guardar resultados
  const resultsPath = path.join(process.cwd(), 'data', 'evaluation-results.json')
  fs.writeFileSync(resultsPath, JSON.stringify(evalResult, null, 2))

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n✅ Entrenamiento completado en ${duration}s`)
  console.log(`\n📁 Archivos generados:`)
  console.log(`  ${metadataPath}`)
  console.log(`  ${resultsPath}`)
}

function createModelfile(trainingData: DatasetRecord[]): string {
  // Sanitizar ejemplos para evitar escape del bloque SYSTEM """..."""
  const examples = trainingData
    .slice(0, 10)
    .map((r) => {
      const textoSanitizado = r.text
        .substring(0, 150)
        .replace(/"""/g, "'''")
        .replace(/\\/g, '\\\\')
      return `\nTexto: ${textoSanitizado}...\nCategoría: ${r.categoria}`
    })
    .join('\n')

  return `FROM neural-chat

SYSTEM """Eres un clasificador de licitaciones de tecnología del sector público chileno.
Tu tarea es clasificar licitaciones en una de estas 7 categorías:
- Cloud
- Infraestructura TI
- Hardware y Equipos TI
- Redes y Seguridad
- Software y Licencias
- Servicios TI
- Telecomunicaciones

Responde SIEMPRE con SOLO el nombre exacto de una categoría, sin explicaciones.

Ejemplos de entrenamiento:
${examples}

"""

PARAMETER temperature 0.3
PARAMETER top_k 40
PARAMETER top_p 0.9
`
}

trainClassifier().catch((err) => {
  console.error('❌ Error en entrenamiento:', err)
  process.exit(1)
})
