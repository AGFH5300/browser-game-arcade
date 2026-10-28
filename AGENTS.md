# Sidequest
Compact Next.js/TypeScript/Tailwind browser arcade. New private repo only; Vercel hosting, Neon PostgreSQL.
- Public browsing and games require no account. All admin writes require server authorization.
- app/: routes; components/: client UI; lib/: models, queries, auth; public/play/: locally licensed games; data/: seed; migrations/: SQL.
- npm ci; npm run dev; npm run typecheck; npm run lint; npm test; npm run build.
- Never commit secrets, game code without permission, generated dependencies, or fake engagement data.
- Preserve upstream licenses. Record every game in GAME_SOURCES.md.
- Definition of done: targeted tests, typecheck, lint, build; verify live behavior and document limitations accurately.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
