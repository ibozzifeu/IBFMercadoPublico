# Arquitectura — Monitor de Licitaciones TI (Mercado Público Chile)

## Visión General

Aplicación web para monitoreo y análisis de licitaciones de TI en el Mercado Público de Chile. Clasifica automáticamente en 6 categorías, permite búsqueda y filtrado en tiempo real, y genera análisis con IA (Gemini).

```
Browser → NextAuth JWT → Middleware → API Routes → Prisma → PostgreSQL
                                                       ↕
                                               Gemini API (on demand)
                                                       ↕
                                          API Mercado Público (sync)
```

---

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|----------|
| Frontend | Next.js 15 + React 19 | Framework con App Router |
| UI | Tailwind CSS + componentes propios | Estilos y componentes |
| Lenguaje | TypeScript | Type safety |
| Autenticación | NextAuth v5 (credentials + JWT) | Login con usuario/password |
| Base de Datos | PostgreSQL 14+ | Persistencia |
| ORM | Prisma 5 | Gestión de BD y migraciones |
| API Externa | Mercado Público API v1 | Fuente de licitaciones |
| IA | Google Gemini 2.0 Flash | Análisis y resúmenes |
| Rate Limiting | In-memory Map | 10 req/min por IP |

---

## Estructura de Carpetas

```
src/
├── auth.ts                               # NextAuth v5: handlers, auth, signIn, signOut
├── middleware.ts                         # Protege rutas — 401 JSON en API, redirect en páginas
│
├── app/
│   ├── login/page.tsx                    # Formulario de login (público)
│   ├── licitaciones/
│   │   ├── page.tsx                      # Listado con filtros + botón Actualizar
│   │   └── [codigo]/page.tsx             # Detalle + análisis IA
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # Handler NextAuth (re-exporta handlers)
│       ├── licitaciones/route.ts         # GET — listado con filtros
│       ├── licitaciones/[codigo]/route.ts # GET — detalle con items
│       ├── analizar/route.ts             # POST — análisis Gemini (cacheado)
│       └── sync/route.ts                 # POST — sincroniza desde Mercado Público
│
├── lib/
│   ├── api/
│   │   ├── db.ts                         # Singleton PrismaClient → exporta `db`
│   │   ├── gemini.ts                     # Cliente Gemini: generarResumenEjecutivo, clasificarLicitacion
│   │   └── mercadoPublico.ts             # Cliente axios MP API (SERVER-ONLY — tiene throw al módulo)
│   ├── services/
│   │   ├── sync.ts                       # Orquesta fetch → clasificar → upsert → historial
│   │   ├── clasificador.ts               # Palabras clave ponderadas → 6 categorías TI
│   │   └── estadisticas.ts               # Queries agregadas para dashboard
│   ├── hooks/
│   │   └── useLicitaciones.ts            # Hook con filtros, deps primitivas (no objeto)
│   ├── utils/
│   │   ├── fechas.ts                     # diasHastaCierre, determinarUrgencia (CLIENT-SAFE)
│   │   └── cn.ts                         # Merge de clases Tailwind
│   └── ratelimit.ts                      # Map en memoria, cleanup cada 5 min
│
├── components/
│   ├── comun/                            # Header, Card, Badge, Button, Input, Loading
│   └── licitaciones/                     # TarjetaLicitacion, FiltrosCategorias, BuscaTexto
│
└── types/
    ├── licitacion.ts                     # Tipos internos: Licitacion, ItemLicitacion, AnalisisIA
    └── api.ts                            # Tipos de APIs externas: MercadoPublicoResponse, etc.
```

---

## Modelos de Datos (Prisma)

