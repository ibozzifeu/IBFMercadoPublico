-- Separar 'Cloud e Infraestructura' en 'Cloud' e 'Infraestructura TI'
BEGIN;

-- 1. Cloud: tiene términos cloud explícitos
UPDATE licitaciones SET categoria = 'Cloud'
WHERE categoria = 'Cloud e Infraestructura'
  AND LOWER(nombre||' '||COALESCE(descripcion,'')) ~
    'aws|azure|gcp|oci|saas|paas|iaas|\bcloud\b|en la nube|kubernetes|docker|servidor virtual|backup cloud|microsoft azure|google cloud|amazon web|oracle cloud';

-- 2. Infraestructura TI: servidores físicos, datacenter, storage on-prem
UPDATE licitaciones SET categoria = 'Infraestructura TI'
WHERE categoria = 'Cloud e Infraestructura';

-- Resultado
SELECT categoria, COUNT(*) as total
FROM licitaciones
WHERE categoria IN ('Cloud', 'Infraestructura TI', 'Hardware y Equipos TI',
                    'Redes y Seguridad', 'Software y Licencias',
                    'Telecomunicaciones', 'Servicios TI')
GROUP BY categoria ORDER BY total DESC;

COMMIT;
