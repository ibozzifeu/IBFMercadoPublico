-- CreateTable
CREATE TABLE "favoritos" (
    "id" TEXT NOT NULL,
    "codigoExterno" TEXT NOT NULL,
    "nota" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favoritos_codigoExterno_key" ON "favoritos"("codigoExterno");
