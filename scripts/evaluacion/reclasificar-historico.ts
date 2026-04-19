/**
 * Reclasifica todas las licitaciones existentes con el nuevo prompt Ollama.
 *
 * Uso:
 *   # Preview sin escribir (default):
 *   npx dotenv -e .env.local -- tsx scripts/evaluacion/reclasificar-historico.ts
 *
 *   # Aplicar cambios a BD (requiere confirmación explícita):
 *   npx dotenv -e .env.local -- tsx scripts/evaluacion/reclasificar-historico.ts --apply
 *
 *   # Opciones:
 *   --concurrencia=N  (default 3)
 *   --limite=N        (procesa solo N registros, útil para pruebas)
 *
 * Reanudable: mantiene progreso en data/reclasificacion-progreso.json.
 * Backup: antes de aplicar crea data/reclasificacion-backup-{fecha}.json
 * con categoría + confianza originales, para poder revertir.
 */

import { db } from '../../src/lib/api/db'
import { clasificarConOllama, isOllamaAvailable } from '../../src/lib/api/ollama'
import * as fs from 'fs'
import * as path from 'path'

interface Args {
  apply: boolean
  concurrencia: number
  limite: number | null
}

function parseArgs(): Args {
  const argv = process.argv.slice(2)
  const apply = argv.includes('--apply')
  const conc = argv.find((a) => a.startsWith('--concurrencia='))?.split('=')[1]
  const lim = argv.find((a) => a.startsWith('--limite='))?.split('=')[1]
  return {
    apply,
    concurrencia: conc ? parseInt(conc, 10) : 3,
    limite: lim ? parseInt(lim, 10) : null,
  }
}

interface BackupEntry {
  codigoExterno: string
  categoria: string
  confianzaClasificacion: number | null
}

