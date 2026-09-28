# 001 — Studio environment toggle

Status: implemented  
Date: 2026-09-28  
Repo: `glb-viewer`

## Goal

Add a header **Studio** toggle for showroom lighting. Ceiling uses **honeycomb / hexagon detailing LED strips** (white emissive bars on a dark plate) for car-paint reflections, plus soft side fills and a dark garage backdrop.


## How nice_car_911 does it today

- React Three Fiber + drei `Environment` with `background` + `blur`.
- Children are `Lightformer` planes (ceiling strip, moving circular formers, side bars, red ring) rendered into a PMREM used as `scene.environment`.
- Background sphere: lamina `LayerMaterial` gray + blue→black depth gradient.
- Also: spot + ambient lights, accumulative ground shadows.

`glb-viewer` is plain Three.js (already uses `RoomEnvironment` PMREM + directional lights + grid). We will **not** migrate the whole app to R3F; we recreate the studio look with a PMREM from a custom three.js lightformer scene.

## Proposed UX

- New toolbar button next to Spin/Reset, e.g. **Studio** / **Env**.
- Toggle on: swap `scene.environment` to the lightformer PMREM; set blurred gradient background; optionally hide grid (see open questions).
- Toggle off: restore current RoomEnvironment + light gray background + grid.

Default: **off** (keep current viewer look until the user opts in), unless answered otherwise below.

## Implementation sketch

1. `client/src/lib/studioEnvironment.ts` — build a small three.js scene of emissive meshes (same layout as `Lightformers` in `nice_car_911/src/App.js`), bake with `PMREMGenerator.fromScene`, return `{ envMap, background }` (or a cube/PMREM texture + solid/gradient background texture).
2. `ModelViewer` — accept `studioEnv: boolean`; on change, assign `scene.environment` / `scene.background` and dispose previous maps; keep RoomEnvironment as the off state.
3. `Home.tsx` — `useState` + button; pass prop into `ModelViewer`.
4. Optional: animate moving lightformers only while studio is on (cheap; update in existing rAF). If cost is high, bake a static frame (like degraded mode in nice_car_911).

## Pros / cons / risks

| | |
| --- | --- |
| Pros | Same visual language as the reference car demo; user-controlled; no R3F migration |
| Cons | Pixel-perfect match to drei/lamina is hard; red ring + Float animation may be simplified |
| Risks | Extra GPU cost when animated; need careful dispose of PMREM textures on toggle/unmount |

## Decisions

1. **Background vs grid:** When studio is ON, hide the grid and use the blurred showroom background (closer to nice_car_911).
2. **Default:** Studio starts **off**.

## Open questions (need answers before implement)

~~1. Background vs grid…~~ → hide grid  
~~2. Default…~~ → off

## Out of scope

- Migrating glb-viewer to `@react-three/fiber` / drei.
- AccumulativeShadows / PerformanceMonitor from the reference app.
- Changing model materials (coat/paint envMapIntensity) beyond what envmap already affects.