```prisma
model Licitacion {
  id                    String    @id @default(cuid())
  codigoExterno         String    @unique
  nombre                String
  descripcion           String?   @db.Text
  estado                String
  codigoEstado          Int
  fechaCierre           DateTime?
  fechaCreacion         DateTime?
  fechaPublicacion      DateTime?
  moneda                String?
  montoEstimado         Float?
  categoria             String    @default("Tecnología General")
  compradorNombre       String?
  compradorOrganismo    String?
  compradorUnidad       String?
  compradorRut          String?
  compradorCodigoUnidad String?
  compradorRegion       String?
  compradorComuna       String?
  compradorDireccion    String?
  usuarioNombre         String?
  usuarioCargo          String?
  tipoLicitacion        String?
  codigoTipo            Int?
  itemsCantidad         Int       @default(0)
  etapas                Int       @default(1)
  items                 ItemLicitacion[]
  analisisIA            AnalisisIA[]
  fechaSincronizacion   DateTime  @default(now()) @updatedAt
  creadoEn              DateTime  @default(now())
  actualizadoEn         DateTime  @updatedAt

  @@index([codigoExterno])
  @@index([categoria])
  @@index([fechaCierre])
  @@index([estado])
  @@map("licitaciones")
}

model ItemLicitacion {
  id              String     @id @default(cuid())
  licitacionId    String
  licitacion      Licitacion @relation(fields: [licitacionId], references: [id], onDelete: Cascade)
  correlativo     Int
  nombreProducto  String
  descripcion     String?    @db.Text
  unidadMedida    String
  cantidad        Float
  codigoProducto  Int?
  codigoCategoria String?
  creadoEn        DateTime   @default(now())

  @@index([licitacionId])
  @@map("items_licitacion")
}

model AnalisisIA {
  id           String     @id @default(cuid())
  licitacionId String
  licitacion   Licitacion @relation(fields: [licitacionId], references: [id], onDelete: Cascade)
  tipoAnalisis String     // 'resumen_ejecutivo'
  contenido    String     @db.Text
  metadata     Json?
  creadoEn     DateTime   @default(now())

  @@unique([licitacionId, tipoAnalisis])
  @@index([licitacionId])
  @@map("analisis_ia")
}

model HistorialSincronizacion {
  id                       String   @id @default(cuid())
  fechaEjecucion           DateTime @default(now())
  licitacionesProcesadas   Int      @default(0)
  licitacionesNuevas       Int      @default(0)
  licitacionesActualizadas Int      @default(0)
  estado                   String   // 'ejecutando' | 'exitosa' | 'parcial' | 'fallida'
  errorMensaje             String?  @db.Text
  duracionSegundos         Float?

  @@index([fechaEjecucion])
  @@map("historial_sincronizacion")
}
```

---

## Flujos Principales

### 1. Sincronización de Licitaciones

```
UI (botón Actualizar) ──→ POST /api/sync
                              ↓
                      Verificar sesión NextAuth
                      o header x-cron-secret
                              ↓
                      sincronizarLicitaciones()
                              ↓
                      obtenerLicitacionesActivas() — MP API
                              ↓
                      transformarLicitacion()
                        └─ extraerComprador()
                        └─ clasificarLicitacion() — palabras clave
                              ↓
                      Upsert en lotes de 10 (Promise.all)
                        └─ findUnique → update (existente)
                        └─ create con items nested (nueva)
                              ↓
                      historialSincronizacion.update()
                              ↓
                      refetch() — actualiza el listado en UI
```

### 2. Búsqueda y Filtrado

```
Usuario escribe / selecciona filtro
        ↓
useLicitaciones({ filtroCategoria, busqueda, ordenarPor })
  └─ useCallback con deps primitivas (no objeto)
        ↓
Debounce 300ms (BuscaTexto)
        ↓
window.fetch('/api/licitaciones?...')
        ↓
Prisma: findMany con where + orderBy + take:100
        ↓
Resultados en pantalla
```

### 3. Análisis con IA

```
Usuario hace click en "Analizar"
        ↓
POST /api/analizar { licitacionId }
        ↓
¿Existe analisis_ia con tipoAnalisis='resumen_ejecutivo'?
  └─ Sí → retornar cacheado
  └─ No → generarResumenEjecutivo(licitacion)
              ↓
           Gemini 2.0 Flash (~400-700 tokens, ~3s)
              ↓
           analisisIA.create()
              ↓
           Mostrar en UI
```

---

## Autenticación y Seguridad

### NextAuth v5

- `src/auth.ts` exporta `{ handlers, auth, signIn, signOut }`
- Credentials provider: usuario/password desde env vars
- Sesión JWT de 8 horas
- `src/middleware.ts` lee `req.auth` para proteger rutas

### Rutas protegidas

| Ruta | Protección |
|------|-----------|
| `/licitaciones/*` | NextAuth → redirect a `/login` |
| `/api/licitaciones/*` | NextAuth → 401 JSON |
| `/api/analizar` | NextAuth → 401 JSON |
| `/api/sync` | NextAuth session **o** `x-cron-secret` header |
| `/login` | Pública |
| `/api/auth/*` | Pública (NextAuth handlers) |

