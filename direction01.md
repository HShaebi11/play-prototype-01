⚡

**This is the engineering brief for the Play prototype — built with Cursor sub-agents.**

Goal: a working connection between two devices over WiFi, with a phone controlling visuals on a laptop canvas. No design yet. Just proof it works.



---

## Stack

- **Runtime:** Node.js 20.9+ (required by Next.js 16)
- **Framework:** Next.js 16 (App Router, React 19, Turbopack dev server)
- **Language:** TypeScript 5.x (strict mode)
- **Styling:** Tailwind CSS v4 (CSS-first config, no tailwind.config.js)
- **State:** Zustand (variable store, layer store, mappings — persisted where noted)
- **Connection:** PeerJS latest (WebRTC data channel — no custom server needed for prototype)
- **Visual engine:** Three.js + p5.js (layered, composited)
- **Package manager:** pnpm (faster installs)

**Next.js 16 note:** Request APIs (`cookies`, `headers`, `params`) are async and must be awaited in Server Components and Route Handlers. This prototype is mostly client-side (`"use client"`), so agents rarely need these — but do not copy Next 15 patterns that read them synchronously.

---

## How PeerJS works in Play

PeerJS uses WebRTC under the hood. For the prototype:

1. **Output** (laptop) opens the app → PeerJS generates a unique Peer ID → displays it as the room code
2. **Input** (phone) opens the app → types the Peer ID → PeerJS connects the two devices
3. Once connected, the Input sends real-time data messages to the Output via a PeerJS data channel
4. The Output canvas reads those messages and updates the visual

No custom server needed — PeerJS's public cloud handles the signaling. Both devices must be on the same WiFi network.

---

## Variable → Input mapping

Every variable in the store can be driven by **both** a phone input and a gamepad input simultaneously. The last writer wins — whichever device moved most recently sets the value.


| Variable ID | Label   | Default | Phone input       | Gamepad input                     | What it drives                                        |
| ----------- | ------- | ------- | ----------------- | --------------------------------- | ----------------------------------------------------- |
| `speed`     | Speed   | 0.3     | Dial id="speed"   | Right stick X (axis 2)            | Animation speed, noise increment, video playback rate |
| `size`      | Size    | 0.5     | Dial id="size"    | Right stick Y (axis 3)            | Object scale, font size, stroke weight                |
| `density`   | Density | 0.4     | Dial id="density" | Left trigger (axis 4 / button 6)  | Particle count, instance count, light intensity       |
| `hue`       | Hue     | 0.0     | XY pad — X axis   | Right trigger (axis 5 / button 7) | Colour hue rotation across all layers                 |
| `trail`     | Trail   | 0.2     | XY pad — Y axis   | Left bumper (button 4)            | Particle trail opacity, motion blur                   |
| `xy_x`      | XY — X  | 0.5     | XY pad — X axis   | Left stick X (axis 0)             | Object position X, camera X, XY cursor X              |
| `xy_y`      | XY — Y  | 0.5     | XY pad — Y axis   | Left stick Y (axis 1)             | Object position Y, camera Y, XY cursor Y              |


**Mode switching:**


| Mode                      | Phone input       | Gamepad input              |
| ------------------------- | ----------------- | -------------------------- |
| GEO (generative geometry) | Mode pill: GEO    | Button 0 (A / Cross)       |
| AUDIO (audio-reactive)    | Mode pill: AUDIO  | Button 1 (B / Circle)      |
| COLOUR (colour fields)    | Mode pill: COLOUR | Button 2 (X / Square)      |
| — (toggle panel)          | Keyboard: X       | Button 9 (Start / Options) |


**How values flow into the variable store:**

- Phone dials → PeerJS message `{ type: "dial", id, value }` → `mappings.getTarget(...)` → `variables.set(targetId, value, "phone")`
- Phone XY → PeerJS message `{ type: "xy", x, y }` → mappings resolve X/Y targets (defaults: `hue`, `trail`) → `variables.set(..., "phone")`
- Phone mode → PeerJS message `{ type: "mode", value }` → handled separately (not a variable)
- Gamepad axes → `useGamepad` polling loop → `mappings.getTarget(...)` → `variables.set(targetId, normalised, "gamepad")`
- Gamepad buttons → `useGamepad` rising-edge detection → mode switch or panel toggle
- All canvas layers read from `variables.get(id)` — they don’t care about the source

**Mappings are fully customisable** in the INPUTS tab of the control panel. The table above shows the defaults. The user can remap any dial, XY axis, or gamepad axis to any variable ID at runtime. Mappings live in `src/lib/mappings.ts` (Zustand store, persisted to localStorage).

---

## Message protocol

All messages from Input → Output follow this shape:

```tsx
type PlayMessage =
  | { type: "dial"; id: string; value: number }       // 0.0 – 1.0
  | { type: "slider"; id: string; value: number }     // 0.0 – 1.0
  | { type: "xy"; x: number; y: number }              // 0.0 – 1.0 each
  | { type: "mode"; value: "geo" | "audio" | "colour" }

```

The Output listens for these and maps them to canvas properties.

---

## Route structure

```
/              → redirect to /output or show choice
/output        → the canvas (open on laptop)
/input         → the controller (open on phone)

```

---

## Code standards

Every sub-agent must follow these rules. They apply to every file, every function.

- **One responsibility per file.** A component does one thing. A hook does one thing.
- **Name things clearly.** `useVariableStore` not `useStore`. `ThreeLayer` not `Layer3D`.
- **Comment the why, not the what.** Don't write `// set value`. Write `// clamp to 0-1 so downstream bindings never receive NaN`.
- **No magic numbers.** Extract constants: `const MAX_ROTATION_SPEED = 0.05` not `0.05` inline.
- **Types everywhere.** No `any`. No implicit `any`. Every function has typed parameters and a return type.
- **Small functions.** If a function is longer than 40 lines, split it.
- **Consistent file structure inside each file:**
  1. Imports
  2. Types / constants
  3. Helper functions
  4. Main export (component or hook)
- **No dead code.** Don't leave commented-out code or unused imports.
- **Readable over clever.** A junior dev and an AI agent should both understand it on first read.

---

## File structure

