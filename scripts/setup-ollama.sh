#!/bin/bash

# Setup Ollama con detección de GPU
# Uso: bash scripts/setup-ollama.sh

set -e

echo "🚀 Setup Ollama para clasificación de licitaciones"
echo "=================================================="

# Detectar GPU
echo ""
echo "🔍 Detectando hardware..."
if command -v nvidia-smi &> /dev/null; then
    echo "✅ GPU NVIDIA detectada:"
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
    export OLLAMA_GPU=1
else
    echo "⚠️  No se detectó GPU NVIDIA, usando CPU"
    export OLLAMA_GPU=0
fi

# Verificar si Ollama está instalado
echo ""
echo "🔍 Verificando instalación de Ollama..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama ya está instalado"
    ollama --version
else
    echo "📥 Descargando e instalando Ollama..."
    echo "   Visitando: https://ollama.ai"
    echo "   Descarga la versión para tu sistema operativo"
    echo ""
    echo "   En Linux:"
    echo "   curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi

# Iniciar Ollama en background si no está corriendo
echo ""
echo "🔄 Verificando si Ollama está corriendo..."
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "⏳ Iniciando Ollama en background..."
    if [ "$OLLAMA_GPU" = "1" ]; then
        echo "   Con aceleración GPU"
    else
        echo "   En modo CPU"
    fi

    nohup ollama serve > /tmp/ollama.log 2>&1 &
    OLLAMA_PID=$!
    echo "   PID: $OLLAMA_PID"

    # Esperar a que Ollama esté listo
    echo "⏳ Esperando a que Ollama inicie..."
    for i in {1..30}; do
        if curl -s http://localhost:11434/api/tags > /dev/null; then
            echo "✅ Ollama está listo"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo "❌ Timeout esperando Ollama"
            tail -20 /tmp/ollama.log
            exit 1
        fi
    done
else
    echo "✅ Ollama ya está corriendo"
fi

# Descargar modelo si no existe
echo ""
echo "📦 Verificando modelo: neural-chat"
if ! ollama list | grep -q neural-chat; then
    echo "📥 Descargando neural-chat (7B, ~4.7GB)..."
    echo "   Con GPU: ~10-15 minutos"
    echo "   Con CPU: ~30-45 minutos"
    echo ""

    ollama pull neural-chat

    echo ""
    echo "✅ Modelo descargado"
else
    echo "✅ Modelo neural-chat ya disponible"
fi

# Mostrar modelos disponibles
echo ""
echo "📋 Modelos disponibles:"
ollama list

echo ""
echo "✅ Setup completado"
echo ""
echo "📌 Próximos pasos:"
echo "   1. Ejecutar: npx ts-node scripts/extract-dataset.ts"
echo "   2. Ejecutar: npx ts-node scripts/train-classifier.ts"
echo ""
