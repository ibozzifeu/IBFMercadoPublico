# Arquitectura - Aplicación MercadoPublico TI (Entorno Local)

## Visión General

Aplicación web para monitoreo y análisis de licitaciones de TI en el Mercado Público de Chile. Proporciona clasificación automática, estadísticas en tiempo real, búsqueda avanzada y análisis con IA (Gemini).

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Dashboard    │  │ Listado      │  │ Detalle      │           │
│  │ Estadísticas │  │ Licitaciones │  │ Licitación   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────────────────────────────────────┐
│                    Next.js API Routes                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ /api/        │  │ /api/        │  │ /api/        │           │
│  │ licitaciones │  │ clasificar   │  │ analizar     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────────┬──────────────────────────────────────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
┌────▼──┐ ┌───▼───┐ ┌──▼──────┐
│Prisma │ │Mercado│ │ Gemini  │
│PostgreSQL│Público│ │  API    │
│(Local)  │ API   │ │         │
└────────┘ └───────┘ └─────────┘
```

---

## 🚀 Quick Start - Entorno Local

### Requisitos Previos

- Node.js 18+ 
- npm o yarn
- PostgreSQL 14+ (o Docker)
- Git

### Pasos de Instalación

```bash
# 1. Clonar/posicionarse en el repo
cd /home/camf/camfcode/MercadoPublico

# 2. Instalar dependencias
npm install

# 3. Iniciar PostgreSQL (opción A: Docker)
docker-compose up -d

# 3. Iniciar PostgreSQL (opción B: Local instalado)
# Asegúrate de que el servicio esté corriendo
sudo service postgresql start

# 4. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu configuración

# 5. Ejecutar migraciones
npx prisma migrate dev

# 6. Generar cliente Prisma
npx prisma generate

# 7. Iniciar servidor de desarrollo
npm run dev

# 8. Abrir en navegador
# http://localhost:3000
```

### Verificación de BD

```bash
# Abrir Prisma Studio (interfaz gráfica para BD)
npx prisma studio

# Conectarse directamente con psql
psql -U usuario -d mercado_publico -h localhost
```

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|----------|
| **Frontend** | Next.js 15+ | Framework React con SSR |
| **UI** | shadcn/ui + TailwindCSS | Componentes y estilos |
| **Lenguaje** | TypeScript | Type safety |
| **Estado** | React Hooks / Zustand | State management |
| **Base de Datos** | PostgreSQL (Local) | Persistencia en BD local |
| **ORM** | Prisma | Gestión de BD y migraciones |
| **API Externa** | Mercado Público API | Fuente de licitaciones |
| **IA** | Gemini API | Análisis y resúmenes |
| **Validación** | Zod | Schema validation |
| **Testing** | Jest + React Testing Library | Tests unitarios/integración |

---

## Estructura de Carpetas

```
mercado-publico/
├── prisma/
│   ├── schema.prisma                 # Definición de modelos Prisma
│   └── migrations/                   # Migraciones de BD
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx              # Dashboard principal
│   │   │   └── layout.tsx
│   │   ├── licitaciones/
│   │   │   ├── page.tsx              # Listado de licitaciones
│   │   │   ├── [codigo]/
│   │   │   │   └── page.tsx          # Detalle de licitación
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── licitaciones/
│   │   │   │   ├── route.ts          # GET licitaciones (caché + fresh)
│   │   │   │   └── [codigo]/route.ts # GET licitación específica
│   │   │   ├── clasificar/
│   │   │   │   └── route.ts          # POST clasificar licitación
│   │   │   ├── analizar/
│   │   │   │   └── route.ts          # POST análisis con Gemini
│   │   │   └── sync/
│   │   │       └── route.ts          # POST sincronizar Mercado Público
│   │   └── layout.tsx                # Layout raíz
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── GraficoEstadisticas.tsx
│   │   │   └── ResumenTI.tsx
│   │   ├── licitaciones/
│   │   │   ├── ListadoLicitaciones.tsx
│   │   │   ├── FiltrosCategorias.tsx
│   │   │   ├── BuscaTexto.tsx
│   │   │   ├── TarjetaLicitacion.tsx
│   │   │   └── Ordenamiento.tsx
│   │   ├── detalle/
│   │   │   ├── DetalleLicitacion.tsx
│   │   │   ├── InformacionComprador.tsx
│   │   │   ├── ListaItems.tsx
│   │   │   ├── BotonAnalisisIA.tsx
│   │   │   └── ResumenIA.tsx
│   │   └── comun/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── Loading.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── mercadoPublico.ts     # Cliente API Mercado Público
│   │   │   ├── gemini.ts             # Cliente Gemini API
│   │   │   └── supabase.ts           # Cliente Supabase
│   │   ├── services/
│   │   │   ├── clasificador.ts       # Lógica de clasificación
│   │   │   ├── estadisticas.ts       # Cálculos de estadísticas
│   │   │   ├── analizador.ts         # Análisis con IA
│   │   │   └── filtros.ts            # Lógica de filtros y búsqueda
│   │   ├── utils/
│   │   │   ├── formateo.ts           # Formatos de fecha, moneda, etc.
│   │   │   ├── validacion.ts         # Schemas con Zod
│   │   │   └── constantes.ts         # Constantes globales
│   │   └── hooks/
│   │       ├── useLicitaciones.ts
│   │       ├── useFiltros.ts
│   │       ├── useEstadisticas.ts
│   │       └── useAnalisisIA.ts
│   │
│   ├── types/
│   │   ├── licitacion.ts             # Types de licitación
│   │   ├── api.ts                    # Types de API responses
│   │   ├── categoria.ts              # Types de categorías
│   │   └── estadisticas.ts           # Types de estadísticas
│   │
│   └── styles/
│       └── globals.css
│
├── public/
├── .env.local                        # Variables de entorno
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Modelos de Datos (Prisma + PostgreSQL)

