# Sidequest-only PolyTrack Multiplayer — pilot

## Why
Kodub will not add Sidequest's origin to its live multiplayer API allowlist.
This implementation **never contacts Kodub multiplayer, ICE-server, or signaling endpoints**.
It creates separate Sidequest invite codes and rooms, preserving the
PolyTrack 0.6.3 peer-to-peer WebRTC game protocol.

## Current status
**Preview-only experimental code. NOT multiplayer-verified or activated in the live Sidequest game.**
The current production PolyTrack single-player game must not be modified
until two real clients can create, join, connect, and race reliably.

## Files
- `lib/polytrack-mp.ts`: packet parsing, exact allowed origins, protocol
- `lib/polytrack-mp-server.ts`: host/join signaling, room/event relay via Neon
- `app/api/polytrack-mp/v6/multiplayer/{host,join}`: WebSocket endpoints on Vercel
- `app/api/polytrack-mp/v6/iceServers`: pilot STUN config with CORS
- `docs/POLYTRACK_PRIVATE_MP_SCHEMA.sql`: three independent tables
- `public/play/archives/polytrack/private-mp.html`: pilot entrypoint
- `public/play/archives/polytrack/private-main.bundle.js`: patched game
  client; original game binary untouched. Only the 3 WS/ICE endpoint
  strings are replaced. Profile, track and leaderboard APIs still target
  Kodub and may return 403.

## Deployment
Requires `@vercel/functions`. Preview endpoints are enabled only for
`VERCEL_ENV=preview`. Production endpoints require explicit server
configuration `POLYTRACK_PRIVATE_MP_ENABLED=true`. No feature flag is
currently enabled in production.

The pilot origin must be a deployment of the Sidequest Vercel project or
the known isolated game asset host. Never allow arbitrary `Origin`.

Apply `docs/POLYTRACK_PRIVATE_MP_SCHEMA.sql` only to a user-authorized
database. Neon events are retained for at most 25 minutes, but expiry
rows require a scheduled pruning job for long-running usage.

## First verification
1. Confirm a two-WebSocket smoke test: host sends `createInvite` and gets
   `inviteCode`; join sends its WebRTC offer; host receives `joinInvite`;
   host sends `acceptJoin`, join receives answer; both exchange
   `iceCandidate` packets.
2. Test in actual WebGL browser on two devices or network connections,
   starting with the pilot `private-mp.html` URL.
3. Verify two-way peer-to-peer game state, session cleanup, reconnection,
   origin enforcement, error handling and limits.
4. Use production Neon schema only after verifying on preview.
5. Add TURN relay service if players behind restrictive NAT cannot connect.
   STUN-only is not guaranteed to work on every network.
6. Measure polling overhead; polling Neon once per second per connected
   socket is acceptable for a tiny pilot but not efficient at large scale.
   For broad release, switch to dedicated durable pub/sub.

## Limits
- Sidequest rooms are NOT Kodub's official multiplayer network.
- No connection to original invite rooms, profile sharing, or leaderboards.
- 8-player room cap, 20-minute room TTL, basic socket-message rate limiting.
- Not a production-grade abuse-defense and scaling layer.
- Does not disguise requests or circumvent Kodub's access restrictions.