```jsx
src/
  app/
    page.tsx                    → Home: links to /input and /output
    output/
      page.tsx                  → Output surface (canvas + panel)
    input/
      page.tsx                  → Input surface (controller)
  components/
    canvas/
      CanvasRenderer.tsx        → Stacks all layers in z-order
      ThreeLayer.tsx            → Single Three.js layer
      P5Layer.tsx               → Single p5.js layer
      MediaLayer.tsx            → Single image or video layer
    input/
      Dial.tsx                  → Single rotary dial with circular gesture
      XYPad.tsx                 → XY touch pad
      ModeSwitcher.tsx          → Three-pill mode selector
      ConnectionScreen.tsx      → PLAY wordmark + room code entry
      ControllerSurface.tsx     → Assembles Dial, XYPad, ModeSwitcher
    output/
      LoadingScreen.tsx         → PLAY wordmark + dot animation
      WaitingScreen.tsx         → Room code display
    panel/
      ControlPanel.tsx          → Floating panel shell + tab bar
      LayersTab.tsx             → Layer stack manager UI
      VariablesTab.tsx          → Variable table + formula bar
      LayerRow.tsx              → Single draggable layer row
      LayerConfig/
        ThreeLayerConfig.tsx    → Object + light config for a Three.js layer
        P5LayerConfig.tsx       → Sketch + bindings config for a p5 layer
        MediaLayerConfig.tsx    → File upload + bindings config for a media layer
      InputsTab.tsx             → Customisable input→variable mapping UI (third panel tab)
  hooks/
    usePeer.ts                  → PeerJS connection (host or join)
    useGamepad.ts               → Gamepad API polling loop → writes to variable store
    useAnimationFrame.ts        → requestAnimationFrame loop hook
    useVariableStore.ts         → Re-export + typed selector for variable store
    useLayerStore.ts            → Re-export + typed selector for layer store
  lib/
    variables.ts                → Zustand variable store + VariableStore type
    layers.ts                   → Zustand layer store + all layer types
    types.ts                    → PlayMessage + all shared types
    expressions.ts              → Safe expression parser (no eval)
    mappings.ts                 → Zustand store for input→variable mappings (persisted)
    constants.ts                → All magic numbers + gamepad axis/button index mapping
  styles/
    globals.css                 → Tailwind v4 entry point

```

Rules:

- Never import across feature boundaries without going through `lib/`. Components import from `lib/`, not from other components' internal files.
- `hooks/` contains only React hooks. Pure logic lives in `lib/`.
- Each component file exports exactly one thing.

---

## Sub-agent tasks

Run these as separate Cursor sub-agent prompts, in order. Each one is self-contained.

**Order: UI first — get everything visible and interactive in the browser before wiring up the connection layer.**

---

### Sub-agent 1 — Project setup

```jsx
// WHO YOU ARE
// You are the foundation engineer for Play — a creative instrument platform
// that connects devices over WiFi and drives a layered visual canvas.
// Your only job is to scaffold the project correctly so every agent after
// you has a clean, consistent base to build on. Nothing more.
//
// WHAT YOU HAVE
// A blank machine with Node.js and pnpm installed. Nothing else.
//
// YOUR JOB
// Scaffold the project, install all dependencies, create the three routes,
// and verify it runs. Leave all pages empty — do not add any UI.
//
// CODE STANDARDS
// Follow the file structure in this brief exactly.
// Every file: imports → types/constants → helpers → main export.
// No magic numbers. No any types. No dead code.
// ─────────────────────────────────────────────

Scaffold a new project using the latest Next.js (v16) with the following command:
  pnpm create next-app@latest play --typescript --tailwind --app --turbopack --src-dir --import-alias "@/*"

This gives us:
- Next.js 16 + React 19
- Node.js 20.9+ (verify with node -v before scaffolding)
- TypeScript 5 strict mode
- Tailwind CSS v4 (CSS-first, no tailwind.config.js)
- Turbopack for fast local dev
- pnpm as package manager

Then install:
  pnpm add peerjs three @react-three/fiber @react-three/drei p5 zustand
  pnpm add -D @types/three @types/p5

Note: PeerJS ships its own TypeScript types — do not install @types/peerjs.

Create the following routes:
- /output — empty page, black background, full viewport
- /input — empty page, black background, full viewport
- / — simple page with two links: "Open Output" and "Open Input"

All pages: full-viewport height, near-black (#0a0a0a) background, white monospace text.
Use Tailwind utility classes throughout. No other UI yet.

```

---

### Sub-agent 2 — Output surface UI (no connection yet)

```jsx
// WHO YOU ARE
// You are the Output surface engineer for Play.
// The Output surface is what runs on the laptop — the visual canvas the
// audience sees. You are building its three screens: Loading, Waiting,
// and Active. No networking. No connection logic. Pure UI and animation.
//
// WHAT YOU HAVE
// Sub-agent 1 has scaffolded the project. You have:
//   src/app/output/page.tsx  (empty)
//   All dependencies installed (three, p5, peerjs, etc.)
//
// YOUR JOB
// Build LoadingScreen.tsx, WaitingScreen.tsx, and a placeholder canvas
// component. Wire them together in output/page.tsx with a local state
// switch. Add temporary dev buttons to switch between screens — clearly
// marked TODO: remove before production.
//
// FILES YOU WILL CREATE
//   src/components/output/LoadingScreen.tsx
//   src/components/output/WaitingScreen.tsx
//   src/app/output/page.tsx  (updated)
//
// CODE STANDARDS
// Follow the file structure in this brief exactly.
// Every file: imports → types/constants → helpers → main export.
// No magic numbers. No any types. No dead code.
// ─────────────────────────────────────────────

Build the static /output page. No PeerJS or connection logic yet.

It should show three screens controlled by a local state variable (for testing, add
temporary buttons to switch between them — remove these once connection is wired up):

Screen A — Loading:
- Near-black (#0a0a0a) full-viewport background
- The text "PLAY" centred, large (clamp(48px, 8vw, 96px)), monospace, white, letter-spacing: 0.3em
- Below it: a row of 5 dots (8px diameter circles, white at 30% opacity)
- Animate the dots: each dot pulses to full white opacity in sequence (staggered 200ms delay each), repeating
- Transition to Screen B using a CSS clip-path mask animation:
  circle(0% at 50% 50%) → circle(150% at 50% 50%), duration 600ms, ease-in-out

Screen B — Waiting:
- Near-black background
- A placeholder room code (e.g. "A3F7") centred, large monospace
- One line below: "Open Play on your device" in small monospace, white at 50% opacity
- Nothing else

Screen C — Active (canvas):
- Full-viewport HTML Canvas element, near-black background
- Runs a generative particle animation:
  - 200 particles, each with position, velocity, and size
  - Particles move slowly, wrap around edges
  - Default: small, white, slow
- Exposes a temporary ref-based API for controlling params from outside (replaced by
  the Zustand variable store in Sub-agent 4/5):
  setParam("speed", 0–1), setParam("size", 0–1), setParam("density", 0–1),
  setParam("hue", 0–1), setParam("trail", 0–1)
- Canvas resizes with window
- Use requestAnimationFrame for the render loop

```

