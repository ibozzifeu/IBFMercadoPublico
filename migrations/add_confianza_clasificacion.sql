-- AddColumn confianzaClasificacion a tabla licitaciones
-- Campo numérico 0-100 para confianza del clasificador
-- Default NULL para registros existentes (sin confianza)

ALTER TABLE "licitaciones"
ADD COLUMN "confianzaClasificacion" DECIMAL(5,2);

-- Crear índice para búsquedas por confianza
CREATE INDEX "idx_licitaciones_confianza"
ON "licitaciones"("confianzaClasificacion");

-- Mostrar resultado
SELECT
  COUNT(*) as total_registros,
  COUNT(CASE WHEN "confianzaClasificacion" IS NOT NULL THEN 1 END) as con_confianza,
  ROUND(AVG("confianzaClasificacion")::numeric, 2) as confianza_promedio
FROM "licitaciones";
