# Sidequest external-provider entrypoint check — 29 October 2026

This is a header-level availability/embedding check, not gameplay certification.
Nine external game URLs in the 128-title reference collection were requested with a conventional browser User-Agent from a UAE-connected device.

- **Cookie Clicker (Orteil/DashNet):** HTTP 403 from the checking network, X-Frame-Options: SAMEORIGIN. This prevents a third-party Sidequest iframe. Its Sidequest player now opens the creator's original URL in a new tab instead of loading a blank frame. Availability on the visitor's network remains provider-controlled.
- **Football Legends, Monkey Mart, Funny Shooter 2 (MiniPlay):** HTTP 200; no frame-denying X-Frame-Options or frame-ancestors headers observed.
- **Pixel Shooter (CrazyGames), Smash Karts, Shell Shockers, Zombs Royale, Clicker Heroes:** HTTP 200; no frame-denying X-Frame-Options or frame-ancestors headers observed.
- **2048:** local /play/2048/index.html, not an external host. Its separate original Sidequest runtime tests remain in place.

A 200 response with permissive headers does not prove the game itself starts, third-party scripts work, or keyboard/multiplayer controls respond. The reference games and local package audits must still be validated independently. Do not remove or bypass provider security headers.