---

### Sub-agent 3 — Input surface UI (no connection yet)

```jsx
// WHO YOU ARE
// You are the Input surface engineer for Play.
// The Input surface is the controller — what runs on the phone.
// You are building the physical interface: dials with circular drag gestures,
// an XY pad, and a mode switcher. This is the instrument the performer holds.
//
// WHAT YOU HAVE
// Sub-agents 1 and 2 are complete. You have:
//   src/app/input/page.tsx  (empty)
//   src/components/output/ (LoadingScreen, WaitingScreen already built)
//
// YOUR JOB
// Build ConnectionScreen, Dial, XYPad, ModeSwitcher, and ControllerSurface.
// Wire them in input/page.tsx. All interaction callbacks are stubbed to
// console.log — no real data sent yet. Add a temporary "Skip to controller"
// dev link, clearly marked TODO: remove before production.
//
// FILES YOU WILL CREATE
//   src/components/input/ConnectionScreen.tsx
//   src/components/input/Dial.tsx
//   src/components/input/XYPad.tsx
//   src/components/input/ModeSwitcher.tsx
//   src/components/input/ControllerSurface.tsx
//   src/app/input/page.tsx  (updated)
//
// CODE STANDARDS
// Follow the file structure in this brief exactly.
// Every file: imports → types/constants → helpers → main export.
// No magic numbers. No any types. No dead code.
// Circular dial gesture must use Math.atan2 — no shortcuts.
// ─────────────────────────────────────────────

Build the static /input page. No PeerJS or connection logic yet.

Use a local state variable to toggle between the connection screen and the controller
(add a temporary "Skip to controller" link for testing — remove once connection is wired).

Screen A — Connection screen:
- "PLAY" wordmark centred, large monospace, white, letter-spacing: 0.3em
- A text input below (monospace, near-black bg, white border at 20% opacity, rounded none)
- The word JOIN below that in monospace, white, no button shape, cursor: pointer
- Tapping JOIN transitions to the controller screen

Screen B — Controller surface:

1. Three dials in a row, centred horizontally, 48px from top:
   Each dial (80px diameter):
   - SVG circle with a line from centre to edge as the indicator, amber (#f59e0b)
   - Below: label in tiny monospace + current value (0.00) side by side
   - Circular drag gesture: user grabs the knob and drags in a circular arc
     - Track pointer angle relative to dial centre using Math.atan2
     - Clockwise = increase, counter-clockwise = decrease
     - Clamp value to 0–1, indicator line rotates from -135° (min) to +135° (max)
     - Use pointermove on the document (not the dial) so fast gestures don't lose the handle
   - Dial IDs: "speed", "size", "density"
   - On change: fire an onDialChange(id, value) callback (stubbed for now — just console.log)

2. XY pad below the dials:
   - Square, full width minus 32px each side
   - Near-black bg, 1px border white at 10% opacity
   - Amber dot (12px) follows touch/pointer position
   - Axis labels bottom-left: "x: xy_x  y: xy_y" in tiny monospace
   - On move: fire onXYChange(x, y) (0–1 each, stubbed — console.log)

3. Mode switcher at the bottom:
   Three pill buttons in a row: GEO / AUDIO / COLOUR
   - Inactive: transparent bg, white 1px border, white monospace text
   - Active: amber (#f59e0b) bg, dark (#0a0a0a) text
   - border-radius: 9999px, padding: 8px 20px
   - On tap: fire onModeChange(mode) (stubbed — console.log)

All styling: near-black bg, white monospace text, amber accent.
No real data sent anywhere yet — all callbacks just log to console.

```

---

### Sub-agent 4 — Gamepad API

