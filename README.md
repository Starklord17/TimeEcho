# Time Echo

Time Echo is a browser-based first-person temporal puzzle game. Every cycle records
the player's movement, then replays saved runs as Echoes that can activate room
sensors. The current build contains three connected puzzle levels and a
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

Per-frame transforms stay in Three.js and Rapier instead of React state. Echoes
have no physical colliders; puzzle controllers query sampled replay positions.
Empty Room and Split Signal retain one recording; Convergence retains the latest
two in FIFO order. Recordings keep the JSON v1 format and are sampled at 60 Hz.
Each Echo has independent animation and materials, driven by a shared playback clock.

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
GLB model with a procedural fallback. The door remains procedural until its final
Blender asset is created and enabled.
