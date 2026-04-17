# Monitor de Licitaciones TI — Mercado Público Chile

Aplicación web para monitorear en tiempo real las licitaciones de tecnología del Mercado Público de Chile. Clasifica automáticamente por categoría TI y genera análisis con inteligencia artificial.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 + React 19 + Tailwind CSS |
| Base de datos | PostgreSQL + Prisma ORM |
| Autenticación | NextAuth v5 (credentials + JWT) |
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
git clone <repo-url>
cd MercadoPublico

# 2. Instalar dependencias
npm install

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

# API Mercado Público (sin prefijo NEXT_PUBLIC — es un secreto de servidor)
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

> **Importante:** Las variables sin prefijo `NEXT_PUBLIC_` solo son accesibles en el servidor. Nunca uses `NEXT_PUBLIC_` para tickets, API keys o secrets.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # Handler NextAuth
│   │   ├── licitaciones/
│   │   │   ├── route.ts                  # GET /api/licitaciones
│   │   │   └── [codigo]/route.ts         # GET /api/licitaciones/[codigo]
│   │   ├── analizar/route.ts             # POST /api/analizar
│   │   └── sync/route.ts                 # POST /api/sync
│   ├── licitaciones/
│   │   ├── page.tsx                      # Listado con filtros
│   │   └── [codigo]/page.tsx             # Detalle de licitación
│   └── login/page.tsx                    # Formulario de login
├── auth.ts                               # Configuración NextAuth v5
├── middleware.ts                         # Protección de rutas
├── lib/
│   ├── api/
│   │   ├── db.ts                         # Cliente Prisma (singleton)
│   │   ├── gemini.ts                     # Cliente Gemini API
│   │   └── mercadoPublico.ts             # Cliente API Mercado Público
│   ├── services/
│   │   ├── sync.ts                       # Sincronización con Mercado Público
│   │   ├── clasificador.ts               # Clasificación TI por palabras clave
│   │   └── estadisticas.ts               # Queries agregadas para dashboard
│   ├── hooks/
│   │   └── useLicitaciones.ts            # Hook de listado con filtros
│   └── ratelimit.ts                      # Rate limiter en memoria
├── components/
│   ├── comun/                            # Header, Card, Badge, Button, etc.
│   └── licitaciones/                     # TarjetaLicitacion, FiltrosCategorias, BuscaTexto
└── types/
    ├── licitacion.ts                     # Tipos internos
    └── api.ts                            # Tipos de APIs externas
```

---

## API Endpoints

| Método | Ruta | Auth | Rate Limit | Descripción |
|--------|------|------|------------|-------------|
| `GET` | `/api/licitaciones` | NextAuth | 10/min | Listado con filtros |
| `GET` | `/api/licitaciones/[codigo]` | NextAuth | 10/min | Detalle con items y análisis |
| `POST` | `/api/analizar` | NextAuth | 10/min | Genera análisis con Gemini |
| `POST` | `/api/sync` | CRON_SECRET | — | Sincroniza desde Mercado Público |

### Parámetros de `/api/licitaciones`

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `categoria` | string | Filtrar por categoría TI |
| `busqueda` | string | Búsqueda en nombre, descripción y código |
| `ordenarPor` | `fechaCierre` \| `nombre` | Ordenamiento |

### Llamar a `/api/sync`

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "x-cron-secret: TU_CRON_SECRET"
```

---

## Categorías TI

El clasificador asigna automáticamente cada licitación a una de estas categorías usando palabras clave ponderadas:

| Categoría | Ejemplos |
|-----------|---------|
| Software/Sistemas | ERP, CMS, licencias, desarrollo, APIs |
| Hardware/Equipos | Servidores, notebooks, impresoras, monitores |
| Redes/Telecomunicaciones | Routers, switches, VPN, fibra óptica |
| Seguridad TI | Antivirus, backup, cifrado, compliance |
| Servicios TI | Consultoría, soporte, outsourcing, capacitación |
| Tecnología General | Otros temas TI no clasificados |

---

## Base de datos

### Modelos Prisma

```
licitaciones              — Datos principales de cada licitación
items_licitacion          — Productos/servicios solicitados
analisis_ia               — Análisis generados por Gemini (cacheados)
historial_sincronizacion  — Registro de cada ejecución de sync
```

### Comandos útiles

```bash
npx prisma studio          # Explorar BD en el navegador
npx prisma migrate dev     # Aplicar migraciones en desarrollo
npx prisma migrate reset   # Resetear BD (borra todos los datos)
npx prisma generate        # Regenerar Prisma Client
```

---

## Autenticación

NextAuth v5 con provider de credenciales. Las credenciales se configuran en `.env.local`:

```env
AUTH_USERNAME=admin
AUTH_PASSWORD=tu_password_seguro
```

- Sesión JWT con duración de 8 horas
- Rutas protegidas: `/licitaciones/*`, `/dashboard/*`, `/api/licitaciones/*`, `/api/analizar/*`
- Las rutas de API devuelven `401 JSON` (no redirect) para no romper los `fetch()` del cliente

---

## Rate Limiting

Implementado en memoria: **10 requests por minuto por IP**.

Los headers de respuesta informan el estado:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1713392400
Retry-After: 0
```

> Para producción con múltiples instancias (Vercel, etc.) reemplazar por Redis/Upstash.

---

## Sincronización automática

Para ejecutar la sincronización cada hora se puede usar un cron job o Vercel Cron Jobs:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/sync",
    "schedule": "0 * * * *"
  }]
}
```

Y agregar el header en la llamada:
```
x-cron-secret: TU_CRON_SECRET
```

---

## Scripts disponibles

```bash
npm run dev            # Servidor de desarrollo
npm run build          # Build de producción
npm run start          # Servidor de producción
npm run lint           # ESLint
npm run type-check     # TypeScript sin emitir
npm run format         # Prettier
npm run prisma:studio  # Explorador de BD
npm run prisma:migrate # Aplicar migraciones
npm run prisma:reset   # Resetear BD
```

---

## Notas de seguridad

- `MP_TICKET` y `GEMINI_API_KEY` son variables de servidor — nunca agregar prefijo `NEXT_PUBLIC_`
- `.env.local` está en `.gitignore` — nunca commitear credenciales reales
- `AUTH_SECRET` debe generarse con `openssl rand -hex 32`
- El endpoint `/api/sync` está protegido por `CRON_SECRET` en el header `x-cron-secret`, no por NextAuth
