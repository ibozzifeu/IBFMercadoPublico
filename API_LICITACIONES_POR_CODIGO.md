# API Mercado Público - Obtener Licitación por Código

## Descripción

Endpoint para obtener información **completa y detallada** de una licitación específica por su código. Retorna todos los campos disponibles incluyendo información del comprador, fechas, contrato, pagos e items.

---

## Endpoint

**Método HTTP:** `GET`

**Formato JSON:**
```
http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=[codigo]&ticket=[ticket]
```

**Formato XML:**
```
http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.xml?codigo=[codigo]&ticket=[ticket]
```

**Formato JSONP:**
```
http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.jsonp?codigo=[codigo]&ticket=[ticket]
```

---

## Parámetros

| Parámetro | Tipo | Obligatorio | Descripción | Ejemplo |
|-----------|------|-------------|-------------|---------|
| `codigo` | string | Sí | Código de la licitación a consultar | 1000-4-LE26 |
| `ticket` | string | Sí | Token de autenticación válido | YOUR_TOKEN |

---

## Respuesta - Estructura Completa

### Nivel Raíz

```json
{
    "Cantidad": 1,
    "FechaCreacion": "2026-04-17T16:02:49.437698Z",
    "Version": "v1",
    "Listado": [...]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Cantidad` | entero | Número de resultados (siempre 1 en búsqueda por código) |
| `FechaCreacion` | datetime | Fecha y hora de la consulta (UTC) |
| `Version` | string | Versión del API (v1) |
| `Listado` | array | Arreglo con información de la licitación |

---

## Estructura de Datos Completa

### Información Básica

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `CodigoExterno` | string | Código único de la licitación |
| `Nombre` | string | Nombre/título de la licitación |
| `CodigoEstado` | entero | Código del estado actual |
| `Estado` | string | Nombre del estado (Publicada, Cerrada, Adjudicada, etc.) |
| `Descripcion` | string | Descripción detallada del objeto de contratación |
| `FechaCierre` | datetime | Fecha y hora de cierre de recepción de ofertas |

### Información del Comprador (Organismo)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Comprador/CodigoOrganismo` | string | Código de la institución pública |
| `Comprador/NombreOrganismo` | string | Nombre de la institución |
| `Comprador/RutUnidad` | string | RUT de la institución |
| `Comprador/CodigoUnidad` | string | Código de la unidad de compra |
| `Comprador/NombreUnidad` | string | Nombre de la unidad de compra |
| `Comprador/DireccionUnidad` | string | Dirección física de la unidad |
| `Comprador/ComunaUnidad` | string | Comuna de ubicación |
| `Comprador/RegionUnidad` | string | Región de ubicación |
| `Comprador/RutUsuario` | string | RUT del usuario responsable |
| `Comprador/CodigoUsuario` | string | Código único del usuario |
| `Comprador/NombreUsuario` | string | Nombre completo del usuario |
| `Comprador/CargoUsuario` | string | Cargo/puesto del usuario |

### Información de Clasificación

| Campo | Tipo | Valores | Descripción |
|-------|------|--------|-------------|
| `Tipo` | string | L1, LE, LP, LQ, LR, E2, CO, B2, H2, I2, LS | Tipo de licitación |
| `CodigoTipo` | entero | 1=Pública, 2=Privada | Clasificación pública/privada |
| `TipoConvocatoria` | string | 1=Abierto, 0=Cerrado | Tipo de participación |
| `Moneda` | string | CLP, CLF, USD, UTM, EUR | Moneda de la licitación |
| `Informada` | bit | 0=No, 1=Sí | Si es licitación informada |

### Información de Etapas y Tiempos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Etapas` | entero | Número de etapas (1 o 2) |
| `EstadoEtapas` | string | Estado de aperturas realizadas [0,1,2] |
| `DiasCierreLicitacion` | string | Días restantes para el cierre |
| `Tiempo` | string | Tiempo de evaluación (número) |
| `UnidadTiempo` | string | Unidad del tiempo (-1, 1=Horas, 2=Días, 3=Semanas, 4=Meses, 5=Años) |

