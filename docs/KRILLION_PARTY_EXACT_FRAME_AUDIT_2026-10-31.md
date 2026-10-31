# Krillion: reproducible strict-frame parity audit

Source: live public Krillion website and Puffer Party on 31 October 2026.
Candidate: independent Sidequest implementation.

## Three different parity tests

1. Original private backend identity: not the stated release model and not
   certified. Sidequest intentionally has its own accounts, public rooms,
   matchmaking, answer bank, audience distribution and purchased content.
2. Browser rendering behavior: source geometry and animation equations can be
   compared with the original publicly delivered browser code and improved.
3. Strict frame equality: literally identical RGB pixels at every pixel of
   screenshots with the same viewport, same browser, synchronized animation
   start times, random seeds, room data, fonts, game state and other inputs.
   This has NOT been established.

Repeatable strict pixel comparator (no masks or similarity thresholds):

    node scripts/krillion-compare-frames.mjs original.png candidate.png

A single differing channel means FAIL (exit code 2). The --report-only
option returns statistics without failing the caller. Masked or approximate
comparisons must never be labeled exactly 1:1.

## Observations

On 1440x900 and 390x844 screenshots from different live browser sessions,
the original Puffer Party compared with itself has channel MAEs of
1.58/255 desktop and 2.30/255 mobile. Even two copies of the ORIGINAL
site only matched 93.99% and 90.05% of the exact RGB pixels. Independent
randomized snow, changing bubbles, live rooms, and animation time mean
unsynchronized screenshots cannot be required to have zero differences.

Before the source CRT and panel corrections, original vs independent
Sidequest Puffer Party was about 10.9/255 desktop, 18.03/255 mobile.
Replicating the original vignette, CRT overlay, panel colors, shadows,
mobile logo font and text spacing improved local full-frame MAE to
about 7.3/255 desktop and 13.3/255 mobile, with timing-dependent variance.
A separate capture after adding source-like snow and bubble particles
measured 7.58/255 desktop and 13.64/255 mobile, with 33.36% and 17.63%
exact pixels. This is NOT an exact-pixel match.

Byte-for-byte original assets verified with SHA-256:
- Desktop reef SHA-256: 5a77633c5974a91698b63bdcb80bf0da62b17068d4b51f91dd2d2158ef3f8b77
- Mobile reef SHA-256: b14a8f1e97bcc5f9f41656d5a5bd561908a29d1f338582585c44dcb3462f00f3
- Sleeping puffer SHA-256: 4a57901e6362a4404abcf05485d3b23d6f969110a98b5ddcfbc2998328d13f97

## Original Party browser-renderer reconstruction

The original publicly served client at
https://krillion.io/_next/static/chunks/411g_qifdhu85.js
draws two distinct canvas layers: ds-sea and ds-fore. Prior Sidequest
Party had neither; identical counts of 11 CSS animations did NOT establish
total animation equivalence.

Reconstructed these source-observed algorithms:
- Snow count round(width*height/(mobile?4200:7000)): 78 mobile and 185
  desktop at the tested sizes.
- Snow alpha .12-.42, downward drift 4-12 px/s, horizontal motion
  3*sin(.5*time+phase)*dt and pixel-aligned two-pixel rendering.
- Sparse 1-3 fish schools moving left/right and foreground bubbles
  emitted every 0.35-0.9 seconds, with drag, floating and fade.
- Sleeping sprite motion y = 2*sin(.72*t)+.8*sin(1.45*t);
  target rotation = -.1+.025*sin(.72*t), relative scale ~0.90.
- Sleep-text sequence z / z z / z z z, with .45*t mod 1, 24px VT323,
  .4+.5*sin(phase*pi) alpha and original relative position.
- Original alpha and z-order for vignette (.55), CRT scanlines (.45),
  Party panels and background field.

