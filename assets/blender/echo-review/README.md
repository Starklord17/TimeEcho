# Evidencia Echo v2

Renders Blender: front, three-quarter, profile, back, level-grey.
Renders y capturas del abrigo v2; runtime-placeholder conserva la referencia procedural.
Capturas runtime: runtime-front, runtime-profile, runtime-back, runtime-look,
runtime-placeholder y runtime-plate. La pantalla QA usa componentes de producción
con un recorrido sintético, no sustituye una partida manual de aceptación.

`metrics.json` contiene medidas evaluadas de Blender. `milestone-reviews.json`
registra la revisión del asset. Los esquemas de room-brief/openings/
final-report vienen del plugin Build 3D Game Rooms; este encargo es un personaje,
no una habitación. El validador genérico de rooms falla por artefactos de planta y
layout que no corresponden al alcance. Se conserva su salida en room-validator.txt,
sin simular aprobaciones ni afirmar que pasó el gate de rooms. La validación que
sí corresponde al asset se ejecuta en echoAsset.test.ts contra el GLB real.

El usuario pidió explícitamente autoría Blender local, exportación e integración
runtime antes de aprobación artística final: esa secuencia sustituye aquí las
etapas de referencia/Meshy/aprobación previa de exportación del flujo general.
No se usaron Meshy, generación paga ni imágenes de referencia de otro servicio.

Primera corrección: la visera se veía a través de la cabeza desde atrás; se agregó
un núcleo interno de cabeza para preservar profundidad y dirección. No se proponen
nuevas reglas globales del plugin sin aprobación humana.