### Información de Contrato

| Campo | Tipo | Valores | Descripción |
|-------|------|--------|-------------|
| `Contrato` | string | 1=Requiere subscripción, 2=Formaliza con OC | Tipo de contrato |
| `UnidadTiempoDuracionContrato` | entero | 1=Horas, 2=Días, 3=Semanas, 4=Meses, 5=Años | Unidad de duración |
| `TiempoDuracionContrato` | string | Número | Duración del contrato |
| `TipoDuracionContrato` | string | Nombre del período | Nombre descriptivo |
| `EsRenovable` | entero | 0=No, 1=Sí | Si permite renovación |
| `ValorTiempoRenovacion` | string | Número | Valor de renovación |
| `PeriodoTiempoRenovacion` | string | Texto | Período de renovación |
| `SubContratacion` | string | 0=No permitida, 1=Permitida | Permite subcontratación |
| `ProhibicionContratacion` | string | Descripción | Restricciones de contratación |

### Información Monetaria y Financiera

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `MontoEstimado` | float | Monto estimado (puede ser null) |
| `VisibilidadMonto` | entero | 1=Público, 0=No público |
| `Estimacion` | entero | 1=Presupuesto, 2=Referencial, 3=No estimable |
| `FuenteFinanciamiento` | string | Origen del financiamiento |
| `JustificacionMontoEstimado` | string | Justificación del monto |

### Información de Pagos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Modalidad` | entero | Tipo de modalidad de pago (1-10) |
| `TipoPago` | string | Tipo de pago a realizar |
| `NombreResponsablePago` | string | Nombre del responsable del pago |
| `EmailResponsablePago` | string | Email de contacto para pagos |

### Personas de Contacto

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `NombreResponsableContrato` | string | Responsable contractual |
| `EmailResponsableContrato` | string | Email contractual |
| `FonoResponsableContrato` | string | Teléfono de contacto |

### Información Adicional

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Obras` | entero | 0=No, 2=Sí | Si es licitación de obras |
| `CantidadReclamos` | entero | Número de reclamos recibidos |
| `TomaRazon` | string | 0=No, 1=Sí | Requiere toma de razón |
| `EstadoPublicidadOfertas` | entero | Estado de publicidad de ofertas |
| `JustificacionPublicidad` | string | Justificación de publicidad |
| `ExtensionPlazo` | entero | 0=No, 1=Sí | Si se extendió el plazo |
| `EsBaseTipo` | entero | 0=No, 1=Sí | Creada desde licitación tipo |
| `CodigoBIP` | string | Código BIP si aplica |

### Fechas Clave

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Fechas/FechaCreacion` | datetime | Fecha de creación de la licitación |
| `Fechas/FechaCierre` | datetime | Fecha de cierre de recepción |
| `Fechas/FechaInicio` | datetime | Inicio del período de consultas/foro |
| `Fechas/FechaFinal` | datetime | Cierre del período de consultas/foro |
| `Fechas/FechaPubRespuestas` | datetime | Publicación de respuestas a consultas |
| `Fechas/FechaActoAperturaTecnica` | datetime | Apertura de ofertas técnicas |
| `Fechas/FechaActoAperturaEconomica` | datetime | Apertura de ofertas económicas |
| `Fechas/FechaPublicacion` | datetime | Fecha de publicación oficial |
| `Fechas/FechaAdjudicacion` | datetime | Fecha de adjudicación |
| `Fechas/FechaEstimadaAdjudicacion` | datetime | Fecha estimada de adjudicación |
| `Fechas/FechaSoporteFisico` | datetime | Fecha de soporte físico |
| `Fechas/FechaTiempoEvaluacion` | datetime | Fecha de evaluación |
| `Fechas/FechaEstimadaFirma` | datetime | Fecha estimada de firma |
| `Fechas/FechasUsuario` | datetime | Fechas adicionales definidas por usuario |
| `Fechas/FechaVisitaTerreno` | datetime | Fecha de visita a terreno |
| `Fechas/FechaEntregaAntecedentes` | datetime | Fecha de entrega de antecedentes |

