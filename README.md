# Time Echo

Time Echo is a browser-based first-person temporal puzzle game. Every cycle records
the player's movement, then replays saved runs as Echoes that can activate room
sensors. The current build contains four connected puzzle levels and a
Blender-authored Echo character. Unlocked levels can be replayed during the current session;
reloading the page resets progress.

## Requirements

- Node.js 22.12 or newer
- pnpm 10.33.2
- A desktop browser with WebGL support

## Getting started

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite.

## Controls

- **Enter / continue:** start or resume the game and request pointer lock.
- **WASD:** move.
- **Mouse or arrow keys:** look around.
- **R:** finish the current recording and start the next cycle.
- **Escape:** pause and release the mouse.
- **M:** mute or unmute audio. Music and effects volumes are separate controls
  in the pause screen and persist between visits.
- **Drag mode:** if pointer lock is unavailable, hold the primary mouse button
  and drag to look around.

## Stack

- React 19 and TypeScript
- Vite
- Three.js with React Three Fiber and Drei
- Rapier through React Three Rapier
- Zustand
- Vitest, ESLint, and Prettier

Exact dependency versions are recorded in `pnpm-lock.yaml`.

## Architecture

Source code is organized by responsibility under `src/`:

- `app/`: application composition and the top-level error boundary.
- `game/`: the Three.js canvas, lighting, physics world, and scene composition.
- `levels/`: level registry, room geometry, cycle durations, memory limits, and spawns.
- `player/`: first-person movement, the kinematic capsule, and physical resets.
- `input/`: keyboard, pointer lock, arrow-key look, and drag fallback.
- `puzzle/`: puzzle rules, Rapier sensors, the pressure plate, and the door.
- `echo/`: replay sampling, playback timing, and the Echo visual.
- `recording/`: immutable run capture and JSON export.
- `time-loop/`: fixed-step cycle timing and reset transitions.
- `state/`: low-frequency UI and session state.
- `ui/`: the HTML overlay, controls, and cycle status.
- `audio/`: original music and effects, event detection, and Web Audio playback.

Per-frame transforms stay in Three.js and Rapier instead of React state. Echoes
have no physical colliders; puzzle controllers query sampled replay positions.
Empty Room and Split Signal retain one recording; Convergence and Reversal retain the latest
two in FIFO order. Recordings keep the JSON v1 format and are sampled at 60 Hz.
Each Echo has independent animation and materials, driven by a shared playback clock.

The interface loads before the asynchronous 3D scene. Three.js and Rapier are
separate cacheable chunks. This reduces the code needed to display the interface;
the complete game still downloads both engines. `pnpm build:check` checks the
production import graph and JavaScript size budgets.
Audio starts only after **Enter / continue**. Run `python3 scripts/generate-audio.py`
to regenerate the original WAV assets; `pnpm build:check` also checks their
per-level download budget. Audio loading errors do not prevent gameplay.

## Validation

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
pnpm build
pnpm preview
```

## Blender assets

Editable sources, export scripts, runtime destinations, and asset contracts are
documented in [assets/blender/README.md](assets/blender/README.md). The Echo uses a
GLB model with a procedural fallback. Rooms, doors and pressure plates also load
Blender GLBs asynchronously and retain procedural visuals if loading or validation
fails. Collision geometry remains defined independently in the application.
