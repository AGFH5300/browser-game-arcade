# Krillion public UI parity — Pass 5 (2026-10-30)

Scope: home, free menu and onboarding, results, animations, free themed packs, Unlimited, Archive, spell correction and stale-cache repair. Party/Settings/wardrobe/mobile polish were not targeted for exact matching.

## Evidence

Browser-inspected source site: https://krillion.io/, /packs, /archive, /unlimited/classic, live Daily first-round correction. Prior saved original full results screenshot at 1440x900. Original header at about y28, score y86, distribution y174, vertical dive log y360 and bearing around y688.

## Implemented

- Source-style home, slide-out menu, privacy/how-to, authentic recovered artwork, and THE ENDLESS DIVE free seven-round intro. Removes the separate homemade 50-round/three-life gameplay from the ordinary Unlimited entry.
- Original four stacked themed pack card styles and recovered visual assets plus MUSIC coming-soon. Recovered starter chapter plays while 30-chapter unverified contents remain disclosed.
- Archive preserves 105 public archived days with 735 original prompts and 499,704 historically scored answers, now showing local best replay score and day labels.
- Rebuilt Krillion-type result screen with transparent dark overlay and actual score, depth, seven answer dive stems, original bearing/catch/logbook, next reset, rating, and result copy formatting.
- A curve based on actual locally stored comparable past scores if at least five exist; otherwise a visually similar **illustrative** curve explicitly labelled as such. The publisher's global percentile is unavailable and never invented.
- Source-referenced effects: scene foreground canvas, sea background, bubble/fish sprites, menu and result animations, preview, chip sinking and surface camera easing. Sound uses recreated synthesized original-event sounds, not exact original audio master samples.
- Spell correction: accepted answer-only exact and unique near matches, longer-word allowances and adjacent swap support; explicit second submission before scoring. Browser native spellcheck stays disabled, matching the original input.
- Stale browser result repair: versioned canonical Deep Dive iframe and no-store HTTP cache rule for its HTML, while keeping the existing privileged same-origin sandbox and old-route redirects.

## Verification

- Syntax, typecheck and lint; 122 tests passed before final new cache regression tests.
- Browser 1440x900 and 390x844 home, menu, original themed cards, Movies 16,400px game world and Unlimited seven-round HUD all passed, with no JavaScript errors or source asset 404s.
- Full results fixtures rendered seven real-score points and source-aligned headings, curve/log/bearing at y23/y150/y364/y688 on desktop.
- The typo Bedfordshire clanger -> Bedfordsihre clanger was corrected in a two-step flow, awarding zero before confirmation and 100 after, on desktop and mobile; next-round transition passed.

## Remaining non-identical / exclusions

Official global player distribution and per-player percentile, exact original source-account sharing service, complete 30-chapter answer sets, some themed world choreography, all pixel-level animation and sound triggers, exact mobile/accessibility states and publisher server features are not recovered. Archive deliberately remains free despite original official purchase gate. This is an independent reconstruction, not an original-source or byte-for-byte Krillion replica.
