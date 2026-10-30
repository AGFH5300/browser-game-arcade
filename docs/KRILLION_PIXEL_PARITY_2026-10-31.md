# Krillion screenshot parity — measured pass, 31 October 2026

**Verdict: NOT pixel-perfect yet.** This branch contains targeted corrections; it is not merged/deployed. Previous production is unaffected.

## Evidence / method

Headless Chromium, device scale 1, identical 1440×900 and 390×844 viewports. Reference screenshots captured directly from krillion.io; local Sidequest page rendered from the branch. Both DOM geometry and PNG pixels were compared. Animated frames cannot be expected to match unless motion is synchronized, so RGB MAE is a diagnostic rather than a pass certificate.

### Mobile screenshot pixel differences (390×844)

| Screen | Baseline mean absolute channel error /255 | After screenshot-calibrated correction /255 |
| --- | ---: | ---: |
| Daily landing | 71.7 | **18.29** |
| Puffer Party lobby | 33.2 | **26.64** |

On the corrected daily landing, 49.84% of pixels fall within 12/255 of the original across all RGB channels. The corrected mobile waterline is y≈479 (original y≈479), and the original and revised Puffer Party identity panel both start at **y≈369**. The local Party Play Now panel starts y≈626 and the original y≈627. These figures measure only static frames.

### Desktop gameplay, accepted answer

Captured original 30 Oct first-round prompt, `Gymnastics`; compared against local representative 31 Oct first-round prompt `Hindi`. Both accept a common answer, show **Plankton**, **+10 points**, **100m**, and a Descend button. These are *different questions*, so a pixel score across these screenshots would be misleading.

New fixes:
- Remove the prompt card during answer reveal (previously overlapped the tier banner).
- Feed world y coordinate into `--y` (the prior inline `top` was overridden by `!important` CSS).
- Shift the reveal tier banner about 85 px upward toward the reference placement.
- Fade the answer chip so it does not obscure the centered tier name.
- Replace decorative/cloudy first-round sky and dark reef with source-observed pale sky and ocean column.
- Render pixel boat independently from the sky bitmap, using the existing vector artwork; re-enable it despite an older global hide rule.
- Avoid a spurious two-step correction when the entered answer and canonical answer are already identical.

A local Chromium run after these fixes verified an accepted answer, feedback state, **zero question cards**, reveal bounding rectangle y≈253, and zero page errors.

### Other corrections
- Mobile Daily intro sky/water split, title position, large controls and bottom navigation.
- Mobile Party reef geometry, interactive panels, nickname prompt and displayed initial rating.
- Friends/account guest column alignment (while retaining independent Sidequest credentials).

### Outstanding before anyone can claim “pixel-perfect”
1. **Original vs Sidequest same-frame comparisons for all seven gameplay rounds**: countdown, input, rejected answer, accepted answer, tierline/coin descent, prompt change, misses, results. Confirm movement, pause positions and easing frame by frame.
2. **Remaining pixel deltas**: background sea textures, fish positions, HUD icons, type metrics and desktop Party panel elements. The current mobile home MAE 18.29/255 and Party 26.64/255 prove further work remains.
3. **All menu states**: Settings, How to Play, daily results, free themed starters, guest Friends/Account, logged-in Friends/Account, Unlocks, Party host/join/rated/waiting/match/results; inspect modal and focus states.
4. **Sound event timing**: matching synthesis recipes is not enough to prove audible output and timing parity.
5. **Mobile responsive visual inspection and accessibility** beyond the tested 390×844 viewport.
6. **Nonvisual original features intentionally excluded** by the user (published question bank/scoring, paid Archive and purchases); Sidequest independent accounts/Party backend will not be identical to the publisher's servers.

## Safety / release
All work lives on `feature/krillion-pixel-parity-20261031`; tests use local rendering. Do not deploy an “exact replica” claim based on these findings. Original authenticated states and full results run have not been captured to equivalent fidelity.

## Revalidated follow-up, 31 October 2026 (second parity pass)

The first audit's incomplete-results limitation is **superseded**: the original production website was played through all **seven rounds** in desktop Chromium (7/7) to its complete results screen, and the original result layout was also captured at **390×844**. The independent Sidequest build completed all **seven rounds** to results at both desktop and mobile viewports, with **zero browser JavaScript errors** in the runs. The mock-backed authenticated account/Friends/ranked UI smoke test passed **24/24** desktop and mobile interactions.

