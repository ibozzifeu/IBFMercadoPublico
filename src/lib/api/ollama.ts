/**
 * Cliente para Ollama
 * Soporta GPU NVIDIA con fallback a CPU
 */

import { execSync } from 'child_process'
import { Categoria } from '@/types/licitacion'

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
 * Detectar GPU NVIDIA disponible
 */
export async function checkNvidiaGPU(): Promise<boolean> {
  try {
    const result = execSync('nvidia-smi --query-gpu=name --format=csv,noheader', {
      encoding: 'utf-8',
      timeout: 5000,
    })
    const gpuName = result.trim().split('\n')[0]
    console.log(`✅ GPU detectada: ${gpuName}`)
    return true
  } catch {
    console.log('⚠️ No se detectó GPU NVIDIA, usando CPU')
    return false
  }
}

/**
 * Obtener info de GPU
 */
export async function getGPUInfo(): Promise<string | null> {
  try {
    const output = execSync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader', {
      encoding: 'utf-8',
      timeout: 5000,
    })
    return output.trim().split('\n')[0]
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
      signal: AbortSignal.timeout(60000), // 60s timeout
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = (await response.json()) as OllamaResponse
    return data.response.trim()
  } catch (error) {
    console.error('❌ Error llamando Ollama:', error)
    throw new Error(
      `Ollama no disponible. Asegúrate de que está corriendo en ${config.baseUrl}`
    )
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

  // Preparar contexto
  const textoCompleto = [nombre, descripcion || '', ...(items || [])]
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

  // Parsear respuesta
  const jsonMatch = respuesta.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Ollama no retornó JSON válido')
  }

  const parsed = JSON.parse(jsonMatch[0])

  // Mapear a Categoria
  const categoriaMap: Record<string, Categoria> = {
    'Software/Sistemas': Categoria.SOFTWARE,
    'Hardware/Equipos': Categoria.HARDWARE,
    'Redes/Telecomunicaciones': Categoria.REDES,
    'Seguridad TI': Categoria.SEGURIDAD,
    'Servicios TI': Categoria.SERVICIOS,
    'Tecnología General': Categoria.GENERAL,
  }

  const categoria = categoriaMap[parsed.categoria] || Categoria.GENERAL

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
