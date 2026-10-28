# Sidequest V4 recovery checkpoint — 28 October 2026 (Dubai)

## Source of truth
- Existing repository: `AGFH5300/browser-game-arcade`.
- Current V4 branch: `feature/v4-local-game-packages`. Read actual HEAD before work.
- Last observed **production** HEAD: `ef82f2825fc2cb34362b01a9d77478d4b710cf82`, Vercel deployment `dpl_FYLBDDzZWvDxE8fuN9CagXY88bRg` READY.
- Production Neon DB: `silent-lake-44327142` (do not reset); 34 published records at 28 Oct 10:16 Dubai time (27 local /play URLs, 7 external).
- Work's latest V4 branch checkpoint before these fixes: `5f779dadc101d1eb07aa5dbaa0edc5be8435694b`. It includes 128 catalogue entries/covers and 84 replacement-package manifests. **NOT** all 128 are production playable.
- Do not switch the production database to a package until that package is served on a stable deployment path. Preserve IDs, favourites, counts, and existing active game URLs.

## Changes saved by direct assistant while Work was usage-limited
1. `scripts/prepare-reference-packages.mjs`:
   - Fix Node 22+ dual-stack DNS `lookup()` callback shape (array expected with `{all:true}`).
   - Handle malformed protocol-relative strings such as `//` without crashing the asset rewriter.
   - Support `--build-selected slug1,slug2` using only explicitly pinned, ready manifests. The normal `--build` **still requires all 84**; no incomplete games are silently accepted.
   - Do not require a `<head>` bridge-injection point in **secondary**, possibly empty HTML assets (e.g. `stickman-hook/null.html`). The main entry page still requires `<head>`.
   - Add malformed-reference regression to `--self-check`.
2. `scripts/audit-reference-pins.mjs`: offline validity/size consistency audit, plus optional derived-total repair that leaves every individually pinned file SHA untouched.
3. `package.json` scripts: `games:reference-audit`, `games:reference-repair-totals`, `games:reference-encoding-check`, `games:reference-batch`.

No subagents or paid services used. No production updates made in this recovery.

## Concrete findings — do not repeat broad research
- `scripts/reference-package-sources.json` has 84 required reference packages: 44 flagged `ready`; 40 incomplete.
- Of 44 ready flags, 37 were fully internally consistent when audited; 7 have aggregate `totalSourceBytes` mismatches against the sum of pinned `file.sourceSize`:
  `a-small-world-cup`, `ovo`, `fireboy-and-watergirl-1`, `fireboy-and-watergirl-2`, `angry-heroes`, `eggy-car`, `snake-io`.
  Each still had an entry HTML path, matching file counts, and complete recorded per-file source hashes. Use the offline audit and `--repair-derived-totals` to reconcile these *derived totals* before building; real downloads must independently verify per-file SHA-256.
- Ready source packages total approximately 1.07 GB (for all 44). **Do not download all in a single speculative Vercel build.**
- A five-file, 37 MB `survival-race` package was independently downloaded and hash-verified using the fixed packager on the authorized Mac. Output was created at `public/play/archives/survival-race` in temporary working directory `/tmp/sidequest-carlwalks-selfhost-20261027`. The output is **not committed/deployed**. 18 optional-source warnings (largely 404 source assets/lookup) remain, so this is an asset-packaging result, **not confirmed gameplay**.
- We attempted the ten-game small batch. It first failed at malformed `https://` string; after patch, it reached the secondary `stickman-hook/null.html` lacking a `<head>`. Those defects are now fixed in source. The connected Mac became unresponsive before a complete rerun; do not claim ten games built.
- Potential next small valid batch (all have individually pinned files and internally consistent totals):
  `funny-shooter-2,icy-purple-head,among-us,paper-io,pixel-shooter,drive-mad,geometry-dash-hyper-wave,retro-bowl,level-devil,stickman-hook`.
  Approximate combined asset size: 23 MB. Run via `npm run games:reference-batch -- <comma-separated-slugs>` after `npm run games:reference-encoding-check` and `npm run games:reference-audit`. Output is local static assets only; **do not mark production-ready without HTTP/source checks**.
- Current V4 branch Vercel deployment `dpl_8hzgrX3eZHAJPiLGZE3mLJG3GnNZ` failed 1/36 tests: `reference collection avoids known host-blocked iframe URLs` with `survival-race`, because `data/reference-games.json` still points to `watchdocumentaries.com`. The test is correct. **Do not weaken/delete it or publish 91 known blocked reference iframes.** Build local source packages, update their URLs to stable Sidequest paths, and only then release the corresponding records.
- `scripts/prepare-reference-packages.mjs --self-check` passed locally for compressed gzip/brotli normalization and IPv4-mapped IPv6 checking before and after the DNS fixes.

## Minimal next execution
1. `git status`; inspect V4 HEAD and this handoff. **Do not research all 128 again.**
2. `npm run games:reference-audit` (expected nonzero while 7 derived totals differ).
3. `npm run games:reference-repair-totals`. Confirm only aggregate total fields changed and all per-file pinned SHAs stayed identical.
4. `npm run games:reference-encoding-check`.
5. `npm run games:reference-batch -- funny-shooter-2,icy-purple-head,among-us,paper-io,pixel-shooter,drive-mad,geometry-dash-hyper-wave,retro-bowl,level-devil,stickman-hook`.
6. Check each built game for missing required files, compressed serving headers, relative asset paths, and unneeded analytics/SDK calls. User explicitly takes responsibility for **manual gameplay and WebGL testing**; run deterministic HTTP/test/typecheck/lint/build checks yourself.
7. Add only **working, packaged entries** to next release; keep 34 production games working, preserve ID data, do not publish blocked external frames.
8. Commit tested results and deploy preview, then promote verified batch. Resume remaining 40 unready manifests in bounded groups with saved checkpoints.

## User's explicit operating constraints
- Main goal: all 128 WatchDocumentaries games on Sidequest, ideally as local game packages from reputable GitHub/original developer builds. No false playable counts.
- One primary implementer; maximum three delegated workers, preferably <=2. GPT-5.6 Luna XHigh/Max preferred; GPT-6 Luna High/XHigh fallback allowed by user. No other delegated models, no recursive delegation.
- User handles manual gameplay QA, including WebGL. Work still owns static/asset/build verification. Never claim user QA has passed.
- Standard speed; no paid API/credits, no plan upgrade, no unnecessary Sol/Astra escalation.
- Read attached *Efficient ChatGPT Codex on Plus Under Tight Usage Limits* and follow concise AGENTS.md, PLAN.md, HANDOFF.md, bounded checkpoints, small changes, targeted tests and durable commits.
- Keep ad placeholders hidden and current 2024–25 styling/search; no unauthorized network-filter bypass.
