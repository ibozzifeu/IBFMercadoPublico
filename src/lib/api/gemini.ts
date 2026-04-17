/**
 * Cliente para Gemini API
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { Licitacion } from '@/types/licitacion'

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

if (!API_KEY) {
  console.warn('GEMINI_API_KEY no está configurado')
}

let client: GoogleGenerativeAI | null = null

function obtenerCliente(): GoogleGenerativeAI {
  if (!client && API_KEY) {
    client = new GoogleGenerativeAI(API_KEY)
  }
  if (!client) {
    throw new Error('Gemini API no está configurada')
  }
  return client
}

/**
 * Generar resumen ejecutivo de una licitación
 */
export async function generarResumenEjecutivo(licitacion: Licitacion): Promise<string> {
  try {
    const genAI = obtenerCliente()
    const model = genAI.getGenerativeModel({ model: MODEL })

    const prompt = `
Analiza la siguiente licitación pública y proporciona un resumen ejecutivo conciso.

**DATOS DE LA LICITACIÓN:**
- Código: ${licitacion.codigoExterno}
- Nombre: ${licitacion.nombre}
- Comprador: ${licitacion.compradorNombre || licitacion.compradorOrganismo}
- Fecha de Cierre: ${licitacion.fechaCierre?.toLocaleDateString() || 'No especificada'}
- Monto Estimado: ${licitacion.montoEstimado ? `${licitacion.montoEstimado} ${licitacion.moneda}` : 'No especificado'}
- Descripción: ${licitacion.descripcion}

**PRODUCTOS/SERVICIOS SOLICITADOS:**
${licitacion.items?.map((item) => `- ${item.nombreProducto} (${item.cantidad} ${item.unidadMedida})`).join('\n')}

Por favor, proporciona:
1. **Resumen** (máx 3 párrafos): ¿Qué busca el organismo? ¿Cuál es el objetivo principal?
2. **Perfil de Proveedor Ideal**: ¿Qué tipo de empresa debería postular? Requisitos claves.
3. **Puntos de Atención**: Riesgos identificados, requisitos críticos, consideraciones importantes.

Sé específico y basado en los datos proporcionados.
    `

    const response = await model.generateContent(prompt)
    const text = response.response.text()

    return text
  } catch (error) {
    console.error('Error al generar resumen con Gemini:', error)
    throw new Error('No se pudo generar el análisis con IA')
  }
}

/**
 * Clasificar licitación en categoría TI
 */
export async function clasificarLicitacion(licitacion: Licitacion): Promise<{
  categoria: string
  confianza: number
  razon: string
}> {
  try {
    const genAI = obtenerCliente()
    const model = genAI.getGenerativeModel({ model: MODEL })

    const prompt = `
Clasifica la siguiente licitación en UNA de estas 6 categorías de TI:

1. Software/Sistemas - ERP, CMS, software de aplicación, bases de datos, sistemas operativos
2. Hardware/Equipos - Servidores, computadoras, periféricos, dispositivos
3. Redes/Telecomunicaciones - Routers, switches, firewalls, VPN, conectividad, telefonía
4. Seguridad TI - Ciberseguridad, antivirus, backup, encriptación, compliance
5. Servicios TI - Consultoría, soporte, outsourcing, mantenimiento, capacitación
6. Tecnología General - Otros temas de TI no clasificados

**LICITACIÓN A CLASIFICAR:**
Nombre: ${licitacion.nombre}
Descripción: ${licitacion.descripcion}
Productos: ${licitacion.items?.map((i) => i.nombreProducto).join(', ')}

Responde en JSON con este formato:
{
  "categoria": "nombre de la categoría seleccionada",
  "confianza": número entre 0 y 100,
  "razon": "explicación breve de por qué se clasificó así"
}
    `

    const response = await model.generateContent(prompt)
    const text = response.response.text()

    // Parsear JSON de la respuesta
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new Error('Respuesta inválida de Gemini')
    }

    const resultado = JSON.parse(match[0])

    return {
      categoria: resultado.categoria,
      confianza: Math.min(resultado.confianza, 100),
      razon: resultado.razon,
    }
  } catch (error) {
    console.error('Error al clasificar licitación:', error)
    throw new Error('No se pudo clasificar la licitación')
  }
}

/**
 * Generar análisis de riesgos
 */
export async function generarAnalisisRiesgos(licitacion: Licitacion): Promise<string> {
  try {
    const genAI = obtenerCliente()
    const model = genAI.getGenerativeModel({ model: MODEL })

    const prompt = `
Realiza un análisis de riesgos para la siguiente licitación de TI.

**LICITACIÓN:**
- Nombre: ${licitacion.nombre}
- Comprador: ${licitacion.compradorNombre}
- Monto: ${licitacion.montoEstimado} ${licitacion.moneda}
- Descripción: ${licitacion.descripcion}

Identifica y describe:
1. **Riesgos Principales** - Dificultades técnicas, requisitos complejos, plazos apretados
2. **Desafíos Comerciales** - Presupuesto, competencia, requisitos especiales
3. **Consideraciones Legales** - Regulaciones, compliance, términos de contrato

Sé práctico y enfocado en la realidad de licitaciones públicas en Chile.
    `

    const response = await model.generateContent(prompt)
    return response.response.text()
  } catch (error) {
    console.error('Error al generar análisis de riesgos:', error)
    throw new Error('No se pudo generar análisis de riesgos')
  }
}
