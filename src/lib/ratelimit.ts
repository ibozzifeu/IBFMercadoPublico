/**
 * Rate limiter con dos backends:
 *
 * - Upstash Redis (producción): sliding window, persiste entre instancias y restarts.
 *   Requiere UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN en .env.local.
 *
 * - In-memory (desarrollo / fallback): fixed window por proceso.
 *   Se activa automáticamente si las variables de Upstash no están configuradas.
 *   No funciona en despliegues multi-instancia (cada pod tiene su propio contador).
 */

import { NextRequest } from 'next/server'

// ── Extracción de IP ──────────────────────────────────────────────────────────

/**
 * Extrae la IP real del cliente priorizando `request.ip` (inyectado por el runtime de
 * Next.js/Vercel, no editable por el cliente) sobre `x-forwarded-for`.
 */
export function getClientIp(request: NextRequest): string {
  const ip = (request as NextRequest & { ip?: string }).ip
  return ip ?? request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

// ── Tipos compartidos ─────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean   // Si el request debe procesarse
  remaining: number  // Requests restantes en la ventana actual
  resetAt: number    // Timestamp (ms) cuando se reinicia el límite
}

// ── Backend in-memory (fallback) ──────────────────────────────────────────────

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>()

// Limpia entradas expiradas cada 5 minutos para evitar memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [k, e] of store) { if (now > e.resetAt) store.delete(k) }
}, 5 * 60 * 1000)

function inMemoryLimit(ip: string, max: number, windowMs: number): RateLimitResult {
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

// ── Backend Upstash Redis ─────────────────────────────────────────────────────

type UpstashLimiter = {
  limit: (id: string) => Promise<{ success: boolean; limit: number; reset: number; remaining: number }>
}

// 'unchecked' → aún no intentamos inicializar; null → no disponible; objeto → listo
let upstash: UpstashLimiter | null | 'unchecked' = 'unchecked'

async function getUpstash(): Promise<UpstashLimiter | null> {
  if (upstash !== 'unchecked') return upstash

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstash = null
    return null
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')
    upstash = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '60 s'), // sliding window es más justo que fixed
      analytics: false,
      prefix: 'mp_rl',
    }) as unknown as UpstashLimiter
    console.log('✅ Rate limiter: Upstash Redis')
  } catch (err) {
    console.warn('⚠️ Upstash no disponible, usando rate limiter en memoria:', err)
    upstash = null
  }

  return upstash
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Verifica si una IP puede realizar un request e incrementa su contador.
 *
 * Usa Upstash Redis (sliding window) si las variables de entorno están configuradas;
 * de lo contrario usa el fallback in-memory (fixed window).
 *
 * @param ip       - IP del cliente (usar getClientIp() para obtenerla)
 * @param max      - Máximo de requests por ventana (default: 10)
 * @param windowMs - Duración de la ventana en ms, solo aplica al fallback in-memory (default: 60.000)
 */
export async function checkRateLimit(ip: string, max = 10, windowMs = 60_000): Promise<RateLimitResult> {
  const limiter = await getUpstash()

  if (limiter) {
    const result = await limiter.limit(ip)
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset, // Upstash devuelve ms
    }
  }

  return inMemoryLimit(ip, max, windowMs)
}

/**
 * Construye los headers estándar de rate limiting para incluir en la respuesta HTTP.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    'Retry-After': result.allowed ? '0' : String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  }
}