### Variables de entorno

Las API keys y tokens van **sin** prefijo `NEXT_PUBLIC_` — quedan en el servidor:

| Variable | Scope |
|----------|-------|
| `MP_TICKET`, `MP_BASE_URL` | Server-only |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Server-only |
| `AUTH_SECRET`, `AUTH_USERNAME`, `AUTH_PASSWORD` | Server-only |
| `CRON_SECRET` | Server-only |
| `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_ENV` | Cliente (no son secretos) |

### Rate Limiting

`src/lib/ratelimit.ts` — Map en memoria, 10 req/min por IP, cleanup cada 5 minutos.
Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`.
Para multi-instancia usar Redis/Upstash.

---

## Separación cliente / servidor

Un error frecuente es importar módulos server-only en componentes cliente:

| Archivo | Scope | Razón |
|---------|-------|-------|
| `lib/api/mercadoPublico.ts` | **Server-only** | `throw` al módulo si falta MP_BASE_URL |
| `lib/api/gemini.ts` | **Server-only** | Usa GEMINI_API_KEY |
| `lib/api/db.ts` | **Server-only** | PrismaClient no corre en browser |
| `lib/utils/fechas.ts` | **Client-safe** | Funciones puras sin env vars |
| `lib/utils/cn.ts` | **Client-safe** | Función pura |
| `lib/services/clasificador.ts` | **Client-safe** | Diccionario estático |

---

## Categorías TI — Clasificador

Lógica en `src/lib/services/clasificador.ts`:

1. Combina nombre + descripción + nombres de productos
2. Busca coincidencias con diccionario de palabras clave por categoría
3. Aplica pesos (ERP=10, VPN=9, servidor=7, sistema=3, servicio=2)
4. Asigna categoría con mayor puntuación; empate → `Tecnología General`
5. Confianza = puntuación_máx / puntuación_total × 100

**Categorías:** Software/Sistemas · Hardware/Equipos · Redes/Telecomunicaciones · Seguridad TI · Servicios TI · Tecnología General

---

## APIs Externas

### Mercado Público API v1

```
GET /servicios/v1/publico/licitaciones.json?estado=activas&ticket=XXX
GET /servicios/v1/publico/licitaciones.json?codigo=1234-LE26&ticket=XXX
```

- ~4.300 licitaciones activas disponibles
- Respuesta: `{ Cantidad, Listado: [...] }`
- Items anidados en `Listado[].Items.Listado`

### Gemini API

- Modelo: `gemini-2.0-flash`
- Consumo: ~400–700 tokens por análisis
- Tiempo de respuesta: ~3 segundos
- SDK: `@google/generative-ai`

---

## Consideraciones de Rendimiento

- Sync en lotes de 10 con `Promise.all` para no saturar la BD
- `take: 100` en listado, `take: 200` en items de detalle, `take: 1` en análisis
- Análisis IA cacheados en BD (`@@unique([licitacionId, tipoAnalisis])`)
- `useCallback` con dependencias primitivas para evitar re-renders infinitos
- Debounce de 300ms en búsqueda de texto

---

## Quick Start

```bash
# Instalar
npm install --legacy-peer-deps

# Variables de entorno
cp .env.example .env.local   # completar con credenciales reales

# Base de datos
npx prisma migrate dev

# Servidor
npm run dev

# Sincronizar datos (requiere servidor corriendo)
curl -X POST http://localhost:3000/api/sync \
  -H "x-cron-secret: TU_CRON_SECRET"
```

---

## Pitfalls conocidos

| Problema | Causa | Solución |
|---------|-------|---------|
| `Cannot read properties of undefined (reading 'ok')` | Función local llamada `fetch` pisa el global | Renombrar a `cargar` y usar `window.fetch()` |
| `Maximum update depth exceeded` | `useCallback` con objeto como dependencia | Desestructurar a valores primitivos |
| 404 en ruta dinámica de API | Directorio creado como `\[param\]` en vez de `[param]` | Verificar con `ls` después de crear |
| Error `MP_BASE_URL no configurado` en browser | `lib/api/mercadoPublico.ts` importado en componente cliente | Mover utilidades puras a `lib/utils/` |
| Servidor crashea con `_document.js` | `next.config.ts` sin binario SWC en Linux | Usar `next.config.mjs` |
| `import { prisma }` falla en runtime | El módulo exporta `db`, no `prisma` | `import { db } from '@/lib/api/db'` |