### Dirección y Ubicación

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `DireccionVisita` | string | Dirección para visita a terreno |
| `DireccionEntrega` | string | Dirección de entrega |

### Items/Productos y Servicios

```json
"Items": {
    "Cantidad": 2,
    "Listado": [
        {
            "Correlativo": 1,
            "CodigoProducto": 25172503,
            "CodigoCategoria": "25172500",
            "Categoria": "Vehículos y equipamiento / Componentes / Neumáticos",
            "NombreProducto": "Neumáticos para camiones pesados",
            "Descripcion": "Especificación técnica detallada",
            "UnidadMedida": "Unidad",
            "Cantidad": 20.0,
            "Adjudicacion": null
        }
    ]
}
```

#### Campos de Items

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Correlativo` | entero | Número secuencial del item |
| `CodigoProducto` | entero | Código UNSPSC del producto |
| `CodigoCategoria` | string | Código UNSPSC de categoría |
| `Categoria` | string | Nombre completo de categoría UNSPSC |
| `NombreProducto` | string | Nombre del producto/servicio |
| `Descripcion` | string | Descripción técnica detallada |
| `UnidadMedida` | string | Unidad de medida (Unidad, Kilogramo, etc.) |
| `Cantidad` | float | Cantidad solicitada |
| `Adjudicacion` | object | Info de adjudicación (null si no adjudicada) |

#### Campos de Adjudicación (Items)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Adjudicacion/RutProveedor` | string | RUT del proveedor adjudicado |
| `Adjudicacion/NombreProveedor` | string | Nombre del proveedor |
| `Adjudicacion/CantidadAdjudicada` | string | Cantidad adjudicada |
| `Adjudicacion/MontoUnitario` | float | Precio unitario adjudicado |

### Información de Adjudicación General

```json
"Adjudicacion": {
    "Tipo": 2,
    "Fecha": "2026-05-06T19:00:00",
    "Numero": "RES-123456",
    "NumeroOferentes": 3,
    "UrlActa": "https://..."
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Adjudicacion/Tipo` | entero | 1=Autorización, 2=Resolución, 3=Acuerdo, 4=Decreto, 5=Otros |
| `Adjudicacion/Fecha` | datetime | Fecha del documento de adjudicación |
| `Adjudicacion/Numero` | string | Número del documento |
| `Adjudicacion/NumeroOferentes` | entero | Cantidad de proveedores adjudicados |
| `Adjudicacion/UrlActa` | string | Enlace al acta de adjudicación |

---

## Ejemplo de Solicitud

```bash
curl -X GET "http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=1000-4-LE26&ticket=YOUR_TICKET"
```

---

## Ejemplo de Respuesta Completa