```jsx
// WHO YOU ARE
// You are the hardware input engineer for Play.
// Your job is to make any connected gamepad or controller drive the
// canvas directly from the laptop — no phone, no PeerJS needed.
// The Gamepad API runs a polling loop on the /output page and writes
// values straight into the Zustand variable store.
// Both phone (PeerJS) and gamepad can be active at the same time.
//
// WHAT YOU HAVE
// Sub-agents 1-3 are complete. You have:
//   src/lib/variables.ts does NOT exist yet — you will create it.
//   src/app/output/page.tsx  (Output UI built, no variable store yet)
//
// YOUR JOB
// 1. Create src/lib/variables.ts (the Zustand variable store)
// 2. Create src/hooks/useGamepad.ts (the polling loop)
// 3. Mount useGamepad in output/page.tsx so a connected controller
//    immediately drives the canvas variables
//
// FILES YOU WILL CREATE
//   src/lib/variables.ts
//   src/lib/constants.ts  (gamepad mapping constants)
//   src/hooks/useGamepad.ts
//   src/app/output/page.tsx  (updated to mount useGamepad)
//
// CODE STANDARDS
// Follow the file structure in this brief exactly.
// Every file: imports → types/constants → helpers → main export.
// No magic numbers — all axis/button indices live in constants.ts.
// No any types. No dead code.
// Comment every mapping decision (why axis 0 = speed, etc.)
// ─────────────────────────────────────────────

## VARIABLE STORE (create this first)

Create src/lib/variables.ts:

  import { create } from "zustand"

  // A variable is a named, normalised (0-1) value.
  // All input sources (phone dials, gamepad axes, XY pad) write here.
  // All canvas layers read from here.
  export type Variable = {
    id: string
    value: number   // always 0.0-1.0
    label: string
    source: "phone" | "gamepad" | "internal"  // last writer
  }

  export type VariableStore = {
    variables: Record<string, Variable>
    set: (id: string, value: number, source: Variable["source"]) => void
    get: (id: string) => number
    getAll: () => Variable[]
    initialise: (defaults: Array<Omit<Variable, "source">>) => void
  }

  // Initialise with these defaults on first load:
  //   speed: 0.3, size: 0.5, density: 0.4, hue: 0.0, trail: 0.2
  //   xy_x: 0.5, xy_y: 0.5

---
## GAMEPAD HOOK

Create src/hooks/useGamepad.ts:

The Gamepad API does not fire events — it must be polled each animation frame.
This hook runs a requestAnimationFrame loop that reads all connected gamepads
and writes their axes and buttons to the variable store.

  export type GamepadStatus = {
    connected: boolean
    gamepadId: string | null  // e.g. "Xbox 360 Controller (XInput)"
    activeAxes: number        // how many axes are being used
  }

  // useGamepad returns GamepadStatus.
  // Side effect: writes to the variable store on every frame.

Gamepad axis → variable mapping (defined in src/lib/constants.ts):

  Left stick X  (axis 0) → "xy_x"      // XY pad X
  Left stick Y  (axis 1) → "xy_y"      // XY pad Y
  Right stick X (axis 2) → "speed"     // particle/animation speed
  Right stick Y (axis 3) → "size"      // object scale
  Left trigger  (axis 4 or button 6) → "density"   // density
  Right trigger (axis 5 or button 7) → "hue"       // colour hue
  Left bumper   (button 4) → "trail"   // trail length

Normalisation rules:
  Axes return -1.0 to 1.0. Map to 0.0-1.0: (axisValue + 1) / 2
  Triggers return 0.0 to 1.0 on most browsers — use directly.
  Buttons have .value (0-1) and .pressed (boolean) — use .value.
  Deadzone: if abs(axisValue) < 0.08, treat as 0 (centre) to avoid drift.

Button → action mapping:
  Button 0 (A / Cross)  → set mode to "geo"
  Button 1 (B / Circle) → set mode to "audio"
  Button 2 (X / Square) → set mode to "colour"
  Button 9 (Start / Options) → toggle the control panel open/closed

  Button presses fire once on press (not held).
  Track previous button state to detect rising edge (was false, now true).

Gamepad connect/disconnect:
  Listen for "gamepadconnected" and "gamepaddisconnected" window events.
  Log the gamepad id to console on connect: "Gamepad connected: {id}"
  Set connected: false and stop writing to the store on disconnect.

Multiple gamepads:
  Use navigator.getGamepads()[0] only (first connected gamepad).
  If 0 is disconnected, fall through to the next available index.

---
## MAPPING STORE (create alongside the variable store)

Create src/lib/mappings.ts:

  // InputSource identifies a single physical input.
  // Gamepad axes and buttons, phone dials, phone XY axes.
  export type InputSource =
    | { device: "gamepad"; type: "axis";   index: number }  // axis 0-5
    | { device: "gamepad"; type: "button"; index: number }  // button 0-16
    | { device: "phone";   type: "dial";   id: string }     // e.g. "speed"
    | { device: "phone";   type: "xy";     axis: "x" | "y" }

  export type InputMapping = {
    source: InputSource
    targetVariableId: string   // which variable this input writes to
    label: string              // human-readable name shown in INPUTS tab
  }

  export type MappingStore = {
    mappings: InputMapping[]
    setMapping: (source: InputSource, targetVariableId: string) => void
    removeMapping: (source: InputSource) => void
    getTarget: (source: InputSource) => string | null
    reset: () => void  // restore defaults
  }

  // Default mappings (match the Variable mapping table in this brief):
  //   gamepad axis 2  -> "speed"
  //   gamepad axis 3  -> "size"
  //   gamepad axis 4  -> "density"
  //   gamepad axis 5  -> "hue"
  //   gamepad button 4 -> "trail"
  //   gamepad axis 0  -> "xy_x"
  //   gamepad axis 1  -> "xy_y"
  //   phone dial "speed"    -> "speed"
  //   phone dial "size"     -> "size"
  //   phone dial "density"  -> "density"
  //   phone xy x -> "hue"
  //   phone xy y -> "trail"

  Persist to localStorage via Zustand persist middleware.
  The useGamepad hook and the PeerJS message handler both call
  mappings.getTarget(source) before writing to variables.
  If getTarget returns null, the input is unmapped and ignored.

---
## GAMEPAD STATUS INDICATOR

Add a small gamepad status indicator to the Output overlay (top bar).
This is shown alongside the green connection dot when a gamepad is connected.

- A small gamepad icon (use an SVG or the 🎮 emoji) next to the green dot
- White at 30% opacity when no gamepad connected
- Full white (100%) when a gamepad is connected
- On hover: show a tooltip with gamepad.id (the full controller name string)

```

---

### Sub-agent 5 — Canvas Engine (Three.js + p5.js + Layer System)

