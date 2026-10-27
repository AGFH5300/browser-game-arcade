# CarlWalks research: five remaining titles

Research date: 2026-10-27. Scope: Crossy Road, the gustacraft123 FNAF package, Moto X3M 2, Moto X3M 3, and Stack labeled Playcalm. Read-only research; no game binaries copied or game sources integrated. Page content was retrieved using Firecrawl and web search. Runtime observations supplied by the parent inspection are distinguished below.

## Integration decisions

| CarlWalks title | Identity | Decision | Candidate / blocker |
| --- | --- | --- | --- |
| Crossy Road | Hipster Whale; Poki browser edition | Blocked for embedded play; official external play link available | https://poki.com/en/g/crossy-road. Poki identifies its browser game as exclusive; no public third-party embed authorization found. |
| Five Nights at Freddy's | Fan recreation credited to gustacraft123; packaged with TurboWarp | Blocked | Exact original shared project, its license and the package's relationship to that project remain unverified. TurboWarp runtime licensing does not itself license a bundled project or FNAF assets. |
| Moto X3M 2 | Mad Puffers, published/distributed on Y8 | Publisher iframe available | https://y8.com/embed/moto_x3m_2; supplied by Y8 on this game's page, 900 × 600. Preserve provider player/branding. |
| Moto X3M 3 | Mad Puffers, published/distributed on Y8 | Publisher iframe available | https://y8.com/embed/moto_x3m_3; supplied by Y8 on this game's page, 800 × 600. Preserve provider player/branding. |
| Stack, labeled Playcalm | Attribution conflict: CarlWalks runtime resembles Steve Gardner's Tower Blocks; official Playcalm Stack Mania uses another engine | Exact requested identity unresolved; licensed original candidate found | Steve Gardner's original public CodePen: https://codepen.io/steveg3003/pen/ppLQNW. Public Pens are MIT licensed. Use only after confirming this is the desired variant, retaining author/copyright/license and reviewing dependency notices. Playcalm's own game requires a licensing agreement. |

## Crossy Road evidence

- CarlWalks listing: https://carlwalks.com/flash/crossy-road/ ; engine URL inspected by parent: https://carlwalks.com/build_engine/root/crossy-road/index.html. Parent observed PokiSDK JavaScript.
- Official game listing https://poki.com/en/g/crossy-road credits Hipster Whale and describes this as a Poki-exclusive browser game. This verifies a legitimate play destination, not a redistribution license.
- Official franchise press kit https://www.crossyroad.com/crossy-road-classic-press-kit identifies Hipster Whale as publisher and Matt Hall, Andy Sum and Ben Weatherall as developers of the original.
- Poki's own rules https://poki.com/en/c/terms-of-use reserve permission over use of game content. No title-specific third-party embedding grant was located. An accessible CarlWalks package or Poki CDN file is not evidence of such permission.
- Required next evidence for embedded play: Hipster Whale/Poki authorization or a publisher-provided Crossy Road distribution entry that expressly permits this domain/use. External linking can use the official Poki page now.

## Five Nights at Freddy's evidence

- CarlWalks listing https://carlwalks.com/flash/fnaf/ explicitly titles the game Five Nights at Freddy's and credits gustacraft123. Engine URL from parent: https://carlwalks.com/build_engine/root/fnaf/index.html. Parent inspection identified TurboWarp packaging.
- Live Firecrawl render of the CarlWalks listing failed with a geometry error (`numComponents 2 not correct for length 1`), so availability of that wrapper is not proof of a functional integration.
- Creator's primary profile https://scratch.mit.edu/users/gustacraft123/ says they prefer to make projects on TurboWarp and discusses work on FNAF 2. The currently exposed 16 shared projects on that profile did not include the requested FNAF project. A query for a matching primary project did not establish an exact project ID.
- Secondary search results suggested older FNAF projects by this author are now unshared; this was used only as a locator clue, not a rights conclusion.
- Exact blocker: there is no verified primary project URL and license chain connecting the CarlWalks packaged game, author contributions, and underlying FNAF audiovisual content. Do not substitute the commercial FNAF game or a different fan recreation silently. Need the exact author's source/release permission and sufficient rights for included assets, or an authorized hosted embed for that specific build. No credentials or external messages were used.

