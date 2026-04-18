# Integración Clasificador Ollama - Para Revisión

## Cambios realizados

### 1. **src/lib/services/sync.ts**
- Importa `clasificarConOllama` y `isOllamaAvailable` desde `src/lib/api/ollama.ts`
- `transformarLicitacion()` es ahora async
- Intenta clasificar con Ollama primero
- Fallback automático a heurístico si Ollama no está disponible
- Agrega campo `confianzaClasificacion` a datos guardados en BD
- Log de resumen al final: qué clasificador se usó (Ollama + GPU/CPU vs Heurístico)
- Retorna en `ResultadoSync`: `usedOllama` y `usedGPU` para auditoría

### 2. **prisma/schema.prisma**
- Agrega campo `confianzaClasificacion: Float?` al modelo Licitacion
- Nuevo índice en `confianzaClasificacion` para búsquedas rápidas

### 3. **migrations/add_confianza_clasificacion.sql**
Script SQL para ejecutar manualmente:
```sql
ALTER TABLE "licitaciones"
ADD COLUMN "confianzaClasificacion" DECIMAL(5,2);

CREATE INDEX "idx_licitaciones_confianza"
ON "licitaciones"("confianzaClasificacion");
```

## Flujo de clasificación

```
API Mercado Público
       ↓
 /api/sync (sincronizarLicitaciones)
       ↓
 transformarLicitacion (async)
       ↓
 isOllamaAvailable()? 
       ↙              ↘
      SÍ              NO
       ↓              ↓
clasificarConOllama() → clasificarLicitacion()
       ↓
   { categoria, confianza, usedGPU }
       ↓
   save to BD
       ↓
 Log: "🤖 GPU NVIDIA" o "📊 Heurístico"
```

## Instalación y prueba

### Paso 1: Revisar SQL
```
cat migrations/add_confianza_clasificacion.sql
```

### Paso 2: Ejecutar migración SQL (si apruebas)
```sql
-- Ejecutar en PostgreSQL
psql $DATABASE_URL < migrations/add_confianza_clasificacion.sql
```

O con Prisma (recomendado):
```bash
npx prisma migrate dev --name add_confianza_clasificacion
```

### Paso 3: Setup Ollama (una sola vez)
```bash
npm run ollama:setup
```

### Paso 4: Prueba en dev
```bash
npm run dev
# La siguiente sincronización usará Ollama si está disponible
# Si no, fallback automático a heurístico
```

## Comportamiento en producción

- Si Ollama está corriendo: usa Ollama + GPU si disponible
- Si Ollama no está corriendo: fallback silencioso a heurístico
- Confianza se guarda en BD para auditoría/analytics
- Logs indican qué clasificador se usó en cada sync

## Testing

Verificar logs después de sync:
```bash
npm run dev
# Abre http://localhost:3000/api/sync

# En logs deberías ver:
# ✅ Sync completado: 50 procesadas...
# 🤖 Clasificación: ✅ GPU NVIDIA
#    O
# 📊 Clasificación: Heurístico (Ollama no disponible)
```

## Queries útiles en BD

```sql
-- Ver confianzas de clasificación
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN "confianzaClasificacion" IS NOT NULL THEN 1 END) as con_confianza,
  ROUND(AVG("confianzaClasificacion"), 2) as promedio,
  MIN("confianzaClasificacion") as minimo,
  MAX("confianzaClasificacion") as maximo
FROM "licitaciones";

-- Distribución por categoría y confianza
SELECT 
  categoria,
  COUNT(*) as total,
  ROUND(AVG("confianzaClasificacion"), 2) as confianza_promedio
FROM "licitaciones"
WHERE "confianzaClasificacion" IS NOT NULL
GROUP BY categoria
ORDER BY confianza_promedio DESC;

-- Licitaciones de baja confianza
SELECT 
  id, nombre, categoria, "confianzaClasificacion"
FROM "licitaciones"
WHERE "confianzaClasificacion" < 50
ORDER BY "confianzaClasificacion" ASC;
```

## Rollback (si necesario)

```sql
-- Eliminar columna
ALTER TABLE "licitaciones"
DROP COLUMN "confianzaClasificacion";

-- Eliminar índice
DROP INDEX "idx_licitaciones_confianza";
```

---

**¿Apruebas la integración? Cambios aprobados:**
1. ✅ Modifiqué sync.ts para usar Ollama con fallback
2. ✅ Agregué campo confianzaClasificacion al schema
3. ✅ Creé script SQL para revisar

**Próximos pasos:**
- [ ] Aprobar cambios en schema
- [ ] Ejecutar migración SQL
- [ ] Ejecutar `npm run ollama:setup`
- [ ] Probar sync en dev
