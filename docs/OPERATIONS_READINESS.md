# BTP Operations Readiness

This document captures the reproducible setup and deployment commands for the canonical Behind The Protocol app in `cei-platform`.

## Canonical app

The deployable app is `cei-platform`. Run all commands below from that directory.

## Required runtime

- Node.js 20.x
- npm with `package-lock.json`
- PostgreSQL database
- Clerk project keys
- Optional but expected production services: Resend, Upstash Redis, OpenAI, Sentry

## Clean local install

```bash
npm ci
```

`postinstall` runs `prisma generate` using the local Prisma CLI from `devDependencies`.

## Database setup

Set `DATABASE_URL` in `.env.local` or the deployment platform. The Prisma datasource uses `process.env.DATABASE_URL` and falls back only for local development to:

```text
postgresql://btpuser:btppassword123@localhost:5432/btpdb?schema=public
```

Validate the schema:

```bash
npm run db:validate
```

Generate Prisma Client:

```bash
npm run db:generate
```

Apply migrations in local development:

```bash
npm run db:migrate
```

Apply migrations in production/CI:

```bash
npm run db:deploy
```

Use `db:push` only for disposable local databases where migration history is not required:

```bash
npm run db:push
```

## Seed status

A seed script exists at `prisma/seed.ts` and is wired through `prisma.seed` in `package.json`.

Run it after a database is reachable and migrated:

```bash
npm run db:seed
```

Do not run seed commands against production unless the seed data has been reviewed for the target environment.

## Verification gates

Run these commands before deployment:

```bash
npm run prisma:generate
npm run typecheck
npm run lint
npm run build
```

Current readiness validation was performed from a clean install and confirmed all four gates exit successfully.

## Deployment ownership notes

Next.js Turbopack root is explicitly set in `next.config.ts` using `process.cwd()` so this app owns its root even when sibling or parent lockfiles exist in the wider workspace.

The production build command is:

```bash
npm run build
```

The production start command is:

```bash
npm run start
```

## Required environment variables

See `.env.example` for the full template. Production must provide stable values for:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CRON_SECRET`
- `CAPABILITY_SALT`
- `CROSS_REALM_SALT`
- `PROXY_SALT`
- `ALLOWED_ORIGINS`

Feature/service variables that should also be configured for complete runtime behavior:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`