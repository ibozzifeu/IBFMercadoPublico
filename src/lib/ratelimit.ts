/**
 * Rate limiter en memoria — 10 requests por minuto por IP
 * Para producción con múltiples instancias usar Redis/Upstash
 */

import { NextRequest } from 'next/server'

// request.ip es inyectado por el runtime (Vercel/Next.js), no editable por el cliente
export function getClientIp(request: NextRequest): string {
  // request.ip es inyectado por Vercel/Next.js runtime, no tipado en todas las versiones
  const ip = (request as NextRequest & { ip?: string }).ip
  return ip ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  ip: string,
  max = 10,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    'Retry-After': result.allowed ? '0' : String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  }
}
