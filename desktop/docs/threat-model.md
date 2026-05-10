# Vyb Desktop Threat Model (MVP)

## Primary Threats

- **Account abuse:** credential stuffing, fake signup automation.
- **Spam and harassment:** mass-posting, DM abuse, unsafe marketplace behavior.
- **Fraud:** fake listings, social engineering in meetups.
- **Data leakage:** over-permissive APIs or accidental PII logging.
- **Unsafe uploads:** malicious media payloads or unsupported files.
- **Desktop attack surface:** unsafe Tauri commands, insecure IPC payloads.

## Mitigations

- Clerk-managed auth + optional passkeys.
- Rate limits and anti-spam scoring at mutation layer.
- Block/mute/report controls and moderation queue.
- Fine-grained authorization checks per resource owner.
- MIME/type/size checks for uploads and malware scanning hook.
- Strict IPC contract validation (Zod) for desktop commands.
- Auditable event logs for high-risk actions (marketplace + safety).

## Residual Risk

- Early-stage moderation false positives/negatives.
- Social fraud attempts during event and marketplace growth.

## Planned Hardening

- Device fingerprinting for abuse rings.
- Transaction idempotency + escrow lifecycle checks.
- Progressive trust scoring for accounts and listings.
