# Beta tester kit

Updated 2026-10-16. For the invitation-only beta described in `docs/vision/BTP_FINAL_VISION.md`.

## Founder workflow per tester

1. Tester emails a request (homepage button pre-fills role, years, intended use).
2. Reply with the invite below.
3. Tester signs up at `/sign-up`. A pending account is created automatically on first sign-in, with their sign-in email visible to admins.
4. Tester completes the profile (role, display handle, optional LinkedIn).
5. Approve at `/admin/verifications` after checking experience privately (LinkedIn, member reference, or other evidence). Match the tester by email.
6. Email the tester that access is open.

## Invite email (template)

Subject: Your BTP beta invitation

Thanks for your interest in Behind the Protocol. BTP is an invitation-only community where clinical research professionals ask operational questions, learn from verified peers, and come back with what worked.

1. Sign up at https://behindtheprotocol.ai/sign-up. A personal email is fine.
2. Choose a display handle that does not include your name or employer.
3. I review each profile privately and will email you once access is open.

Please never post patient information, confidential documents, or names of sites, sponsors or studies. Reply to this email with any feedback, including anything confusing or broken.

## What to ask testers to try (first week)

- Ask one real operational question (no identifiers).
- Answer or add experience to someone else's question.
- Follow a question and record an outcome on your own.
- Submit a private-help request (`/help`), e.g. interview preparation.
- Report any content that looks identifying.

## Before inviting the first testers

- Seed 3-5 founder-authored starter questions so the list is not empty (written by the founder, posted under the founder's handle; never fabricated member posts).
- Decide whether private help is free during beta (homepage says scope and any fee are agreed first).
- Vercel: give Preview and Development their own database branch (Storage > btp-production > Projects > Update Project Connection) so testing never touches production data.
