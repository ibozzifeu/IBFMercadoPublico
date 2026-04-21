import { db } from '@/lib/api/db'

const lic = await db.licitacion.findUnique({
  where: { codigoExterno: '721703-14-LE26' },
  include: { items: { take: 2 } }
})

if (lic) {
  console.log('✓ En BD:')
  console.log('  Desc:', lic.descripcion ? `${lic.descripcion.substring(0, 80)}...` : 'NULL')
  console.log('  Items:', lic.items.length)
} else {
  console.log('✗ NO encontrada')
}

process.exit(0)
