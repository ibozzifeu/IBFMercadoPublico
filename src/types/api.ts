/**
 * Tipos para respuestas de APIs externas
 */

/**
 * Respuesta del API de Mercado Público
 */
export interface MercadoPublicoResponse {
  Cantidad: number
  FechaCreacion: string
  Version: string
  Listado: MercadoPublicoLicitacion[]
}

export interface MercadoPublicoLicitacion {
  CodigoExterno: string
  Nombre: string
  CodigoEstado: number
  Descripcion?: string
  FechaCierre?: string | null
  Estado?: string
  Comprador?: {
    CodigoOrganismo?: string
    NombreOrganismo?: string
    RutUnidad?: string
    CodigoUnidad?: string
    NombreUnidad?: string
    DireccionUnidad?: string
    ComunaUnidad?: string
    RegionUnidad?: string
    RutUsuario?: string
    CodigoUsuario?: string
    NombreUsuario?: string
    CargoUsuario?: string
  }
  DiasCierreLicitacion?: string | number
  Informada?: number
  CodigoTipo?: number
  Tipo?: string
  TipoConvocatoria?: string | number
  Moneda?: string
  Etapas?: number
  EstadoEtapas?: string | number
  TomaRazon?: string | number
  EstadoPublicidadOfertas?: number
  JustificacionPublicidad?: string
  Contrato?: string | number
  Obras?: string | number
  CantidadReclamos?: number
  Fechas?: {
    FechaCreacion?: string
    FechaCierre?: string
    FechaInicio?: string
    FechaFinal?: string
    FechaPubRespuestas?: string
    FechaActoAperturaTecnica?: string
    FechaActoAperturaEconomica?: string
    FechaPublicacion?: string
    FechaAdjudicacion?: string
    FechaEstimadaAdjudicacion?: string
    [key: string]: string | undefined
  }
  MontoEstimado?: number | null
  VisibilidadMonto?: number
  Items?: {
    Cantidad: number
    Listado: MercadoPublicoItem[]
  }
}

export interface MercadoPublicoItem {
  Correlativo: number
  CodigoProducto: number
  CodigoCategoria?: string
  Categoria?: string
  NombreProducto: string
  Descripcion?: string
  UnidadMedida: string
  Cantidad: number
  Adjudicacion?: unknown
}

/**
 * Respuesta de Gemini API
 */
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
  usageMetadata: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

/**
 * Respuesta de análisis IA personalizada
 */
export interface AnalisisIAResponse {
  licitacionId: string
  tipoAnalisis: 'resumen_ejecutivo' | 'perfil_proveedor' | 'puntos_atención'
  contenido: string
  tokensUsados: number
  tiempoMs: number
}

/**
 * Respuesta de sincronización
 */
export interface SyncResponse {
  exitosa: boolean
  licitacionesProcesadas: number
  licitacionesNuevas: number
  licitacionesActualizadas: number
  errores?: string[]
  duracionMs: number
}