```json
{
    "Cantidad": 1,
    "FechaCreacion": "2026-04-17T16:02:49.437698Z",
    "Version": "v1",
    "Listado": [
        {
            "CodigoExterno": "1000-4-LE26",
            "Nombre": "Suministro de neumáticos para camiones.",
            "CodigoEstado": 5,
            "Descripcion": "Necesario para dar cumplimiento a labores de Conservación y Administración Directa de la Provincia de Biobío, Región del Biobío.",
            "FechaCierre": null,
            "Estado": "Publicada",
            "Comprador": {
                "CodigoOrganismo": "7248",
                "NombreOrganismo": "MINISTERIO DE OBRAS PUBLICAS DIREC CION GRAL DE OO PP DCYF",
                "RutUnidad": "61.202.000-0",
                "CodigoUnidad": "1996",
                "NombreUnidad": "Dirección de Vialidad - VIII Región - Provincia Bio Bio",
                "DireccionUnidad": "Avda. Ricardo Vicuña Nº 243, Los Angeles",
                "ComunaUnidad": "Los Angeles",
                "RegionUnidad": "Región del Biobío",
                "RutUsuario": "",
                "CodigoUsuario": "1406365",
                "NombreUsuario": "Ghislaine Bruning Cereceda",
                "CargoUsuario": "Analista de Conservación"
            },
            "DiasCierreLicitacion": "3",
            "Informada": 0,
            "CodigoTipo": 1,
            "Tipo": "LE",
            "TipoConvocatoria": "1",
            "Moneda": "CLP",
            "Etapas": 1,
            "EstadoEtapas": "0",
            "TomaRazon": "0",
            "EstadoPublicidadOfertas": 1,
            "JustificacionPublicidad": "",
            "Contrato": "2",
            "Obras": "0",
            "CantidadReclamos": 459,
            "Fechas": {
                "FechaCreacion": "2026-04-09T16:48:08.57",
                "FechaCierre": "2026-04-20T15:10:00",
                "FechaInicio": "2026-04-09T19:15:00",
                "FechaFinal": "2026-04-15T18:00:00",
                "FechaPubRespuestas": "2026-04-16T18:00:00",
                "FechaActoAperturaTecnica": "2026-04-20T15:10:00",
                "FechaActoAperturaEconomica": "2026-04-20T15:10:00",
                "FechaPublicacion": "2026-04-09T18:12:18.353",
                "FechaAdjudicacion": "2026-05-06T19:00:00",
                "FechaEstimadaAdjudicacion": "2026-05-06T19:00:00",
                "FechaSoporteFisico": null,
                "FechaTiempoEvaluacion": null,
                "FechaEstimadaFirma": null,
                "FechasUsuario": null,
                "FechaVisitaTerreno": null,
                "FechaEntregaAntecedentes": null
            },
            "UnidadTiempoEvaluacion": null,
            "DireccionVisita": "",
            "DireccionEntrega": "",
            "Estimacion": 2,
            "FuenteFinanciamiento": "Fondo sectorial",
            "VisibilidadMonto": 0,
            "MontoEstimado": null,
            "Tiempo": "10",
            "UnidadTiempo": "-1",
            "Modalidad": 1,
            "TipoPago": "1",
            "NombreResponsablePago": "MOP, Dirección de Vialidad",
            "EmailResponsablePago": "",
            "NombreResponsableContrato": "Se dará a conocer en la resolución de adjudicación",
            "EmailResponsableContrato": "",
            "FonoResponsableContrato": "",
            "ProhibicionContratacion": "Por resguardo del interés fiscal.",
            "SubContratacion": "0",
            "UnidadTiempoDuracionContrato": 2,
            "TiempoDuracionContrato": "10",
            "TipoDuracionContrato": " ",
            "JustificacionMontoEstimado": "",
            "ObservacionContract": null,
            "ExtensionPlazo": 0,
            "EsBaseTipo": 0,
            "UnidadTiempoContratoLicitacion": "2",
            "ValorTiempoRenovacion": "0",
            "PeriodoTiempoRenovacion": " ",
            "EsRenovable": 0,
            "CodigoBIP": null,
            "Adjudicacion": null,
            "Items": {
                "Cantidad": 2,
                "Listado": [
                    {
                        "Correlativo": 1,
                        "CodigoProducto": 25172503,
                        "CodigoCategoria": "25172500",
                        "Categoria": "Vehículos y equipamiento en general / Componentes para vehículos en general / Neumáticos y cámaras de neumáticos",
                        "NombreProducto": "Neumáticos para camiones pesados",
                        "Descripcion": "NEUMÁTICO 11.00 R22.5 DIRECCIONAL CON IGUAL O SUPERIOR ÍNDICE DE CARGA 148/145/M Y 18 TELAS, de acuerdo a Especificaciones Técnicas adjuntas.",
                        "UnidadMedida": "Unidad",
                        "Cantidad": 20.0,
                        "Adjudicacion": null
                    },
                    {
                        "Correlativo": 2,
                        "CodigoProducto": 25172503,
                        "CodigoCategoria": "25172500",
                        "Categoria": "Vehículos y equipamiento en general / Componentes para vehículos en general / Neumáticos y cámaras de neumáticos",
                        "NombreProducto": "Neumáticos para camiones pesados",
                        "Descripcion": "NEUMÁTICO 11.00 R22.5 TRACCIONAL CON IGUAL O SUPERIOR ÍNDICE DE CARGA 148/145/M Y 18 TELAS, de acuerdo a Especificaciones Técnicas adjuntas.",
                        "UnidadMedida": "Unidad",
                        "Cantidad": 60.0,
                        "Adjudicacion": null
                    }
                ]
            }
        }
    ]
}
```

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Solicitud exitosa - Licitación encontrada |
| 400 | Solicitud inválida (parámetros faltantes) |
| 401 | No autorizado (ticket inválido o expirado) |
| 403 | Acceso prohibido |
| 404 | Licitación no encontrada |
| 500 | Error interno del servidor |

