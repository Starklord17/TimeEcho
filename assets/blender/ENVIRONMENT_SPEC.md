# Environment source contract

`build_environment.py` constructs `environment-kit.blend`, `door.blend`, and
private review scenes. It does not export GLBs or change runtime physics.
Run it from the repository root using Blender 5.2:

```sh
blender --background --python assets/blender/build_environment.py
```

## Coordinates and layout

All dimensions are metres. `environment-layout.json` uses Three.js Y-up;
the builder converts coordinates to Blender `(x, -z, y)`. A test compares the
manifest's colliders, stations, exits and spawns with the gameplay definitions.
The first room is 12 × 14 m; Split Signal and Convergence are 16 × 18 m.
Reversal is 12 × 32 m and centered at z=-1. Ceiling height is
3.6 m. Colliders remain authored by the application.

## Reusable scenes

Each asset has an `Asset_*` scene and an identity-transform `*_Root`.
Sources are Blender scene libraries: when opening one interactively, select the
corresponding `Asset_*` scene if Blender initially shows an empty default scene.
Floor, Wall, Exit and Light contain static meshes. Plate contains `Plate_Base`,
`Plate_Panel` and separate player/Echo indicator meshes. Triangle, Circle and
Square contain closed geometric signals. Floor tops lie at y=0; the light
origin lies on the ceiling underside, with geometry extending down 0.05 m.
The floor plate symbol sits directly on its panel at y=0.0675 m.

`Door_Root` contains `Door_Panel` and `Door_Frame`; the frame contains
`Door_FrameMesh` and `Door_Light`. The panel is 2.4 × 3.6 × 0.3 m, with its
origin at the floor centre. Only this panel moves, through 3.8 m vertically.
Materials are `M_Door_Panel`, `M_Door_Frame`, and `M_Door_Light`.

The divider aperture is 2.42 m wide, allowing 10 mm clearance on each side
of the panel. The header and ceiling have real Boolean slots, 2.44 × 0.34 m
in plan. An open-bottom service pocket above the ceiling contains the raised
leaf. This is visual geometry only; the existing 2.4 m physics opening is
unchanged. Signal backings contact the divider beside the opening.

## Materials and budgets

Environment materials share the `M_Environment_` prefix: Graphite, Ceramic,
Recess, Floor, Signal, Exit and Diffuser. They use solid colours, rough
surfaces and restrained emission. There are no textures, particle systems,
rigs or animation clips. Review lighting uses seven ceiling area lights in
the first room and eight in each larger room, including the exit chamber and
central corridor; these lights are not an approved runtime configuration.

The builder records actual triangle and material counts in
`environment-metrics.json`. It checks closed manifold meshes, ray-tested
openings and 121 positions along the door travel against the divider, frame,
ceiling and service pocket. Static meshes are combined by material. Budget
assertions reserve 16,000 triangles and 64 material draws for two Echoes,
within 150,000 triangles and 180 estimated draws per room. These estimates
are not runtime performance measurements.

## Export and runtime

Run `blender --background --python assets/blender/export_environment.py` after
the builder. The exporter selects only the active scene, normalizes the static
root name, and writes `empty-room.glb`, `split-signal.glb`, `convergence.glb`,
`door.glb` and `plate.glb` to `public/models/environment/`. It excludes UVs,
cameras, review lights, animations and Draco. Review scenes can be regenerated
from the public builder and manifest on a fresh checkout.

Each room loads asynchronously without remounting its physics world. Rejected or
unavailable files preserve procedural visuals. Room colliders are explicit
cuboids using the original dimensions, independent of mesh visibility. Door
lift follows the puzzle controller. Plate indicators receive independent
material instances. The floor signal follows the plate depression.

Lighting reads the fixture manifest, using unshadowed point lights and a
hemisphere fill. A restrained 2.5% pulse uses simulation time, freezing on pause
and restarting with each cycle. This web lighting approximation does not use
Blender area-light wattage directly, baked maps or external textures.

The room downloads are 413,776 / 659,040 / 661,608 / 392,184 bytes; the shared
door and plate are 19,732 and 12,732 bytes. Total files are 2.16 MB; a single level needs
at most 694,072 bytes of environment assets. These are external to the JS bundle.
Private measurements, review captures and approval history stay under `/docs/`.

## Multi-gate rooms

The layout manifest can also describe a `doors` array, scheduled `windows`, and
an explicit room `center`. Reversal uses a 12 × 32 m interior centered at z=-1,
three gate assemblies and four 2.4 × 1 m observation apertures with sill y=1.4.
Window colliders stay continuous; mullions identify them as viewing apertures.

Build only this room with:

```sh
blender --background --python assets/blender/build_environment.py -- --level reversal
```

The selective build delegates to `build_reversal.py`, reuses the material/prop
kit and writes an editable review scene without replacing existing sources or
GLBs. Door, plate, symbol, charge, conduit and exit proxies are excluded from
`Environment_Static`; these remain runtime-controlled devices. Wall facing
projects 3 mm from the structural surface to avoid coplanar faces. Each of the
three door sweeps is checked at 121 positions, with Boolean slots and service
pockets. Static geometry has a 14,000-triangle limit.

The exporter accepts the same `--level` selector and does not overwrite shared
props in selective mode. Its Reversal path requires an explicit local Form
approval record. Default builds/exports retain the three established rooms.

Reversal exports 6,944 static triangles across five material primitives; its GLB
is 392,184 bytes (424,648 bytes including the shared door and plate). Its runtime
validator checks the 12.6 × 32.6 m outer footprint, center z=-1 and floor bottom
y=-0.3, retaining the 14,000-triangle limit and the existing height limits. The
other levels are checked against their own footprints. Environment loading
hides only the procedural meshes and lights; the same rigid bodies and
explicit cuboid colliders remain mounted.
