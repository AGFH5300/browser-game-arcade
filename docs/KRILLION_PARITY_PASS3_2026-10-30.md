# KRILLION PARITY PASS 3 — 2026-10-30 (post-PR #33 continuation)

Scope: full scroll-world engine, original phase machine, two-step answer
corrections, sonar dock, original end screen, wardrobe streak gates, themed
world hooks and Puffer Party capacity parity — derived entirely from ordinary
public browser observation of the free original (krillion.io guest sessions at
1440×900 and 390×844 on 2026-10-29/30, first-party JS/CSS chunks fetched as any
browser does). No private endpoints, authentication, or paid content.

## Method and provenance

| Source | Kind | Use in this pass |
|---|---|---|
| `https://krillion.io/` guest sessions (1440×900 + 390×844) | Live public site | Phase machine timings, preview pill, camera traces, correction/reject flows, wardrobe, settings, done screen, mobile layout |
| `/_next/static/chunks/2_ns9yberwasa.js` (dive screen) | Public bundle | `ds-root[data-phase][data-world]`, root `disabled="tour"===phase`, MASCOT_CHARACTERS + unlockStreak |
| `/_next/static/chunks/1klevf566y93_.js` + 3 dynamic chunks | Public bundles | OCEAN_THEME, party/settings/done modules, ResultsAd |
| CSS chunk `1pp18n31ii136` (215 ds-* rules, 31 keyframes) | Public CSS | Sonar scope/sweep/digits, dock slide-up, sweep speeds (2.4s / 0.7s hot), stage/pod/tag styles |
| Production deployment `browser-game-arcade.vercel.app` (main @ 90d168c) | Our own site | Baseline "before" captures |

## New discoveries beyond Pass 2 (all publicly observed)

1. **`data-world` on the game root.** `ds-root` carries `data-phase` AND
   `data-world` (`theme?.world ?? "ocean"`), and the root is disabled while the
   phase equals `tour`. Pass 2 only knew `data-phase`.
2. **The `preview` phase.** Clicking DESCEND does not jump to answering: the
   root enters `preview` for ~3 seconds (camera eases between anchors, card
   fades in with `animation-delay:.45s`, previous landed banner fades out over
   `0.6s`, dock slides up only for `data-phase="answering"`), with a pill
   counting down "descending · the clock starts in 3…2…1…0". Pass 2 had no
   preview concept.
3. **Exact world geometry.** World column height 14,800px; ambient facts at
   `worldY = metres×2 − 9` (all 21 verified: 60m→111px, 332m→655px, 7000m→
   13,991px); trench floor image at `top:14,020px` (961px tall). Same column on
   mobile (verified at 390×844).
4. **Exact round geometry.** Each round spans 2,000px (1000m = 100 points) from
   `2×previousDepthM`: tier lines at `base + score/100 × 2000` (Duck at 0m →
   200px; Mauritius at 100m → 2,200px — both measured live), so tier line
   fractions are exactly **score/100** (.10/.15/.30/.60/.85/1.00), not the
   .08/.18/.36/.82/.97 Pass 2 recorded. Lines flash in with a 90ms stagger
   (0/90/180/270/360/450ms) and only for scored rounds; misses leave no lines.
5. **The answer chip choreography.** The chip spawns at `base+180` and sinks to
   its achieved tier line (observed 1,820px sink for the 100-point tier) with
   sub-pixel wobble (`translate3d(calc(-50% ± 0.3px), Y, 0) rotate(±0.08deg)`).
6. **Camera model.** `translate3d(0, anchor − 2×depthM, 0)` with a continuous
   sub-pixel idle drift (±0.1–2px water current, observed while idle). Measured
   anchors on a 900px stage: answering ≈ 207px (23%), landing feedback ≈ 340px
   (37.8%), miss feedback ≈ 261px (29%), done ≈ 0.51H. A 2,000px descent eases
   in-out over ~4.9–5.6s (traced); the krillion-tier trace was reproduced to
   within 0.02px of the predicted settle point.
7. **Two-step answer corrections.** With the original's "Answer corrections"
   setting ON (default), a fuzzy answer rewrites the input to the canonical
   answer and shows `"typed" → "corrected"` plus "submit again to confirm · or
   edit". Nothing scores until the second submit. Our Pass-2 behavior banked
   after 650ms; Pass 3 implements the real two-step flow.
8. **Sonar dock.** The countdown is a sonar scope (`radial-gradient` circle,
   double ring) with a rotating sweep arm (`linear-gradient(90deg,#4de3ff,transparent)`,
   2.4s/revolution, **0.7s when hot**) and the digits inside the scope. The fuse
   is a `scaleX(remaining/total)` bar; the DIVE button is disabled until text is
   entered; `maxlength=256`, `autocapitalize=off`, `enterkeyhint="send"`.
9. **Original settings set.** Low-power mode, Colorblind mode, Answer
   corrections, Clear rejected entries, Share link (exact copy captured). Pass 2
   knew only clearRejected. Pass 3 adds answerCorrections + renames the panel.
10. **Wardrobe roster with streak gates.** The Krill (default) · Schooler
    (5-day streak) · Rare Squid (14) · Deep Cut Angler (30) · Evil Krill (45),
    from `MASCOT_CHARACTERS`/`setCharacter` in the public bundle; all sprites
    already ship in our recovered asset set.
