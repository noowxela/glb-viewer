# GLB Viewer

Local browser viewer for `.glb` / `.gltf` models (Three.js + React).

**Live:** https://noowxela.github.io/glb-viewer/

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000/

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (port 3000) |
| `npm run build:pages` | Static build for GitHub Pages |
| `npm run build` | Client build + optional Express server |
| `npm start` | Serve `dist/` with Express (after `build`) |
| `npm run preview` | Vite preview of the client build |
| `npm run check` | TypeScript check |

## Model credit

Default model is a transformed Porsche 911 Carrera 4S by Karol Miklas (CC BY-SA 4.0). See [CREDITS.md](CREDITS.md).

## Docs

- [docs/architecture.md](docs/architecture.md) — how the app is structured
- [docs/AGENTS.md](docs/AGENTS.md) — guidance for coding agents
- [docs/sdd/](docs/sdd/) — design docs for product changes
