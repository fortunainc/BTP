/**
 * Secure Capability Identity Manager
 * 
 * CRITICAL FIX: Removes direct userId link from CapabilityIdentity
 * Uses one-way hashed lookup key instead.
 * 
 * This prevents:
 * - Direct database lookup from CapabilityIdentity to User
 * - Cross-realm correlation attacks
 * - Insider threat exposing operator identities
 */

import { createHash, randomBytes } from 'crypto';
import { prisma } from './prisma';

// Secret salt for hashing (should be environment variable in production)
const CAPABILITY_SALT = process.env.CAPABILITY_SALT || 'btp-capability-salt-change-in-production';

/**
 * Generate a one-way hashed lookup key from userId
 * This allows lookup without storing the direct userId
 */
export function generateSecureLookupKey(userId: string): string {
  const input = `${userId}:${CAPABILITY_SALT}:capability-lookup`;
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Generate a display profile ID
 * This is what organizations see - completely unrelated to userId
 */
export function generateDisplayProfileId(): string {
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `CAP-${random}`;
}

/**
 * Securely create or update a CapabilityIdentity
 * WITHOUT storing userId directly
 */
export async function secureUpsertCapabilityIdentity(params: {
  userId: string;
  therapeuticAreas?: Record<string, number>;
  trialPhases?: Record<string, number>;
  issueExpertise?: Record<string, number>;
  generatedSummary?: string;
}): Promise<{
  id: string;
  profileId: string;
  lookupKey: string;
}> {
  
  const lookupKey = generateSecureLookupKey(params.userId);
  
  // Check if capability identity already exists using lookup key
  const existing = await prisma.$queryRaw<Array<{ id: string; profileId: string }>>`
    SELECT id, "profileId" FROM "CapabilityIdentity" 
    WHERE "lookupKey" = ${lookupKey}
    LIMIT 1
  `;
  
  if (existing.length > 0) {
    // Update existing
    await prisma.$executeRaw`
      UPDATE "CapabilityIdentity" 
      SET 
        "therapeuticAreas" = ${params.therapeuticAreas ? JSON.stringify(params.therapeuticAreas) : null}::jsonb,
        "trialPhases" = ${params.trialPhases ? JSON.stringify(params.trialPhases) : null}::jsonb,
        "issueExpertise" = ${params.issueExpertise ? JSON.stringify(params.issueExpertise) : null}::jsonb,
        "generatedSummary" = ${params.generatedSummary || null},
        "updatedAt" = NOW()
      WHERE "lookupKey" = ${lookupKey}
    `;
    
    return {
      id: existing[0].id,
      profileId: existing[0].profileId,
      lookupKey
    };
  }
  
  // Create new
  const profileId = generateDisplayProfileId();
  
  const result = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "CapabilityIdentity" (
      "profileId", 
      "lookupKey",
      "therapeuticAreas", 
      "trialPhases", 
      "issueExpertise", 
      "generatedSummary",
      "status",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${profileId},
      ${lookupKey},
      ${params.therapeuticAreas ? JSON.stringify(params.therapeuticAreas) : null}::jsonb,
      ${params.trialPhases ? JSON.stringify(params.trialPhases) : null}::jsonb,
      ${params.issueExpertise ? JSON.stringify(params.issueExpertise) : null}::jsonb,
      ${params.generatedSummary || null},
      'active',
      NOW(),
      NOW()
    )
    RETURNING id
  `;
  
  return {
    id: result[0].id,
    profileId,
    lookupKey
  };
}

/**
 * Securely retrieve CapabilityIdentity by userId
 * Uses one-way hash lookup - never reveals userId
 */
export async function secureGetCapabilityIdentityByUserId(userId: string): Promise<{
  id: string;
  profileId: string;
  therapeuticAreas: Record<string, number> | null;
  trialPhases: Record<string, number> | null;
  issueExpertise: Record<string, number> | null;
  generatedSummary: string | null;
} | null> {
  
  const lookupKey = generateSecureLookupKey(userId);
  
  const result = await prisma.$queryRaw<Array<{
    id: string;
    profileId: string;
    therapeuticAreas: any;
    trialPhases: any;
    issueExpertise: any;
    generatedSummary: string | null;
  }>>`
    SELECT id, "profileId", "therapeuticAreas", "trialPhases", "issueExpertise", "generatedSummary"
    FROM "CapabilityIdentity"
    WHERE "lookupKey" = ${lookupKey}
    LIMIT 1
  `;
  
  if (result.length === 0) {
    return null;
  }
  
  return {
    id: result[0].id,
    profileId: result[0].profileId,
    therapeuticAreas: result[0].therapeuticAreas,
    trialPhases: result[0].trialPhases,
    issueExpertise: result[0].issueExpertise,
    generatedSummary: result[0].generatedSummary
  };
}

/**
 * Verify that the secure system is properly configured
 * Returns true if no direct userId links exist
 */
export async function verifySecureConfiguration(): Promise<{
  secure: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  // Check for userId column in CapabilityIdentity
  try {
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'CapabilityIdentity' 
      AND column_name = 'userId'
    `;
    
    if (columns.length > 0) {
      issues.push('CRITICAL: userId column exists in CapabilityIdentity table');
    }
  } catch (error) {
    issues.push('Could not verify database schema');
  }
  
  // Check for lookupKey column
  try {
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'CapabilityIdentity' 
      AND column_name = 'lookupKey'
    `;
    
    if (columns.length === 0) {
      issues.push('lookupKey column not found - migration may be needed');
    }
  } catch (error) {
    issues.push('Could not verify lookupKey column');
  }
  
  return {
    secure: issues.length === 0,
    issues
  };
}

/**
 * Migration helper: Remove userId from existing CapabilityIdentity records
 * This should be run as a one-time migration
 */
export async function migrateToSecureCapabilityIdentity(): Promise<{
  migrated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migrated = 0;
  
  try {
    // Step 1: Add lookupKey column if not exists
    await prisma.$executeRaw`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'CapabilityIdentity' AND column_name = 'lookupKey'
        ) THEN
          ALTER TABLE "CapabilityIdentity" ADD COLUMN "lookupKey" TEXT UNIQUE;
        END IF;
      END $$;
    `;
    
    // Step 2: Generate lookupKeys for existing records
    const existingRecords = await prisma.$queryRaw<Array<{
      id: string;
      userId: string | null;
    }>>`
      SELECT id, "userId" FROM "CapabilityIdentity" WHERE "lookupKey" IS NULL
    `;
    
    for (const record of existingRecords) {
      if (record.userId) {
        const lookupKey = generateSecureLookupKey(record.userId);
        
        await prisma.$executeRaw`
          UPDATE "CapabilityIdentity" 
          SET "lookupKey" = ${lookupKey}
          WHERE id = ${record.id}
        `;
        
        migrated++;
      }
    }
    
    // Step 3: Drop userId column (requires explicit confirmation in production)
    // This is intentionally commented out for safety
    // await prisma.$executeRaw`ALTER TABLE "CapabilityIdentity" DROP COLUMN "userId"`;
    
  } catch (error) {
    errors.push(`Migration error: ${error}`);
  }
  
  return { migrated, errors };
}

export default {
  generateSecureLookupKey,
  generateDisplayProfileId,
  secureUpsertCapabilityIdentity,
  secureGetCapabilityIdentityByUserId,
  verifySecureConfiguration,
  migrateToSecureCapabilityIdentity
};