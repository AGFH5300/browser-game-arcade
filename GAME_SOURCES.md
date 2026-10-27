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

## Verification performed

- Downloaded assets were checked for non-empty content; each Tatham WebAssembly file begins with the WASM magic bytes and each HTML page is non-empty HTML.
- All 26 seed game URLs resolve to files in `public/`; every Tatham game has its matching HTML, JS, and WASM files.
- Catalog entries include source URL, license, controls, instructions, unique slug, cover path, and display order.
- All 26 game pages and their referenced local HTML assets were served from a local HTTP server successfully (198 requests); Tatham JS/WASM files and signatures were verified. No browser-based gameplay test has been performed; parent integration is expected to perform that check in the application iframe.
