/**
 * Utilidades de fecha — seguras para cliente y servidor
 */

export function parsearFecha(fecha?: string | null): Date | null {
  if (!fecha) return null
  try {
    return new Date(fecha)
  } catch {
    return null
  }
}

export function diasHastaCierre(fechaCierre?: string | null): number | null {
  if (!fechaCierre) return null
  const fecha = parsearFecha(fechaCierre)
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  fecha.setHours(0, 0, 0, 0)
  const diferencia = fecha.getTime() - hoy.getTime()
  const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24))
  return dias >= 0 ? dias : 0
}

export function determinarUrgencia(dias: number | null): 'critica' | 'alta' | 'media' | 'baja' {
  if (dias === null) return 'baja'
  if (dias === 0) return 'critica'
  if (dias <= 3) return 'alta'
  if (dias <= 7) return 'media'
  return 'baja'
}
