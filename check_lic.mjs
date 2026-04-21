import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const lic = await db.licitacion.findUnique({
  where: { codigoExterno: '721703-14-LE26' },
  include: { items: { take: 2 } }
});

if (lic) {
  console.log('✓ Encontrada en BD:');
  console.log('  Descripción:', lic.descripcion ? `${lic.descripcion.substring(0, 100)}...` : 'NULL');
  console.log('  Items:', lic.items.length);
} else {
  console.log('✗ NO encontrada');
}
await db.$disconnect();
