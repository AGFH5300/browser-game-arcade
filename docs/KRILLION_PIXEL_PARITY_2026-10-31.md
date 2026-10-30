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
