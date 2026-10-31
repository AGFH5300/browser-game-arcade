# Original Krillion public asset integrity check — October 31, 2026

The source website was visited with a browser on the homepage, navigation,
Wardrobe, Daily Dive first round, and Puffer Party. The browser captured
same-origin image and font network responses. Each response body was hashed
SHA-256; the local Sidequest deep-dive image/font files were hashed separately
and matched by bytes, not name or visual similarity.

**Result: all 20 of the 20 assets observed loading were byte-identical to
an existing Sidequest local file**. These include the source pixel font, the
Halloween Krill sprites, Puffer Party fish and reefs, sky/top/mid/trench
images, and other loaded tier icons.

Machine-readable exact source-path/local-path/bytes/hash pairs:
data/krillion-public-assets-20261031.json.

Permanent SHA-256 regression:
tests/krillion-source-asset-integrity.test.ts.

The scope is **only resources actually observed in this browser inspection**,
not every possible downloadable public asset or latent sprite sequence.
It does not establish animation timing, backend data, private matchmaking,
complete answered question bank, or pixel-perfect entire game frames.

The observed asset-copy gate PASS is independent of the strict
all-screen/all-state visual parity gate, which still FAILS.
