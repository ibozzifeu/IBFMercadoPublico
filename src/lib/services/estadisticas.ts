/**
 * Servicio de cálculo de estadísticas
 */

import { db } from '@/lib/api/db'
import { Categoria } from '@/types/licitacion'

/**
 * Obtener estadísticas generales
 */
export async function obtenerEstadisticas() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const en7Dias = new Date(hoy)
  en7Dias.setDate(en7Dias.getDate() + 7)

  // Queries paralelas para mejor rendimiento
  const [totalActivas, totalTI, cierranHoy, cierranEn7Dias, porCategoria] = await Promise.all([
    // Total de licitaciones activas
    db.licitacion.count({
      where: {
        estado: 'Publicada',
      },
    }),

    // Total de licitaciones TI (excluyendo Tecnología General)
    db.licitacion.count({
      where: {
        estado: 'Publicada',
        NOT: {
          categoria: 'Tecnología General',
        },
      },
    }),

    // Licitaciones que cierran hoy
    db.licitacion.count({
      where: {
        estado: 'Publicada',
        fechaCierre: {
          gte: new Date(hoy),
          lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Licitaciones que cierran en 7 días
    db.licitacion.count({
      where: {
        estado: 'Publicada',
        fechaCierre: {
          gte: hoy,
          lt: en7Dias,
        },
      },
    }),

    // Licitaciones por categoría
    db.licitacion.groupBy({
      by: ['categoria'],
      where: {
        estado: 'Publicada',
      },
      _count: {
        id: true,
      },
    }),
  ])

  // Construir objeto de categorías
  const categoriasMap: Record<string, number> = {}
  for (const categoria of Object.values(Categoria)) {
    categoriasMap[categoria] = 0
  }

  for (const { categoria, _count } of porCategoria) {
    if (categoria in categoriasMap) {
      categoriasMap[categoria] = _count.id
    }
  }

  return {
    totalActivas,
    totalTI,
    cierranHoy,
    cierranEn7Dias,
    porCategoria: categoriasMap,
  }
}

/**
 * Obtener tendencias de últimos 30 días
 */
export async function obtenerTendencias() {
  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)

  // Licitaciones creadas por día
  const licusPorDia = await db.licitacion.groupBy({
    by: ['creadoEn'],
    where: {
      creadoEn: {
        gte: hace30Dias,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      creadoEn: 'asc',
    },
  })

  // Agrupar por fecha (sin hora)
  const tendencias: Record<string, number> = {}
  for (const { creadoEn, _count } of licusPorDia) {
    const fecha = new Date(creadoEn)
    const fechaStr = fecha.toISOString().split('T')[0]
    tendencias[fechaStr] = (tendencias[fechaStr] || 0) + _count.id
  }

  return tendencias
}

/**
 * Obtener licitaciones próximas a cerrar (próximas 7 días)
 */
export async function obtenerLicitacionesProximasACerrar(limite: number = 5) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const en7Dias = new Date(hoy)
  en7Dias.setDate(en7Dias.getDate() + 7)

  return db.licitacion.findMany({
    where: {
      estado: 'Publicada',
      fechaCierre: {
        gte: hoy,
        lte: en7Dias,
      },
    },
    orderBy: {
      fechaCierre: 'asc',
    },
    take: limite,
    select: {
      id: true,
      codigoExterno: true,
      nombre: true,
      fechaCierre: true,
      categoria: true,
      compradorNombre: true,
    },
  })
}

/**
 * Obtener distribución de licitaciones por estado
 */
export async function obtenerDistribucionPorEstado() {
  const distribucion = await db.licitacion.groupBy({
    by: ['estado'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  })

  return distribucion.map(({ estado, _count }) => ({
    estado,
    cantidad: _count.id,
  }))
}

/**
 * Obtener comprador con más licitaciones abiertas
 */
export async function obtenerCompradorMasActivo(limite: number = 5) {
  const compradores = await db.licitacion.groupBy({
    by: ['compradorNombre'],
    where: {
      estado: 'Publicada',
      compradorNombre: {
        not: null,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limite,
  })

  return compradores.map(({ compradorNombre, _count }) => ({
    nombre: compradorNombre,
    cantidad: _count.id,
  }))
}
