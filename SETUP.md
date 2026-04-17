# 🚀 Guía de Setup - MercadoPublico TI

Pasos detallados para configurar el proyecto en tu máquina local.

---

## ✅ Fase 1: Preparar Entorno (5 minutos)

### 1.1 Instalar Dependencias

```bash
cd /home/camf/camfcode/MercadoPublico
npm install
```

**Esperado:** 200+ paquetes instalados. Ver `node_modules/` creado.

---

## ✅ Fase 2: Configurar Base de Datos (10 minutos)

### 2.1 Iniciar PostgreSQL con Docker

```bash
# Iniciar servicios
docker-compose up -d

# Verificar que está corriendo
docker-compose ps

# Debería ver:
# NAME                              IMAGE            STATUS
# mercado-publico-db               postgres:16-alpine  Up
# mercado-publico-pgadmin          dpage/pgadmin4     Up
```

**Si falla:** Verifica que Docker esté corriendo y que el puerto 5432 esté libre.

### 2.2 Crear Archivo .env.local

```bash
cp .env.example .env.local
```

**Contenido de `.env.local` (ejemplo):**
```
DATABASE_URL="postgresql://usuario:password@localhost:5432/mercado_publico"
NEXT_PUBLIC_MP_TICKET=tu_ticket_aqui
NEXT_PUBLIC_MP_BASE_URL=https://api.mercadopublico.cl/servicios/v1/publico
GEMINI_API_KEY=tu_clave_aqui
GEMINI_MODEL=gemini-2.0-flash
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
SYNC_INTERVAL_MINUTES=60
```

### 2.3 Obtener Credenciales

#### Ticket de Mercado Público

1. Ir a https://www.mercadopublico.cl
2. Ingresar con cuenta (crear si no tienes)
3. Perfil → "Servicios Disponibles" o "Servicios de Información"
4. Solicitar/Obtener "Ticket de Acceso"
5. Copiar el token en `.env.local`

#### Clave de Gemini

1. Ir a https://ai.google.dev/
2. Click en "Get API Key"
3. Click en "Create API Key"
4. Crear en proyecto nuevo o existente
5. Copiar la clave en `.env.local`

### 2.4 Crear y Migrar Base de Datos

```bash
# Crear migraciones Prisma
npx prisma migrate dev --name init

# Se creará:
# - prisma/migrations/
# - Todas las tablas en PostgreSQL

# Generar cliente Prisma
npx prisma generate
```

**Esperado:** Verde: "✔ Generated Prisma Client"

### 2.5 Verificar Base de Datos (Opcional)

```bash
# Abrir Prisma Studio (interfaz gráfica)
npx prisma studio

# Se abrirá en http://localhost:5555
# Puedes ver todas las tablas vacías
```

**O conectar manualmente:**

```bash
# Conectarse con psql
psql -U usuario -d mercado_publico -h localhost

# Verificar tablas
\dt

# Ver estructura de licitaciones
\d licitaciones

# Salir
\q
```

---

## ✅ Fase 3: Configurar Variables de Entorno

### Editar `.env.local`

```bash
nano .env.local
```

**Campos a completar:**

1. `NEXT_PUBLIC_MP_TICKET` - Tu ticket de Mercado Público
2. `GEMINI_API_KEY` - Tu clave de Gemini

---

## ✅ Fase 4: Iniciar Servidor de Desarrollo (2 minutos)

```bash
npm run dev
```

**Salida esperada:**
```
  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.5s
```

---

## ✅ Fase 5: Verificar Instalación (2 minutos)

### 5.1 Acceder a la Aplicación

1. Abrir http://localhost:3000 en el navegador
2. Debería redirigir a http://localhost:3000/licitaciones
3. Verás un layout básico (en construcción)

### 5.2 Verificar APIs

**Probar cliente Mercado Público:**

```bash
# En otra terminal
node << 'EOF'
const api = require('./src/lib/api/mercadoPublico.ts')
api.obtenerLicitacionesActivas()
  .then(data => console.log('OK:', data.Cantidad, 'licitaciones'))
  .catch(err => console.error('ERROR:', err.message))
EOF
```

### 5.3 Acceder a PgAdmin (Opcional)

- URL: http://localhost:5050
- Email: admin@example.com
- Password: admin

1. Login
2. Servidores → Registrar servidor
3. Connection:
   - Hostname: postgres
   - Username: usuario
   - Password: password
   - Database: mercado_publico

---

## 🛠️ Troubleshooting

### Error: "DATABASE_URL not set"

```bash
# Verificar que .env.local existe
ls -la .env.local

# Verificar contenido
cat .env.local | grep DATABASE_URL

# Si falta, editar:
nano .env.local
```

### Error: "connection refused" en postgresql

```bash
# Verificar estado del contenedor
docker-compose ps

# Si no está, iniciar
docker-compose up -d

# Ver logs
docker-compose logs postgres
```

### Puerto 5432 ya en uso

```bash
# Encontrar proceso
lsof -i :5432

# Matar proceso (si es necesario)
kill -9 <PID>

# O cambiar puerto en docker-compose.yml
```

### Error en Prisma "No migrations found"

```bash
# Reset BD (CUIDADO: borra todo)
npx prisma migrate reset

# Crear migraciones nuevas
npx prisma migrate dev --name init
```

---

## 📊 Verificar Estructura

```bash
# Listar archivos creados
ls -la src/
ls -la src/lib/
ls -la src/types/

# Verificar BD
npx prisma studio
```

---

## 🎯 Próximo: Crear Componentes

Una vez verificado que todo funciona:

1. Crear componentes React en `src/components/`
2. Crear páginas en `src/app/`
3. Crear rutas API en `src/app/api/`

Ver task #2: "Implementar componentes UI"

---

## 📞 Ayuda

Si algo falla:
1. Revisar logs: `docker-compose logs`
2. Revisar `.env.local`
3. Ejecutar `npm run build` para ver errores de compilación
4. Revisar ARQUITECTURA.md para referencia

**¡Listo para desarrollar! 🚀**