```jsx
Build the full canvas engine for /output. This replaces the simple particle canvas
from Sub-agent 2. It is the most complex sub-agent — read all of it before starting.

---
INSTALL (already done in sub-agent 1):
  three, @react-three/fiber, @react-three/drei, p5, @types/three, @types/p5

---
## UNIFIED VARIABLE SYSTEM

Use the existing src/lib/variables.ts from Sub-agent 4 — do not redefine the API.
The canonical store (already created) is:

  export type Variable = {
    id: string
    value: number   // always 0.0–1.0 (normalised)
    label: string
    source: "phone" | "gamepad" | "internal"  // last writer
  }

  export type VariableStore = {
    variables: Record<string, Variable>
    set: (id: string, value: number, source: Variable["source"]) => void
    get: (id: string) => number
    getAll: () => Variable[]
    initialise: (defaults: Array<Omit<Variable, "source">>) => void
  }

Layers subscribe via useVariableStore (Zustand) or read values inside animation loops.
Expression evaluation (Sub-agent 6) writes with source: "internal".
PeerJS and gamepad handlers write with source: "phone" or "gamepad".
This is the single source of truth for all variable values.

---
## LAYER SYSTEM

Create src/lib/layers.ts — a layer stack manager.

  type LayerType = "threejs" | "p5" | "media"

  type Layer = {
    id: string
    type: LayerType
    name: string
    visible: boolean
    opacity: number         // 0–1
    zIndex: number          // render order
    config: ThreeJSLayerConfig | P5LayerConfig | MediaLayerConfig
  }

  type ThreeJSLayerConfig = {
    objects: ThreeObject[]
    lights: ThreeLight[]
    cameraBindings: {
      posX?: string   // variable id
      posY?: string
      posZ?: string
    }
  }

  type ThreeObject = {
    id: string
    geometry: "sphere" | "box" | "icosahedron" | "torus" | "blob" | "points"
    count: number           // 1 for single object, >1 for scattered instances
    bindings: {
      posX?: string         // variable id → X position
      posY?: string
      posZ?: string
      scale?: string        // variable id → uniform scale
      rotationSpeed?: string // variable id → rotation speed
    }
    material: "standard" | "wireframe" | "points"
    colour: string          // hex
  }

  type ThreeLight = {
    id: string
    type: "ambient" | "point" | "directional" | "spot"
    bindings: {
      intensity?: string    // variable id
      colourHue?: string    // variable id → hue rotation
      posX?: string
      posY?: string
      posZ?: string
    }
    defaultIntensity: number
    defaultColour: string
  }

  type P5LayerConfig = {
    sketch: P5SketchType
    bindings: Record<string, string>  // sketchParam → variable id
  }

  type MediaLayerConfig = {
    mediaType: "image" | "video"
    src: string | null        // object URL from file upload
    fit: "cover" | "contain" | "fill" | "tile"
    bindings: {
      opacity?: string        // variable id -> layer opacity
      scaleX?: string         // variable id -> horizontal scale
      scaleY?: string         // variable id -> vertical scale
      posX?: string           // variable id -> X offset (0-1 = left-right)
      posY?: string           // variable id -> Y offset (0-1 = top-bottom)
      hue?: string            // variable id -> CSS hue-rotate (0-1 = 0-360deg)
      brightness?: string     // variable id -> CSS brightness (0-1 = 0-200%)
      blur?: string           // variable id -> CSS blur (0-1 = 0-20px)
      speed?: string          // video only: variable id -> playback rate (0-1 = 0-3x)
      scrub?: string          // video only: variable id -> seek position (0-1 = start-end)
    }
  }

  type P5SketchType =
    | "noise_field"     // Perlin noise particle flow
    | "image_displace"  // uploaded image distorted by variables
    | "typography"      // big text that warps with variables
    | "draw"            // free mouse drawing
    | "shader"          // GLSL shader via p5.js

Store layer stack in Zustand. Persist to localStorage.

Note: media src (object URLs) are NOT persisted to localStorage (they are
temporary browser URLs). On reload, media layers show an upload prompt again.

---
## LAYER PANEL (Photoshop-style)

Layer UI lives in LayersTab (Sub-agent 6), inside ControlPanel with tabs:
LAYERS | VARIABLES | INPUTS.

The LAYERS tab:
- Lists all layers in stack order (top = rendered last = visually on top)
- Each row:
  - Drag handle (left) — drag to reorder
  - Layer type badge: THREE, P5, or MEDIA in a tiny pill
  - Layer name (editable on double-click)
  - Visibility toggle (eye icon)
  - Opacity slider (0–1)
  - Delete button (×)
- "+ Add Layer" button at the bottom:
  - Opens a small picker: Three.js Layer | p5.js Layer | Media Layer
  - Selecting one adds a new layer with default config
- Clicking a layer row expands its config inline:
  - For Three.js: shows object list + light list + Add Object / Add Light buttons
  - For p5.js: shows sketch type picker + binding map + image upload (if image_displace)
  - For media: shows file upload + fit mode + binding map (Sub-agent 6 MediaLayerConfig)

Drag-to-reorder updates zIndex in the store. Canvas re-renders in the new order.

---
## CANVAS RENDERER

Create src/components/canvas/CanvasRenderer.tsx

This component renders all layers in zIndex order as overlapping full-viewport
canvases, absolutely positioned, stacked via CSS z-index.

For each layer:
- If type === "threejs": render a <ThreeLayer> component
- If type === "p5": render a <P5Layer> component
- Apply layer opacity via CSS
- Skip rendering if visible === false

---
## THREE.JS LAYER COMPONENT

Create src/components/canvas/ThreeLayer.tsx

Uses @react-three/fiber <Canvas> with:
- alpha: true (transparent background so layers beneath show through)
- camera: position [0, 0, 8], fixed by default
- No orbit controls unless cameraBindings are set

For each ThreeObject in config.objects:
- geometry:
  - "sphere" → <sphereGeometry args={[1, 32, 32]}/>
  - "box" → <boxGeometry args={[1, 1, 1]}/>
  - "icosahedron" → <icosahedronGeometry args={[1, 0]}/>
  - "torus" → <torusGeometry args={[1, 0.4, 16, 100]}/>
  - "blob" → <sphereGeometry> with vertex displacement via a noise shader
    (use a custom ShaderMaterial — displace vertices using simplex noise)
  - "points" → <pointsGeometry> — 3D particle point cloud
- If count > 1: render that many instances scattered randomly in a volume
  (use <instancedMesh> for performance)
- Read variable values from the Zustand store each frame via useFrame:
  - bindings.posX/Y/Z → position
  - bindings.scale → uniform scale multiplier (0–1 maps to 0.1–3.0)
  - bindings.rotationSpeed → rotation increment per frame (0–1 maps to 0–0.05 rad)
- Material:
  - "standard" → <meshStandardMaterial>
  - "wireframe" → <meshStandardMaterial wireframe/>
  - "points" → <pointsMaterial size={0.05}/>

For each ThreeLight in config.lights:
- Render the appropriate Three.js light component
- Read variable values from store each frame:
  - bindings.intensity → light intensity (0–1 maps to 0–10)
  - bindings.colourHue → rotate the light colour hue
  - bindings.posX/Y/Z → light position (for point/spot/directional)

Camera bindings (from cameraBindings):
- posX/Y/Z variables move the camera position smoothly (lerp at 0.05)

---
## MEDIA LAYER COMPONENT

Create src/components/canvas/MediaLayer.tsx

Renders an image or video as a full-viewport layer behind or between other layers.
Uses an <img> or <video> element (not canvas) for maximum performance.
Position: absolute, full viewport, pointer-events: none.

Image layer:
- Render an <img> element sized and positioned per the fit setting
- Apply CSS transform for scaleX, scaleY, posX, posY bindings
- Apply CSS filter for hue, brightness, blur bindings
- All transforms driven by variables from the Zustand store (read in a
  useAnimationFrame loop, updating inline styles at 60fps)

Video layer:
- Render a <video> element (autoplay, muted, loop by default)
- Same CSS transform and filter bindings as image
- speed binding: set video.playbackRate = lerp(0, 3, value)
- scrub binding: if scrub variable changes, set video.currentTime =
  value * video.duration (allows using a dial to scrub through a video)
- When scrub is bound: pause the video and let the dial control position
- When scrub is not bound: play normally at speed binding rate

File upload:
- If src is null: show a centred upload prompt in the layer
  (a dashed rounded rectangle with the text "Drop a file or click to upload")
- Accept: image/* and video/*
- On file select: create an object URL and store it in the layer config

---
## p5.js LAYER COMPONENT

Create src/components/canvas/P5Layer.tsx

Uses the p5 constructor (not the React library — imperative setup in useEffect).
Runs the p5 sketch in WEBGL mode if sketch type is "shader", otherwise P2D.
The canvas is positioned full-viewport, transparent background.

Implement each sketch type:

"noise_field":
- Flowing particles driven by Perlin noise (p5.noise)
- Bindings: density → particle count (50–500), speed → noise increment,
  hue → colour offset, trail → trail opacity (0.1–1.0)

"image_displace":
- Accept an uploaded image file (stored in layer config)
- Draw the image across the canvas
- Per-pixel displacement driven by Perlin noise * displace variable (0–1)
- Bindings: displace → displacement amount, speed → noise time increment,
  hue → colour tint overlay opacity
- Show a file upload prompt in the Layer Panel when no image is set

"typography":
- Display a configurable text string (editable in layer config)
- Text fills most of the canvas width
- Bindings: warp → vertex displacement of text outlines (use p5.font + custom rendering),
  size → font size multiplier, hue → fill colour hue

"draw":
- p5 mousePressed / mouseDragged → draw strokes on the canvas
- Bindings: size → stroke weight, hue → stroke hue, speed → stroke opacity
- Add a clear button in the layer panel

"shader":
- Run a GLSL fragment shader via p5.js in WEBGL mode
- Default shader: a colour field with time-based hue cycling
- Expose uTime, uSpeed, uHue, uScale as uniforms
- Bindings: map variable ids to those uniforms
- Allow custom GLSL input in the layer panel (a textarea)

All sketches: clean up p5 instance on React unmount.
All sketches: read variable values from the Zustand store inside the p5 draw loop.

---
## DEFAULT STATE (what loads on first open)

  Layer 1 (bottom) — p5.js, sketch: "noise_field"
    bindings: { density: "density", speed: "speed", hue: "hue", trail: "trail" }

  Layer 2 (top) — Three.js
    objects: [
      { geometry: "icosahedron", count: 1, material: "wireframe", colour: "#f59e0b",
        bindings: { scale: "size", rotationSpeed: "speed", posX: "xy_x", posY: "xy_y" } }
    ]
    lights: [
      { type: "ambient", defaultIntensity: 0.4, defaultColour: "#ffffff" },
      { type: "point", defaultIntensity: 2, defaultColour: "#f59e0b",
        bindings: { intensity: "density", colourHue: "hue" } }
    ]

Default variables in the store:
  speed: 0.3, size: 0.5, density: 0.4, hue: 0.0, trail: 0.2
  xy_x: 0.5, xy_y: 0.5

```

