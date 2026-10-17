# Behind the Protocol (BTP)

A verified, identity-protected community where clinical research operators ask for help and help each other without repercussions. In aggregate, that activity shows where trials actually break; BTP returns those patterns to members first and offers them, only in aggregate, to the teams that plan trials.

Copyright Fortuna Industries Inc. Source is visible for transparency; see [LICENSE](LICENSE).

## Start here

| Document | Purpose |
|---|---|
| [Final company vision](docs/vision/BTP_FINAL_VISION.md) ([PDF](output/pdf/BTP_Final_Vision_2026-10-16.pdf)) | Controlling direction (v1.1, 17 Oct 2026: community first, patterns second) |
| [Architecture](docs/ARCHITECTURE.md) | How the system fits together |
| [State of the codebase](docs/STATE_OF_THE_CODEBASE.md) | What is solid, what is expedient, what is next |
| [Backlog](docs/BACKLOG.md) | Prioritized work and status |
| [Demo script](docs/DEMO_SCRIPT.md) | 10-minute product walkthrough |
| [Product constitution](BTP_PRODUCT_CONSTITUTION.md) | Beta scope, subject to the vision |
| [Data and prediction doctrine](BTP_DATA_INTELLIGENCE_DOCTRINE_2026-10-12.md) | Research and data permissions |
| [Contributor rules](AGENTS.md) | Rules for every contributor and AI assistant |

Older reports are in [docs/archive](docs/archive); they are history, not current specifications.

## Technology

Next.js 16 / React 19 / TypeScript / Tailwind on Vercel; PostgreSQL (Neon) via Prisma 7; Clerk authentication; Expo SDK 54 / React Native iOS app via EAS and TestFlight; Vitest; GitHub Actions.

## Local setup

```bash
npm ci
cp .env.example .env.local   # fill in values; use a development database, never production
npx prisma migrate dev
npm run dev                  # http://localhost:3000
```

Mobile: see [mobile/README.md](mobile/README.md).

## Quality checks (run in CI on every change)

```bash
npm run db:validate
npm run typecheck
npm run lint
npm run test:quality
```

## Deployment

Merges to `main` deploy to production on Vercel. Preview deployments block API access until an isolated preview database is configured. Never commit credentials, member data or plaintext investor briefing content.

Regenerate the vision PDF after editing its Markdown source:

```bash
python3 scripts/docs/render-vision.py
```
