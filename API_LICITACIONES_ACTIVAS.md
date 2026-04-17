# API Mercado Público - Documentación Completa

## Descripción General

API para consultar información de **Licitaciones y Órdenes de Compra** generadas en la plataforma de compras públicas de ChileCompra. Integra 850 organismos del Estado chileno y más de 118.000 proveedores.

---

## Endpoints Disponibles

### Obtener Licitaciones por Código

**Método HTTP:** `GET`

**Formatos Soportados:**

- XML: `http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.xml?codigo=[codigo]&ticket=[ticket]`
- JSON: `http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=[codigo]&ticket=[ticket]`
- JSONP: `http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.jsonp?codigo=[codigo]&ticket=[ticket]`

**Nota:** Por defecto, si no especifica formato, la respuesta es JSON.

### Obtener Licitaciones Activas

**URL:** `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=activas&ticket={{ticket}}`

---

## Parámetros Requeridos

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `codigo` | string | Condicional | Número de la licitación (para búsqueda específica) |
| `estado` | string | Condicional | Estado de las licitaciones (ej: `activas`) |
| `ticket` | string | Sí | Token de autenticación válido |

---

## Campos Disponibles en la Respuesta

### Campos de Nivel Raíz

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Cantidad` | entero | Cantidad de licitaciones encontradas |
| `FechaCreacion` | datetime | Fecha y hora de la consulta (UTC) |
| `Version` | texto | Versión del API |
| `Listado` | array | Arreglo de objetos de licitación |

### Información Básica de Licitación

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `CodigoExterno` | string | Código único de la licitación (ej: 1000-4-LE26) |
| `Nombre` | string | Nombre/descripción de la licitación |
| `CodigoEstado` | entero | Código del estado (5 = Activa) |
| `FechaCierre` | datetime | Fecha y hora de cierre |
| `Descripcion` | string | Descripción detallada u objeto de contratación |
| `Estado` | string | Nombre del estado actual |

### Información del Comprador

| Campo | Descripción |
|-------|-------------|
| `Comprador/CodigoOrganismo` | Código de la institución |
| `Comprador/NombreOrganismo` | Nombre de la institución |
| `Comprador/RutUnidad` | RUT de la institución |
| `Comprador/CodigoUnidad` | Código de la unidad de compra |
| `Comprador/NombreUnidad` | Nombre de la unidad de compra |
| `Comprador/DireccionUnidad` | Dirección de la unidad |
| `Comprador/ComunaUnidad` | Comuna de la unidad |
| `Comprador/RegionUnidad` | Región de la unidad |
| `Comprador/RutUsuario` | RUT del usuario responsable |
| `Comprador/NombreUsuario` | Nombre del usuario responsable |
| `Comprador/CargoUsuario` | Cargo del usuario responsable |

### Información de Clasificación

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `Tipo` | string | Tipo de licitación (L1, LE, LP, LQ, LR, E2, CO, B2, H2, I2, LS) |
| `CodigoTipo` | entero | 1=Pública, 2=Privada |
| `TipoConvocatoria` | entero | 1=Abierto, 0=Cerrado |
| `Moneda` | string | Código de moneda (CLP, CLF, USD, UTM, EUR) |
| `Estimacion` | entero | Tipo de estimación (1=Presupuesto, 2=Referencial, 3=No estimable) |

### Información Monetaria

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `MontoEstimado` | float | Monto estimado a licitar |
| `VisibilidadMonto` | bit | 1=Público, 0=No público |

### Información de Etapas

| Campo | Descripción |
|-------|-------------|
| `Etapas` | Número de etapas (1 o 2) |
| `EstadoEtapas` | Aperturas realizadas [1,2] |
| `DiasCierreLicitacion` | Días para el cierre |
| `TomaRazon` | 1=Con toma de razón, 0=Sin toma de razón |

### Fechas Importantes

| Campo | Descripción |
|-------|-------------|
| `Fechas/FechaCreacion` | Fecha de creación |
| `Fechas/FechaCierre` | Fecha de cierre |
| `Fechas/FechaInicio` | Inicio del foro |
| `Fechas/FechaFinal` | Cierre del foro |
| `Fechas/FechaPubRespuestas` | Publicación de respuestas |
| `Fechas/FechaActoAperturaTecnica` | Apertura técnica |
| `Fechas/FechaActoAperturaEconomica` | Apertura económica |
| `Fechas/FechaPublicacion` | Publicación inicial |
| `Fechas/FechaAdjudicacion` | Adjudicación |
| `Fechas/FechaVisitaTerreno` | Visita a terreno |
| `Fechas/FechaEntregaAntecedentes` | Entrega de antecedentes |

### Información de Contrato

| Campo | Descripción |
|-------|-------------|
| `Contrato` | 1=Requiere subscripción, 2=Formaliza con OC |
| `UnidadTiempo` | Unidad de tiempo (1=Horas, 2=Días, 3=Semanas, 4=Meses, 5=Años) |
| `TiempoDuracionContrato` | Duración del contrato (número) |
| `TipoDuracionContrato` | Nombre del período |
| `EsRenovable` | 1=Renovable, 0=No renovable |

### Información de Pagos

| Campo | Descripción |
|-------|-------------|
| `Modalidad` | Modalidad de pago (1-10) |
| `TipoPago` | Tipo de pago |
| `NombreResponsablePago` | Responsable del pago |
| `EmailResponsablePago` | Email del responsable |

### Información de Adjudicación

| Campo | Descripción |
|-------|-------------|
| `Adjudicacion/Tipo` | Tipo de documento (1=Autorización, 2=Resolución, 3=Acuerdo, 4=Decreto, 5=Otros) |
| `Adjudicacion/Fecha` | Fecha del documento |
| `Adjudicacion/Numero` | Número del documento |
| `Adjudicacion/NumeroOferentes` | Cantidad de adjudicados |
| `Adjudicacion/UrlActa` | URL del acta |

### Información de Items/Productos

| Campo | Descripción |
|-------|-------------|
| `Items/Cantidad` | Número de productos/servicios |
| `Items/Listado/Item/CodigoProducto` | Código UNSPSC |
| `Items/Listado/Item/CodigoCategoria` | Código de categoría UNSPSC |
| `Items/Listado/Item/Categoria` | Nombre de categoría |
| `Items/Listado/Item/NombreProducto` | Nombre del producto |
| `Items/Listado/Item/Descripcion` | Descripción |
| `Items/Listado/Item/UnidadMedida` | Unidad de medida |
| `Items/Listado/Item/Cantidad` | Cantidad |

---

## Códigos y Valores Especiales

### Tipos de Licitación

| Código | Descripción | Rango UTM |
|--------|-------------|-----------|
| L1 | Pública | < 100 |
| LE | Pública | 100 a 1.000 |
| LP | Pública | 1.000 a 2.000 |
| LQ | Pública | 2.000 a 5.000 |
| LR | Pública | > 5.000 |
| E2 | Privada | < 100 |
| CO | Privada | 100 a 1.000 |
| B2 | Privada | 1.000 a 2.000 |
| H2 | Privada | 2.000 a 5.000 |
| I2 | Privada | > 5.000 |
| LS | Pública | Servicios especializados |

### Unidades Monetarias

| CLP | Peso Chileno |
| CLF | Unidad de Fomento |
| USD | Dólar Americano |
| UTM | Unidad Tributaria Mensual |
| EUR | Euro |

### Modalidad de Pago

| 1 | Pago a 30 días |
| 2 | Pago a 30, 60 y 90 días |
| 3 | Pago al día |
| 4 | Pago Anual |
| 5 | Pago Bimensual |
| 6 | Pago Contra Entrega Conforme |
| 7 | Pagos Mensuales |
| 8 | Pago Por Estado de Avance |
| 9 | Pago Trimestral |
| 10 | Pago a 60 días |

### Unidades de Tiempo

| 1 | Horas |
| 2 | Días |
| 3 | Semanas |
| 4 | Meses |
| 5 | Años |

---

## Ejemplos de Uso

### cURL - Licitaciones Activas

```bash
curl -X GET "https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=activas&ticket=YOUR_TICKET_HERE"
```

### cURL - Licitación Específica

```bash
curl -X GET "http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=1000-4-LE26&ticket=YOUR_TICKET_HERE"
```

### JavaScript

```javascript
const ticket = 'YOUR_TICKET_HERE';
const url = `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=activas&ticket=${ticket}`;

