# Handoff
Working branch: feature/arcade-release; production: main.
Latest runtime-verified checkpoint: 5af2c89a9465f018a17d48c64c4ca73529b6f53a.
Completed: full Sidequest portal, 26 local games, PostgreSQL admin, favourites/history/play counts, SEO/legal, source registry. Twelve unit tests + typecheck/lint/build and 11 live admin API checks passed; 26 live game frame checks and responsive QA completed.
Active checkpoint: finalize documentation/social image, remove preview-only QA route and merge verified release to main.
Next: verify production deployment/CI at main; then no critical implementation tasks remain.
Vercel project: prj_gNmSoJaaOciiIfSUhorY9OqKl3BQ (browser-game-arcade), team dxbavg-7923s-projects.
Database: new project silent-lake-44327142, default branch br-dry-flower-balhirgu, Frankfurt. Settings available on account remain provider-controlled; no paid plan purchased.
Commands: npm ci; npm run typecheck; npm run lint; npm test; npm run build; npm run seed; npm run dev. `node scripts/live-smoke.mjs` accepts initial admin password on stdin; use SMOKE_URL for deployment.
Env: DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD_HASH, ADMIN_USERNAME, APP_URL; optional EMBED_ALLOWED_HOSTS. Credentials are not recorded here.
Known limitations: see TESTING.md. The initial admin password is delivered privately in the conversation; change it through /admin.
