# 📊 MercadoPublico TI - Aplicación de Monitoreo de Licitaciones

Monitor inteligente de licitaciones de TI en el Mercado Público de Chile. Proporciona clasificación automática en 6 categorías, estadísticas en tiempo real, búsqueda avanzada y análisis con IA (Gemini).

## 🎯 Funcionalidades

✅ **Clasificación Automática**: 6 categorías TI (Software/Sistemas, Hardware/Equipos, Redes/Telecomunicaciones, Seguridad TI, Servicios TI, Tecnología General)

✅ **Panel de Estadísticas**: Total activas, filtradas TI, que cierran hoy/7 días

✅ **Filtros Avanzados**: Por categoría, búsqueda de texto libre en tiempo real

✅ **Ordenamiento**: Por fecha de cierre (urgentes primero) o por nombre

✅ **Vista de Detalle**: Información completa de licitación (fechas, comprador, monto, ítems)

✅ **Análisis con IA**: Botón en cada detalle para resumen ejecutivo con Gemini

---

## 🚀 Quick Start

### 1. Requisitos Previos

```bash
- Node.js 18+
- npm o yarn
- Docker (recomendado para PostgreSQL)
- Git
```

### 2. Clonar y Configurar

```bash
# Posicionarse en el directorio del proyecto
cd /home/camf/camfcode/MercadoPublico

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env.local

# Editar .env.local con tus credenciales
nano .env.local
```

### 3. Configurar Base de Datos

```bash
# Opción A: Con Docker (recomendado)
docker-compose up -d

# Opción B: PostgreSQL instalado localmente
# Asegúrate de que el servicio esté corriendo
sudo service postgresql start
```

### 4. Preparar Base de Datos

```bash
# Crear migraciones
npx prisma migrate dev --name init

# Generar cliente Prisma
npx prisma generate

# (Opcional) Abrir Prisma Studio para ver/editar BD
npx prisma studio
```

### 5. Obtener Credenciales

**Mercado Público API:**
1. Ir a https://www.mercadopublico.cl
2. Ingresar/registrarse
3. Obtener ticket en "Servicios Disponibles"
4. Copiar a `.env.local`: `NEXT_PUBLIC_MP_TICKET=xxx`

**Gemini API:**
1. Ir a https://ai.google.dev
2. Crear API key
3. Copiar a `.env.local`: `GEMINI_API_KEY=xxx`

### 6. Iniciar Desarrollo

```bash
npm run dev

# Abrir http://localhost:3000
```

---

## 📁 Estructura del Proyecto

```
mercado-publico/
├── prisma/
│   ├── schema.prisma           # Modelos de BD
│   └── migrations/             # Historial de cambios BD
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (dashboard)/        # Dashboard página
│   │   ├── licitaciones/       # Listado y detalle
│   │   ├── api/                # Rutas API
│   │   └── layout.tsx
│   ├── components/             # Componentes React
│   │   ├── dashboard/
│   │   ├── licitaciones/
│   │   ├── detalle/
│   │   └── comun/
│   ├── lib/                    # Utilidades y servicios
│   │   ├── api/                # Clientes de APIs
│   │   ├── services/           # Lógica de negocio
│   │   ├── utils/              # Funciones auxiliares
│   │   └── hooks/              # Custom React hooks
│   └── types/                  # TypeScript types
├── public/
├── .env.example                # Template de variables
├── docker-compose.yml          # Configuración Docker
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## 🔧 Comandos Útiles

### Desarrollo

```bash
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Compilar para producción
npm run start            # Iniciar servidor de producción
npm run lint             # Verificar código
npm run type-check       # Verificar tipos TypeScript
```

### Base de Datos

```bash
npx prisma generate     # Regenerar cliente Prisma
npx prisma migrate dev  # Crear/aplicar migración
npx prisma studio      # Abrir interfaz gráfica
npx prisma reset       # Resetear BD (CUIDADO!)
```

### Testing

```bash
npm test                # Ejecutar tests
npm run test:watch      # Tests en modo watch
```

### Docker (PostgreSQL)

```bash
docker-compose up -d    # Iniciar servicios
docker-compose down     # Detener servicios
docker-compose logs -f  # Ver logs
docker-compose ps       # Listar contenedores
```

---

## 📊 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Estilos** | TailwindCSS, shadcn/ui |
| **BD** | PostgreSQL 16 + Prisma ORM |
| **Estado** | React Hooks, Zustand |
| **APIs** | Mercado Público, Gemini |
| **Validación** | Zod |
| **Testing** | Jest, React Testing Library |

---

## 🌐 Variables de Entorno

### Base de Datos
```
DATABASE_URL=postgresql://usuario:password@localhost:5432/mercado_publico
```

### APIs Externas
```
NEXT_PUBLIC_MP_TICKET=tu_ticket_aqui
GEMINI_API_KEY=tu_clave_aqui
GEMINI_MODEL=gemini-2.0-flash
```

### Aplicación
```
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
SYNC_INTERVAL_MINUTES=60
```

---

## 🔍 Clasificación Automática

La aplicación clasifica licitaciones en 6 categorías TI:

1. **Software/Sistemas**: ERP, CMS, bases de datos, aplicaciones
2. **Hardware/Equipos**: Servidores, laptops, periféricos
3. **Redes/Telecomunicaciones**: Routers, firewalls, VPN, conectividad
4. **Seguridad TI**: Ciberseguridad, antivirus, backup, encriptación
5. **Servicios TI**: Consultoría, soporte, outsourcing, capacitación
6. **Tecnología General**: Otros temas de TI no clasificados

---

## 🐛 Troubleshooting

### PostgreSQL no conecta

```bash
# Verificar servicio
sudo service postgresql status

# O si usas Docker
docker-compose logs postgres
docker-compose ps
```

### Prisma error

```bash
# Regenerar cliente
npx prisma generate

# Aplicar migraciones pendientes
npx prisma migrate deploy
```

### Puerto en uso

```bash
# Cambiar puerto en next.config.ts o iniciar diferente
npm run dev -- -p 3001

# Liberar puerto 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📚 Documentación

- [Arquitectura](./ARQUITECTURA.md) - Diseño completo del sistema
- [API Licitaciones Activas](./API_LICITACIONES_ACTIVAS.md) - Documentación endpoint estado
- [API por Código](./API_LICITACIONES_POR_CODIGO.md) - Documentación endpoint específico
- [Prisma Docs](https://www.prisma.io/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [Gemini API](https://ai.google.dev)

---

## 📝 Roadmap

### Fase 1: MVP ✅
- Setup inicial y configuración
- Dashboard con estadísticas
- Listado filtrable
- Detalle de licitación
- Análisis básico IA

### Fase 2: Mejoras (Próximo)
- Exportar CSV/PDF
- Notificaciones por email
- Historial de búsquedas
- Favoritos/watchlist

### Fase 3: Avanzado
- Autenticación
- Recomendaciones personalizadas
- API pública
- Análisis de tendencias

---

## 🤝 Contribuir

Para reportar bugs o sugerir features:
1. Crear issue descriptivo
2. Fork del proyecto
3. Commit cambios
4. Push a branch
5. Abrir pull request

---

## 📧 Soporte

Para dudas o problemas:
- Revisar [Troubleshooting](#-troubleshooting)
- Consultar [Arquitectura](./ARQUITECTURA.md)
- Crear issue en el repo

---

## 📄 Licencia

Este proyecto es de código abierto bajo licencia MIT.

---

**Hecho con ❤️ para el Mercado Público de Chile**
