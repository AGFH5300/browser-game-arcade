# Sidequest provider-hosted in-frame games — 29 October 2026

## Changes

- **Skribbl.io:** Miniplay's advertised iframe URL: https://www.miniplay.com/embed/skribbl-io
- **TAG:** Miniplay's advertised iframe URL: https://www.miniplay.com/embed/tag
- **WorldGuessr:** original publisher-hosted game in the Sidequest player at https://www.worldguessr.com/. The user reports holding the necessary embedding permission. WorldGuessr terms require prior written authorization; no permission document was independently reviewed.
- **Krillion:** retain official-site launch at https://krillion.io/ because the origin sends both X-Frame-Options: SAMEORIGIN and CSP frame-ancestors 'self'. Its owner must provide an embeddable endpoint or authorized deployable build; simply changing Sidequest sandbox attributes will not overcome the origin restriction. Never strip their headers or proxy private account sessions.

## Technical and QA notes

- Only the exact reviewed provider URLs are allowlisted. No host wildcards, uncontrolled query parameters, asset copying, session proxying, or disabling clickjacking protections.
- In the authorized test Mac network, FortiGuard Games-category filtering returned network-generated HTTP 403 pages for all three Miniplay iframe endpoints and WorldGuessr. This prevents independent real-game browser verification here, and **does not** prove the embed will fail or succeed on an unrestricted network.
- A visible manual link to the original game is provided **only as a fallback after Play now** on these three titles.
- Follow-up gameplay QA on a permissive network still needs private Skribbl room join, same-keyboard TAG controls, WorldGuessr Street View/guess submission and browser privacy/storage verification.
