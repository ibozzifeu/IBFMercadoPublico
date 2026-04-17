-- CreateTable
CREATE TABLE "licitaciones" (
    "id" TEXT NOT NULL,
    "codigoExterno" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL,
    "codigoEstado" INTEGER NOT NULL,
    "fechaCierre" TIMESTAMP(3),
    "fechaCreacion" TIMESTAMP(3),
    "fechaPublicacion" TIMESTAMP(3),
    "moneda" TEXT,
    "montoEstimado" DOUBLE PRECISION,
    "categoria" TEXT NOT NULL DEFAULT 'Tecnología General',
    "compradorNombre" TEXT,
    "compradorOrganismo" TEXT,
    "compradorUnidad" TEXT,
    "compradorRut" TEXT,
    "compradorCodigoUnidad" TEXT,
    "compradorRegion" TEXT,
    "compradorComuna" TEXT,
    "compradorDireccion" TEXT,
    "usuarioNombre" TEXT,
    "usuarioCargo" TEXT,
    "usuarioEmail" TEXT,
    "usuarioRut" TEXT,
    "tipoLicitacion" TEXT,
    "codigoTipo" INTEGER,
    "itemsCantidad" INTEGER NOT NULL DEFAULT 0,
    "etapas" INTEGER NOT NULL DEFAULT 1,
    "urlApiMercado" TEXT,
    "fechaSincronizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_licitacion" (
    "id" TEXT NOT NULL,
    "licitacionId" TEXT NOT NULL,
    "correlativo" INTEGER NOT NULL,
    "nombreProducto" TEXT NOT NULL,
    "descripcion" TEXT,
    "unidadMedida" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "codigoProducto" INTEGER,
    "codigoCategoria" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_licitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analisis_ia" (
    "id" TEXT NOT NULL,
    "licitacionId" TEXT NOT NULL,
    "tipoAnalisis" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "metadata" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analisis_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_sincronizacion" (
    "id" TEXT NOT NULL,
    "fechaEjecucion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "licitacionesProcesadas" INTEGER NOT NULL DEFAULT 0,
    "licitacionesNuevas" INTEGER NOT NULL DEFAULT 0,
    "licitacionesActualizadas" INTEGER NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL,
    "errorMensaje" TEXT,
    "duracionSegundos" DOUBLE PRECISION,

    CONSTRAINT "historial_sincronizacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "licitaciones_codigoExterno_key" ON "licitaciones"("codigoExterno");

-- CreateIndex
CREATE INDEX "licitaciones_codigoExterno_idx" ON "licitaciones"("codigoExterno");

-- CreateIndex
CREATE INDEX "licitaciones_categoria_idx" ON "licitaciones"("categoria");

-- CreateIndex
CREATE INDEX "licitaciones_fechaCierre_idx" ON "licitaciones"("fechaCierre");

-- CreateIndex
CREATE INDEX "licitaciones_estado_idx" ON "licitaciones"("estado");

-- CreateIndex
CREATE INDEX "licitaciones_codigoEstado_idx" ON "licitaciones"("codigoEstado");

-- CreateIndex
CREATE INDEX "items_licitacion_licitacionId_idx" ON "items_licitacion"("licitacionId");

-- CreateIndex
CREATE INDEX "analisis_ia_licitacionId_idx" ON "analisis_ia"("licitacionId");

-- CreateIndex
CREATE UNIQUE INDEX "analisis_ia_licitacionId_tipoAnalisis_key" ON "analisis_ia"("licitacionId", "tipoAnalisis");

-- CreateIndex
CREATE INDEX "historial_sincronizacion_fechaEjecucion_idx" ON "historial_sincronizacion"("fechaEjecucion");

-- AddForeignKey
ALTER TABLE "items_licitacion" ADD CONSTRAINT "items_licitacion_licitacionId_fkey" FOREIGN KEY ("licitacionId") REFERENCES "licitaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analisis_ia" ADD CONSTRAINT "analisis_ia_licitacionId_fkey" FOREIGN KEY ("licitacionId") REFERENCES "licitaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
