# Historical archive — superseded original Sidequest prototype

> Historical record only. The former standalone prototype entry points index.html and index-arcade.html have been removed and their URLs redirect to index-public-art.html. Their UI must not be used for current QA. This document describes the original independent prototype, not the present source-based reconstruction. Its claims about not copying public visuals no longer describe the currently deployed game. The authored question bank remains in use by independently controlled Party and practice modes; removing it would break those functions.

# Deep Dive — Sidequest Original Trivia and Puffer Party

This is a new browser game built for Sidequest. Its original artwork, UI, software and starting question bank are not copied from any other game. The user reports the Krillion publisher granted permission; no proprietary question export was provided.

## Question and answers
The initial question bank has 90 originally written prompts across nine themes, with 1,034 recognized answer entries. Accepted answers use normalized aliases and conservative fuzzy matching for unique one- or two-character spelling errors. Ambiguous fuzzy matches are rejected; the curated set remains incomplete. Rarity is a fixed editorial approximation, not live player frequency. Unrecognized answers may be retried before the current timer runs out. Future work: import publisher-supplied permitted datasets, correct missing aliases, expand to thousands of questions.

## Solo modes
- Daily: seven seeded prompts per New York calendar day (midnight America/New_York, including DST), 25 seconds per prompt, one completed daily run per browser.
- Endless: seven shuffled questions per dive, always through all seven prompts; unlimited new dives.
- Archive: the preceding 30 New York-calendar puzzle dates can be replayed as Deep Dive practice using the local seeded bank. This is not the original Krillion historical archive and does not modify the daily streak.
- Worlds: nine themes, five replayable seven-question chapters each. Pearls and preceding-chapter completion unlock chapters. No purchases.
- Logbook and streak: browser-local statistics only.

## Puffer Party multiplayer
- Neon Postgres room table deep_dive_party_rooms. Six-character invite codes, public and private rooms, public room list, ready up, host start, two to eight players, chat, leave, and winner.
- Three starting hearts; 18s turn timer. Unrecognized guesses may be retried. The multiplayer backend now uses the same conservative typo matching as solo. Valid answers must not repeat for the current question. Missing a turn or passing loses one heart. Every 120 rarity points restores one heart (up to five). Last afloat wins.
- Server validates all answers and rare tiers and keeps player identity tokens secret. Room state is persisted in Neon; optimistic revision updates prevent lost concurrent writes. Browsers poll every 1.5s. Expired turns resolve on the next API read; rooms expire after 12h of inactivity.
- Casual, not esports-grade anti-cheat. Because the solo answer bank is public, player-side inspection can reveal answers. Real tournaments need protected server-only questions and additional anti-abuse controls.

## Storage and rights
Solo progression and unfinished game are in browser localStorage and are not shared across devices. Multiplayer session credentials stay in sessionStorage. The user-provided Reddit link could not be retrieved in available browsing and no quotes or comments were copied from it. Questions and rarity values from the original Krillion site were not bulk-extracted or represented as official.

## Runtime
- Historical game entrypoint: /play/deep-dive/index.html (retired; redirects to /play/deep-dive/index-public-art.html)
- Server: /api/deep-dive/party
- Party database table: public.deep_dive_party_rooms
- Exact local Deep Dive entrypoint has same-origin iframe privileges; this is not granted to untrusted game URLs.
- Validate two independent browsers joining the same room, simultaneous answer exclusivity, timeout, and winner before enabling public production listing.

## Database schema
CREATE TABLE IF NOT EXISTS public.deep_dive_party_rooms (
 room_code VARCHAR(6) PRIMARY KEY,
 state JSONB NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

## Pixel-art interface redesign (29 Oct 2026)
The original generic card/dashboard design was replaced with a complete ocean arcade skin inspired by the *genre* of pixel underwater trivia games. The implementation uses independently authored SVG sprites, layered CSS oceans, clouds, depth markings and original pixel puffer art. The Daily menu prominently shows a surface boat, animated sea and large Begin Descent / Puffer Party buttons. During play, a compact HUD floats above the surface while the prompt, fish and answer/timer controls remain within the underwater field. Answer reveal and themed/multiplayer screens use the same pixel style. The existing game mechanics, local storage keys, Neon's multiplayer API and answer bank are unchanged. Desktop 1440x900 and mobile 390x844 Chromium verified: home, question and reveal show with no page JS exceptions or horizontal overflow.

## Public-reference parity follow-up (29 October 2026)
- Six rarity tiers now use the same point values and reference-style rank names: Plankton 10, Too clever 15, Schooler 30, Rare 60, Deep cut 85, and rebranded One in a Deep Dive 100.
- Seven-question Endless mode is closer to the reference's independent dive loop. The old 50-question three-misses-ends-run behavior was not reference-faithful.
- End-of-dive ranking follows observed rating bands: 0–150, 151–250, 251–350, 351–449, 450+.
- Game data has NOT been replaced by the original publisher's answer bank; original server-side services, all animations and complete progression remain unrecovered.
- Existing public-source artwork remains unchanged. No private endpoint bypass, login spoofing or paid unlock circumvention is part of the recovery workflow.
- The separate browser-testing service could not start because its wallet lacked funds; no claim of fresh two-player/browser verification accompanies these changes. CI/typecheck/lint and deployment preview must be checked before merge.
