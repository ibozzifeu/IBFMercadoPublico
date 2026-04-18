/**
 * Clasificador de licitaciones TI
 *
 * Fase 1: filtro IS_TI — descarta licitaciones que no son tecnología
 * Fase 2: clasificación en 6 categorías redefinidas + peso por término
 */

import { Categoria } from '@/types/licitacion'

// ---------------------------------------------------------------------------
// Filtro IS_TI — términos que indican que NO es una licitación TI
// ---------------------------------------------------------------------------
const TERMINOS_NO_TI = [
  // Salud y medicina
  'medicamento', 'fármaco', 'farmacos', 'farmaco', 'insumo clínico', 'insumo clíni',
  'quirúrgico', 'quirurgico', 'pabellón', 'pabellon', 'cesfam', 'postas', 'hospitalari',
  'neurocirugía', 'cardiocirugía', 'oftalmología', 'hemodinamia', 'biosimilar',
  'reactivo', 'reagente', 'vacuna', 'insumo médico', 'gases clínicos', 'gas clínico',
  'catéter', 'cateter', 'sutura', 'implante', 'prótesis', 'protesis',
  // Transporte y vehículos
  'vehículo', 'vehiculo', 'motocicleta', 'camioneta', 'camión', 'camion',
  'automóvil', 'automovil', 'combustible', 'neumático', 'neumatico',
  // Construcción e infraestructura física
  'material de construcción', 'material construccion', 'obra civil', 'pavimentación',
  'construcción de', 'edificación', 'mejoramiento vial', 'mediagua', 'sede social',
  'refugio peatonal', 'reductor de velocidad',
  // Alimentos y aseo
  'alimento', 'ración', 'racion', 'cocina', 'alimentación escolar',
  'aseo y limpieza', 'limpieza de', 'limpiafosas', 'artículo de aseo',
  // Ropa y textiles
  'uniforme', 'vestuario', 'calzado', 'ropa de trabajo',
  // Otros no TI
  'material de imprenta', 'artículo promocional', 'giftcard', 'gift card',
  'maquinaria pesada', 'arriendo maquinaria', 'mupirocina', 'fosfato monopot',
]

// Términos que confirman que SÍ es TI (anchors positivos)
const ANCHORS_TI = [
  'software', 'hardware', 'notebook', 'laptop', 'servidor', 'servidor web',
  'firewall', 'vpn', 'ciberseguridad', 'antivirus', 'antimalware',
  'cloud', 'nube', 'aws', 'azure', 'gcp', 'oci', 'saas', 'paas', 'iaas',
  'datacenter', 'data center', 'hosting',
  'router', 'switch', 'fibra óptica', 'fibra optica', 'enlace dedicado',
  'telecomunicacion', 'telefonía ip', 'voip', 'pbx',
  'erp', 'crm', 'cms', 'licencia microsoft', 'licencia office', 'licencia adobe',
  'licencia autocad', 'licenciamiento', 'soporte técnico ti', 'helpdesk', 'help desk',
  'outsourcing ti', 'consultoría ti', 'consultoria ti',
  'desarrollo de software', 'desarrollo web', 'plataforma digital', 'api rest',
  'devops', 'ciberseguridad',
]

/**
 * Determina si la licitación es de tecnología
 * Retorna false si contiene términos NO TI o no tiene ningún anchor positivo TI
 */
export function esTI(nombre: string, descripcion?: string): boolean {
  const texto = `${nombre} ${descripcion || ''}`.toLowerCase()

  // Rechazar si tiene términos inequívocamente no TI
  for (const termino of TERMINOS_NO_TI) {
    if (texto.includes(termino)) return false
  }

  // Aceptar si tiene al menos un anchor positivo de TI
  for (const anchor of ANCHORS_TI) {
    if (texto.includes(anchor)) return true
  }

  // Sin evidencia suficiente → no clasificar como TI
  return false
}

