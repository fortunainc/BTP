// Applies additive, idempotent SQL to the production database during the Vercel production build,
// so schema changes ship with the code that needs them. Never runs for previews or local builds.
import { execFileSync } from 'node:child_process';

const FILES = ['prisma/migrations/20261028_verification_privacy/migration.sql'];

if (process.env.VERCEL_ENV !== 'production' || !process.env.DATABASE_URL) {
  console.log('Skipping production migrations (not a production build).');
  process.exit(0);
}
for (const file of FILES) {
  execFileSync('npx', ['prisma', 'db', 'execute', '--file', file], { stdio: 'inherit' });
  console.log(`Applied ${file}`);
}
