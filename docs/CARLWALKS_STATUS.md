# Required collection status — 27 October 2026

| Game | Integration | Gameplay verification | Desktop | Mobile | Source / blocker |
| --- | --- | --- | --- | --- | --- |
| PolyTrack | No | Not tested | — | — | Kodub terms prohibit official iframe and competing-portal reuploads; explicit permission needed. |
| Moto X3M | Official external launch | Publisher menu, level 1 and Up-key movement verified | Yes at publisher | Publisher supports; device untested | Famobi official help requires per-publisher iframe activation. Sidequest does not bypass it. |
| Slope | Y8 iframe | Provider document/assets reached; gameplay NOT verified: cloud browser has no WebGL | WebGL required | Publisher supports; device untested | Y8 supplied embed; WebGL preflight message replaces indefinite loading in unsupported browsers. |
| Crossy Road | No | Not tested | — | — | Hipster Whale/Poki exclusive browser edition; no distribution grant located. |
| FNAF | No | Not tested | — | — | Exact gustacraft123 TurboWarp source and FNAF asset rights unresolved. |
| Moto X3M 2 | Y8 iframe | Provider engine reached; gameplay NOT verified: no WebGL | WebGL required | Keyboard/mouse listing | Y8 supplied embed; browser-capable gameplay certification remains outstanding. |
| Hextris | Existing local GPL game, one record | Prior full runtime/input smoke; retained engine and sandbox | Yes | Touch supported; device untested in update | Original Hextris GPL source. |
| Stack | Local MIT original | Canvas fallback renders; Start, Space placement/game-over and reload verified | Yes | Pointer input implemented; device untested | Steve Gardner Tower Blocks; original source and upstream Three.js notices retained. |
| Moto X3M 3 | Y8 iframe | Provider engine reached; gameplay NOT verified: no WebGL | WebGL required | Keyboard/mouse listing | Y8 supplied embed; browser-capable gameplay certification remains outstanding. |

No loading-screen observation is counted as successful gameplay. Original 26-game assets were retained. Sources, exact reference identities and permissions are detailed in ../GAME_SOURCES.md and CARLWALKS_RESEARCH_REMAINING.md.

Y8 SDKs emitted an additional document.domain sandbox warning during their no-WebGL startup. Its effect on optional account/highscore features remains unverified. Local games keep their existing opaque-origin isolation. No publisher files, ads, SDKs or restrictions were stripped.
