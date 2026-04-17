/**
 * Tipos de datos para Licitaciones
 */

export enum Categoria {
  SOFTWARE = 'Software/Sistemas',
  HARDWARE = 'Hardware/Equipos',
  REDES = 'Redes/Telecomunicaciones',
  SEGURIDAD = 'Seguridad TI',
  SERVICIOS = 'Servicios TI',
  GENERAL = 'Tecnología General',
}

export type CategoriaTI = keyof typeof Categoria

export interface Licitacion {
  id: string
  codigoExterno: string
  nombre: string
  descripcion?: string
  estado: string
  codigoEstado: number
  fechaCierre?: Date | null
  fechaCreacion?: Date | null
  fechaPublicacion?: Date | null
  moneda?: string | null
  montoEstimado?: number | null
  categoria: string
  compradorNombre?: string | null
  compradorOrganismo?: string | null
  compradorUnidad?: string | null
  compradorRut?: string | null
  compradorCodigoUnidad?: string | null
  compradorRegion?: string | null
  compradorComuna?: string | null
  compradorDireccion?: string | null
  usuarioNombre?: string | null
  usuarioCargo?: string | null
  usuarioEmail?: string | null
  usuarioRut?: string | null
  tipoLicitacion?: string | null
  codigoTipo?: number | null
  itemsCantidad: number
  etapas: number
  urlApiMercado?: string | null
  fechaSincronizacion: Date
  creadoEn: Date
  actualizadoEn: Date
  items?: ItemLicitacion[]
  analisisIA?: AnalisisIA[]
}

export interface ItemLicitacion {
  id: string
  licitacionId: string
  correlativo: number
  nombreProducto: string
  descripcion?: string | null
  unidadMedida: string
  cantidad: number
  codigoProducto?: number | null
  codigoCategoria?: string | null
  creadoEn: Date
}

export interface AnalisisIA {
  id: string
  licitacionId: string
  tipoAnalisis: string
  contenido: string
  metadata?: Record<string, unknown> | null
  creadoEn: Date
}

/**
 * Datos para filtros
 */
export interface FiltrosLicitacion {
  categoria?: Categoria | 'todas'
  busqueda?: string
  estado?: string
  ordenarPor?: 'fechaCierre' | 'nombre'
}

/**
 * Respuesta de estadísticas
 */
export interface EstadisticasLicitacion {
  totalActivas: number
  totalTI: number
  cierranHoy: number
  cierranEn7Dias: number
  porCategoria: Record<Categoria, number>
}

/**
 * Resultado de clasificación automática
 */
export interface ResultadoClasificacion {
  licitacionId: string
  categoriaPrincipal: Categoria
  confianza: number
  razon: string
}
