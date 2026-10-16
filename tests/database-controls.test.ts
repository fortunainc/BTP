import { afterAll, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock('@/lib/prisma', () => ({ prisma: { $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const sql = strings.reduce((text, part, index) => text + part + (index < values.length ? `$${index + 1}` : ''), '');
  return (await (state.db as PGlite).query(sql, values)).rows;
} } }));
import { checkWriteRateLimit } from '@/lib/write-rate-limit';
const db = new PGlite(); state.db = db;
afterAll(async () => { vi.restoreAllMocks(); await db.close(); });
it('migrates existing outcomes and accepts standalone help without losing requests', async () => {
  await db.exec(`CREATE TABLE "PrivateHelpRequest" (id TEXT PRIMARY KEY, "contributionId" TEXT NOT NULL); CREATE TABLE "ContributionOutcome" ("outcomeType" TEXT, "wasHelpful" BOOLEAN, "impactScore" DOUBLE PRECISION); INSERT INTO "PrivateHelpRequest" VALUES ('existing','question'); INSERT INTO "ContributionOutcome" VALUES ('correction',true,0.5), ('incomplete',true,0.2), ('resolution',true,1);`);
  await db.exec(readFileSync('prisma/migrations/20261016_beta_quality_controls/migration.sql','utf8'));
  await db.exec(`INSERT INTO "PrivateHelpRequest" (id, "contributionId") VALUES ('standalone',NULL)`);
  expect((await db.query('SELECT * FROM "PrivateHelpRequest"')).rows).toHaveLength(2);
  expect((await db.query('SELECT "outcomeType" FROM "ContributionOutcome" WHERE "wasHelpful"')).rows).toEqual([{ outcomeType: 'resolution' }]);
});
it('atomically limits concurrent writes across paths and rolls the window forward', async () => {
  const now = vi.spyOn(Date, 'now').mockReturnValue(120_010);
  const results = await Promise.all(Array.from({ length: 35 }, (_, i) => checkWriteRateLimit('alice', `/api/situations/${i}`)));
  expect(results.filter(item => item.allowed)).toHaveLength(30);
  expect((await checkWriteRateLimit('bob', '/api/situations')).allowed).toBe(true);
  now.mockReturnValue(180_010); expect((await checkWriteRateLimit('alice', '/api/situations')).allowed).toBe(true);
  now.mockReturnValue(120_010); await checkWriteRateLimit('alice', '/api/situations');
  const rows = await db.query<{ count: number }>('SELECT "count" FROM "ApiRateLimit" ORDER BY "count" DESC');
  expect(rows.rows[0].count).toBe(2); // A late request cannot rewind the window.
});
