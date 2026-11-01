# November 1, 2026: observed gameplay regressions

The user played Sidequest and reported six concrete issues. Each was reproduced
or audited against the publicly served original and fixed independently.

1. **Accepted answer text disappears mid-plunge.** An invented 1.7-second
   opacity fade hid the chip before landing. The accepted chip now remains
   visible and is removed at impact. Browser checks with "Yogurt" (Plankton)
   confirmed full opacity at 1,400ms, then no chip and a readable landed
   banner after impact at 390px and 1440px.

2. **Restrictive spotlight.** The old dark ring started at radius 66px and
   reached 96% darkness by 326px. New radial stops: transparent 170px,
   25% darkness 310px and 68% darkness 620px. Deep Cut "Natto" checks
   confirmed the gradient at both viewport sizes. This is a usability
   adjustment, not a strict source-frame certification.

3. **Duplicate boat.** Original first-answer state had zero independent
   boat DOM elements. Sidequest showed an extra surface SVG. Removed that
   SVG; browser count is now zero at both widths. The existing source-based
   canvas underwater ship remains.

4. **Shrimp mascot is not interactive / wrong reaction.** Original user poke
   triggers a 900ms, 720-degree ds-roll and a 1000ms ds-blub-up. The game
   mascot now supports click/Enter/Space, blub sound, visible gold 'blub!'
   and the source-named roll. Responsive mobile placement was corrected.
   Desktop/mobile browser click and keyboard semantics were verified.

5. **Timer fuse incorrectly positioned.** Original fuse is 4px high and
   starts 4px BELOW the input's bounding box. Candidate had it inside the
   text area. Placed it at bottom:-8px. Browser checks now measure the
   correct 4px displacement on both desktop and mobile.

6. **No-answer result overlaps previous prompt.** Delayed cleanup used the
   .dd-reveal-pending selector, which stopped matching when the 900ms
   timeout wrapper was cleared. Miss/timeout no longer retains the
   prompt at all. Cleanup is resilient to the wrapper state. Desktop/mobile
   skip and next-round flows show zero stale prompts; genuine simulated
   25-second timeout shows NOTHING LANDED and zero old prompts.

Verification: six focused regression tests, complete desktop and mobile
seven-round gameplay, mobile/desktop skip-next flows, actual simulated
timeouts, accepted-answer tier landing and Deep Cut spotlight. Primary test
file: tests/krillion-source-six-user-bugs.test.ts.

These fixes do not independently establish exact, globally pixel-perfect
1:1 identity. Other moving objects, random canvas frames, the full screen
matrix, all transitions and independent account/result state still require
separate strict tests. Do not weaken the acceptance threshold.
