# Sidequest
Compact Next.js/TypeScript/Tailwind browser arcade. New private repo only; Vercel hosting, Neon PostgreSQL.
- Public browsing and games require no account. All admin writes require server authorization.
- app/: routes; components/: client UI; lib/: models, queries, auth; public/play/: locally licensed games; data/: seed; migrations/: SQL.
- npm ci; npm run dev; npm run typecheck; npm run lint; npm test; npm run build.
- Never commit secrets, game code without permission, generated dependencies, or fake engagement data.
- Preserve upstream licenses. Record every game in GAME_SOURCES.md.
- Definition of done: targeted tests, typecheck, lint, build; verify live behavior and document limitations accurately.