## Moto X3M 2 and Moto X3M 3 evidence

- CarlWalks listings: https://carlwalks.com/flash/moto-x3m2/ and https://carlwalks.com/flash/moto-x3m3/ . Parent observed EaselJS/Nape JavaScript in Moto2, and a malformed iframe with a URL in `class` but no `src` in Moto3. These observations do not affect the independent publisher route.
- Primary distributor pages https://www.y8.com/games/moto_x3m_2 and https://www.y8.com/games/moto_x3m_3 both credit Mad Puffers and expose an explicit add-to-your-web-page section. Their retrieved HTML contains `textarea#embed-text` with these exact iframe sources:

```html
<iframe src="https://y8.com/embed/moto_x3m_2" scrolling="no" style="width: 900px; height: 600px; border: 0; margin: 0; padding: 0;"></iframe>
<iframe src="https://y8.com/embed/moto_x3m_3" scrolling="no" style="width: 800px; height: 600px; border: 0; margin: 0; padding: 0;"></iframe>
```

- Official distribution program https://www.y8.com/games_for_your_website offers Y8-developed/sponsored games to publishers. Title-specific supplied iframe code is the strongest evidence here; prefer it to copying CarlWalks or static2.y8.com assets.
- These iframe URLs are integration candidates with public provider authorization; an actual browser smoke test on the destination arcade remains necessary. Presence of embed code does not claim gameplay was tested here. Provider ads, consent UI, cookies, availability and player behavior remain under Y8 control.
- A CrazyGames listing https://www.crazygames.com/game/moto-x3m says versions 2 and 3 are unavailable there, but that portal-specific statement must not override Y8's current public title pages and embedding offer.

## Stack / Playcalm attribution conflict

- CarlWalks listing https://carlwalks.com/flash/stack/ says Stack by Playcalm. Its engine https://carlwalks.com/build_engine/root/stack/index.html loads `main.js`, `three.min.js` and `TweenMax.min.js`, and renders distinctive Tower Blocks instructions/end-screen wording.
- Official Playcalm catalog https://playcalm.co/ offers Stack Mania and explicitly offers licensing options for its prebuilt games through https://playcalm.co/#contact. It links demo https://playcalm.co/catalog/stackmania/ . That demo's HTML title is Stack Mania by PlayCalm and it loads PlayCanvas (`playcanvas-stable.min.js`, `__settings__.js`, `__modules__.js`). No free redistribution grant was found; a demo URL is not a publishing license.
- Primary CodePen newsletter https://codepen.io/team/codepen/pen/gojJPx (The CodePen Spark #59) names Steve Gardner and links Tower Blocks to https://codepen.io/steveg3003/pen/ppLQNW. Original public Pen was retrieved and contains the same distinctive instructions/end-screen wording and Three.js game structure. This strongly suggests the CarlWalks label is wrong, but the runtime was not byte-for-byte compared, so identity remains an inference.
- Official CodePen licensing documentation https://blog.codepen.io/documentation/licensing/ and terms https://blog.codepen.io/legal/terms-of-service/ state public Pens are MIT licensed. This provides an affirmative rights path for the original Tower Blocks source, with required notice retention, rather than copying a mislabeled mirror. External libraries are separate dependencies and need their own notices/terms.
- Do not label Steve Gardner's game Playcalm or claim Playcalm's license applies to it. Either verify the requested build as Tower Blocks and source it from the licensed original, or obtain a Playcalm license for its actual Stack Mania game. No license was purchased and no party was contacted.

## Stack implementation checkpoint

The saved original rendered source has an explicit MIT notice naming Steve Gardner. The reference is the transpiled form of the same Stage/Block/Game structure, instructions, scoring and Three.js/TweenMax mechanics. Sidequest uses the original author source, not CarlWalks code, and credits Steve Gardner. It retains the license, uses Three.js r83 and GSAP 1.20.3 from CDN, and removes the CodePen wrapper/advertising and optional author-avatar script. Byte identity is not claimed.
