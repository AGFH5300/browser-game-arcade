# Game sources and verification

The original catalogue contains 26 locally hosted games. The classics update adds publisher-provided players and the MIT-licensed Stack original; collection membership is independent of engine technology. Game source and runtime assets are stored under `public/play/`; original arcade cover illustrations are under `public/covers/`; records are in `data/seed-games.json`.

## Simon Tatham’s Portable Puzzle Collection (24 games)

Games: Black Box, Bridges, Cube, Dominosa, Fifteen, Filling, Flip, Flood, Galaxies, Guess, Inertia, Keen, Light Up, Loopy, Magnets, Map, Mines, Mosaic, Net, Palisade, Pearl, Pegs, Range, and Rectangles.

Each game’s HTML page, JavaScript runtime, and WebAssembly binary was downloaded from the official collection’s JS directory. The page uses the corresponding adjacent `.js` and `.wasm` files, so the runtime has no third-party network dependency.

- Source directory: <https://www.chiark.greenend.org.uk/~sgtatham/puzzles/js/>
- Official license: <https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/licence.html>
- License: MIT; the collection source page identifies the MIT license. Copyright and permission text is retained in `public/play/LICENSE.txt`.
- Source version displayed by the official license page at time of retrieval: `20260923.616da16`.
- Individual pages retain each game's built-in rules and interaction instructions.

## 2048

- Source: <https://github.com/gabrielecirulli/2048>
- License: MIT, copyright 2014 Gabriele Cirulli. The full local game source and `LICENSE.txt` are included under `public/play/2048/`.
- Runtime CSS, fonts, and JavaScript are local.

## Hextris

- Source: <https://github.com/Hextris/hextris> (`gh-pages` source archive)
- License: GPL-3.0-or-later, copyright 2018 Logan Engstrom. This is not MIT. Its full `LICENSE.md`, game sources, vendor scripts, images, and fonts are included under `public/play/hextris/`.
- The remote advertising script, dynamically loaded analytics script, Google Fonts request, and remote high-score GET were removed. The game uses its bundled local fonts and local runtime dependencies. Social/store links remain in game-over/help content and require an explicit click; gameplay does not depend on them.

## CarlWalks collection research — 27 October 2026

| Title | Reference identity and engine | Legitimate source / decision |
| --- | --- | --- |
| PolyTrack | Kodub; WebGL/WebAssembly browser game, not SWF | Official terms https://www.kodub.com/terms/polytrack §4 prohibit official-source iframes and reuploads on competing game portals. Sidequest needs explicit Kodub/CrazyGames permission. No copy integrated. |
| Slope | Rob Kay / Y8; Unity WebGL | https://www.y8.com/games/slope exposes an add-to-website embed: https://y8.com/embed/slope. Use the publisher player unchanged, including branding/ads. |
| Moto X3M | MadPuffers; HTML5 browser edition distributed by Famobi | https://famobi.com/moto-x3m/ offers its game to web publishers; https://play.famobi.com/moto-x3m/A1000-11 is the publisher’s actual playable entry point (the shorter URL is only a landing screen). Preserve branding and publisher content. |
| Crossy Road | Hipster Whale; HTML5 browser version with Poki SDK | https://poki.com/en/g/crossy-road identifies a Poki-exclusive browser edition. No permission for a Sidequest iframe/rehost found. Need Hipster Whale/Poki distribution permission. |
| Five Nights at Freddy’s | CarlWalks credits gustacraft123; TurboWarp-packaged fan recreation | https://carlwalks.com/flash/fnaf/ is not proof of redistribution rights. Exact source project and asset licensing remain unverified. Need creator/source verification plus appropriate FNAF asset permissions; no substitute integrated. |
| Moto X3M 2 | MadPuffers; HTML5/EaselJS/Nape | https://www.y8.com/games/moto_x3m_2 supplies https://y8.com/embed/moto_x3m_2. No binaries copied. |
| Hextris | Original Hextris JavaScript/Canvas | Existing GPL game retained as one record in both collections; see original source and GPL notice below. |
| Stack | CarlWalks incorrectly credits Playcalm; its Three.js/TweenMax game matches Steve Gardner’s Tower Blocks structure, wording, controls and logic | Original https://codepen.io/ste-vg/pen/ppLQNW includes explicit MIT notice in rendered source. Original game source and notice retained under public/play/stack. Three.js r83 MIT and GSAP 1.20.3 use upstream CDN files. Playcalm’s unrelated PlayCanvas Stack Mania is not substituted. |
| Moto X3M 3 | MadPuffers; HTML5 browser game | https://www.y8.com/games/moto_x3m_3 supplies https://y8.com/embed/moto_x3m_3. CarlWalks wrapper has a malformed iframe, so the independent publisher player is used. |

Reference catalogue: https://www.carlwalks.com/flash/ . Individual reference pages: polytrack, moto-x3m, slope, crossy-road, fnaf, moto-x3m2, hextris, stack, moto-x3m3 under /flash/. Technical runtime and detailed remaining-title research are in docs/CARLWALKS_RESEARCH_REMAINING.md. Public publisher embed grants are used instead of copying mirrored proprietary assets. Runtime results and any provider-specific limits are recorded in TESTING.md.

Publisher players contact their providers after the player is started. Privacy/advertising disclosures precede launch. Only the four exact reviewed publisher URLs receive their required same-origin/popup/form permissions; local game frames remain isolated. This does not grant those providers access to the Sidequest origin.

## Verification performed

- Downloaded assets were checked for non-empty content; each Tatham WebAssembly file begins with the WASM magic bytes and each HTML page is non-empty HTML.
- All 26 seed game URLs resolve to files in `public/`; every Tatham game has its matching HTML, JS, and WASM files.
- Catalog entries include source URL, license, controls, instructions, unique slug, cover path, and display order.
- All 26 game pages and their referenced local HTML assets were served from a local HTTP server successfully (198 requests); Tatham JS/WASM files and signatures were verified. No browser-based gameplay test has been performed; parent integration is expected to perform that check in the application iframe.

## Final integrated browser verification

All 26 frames rendered on the deployed Vercel preview on 27 October 2026. All 24 puzzles generated boards and responded to New game (Pegs has a deterministic default layout). In-board input and Undo were checked in Fifteen, Net, Black Box and Filling. 2048 keyboard movement/restart and Hextris launch/rotation/pause were checked. These are runtime/input smoke tests rather than full game completions; raw evidence is under `docs/verification/`.

Sidequest adapters: each entry includes `arcade-bridge.js` for focus/keypress/error handling. Puzzle canvases are fitted only after WebAssembly initialization, with shared `puzzles.css` layout. 2048 has compact embed styling and no false official-host claim. Hextris uses session-only isolated storage; both dynamic Google Analytics loaders were removed. Browser games run in opaque-origin frames, so persistent preferences/progress are not guaranteed.
