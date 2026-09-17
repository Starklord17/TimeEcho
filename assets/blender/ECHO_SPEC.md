# Echo asset contract

## Source and budget

- Editable source: `assets/blender/echo.blend`, Blender 5.2.0 LTS.
- Runtime: `public/models/characters/echo.glb`, **276,492 bytes** (270 KiB).
- Rest dimensions: **0.588 m wide × 1.700 m tall × 0.305 m deep**.
- **5,896 triangles**, 26 authored meshes, 8 materials, 14 bones.
- Hard limit: **8,000 triangles**. No textures, cloth, particles or custom shaders.
- Root identity; feet at runtime local y = −0.91 m. No collider.

## Hierarchy

```text
Echo_Root
├── Echo_Body                         # recorded yaw, never a clip target
│   └── Echo_Rig                      # identity object transform
│       ├── Echo_NeckGuard            # opaque collar, weighted to spine
│       ├── Echo_Hips
│       │   ├── Echo_SpineBone
│       │   │   ├── Echo_UpperArm_Left / Right
│       │   │   │   └── Echo_Forearm_Left / Right
│       │   │   └── Echo_Tail_Left / Right
│       │   └── Echo_Thigh_Left / Right
│       │       └── Echo_Shin_Left / Right
│       │           └── Echo_Foot_Left / Right
│       └── skinned torso, arms, legs, coat halves, collars, cuffs, core,
│           spine and chest light
└── Echo_HeadPivot                    # recorded full look quaternion
    ├── Echo_Head
    ├── Echo_HeadCore
    ├── Echo_GlassesBridge
    ├── Echo_GlassesFrame_Left / Right
    ├── Echo_GlassesLens_Left / Right
    ├── Echo_GlassesTemple_Left / Right
    └── Echo_GlassesAccent_Left / Right
```

Existing body geometry receives vertex weights. Lower coat vertices follow two
tail bones; the upper coat follows the spine. Cuffs follow forearms. The head is
not skinned. glTF material primitives may appear as children of authored meshes.

`Echo_NeckGuard` is an opaque charcoal raised collar using `M_Echo_Fabric`,
weighted entirely to the existing spine so it follows the coat during movement.
Its base overlaps the coat; a narrow inner cap maintains contact during head turns.
The bottom 12.5 cm of the head uses opaque cyan `M_Echo_Chin` to block the collar
silhouette. The upper 70% retains its original transparency, including the face
and glasses area. No extra head motion or clip tracks are used. Recorded look,
Idle and Walk remain unchanged.

## Materials

| Material              | Appearance                               | Alpha | Roughness | Emission |
| --------------------- | ---------------------------------------- | ----- | --------- | -------- |
| `M_Echo_Shell`        | Pale cyan spectral head                  | 0.62  | 0.40      | 0.18     |
| `M_Echo_Chin`         | Opaque cyan lower head                   | 1     | 0.40      | 0.18     |
| `M_Echo_Core`         | Inner head, chest, cuffs, temple accents | 1     | 0.40      | 0.40     |
| `M_Echo_Coat`         | Charcoal coat and sleeves                | 1     | 0.34      | 0        |
| `M_Echo_Fabric`       | Dark trousers and torso                  | 1     | 0.80      | 0        |
| `M_Echo_Boots`        | Boots and gloves                         | 1     | 0.48      | 0        |
| `M_Echo_GlassesFrame` | Graphite frame, bridge and temples       | 1     | 0.38      | 0        |
| `M_Echo_GlassesLens`  | Dark, subtly reflective lenses           | 1     | 0.24      | 0        |

All use exportable Principled BSDF. Only the shell is transparent and does not
write depth. The opaque inner head occludes the front lenses from behind.
The former `Echo_Gaze` mesh and material are not exported.

## Clips and runtime

Exactly two looping clips sampled at 30 fps:

- **Idle**, 3 seconds: minimal spine breathing, stationary feet.
- **Walk**, 1 second: alternating thighs and arms, knee flexion, foot correction,
  slight weight shift and two restrained coat-tail oscillations.

Only the 14 named bones may receive tracks. Root, body, rig object and head are
never animation targets. Translations remain constant except for a vertical hips
correction under 4 cm to maintain support. Clips return to their initial pose,
with no accumulated root motion.

`EchoMotion` derives horizontal speed from adjacent recorded positions, builds a
120 Hz timeline per immutable run, blends over 0.15 seconds and advances Walk by
travelled distance (0.8 m per authored cycle). No live input is consulted.
`EchoAnimator` samples both clips at absolute replay time. Pause, restart and
backwards seeks are independent of rendering FPS. At the end of a partial run,
position remains fixed and Walk fades to Idle.

Runtime clones skeletons and materials per instance, shares cached geometry and
disposes its mixer, cloned materials and skeleton resources on unmount.
The procedural fallback remains available for loading and contract failures.

## Authoring and export

Run from the repository root with Blender available:

```sh
# Incremental update preserving the existing body meshes.
blender --background assets/blender/echo.blend --python assets/blender/animate_echo.py
# Update only the neck insert, preserving existing rig, weights and clips.
blender --background assets/blender/echo.blend --python assets/blender/fit_echo_neck.py
# Export the saved source.
blender --background assets/blender/echo.blend --python assets/blender/export_echo.py
# Eight light/dark views and a Walk pose.
blender --background assets/blender/echo.blend --python assets/blender/render_echo.py
# Neck close-ups for Idle/Walk and the full supported pitch range.
blender --background assets/blender/echo.blend --python assets/blender/render_echo_neck.py -- after
```

`build_echo.py` is a destructive full rebuild from the original loft definitions,
followed by the glasses/animation upgrade. Prefer incremental editing for a source
with manual changes. `animate_echo.py` replaces generated glasses, weights, rig and
clips; manual edits to those parts are not preserved.

Authoring faces Blender −Y. Export rotates mesh coordinates, local positions and
armature rest data by π around Z before glTF +Y-up conversion, producing runtime
−Z. Bone-local channels remain in their rotated rest basis. The saved source is
not overwritten. Reload the source before another export. Review cameras and
lights are excluded.

## Verification

`echoAsset.test.ts` loads the real GLB and checks hierarchy, materials, budget,
clip targets, loop closure, bounded displacement, independent skeletons, head
control and evaluated animated feet. `EchoMotion.test.ts` checks transitions,
partial runs, pause, seeks, restarts and display-rate independence.

With `pnpm dev`, open `/echo-review.html`. The puzzle fixture uses the production
Echo, Recorder and sensors with a synthetic partial run. **Idle / Walk comparison**
uses the production visual and animator, with time, yaw, pitch, pause/reset and
light/dark background controls. The review entry is excluded from production.
Use **Neck close-up** to inspect the joint while changing time and look direction.