---

## Estados de Licitación Posibles

| Código | Estado | Descripción |
|--------|--------|-------------|
| 1 | Borrador | En preparación, no publicada |
| 2 | Publicada | Abierta para recepción de ofertas |
| 3 | Cerrada | Recepción de ofertas finalizada |
| 4 | Desierta | Sin ofertas válidas |
| 5 | Publicada | Activa |
| 6 | Adjudicada | Ganador seleccionado |
| 7 | Revocada | Cancelada |
| 8 | Suspendida | Pausada temporalmente |

---

## Ejemplos de Uso

### JavaScript/Node.js

```javascript
const ticket = 'YOUR_TICKET_HERE';
const codigo = '1000-4-LE26';

const url = `http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=${codigo}&ticket=${ticket}`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        const lic = data.Listado[0];
        console.log(`Licitación: ${lic.Nombre}`);
        console.log(`Comprador: ${lic.Comprador.NombreOrganismo}`);
        console.log(`Items: ${lic.Items.Cantidad}`);
    })
    .catch(err => console.error(err));
```

### Python

```python
import requests
import json

ticket = 'YOUR_TICKET_HERE'
codigo = '1000-4-LE26'

url = f'http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo={codigo}&ticket={ticket}'

response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    lic = data['Listado'][0]
    
    print(f"Licitación: {lic['Nombre']}")
    print(f"Estado: {lic['Estado']}")
    print(f"Comprador: {lic['Comprador']['NombreOrganismo']}")
    print(f"Items: {lic['Items']['Cantidad']}")
    
    for item in lic['Items']['Listado']:
        print(f"  - {item['NombreProducto']}: {item['Cantidad']} {item['UnidadMedida']}")
else:
    print(f"Error: {response.status_code}")
```

---

## Consideraciones Importantes

✅ **Token válido**: El `ticket` debe ser vigente  
✅ **Formato**: JSON por defecto si no se especifica  
✅ **Códigos UNSPSC**: Usa estándar v7 para productos  
✅ **Fechas null**: Campos no aplicables devuelven null  
✅ **Adjudicación**: Solo aparece cuando licitación está adjudicada  
✅ **Items detallados**: Incluye especificaciones técnicas completas  
✅ **Información completa**: Datos del comprador y responsables  
✅ **Historial de fechas**: Todas las fechas clave del proceso  

---

## Referencia Rápida de Campos Más Comunes

Para desarrollo, los campos más relevantes:

```json
{
    "CodigoExterno": "Identificador único",
    "Nombre": "Descripción de la licitación",
    "Estado": "Publicada|Cerrada|Adjudicada...",
    "FechaCierre": "Deadline para ofertas",
    "Comprador": {
        "NombreOrganismo": "Institución compradora",
        "NombreUnidad": "Unidad responsable",
        "NombreUsuario": "Contacto"
    },
    "Tipo": "LE|LP|LR...",
    "MontoEstimado": "Presupuesto",
    "Items": {
        "Cantidad": "Número de items",
        "Listado": "Productos/servicios solicitados"
    },
    "Fechas": {
        "FechaCierre": "Cierre de ofertas",
        "FechaAdjudicacion": "Resultado final"
    }
}
```

---

## Documentación Oficial

Basado en: **Diccionario de Datos - Licitaciones Api.Mercadopublico.cl**
- Sitio: https://www.mercadopublico.cl
- API Versión: v1
- Última actualización: 2026-04-17
