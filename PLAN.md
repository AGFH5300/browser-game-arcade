# Sidequest release plan
- [x] Reference analysis and new private GitHub repo.
- [x] Next.js/TypeScript/Tailwind shell, first successful Vercel deployment.
- [x] Responsive visual system, dark/light/system themes.
- [x] URL-backed instant search, real-metric/title/date sorting, categories, 20-item pagination.
- [x] Isolated reusable HTML5/authorized iframe player, reload and fullscreen/expanded fallback.
- [x] 26 legally usable locally hosted games, original covers, source/license registry.
- [x] New Neon PostgreSQL schema and idempotent seed; authenticated admin CRUD, drafts/preview, publishing and thumbnail upload.
- [x] Device-local favourites/history, related games, actual rate-limited play counts.
- [x] SEO/legal pages, security checks, 12 tests, typecheck/lint/build and focused review.
- [x] Live browser checks of all26 runtimes, representative gameplay, phone/tablet rendering and 11 admin API integration checks.
- [x] Verified release merged to main; live production checked; GitHub CI account block identified and Vercel automatic checks configured.

Decisions: Sidequest temporary original brand. Private source, public Vercel site. No proprietary game copies. Launch is intentionally puzzle-led. No paid plans or API billing introduced. Credentials only in encrypted Vercel env/server database.

Remaining limitations: no Flash content/Ruffle; no physical-device touch certification or Lighthouse score; native fullscreen blocked in cloud test browser (expanded fallback verified); password change requires administrator action. See TESTING.md for exact evidence.

Operational follow-up: resolve GitHub account billing/spending restriction to run GitHub Actions. Branch protection needs a compatible paid GitHub organization plan; no upgrade authorized or made. These do not prevent the live website or Vercel automatic verification.
