-- ============================================================
-- Migración: Reclasificación a nuevas categorías TI
-- Ejecutar SOLO después de aprobación explícita
-- ============================================================

BEGIN;

-- 1. Marcar como No TI licitaciones con términos médicos/no TI
UPDATE licitaciones SET categoria = 'No TI'
WHERE LOWER(nombre||' '||COALESCE(descripcion,'')) ~
  'medicamento|fármaco|farmacos|quirúrgico|quirurgico|cesfam|hospitalari|neurocirugía|cardiocirugía|biosimilar|reactivo.clíni|gases clínicos|gas clínico|catéter|vacuna|sutura|implante|prótesis|maquinaria.pesada|motocicleta|combustible|material.construccion|material de construcción|limpiafosas|uniforme.trabajo|vestuario.laboral|alimento.escolar|ración.diaria|giftcard|gift.card|mediagua';

-- 2. Cloud e Infraestructura
UPDATE licitaciones SET categoria = 'Cloud e Infraestructura'
WHERE categoria NOT IN ('No TI')
  AND LOWER(nombre||' '||COALESCE(descripcion,'')) ~
    'cloud|nube|aws|azure|gcp|oci|saas|paas|iaas|hosting|datacenter|data.center|servidor.virtual|virtualización|vmware|kubernetes|docker|storage|san |nas |rack|blade|ups.*(ti|servidor|data)';

-- 3. Hardware y Equipos TI
UPDATE licitaciones SET categoria = 'Hardware y Equipos TI'
WHERE categoria NOT IN ('No TI', 'Cloud e Infraestructura')
  AND LOWER(nombre||' '||COALESCE(descripcion,'')) ~
    'notebook|laptop|computador(a)?|pc.escritorio|workstation|impresora|scanner|escáner|multifuncional|monitor.*(computador|pc)|teclado|disco.duro|memoria.ram|proyector|datashow|tablet.*(corporativ|empresa)|equipo.computacional';

-- 4. Redes y Seguridad (fusión)
UPDATE licitaciones SET categoria = 'Redes y Seguridad'
WHERE categoria NOT IN ('No TI', 'Cloud e Infraestructura', 'Hardware y Equipos TI')
  AND LOWER(nombre||' '||COALESCE(descripcion,'')) ~
    'router|switch.*(red|cisco|hp|juniper)|fibra.óptica|fibra.optica|cableado.estructurado|conectividad|enlace.dedicado|firewall|vpn|ciberseguridad|antivirus|antimalware|backup.*(datos|sistema)|penetration.testing|iso.27001|mfa|control.de.acceso|siem|soc ';

-- 5. Telecomunicaciones
UPDATE licitaciones SET categoria = 'Telecomunicaciones'
WHERE categoria NOT IN ('No TI', 'Cloud e Infraestructura', 'Hardware y Equipos TI', 'Redes y Seguridad')
  AND LOWER(nombre||' '||COALESCE(descripcion,'')) ~
    'telefonía|telefonia|voip|voz.sobre.ip|pbx|central.telefónica|sip.trunk|troncal.sip|plan.celular.corporativ|comunicaciones.unificadas|videoconferencia|radiocomunicación';

-- 6. Software y Licencias
UPDATE licitaciones SET categoria = 'Software y Licencias'
WHERE categoria NOT IN ('No TI', 'Cloud e Infraestructura', 'Hardware y Equipos TI', 'Redes y Seguridad', 'Telecomunicaciones')
  AND LOWER(nombre||' '||COALESCE(descripcion,'')) ~
    'erp|crm|cms|\blicencia\b|licenciamiento|microsoft.office|office.365|m365|adobe|autocad|autodesk|desarrollo.*(software|web|aplicacion|plataforma)|base.de.datos|postgresql|oracle|sql.server|devops|sistema.contable|sistema.de.gestión|sistema.de.información|plataforma.digital|portal.web|api.rest|rpa|automatización';

-- 7. Servicios TI
UPDATE licitaciones SET categoria = 'Servicios TI'
WHERE categoria NOT IN ('No TI', 'Cloud e Infraestructura', 'Hardware y Equipos TI', 'Redes y Seguridad', 'Telecomunicaciones', 'Software y Licencias')
  AND LOWER(nombre||' '||COALESCE(descripcion,'')) ~
    'soporte.técnico|soporte.ti|helpdesk|help.desk|mesa.de.ayuda|outsourcing.ti|consultoría.ti|mantención.software|implementación.software|capacitación.ti|migración.de.datos|monitoreo.ti|auditoría.ti|sla.*(ti|tecnolog)';

-- 8. Lo que queda sin categorizar → No TI (no hay evidencia TI)
UPDATE licitaciones SET categoria = 'No TI'
WHERE categoria IN ('Tecnología General', 'Software/Sistemas', 'Hardware/Equipos',
                    'Redes/Telecomunicaciones', 'Seguridad TI', 'Servicios TI');

-- Resumen de resultados
SELECT categoria, COUNT(*) as total
FROM licitaciones
GROUP BY categoria
ORDER BY total DESC;

COMMIT;