### Schema Prisma

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Licitación
model Licitacion {
  id                    String   @id @default(cuid())
  codigoExterno         String   @unique
  nombre                String
  descripcion           String?
  estado                String
  codigoEstado          Int
  fechaCierre           DateTime?
  fechaCreacion         DateTime?
  fechaPublicacion      DateTime?
  moneda                String?
  montoEstimado         Float?
  
  // Clasificación
  categoria             String   @default("Tecnología General")
  
  // Información del comprador
  compradorNombre       String?
  compradorOrganismo    String?
  compradorUnidad       String?
  compradorRut          String?
  
  // Información adicional
  tipoLicitacion        String?  // L1, LE, LP, etc.
  itemsCantidad         Int      @default(0)
  urlApiMercado         String?
  
  // Relaciones
  items                 ItemLicitacion[]
  analisisIA            AnalisisIA[]
  
  // Timestamps
  fechaSincronizacion   DateTime @default(now())
  creadoEn              DateTime @default(now())
  actualizadoEn         DateTime @updatedAt

  @@index([codigoExterno])
  @@index([categoria])
  @@index([fechaCierre])
  @@index([estado])
}

// Items/Productos de una licitación
model ItemLicitacion {
  id                String   @id @default(cuid())
  licitacionId      String
  licitacion        Licitacion @relation(fields: [licitacionId], references: [id], onDelete: Cascade)
  
  correlativo       Int
  nombreProducto    String
  descripcion       String?
  unidadMedida      String
  cantidad          Float
  
  // Códigos UNSPSC
  codigoProducto    Int?
  codigoCategoria   String?
  
  creadoEn          DateTime @default(now())

  @@index([licitacionId])
}

// Análisis generado por IA
model AnalisisIA {
  id                String   @id @default(cuid())
  licitacionId      String
  licitacion        Licitacion @relation(fields: [licitacionId], references: [id], onDelete: Cascade)
  
  tipoAnalisis      String   // 'resumen_ejecutivo'
  contenido         String   @db.Text
  metadata          Json?    // { tokens_usados, tiempo_respuesta, modelo, etc }
  
  creadoEn          DateTime @default(now())

  @@unique([licitacionId, tipoAnalisis])
  @@index([licitacionId])
}

