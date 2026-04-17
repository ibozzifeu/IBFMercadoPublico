# ✅ Checklist de Configuración Inicial

Usa este checklist para asegurate de que todo esté correctamente configurado.

---

## 📋 Fase 1: Estructura del Proyecto

- [ ] Verificar que existen todos los archivos en `/home/camf/camfcode/MercadoPublico/`
- [ ] Verificar que existen las carpetas: `src/`, `prisma/`, `public/`
- [ ] Verificar que existen archivos de configuración: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`
- [ ] Verificar que existen tipos en `src/types/`: `licitacion.ts`, `api.ts`
- [ ] Verificar que existen servicios en `src/lib/`: `api/` (mercadoPublico.ts, gemini.ts, db.ts), `services/` (clasificador.ts, estadisticas.ts)

---

## 🔧 Fase 2: Instalar Dependencias

```bash
cd /home/camf/camfcode/MercadoPublico
npm install
```

- [ ] `npm install` completó sin errores
- [ ] Carpeta `node_modules/` fue creada
- [ ] Archivo `package-lock.json` fue creado

---

## 🐘 Fase 3: Configurar PostgreSQL

```bash
docker-compose up -d
```

- [ ] `docker-compose up -d` ejecutó sin errores
- [ ] `docker-compose ps` muestra 2 contenedores corriendo:
  - `mercado-publico-db`
  - `mercado-publico-pgadmin`

**Verificar conectividad:**
```bash
docker-compose exec postgres psql -U usuario -d mercado_publico -c "SELECT version();"
```

- [ ] Comando devuelve versión de PostgreSQL (ej: "PostgreSQL 16.x")

---

## 🔐 Fase 4: Variables de Entorno

```bash
cp .env.example .env.local
```

- [ ] Archivo `.env.local` fue creado
- [ ] Editaste `.env.local` y completaste:
  - [ ] `NEXT_PUBLIC_MP_TICKET` - Ticket de Mercado Público
  - [ ] `GEMINI_API_KEY` - Clave de Gemini

**Verificar conectividad a BD:**
```bash
psql postgresql://usuario:password@localhost:5432/mercado_publico -c "\dt"
```

- [ ] Comando conecta exitosamente (sin listas de tablas aún)

---

## 🔄 Fase 5: Prisma y Base de Datos

```bash
npx prisma migrate dev --name init
npx prisma generate
```

- [ ] `npx prisma migrate dev` completó sin errores
- [ ] Carpeta `prisma/migrations/` fue creada con archivos `.sql`
- [ ] `npx prisma generate` mostró: "✔ Generated Prisma Client"

**Verificar tablas creadas:**
```bash
psql postgresql://usuario:password@localhost:5432/mercado_publico -c "\dt"
```

- [ ] Se ven 4 tablas:
  - `licitaciones`
  - `items_licitacion`
  - `analisis_ia`
  - `historial_sincronizacion`

**Verificar Prisma Studio:**
```bash
npx prisma studio
```

- [ ] Prisma Studio abre en http://localhost:5555
- [ ] Puedes ver las 4 tablas listadas
- [ ] Las tablas están vacías (ninguna fila)

---

## 🚀 Fase 6: Iniciar Servidor de Desarrollo

```bash
npm run dev
```

- [ ] `npm run dev` inicia sin errores
- [ ] Salida contiene: "✓ Ready in X.Xs"
- [ ] Servidor está corriendo en: `http://localhost:3000`

**Verificar servidor:**

```bash
# En otra terminal
curl http://localhost:3000
```

- [ ] Comando devuelve HTML (no error 404)

---

## 🌐 Fase 7: Acceder a la Aplicación

Abrir en navegador: `http://localhost:3000`

- [ ] Página carga sin errores
- [ ] Se redirige automáticamente a `/licitaciones`
- [ ] No hay errores en la consola del navegador (F12 → Console)

---

## 📚 Fase 8: Verificar Archivos de Documentación

- [ ] `README.md` existe y contiene guía de inicio
- [ ] `ARQUITECTURA.md` existe y describe el diseño
- [ ] `SETUP.md` existe con pasos de configuración
- [ ] `API_LICITACIONES_ACTIVAS.md` existe
- [ ] `API_LICITACIONES_POR_CODIGO.md` existe

---

## 🧪 Fase 9: Prueba de APIs Internas

**Prueba cliente Mercado Público:**

```bash
node -e "
const path = require('path');
process.env.NEXT_PUBLIC_MP_TICKET = 'test';
process.env.NEXT_PUBLIC_MP_BASE_URL = 'https://api.mercadopublico.cl/servicios/v1/publico';
console.log('✓ Variables de entorno cargadas');
console.log('✓ Cliente Mercado Público importable');
"
```

- [ ] Script ejecuta sin errores

**Prueba cliente Gemini:**

```bash
node -e "
process.env.GEMINI_API_KEY = 'test';
console.log('✓ Gemini API importable');
"
```

- [ ] Script ejecuta sin errores

**Prueba clasificador:**

```bash
node -e "
const path = require('path');
console.log('✓ Servicio de clasificación importable');
"
```

- [ ] Script ejecuta sin errores

---

## 📊 Fase 10: Verificar Estructura de Carpetas

```bash
# Ver árbol de carpetas
tree -L 3 -I 'node_modules|.next' /home/camf/camfcode/MercadoPublico
```

Debe mostrar:
```
MercadoPublico/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx
│   │   ├── api/
│   │   └── licitaciones/
│   ├── components/
│   ├── lib/
│   │   ├── api/
│   │   ├── services/
│   │   ├── utils/
│   │   └── hooks/
│   └── types/
├── public/
├── .env.example
├── .env.local
├── docker-compose.yml
├── package.json
└── [más archivos de config]
```

- [ ] Estructura coincide con lo esperado

---

## 🎉 ¡LISTO!

Si todos los checkboxes están marcados, tu entorno está correctamente configurado.

**Siguiente paso:** Ver Task #2 para crear componentes UI

---

## 🆘 Si Algo Falla

1. Revisar los logs:
   ```bash
   docker-compose logs
   ```

2. Reiniciar servicios:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. Revisar variables en `.env.local`:
   ```bash
   cat .env.local
   ```

4. Revisar errores de TypeScript:
   ```bash
   npm run type-check
   ```

5. Revisar ESLint:
   ```bash
   npm run lint
   ```

6. Limpiar y reinstalar:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

**Fecha de verificación:** _______________

**Estado:** ☐ COMPLETADO  ☐ EN PROGRESO  ☐ CON ERRORES
