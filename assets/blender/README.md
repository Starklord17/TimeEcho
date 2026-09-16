# Blender sources

## Echo

`echo.blend` is the editable source for the first integrated art asset. Its
contract and re-export process are documented in [ECHO_SPEC.md](ECHO_SPEC.md).

Run the scripts from the repository root with Blender available:

- `build_echo.py` rebuilds the source file, review renders, and runtime GLB.
- `export_echo.py` exports the existing Blender source without rebuilding it.

The model includes a black coat, trousers, and boots while preserving the Echo's
spectral head.

## Door — model pending

The game currently uses the procedural door.
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
  Runtime places the root at `[0, 0, -3]`. This differs from Echo orientation.
- Use the material names `M_Door_Panel`, `M_Door_Frame`, and `M_Door_Light`.
  Target no more than 5,000 triangles and no textures for the first version.
- Save the source as `assets/blender/door.blend`. Export the root and descendants
  as a +Y-up GLB with materials, normals, and modifiers, without animations,
  cameras, punctual lights, or Draco compression. The runtime destination is
  `public/models/environment/door.glb`.
- Change `mode` to `glb` in `src/puzzle/doorAsset.ts`, then reload. Contract or
  loading failures preserve the procedural visual; gameplay physics remain
  defined by the application.

Test opening, closing, doorway protection, pause, and session resets in the game
before accepting the production model.
