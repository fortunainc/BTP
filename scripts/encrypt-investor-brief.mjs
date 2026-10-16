// Run with a private JSON briefing path. Plaintext input must remain outside Git.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, createCipheriv, randomBytes } from 'node:crypto';
import dotenv from 'dotenv';
dotenv.config({path:'.env.local',quiet:true});
const input = process.argv[2];
if (!input || !process.env.BTP_INVESTOR_KEY) throw new Error('Provide a private JSON path and BTP_INVESTOR_KEY.');
const secret = Buffer.from(process.env.BTP_INVESTOR_KEY,'base64');
if (secret.length !== 32) throw new Error('Invalid key length.');
const raw=fs.readFileSync(input); const brief=JSON.parse(raw.toString('utf8'));
if (!brief.title || !Array.isArray(brief.sections)) throw new Error('Invalid briefing shape.');
const iv=randomBytes(12);const key=createHash('sha256').update(secret).update('btp-investor-content-v1').digest();
const cipher=createCipheriv('aes-256-gcm',key,iv);
const ciphertext=Buffer.concat([cipher.update(raw),cipher.final()]);
fs.writeFileSync(path.resolve('data/investor-brief.encrypted.json'),JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')})+'\n');
console.log('Encrypted briefing updated. Plaintext and key were not printed.');
