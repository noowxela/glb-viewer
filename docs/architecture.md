# Architecture — glb-viewer

Status: current baseline  
Last updated: 2026-09-28

## Purpose

Browser app to open and inspect `.glb` / `.gltf` models with orbit controls, auto-rotate, zoom, and a ground grid. Ships with one sample car model for first paint.

## Runtime topology

```text
Browser
  └─ React app (Vite, root = client/)
       ├─ Home page (file picker / drop)
       └─ ModelViewer (three.js WebGL)
            ├─ GLTFLoader + Draco (/draco/) + Meshopt
            ├─ GridHelper + ground disk
            └─ OrbitControls

Production (optional)
  npm run build → dist/public (static) + dist/index.js (Express)
  npm start     → Express serves dist/public, SPA fallback
```

## Data flow

1. Default source: URL `/models/911-transformed.glb`.
2. User can open a local file or drop a `.glb`/`.gltf`; `Home` sets a `file` source.
3. `ModelViewer` loads via `getGltfLoader()`, then `frameObject()` centers the model and places the bbox bottom on y=0 so it sits on the grid.
4. Progress / load / error callbacks update the Home overlay and toasts.

## Folder map

| Path | Responsibility |
| --- | --- |
| `client/` | Vite app root (HTML, public assets, React src) |
| `client/src/pages/` | Routes: Home, NotFound |
| `client/src/components/ModelViewer.tsx` | Three.js viewer |
| `client/src/lib/gltf.ts` | Load / dispose / frame helpers |
| `client/src/lib/studioEnvironment.ts` | Lightformer showroom PMREM (studio toggle) |
| `client/src/components/ui/` | shadcn primitives |
| `server/` | Production static file server only (no API) |
| `shared/` | Shared TS placeholders (minimal) |
| `docs/sdd/` | Product change design docs |

## Non-goals

- No backend API, auth, or cloud storage.
- Not a full CAD editor; view-only.

## Model licensing

Bundled sample is CC BY-SA 4.0 — see `CREDITS.md`. Adapted exports must keep attribution.
