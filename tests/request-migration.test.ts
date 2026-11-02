import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';
it('adds private follow up tracking idempotently and preserves notes',async()=>{
 const db=new PGlite();try{
  const sql=readFileSync('prisma/migrations/20261101_request_followup/migration.sql','utf8');await db.exec(sql);
  await db.exec(`INSERT INTO "RequestFollowUp" (key,notes) VALUES ('investor:one','Call next week')`);await db.exec(sql);
  expect((await db.query('SELECT key,notes,status FROM "RequestFollowUp"')).rows).toEqual([{key:'investor:one',notes:'Call next week',status:'new'}]);
 }finally{await db.close();}
});
