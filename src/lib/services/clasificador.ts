/**
 * Servicio de clasificación automática de licitaciones TI
 *
 * Clasifica licitaciones en 6 categorías usando palabras clave
 */

import { Categoria } from '@/types/licitacion'

/**
 * Diccionario de palabras clave por categoría
 */
const DICCIONARIO_CATEGORIAS: Record<Categoria, string[]> = {
  [Categoria.SOFTWARE]: [
    'software',
    'aplicación',
    'sistema',
    'erp',
    'cms',
    'base de datos',
    'base datos',
    'postgresql',
    'mysql',
    'oracle',
    'sql server',
    'mongo',
    'mongodb',
    'licencia',
    'programa',
    'código',
    'desarrollo',
    'app',
    'web',
    'cloud',
    'servidor virtual',
    'virtualización',
    'contenedores',
    'docker',
    'kubernetes',
    'ci/cd',
    'devops',
    'github',
    'git',
    'java',
    'python',
    'javascript',
    'nodejs',
    'react',
    'angular',
    'api',
    'integración',
  ],
  [Categoria.HARDWARE]: [
    'servidor',
    'computador',
    'computadora',
    'laptop',
    'notebook',
    'pc',
    'periférico',
    'impresora',
    'scanner',
    'monitor',
    'pantalla',
    'teclado',
    'mouse',
    'disco duro',
    'ssd',
    'memoria ram',
    'procesador',
    'cpu',
    'gpu',
    'tarjeta',
    'cable',
    'hub',
    'repetidor',
    'equipo',
    'dispositivo',
    'workstation',
    'mainframe',
  ],
  [Categoria.REDES]: [
    'red',
    'redes',
    'router',
    'switch',
    'firewall',
    'vpn',
    'conectividad',
    'internet',
    'ancho de banda',
    'fibra óptica',
    'wifi',
    'wireless',
    'lan',
    'wan',
    'ip',
    'protocolo',
    'dns',
    'dhcp',
    'módem',
    'telecomunicaciones',
    'telefonía',
    'voz ip',
    'voip',
    'pbx',
    'central telefónica',
    'sip',
    'enlace',
    'banda ancha',
  ],
  [Categoria.SEGURIDAD]: [
    'ciberseguridad',
    'seguridad',
    'antivirus',
    'antimalware',
    'firewall',
    'vpn',
    'encriptación',
    'cifrado',
    'backup',
    'respaldo',
    'recuperación',
    'disaster recovery',
    'continuidad negocio',
    'compliance',
    'normativa',
    'regulación',
    'auditoría',
    'control acceso',
    'autenticación',
    'autorización',
    'contraseña',
    'certificado',
    'ssl',
    'https',
    'tokens',
    'multi-factor',
    'mfa',
    '2fa',
    'penetration testing',
    'pen test',
    'vulnerabilidad',
    'parche',
    'update',
    'iso 27001',
    'nist',
    'pci dss',
  ],
  [Categoria.SERVICIOS]: [
    'servicio',
    'consultoría',
    'consultor',
    'asesoramiento',
    'outsourcing',
    'soporte',
    'helpdesk',
    'mantenimiento',
    'administración',
    'gestión',
    'monitoreo',
    'monitorización',
    'capacitación',
    'entrenamiento',
    'training',
    'documentación',
    'implementación',
    'instalación',
    'configuración',
    'migración',
    'actualización',
    'upgrade',
    'patch',
    'incident',
    'incidente',
    'problema',
    'soporte técnico',
    'technical support',
    'sla',
    'nivel de servicio',
    'contrato',
  ],
  [Categoria.GENERAL]: [
    'tecnología',
    'informática',
    'ti',
    'tic',
    'digital',
    'electrónico',
    'datos',
    'información',
    'comunicación',
  ],
}

/**
 * Ponderación de palabras clave (algunas pesan más que otras)
 */
const PONDERACION: Record<string, number> = {
  // Palabras muy específicas (peso alto)
  'erp': 10,
  'cms': 10,
  'vpn': 9,
  'firewall': 9,
  'antivirus': 9,
  'backup': 9,
  'router': 8,
  'switch': 8,
  'outsourcing': 8,
  'servidor': 7,
  'base de datos': 7,
  'base datos': 7,

  // Palabras genéricas (peso bajo)
  'sistema': 3,
  'servicio': 2,
  'equipo': 2,
  'dispositivo': 2,
}

/**
 * Normalizar texto para búsqueda
 */
function normalizarTexto(texto: string): string {
  return texto.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Extraer palabras clave del texto
 */
function extraerPalabras(texto: string): string[] {
  return normalizarTexto(texto).split(/[\s,.;:()]/g).filter((p) => p.length > 2)
}

/**
 * Calcular puntuación para una categoría
 */
function calcularPuntuacion(
  texto: string,
  palabravesClave: string[]
): number {
  const palabras = extraerPalabras(texto)
  let puntuacion = 0

  for (const palabra of palabras) {
    for (const palabrasClave of palabravesClave) {
      if (palabra.includes(palabrasClave)) {
        const peso = PONDERACION[palabrasClave] || 1
        puntuacion += peso
      }
    }
  }

  return puntuacion
}

/**
 * Clasificar licitación basado en palabras clave
 */
export function clasificarLicitacion(
  nombre: string,
  descripcion?: string,
  productos?: string[]
): {
  categoria: Categoria
  confianza: number
  razon: string
} {
  // Combinar todos los textos
  const textoCompleto = [
    nombre,
    descripcion || '',
    ...(productos || []),
  ]
    .filter(Boolean)
    .join(' ')

  // Calcular puntuación para cada categoría
  const puntuaciones: Record<Categoria, number> = Object.entries(DICCIONARIO_CATEGORIAS)
    .reduce((acc, [categoria, palabras]) => {
      acc[categoria as Categoria] = calcularPuntuacion(textoCompleto, palabras)
      return acc
    }, {} as Record<Categoria, number>)

  // Encontrar categoría con mayor puntuación
  const categorias = Object.entries(puntuaciones)
  const maxPuntuacion = Math.max(...categorias.map(([, p]) => p))

  if (maxPuntuacion === 0) {
    return {
      categoria: Categoria.GENERAL,
      confianza: 0,
      razon: 'No se identificaron palabras clave específicas de TI',
    }
  }

  const [categoriaPrincipal] = categorias.find(([, p]) => p === maxPuntuacion)!

  // Calcular confianza (0-100)
  // Mayor proporción de puntuación vs. total = mayor confianza
  const totalPuntuacion = categorias.reduce((sum, [, p]) => sum + p, 0)
  const confianza = Math.round((maxPuntuacion / totalPuntuacion) * 100)

  // Generar razón
  let razon = `Identificada por palabras clave: ${categoriaPrincipal}`

  return {
    categoria: categoriaPrincipal as Categoria,
    confianza: Math.min(confianza, 100),
    razon,
  }
}

/**
 * Obtener todas las categorías
 */
export function obtenerCategorias(): Categoria[] {
  return Object.values(Categoria)
}

/**
 * Obtener palabras clave de una categoría
 */
export function obtenerPalabrasClaveCategoria(categoria: Categoria): string[] {
  return DICCIONARIO_CATEGORIAS[categoria] || []
}