// ---------------------------------------------------------------------------
// Diccionario de categorías redefinidas
// ---------------------------------------------------------------------------
const CATEGORIAS: Record<Categoria, string[]> = {
  [Categoria.CLOUD]: [
    'cloud', 'nube', 'aws', 'amazon web services',
    'azure', 'microsoft azure', 'gcp', 'google cloud', 'oci', 'oracle cloud',
    'saas', 'paas', 'iaas', 'hosting', 'host', 'alojamiento web',
    'datacenter', 'data center', 'centro de datos', 'colocation',
    'servidor virtual', 'virtualización', 'vmware', 'hyper-v',
    'kubernetes', 'docker', 'contenedor', 'microservicio',
    'storage', 'almacenamiento en nube', 'backup nube',
    'servidor', 'rack', 'ups', 'san', 'nas', 'blade',
    'infraestructura ti', 'infraestructura tecnologica',
  ],
  [Categoria.HARDWARE]: [
    'notebook', 'laptop', 'computador', 'computadora', 'pc escritorio',
    'workstation', 'equipo computacional', 'equipo de cómputo',
    'impresora', 'scanner', 'escáner', 'multifuncional',
    'monitor', 'pantalla', 'teclado', 'mouse', 'webcam',
    'disco duro', 'ssd', 'memoria ram', 'procesador', 'cpu', 'gpu',
    'tablet', 'ipad', 'equipo móvil corporativo',
    'proyector', 'datashow', 'smartboard',
    'hub', 'docking', 'docking station', 'usb',
    'periférico', 'accesorio computacional',
  ],
  [Categoria.REDES_SEGURIDAD]: [
    // Redes
    'router', 'switch', 'access point', 'punto de acceso',
    'fibra óptica', 'fibra optica', 'cableado estructurado', 'cabling',
    'red lan', 'red wan', 'red corporativa', 'conectividad',
    'enlace dedicado', 'banda ancha', 'internet',
    'wifi', 'wireless', 'antena', 'repetidor',
    'balanceador de carga', 'load balancer',
    // Seguridad TI
    'firewall', 'vpn', 'ciberseguridad', 'ciberataque',
    'antivirus', 'antimalware', 'endpoint protection',
    'cifrado', 'encriptación', 'certificado digital', 'ssl', 'tls',
    'backup', 'respaldo', 'recuperación ante desastre', 'disaster recovery',
    'siem', 'soc', 'penetration testing', 'pen test',
    'vulnerabilidad', 'parche de seguridad', 'iso 27001', 'nist',
    'autenticación multifactor', 'mfa', '2fa',
    'control de acceso', 'identity management',
  ],
  [Categoria.SOFTWARE]: [
    'erp', 'cms', 'crm', 'bi ', 'business intelligence',
    'licencia', 'licenciamiento',
    'microsoft office', 'microsoft 365', 'm365', 'office 365',
    'adobe', 'autocad', 'autodesk',
    'desarrollo de software', 'desarrollo web', 'desarrollo aplicacion',
    'plataforma digital', 'plataforma web', 'portal web',
    'api', 'integración de sistemas', 'interoperabilidad',
    'base de datos', 'postgresql', 'oracle', 'sql server', 'mysql', 'mongodb',
    'devops', 'ci/cd', 'git', 'repositorio',
    'python', 'java', 'javascript', 'nodejs', '.net',
    'sistema de gestión', 'sistema de información', 'sistema contable',
    'aplicación móvil', 'app móvil', 'ecommerce',
    'automatización', 'rpa', 'workflow',
  ],
  [Categoria.SERVICIOS]: [
    'soporte técnico', 'soporte ti', 'soporte tecnológico',
    'helpdesk', 'help desk', 'mesa de ayuda', 'mesa de servicio',
    'outsourcing ti', 'externalización ti',
    'consultoría ti', 'consultoria ti', 'consultor ti',
    'mantención software', 'mantenimiento software', 'mantención sistema',
    'implementación software', 'implantación sistema',
    'capacitación ti', 'capacitacion ti', 'formación ti',
    'administración de sistemas', 'gestión de infraestructura',
    'monitoreo de sistemas', 'monitoreo ti',
    'migración de datos', 'migración de sistemas',
    'auditoría ti', 'auditoria tecnológica',
    'sla', 'nivel de servicio',
  ],
  [Categoria.TELECOM]: [
    'telefonía', 'telefonia', 'telefonía ip', 'telefonia ip',
    'voip', 'voz sobre ip',
    'pbx', 'central telefónica', 'central telefonica',
    'sip', 'troncal sip',
    'plan de telefonía', 'plan celular corporativo',
    'servicios de telecomunicaciones', 'operador de telecomunicaciones',
    'televisión cable', 'tv cable', 'radiocomunicación',
    'comunicaciones unificadas', 'unified communications',
    'videoconferencia', 'webex', 'zoom empresarial', 'teams',
    'red de telecomunicaciones',
  ],
  [Categoria.NO_TI]: [], // se asigna cuando no pasa el filtro esTI()
}

