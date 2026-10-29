# Deep Dive — Sidequest Original Trivia and Puffer Party

This is a new browser game built for Sidequest. Its original artwork, UI, software and starting question bank are not copied from any other game. The user reports the Krillion publisher granted permission; no proprietary question export was provided.

## Question and answers
The initial question bank has 90 originally written prompts across nine themes, with 1,034 recognized answer entries. Exact aliases are normalized for spelling, accents, punctuation, and C++ / C# syntax. Rarity is a fixed editorial approximation, not live player frequency. Unrecognized answers may be retried before the current timer runs out. Future work: import publisher-supplied permitted datasets, correct missing aliases, expand to thousands of questions.

## Solo modes
- Daily: seven seeded prompts every UTC day, 25 seconds per prompt, one completed daily run per browser.
- Endless: shuffled questions, up to 50, three misses end the run.
- Worlds: nine themes, five replayable seven-question chapters each. Pearls and preceding-chapter completion unlock chapters. No purchases.
- Logbook and streak: browser-local statistics only.

## Puffer Party multiplayer
- Neon Postgres room table deep_dive_party_rooms. Six-character invite codes, public and private rooms, public room list, ready up, host start, two to eight players, chat, leave, and winner.
- Three starting hearts; 18s turn timer. Unrecognized guesses may be retried. Valid answers must not repeat for the current question. Missing a turn or passing loses one heart. Every 120 rarity points restores one heart (up to five). Last afloat wins.
- Server validates all answers and rare tiers and keeps player identity tokens secret. Room state is persisted in Neon; optimistic revision updates prevent lost concurrent writes. Browsers poll every 1.5s. Expired turns resolve on the next API read; rooms expire after 12h of inactivity.
- Casual, not esports-grade anti-cheat. Because the solo answer bank is public, player-side inspection can reveal answers. Real tournaments need protected server-only questions and additional anti-abuse controls.

## Storage and rights
Solo progression and unfinished game are in browser localStorage and are not shared across devices. Multiplayer session credentials stay in sessionStorage. The user-provided Reddit link could not be retrieved in available browsing and no quotes or comments were copied from it. Questions and rarity values from the original Krillion site were not bulk-extracted or represented as official.

## Runtime
- Game entrypoint: /play/deep-dive/index.html
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
