# AOC — project rules

- Spec: the PRD "Airport Operations Center — PRD & MVP Specification" (Claude Doc) is the source of truth.
  Do not add features that are not P0 unless asked. Put new ideas in docs/IDEAS.md instead of building them.
- Stack: React 19 + TypeScript strict + Vite + Tailwind v4 + shadcn/ui + Zustand + Recharts + Vitest.
- UI text is in English. Code, names and comments are in English.
- Layers: src/domain (pure functions, no React) -> src/store (Zustand) -> src/components, src/pages.
- UI never mutates state directly and never computes KPIs; use store actions and selectors.
- Domain functions return Result: { ok: true, ... } | { ok: false, reason: string }. No throws.
- Times are minutes since 00:00 of the simulated day (number). Use helpers in src/domain/time.ts.
- Gate state, occupancy windows, conflicts and KPIs are DERIVED. Never store them.
- Every successful mutation appends exactly one OperationalEvent.
- No Math.random / Date.now in domain or seed. Files <= 250 lines.
- Status colors: use the theme tokens status-ok / status-warn / status-critical / status-info / status-neutral.
- shadcn/ui: after `npx shadcn add`, check that new files import `cn` from "@/lib/utils".
- After changes: run `npm test` and `npm run typecheck`; report the results.

Node is installed via nvm. In a non-interactive shell run first:
`export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"`