interface ProgresoFile {
  fecha: string
  procesados: string[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const PROGRESO_FILE = path.join(DATA_DIR, 'reclasificacion-progreso.json')

function cargarProgreso(): Set<string> {
  if (!fs.existsSync(PROGRESO_FILE)) return new Set()
  try {
    const raw = JSON.parse(fs.readFileSync(PROGRESO_FILE, 'utf-8')) as ProgresoFile
    return new Set(raw.procesados)
  } catch {
    return new Set()
  }
}

function guardarProgreso(procesados: Set<string>) {
  const data: ProgresoFile = {
    fecha: new Date().toISOString(),
    procesados: Array.from(procesados),
  }
  fs.writeFileSync(PROGRESO_FILE, JSON.stringify(data, null, 2))
}

function formatDuracion(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}h${m % 60}m` : `${m}m${s % 60}s`
}

async function main() {
  const args = parseArgs()

  console.log('🔄 Reclasificación histórica con Ollama')
  console.log('='.repeat(70))
  console.log(`  Modo: ${args.apply ? '✏️  APPLY (escribirá a BD)' : '👁️  DRY-RUN (solo preview)'}`)
  console.log(`  Concurrencia: ${args.concurrencia}`)
  if (args.limite) console.log(`  Límite: ${args.limite}`)

  if (!(await isOllamaAvailable())) {
    console.error('❌ Ollama no disponible')
    process.exit(1)
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

  const yaProcesados = cargarProgreso()
  if (yaProcesados.size > 0) {
    console.log(`  Reanudando: ${yaProcesados.size} ya procesados`)
  }

  // Cargar todos los códigos a procesar
  const total = await db.licitacion.count()
  console.log(`  Total en BD: ${total}`)

  const licitaciones = await db.licitacion.findMany({
    select: {
      codigoExterno: true,
      nombre: true,
      descripcion: true,
      categoria: true,
      confianzaClasificacion: true,
      items: { select: { nombreProducto: true }, take: 5 },
    },
    orderBy: { id: 'asc' },
    ...(args.limite ? { take: args.limite } : {}),
  })

  const pendientes = licitaciones.filter((l) => !yaProcesados.has(l.codigoExterno))
  console.log(`  Pendientes: ${pendientes.length}`)

  if (pendientes.length === 0) {
    console.log('✅ Nada que hacer')
    await db.$disconnect()
    return
  }

  // Si es apply: crear backup antes de tocar nada
  let backupFile: string | null = null
  if (args.apply && yaProcesados.size === 0) {
    backupFile = path.join(DATA_DIR, `reclasificacion-backup-${Date.now()}.json`)
    const backup: BackupEntry[] = licitaciones.map((l) => ({
      codigoExterno: l.codigoExterno,
      categoria: l.categoria,
      confianzaClasificacion: l.confianzaClasificacion,
    }))
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2))
    console.log(`  💾 Backup en ${backupFile}`)
  }

  console.log('='.repeat(70))

  const inicio = Date.now()
  const cambios: Record<string, Record<string, number>> = {}
  let procesados = 0
  let errores = 0
  let cambiosCategoria = 0

  // Procesar en lotes concurrentes
  for (let i = 0; i < pendientes.length; i += args.concurrencia) {
    const lote = pendientes.slice(i, i + args.concurrencia)

    await Promise.all(
      lote.map(async (lic) => {
        try {
          const resultado = await clasificarConOllama(
            lic.nombre,
            lic.descripcion ?? undefined,
            lic.items.map((it) => it.nombreProducto)
          )

          const cambio = resultado.categoria !== lic.categoria
          if (cambio) cambiosCategoria++

          // Track transiciones
          const origen = lic.categoria
          const destino = resultado.categoria
          if (!cambios[origen]) cambios[origen] = {}
          cambios[origen][destino] = (cambios[origen][destino] || 0) + 1

          if (args.apply) {
            await db.licitacion.update({
              where: { codigoExterno: lic.codigoExterno },
              data: {
                categoria: resultado.categoria,
                confianzaClasificacion: resultado.confianza,
              },
            })
          }

          yaProcesados.add(lic.codigoExterno)
          procesados++
        } catch (err) {
          errores++
          console.error(`\n❌ ${lic.codigoExterno}: ${err instanceof Error ? err.message : String(err)}`)
        }
      })
    )

    // Persistir progreso cada 50 procesados
    if (procesados % 50 === 0 || i + args.concurrencia >= pendientes.length) {
      guardarProgreso(yaProcesados)
    }

    // ETA
    const transcurrido = Date.now() - inicio
    const velocidad = procesados / (transcurrido / 1000)
    const restante = (pendientes.length - procesados) / velocidad
    process.stdout.write(
      `\r  ${procesados}/${pendientes.length} | cambios: ${cambiosCategoria} | errores: ${errores} | ${velocidad.toFixed(1)} reg/s | ETA ${formatDuracion(restante * 1000)}      `
    )
  }

  guardarProgreso(yaProcesados)

  const duracion = Date.now() - inicio
  console.log('\n' + '='.repeat(70))
  console.log(`✅ Completado en ${formatDuracion(duracion)}`)
  console.log(`   Procesados: ${procesados} | Cambios de categoría: ${cambiosCategoria} | Errores: ${errores}`)

  console.log('\n📊 Matriz de transiciones (origen → destino):')
  for (const [origen, destinos] of Object.entries(cambios)) {
    const total = Object.values(destinos).reduce((a, b) => a + b, 0)
    console.log(`\n  ${origen} (${total})`)
    const ordenado = Object.entries(destinos).sort((a, b) => b[1] - a[1])
    for (const [destino, count] of ordenado) {
      const flag = destino === origen ? '  (sin cambio)' : ''
      console.log(`    → ${destino}: ${count}${flag}`)
    }
  }

  if (!args.apply) {
    console.log('\n⚠️  Modo DRY-RUN: no se escribió nada a BD.')
    console.log('   Para aplicar: agregar --apply')
  } else if (backupFile) {
    console.log(`\n💾 Backup disponible en: ${backupFile}`)
  }

  await db.$disconnect()
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
