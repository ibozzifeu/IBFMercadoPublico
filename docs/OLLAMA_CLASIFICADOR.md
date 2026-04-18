# Clasificador ML con Ollama

Reemplaza el clasificador heurístico de palabras clave con un modelo de ML entrenado con Ollama, soportando GPU NVIDIA con fallback a CPU.

## Setup inicial

### 1. Instalar Ollama

```bash
# Descarga desde https://ollama.ai
# En Linux:
curl -fsSL https://ollama.ai/install.sh | sh

# En Mac/Windows descarga el instalador
```

### 2. Ejecutar setup

```bash
# Detecta GPU automáticamente e instala modelo
npm run ollama:setup
```

Esto:
- Detecta GPU NVIDIA (RTX 4070 ✓)
- Descarga `neural-chat` (7B, ~4.7GB)
- Inicia Ollama en background si no está corriendo

## Crear dataset de entrenamiento

```bash
# Extrae licitaciones de BD, aplica split 70/30
npm run ollama:extract
```

Genera:
- `data/train.jsonl` — 70% entrenamiento
- `data/test.jsonl` — 30% evaluación
- Estadísticas por categoría

Requiere datos en BD con categorías ya asignadas (usa el clasificador actual para inicializar).

## Entrenar modelo

```bash
# Entrena con dataset 70%
npm run ollama:train
```

Genera:
- `data/training-metadata.json` — info del entrenamiento
- `data/evaluation-results.json` — accuracy por categoría
- Salida: categorías, confianza, razón

**Duración:**
- Con GPU: ~10-15 minutos (muestra de prueba)
- Con CPU: ~30-45 minutos

## Variables de entorno

Agregar a `.env.local`:

```env
# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=neural-chat
OLLAMA_GPU=1  # Detectado automáticamente
```

## Integración en API

El cliente Ollama está en `src/lib/api/ollama.ts`:

```typescript
import { clasificarConOllama } from '@/lib/api/ollama'

const resultado = await clasificarConOllama(
  nombre,
  descripcion,
  itemsDescripciones
)
// → { categoria, confianza, razon, usedGPU }
```

### En `/api/sync`

Cambiar línea del clasificador:

```typescript
// Antes (palabras clave)
const { categoria } = clasificarLicitacion(...)

// Después (Ollama)
const { categoria } = await clasificarConOllama(...)
```

## Monitoreo

### GPU durante entrenamiento

```bash
# En otra terminal
watch -n 1 'nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader'
```

### Logs de Ollama

```bash
tail -f /tmp/ollama.log
```

### Health check

```bash
curl http://localhost:11434/api/tags
```

## Troubleshooting

### "Ollama no disponible"

```bash
# Iniciar manualmente
ollama serve

# O si quieres background:
nohup ollama serve > /tmp/ollama.log 2>&1 &
```

### Modelo no encontrado

```bash
ollama pull neural-chat
```

### GPU no detectada

```bash
# Verificar
nvidia-smi

# Logs
tail -f /tmp/ollama.log | grep -i cuda
```

### Bajo accuracy en evaluación

Aumentar dataset:
1. Etiquetar más licitaciones manualmente
2. Ejecutar `npm run ollama:extract` nuevamente
3. Ejecutar `npm run ollama:train`

## Arquitectura

```
API Mercado Público
        ↓
    /api/sync
        ↓
  clasificarConOllama()
        ↓
  checkNvidiaGPU() → GPU NVIDIA o CPU
        ↓
  fetch("http://localhost:11434/api/generate")
        ↓
  neural-chat model
        ↓
  { categoria, confianza, razon }
        ↓
    PostgreSQL
```

## Modelos alternativos

| Modelo | Tamaño | VRAM | Velocidad | Accuracy |
|--------|--------|------|-----------|----------|
| neural-chat | 7B | 4.7GB | ⭐⭐⭐ | ⭐⭐⭐ |
| mistral | 7B | 4GB | ⭐⭐⭐⭐ | ⭐⭐ |
| llama2 | 7B | 4GB | ⭐⭐ | ⭐⭐⭐ |
| orca-mini | 3B | 2GB | ⭐⭐⭐⭐ | ⭐ |

Cambiar en `.env.local`: `OLLAMA_MODEL=mistral`

## Fallback a palabras clave

Si Ollama no está disponible, la clasificación falla safe:

```typescript
try {
  resultado = await clasificarConOllama(...)
} catch {
  // Fallback a heurístico
  resultado = clasificarLicitacion(...)
}
```

## Roadmap

- [ ] Fine-tuning completo cuando Ollama lo soporte
- [ ] Cache de clasificaciones (Redis)
- [ ] Reentrenamiento automático
- [ ] Métricas en dashboard
- [ ] A/B testing Ollama vs heurístico
