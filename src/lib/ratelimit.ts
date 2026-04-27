/**
 * Rate limiter en memoria — 10 requests por minuto por IP.
 *
 * Limitación: el store es por proceso. En despliegues multi-instancia (varios pods),
 * cada instancia tiene su propio contador y el límite efectivo se multiplica por N instancias.
 * Para producción con múltiples instancias, reemplazar por Redis/Upstash.
 */

import { NextRequest } from 'next/server'

/**
 * Extrae la IP real del cliente priorizando `request.ip` (inyectado por el runtime de
 * Next.js/Vercel y no editable por el cliente) sobre `x-forwarded-for` (que puede ser
 * falsificado por el cliente para evadir el rate limit).
 */
export function getClientIp(request: NextRequest): string {
  // request.ip es inyectado por Vercel/Next.js runtime, no tipado en todas las versiones
  const ip = (request as NextRequest & { ip?: string }).ip
  return ip ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

interface RateLimitEntry {
  count: number   // Número de requests en la ventana actual
  resetAt: number // Timestamp (ms) cuando se reinicia el contador
}

// Clave: IP del cliente. Se limpia cada 5 minutos para evitar memory leaks.
const store = new Map<string, RateLimitEntry>()

// Limpieza periódica de entradas expiradas para que el Map no crezca indefinidamente
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  allowed: boolean   // Si el request debe procesarse
  remaining: number  // Requests restantes en la ventana actual
  resetAt: number    // Timestamp (ms) cuando se reinicia el límite
}

/**
 * Verifica si una IP puede realizar un request, e incrementa su contador.
 *
 * Implementa una ventana fija (fixed window): el contador se reinicia exactamente
 * cada `windowMs` ms desde el primer request, no desde cada request individual.
 *
 * @param ip       - IP del cliente (usar getClientIp() para obtenerla)
 * @param max      - Máximo de requests permitidos por ventana (default: 10)
 * @param windowMs - Duración de la ventana en ms (default: 60.000 = 1 minuto)
 */
export function checkRateLimit(
  ip: string,
  max = 10,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(ip)

  // Primera visita o ventana ya expirada → nueva ventana
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  // Límite alcanzado → rechazar sin incrementar
  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt }
}

/**
 * Construye los headers estándar de rate limiting para incluir en la respuesta HTTP.
 * Estos headers permiten al cliente saber cuántos requests le quedan y cuándo puede reintentar.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    'Retry-After': result.allowed ? '0' : String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  }
}