---

### Sub-agent 6 — Variable Editor + Layer Panel

```jsx
// WHO YOU ARE
// You are the control panel engineer for Play.
// You are building the floating panel that lets the user manage layers
// and edit variable expressions in real-time while the canvas runs.
// This is Play’s programmer surface — the interface between the variable
// system and the visual engine.
//
// WHAT YOU HAVE
// Sub-agents 1-5 are complete. You have:
//   src/lib/variables.ts  (Zustand variable store)
//   src/lib/layers.ts     (Zustand layer store)
//   src/components/canvas/  (all canvas components)
//   Canvas is live and responding to variables.
//
// YOUR JOB
// Build ControlPanel, LayersTab, VariablesTab, InputsTab, LayerRow, and all
// LayerConfig sub-components. Mount the panel in output/page.tsx.
//
// FILES YOU WILL CREATE
//   src/components/panel/ControlPanel.tsx
//   src/components/panel/LayersTab.tsx
//   src/components/panel/VariablesTab.tsx
//   src/components/panel/InputsTab.tsx
//   src/components/panel/LayerRow.tsx
//   src/components/panel/LayerConfig/ThreeLayerConfig.tsx
//   src/components/panel/LayerConfig/P5LayerConfig.tsx
//   src/components/panel/LayerConfig/MediaLayerConfig.tsx
//   src/lib/expressions.ts
//
// CODE STANDARDS
// Follow the file structure in this brief exactly.
// Every file: imports → types/constants → helpers → main export.
// No magic numbers. No any types. No dead code.
// Expression parser must never use eval() — safety is non-negotiable.
// ─────────────────────────────────────────────

Build the combined control panel for /output.
This panel has three tabs at the top: LAYERS, VARIABLES, and INPUTS.
It sits as a floating draggable panel anchored to the bottom edge of the canvas.

---
PANEL SHELL:
- Always-visible amber handle/pill at the bottom edge of the canvas
  with a drag-up chevron icon
- Clicking the handle lifts the panel up from the bottom edge
- Panel is draggable — user can reposition anywhere on screen
- Canvas remains fully visible behind it
- Three tabs at the top of the panel: LAYERS | VARIABLES | INPUTS
  - Active tab: amber text, bottom border amber 2px
  - Inactive: white at 40% opacity

---
LAYERS TAB (reads/writes from the layers Zustand store built in Sub-agent 5):

Shows the full layer stack, top = visually on top.
Each row:
  - Drag handle (☰) on the left — drag to reorder (updates zIndex in store)
  - Type badge: THREE, P5, or MEDIA in a tiny rounded pill (amber for THREE, white for P5/MEDIA)
  - Layer name — editable on double-click
  - Eye icon to toggle visibility
  - Opacity: a small horizontal scrub input (0–1, shows as percentage)
  - × to delete the layer

Expanding a layer row (click to expand):
  For a Three.js layer:
    - List of objects in that layer. Each object shows:
      - Geometry type badge + count
      - Binding map: posX/posY/posZ/scale/rotationSpeed — each a small
        text input showing the bound variable id (editable, writes to store)
    - “+ Add Object” opens a small picker:
      sphere / box / icosahedron / torus / blob / points → count input → Add
    - List of lights in that layer. Each light shows:
      - Type badge + binding inputs for intensity / colourHue / posX/Y/Z
    - “+ Add Light” opens picker: ambient / point / directional / spot

  For a p5.js layer:
    - Sketch type selector (dropdown): noise_field / image_displace /
      typography / draw / shader
    - Binding map: each sketch param → variable id text input
    - If sketch = "image_displace": file upload button for the source image
    - If sketch = "typography": text string input
    - If sketch = "shader": GLSL textarea (monospace, expandable)

  For a media layer:
    - File upload, fit mode (cover / contain / fill / tile)
    - Binding map: opacity, scale, position, hue, brightness, blur, speed, scrub

"+ Add Layer" button at the bottom of the list:
  Picker: Three.js Layer | p5.js Layer | Media Layer → adds with defaults

---
VARIABLES TAB (reads/writes from the variables Zustand store):

1. A two-column table with header row:
   | Variable      | Expression |
   - Each row: one variable from the store
   - Variable column: the variable id (read-only, monospace)
   - Expression column: editable monospace text input
     Examples: "speed", "size * 2", "1 - density", "xy_x + 0.1"

2. Formula bar below the table:
   - Full panel width, monospace input
   - Greyed out with placeholder “Select a variable to edit” when nothing selected
   - Clicking a row populates the formula bar with that row's expression
   - Editing the formula bar updates the row expression live
   - Expressions are evaluated and the result written back to the store

Expression evaluation (safe parser — no eval()):
   - Bare name: "speed" → raw value
   - Multiply: "speed * 2" → clamp(value * 2, 0, 1)
   - Invert: "1 - speed" → clamp(1 - value, 0, 1)
   - Add: "speed + 0.2" → clamp(value + 0.2, 0, 1)
   - Invalid: fall back to raw value, show row in red

---
INPUTS TAB (reads/writes from the mappings Zustand store built in Sub-agent 4):

This tab lets the user remap any physical input to any variable, live.

Layout: two sections side by side

Left section header: GAMEPAD
  Shows every mappable gamepad input as a row:
  - Left stick X / Left stick Y
  - Right stick X / Right stick Y
  - Left trigger / Right trigger
  - Left bumper / Right bumper
  Each row:
    - Input label (e.g. "Right stick X")
    - A small animated bar showing the live value of that axis (read from navigator.getGamepads() directly, so the bar moves even when unmapped)
    - An arrow icon
    - A variable selector dropdown: shows all variable IDs from the variable store
    - If unmapped: dropdown shows "-- none --"
    - Selecting a variable ID saves the mapping to the store
  At the top: a small "Reset to defaults" link (amber, tiny monospace)

Right section header: PHONE
  Shows every mappable phone input as a row:
  - Dial: speed (id shown, editable)
  - Dial: size
  - Dial: density
  - XY pad X axis
  - XY pad Y axis
  Each row:
    - Input label
    - An arrow icon
    - Variable selector dropdown (same as gamepad rows)
  Note: to remap a phone dial to a different variable, the user changes the mapping here.
  The dial still sends its original id in the PeerJS message, but the mapping store
  translates it to the selected target variable before writing to the variable store.

Below both sections: a note in tiny monospace, white at 30% opacity:
  "Mappings are saved automatically and persist between sessions."

---
STYLING (all tabs):
   - Panel background: #111111
   - Top rounded corners only, no border on bottom
   - 1px border white at 10% opacity on sides and top
   - Header/tab row: white monospace at 50% opacity, small
   - Selected row: subtle amber (#f59e0b at 15%) background tint
   - Formula bar: #0a0a0a bg, amber caret, white monospace text
   - Binding tag: small pill, 1px amber border, monospace text, × in white
   - Drag handle row: white at 20% on hover, cursor grab

```

