# Echo v1 — revisión artística pendiente

## Métricas finales

- Blender 5.2.0 LTS, autoría local mediante `build_echo.py`; cero servicios pagos.
- Dimensiones: **0.588 m ancho × 1.700 m alto × 0.275 m profundidad**.
- **3.368 triángulos**, 10 meshes, 3 materiales; GLB ~71 KiB.
- Sin armature, clips, texturas, partículas ni shaders personalizados.
- Root identidad; base local −0.91 m respecto del centro reproducido de la cápsula.
  Al situar la raíz a y≈0.91, los pies apoyan en suelo. El spawn inicial y el offset
  del character controller pueden dejar un margen centimétrico antes de asentarse.

## Jerarquía

```text
Echo_Root
├── Echo_Body
│   ├── Echo_Torso
│   ├── Echo_Arm_Left / Echo_Arm_Right
│   ├── Echo_Leg_Left / Echo_Leg_Right
│   ├── Echo_Core
│   └── Echo_Spine
└── Echo_HeadPivot (altura local 0.58 m)
    ├── Echo_Head
    ├── Echo_HeadCore
    └── Echo_Gaze
```

Core se ubica bajo Body para acompañar el yaw; el núcleo de cabeza acompaña la
rotación completa del HeadPivot. No hay cuerpos físicos ni sensores en el asset.
Meshes tienen rotación cero y escala uno, con geometría horneada en sus coordenadas.

## Orientación y desviación necesaria

La fuente editable mira hacia **Blender −Y**. El exportador glTF +Y Up transforma
ese frente en Three +Z, pero ReplaySampler y la cámara de Time Echo miran hacia
**Three −Z** con quaternion identidad. Se aplica una conversión de base de 180°
sobre Z a coordenadas de mesh y posiciones locales **solo durante exportación**.
Root y transforms quedan identidad; no existe rotación correctiva en runtime.
La fuente `.blend` se guarda antes de esa conversión. No exportar manualmente sin
el paso de conversión: el validador rechaza la visera orientada hacia +Z.

## Materiales y capas

- `M_Echo_Shell`: cian pálido, alpha 0.62, roughness 0.4, emisión 0.18.
- `M_Echo_Core`: cian más oscuro/saturado, alpha 1, emisión 0.4.
- `M_Echo_Gaze`: blanco-cian, alpha 0.95, emisión 1.1.

Principled BSDF exportable. Runtime conserva depth testing, sin blending aditivo;
shell/gaze no escriben profundidad, core sí. La capa interna opaca de cabeza
corrige la visera que se transparentaba desde atrás en la primera revisión.
No es un segundo personaje duplicado: solo columna/núcleo y volumen interno de
cabeza para conservar profundidad y dirección. El exterior permanece translúcido.

## Reproducir o editar

Requisito: Blender disponible en `PATH` (o sustituir `blender` por su ejecutable).
La autoría se verificó con Blender 5.2.0 LTS desde un volumen temporal; esa ejecución
no instaló Blender globalmente. Ejecutar los comandos desde la raíz del repositorio.

Construcción completa (sobrescribe fuente/renders/exportación):

```sh
blender --background --python assets/blender/build_echo.py
```

Para editar la fuente manualmente y exportarla sin reconstruirla:

```sh
blender --background assets/blender/echo.blend --python assets/blender/export_echo.py
```

GLB único, selección de Echo_Root y descendientes, +Y Up, Apply Modifiers,
sin cámaras/luces de revisión ni animaciones. Fuente: `assets/blender/echo.blend`.
Destino: `public/models/characters/echo.glb`. Los renders de fondo neutro conservan
el frente de autoría −Y; las capturas runtime muestran la conversión ya aplicada.

## Integración y revisión

Echo.tsx mantiene ReplaySampler, PlaybackClock, visibilidad y transforms del root,
yaw corporal y quaternion completo de cabeza. EchoVisual carga/clona la jerarquía
y comparte geometría de caché; clona una vez cada uno de los tres materiales por
instancia y libera esos clones al desmontar. Ciclos ordinarios no recargan el GLB.
Suspense y error boundary conservan ProceduralEcho si falla carga o contrato.

El validador y sus tests comprueban nombres, duplicados, jerarquía, dimensiones,
root, apoyo, frente, materiales y presupuesto, cargando el GLB real.

Con `pnpm dev`, abrir `/echo-review.html`: usa Canvas/FOV 70°, Echo, reloj, sensores
y visuales reales del puzzle; permite frente/perfil/espalda, movimiento, mirada,
reinicio y comparación procedural. Es una página de QA con recorrido sintético
creado por Recorder, no una partida manual ni un nuevo modo de juego. No se incluye
en el build normal. La ruta principal sigue usando el GLB con grabaciones reales.

Revisar imágenes en `echo-review/`. **Aprobación artística pendiente**: no se
elimina el fallback ni se trabaja en otro asset hasta revisión del usuario.
