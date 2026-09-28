# Agent guide — glb-viewer

## What this repo is

A React + Vite + Three.js GLB/glTF viewer for inspecting car models in the browser. Default sample: `client/public/models/911-transformed.glb`.

## Scope rules

- Work only in this repo unless asked to touch another project.
- Product behavior/UX/data changes: write `docs/sdd/NNN-<slug>.md` (status `draft`), update `docs/sdd/INDEX.md`, then **stop and wait for approval**.
- Skip SDD only for typos, lint, or one-line fixes that cannot change behavior, data, or UX.
- Do not commit unless the user asks. Do not push unless asked.

## Stack

- Client: React 19, Vite 7, Tailwind 4, wouter, three.js (GLTFLoader + Draco + Meshopt)
- UI: shadcn/ui under `client/src/components/ui/`
- Production host: Express in `server/index.ts` (static `dist/public`)

## Key paths

| Path | Role |
| --- | --- |
| `client/src/pages/Home.tsx` | Main UI, file open, footer credit |
| `client/src/components/ModelViewer.tsx` | Three.js scene, grid, controls |
| `client/src/lib/gltf.ts` | Loader helpers, `frameObject` grounding |
| `client/public/models/` | Bundled GLB models |
| `client/public/draco/` | Draco decoder wasm/js |
| `CREDITS.md` | Third-party model attribution |

## Local run

```bash
npm install
npm run dev
```

Verify viewer changes in the browser at http://localhost:3000/.

## Attribution

When shipping or changing the bundled 911 model, keep [CREDITS.md](../CREDITS.md) and the on-page footer credit accurate (CC BY-SA 4.0 requires credit + note of changes).