11. **End screen ("done").** "DIVE #N COMPLETE", big score + `−1,300m`, THE
    BEARING bands `0–150 / 151–250 / 251–350 / 351–449 / 450+` with new verdict
    copy ("Rare. Below the thermocline. Nice.", "One in a krillion. Trench
    dweller. Absurd."), THE CATCH per-round list, LOGBOOK line (STREAK · PLAYED
    · AVG · BEST), "NEXT DIVE IN hh:mm:ss" to ET midnight, a 1–5 dive rating
    ("1 = MEH · 5 = GREAT"), COPY RESULT / KEEP DIVING ∞ / ARCHIVE ⟲ / THEMED
    PACKS buttons, gold flash `rgba(255,209,102,.35)` and a gold mascot sprite
    on surfacing.
12. **Puffer Party is 2–16 players** ("Basically hot potato but for krillion"),
    not 2–8 as our labels said. Backend default cap raised to match.
13. **Live per-answer pick counts** ("153,589 other players chose this") and a
    score-distribution percentile curve are server-fed — **not recoverable**
    from authorized public data; our end screen intentionally omits them.
14. **Unlimited structure.** `/unlimited/classic?game=N` slots with a dive log
    ("0/76 charted · replays keep your best"); themed packs are 30 chapters
    each ("Words & Language · 30 chapters", movies/sports/geography + Music
    coming soon) — recorded here for the parity matrix (not rebuilt this pass).
15. **Storage schema.** `krillion:player:v1` (anonymous UUID) +
    `krillion:stats:v1` per-day history (`promptId/promptText/rawAnswer/tier/
    score`) — our existing per-browser model already mirrors this shape.

## Changes shipped (working tree against 90d168c)

- **`public/play/deep-dive/reference-world.js`** (new): pure world-coordinate
  math + single rAF camera with eased moves and idle drift; every constant
  annotated with its live-measured source.
- **`public/play/deep-dive/game.js`**: preview→answering→feedback→done phase
  machine with persisted progress migration (legacy 'question'/'reveal' saves
  resume correctly; an expired timer converts to timeout feedback); world-anchored
  card/facts/tier lines/chip/landed; sonar dock; two-step corrections; reject
  copy `no echo. try again`; `--dd-urgency` driver; HUD shows the upcoming
  prompt during feedback; stage shake on miss; THE BEARING/THE CATCH/LOGBOOK/
  NEXT DIVE/rating end screen with surfacing camera + gold flash; themed
  `data-world` per starter pack; crash-resilient dive rendering.
- **`public/play/deep-dive/reference-pass3.css`** (new): stage/world/sea zoning,
  surface title inside the world, sonar dock + sweep keyframes, reject/
  correction/preview pills, urgency-driven edge, done-screen layout, themed
  world tints, reduced-motion guards, and a no-fixed-inside-world seam guard.
- **`public/play/deep-dive/reference-interface.js`**: answerCorrections
  preference (default ON), original settings copy, streak-gated wardrobe with
  unlock labels.
- **`public/play/deep-dive/index-public-art.html`**: pass-3 CSS + world engine
  registered in load order; cache keys bumped (`game.js?parity=20261030pass3c`,
  `reference-pass3.css?release=20261030b`, `reference-world.js?version=20261030b`);
  `data-phase="boot"` on the preload.
- **`lib/deep-dive-party.ts` + `party.js`**: PARTY_MAX_MEMBERS 8→16 and 2–16 copy.
- **`tests/deep-dive-world.test.ts`** (new, 8 tests) + pinned cache keys updated
  in 6 existing suites; zai-integration suite updated to pin the two-step
  correction and world markup instead of the superseded Pass-2 internals.

## Verification performed this pass

- `node --check` on all 5 game JS files; `npm run typecheck`; `npm run lint`
  (--max-warnings=0); `npm test` → **103/103** (95 carried forward, 8 new).
- Desktop 1440×900 Playwright-equivalent in-page QA: full daily dive with
  corrected answer (Baguette, plankton), skip-miss, krillion-tier answer
  (Dickcissel, 1,000m sink: chip sank 1,820px to its line, camera settled at
  −2060.0 vs the predicted −2060), timeout-miss stage shake, done screen with
  all sections + live NEXT DIVE countdown + persisted rating.
- Two-step correction verified end-to-end twice ("bagguette"→Baguette,
  "chimanzee"→Chimpanzee): input rewritten, pill shown, nothing scored until
  the confirm submit.
- Mobile 390×844: no horizontal overflow in home/preview/answering/feedback/
  done; dock bottom-anchored with 48px sonar; correction flow repeated.
- Themed world smoke (movies → `data-world="hollywood"`, premiere floor,
  6-prompt pack), archive (105 dates), Puffer Party lobby UI, settings/wardrobe
  streak locks. Local backend lacks DATABASE_URL so the party room list is
  untestable locally (production env covers it).
- Before/after captures archived under `docs/verification/pass3/` (this run)
  and `download/` (delivery bundle): before (production @ 90d168c) vs after
  (this tree) at 1440×900 and 390×844.

## Honest limitations

- Live pick counts, the server percentile curve and the original's
  authenticated features remain ⛔ not recoverable; everything else in the
  matrix is implemented or approximated as labeled.
- The `tour` phase's full content is not publicly observable (root disabled
  during tour was the only signal); Pass 3 approximates it as an extended
  first-dive preview with the rarity hint.
- The score-distribution SVG is not reproduced because it is server data.
- Autonomous mascot swimming (per-frame JS wander) is approximated with the
  recovered pose animations + mood classes (sad/gold) + blub bubble.
