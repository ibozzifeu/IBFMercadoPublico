/**
 * Test rápido del nuevo prompt Ollama contra casos conocidos.
 * Usa códigos marcados como falsos positivos en data/evaluacion-clasificacion.md
 * más un par de positivos reales para verificar que no rompe lo que funcionaba.
 */

import { db } from '../../src/lib/api/db'
import { clasificarConOllama, isOllamaAvailable } from '../../src/lib/api/ollama'

interface CasoTest {
  codigo: string
  categoriaEsperada: string
  tipo: 'FP' | 'TP'
  nota: string
}

const CASOS: CasoTest[] = [
  // Falsos positivos conocidos del reporte
  { codigo: '1000-4-LE26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'neumáticos' },
  { codigo: '1000-5-LE26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'filtros/parachoques' },
  { codigo: '1002772-32-LE26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'perforador amniótico' },
  { codigo: '1002772-34-LR26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'sondas pediátricas' },
  { codigo: '1020-4-LR26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'puentes MOP' },
  { codigo: '1024-16-LE26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'baños químicos' },
  { codigo: '1048-17-LP26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'alimentos' },
  { codigo: '1057049-106-LE26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'tanques agua' },
  { codigo: '1057049-95-LP26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'cintigramas' },
  { codigo: '1057055-35-LP26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'medicamentos' },
  { codigo: '1057384-57-L126', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'detergentes' },
  { codigo: '1020-13-LR26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'seguridad privada' },
  { codigo: '1057498-18-LR26', categoriaEsperada: 'No TI', tipo: 'FP', nota: 'servicio seguridad' },
  // Positivos reales (deberían seguir siendo TI)
  { codigo: '1153624-1-LP26', categoriaEsperada: 'Redes y Seguridad', tipo: 'TP', nota: 'firewalls' },
  { codigo: '1057439-49-LE26', categoriaEsperada: 'Redes y Seguridad', tipo: 'TP', nota: 'puntos de red' },
]

async function main() {
  console.log('🧪 Test del nuevo prompt Ollama')
  console.log('='.repeat(70))

  if (!(await isOllamaAvailable())) {
    console.error('❌ Ollama no disponible')
    process.exit(1)
  }

  let aciertos = 0
  let fallos = 0
  const fallosDetalle: string[] = []

  for (const caso of CASOS) {
    const lic = await db.licitacion.findUnique({
      where: { codigoExterno: caso.codigo },
      include: { items: { select: { nombreProducto: true }, take: 5 } },
    })

    if (!lic) {
      console.log(`⚠️  ${caso.codigo}: no encontrado en BD`)
      continue
    }

    try {
      const resultado = await clasificarConOllama(
        lic.nombre,
        lic.descripcion ?? undefined,
        lic.items.map((i) => i.nombreProducto)
      )

      const ok = resultado.categoria === caso.categoriaEsperada
      const icono = ok ? '✅' : '❌'
      const marca = caso.tipo === 'FP' ? '(era FP)' : '(era TP)'

      console.log(
        `${icono} ${caso.codigo} ${marca} [${caso.nota}]`
      )
      console.log(
        `   esperado=${caso.categoriaEsperada}  obtenido=${resultado.categoria}  conf=${resultado.confianza}`
      )
      if (!ok) {
        console.log(`   razón: ${resultado.razon}`)
        fallosDetalle.push(`${caso.codigo} (${caso.nota}): ${caso.categoriaEsperada} → ${resultado.categoria}`)
        fallos++
      } else {
        aciertos++
      }
    } catch (err) {
      console.log(`❌ ${caso.codigo}: error ${err instanceof Error ? err.message : String(err)}`)
      fallos++
    }
  }

  console.log('='.repeat(70))
  console.log(`Resultado: ${aciertos}/${aciertos + fallos} aciertos (${((aciertos / (aciertos + fallos)) * 100).toFixed(0)}%)`)

  if (fallosDetalle.length > 0) {
    console.log('\nFallos:')
    fallosDetalle.forEach((f) => console.log(`  - ${f}`))
  }

  await db.$disconnect()
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
