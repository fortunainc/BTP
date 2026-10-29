import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';
it('adds waitlist columns idempotently while preserving existing referrals', async () => {
 const db=new PGlite();
 try {
  await db.exec(`CREATE TABLE "AccessRequest" (id TEXT PRIMARY KEY, email TEXT UNIQUE, "referrerId" TEXT, status TEXT DEFAULT 'requested'); INSERT INTO "AccessRequest" (id,email,"referrerId") VALUES ('old','a@example.com','member');`);
  const sql=readFileSync('prisma/migrations/20261030_operator_waitlist/migration.sql','utf8');await db.exec(sql);await db.exec(sql);
  const result=await db.query('SELECT * FROM "AccessRequest"');
  expect(result.rows[0]).toMatchObject({id:'old',referrerId:'member',paidReviewInterest:false,source:'direct',professionalVerifiedAt:null});
 }finally{await db.close();}
});
