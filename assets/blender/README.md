# Fuentes Blender

## Echo — pendiente de aprobación artística

`echo.blend` es la fuente editable del primer modelo artístico integrado.
El contrato y la reexportación están en [ECHO_SPEC.md](ECHO_SPEC.md).
`build_echo.py` reconstruye fuente, renders y GLB; `export_echo.py` exporta la
fuente existente. Ejecutar desde la raíz del proyecto con Blender disponible.
La fuente, exportación e integración quedan versionadas como base de revisión;
la aprobación artística sigue pendiente.

## Door — modelo pendiente

El juego usa la puerta procedural. `assets/test-fixtures/door-contract.glb` es
solo una fixture de tests. Para crear el modelo de producción:

- Usar metros y escala 1. Panel de 2.4 × 3.6 × 0.3 m, apoyado en el suelo.
- `Door_Root` identidad, con hijos `Door_Panel` y `Door_Frame`; `Door_Light`
  debe ser hijo del marco. No duplicar nombres. Panel con origen local cero.
- Mantener el marco fuera del vano de 2.4 × 3.6 m; perfiles de 0.12 m y
  profundidad 0.4 m. Solo el panel se mueve, desde y=0 hasta y=3.8 en runtime.
- Frente Blender −Y, exportado a Three +Z hacia el spawn. La raíz se coloca en
  `[0, 0, -3]`. Esta orientación es distinta de la del Echo.
- Materiales simples `M_Door_Panel`, `M_Door_Frame`, `M_Door_Light`;
  objetivo de hasta 5.000 triángulos y sin texturas.
- Guardar `assets/blender/door.blend`. Exportar raíz y descendientes como GLB,
  +Y Up, materiales/normales y modificadores; sin animaciones, cámaras,
  luces puntuales ni Draco, a `public/models/environment/door.glb`.
- Activar `mode: 'glb'` en `src/puzzle/doorAsset.ts` y recargar. El validador
  comprueba jerarquía, transforms, dimensiones y apoyo; un fallo conserva
  el visual procedural. La física sigue definida por el juego.

Comprobar apertura, cierre, protección del vano, pausa y reinicios en el juego.
La guía manual ampliada y el historial son documentación privada local bajo
`docs/`, excluida de Git; no son requisitos para ejecutar el proyecto.
