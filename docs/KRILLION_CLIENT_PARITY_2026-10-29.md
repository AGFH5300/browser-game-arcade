# Public Krillion client parity - 29 October 2026

## Evidence

The user provided public Next.js server-rendered HTML with the publisher's hashed CSS, JS, font and image addresses. That page is not the private original Next.js project or its server-side code.

The publicly served original browser chunk /_next/static/chunks/1klevf566y93_.js (SHA-256 edd9f7d203ac3841e5f506863e02a20bef3a70b79e60cd4d0b0d2eba862eccf1) reveals the ds-stage DOM template, two canvas layers, progress HUD, gesture-based Web Audio, mascot settings and animation events. Previous PR #30 extracted 67 original keyframes from five source CSS chunks.

## Implemented

- Original-style KRILLION title with staggered per-letter animations, matching public browser screenshots.
- reference-sound.js: synthesized Web Audio using the public client's waveform/frequency patterns. All audio is created locally and starts only after user gesture. Events for accept/reject, score tiers, descent, miss, timer ticks, and surfacing.
- reference-interface.js: working sound toggle, local high-contrast and low-power options, optional rejection clearing, source mascot choices with local preferences, and tap interactions.
- reference-scene.js: custom two-dimensional canvas draws responsive water, fish, bubbles and moving particles; depth changes, dynamic rail, hidden tab/reduced-motion handling.
- reference-dom-parity.css: source-style positions for title, menu, ocean, score HUD, settings buttons, mascot and bottom action buttons. Public image assets used.
- Original-style floating score feedback replaces the oversized modal card. The final question displays DIVE COMPLETE and SURFACE; intermediate feedback displays DESCEND.
- Existing public Daily answer sheets and 105 historical archived seven-question dives preserved. Free starter modes preserved.

## Testing

Browser QA at 1440x900 and 390x844 checks title, canvas, sound control, settings, mascot, original Daily prompt and source answer acceptance. Separate seven-round Unlimited game verifies the source-backed question order, answer scores, DIVE COMPLETE, SURFACE and saved results. Local code checks, TypeScript, lint and full automated tests required before deployment.

## Honest remaining limitations

This is not a byte-identical clone of the original complete application. Account-based Friends, third-party account syncing, original rated matchmaking, proprietary scoring aliases and answer lists, unpublished server components, and pixel-exact renderer timing are not recovered. Publicly bundled frontend code does not by itself grant access to original private backend data or the source repository. This work uses no bypass of restrictions or protected paid endpoints.
