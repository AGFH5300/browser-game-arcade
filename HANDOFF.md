# Handoff
Working/default/production branch: main. Feature release has been merged.
Latest production-verified code commit: c30e83ef9cd555464b438542295332e819426fcd.
Completed: full Sidequest portal, 26 local games, PostgreSQL admin, favourites/history/play counts, SEO/legal, source registry. Twelve unit tests + typecheck/lint/build and 11 live admin API checks passed; 26 live game frame checks and responsive QA completed.
Active checkpoint: documentation handoff and final Vercel verification. Preview-only public QA route has been removed; fixture source remains in scripts/.
Next: user can use the live site and change the supplied initial admin password. GitHub Actions is blocked by account payments/spending; Vercel runs typecheck/lint/tests/build automatically. No known critical implementation issue remains.
Vercel project: prj_gNmSoJaaOciiIfSUhorY9OqKl3BQ (browser-game-arcade), team dxbavg-7923s-projects.
Database: new project silent-lake-44327142, default branch br-dry-flower-balhirgu, Frankfurt. Settings available on account remain provider-controlled; no paid plan purchased.
Commands: npm ci; npm run typecheck; npm run lint; npm test; npm run build; npm run seed; npm run dev. `node scripts/live-smoke.mjs` accepts initial admin password on stdin; use SMOKE_URL for deployment.
Env: DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD_HASH, ADMIN_USERNAME, APP_URL; optional EMBED_ALLOWED_HOSTS. Credentials are not recorded here.
Known limitations: see TESTING.md. The initial admin password is delivered privately in the conversation; change it through /admin.

Production URL: https://browser-game-arcade.vercel.app
Production project is connected to private AGFH5300/browser-game-arcade, branch main. Git pushes were observed to trigger preview/production deployments. All requested source/checkpoint/license files are committed. Branch protection is not enforceable on the current private-repository plan.