// Historial de sincronizaciones
model HistorialSincronizacion {
  id                      String   @id @default(cuid())
  fechaEjecucion          DateTime @default(now())
  licitacionesProcesadas  Int
  licitacionesNuevas      Int
  licitacionesActualizadas Int
  estado                  String   // 'exitosa', 'fallida'
  errorMensaje            String?
  duracionSegundos        Float?
}
```

### Crear la BD local

```bash
# 1. Iniciar PostgreSQL localmente (Docker recomendado)
docker run --name mercado-publico-db \
  -e POSTGRES_USER=usuario \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mercado_publico \
  -p 5432:5432 \
  -d postgres:16-alpine

# 2. Configurar .env.local
DATABASE_URL="postgresql://usuario:password@localhost:5432/mercado_publico"

# 3. Crear migraciones
npx prisma migrate dev --name init

# 4. Generar cliente Prisma
npx prisma generate

# 5. Verificar BD (opcional)
npx prisma studio
```

---

## Componentes Principales

### 1. Dashboard (Estadísticas)

**Ubicación:** `/src/components/dashboard/`

- **StatsCard**: Muestra métricas (total activas, TI, cierran hoy/7 días)
- **GraficoEstadisticas**: Gráficos de tendencias
- **ResumenTI**: Resumen de licitaciones de TI

**Datos mostrados:**
- Total de licitaciones activas
- Total de licitaciones de TI activas
- Cantidad que cierran hoy
- Cantidad que cierran en 7 días
- Distribución por categoría

### 2. Listado de Licitaciones

**Ubicación:** `/src/components/licitaciones/`

- **ListadoLicitaciones**: Contenedor principal
- **FiltrosCategorias**: 6 botones para categorías + "Todas"
- **BuscaTexto**: Input con búsqueda en tiempo real
- **TarjetaLicitacion**: Tarjeta individual de licitación
- **Ordenamiento**: Dropdown para ordenar

**Funcionalidades:**
- Filtro por categoría en tiempo real
- Búsqueda de texto libre (nombre, descripción, comprador)
- Ordenamiento por fecha de cierre (descendente = más urgentes primero)
- Ordenamiento por nombre (A-Z)
- Indicadores visuales de urgencia

### 3. Detalle de Licitación

**Ubicación:** `/src/components/detalle/`

- **DetalleLicitacion**: Layout principal
- **InformacionComprador**: Datos del organismo comprador
- **ListaItems**: Tabla de productos/servicios
- **BotonAnalisisIA**: Botón para disparar análisis
- **ResumenIA**: Muestra resultado de análisis

**Información mostrada:**
- Datos básicos: código, nombre, estado
- Fechas clave (creación, cierre, adjudicación)
- Comprador: organismo, unidad, usuario responsable
- Monto estimado y moneda
- Categoría detectada
- Listado completo de items
- Botón de análisis con IA

### 4. Clasificador Automático

**Ubicación:** `/src/lib/services/clasificador.ts`

**Categorías:**
1. Software/Sistemas
2. Hardware/Equipos
3. Redes/Telecomunicaciones
4. Seguridad TI
5. Servicios TI
6. Tecnología General

**Lógica:**
- Análisis de palabras clave en nombre, descripción, items
- Diccionarios de términos por categoría
- Puntuación ponderada
- Fallback a "Tecnología General" si no hay coincidencias claras

**Palabras clave de ejemplo:**
- **Software/Sistemas**: ERP, CMS, software, aplicación, sistema, licencia, Base de datos
- **Hardware/Equipos**: servidor, laptop, computadora, impresora, monitor, peripheral
- **Redes/Telecom**: router, switch, firewall, VPN, ancho banda, conectividad
- **Seguridad TI**: ciberseguridad, antivirus, backup, encriptación, compliance
- **Servicios TI**: consultoría, soporte, outsourcing, mantenimiento, capacitación
- **Tecnología General**: tecnología, digital, informática, TIC

---

## Flujos de Datos

### Flujo 1: Sincronización de Licitaciones

```
1. Trigger (manual o cron)
   ↓
2. API Next.js: /api/licitaciones
   ↓
3. Cliente Mercado Público API
   ↓
4. Procesar respuesta
   - Clasificar cada licitación
   - Extraer items
   ↓
5. Guardar en Supabase
   - licitaciones table
   - items_licitacion table
   ↓
