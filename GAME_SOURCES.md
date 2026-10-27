# Game sources and verification

The catalog contains 26 locally hosted, playable browser games. Game source and runtime assets are stored under `public/play/`; original arcade cover illustrations are under `public/covers/`; records are in `data/seed-games.json`.

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

## Excluded candidates

PolyTrack, Moto X3M, Slope, and similar commercial browser games were not included because I could not confirm redistribution permission for their game code and assets from a source license. They remain excluded unless their rights holders or a license provide clear permission.

## Verification performed

- Downloaded assets were checked for non-empty content; each Tatham WebAssembly file begins with the WASM magic bytes and each HTML page is non-empty HTML.
- All 26 seed game URLs resolve to files in `public/`; every Tatham game has its matching HTML, JS, and WASM files.
- Catalog entries include source URL, license, controls, instructions, unique slug, cover path, and display order.
- All 26 game pages and their referenced local HTML assets were served from a local HTTP server successfully (198 requests); Tatham JS/WASM files and signatures were verified. No browser-based gameplay test has been performed; parent integration is expected to perform that check in the application iframe.

## Final integrated browser verification

All 26 frames rendered on the deployed Vercel preview on 27 October 2026. All 24 puzzles generated boards and responded to New game (Pegs has a deterministic default layout). In-board input and Undo were checked in Fifteen, Net, Black Box and Filling. 2048 keyboard movement/restart and Hextris launch/rotation/pause were checked. These are runtime/input smoke tests rather than full game completions; raw evidence is under `docs/verification/`.

Sidequest adapters: each entry includes `arcade-bridge.js` for focus/keypress/error handling. Puzzle canvases are fitted only after WebAssembly initialization, with shared `puzzles.css` layout. 2048 has compact embed styling and no false official-host claim. Hextris uses session-only isolated storage; both dynamic Google Analytics loaders were removed. Browser games run in opaque-origin frames, so persistent preferences/progress are not guaranteed.
