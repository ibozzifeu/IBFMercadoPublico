-- CHECK constraint para confianzaClasificacion: rango 0-100 o NULL.
-- Previene inserts/updates directos a BD con valores fuera de rango
-- (el código aplica clamp, pero la defensa en capas protege de errores manuales).

-- Validar primero que no haya registros fuera de rango (debe devolver 0)
SELECT COUNT(*) AS registros_fuera_de_rango
FROM "licitaciones"
WHERE "confianzaClasificacion" IS NOT NULL
  AND ("confianzaClasificacion" < 0 OR "confianzaClasificacion" > 100);

-- Si el conteo es 0, aplicar el constraint:
ALTER TABLE "licitaciones"
ADD CONSTRAINT "confianza_clasificacion_rango"
CHECK (
  "confianzaClasificacion" IS NULL
  OR ("confianzaClasificacion" >= 0 AND "confianzaClasificacion" <= 100)
);

-- Confirmar que el constraint quedó aplicado
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = '"licitaciones"'::regclass
  AND conname = 'confianza_clasificacion_rango';
