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
The first room is 12 × 14 m; the other rooms are 16 × 18 m. Ceiling height is
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

The room downloads are 413,776 / 659,040 / 661,608 bytes; the shared door and
plate are 19,732 and 12,732 bytes. Total files are 1.77 MB; a single level needs
at most 694,072 bytes of environment assets. These are external to the JS bundle.
Private measurements, review captures and approval history stay under `/docs/`.