fetch(url)
    .then(r => r.json())
    .then(data => console.log(`Total: ${data.Cantidad}`))
    .catch(e => console.error(e));
```

### Python

```python
import requests

ticket = 'YOUR_TICKET_HERE'
url = f'https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?estado=activas&ticket={ticket}'

response = requests.get(url)
if response.status_code == 200:
    data = response.json()
    print(f"Total: {data['Cantidad']}")
```

---

## Respuesta Ejemplo Completa

```json
{
    "Cantidad": 4289,
    "FechaCreacion": "2026-04-17T15:52:40.859739Z",
    "Version": "v1",
    "Listado": [
        {
            "CodigoExterno": "1000-4-LE26",
            "Nombre": "Suministro de neumáticos para camiones.",
            "CodigoEstado": 5,
            "FechaCierre": "2026-04-20T15:10:00",
            "Descripcion": "Se requiere suministro de neumáticos de calidad.",
            "Estado": "Activa",
            "Tipo": "LE",
            "CodigoTipo": 1,
            "TipoConvocatoria": 1,
            "Moneda": "CLP",
            "MontoEstimado": 15000000,
            "Etapas": 1
        }
    ]
}
```

---

## Códigos HTTP

| 200 | Exitosa |
| 400 | Solicitud inválida |
| 401 | No autorizado |
| 403 | Acceso prohibido |
| 500 | Error servidor |

---

## Consideraciones Importantes

- ✅ Token `ticket` debe ser válido y no expirado
- ✅ Implementar paginación para resultados grandes
- ✅ Fechas en formato ISO 8601 (UTC)
- ✅ Usar estándar UNSPSC v7 para productos
- ✅ Considerar cache de API
- ✅ Renovar ticket periódicamente

---

## Documentación Oficial

Basado en: **Diccionario de Datos - Licitaciones Api.Mercadopublico.cl**
- Sitio: https://www.mercadopublico.cl
- API Versión: v1
- Última actualización: 2026-04-17