6. Registrar en historial_sincronizacion
   ↓
7. Responder al cliente
```

### Flujo 2: Búsqueda y Filtrado

```
Usuario escribe en buscador
   ↓
Debounce 300ms
   ↓
Query local en estado React
   ↓
Filtrar en memoria (si < 1000 items)
ó hacer llamada API si > 1000
   ↓
Mostrar resultados en tiempo real
```

### Flujo 3: Análisis con IA

```
Usuario hace click en "Analizar con IA"
   ↓
Validar cache: ¿Análisis previo existe?
   ↓
Si existe:
   └─ Mostrar inmediatamente
      
Si no existe:
   ├─ Enviar a API: /api/analizar
   ├─ Llamar Gemini API con prompt:
   │  - Datos completos de licitación
   │  - Solicitud de: resumen, perfil de proveedor, puntos de atención
   ├─ Recibir respuesta
   ├─ Guardar en BD (analisis_ia table)
   └─ Mostrar al usuario
```

---

## APIs Externas

### Mercado Público API

```typescript
// Cliente
interface MercadoPublicoClient {
  obtenerLicitacionesActivas(ticket: string): Promise<LicitacionesResponse>
  obtenerLicitacionPorCodigo(codigo: string, ticket: string): Promise<LicitacionResponse>
}

// Endpoint
GET /servicios/v1/publico/licitaciones.json?estado=activas&ticket={{ticket}}
GET /servicios/v1/publico/licitaciones.json?codigo={{codigo}}&ticket={{ticket}}
```

### Gemini API

```typescript
// Cliente
interface GeminiClient {
  analizarLicitacion(licitacion: Licitacion): Promise<AnalisisIA>
}

// Prompt
"""
Analiza la siguiente licitación pública y proporciona:
1. Resumen ejecutivo (máx 3 párrafos): ¿Qué busca el organismo?
2. Perfil de proveedor: ¿Qué tipo de empresa podría postular?
3. Puntos de atención: Riesgos, requisitos críticos, oportunidades

[Datos completos de licitación]
"""
```

---

## Variables de Entorno

### `.env.local` (Desarrollo Local)

```bash
# ========== BASE DE DATOS (PostgreSQL Local) ==========
DATABASE_URL="postgresql://usuario:password@localhost:5432/mercado_publico"

# ========== MERCADO PÚBLICO API ==========
NEXT_PUBLIC_MP_TICKET=tu_ticket_aqui
NEXT_PUBLIC_MP_BASE_URL=https://api.mercadopublico.cl/servicios/v1/publico

# ========== GEMINI API ==========
GEMINI_API_KEY=tu_clave_aqui
GEMINI_MODEL=gemini-2.0-flash

