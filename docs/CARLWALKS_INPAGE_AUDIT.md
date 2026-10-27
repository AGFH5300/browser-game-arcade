# CarlWalks standalone game-player integration — 27 October 2026

The user has affirmed permission to use the specified game content. This implementation selects fixed original CarlWalks standalone engine pages rather than Famobi landing links or Y8 iframe wrappers.

## Verified source structure

| Title | Runtime source | HTTP status | Delivery |
|---|---|---:|---|
| PolyTrack | /build_engine/root/polytrack-0.3.1/index.html | 200 | CarlWalks standalone iframe |
| Moto X3M | /build_engine/root/moto-x3m/index.html | 200 | CarlWalks standalone iframe |
| Slope | /build_engine/root/slope/index.html | 200 | CarlWalks standalone iframe; WebGL |
| Crossy Road | /build_engine/root/crossy-road/index.html | 200 | CarlWalks standalone iframe; third-party Poki SDK assets may be required |
| gustacraft123 FNAF | /build_engine/root/fnaf/index.html | 200 | CarlWalks TurboWarp standalone iframe; HTML package ~60MB |
| Moto X3M 2 | /build_engine/root/moto-x3m-2/index.html | 200 | CarlWalks HTML5 game iframe |
| Moto X3M 3 | /build_engine/root/moto-x3m-3/index.html | 200 | CarlWalks HTML5 game iframe |
| Hextris | /play/hextris/index.html | 200, existing | Sidequest self-hosted |
| Stack | /play/stack/index.html | 200, existing | Sidequest self-hosted |

All seven remote game entry pages returned HTTP 200 at source inspection. The responses checked did not advertise X-Frame-Options or CSP frame-ancestors headers. This is not a claim that every iframe executes to a playable state on every browser.

## Implementation

- `lib/classic-sources.ts` holds an exact allowlist; `lib/db.ts` maps existing game records to original runtime paths without resetting game identifiers, metrics or other data.
- `lib/embeds.ts` gives only those original exact URLs the cross-origin publisher iframe sandbox needed for scripts/HTML5 asset access. Unapproved URL variants remain isolated.
- `data/seed-games.json` is updated to 9 classics, retaining all 26 original HTML5/puzzles.
- Neon added three previously missing original entries with `INSERT ... ON CONFLICT DO NOTHING`: PolyTrack, Crossy Road and FNAF. No existing rows were overwritten.
- The former Moto X3M `Play at Famobi` outbound CTA is no longer the primary launch. Clicking Play now launches the selected game frame on Sidequest.
- Games using WebGL are permitted to attempt playback, with an honest warning on unsupported browsers.

## Important unresolved checks

1. **Real gameplay**: HTTP 200 and a rendering iframe do not certify that the game menus and controls work. The cloud browser used earlier reported no WebGL and the current browser automation is credit-limited. Test all nine in a real WebGL-capable browser, particularly original game loader quirks.
2. **Audio**: the Sidequest sound bridge works for its own local games; a direct remote iframe remains cross-origin and cannot be universally muted by the parent. Achieving independent mute for all nine requires publisher-supplied audio APIs or owner-authorized self-hosting of the original runtime assets with an integrated audio bridge.
3. **Network filtering**: these game assets are currently delivered from `carlwalks.com`; a managed network that blocks the domain will also block these runtime assets. Do not evade managed-network restrictions. An authorized deployment and network allowlist are legitimate options.
4. **Large download**: FNAF's TurboWarp HTML entry is around 60MB. It must be verified on slower connections and phones, and asset hosting/caching optimized later.
5. **External SDKs**: Crossy Road's source includes Poki SDK resources, which may still apply publisher/platform constraints. Verify its actual runtime on Sidequest before treating it as gameplay certified.

This release changes the embedded player paths, not the whole site. No agents were delegated.