---

### Sub-agent 7 — PeerJS message protocol + types

```jsx
// WHO YOU ARE
// You are the networking engineer for Play.
// You are defining the contract between the phone (Input) and the canvas
// (Output). Once your work is done, Sub-agents 8 and 9 can wire up both
// surfaces. Your code is the bridge between them.
//
// WHAT YOU HAVE
// Sub-agents 1-6 are complete. You have:
//   src/lib/variables.ts  (variable store exists and is used by the canvas)
//   The canvas is running and responding to variables.
//   No PeerJS code exists yet.
//
// YOUR JOB
// Define PlayMessage types and build the usePeer hook.
// Do not touch any page files — just create the shared types and hook.
//
// FILES YOU WILL CREATE
//   src/lib/types.ts        (PlayMessage type)
//   src/hooks/usePeer.ts    (PeerJS connection hook)
//
// CODE STANDARDS
// Follow the file structure in this brief exactly.
// Every file: imports → types/constants → helpers → main export.
// No any types. Handle every PeerJS error state explicitly.
// Clean up peer and DataConnection on unmount — no memory leaks.
// ─────────────────────────────────────────────

Before wiring up either surface, define the shared types and the connection hook.

Create src/lib/types.ts:

  export type PlayMessage =
    | { type: "dial"; id: string; value: number }     // 0.0–1.0
    | { type: "slider"; id: string; value: number }   // 0.0–1.0
    | { type: "xy"; x: number; y: number }            // 0.0–1.0 each
    | { type: "mode"; value: "geo" | "audio" | "colour" }

Create src/hooks/usePeer.ts:

  A React hook that accepts { mode: "host" | "join", peerId?: string } and returns:
  - localPeerId: string        — the host's generated ID (4-char alphanumeric)
  - isConnected: boolean
  - send: (msg: PlayMessage) => void
  - lastMessage: PlayMessage | null   — latest message received
  - error: string | null

  Host mode:
  - Generates a random 4-character alphanumeric peer ID on mount
  - Creates a PeerJS Peer with that ID using the default public PeerJS server
  - Waits for an inbound connection (peer.on("connection"))
  - Sets isConnected: true when connection opens

  Join mode:
  - Takes the peerId prop and connects to it on mount
  - Sets isConnected: true when the data channel opens

  send() serialises the PlayMessage as JSON over the DataConnection.
  lastMessage updates whenever a message is received.
  Handle all PeerJS errors — set error state and log to console.
  Clean up peer and connection on unmount.

```