# ========== APLICACIÓN ==========
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ========== SINCRONIZACIÓN ==========
# Intervalo de sincronización en minutos (0 = deshabilitado)
SYNC_INTERVAL_MINUTES=60
# Cantidad máxima de licitaciones a sincronizar por ejecución
SYNC_MAX_LIMIT=100
```

### Docker Compose (Opcional - Automatizar PostgreSQL)

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: mercado-publico-db
    environment:
      POSTGRES_USER: usuario
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mercado_publico
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U usuario -d mercado_publico"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**Usar:**
```bash
docker-compose up -d          # Iniciar BD
docker-compose down           # Detener BD
docker-compose logs -f        # Ver logs
```

---

## Dependencias NPM

### Instalación

```bash
npm install
```

### package.json (Sección dependencies)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.3.0",
    
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    
    "zustand": "^4.4.0",
    "zod": "^3.22.0",
    
    "@google/generative-ai": "^0.3.0",
    "axios": "^1.6.0",
    
    "shadcn-ui": "^0.8.0",
    "lucide-react": "^0.292.0",
    "recharts": "^2.10.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "eslint-config-next": "^15.0.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

### Scripts NPM

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:reset": "prisma migrate reset",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

---

## Consideraciones de Rendimiento

### Caching

**Frontend:**
- React Query/SWR para cachear respuestas
- localStorage para preferencias de usuario
- SessionStorage para estado temporal

**Backend:**
- Supabase: Indexados en código_externo, categoría, fecha_cierre, estado
- Cache de respuestas de Gemini (evitar análisis duplicados)
- Validación de caché antes de llamar IA

### Paginación

- Listado: Lazy loading o infinity scroll
- Items: 20 items por página en detalle
- Max 500 licitaciones en memoria simultáneamente

### Límites de API

- Mercado Público: ~2-3 req/seg recomendado
- Gemini: 60 req/min en free tier (según tier usado)
- Supabase: 100 queries/seg en free tier

---

## Seguridad

### Validación

- Zod para validar todas las respuestas de APIs externas
- Sanitización de entrada de usuario
- No exponer keys privadas en cliente

### Autenticación

- Para MVP: Sin autenticación (público)
- Para v2: Considerar Supabase Auth o NextAuth.js

### Rate Limiting

- Implementar rate limiting en rutas API
- Throttle de búsqueda en frontend (debounce)

---

## Roadmap de Desarrollo

### Fase 1: MVP (Semana 1-2)
- ✅ Setup Next.js, Supabase, Gemini
- ✅ Integración API Mercado Público
- ✅ Clasificador automático básico
- ✅ Dashboard con estadísticas
- ✅ Listado filtrable
- ✅ Detalle de licitación
- ✅ Análisis básico con Gemini

### Fase 2: Mejoras (Semana 3)
- Exportar a CSV/PDF
- Notificaciones por email (Resend)
- Historial de búsquedas
- Favoritos/watchlist

### Fase 3: Avanzado (Semana 4+)
- Autenticación de usuarios
- Recomendaciones personalizadas
- Análisis de tendencias
- API pública para terceros

---

## Testing

```typescript
// Unit tests
- Clasificador: validar asignación de categorías
- Formateos: fechas, monedas
- Validaciones: schemas Zod

// Integration tests
- Flujo: obtener licitación → clasificar → mostrar
- Búsqueda y filtrado
- Análisis IA

// E2E tests
- Navegar dashboard
- Buscar licitación
- Analizar con IA
```

---

## Guía de Sincronización Local

### Obtener Ticket de Mercado Público

1. Ir a https://www.mercadopublico.cl
2. Registrarse o ingresar con cuenta existente
3. En perfil → "Servicios Disponibles" o "API Consultas Públicas"
4. Solicitar generación de ticket
5. Copiar ticket a `.env.local`: `NEXT_PUBLIC_MP_TICKET=xxx`

### Sincronización Manual

```bash
# Via API local (después de levantar el servidor)
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -d '{"limite": 100}'
```

### Sincronización Automática (Cron)

```typescript
// pages/api/cron/sync-licitaciones.ts
// Llamar desde servicio externo tipo easycron.com o vercel/cron

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Ejecutar sincronización
  // ...
  
  return res.json({ success: true });
}
```

---

## Troubleshooting Común

### PostgreSQL no conecta

```bash
# Verificar estado del servicio
sudo service postgresql status

# O si usas Docker
docker-compose ps
docker-compose logs postgres

# Resetear contraseña local
sudo -u postgres psql
ALTER USER usuario WITH PASSWORD 'password';
```

### Prisma está desincronizado

```bash
# Regenerar cliente Prisma
npx prisma generate

# Aplicar migraciones pendientes
npx prisma migrate deploy
```

### Error: "DATABASE_URL not set"

```bash
# Verificar archivo .env.local existe
ls -la .env.local

# Recargar variables de entorno en terminal
source .env.local
```

### Puerto 5432 ya en uso

```bash
# Liberar puerto
lsof -ti:5432 | xargs kill -9

# O cambiar puerto en docker-compose.yml
ports:
  - "5433:5432"  # Usar 5433 en lugar de 5432
```

---

## Conclusión

Arquitectura modular, escalable y enfocada en UX. Stack moderno con Next.js, TypeScript y PostgreSQL local. Integración limpia con APIs externas (Mercado Público, Gemini).

**Próximos pasos:**
1. ✅ Confirmar arquitectura (hecho)
2. → Crear estructura de proyecto
3. → Configurar BD y Prisma
4. → Implementar componentes UI
5. → Integrar APIs externas
6. → Testing
