# Monitor de Licitaciones TI — Mercado Público Chile

Aplicación web para monitorear en tiempo real las licitaciones de tecnología del Mercado Público de Chile. Clasifica automáticamente por categoría TI y genera análisis con inteligencia artificial.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 + React 19 + Tailwind CSS |
| Base de datos | PostgreSQL 14+ + Prisma ORM 5.7 |
| Autenticación | NextAuth v5 beta (credentials + JWT) |
| IA | Google Gemini 2.0 Flash |
| Fuente de datos | API pública Mercado Público Chile |

---

## Requisitos previos

- Node.js >= 18
- PostgreSQL >= 14
- Ticket de API de Mercado Público ([obtener aquí](https://www.mercadopublico.cl))
- API Key de Google Gemini ([obtener aquí](https://ai.google.dev))

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/carlosmartinezcl/MercadoPublico.git
cd MercadoPublico

# 2. Instalar dependencias
npm install --legacy-peer-deps

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Crear tablas en la base de datos
npx prisma migrate dev

# 5. Iniciar en desarrollo
npm run dev
```

---

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/mercado_publico"

# API Mercado Público (server-only, sin prefijo NEXT_PUBLIC_)
MP_TICKET=tu_ticket_aqui
MP_BASE_URL=https://api.mercadopublico.cl/servicios/v1/publico

# Google Gemini
GEMINI_API_KEY=tu_clave_aqui
GEMINI_MODEL=gemini-2.0-flash

# NextAuth (generar secret con: openssl rand -hex 32)
AUTH_SECRET=genera_con_openssl_rand_hex_32
AUTH_URL=http://localhost:3000
AUTH_USERNAME=admin
AUTH_PASSWORD=tu_password_seguro

# Sincronización
CRON_SECRET=tu_secret_para_cron
SYNC_INTERVAL_MINUTES=60
```

> **Importante:** Variables sin prefijo `NEXT_PUBLIC_` son server-only. Nunca usar `NEXT_PUBLIC_` para tickets, API keys o secrets — quedan expuestos en el bundle del browser.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # Handler NextAuth v5
│   │   ├── licitaciones/
│   │   │   ├── route.ts                  # GET /api/licitaciones
│   │   │   └── [codigo]/route.ts         # GET /api/licitaciones/[codigo]
│   │   ├── favoritos/route.ts            # GET|POST /api/favoritos
│   │   ├── analizar/route.ts             # POST /api/analizar
│   │   └── sync/route.ts                 # POST /api/sync
│   ├── licitaciones/
│   │   ├── page.tsx                      # Listado con filtros y botón favorito
│   │   └── [codigo]/page.tsx             # Detalle + botón favorito + análisis IA
│   ├── favoritas/page.tsx                # Listado de licitaciones marcadas como favoritas
│   └── login/page.tsx                    # Formulario de login
├── auth.ts                               # Configuración NextAuth v5
├── middleware.ts                         # Protección de rutas
├── lib/
│   ├── api/
│   │   ├── db.ts                         # Cliente Prisma singleton (exporta `db`)
│   │   ├── gemini.ts                     # Cliente Gemini API
│   │   └── mercadoPublico.ts             # Cliente API Mercado Público (server-only)
│   ├── services/
│   │   ├── sync.ts                       # Sincronización con Mercado Público
│   │   ├── clasificador.ts               # Clasificación TI por palabras clave
│   │   └── estadisticas.ts               # Queries agregadas para dashboard
│   ├── hooks/
│   │   └── useLicitaciones.ts            # Hook de listado con filtros
│   ├── utils/
│   │   ├── fechas.ts                     # Utilidades de fecha (client-safe)
│   │   └── cn.ts                         # Merge de clases Tailwind
│   └── ratelimit.ts                      # Rate limiter en memoria + getClientIp()
├── components/
│   ├── comun/                            # Header, Card, Badge, Button, Loading
│   └── licitaciones/                     # TarjetaLicitacion, FiltrosCategorias, BuscaTexto
└── types/
    ├── licitacion.ts                     # Tipos internos (enum Categoria)
    └── api.ts                            # Tipos de APIs externas
```

---

## API Endpoints

| Método | Ruta | Auth | Rate Limit | Descripción |
|--------|------|------|------------|-------------|
| `GET` | `/api/licitaciones` | NextAuth | 10/min | Listado con filtros |
| `GET` | `/api/licitaciones/[codigo]` | NextAuth | 10/min | Detalle con items y análisis |
| `POST` | `/api/analizar` | NextAuth | 10/min | Genera análisis con Gemini (cacheado) |
| `GET` | `/api/favoritos` | NextAuth | 10/min | Lista todas las licitaciones favoritas |
| `GET` | `/api/favoritos?codigo=X` | NextAuth | 10/min | Verifica si una licitación es favorita |
| `POST` | `/api/favoritos` | NextAuth | 10/min | Toggle favorito (agrega o elimina) |
| `POST` | `/api/sync` | `x-cron-secret` | — | Sincroniza desde Mercado Público |

### Parámetros de `/api/licitaciones`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `categoria` | string | Filtrar por categoría TI |
| `busqueda` | string | Búsqueda en nombre, descripción y código |
| `ordenarPor` | `fechaCierre` \| `nombre` | Ordenamiento |

### Llamar a `/api/sync` desde cron externo

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "x-cron-secret: TU_CRON_SECRET"
```

### Toggle favorito

```bash
# Agregar o quitar favorito (toggle)
curl -X POST /api/favoritos \
  -H "Content-Type: application/json" \
  -d '{"codigoExterno": "750563-143-LE23"}'
# → { "esFavorita": true, "success": true }

# Verificar si es favorita
curl /api/favoritos?codigo=750563-143-LE23
# → { "esFavorita": true, "success": true }
```

---

## Categorías TI

El clasificador asigna automáticamente cada licitación usando un pipeline de dos fases:

1. **Filtro No TI** — descarta licitaciones de salud, construcción, alimentos, vehículos, etc.
2. **Clasificación** — asigna una de las 8 categorías usando palabras clave ponderadas.

| Categoría | Ejemplos |
|-----------|---------|
| `Software y Licencias` | ERP, CMS, licencias, desarrollo web, APIs |
| `Hardware y Equipos TI` | Servidores, notebooks, impresoras, monitores |
| `Telecomunicaciones` | Fibra óptica, enlaces, telefonía, radiocomunicación |
| `Redes y Seguridad` | Routers, switches, VPN, antivirus, firewall |
| `Servicios TI` | Consultoría, soporte, outsourcing, capacitación |
| `Infraestructura TI` | Data centers, UPS, climatización sala servidores |
| `Cloud` | AWS, Azure, GCP, SaaS, IaaS, PaaS |
| `No TI` | Licitaciones que no corresponden a tecnología |

---

## Base de datos

### Modelos Prisma

```
licitaciones              — Datos principales + clasificación automática
items_licitacion          — Productos/servicios solicitados (cascade delete)
analisis_ia               — Análisis generados por Gemini, cacheados por tipo
historial_sincronizacion  — Registro de cada ejecución de sync
favoritos                 — Licitaciones marcadas; codigoExterno como unique key
```

> El modelo `Favorito` usa `codigoExterno` como clave única (no el id interno) para sobrevivir al purge/re-create que ocurre en cada sincronización.

### Comandos útiles

```bash
npx prisma studio          # Explorar BD en el navegador
npx prisma migrate dev     # Aplicar migraciones en desarrollo
npx prisma migrate reset   # Resetear BD (borra todos los datos)
npx prisma generate        # Regenerar Prisma Client
```

### Migraciones custom fuera de Prisma

Algunos constraints y reclasificaciones están en `migrations/*.sql` y deben aplicarse manualmente (Prisma no los gestiona):

```bash
psql $DATABASE_URL < migrations/add_check_confianza_clasificacion.sql
```

---

## Flujo de datos

```mermaid
graph LR
    MP[API Mercado Público] --> Sync[/api/sync]
    Sync --> Clasificador[clasificador.ts]
    Clasificador --> DB[(PostgreSQL)]

    Browser --> Login[/login]
    Login --> NextAuth[NextAuth JWT]
    NextAuth --> Middleware[middleware.ts]
    Middleware --> APIRoutes[API Routes]
    APIRoutes --> Prisma[Prisma Client]
    Prisma --> DB

    APIRoutes --> Gemini[Gemini API]
    Gemini --> DB
```

---

## Autenticación

NextAuth v5 con credentials provider. Credenciales en `.env.local`:

```env
AUTH_USERNAME=admin
AUTH_PASSWORD=tu_password_seguro
```

- Sesión JWT con duración de 8 horas
- Rutas protegidas: `/licitaciones/*`, `/favoritas/*`, `/dashboard/*`, `/api/licitaciones/*`, `/api/analizar/*`, `/api/favoritos/*`
- Las rutas de API devuelven `401 JSON` (no redirect) para no romper los `fetch()` del cliente
- `/api/sync` usa exclusivamente el header `x-cron-secret` — no acepta sesión NextAuth

---

## Rate Limiting

En memoria: **10 requests por minuto por IP**.

La IP se extrae priorizando `request.ip` (inyectado por el runtime de Next.js/Vercel, no editable por el cliente) con fallback a `x-forwarded-for`.

Headers de respuesta:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1713392400
```

> Para producción con múltiples instancias reemplazar por Redis/Upstash.

---

## Sincronización

El botón **Actualizar** en la página de licitaciones ejecuta la sincronización desde la UI. También puede llamarse vía cron:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/sync",
    "schedule": "0 * * * *"
  }]
}
```

### Pipeline de cada ejecución

1. Obtiene la lista de licitaciones activas desde la API de Mercado Público
2. Crea las nuevas (con clasificación heurística o Ollama) y actualiza las existentes
3. **Purge automático:** elimina de la BD todas las licitaciones que ya no están en la respuesta de la API (cerradas o vencidas), incluyendo sus items y análisis IA asociados por cascade
   - Guard de seguridad: el purge solo se ejecuta si la API devolvió ≥ 100 licitaciones, evitando borrado masivo ante una respuesta vacía o error de paginación
   - Las licitaciones marcadas como **favoritas** sobreviven al purge porque el modelo `Favorito` referencia solo el `codigoExterno` y no tiene cascade

El mensaje de resultado incluye el conteo de cada operación: `X nuevas, Y actualizadas, Z eliminadas`.

---

## Scripts disponibles

```bash
npm run dev              # Servidor de desarrollo (localhost:3000)
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # ESLint
npm run type-check       # TypeScript sin emitir
npm run format           # Prettier
npm run prisma:studio    # Explorador de BD
npm run prisma:migrate   # Aplicar migraciones
npm run prisma:reset     # Resetear BD (borra todos los datos)
npm run ollama:setup     # Configurar modelo Ollama local
npm run ollama:extract   # Extraer datos para entrenamiento
npm run backfill:detalles # Rellenar campos faltantes en licitaciones existentes
```

---

## Notas de seguridad

- `MP_TICKET` y `GEMINI_API_KEY` son variables server-only — sin prefijo `NEXT_PUBLIC_`
- `.env.local` y `.mcp.json` están en `.gitignore` — nunca commitear credenciales reales
- `AUTH_SECRET` debe generarse con `openssl rand -hex 32`
- `getClientIp()` en `ratelimit.ts` prioriza `request.ip` (no spoofeable) sobre `x-forwarded-for`
- `codigoExterno` en `/api/favoritos` se valida con regex antes de cualquier operación en BD
- Utilidades de fecha (`diasHastaCierre`, `determinarUrgencia`) en `lib/utils/fechas.ts` son client-safe; el cliente HTTP de Mercado Público en `lib/api/mercadoPublico.ts` es server-only
- No nombrar funciones internas `fetch` en componentes React — pisa el global del browser
- Los datos de Mercado Público contienen PII real (nombres, RUTs, emails de funcionarios) — sanitizar antes de exportar o usar en datasets de entrenamiento
