# Public website and private investor room

The public home page uses the mobile app palette from `mobile/constants/theme.ts`. Public claims distinguish the community beta from proposed benchmarking, vendor evaluation, and forecasting products. The investor room is a separate server-rendered surface at `/investors`; it does not grant access to member or founder APIs.

## Runtime configuration

Production requires `BTP_INVESTOR_KEY` (32 random bytes encoded as base64) and `BTP_INVESTOR_PASSWORD_HASH` (16-byte hexadecimal salt, colon, 64-byte scrypt hash in hexadecimal). Neither is a `NEXT_PUBLIC_` variable. Generate and store a strong password in a password manager. Never commit credentials or plaintext briefing files. Preview investor login fails closed and does not access the shared production database.

The briefing in `data/investor-brief.encrypted.json` is AES-256-GCM ciphertext. Its encryption key is derived from the runtime key with a content-specific domain separator. The public repository must not contain its plaintext. A valid eight-hour HMAC-signed session is required before server-side decryption and rendering. The password hash is included in the signature input so password rotation invalidates all prior sessions. The cookie is HTTP-only, scoped to `/investors`, SameSite Strict, and Secure in production.

The investor routes set no-store, noindex, noarchive, no-referrer and anti-framing headers. Login and logout require same-origin POSTs. Login bodies are bounded independently of Content-Length. Password checking is scrypt plus timing-safe comparison. Login uses one existing PostgreSQL rate-limit bucket (30 attempts/minute globally) and fails closed if the database is unavailable. This bounds state and avoids storing visitor IPs; a sustained attacker can temporarily exhaust the shared budget. Strong randomly generated passwords remain essential. For a larger audience, replace this shared-password gate with named invitations, MFA where appropriate, and per-recipient revocation/audit.

## Content updates and rotation

Keep an editable plaintext JSON copy in approved private storage, outside the repository. With the current key loaded in `.env.local`, run `node scripts/encrypt-investor-brief.mjs /absolute/private/brief.json`. Commit only the encrypted result. Validate every claim against the implementation and current deployment before updating.

For password-only rotation, generate a fresh salt and scrypt hash and update the production hash; all sessions are revoked without changing the ciphertext. For key rotation, re-encrypt the brief with the new key, deploy matching ciphertext/key together, and invalidate old sessions. Preserve private recovery copies in a password manager or encrypted storage. Redeploy production after changing Vercel environment variables.

## Acceptance and limits

Tests cover absent config, bad passwords, tampered/expired/future/rotated sessions, ciphertext integrity, same-origin boundaries, preview blocking, body limits, rate-limit exhaustion/unavailability, cookie attributes, and logout. Production checks must verify the signed-out response does not contain briefing text, the authenticated response does, response cache headers remain private, and browser bundles do not contain plaintext briefing or secrets.

A shared password is not an NDA and cannot stop an authorized reader copying content. Public application source remains public. Do not put production credentials, identifiable member data, raw meeting notes, or unnecessary confidential third-party statements in the briefing. This room is not a certification of application security or a full institutional diligence data room.
