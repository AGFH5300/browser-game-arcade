# Source animation and micro-motion audit — 31 October 2026

Compared publicly delivered Krillion HTML, public CSS, active browser animations and screenshots against Sidequest Deep Dive at matching 1440×900 desktop and 390×844 mobile sizes, using Chromium. Public code was inspected directly, including homepage ds-bob-l/ds-title-flicker, Puffer Party and ds-card-gone source CSS.

## Verified and corrected

- Source homepage runs 11 active CSS animations: 8 individually staggered 3.2-second title letter bobs (180ms stagger), a 5-second title flicker, a 2.6-second swimmer, and a 1.9-second Begin button bob. Sidequest now has the same 11 animation names and duration structure on tested desktop and mobile homepage views.
- Source Party runs 11: eight title letters, the selected avatar (not sleeping hero), and two CTA buttons. Sidequest now has the same set at both sizes; removed artificial bubble/reef loops and immobilized sleeping puffer hero.
- Home seasonal Krill original desktop x~868,y544 and mobile x~241,y543. Sidequest updated desktop x868,y544 and mobile x240,y542. Original home Party puffer x418,y603 at desktop; same asset and alignment updated.
- Original mobile Party sleeper x144,y186 about 101px and Sidequest now same. Selected avatar original y520, Sidequest y521 after moving mobile identity column. Original Party sprite is seasonal Halloween edition and is now selected in Sidequest.
- Gameplay surface KRILLION title was using a different 2.6s keyframe and now uses the source 5s container flicker and 3.2s eight-letter 180ms stagger.
- Browser-observed source question exit (on accepted answer) has 450ms delay PLUS 600ms ease-in ds-card-gone keyframe. Sidequest now matches both, correcting an earlier mistaken no-delay interpretation.
- First-answer start originally took ~3625ms on source; Sidequest overlong first-run 5200ms preview shortened to 3200ms plus browser/render overhead. Source timing remains subject to runtime variance.
- Independent Sidequest canvas water and foreground particle rendering remains in operation and is NOT exact source frame behavior.

## Visual bounds and limitations

Unsynchronized screenshots at 1440×900 reported RGB mean absolute difference homepage 12.56 / 255 and Party 25.67 / 255. This confirms residual mismatch; animation counts and selected geometric coincidences do NOT prove exact pixel parity. Source vs Sidequest question text differs intentionally. Remaining unresolved: all canvas frames/seeds, every gameplay outcome, results, settings/accounts/Friends, real multiplayer rooms and audio browser lifecycle, reduced-motion states and viewport permutations. This branch is not a certified line-by-line or frame-by-frame duplicate and should only be merged after full build and smoke QA.

Evidence retained on the authorized QA Mac in /tmp/kr-motion-*.json, /tmp/kr-motion-*.png and scripts /tmp/kr-motion-*.mjs; these ephemeral screenshots are not in the production package. Source styles: krillion.io/_next/static/chunks/1pp18n31ii136.css and 1vi73c022xus9.css (retrieved October 31). Regression checks: tests/deep-dive-motion-audit.test.ts.
