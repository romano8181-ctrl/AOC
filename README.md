# AOC · Airport Operations Center

Educational simulation of an airport operations dashboard: flights, gates, incidents and KPIs
for a fictional airport (AUR · Aurora International). Not a certified aviation system.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |

## Stack

React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Zustand, Recharts, Vitest.
No backend: state lives in the browser (localStorage) and can be reset to demo data.