Targeted desktop/mobile browser tests confirmed 185/78 live particles,
separate sea/foreground canvases, changing sleep text and transforms,
and no JS exceptions. The reproducible strict comparator still FAILS.

## Outstanding limits

Publisher server rooms, matchmaking, score distributions, private effects
and account data remain independent. Randomized frame-by-frame positions
cannot be exactly compared without the same seed and synchronized clock.
Remaining page typography/panel details, dynamic gameplay and results
screens have NOT passed strict all-screen 1:1 checks.

No global pixel-perfect / binary-equivalent certification is issued.

## Extended screen-state matrix, 31 October 2026

The source website and live Sidequest preview were captured with matching
viewport sizes and device pixel ratios, seeded Math.random where possible,
paused CSS animation timelines and isolated browser sessions. The matrix
covers home, menu, Settings, Wardrobe, Party, Unlimited, Account and Friends
at 1440x900 and 390x844. See scripts/krillion-live-visual-matrix.mjs.
Set KRILLION_PLAYWRIGHT_MODULE and KRILLION_CHROMIUM_EXECUTABLE if Playwright
is not installed within the repo, and KRILLION_CANDIDATE_URL for a preview.
Use KRILLION_NO_SEED=1 when testing startup without RNG interception.
KRILLION_SCENARIOS and KRILLION_VIEWPORTS select individual tests.

A false positive was found: an original mobile menu click during hydration
could screenshot the homepage while comparing to Sidequest's open menu.
The original SiteMenu does not expose the anticipated visible role=dialog;
it sets aria-expanded=true on its menu trigger. The harness now requires
that state and the open-menu content. Invalid captures must not count.

Verified mobile menu measured ~9.76/255 before correcting original menu
panel width, title spacing, scanline overlay, 52x52 puffer icon, and close
button; ~8.08/255 afterward. Desktop menu moved ~5.79 to ~5.72/255.

Seeding Math.random is NOT enough to synchronize different applications'
RNG consumption, asynchronous requests, canvas clocks, animation starts or
publisher-controlled data. Pausing CSS animations does not pause canvas
requestAnimationFrame loops. These tests catch false comparisons, but do
not establish deterministic pixel-perfect parity. The exact-all-screen
acceptance requirement remains FAIL, and the threshold is not weakened.

## Game-stage HUD and answer-dock geometry

A second direct source-client inspection at 390x844 and 1440x900
revealed invariant layout differences beyond individual animations.
Original ds-root is fixed at 794px tall on a mobile 844px viewport and
810px tall on desktop 900px, reserving 50px / 90px outside play area.
Sidequest had filled the whole viewport and applied an unrelated 300ms
CSS appear animation to the entire game screen. The dock was additionally
displaced 11px mobile / 58px desktop by older CSS overrides.

The reconstructed game screen now:
- Disables the non-original whole-screen appear animation;
- Uses source stage heights and dock at the stage edge;
- Uses exact original stair-step ds-px polygon for HUD pods;
- Matches HUD pod positions and heights at both viewport sizes;
- Uses 58x58 sonar, x80 mobile input with height 53px and source font 22px;
- Restores original prompt label/hint font metrics and variable card height;
- Aligns world anchor, dock and responsive controls.

Measured after changes at mobile 390px: play area [0,0,390,794],
HUD [0,0,390,59], pods x10/x294, dock [0,714,390,80],
sonar [12,724,58,58]. Desktop 1440px: play area
[0,0,1440,810], HUD [360,0,720,72], dock y723 height87.

Original and clone ran 30 phase captures each across seven rounds
at both desktop and mobile (4 runs, 120 screenshots) with zero
browser JS errors. Different live daily prompt content and
independent backend distributions prevent literal global pixel match.
Sampled dock-region MAE fell 23.84 to 13.61/255 mobile and
11.08 to 8.66/255 desktop; desktop HUD-region MAE fell 18.35
to 11.66/255. These are unsynchronized diagnostic captures, NOT
a canonical deterministic PASS.

