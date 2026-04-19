# Scripts de Carga Inicial

Scripts que se ejecutan **una sola vez** al levantar el sistema por primera vez, o cuando se necesita reprocesar datos históricos.

---

## Orden de ejecución recomendado

```
1. setup-ollama.sh          → Instalar y configurar Ollama con GPU
2. backfill-detalles.ts     → Poblar descripción e items de licitaciones existentes
3. extract-dataset.ts       → Extraer dataset de entrenamiento desde la BD
4. train-classifier.ts      → Entrenar modelo de clasificación con Ollama
```

Para evaluación y corrección de clasificaciones ver `scripts/evaluacion/`:
- `muestrear-clasificacion.ts` — reporte de muestras por categoría/confianza
- `test-prompt-ollama.ts`      — validar prompt contra casos conocidos
- `reclasificar-historico.ts`  — reclasificar histórico masivo (dry-run default)

---

## 1. setup-ollama.sh — Configurar Ollama

Detecta GPU NVIDIA, instala Ollama y descarga el modelo `neural-chat`.

```bash
npm run ollama:setup
```

**Requisitos:**
- GPU NVIDIA opcional (usa CPU si no hay)
- ~4 GB de espacio en disco para el modelo

**Cuándo ejecutar:** solo la primera vez o al cambiar de servidor.

---

## 2. backfill-detalles.ts — Poblar detalles de licitaciones

Recorre todas las licitaciones en BD sin descripción y llama a la API de detalle de Mercado Público para completar:
- Descripción completa
- Items / productos solicitados
- Datos completos del comprador (región, dirección, responsable)
- Fechas precisas (creación, publicación, cierre)
- Monto estimado

```bash
npm run backfill:detalles
```

**Características:**
- **Reanudable**: si se interrumpe, al relanzar continúa donde quedó (solo procesa `descripcion IS NULL`)
- Concurrencia de 2 requests + 800ms de delay para respetar el rate limit de la API
- Muestra progreso en tiempo real con ETA
- Las licitaciones sin detalle disponible en la API quedan marcadas con `descripcion = ""`

**Tiempo estimado:** ~30 minutos para 4.000 registros.

**Cuándo ejecutar:** después de una migración o import masivo de licitaciones sin detalle.

---

## 3. extract-dataset.ts — Extraer dataset de entrenamiento

Genera archivos `data/train.jsonl` y `data/test.jsonl` con licitaciones clasificadas, con split 70/30 y muestreo balanceado por categoría.

```bash
npm run ollama:extract
```

**Salida:**
```
data/
  train.jsonl   → 70% del dataset
  test.jsonl    → 30% del dataset
```

**Cuándo ejecutar:** antes de reentrenar el clasificador, o cuando cambien las categorías.

---

## 4. train-classifier.ts — Entrenar clasificador Ollama

Usa el dataset generado en el paso anterior para hacer fine-tuning del modelo `neural-chat` y evalúa la precisión por categoría.

```bash
npm run ollama:train
```

**Requisitos:** Ollama corriendo (`ollama serve`) y dataset generado en `data/`.

**Cuándo ejecutar:** después de cambiar categorías, agregar datos de entrenamiento, o si la precisión del clasificador baja.

---

## Variables de entorno requeridas

Todas se leen desde `.env.local` en la raíz del proyecto:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Conexión PostgreSQL |
| `MP_TICKET` | Token API Mercado Público |
| `MP_BASE_URL` | URL base API (`https://api.mercadopublico.cl/servicios/v1/publico`) |
| `OLLAMA_URL` | URL Ollama (default: `http://localhost:11434`) |
| `OLLAMA_MODEL` | Modelo a usar (default: `neural-chat`) |
