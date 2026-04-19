# Clasificador ML con Ollama

Clasifica licitaciones de Mercado Público usando `neural-chat` (LLM local 7B) con GPU NVIDIA, soportando fallback a CPU y al clasificador heurístico de palabras clave.

## Setup inicial

### 1. Instalar Ollama

```bash
# En Linux:
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Ejecutar setup

```bash
npm run ollama:setup
```

Esto detecta GPU NVIDIA, descarga `neural-chat` (~4.7GB) e inicia Ollama en background.

---

## Cómo clasifica

El clasificador usa un prompt few-shot con 8 categorías + regla de desempate:

**Categorías TI:** Cloud · Infraestructura TI · Hardware y Equipos TI · Redes y Seguridad · Software y Licencias · Servicios TI · Telecomunicaciones

**Categoría No TI:** obras civiles, fármacos, vigilancia física, alimentos, insumos médicos, servicios no digitales.

**Regla crítica:** en caso de duda, prefiere `No TI`. El fallback por defecto también es `No TI`.

El prompt incluye ejemplos positivos (firewalls → Redes y Seguridad, notebooks → Hardware) y negativos (neumáticos → No TI, medicamentos → No TI, puentes MOP → No TI).

---

## Scripts de evaluación y mantenimiento

```bash
# Generar reporte de muestreo manual (256 muestras por categoría/confianza)
npx dotenv -e .env.local -- tsx --tsconfig tsconfig.scripts.json \
  scripts/evaluacion/muestrear-clasificacion.ts
# Salida: data/evaluacion-clasificacion.md

# Test del prompt contra casos conocidos (15 casos, TP y FP)
npx dotenv -e .env.local -- tsx --tsconfig tsconfig.scripts.json \
  scripts/evaluacion/test-prompt-ollama.ts

# Reclasificación masiva del histórico (dry-run por defecto)
npx dotenv -e .env.local -- tsx --tsconfig tsconfig.scripts.json \
  scripts/evaluacion/reclasificar-historico.ts
# Con --apply escribe a BD; con --limite=N procesa solo N registros
```

---

## Integración en API

El cliente está en `src/lib/api/ollama.ts`:

```typescript
import { clasificarConOllama, isOllamaAvailable } from '@/lib/api/ollama'

const resultado = await clasificarConOllama(nombre, descripcion, items)
// → { categoria, confianza, razon, usedGPU }
```

### Flujo en `/api/sync`

```
licitación nueva
      ↓
clasificarConOllama() — Ollama disponible?
  └─ Sí → prompt few-shot → { categoria, confianza }
  └─ No → clasificarLicitacion() — heurístico palabras clave (fallback)
      ↓
db.licitacion.create({ ...datos, confianzaClasificacion: confianza })
```

Las licitaciones **existentes** no se reclasifican en sync — solo actualizan campos básicos (estado, fechas, montos).

---

## Variables de entorno

```env
OLLAMA_URL=http://localhost:11434   # Host validado contra allowlist (localhost, IPs privadas, .internal)
OLLAMA_MODEL=neural-chat
```

---

## Monitoreo

```bash
# GPU durante clasificación
watch -n 1 'nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader'

# Health check
curl http://localhost:11434/api/tags

# Logs de Ollama
tail -f /tmp/ollama.log
```

---

## Troubleshooting

### "Ollama no disponible"
```bash
ollama serve
# o en background:
nohup ollama serve > /tmp/ollama.log 2>&1 &
```

### Modelo no encontrado
```bash
ollama pull neural-chat
```

### GPU no detectada
```bash
nvidia-smi
tail -f /tmp/ollama.log | grep -i cuda
```

### Clasificaciones incorrectas en el histórico

Si se detectan patrones de error masivos (falsos positivos de categoría):

1. Revisar muestras: `scripts/evaluacion/muestrear-clasificacion.ts`
2. Testear el prompt actual: `scripts/evaluacion/test-prompt-ollama.ts`
3. Ajustar el prompt en `src/lib/api/ollama.ts → clasificarConOllama()`
4. Reclasificar histórico: `scripts/evaluacion/reclasificar-historico.ts --apply`
   (crea backup automático en `data/` antes de escribir)

---

## Arquitectura

```
API Mercado Público
        ↓
    /api/sync
        ↓
  clasificarConOllama()
        ↓
  validarOllamaUrl()     — allowlist host (SSRF protection)
  sanitizarTextoPrompt() — strip prompt injection chars
        ↓
  fetch("http://localhost:11434/api/generate")
        ↓
  neural-chat 7B (GPU RTX 4070 / CPU fallback)
        ↓
  { categoria, confianza, razon }   — mapeado a enum Categoria
        ↓
    PostgreSQL
```

---

## Modelos alternativos

| Modelo | Tamaño | VRAM | Velocidad |
|--------|--------|------|-----------|
| neural-chat | 7B | 4.7GB | ⭐⭐⭐ |
| mistral | 7B | 4GB | ⭐⭐⭐⭐ |
| llama2 | 7B | 4GB | ⭐⭐ |

Cambiar en `.env.local`: `OLLAMA_MODEL=mistral`

---

## Seguridad

- `OLLAMA_URL` validada contra allowlist (localhost, IPs RFC 1918, `.internal`) — evita SSRF
- Texto de licitación sanitizado antes del prompt (chars de control, palabras de inyección) y envuelto en `<texto_licitacion>...</texto_licitacion>`
- Error messages redactados antes de persistir en historial (no filtra DSN/tokens)
