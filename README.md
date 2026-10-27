# Sidequest

A compact browser arcade built with Next.js App Router, TypeScript, Tailwind CSS and Neon PostgreSQL. Public play is free and needs no account. The initial library is 26 locally hosted games with original cover illustrations and retained licenses.

## Development

Use Node 22+ and `npm ci`. Copy `.env.example` to `.env.local`, configure PostgreSQL and admin secrets, then run `npm run seed` and `npm run dev`.

Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm start`.

`npm run seed` applies the ordered SQL migrations and inserts missing catalogue records. It preserves existing edits. Without DATABASE_URL, development previews use the seed file; production requires the database and never silently falls back to stale seed data.

## Administration

Open `/admin`, username `admin` (or ADMIN_USERNAME). All admin reads/writes are authorized on the server. The bootstrap password is represented only by ADMIN_PASSWORD_HASH, an scrypt salt:hex digest. SESSION_SECRET must contain at least 32 cryptographically random characters. No admin credential belongs in source control.

To generate a password hash in a secure terminal, use Node's `crypto.scryptSync(password, salt, 64)` with a random 16-byte hex salt and store `salt:derivedHex` as ADMIN_PASSWORD_HASH in Vercel. Do not put passwords in shell history. The administrator can change the initial password using the password form in the admin page; the replacement is hashed in PostgreSQL and prior sessions are invalidated.

Add/edit games, upload PNG/JPEG/WebP thumbnails up to 1 MB, preview drafts, publish/unpublish or delete. Publishing requires licensing notes. Local game URLs must start with `/play/`. External iframe hosts must be explicitly allowed in EMBED_ALLOWED_HOSTS (comma separated hostnames). Flash publishing is deliberately disabled until a licensed Ruffle integration is added.

Game runtime assets are code reviewed and versioned in GitHub; this release does not accept arbitrary executable uploads through the admin interface. Uploaded images are persistent PostgreSQL data, not Vercel filesystem writes.

## Deployment

Private repository `AGFH5300/browser-game-arcade`, production branch `main`, new Vercel project `browser-game-arcade`. Git pushes trigger preview/production builds. Vercel environment variables: DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD_HASH, ADMIN_USERNAME, APP_URL; optional EMBED_ALLOWED_HOSTS. Public catalogue/pages use server-side queries; game assets initialize only after Play.

CI checks types, lint, tests and production compilation. A successful deployment is verified separately in the browser. Refer to PLAN.md, HANDOFF.md and TESTING.md for status, not the existence of a deploy URL alone.

## Games and privacy

See GAME_SOURCES.md and `/credits` for licenses. Games execute in opaque-origin sandboxed frames. Hextris uses a session-only storage adapter; embedded game progress is not promised to persist. Favourites, recent history and theme persist in the parent site's local storage. Engagement totals are actual Play button starts with a per-game, keyed-IP throttle (one count per 30 minutes), not unique visitors or completed sessions. Likes are infrastructure-only; no fake likes are seeded.

The contact form stores messages privately for the administrator at `/admin/messages`; it does not send mail.

No ads, third-party analytics, paid APIs or proprietary game files are bundled. The library currently focuses on puzzles plus Hextris arcade; empty genre categories are labelled honestly. Optional external game storefront/social links are upstream attribution and are not partnerships.