---

### Sub-agent 8 — Wire up Output to PeerJS

```jsx
// WHO YOU ARE
// You are the Output wiring engineer for Play.
// Your job is to connect the /output page to PeerJS so that when a phone
// joins the room, its dial/slider/XY/mode messages flow into the variable
// store and drive the canvas. The gamepad is already wired (Sub-agent 4).
// You are adding the phone as a second input source.
//
// WHAT YOU HAVE
// Sub-agents 1-7 are complete. You have:
//   src/hooks/usePeer.ts     (PeerJS hook, host + join modes)
//   src/lib/variables.ts     (variable store)
//   src/lib/types.ts         (PlayMessage type)
//   src/app/output/page.tsx  (canvas running, gamepad wired, temp buttons present)
//
// YOUR JOB
// Mount usePeer in output/page.tsx in host mode. Replace the temporary
// screen-switching buttons with real connection state. Wire lastMessage
// into the variable store. Remove all TODO dev buttons.
//
// FILES YOU WILL MODIFY
//   src/app/output/page.tsx
//
// CODE STANDARDS
// Follow the file structure in this brief exactly.
// No any types. No dead code. Remove every TODO comment from this file.
// ─────────────────────────────────────────────

Connect the /output page to PeerJS using the usePeer hook.

Replace the temporary screen-switching buttons with real connection state:

1. On mount: usePeer({ mode: "host" }) initialises
2. While PeerJS is initialising (no localPeerId yet): show Screen A (loading)
3. When localPeerId is available but isConnected is false: show Screen B (waiting)
   — display localPeerId as the room code
4. When isConnected becomes true: transition via the clip-path mask animation
   into Screen C (the canvas)

Wire lastMessage from usePeer into the variable store via mappings.getTarget():
- { type: "dial", id, value } → target = mappings.getTarget({ device: "phone", type: "dial", id })
  → if target: variables.set(target, value, "phone")
- { type: "slider", id, value } → same pattern as dial
- { type: "xy", x, y } → resolve targets for { device: "phone", type: "xy", axis: "x" } and axis: "y"
  → variables.set(targetX, x, "phone") and variables.set(targetY, y, "phone")
- { type: "mode", value } → update local mode state (not a variable — drives which sketch/layer preset is active)

Default phone XY mapping (before user remaps in INPUTS tab): x → "hue", y → "trail".

Remove all temporary test buttons.

```

---

### Sub-agent 9 — Wire up Input to PeerJS

```jsx
// WHO YOU ARE
// You are the Input wiring engineer for Play.
// You are the last sub-agent. When your work is done, the prototype is
// complete: phone connects, dials drive the canvas, gamepad drives the
// canvas, and the whole system works end-to-end over WiFi.
//
// WHAT YOU HAVE
// Sub-agents 1-8 are complete. You have:
//   src/hooks/usePeer.ts     (PeerJS hook, host + join modes)
//   src/lib/types.ts         (PlayMessage type)
//   src/app/input/page.tsx   (full controller UI, callbacks logging to console)
//   /output is fully wired and running.
//
// YOUR JOB
// Mount usePeer in input/page.tsx in join mode. Replace all console.log
// callbacks with real send() calls. Remove all TODO dev links.
// Verify the full loop works: phone connects → dial moves → canvas responds.
//
// FILES YOU WILL MODIFY
//   src/app/input/page.tsx
//
// CODE STANDARDS
// Follow the file structure in this brief exactly.
// No any types. No dead code. Remove every TODO comment from this file.
// This is the final clean state of the codebase — leave it production-ready.
// ─────────────────────────────────────────────

Connect the /input page to PeerJS using the usePeer hook.

Replace the temporary "Skip to controller" link with real connection state:

1. Show Screen A (connection screen) initially
2. User types a room code and taps JOIN
3. Call usePeer({ mode: "join", peerId: enteredCode })
4. While connecting: show JOIN as "connecting..." in amber (disable re-tapping)
5. When isConnected becomes true: transition to Screen B (controller surface)
6. If error is set: show the error message below the code input in small red monospace

Replace all console.log callbacks with real send() calls:
- onDialChange(id, value) → send({ type: "dial", id, value })
- onXYChange(x, y) → send({ type: "xy", x, y })
- onModeChange(mode) → send({ type: "mode", value: mode })

Remove all temporary test buttons.

```

---

## What to check after all sub-agents complete

- [ ] Open `/output` on laptop — loading screen plays, then room code appears
- [ ] Open `/input` on phone (same WiFi) — Play wordmark + code input shows
- [ ] Enter the room code on phone, tap JOIN — both devices register as connected
- [ ] Drag a dial on the phone — particle behaviour changes on the laptop canvas
- [ ] Move finger on XY pad — colour/trail responds on canvas
- [ ] Tap a mode pill — canvas switches mode
- [ ] Run on mobile (iOS Safari / Chrome) — touch events work on dials and XY pad
- [ ] Plug in an Xbox / PlayStation controller to the laptop — gamepad icon appears in the overlay
- [ ] Move right stick — canvas speed and size respond
- [ ] Pull triggers — density and hue respond
- [ ] Press A / Cross — mode switches to GEO
- [ ] Phone and gamepad active simultaneously — both drive the canvas without conflict

---

## Known prototype limitations (fix later)

- Expression parser is simple (multiply, add, invert only) — no full JS evaluation for safety
- Layer stack and input mappings persist in localStorage; media object URLs and PeerJS session do not survive reload
- PeerJS public cloud has latency — local WebSocket server will be faster for production
- Audio mode requires HTTPS for mic access on most browsers — use ngrok or Vercel preview for testing

---

## How to run

```bash
pnpm dev

```

Open `http://localhost:3000/output` on your laptop.

On your phone (same WiFi): open `http://[your-laptop-local-ip]:3000/input`

Find your local IP with: `ipconfig` (Windows) or `ifconfig | grep inet` (Mac)