Detailed first-round screenshot corrections (1440×900):
- Original live depth HUD and answer box were used for direct bounding-box alignment; the Sidequest answer field now begins **x=488, y=733**, width **444** and height **59**, versus approximately original **x=488, y=734**, width **445**, height **59**.
- The game sea's previous premature blackening around y≈560 was replaced by a gradient continuing to approximately y≈733, matching the reference first-round water depth. On left-side sample region x=35..175, the image error averaged **36.42→6.98/255** across y=380..725.
- Original sky was calibrated across ten gradient candidates. Best tested sky has 98.0% of pixels within ±12 RGB channel values of a 1440×900 reference sample region (x=35..175, y=0..205). Animated weather/particle variations remain separate.
- The original pixel fish shape uses dark ellipses and triangular tails, not the old blocky silhouettes. The independent canvas renderer now uses that shape and the original source client's near-surface nine-fish motion formula, retaining separate independent background fish.
- The original water surface's two-sine wave motion was reconstructed, and the newly exposed pale band during a camera descent was eliminated.
- Ruler marks now run through the full **7,400m** world with the current-depth pink YOU indicator; previously the ruler was absent from initial gameplay DOM.
- Position and size of the ocean boat, mascot and HUD boxes were adjusted against reference captures.
- The answer reveal no longer retains the prompt card or puts the mascot over the tier title. Its icon, tier name, answer, points, explanation and Descend button have separately calibrated vertical offsets.

Original mobile completed-results reference at 390×844 was compared against Sidequest: previous waterline y≈465 vs original y≈495, prior large ghost logo too small and low, and Bearing table ~90px early. After correction Sidequest waterline ≈494 and Bearing header ≈658, versus original ≈495 and ≈662. The private/publisher-specific probability distribution remains **intentionally unavailable** rather than inventing global player data.

**No exact-pixel certificate:** the reference animations generate time-dependent/random content. An original-to-original capture also changes pixels unless clock and random seeds are frozen. The original worldwide percentage curve, live player count, paid questions, account provider, archive paywall and publisher matchmaking are different or excluded by explicit project scope. The objective here is to match controllable visual geometry and motion without fabricating unavailable stats or silently substituting the original backend.

**Release verification:** every intermediate branch version must pass the existing unit/regression and syntax checks; the final merge is separate from this report. Release must not be represented as a 1:1, pixel-perfect copy without additional matching evidence.


## Third pass: source canvas + HUD, 31 October 2026

- The source first-round scene was verified to paint the boat **inside its ocean canvas**, not as a DOM SVG. Replacing Sidequest's independent SVG approximation with a transparent sprite isolated from the public screenshot improved the 165×92 pixel crop at 1440×900: mean RGB difference **38.40 → 8.72/255**, and within-12-channel pixels **59.82% → 79.18%**. The asset is embedded in `reference-boat-sprite-20261031.css`; mobile still uses the vector because the 390px source frame has not been independently matched.
- Controlled HUD comparisons with identical source and local viewports found original HUD top **y=0** vs earlier local **y=9**, original question top **y=213** vs local **y=207**. The corrected Chromium DOM measurements now agree at **HUD y=0, depth pod y=8, question y=213**.
- The active-gameplay utility bar now shows Sound only, matching the source; Settings and Merch remain accessible on non-game screens.
- Eliminating the previous blue embossed frame around the gameplay HUD decreased measured mean RGB error in the 721×86 top-HUD crop **18.07 → 15.25/255**. The tested variant uses flat ink-blue pods rather than a double outline.
- An API-slow startup check exposed a prolonged boot screen; the validated local question bank now renders the first screen within a short fixed timeout while optional remote source requests finish. No source data is invented.
- Desktop and 390×844 mobile simulated **seven-round end-to-end gameplay flows both reached results with zero page exceptions** when the remote daily API was deliberately unavailable; this validates offline fallback mechanics, not any third-party scoring equivalence.
- The original first-round sea is a dynamic `canvas.ds-sea` and the independent Sidequest uses a `canvas.dd-reference-sea-canvas`. Exact animations still require frozen time/seed and side-by-side keyframe instrumentation to produce an objective pass certificate.

**Status:** materially closer in measured regions; still **not** globally pixel-perfect or animation-perfect. Preserve the draft PR until all required screens and transitions are checked.
