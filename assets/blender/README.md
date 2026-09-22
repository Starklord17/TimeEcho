# Blender sources

## Echo

`echo.blend` is the editable source for the first integrated art asset. Its
contract and re-export process are documented in [ECHO_SPEC.md](ECHO_SPEC.md).

Run the scripts from the repository root with Blender available:

- `build_echo.py` rebuilds the source file, review renders, and runtime GLB.
- `export_echo.py` exports the existing Blender source without rebuilding it.
- `animate_echo.py` updates glasses, rig and clips on the existing body meshes.
- `fit_echo_neck.py` updates only the opaque neck insert, preserving the existing
  rig, weights and clips.
- `render_echo_neck.py` renders close-ups through Idle/Walk and head turns.
- `render_echo.py` renders front, three-quarter, profile and back on light/dark
  backgrounds, plus a Walk pose.

The model includes a black coat, trousers, boots and dark glasses while preserving
the spectral head. A small rig provides in-place `Idle` and `Walk` clips; recorded
movement and gaze remain controlled by the runtime. See the asset contract before
editing or exporting animated geometry.

## Environment and door sources

`build_environment.py` builds `environment-kit.blend`, `door.blend` and local
review scenes from `environment-layout.json`. It verifies the door travel and
mesh budgets without exporting production GLBs. See
[ENVIRONMENT_SPEC.md](ENVIRONMENT_SPEC.md) for hierarchy, units and validation.

`export_environment.py` exports the generated room scenes, door and plate to
`public/models/environment/`. Run the builder before the exporter on a fresh
checkout. Runtime loads only the current room and keeps procedural fallbacks.
`assets/test-fixtures/door-contract.glb` is only a test fixture. Follow this
contract when creating the production model:

- Use metric units at scale 1. The panel is 2.4 × 3.6 × 0.3 metres and rests on
  the floor.
- `Door_Root` has identity transforms and contains `Door_Panel` and `Door_Frame`.
  `Door_Light` is a child of the frame. Names must be unique and the panel origin
  must be at the local floor centre.
- Keep the frame outside the 2.4 × 3.6 metre opening. Use 0.12 metre profiles and
  0.4 metre depth. Only the panel moves, from y=0 to y=3.8 at runtime.
- The Blender front faces −Y and exports toward Three.js +Z, facing the spawn.
  Runtime places the root at each level's door location (z=−3 or z=−6).
  This differs from Echo orientation.
- Use the material names `M_Door_Panel`, `M_Door_Frame`, and `M_Door_Light`.
  Target no more than 5,000 triangles and no textures for the first version.
- Save the source as `assets/blender/door.blend`. Export the root and descendants
  as a +Y-up GLB with materials, normals, and modifiers, without animations,
  cameras, punctual lights, or Draco compression. The runtime destination is
  `public/models/environment/door.glb`.
- The door uses `glb` mode in `src/puzzle/doorAsset.ts`. Contract or
  loading failures preserve the procedural visual; gameplay physics remain
  defined by the application.

Test opening, closing, doorway protection, pause, and session resets in the game
before accepting the production model.
