# Public Krillion reference inspection — 29 October 2026

The user states the Krillion creator authorized copying publicly available material but will not offer an embeddable origin or private source. The investigation inspected publicly served resources only; it did not use private credentials, accounts or restricted APIs.

## Observed public surface
- The public landing page uses Next.js/Turbopack and delivers 15 JavaScript chunks and four CSS files. We downloaded these exact public files to a local analysis folder on the authorized computer, not to the production repo. No JavaScript source maps were linked from the captured landing entry.
- The original canvas-based scene loads a sky-and-boat pixel-art image, underwater top/mid/trench backdrops, a puffer sprite and VT323 font. Six graphics/font files were copied byte for byte into public/play/deep-dive/reference-art, with SHA-256 checksums in manifest.json. Existing Deep Dive title/logo remains original. Original Krillion/seasonal badge art was not copied.
- Browser capture showed an unauthenticated GET to /api/today. Its response carries date, dayNumber, resetsAt and seven prompt objects with id/text. The response DOES NOT contain a complete accepted-answer list or original per-answer rarity values.
- The landing also requested /api/announcements/current. No third-party Krillion POST was submitted by this investigation.
- REA v6.8.0 analyzed three selected browser bundles locally: 3 parsed scripts, 112 graph nodes, 150 edges and 144 findings. Attempted full-bundle analysis was stopped after a large framework script proved too CPU intensive.

## Source-fidelity build
The visual fidelity release introduces public/play/deep-dive/index-public-art.html and a versioned reference-art.css. The existing Sidequest game logic and Neon-backed Puffer Party stay in place. The original source's public sky, boat, ocean, puffer image and VT323 font are used directly instead of invented replacement graphics. The original proprietary server implementation, total corpus, daily scoring service, multiplayer internals and accounts are not recovered.

This is not yet a line-for-line, asset-for-asset whole-game reproduction. Only the selected publicly recovered art is byte-identical.

## QA and next steps
Verified three local Chromium viewports: 1440x900, 1080x800 and 390x844. Both main buttons are inside the viewport, no page script errors, and entering the game starts a 25-second question. Core Puffer Party previously passed a two-browser real-service test before this CSS-only change. Further validation on the Vercel preview with two browsers is required before production publication.

Remaining work: inspect original answer-submission API contract under public gameplay conditions; compare original official scoring and unlock structure; capture answer/result screens; expand prompt and accepted-answer coverage; reproduce Puffer Party's exact animation/interaction and inspect additional public assets. Avoid copying third-party ad trackers or authentication dependencies into Sidequest.