Original results include live publisher player-distribution statistics;
Sidequest intentionally labels them unavailable without its own data.
Do not fabricate statistics merely to align graph pixels.

**Overall exact 1:1 status remains FAIL.** No certification of
all-screens, all-animations, all-interactions pixel equality issued.

## Byte-for-byte source asset inventory

A 31 October headless browser inspected the source homepage, Wardrobe,
Daily Dive and Puffer Party. All 20 image/font responses observed from
the original website matched at least one Sidequest asset byte-for-byte
by SHA-256. See data/krillion-public-assets-20261031.json and the
automated test in tests/krillion-source-asset-integrity.test.ts.
20/20 means observed asset integrity PASS, not that the unobserved
assets or all source animation frames have passed global parity.
\nFive additional public source client code image URLs were separately fetched\nand matched byte-for-byte, bringing total validated public files to 25;\nthis still does not prove exhaustive hidden sprite or animation parity.\n
## First-answer CSS animation inventory (live browser)

At 390px the original source had 13 active browser animations including a
two-second one-shot vignette Web Animation, eight floating title letters,
a title flicker, 1.4s current-round dot pulse, 2.6s mascot swim and
2.4s sonar sweep. Sidequest had an unintended 4s boatBob animation and
omitted the mobile current dot pulse; its sonar used a separate clone
keyframe name. The extra boat animation was removed and the original
dot pulse / ds-sweep-spin were restored on both responsive viewports.
The separate publisher Web Animations API vignette transition has been
measured (.259632 to .297 opacity over 2s, ease) but not certified as
frame-identical in the independent renderer. Strict exactness still FAILS.

The independent first-round vignette WAAPI transition was then implemented
with the source-observed .259632 to .297 opacity, 2000ms ease and backwards
fill, scoped only to the first answering phase. The visible animation
inventory now includes the same separately timed overlay in addition to
the original 12 CSS animations. Matching inventories still does NOT prove
exact per-frame canvas, text or backend state equality.

## Original-root fixed viewport and equal-prompt layout audit (Nov 1, 2026)

A direct 1440x900/390x844 source inspection found an important
false-parity regression: answer-input autofocus scrolled Sidequest's
relative gameplay screen hundreds of pixels above the viewport while
the original ds-root remained fixed. Sidequest now keeps the active
ocean stage fixed (excluding the independently scrollable results
screen), and body overflow is locked only during active game phases.

The source desktop scene uses a **1080px centered world/foreground**
within a full-bleed sea canvas. Sidequest previously distributed its
creatures across the entire 1440px desktop canvas. The independent
source-world coordinate system is now 1080px centered and the original
foreground canvas is the same width and position; sea remains full bleed.
Its existing 26-particle foreground renderer was discovered and reused;
an attempted duplicate third layer was reverted before commit.

The comparison harness scripts/krillion-equal-prompt-geometry.mjs
temporarily injects the original game's visible first prompt **only into
the candidate browser DOM**, not the stored independent question bank.
It verifies source/local card dimensions, world geometry, scroll
position and absence of JS page errors at 390x844 and 1440x900.

Source versus candidate:
- Mobile 390px: card x/width identical; height differs 0.01px; y 2.94px
  higher on candidate at unsynchronized camera sampling.
- Desktop 1440px: card x, width and height identical; y 1.49px higher.
- Both browser dimensions: body scroll y=0; no JS page errors.

Previous 1px per-glyph independent clone tracking caused a source
one-line prompt to wrap into two desktop lines. Restoring normal
source tracking and removing the invented child-only fade-in fixed
that; the original parent ds-card-in remains.

**Narrow prompt geometry and fixed stage gate PASS; full pixel-accurate
animation/rendering remains FAIL.** Uncontrolled random visual seeds,
independent result data, and time-varying canvas frames still differ.
Do not infer an all-screen 1:1 result.
