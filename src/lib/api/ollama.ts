/**
 * Cliente para Ollama
 * Soporta GPU NVIDIA con fallback a CPU
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { Categoria } from '@/types/licitacion'

const execAsync = promisify(exec)

interface OllamaConfig {
  baseUrl: string
  hasGPU: boolean
  gpuInfo?: string
  model: string
}

interface OllamaResponse {
  response: string
  model: string
  created_at: string
  done: boolean
  total_duration?: number
}

interface ClassificationResult {
  categoria: Categoria
  confianza: number
  razon: string
  usedGPU: boolean
}

let ollamaConfig: OllamaConfig | null = null

/**
 * Detectar GPU NVIDIA disponible (async, no bloquea event loop)
 */
export async function checkNvidiaGPU(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('nvidia-smi --query-gpu=name --format=csv,noheader', {
      timeout: 5000,
    })
    const gpuName = stdout.trim().split('\n')[0]
    console.log(`✅ GPU detectada: ${gpuName}`)
    return true
  } catch {
    console.log('⚠️ No se detectó GPU NVIDIA, usando CPU')
    return false
  }
}

/**
 * Obtener info de GPU (async, no bloquea event loop)
 */
export async function getGPUInfo(): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      'nvidia-smi --query-gpu=name,memory.total --format=csv,noheader',
      { timeout: 5000 }
    )
    return stdout.trim().split('\n')[0]
  } catch {
    return null
  }
}

/**
 * Obtener configuración de Ollama (cacheada)
 */
export async function getOllamaConfig(): Promise<OllamaConfig> {
  if (ollamaConfig) return ollamaConfig

  const hasGPU = await checkNvidiaGPU()
  const gpuInfoResult = hasGPU ? await getGPUInfo() : null

  const config: OllamaConfig = {
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    hasGPU,
    gpuInfo: gpuInfoResult || undefined,
    model: process.env.OLLAMA_MODEL || 'neural-chat',
  }

  ollamaConfig = config

  console.log(`📋 Configuración Ollama:`)
  console.log(`  URL: ${config.baseUrl}`)
  console.log(`  Modelo: ${config.model}`)
  console.log(`  GPU disponible: ${config.hasGPU}`)
  if (config.gpuInfo) {
    console.log(`  ${config.gpuInfo}`)
  }

  return config
}

/**
 * Sanitizar texto antes de inyectar en prompt LLM
 * Previene prompt injection vía datos de la API de Mercado Público
 */
function sanitizarTextoPrompt(texto: string, maxChars = 500): string {
  return texto
    .replace(/[`"{}[\]]/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .substring(0, maxChars)
    .trim()
}

/**
 * Llamar a Ollama API
 */
async function callOllama(prompt: string): Promise<string> {
  const config = await getOllamaConfig()

  try {
    const response = await fetch(`${config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        stream: false,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = (await response.json()) as OllamaResponse
    return data.response.trim()
  } catch (error) {
    console.error('❌ Error llamando Ollama:', error)
    // No exponer baseUrl al cliente
    throw new Error('Clasificador ML no disponible. Usando clasificador heurístico.')
  }
}

/**
 * Clasificar licitación con Ollama
 */
export async function clasificarConOllama(
  nombre: string,
  descripcion?: string,
  items?: string[]
): Promise<ClassificationResult> {
  const config = await getOllamaConfig()

  // Sanitizar antes de inyectar en prompt (previene prompt injection)
  const textoCompleto = [
    sanitizarTextoPrompt(nombre, 200),
    sanitizarTextoPrompt(descripcion || '', 300),
    ...(items || []).slice(0, 5).map((i) => sanitizarTextoPrompt(i, 100)),
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Clasifica esta licitación de TI en UNA de estas categorías:
- Software/Sistemas
- Hardware/Equipos
- Redes/Telecomunicaciones
- Seguridad TI
- Servicios TI
- Tecnología General

Texto:
${textoCompleto}

Responde SOLO en formato JSON:
{
  "categoria": "nombre_categoria",
  "confianza": 0-100,
  "razon": "breve explicación"
}

Respuesta JSON:`

  const respuesta = await callOllama(prompt)

  // Parsear respuesta con manejo de error
  const jsonMatch = respuesta.match(/\{[\s\S]*?\}/)
  if (!jsonMatch) {
    throw new Error('Ollama no retornó JSON válido')
  }

  let parsed: { categoria?: string; confianza?: number; razon?: string }
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new Error(`Ollama retornó JSON malformado: ${jsonMatch[0].substring(0, 100)}`)
  }

  // Mapear a Categoria
  const categoriaMap: Record<string, Categoria> = {
    'Software/Sistemas': Categoria.SOFTWARE,
    'Hardware/Equipos': Categoria.HARDWARE,
    'Redes/Telecomunicaciones': Categoria.REDES,
    'Seguridad TI': Categoria.SEGURIDAD,
    'Servicios TI': Categoria.SERVICIOS,
    'Tecnología General': Categoria.GENERAL,
  }

  const categoria = categoriaMap[parsed.categoria ?? ''] ?? Categoria.GENERAL

  return {
    categoria,
    confianza: Math.min(Math.max(parsed.confianza || 0, 0), 100),
    razon: parsed.razon || 'Clasificado por modelo Ollama',
    usedGPU: config.hasGPU,
  }
}

/**
 * Health check de Ollama
 */
export async function isOllamaAvailable(): Promise<boolean> {
  const config = await getOllamaConfig()

  try {
    const response = await fetch(`${config.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}