// ---------------------------------------------------------------------------
// Ponderación por especificidad del término
// ---------------------------------------------------------------------------
const PONDERACION: Record<string, number> = {
  // Muy específicos
  'erp': 12, 'crm': 12, 'cms': 12,
  'aws': 12, 'azure': 12, 'gcp': 12, 'oci': 12,
  'saas': 11, 'paas': 11, 'iaas': 11,
  'firewall': 11, 'vpn': 11, 'ciberseguridad': 11, 'antivirus': 10,
  'datacenter': 10, 'data center': 10,
  'voip': 10, 'pbx': 10,
  'notebook': 9, 'laptop': 9,
  'router': 9, 'switch': 9,
  'fibra óptica': 9, 'fibra optica': 9,
  'helpdesk': 9, 'help desk': 9,
  // Específicos
  'cloud': 8, 'nube': 7,
  'servidor': 7, 'hosting': 8,
  'licencia': 6, 'licenciamiento': 7,
  'soporte técnico': 7,
  // Genéricos (bajo peso)
  'sistema': 2, 'servicio': 2, 'red': 3, 'internet': 3,
}

function normalizarTexto(texto: string): string {
  return texto.toLowerCase().trim().replace(/\s+/g, ' ')
}

function calcularPuntuacion(texto: string, terminos: string[]): number {
  const textoNorm = normalizarTexto(texto)
  let puntuacion = 0

  for (const termino of terminos) {
    if (textoNorm.includes(termino)) {
      const peso = PONDERACION[termino] ?? 1
      puntuacion += peso
    }
  }
  return puntuacion
}

/**
 * Clasificar licitación en las nuevas categorías
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
  const textoCompleto = [nombre, descripcion || '', ...(productos || [])]
    .filter(Boolean)
    .join(' ')

  // Fase 1: filtro IS_TI
  if (!esTI(nombre, descripcion)) {
    return {
      categoria: Categoria.NO_TI,
      confianza: 0,
      razon: 'No identificada como licitación de tecnología',
    }
  }

  // Fase 2: scoring por categoría (excluyendo NO_TI del loop)
  const categoriasAEvaluar = Object.entries(CATEGORIAS).filter(
    ([cat]) => cat !== Categoria.NO_TI
  )

  const puntuaciones = categoriasAEvaluar.reduce(
    (acc, [cat, terminos]) => {
      acc[cat as Categoria] = calcularPuntuacion(textoCompleto, terminos)
      return acc
    },
    {} as Record<Categoria, number>
  )

  const entradas = Object.entries(puntuaciones)
  const maxPuntuacion = Math.max(...entradas.map(([, p]) => p))

  if (maxPuntuacion === 0) {
    return {
      categoria: Categoria.CLOUD, // default TI sin categoría específica
      confianza: 10,
      razon: 'Licitación TI sin categoría específica identificada',
    }
  }

  const [categoriaPrincipal] = entradas.find(([, p]) => p === maxPuntuacion)!
  const totalPuntuacion = entradas.reduce((s, [, p]) => s + p, 0)
  const confianza = Math.min(Math.round((maxPuntuacion / totalPuntuacion) * 100), 100)

  return {
    categoria: categoriaPrincipal as Categoria,
    confianza,
    razon: `Clasificada por términos clave: ${categoriaPrincipal}`,
  }
}

export function obtenerCategorias(): Categoria[] {
  return Object.values(Categoria).filter((c) => c !== Categoria.NO_TI)
}

export function obtenerPalabrasClaveCategoria(categoria: Categoria): string[] {
  return CATEGORIAS[categoria] ?? []
}
