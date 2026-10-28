# Relay — level 5

Relay has a 60-second cycle and three FIFO memories. Four distinct actors must hold A1–A4 for 120 active physics ticks (2 seconds), then B1–B4 for 180 ticks (3 seconds). Losing occupancy resets only the current charge. Completed A survives until the next cycle. The final door latches open; only the player reaching the exit completes the level.

## Implementation stages

1. **Echo support:** ReplayCollection samples all supplied memories with reused vectors. The store remains responsible for per-level limits. The oldest visual echo fades when the current level's capacity is full.
2. **Rules:** RelayController implements PHASE_A → PHASE_B → EXIT_OPEN, distinct-actor matching, zero-step refresh, reset and collider cleanup.
3. **Playable prototype:** relayLayout defines the 20 × 32 interior, eight plates and exit partition. RelayRoom preserves independent physics and procedural fallback. RelayPuzzle displays plate IDs, phase and charge.
4. **Integration:** Relay follows Reversal in progression; free mode allows immediate entry without unlocking progress. Replay clears memories. The HUD displays three memories. Music reuses Convergence.
5. **Art:** Relay now uses the established Reversal vocabulary: ceramic wall panels, modular floor and ceiling, graphite reveals, ventilation slots, service panels, sector bands, station borders and emissive suspended luminaires. The editable Blender scene contains 538 modular parts; the runtime GLB joins them into seven material meshes (6,456 triangles, 459,772 bytes). The visual floor substrate is recessed below the tiles to prevent coplanar flicker. Gameplay colliders and routes are unchanged.
6. **Verification:** Native Blender 4.5.9 export passes geometry/material checks for all authored corners, shared PBR values, room dimensions and unobstructed exit door travel. The source `.blend` retains individual parts for editing. `relay-inspection.json` records the Blender version, hierarchy, triangle count and material-node checks. gltf-transform inspection confirms seven meshes/materials and no textures or animations. No texture conversion is needed; Draco is omitted to preserve the existing decoder-free loader. Visual verification was performed in the actual Three.js game, not Babylon Sandbox.

## Reproducible solution

In each of the first three cycles, walk to A1, A2 or A3 respectively, wait until elapsed time 17 seconds, then walk to the matching B plate and wait until elapsed time 36 seconds. Press R to record/reset. In cycle four, occupy A4 alongside the three echoes, then B4, and cross the exit after the second charge completes.

The automated route uses real PlayerController movement, Rapier collision, Recorder and ReplayCollection. It waits until elapsed time 10 seconds before traveling to A4 and 26 seconds before traveling to B4. It tests offsets of -1, 0 and +1 second for those departure times. All three variants reach the exit before 50 seconds, with more than 10 seconds remaining. The timing windows are example instructions, not hard-coded controller deadlines.

## Verification results

- 129 tests pass across 25 files, including four-cycle physical solutions, partial charges, phase ordering, stationary-echo failure, FIFO, Replay, progression and collider cleanup.
- TypeScript passes; lint has no errors and three existing warnings in docs/phase-11-review/colliders.tsx.
- Production build and build:check pass: initial JS approximately 203 kB; total gzip approximately 1.19 MB. Audio remains under 1.5 MB per level.
- Browser: Relay selectable in free mode; MEMORIES 0 / 3 and 3 / 3; three visible echoes; switch back to progression; victory UI and Replay; procedural fallback after deliberately aborting relay.glb.
- Victory UI was exercised using the development store. Actual puzzle completion is covered separately by the physical route tests, not claimed as a manually played browser solution.
- Short local rendering comparison (180 animation frames, first 30 excluded): Reversal with two echoes averaged 16.666 ms/frame, Relay with three averaged 16.667 ms/frame; both maximum 16.8 ms. This is a bounded local smoke test, not a cross-device performance guarantee.
- Browser console: existing favicon 404 and Three/Rapier deprecation warnings; deliberate missing-GLB test adds its expected load warning.

## Commands

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build:check
# Regenerate the shared art specification before native export:
node scripts/build-relay-art.mjs --spec-only
# Optional fallback export (overwrites relay.glb with a Three.js export):
node scripts/build-relay-art.mjs
# Canonical native export:
blender --background --python assets/blender/build_relay.py
```

The deterministic Three.js exporter also writes relay-art.json, used by the Blender script. Both derive collision structure from environment-layout.json. GLB bounds and triangle budget are validated by environmentAsset.test.ts. No existing level assets are regenerated.

## Detailed environment review

The detailed GLB was reviewed in-game from spawn, including plate IDs, A/B phase signage, the exit and the full floor/ceiling grid. A detected floor z-fighting issue was corrected by separating the substrate from the tile surfaces. No gameplay files or prior level assets were changed for this art pass. The earlier frame-timing measurements above apply to the initial prototype, not this detailed asset.
