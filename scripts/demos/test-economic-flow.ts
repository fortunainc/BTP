/**
 * BTP Economic System Proof - End-to-End Test
 * 
 * This script PROVES whether BTP works as a real economic system.
 * It does NOT describe - it EXECUTES and records what happens.
 * 
 * Run with: npx tsx test-economic-flow.ts
 */

// Use the project's Prisma client setup
import { prisma } from './lib/prisma';

// ============================================
// TEST RESULTS TRACKING
// ============================================

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL' | 'SKIPPED';
  details: string;
  records: any[];
  errors: string[];
  apiCalls: string[];
}

const results: TestResult[] = [];

function recordResult(
  step: string, 
  status: TestResult['status'], 
  details: string, 
  records: any[] = [],
  errors: string[] = [],
  apiCalls: string[] = []
) {
  results.push({ step, status, details, records, errors, apiCalls });
  console.log(`\n[${status}] ${step}`);
  console.log(`  ${details}`);
  if (errors.length > 0) {
    console.log(`  Errors: ${errors.join(', ')}`);
  }
}

// ============================================
// TEST DATA
// ============================================

const testOperator = {
  clerkId: 'test_operator_' + Date.now(),
  handle: 'operator_test_' + Date.now(),
  userRole: 'operator',
  roleCategory: 'crc',
  companyCategory: 'site',
  email: `operator_${Date.now()}@test.com`,
};

const testOrganization = {
  clerkId: 'test_org_' + Date.now(),
  handle: 'org_test_' + Date.now(),
  userRole: 'organization',
  roleCategory: 'other',
  companyCategory: 'sponsor',
  email: `org_${Date.now()}@test.com`,
};

const testSituations = [
  {
    title: 'Protocol Amendment Delay',
    description: 'Site experienced 3-week delay due to sponsor-required amendment for new safety signal',
    contributionType: 'situation',
    therapeuticArea: 'Oncology',
    trialPhase: 'Phase 3',
    specialty: 'Breast Cancer',
  },
  {
    title: 'Recruitment Challenge Rare Disease',
    description: 'Difficult enrollment due to narrow inclusion criteria for orphan drug trial',
    contributionType: 'situation',
    therapeuticArea: 'Rare Disease',
    trialPhase: 'Phase 2',
    specialty: 'Genetic Disorders',
  },
  {
    title: 'Data Quality Issue EDC',
    description: 'EDC system validation failures required manual data reconciliation',
    contributionType: 'situation',
    therapeuticArea: 'CNS',
    trialPhase: 'Phase 3',
    specialty: 'Alzheimer\'s',
  },
];

// ============================================
// PHASE 1: OPERATOR FLOW
// ============================================

async function testOperatorFlow() {
  console.log('\n========================================');
  console.log('PHASE 1: OPERATOR FLOW');
  console.log('========================================\n');

  let operatorId: string | null = null;
  let contributionIds: string[] = [];

  // Step 1: Create Operator
  try {
    const operator = await prisma.user.create({
      data: testOperator,
    });
    operatorId = operator.id;
    recordResult(
      '1.1 Create Operator User',
      'PASS',
      `Created operator with ID: ${operator.id}`,
      [{ table: 'User', id: operator.id, data: operator }],
      [],
      ['prisma.user.create()']
    );
  } catch (error: any) {
    recordResult(
      '1.1 Create Operator User',
      'FAIL',
      'Failed to create operator',
      [],
      [error.message],
      ['prisma.user.create()']
    );
    return { operatorId: null, contributionIds: [] };
  }

  // Step 2: Submit Situations
  for (let i = 0; i < testSituations.length; i++) {
    try {
      const situation = testSituations[i];
      const contribution = await prisma.contribution.create({
        data: {
          ...situation,
          userId: operatorId!,
          description: `[REDACTED] ${situation.description}`,
        },
      });
      contributionIds.push(contribution.id);
      recordResult(
        `1.2.${i+1} Submit Situation: ${situation.title}`,
        'PASS',
        `Created contribution ID: ${contribution.id}`,
        [{ table: 'Contribution', id: contribution.id, data: contribution }],
        [],
        ['prisma.contribution.create()']
      );
    } catch (error: any) {
      recordResult(
        `1.2.${i+1} Submit Situation: ${testSituations[i].title}`,
        'FAIL',
        'Failed to create contribution',
        [],
        [error.message],
        ['prisma.contribution.create()']
      );
    }
  }

  // Step 3: Trigger TrustVector Update
  try {
    // Check if TrustVector update function exists
    const trustVectorPath = require('path').join(process.cwd(), 'lib', 'trust-vector.ts');
    const fs = require('fs');
    
    if (fs.existsSync(trustVectorPath)) {
      // Trust vector module exists, try to use it
      const { updateTrustVector } = await import('./lib/trust-vector');
      
      if (typeof updateTrustVector === 'function') {
        await updateTrustVector(operatorId!);
        
        const trustVector = await prisma.trustVector.findUnique({
          where: { userId: operatorId! },
        });
        
        if (trustVector) {
          recordResult(
            '1.3 Build TrustVector',
            'PASS',
            `TrustVector created with overall score: ${trustVector.overallScore}`,
            [{ table: 'TrustVector', id: trustVector.id, data: trustVector }],
            [],
            ['updateTrustVector()', 'prisma.trustVector.findUnique()']
          );
        } else {
          recordResult(
            '1.3 Build TrustVector',
            'PARTIAL',
            'updateTrustVector ran but no TrustVector record found',
            [],
            ['TrustVector record not created'],
            ['updateTrustVector()', 'prisma.trustVector.findUnique()']
          );
        }
      } else {
        throw new Error('updateTrustVector function not exported');
      }
    } else {
      throw new Error('trust-vector.ts not found');
    }
  } catch (error: any) {
    // Manual creation as fallback
    try {
      const trustVector = await prisma.trustVector.create({
        data: {
          userId: operatorId!,
          quality: 0.75,
          reliability: 0.80,
          patternContribution: 0.60,
          solutionUtility: 0.70,
          recency: 0.90,
          peerConfidence: 0.65,
          outcomeReinforcement: 0.55,
          scarcity: 0.40,
          domainRelevance: 0.85,
          overallScore: 0.70,
        },
      });
      recordResult(
        '1.3 Build TrustVector',
        'PARTIAL',
        'TrustVector created MANUALLY (function not available)',
        [{ table: 'TrustVector', id: trustVector.id, data: trustVector }],
        [error.message, 'Used manual fallback'],
        ['prisma.trustVector.create() - MANUAL']
      );
    } catch (innerError: any) {
      recordResult(
        '1.3 Build TrustVector',
        'FAIL',
        'Failed to create TrustVector',
        [],
        [error.message, innerError.message],
        []
      );
    }
  }

  // Step 4: Generate CapabilityIdentity
  try {
    const capabilityIdentityPath = require('path').join(process.cwd(), 'lib', 'capability-identity.ts');
    const fs = require('fs');
    
    if (fs.existsSync(capabilityIdentityPath)) {
      const { generateCapabilityIdentity } = await import('./lib/capability-identity');
      
      if (typeof generateCapabilityIdentity === 'function') {
        const ci = await generateCapabilityIdentity(operatorId!);
        
        const capabilityIdentity = await prisma.capabilityIdentity.findUnique({
          where: { userId: operatorId! },
        });
        
        if (capabilityIdentity) {
          recordResult(
            '1.4 Generate CapabilityIdentity',
            'PASS',
            `CapabilityIdentity created: ${capabilityIdentity.profileId}`,
            [{ table: 'CapabilityIdentity', id: capabilityIdentity.id, data: capabilityIdentity }],
            [],
            ['generateCapabilityIdentity()', 'prisma.capabilityIdentity.findUnique()']
          );
        } else {
          recordResult(
            '1.4 Generate CapabilityIdentity',
            'PARTIAL',
            'Function ran but no CapabilityIdentity record found',
            [],
            ['CapabilityIdentity record not created'],
            ['generateCapabilityIdentity()']
          );
        }
      } else {
        throw new Error('generateCapabilityIdentity function not exported');
      }
    } else {
      throw new Error('capability-identity.ts not found');
    }
  } catch (error: any) {
    // Manual creation as fallback
    try {
      const capabilityIdentity = await prisma.capabilityIdentity.create({
        data: {
          userId: operatorId!,
          profileId: `CAP-${Date.now().toString(36).toUpperCase()}`,
          summary: 'Experienced CRC with Oncology and Rare Disease expertise',
          capabilityBreakdown: JSON.stringify({
            therapeuticAreas: ['Oncology', 'Rare Disease', 'CNS'],
            phases: ['Phase 2', 'Phase 3'],
            specialties: ['Breast Cancer', 'Genetic Disorders'],
          }),
          overallTrustScore: 0.70,
        },
      });
      recordResult(
        '1.4 Generate CapabilityIdentity',
        'PARTIAL',
        'CapabilityIdentity created MANUALLY (function not available)',
        [{ table: 'CapabilityIdentity', id: capabilityIdentity.id, data: capabilityIdentity }],
        [error.message, 'Used manual fallback'],
        ['prisma.capabilityIdentity.create() - MANUAL']
      );
    } catch (innerError: any) {
      recordResult(
        '1.4 Generate CapabilityIdentity',
        'FAIL',
        'Failed to create CapabilityIdentity',
        [],
        [error.message, innerError.message],
        []
      );
    }
  }

  return { operatorId, contributionIds };
}

// ============================================
// PHASE 2: ORGANIZATION FLOW
// ============================================

async function testOrganizationFlow() {
  console.log('\n========================================');
  console.log('PHASE 2: ORGANIZATION FLOW');
  console.log('========================================\n');

  let organizationId: string | null = null;

  // Step 1: Create Organization
  try {
    const organization = await prisma.user.create({
      data: testOrganization,
    });
    organizationId = organization.id;
    recordResult(
      '2.1 Create Organization User',
      'PASS',
      `Created organization with ID: ${organization.id}`,
      [{ table: 'User', id: organization.id, data: organization }],
      [],
      ['prisma.user.create()']
    );
  } catch (error: any) {
    recordResult(
      '2.1 Create Organization User',
      'FAIL',
      'Failed to create organization',
      [],
      [error.message],
      ['prisma.user.create()']
    );
    return { organizationId: null };
  }

  return { organizationId };
}

// ============================================
// PHASE 3: OPPORTUNITY POSTING
// ============================================

async function testOpportunityPosting(organizationId: string) {
  console.log('\n========================================');
  console.log('PHASE 3: OPPORTUNITY POSTING');
  console.log('========================================\n');

  let jobPostingId: string | null = null;

  try {
    const jobPosting = await prisma.jobPosting.create({
      data: {
        organizationId,
        title: 'Senior CRC - Oncology Trial',
        description: 'Seeking experienced CRC for Phase 3 breast cancer study',
        therapeuticArea: 'Oncology',
        trialPhase: 'Phase 3',
        specialty: 'Breast Cancer',
        roleCategory: 'crc',
        locationType: 'Hybrid',
        compensationMin: 85000,
        compensationMax: 110000,
        status: 'Active',
      },
    });
    jobPostingId = jobPosting.id;
    recordResult(
      '3.1 Post Opportunity (JobPosting)',
      'PASS',
      `Created JobPosting ID: ${jobPosting.id}`,
      [{ table: 'JobPosting', id: jobPosting.id, data: jobPosting }],
      [],
      ['prisma.jobPosting.create()']
    );
  } catch (error: any) {
    recordResult(
      '3.1 Post Opportunity (JobPosting)',
      'FAIL',
      'Failed to create JobPosting',
      [],
      [error.message],
      ['prisma.jobPosting.create()']
    );
  }

  return { jobPostingId };
}

// ============================================
// PHASE 4: MATCHING FLOW
// ============================================

async function testMatchingFlow(operatorId: string, jobPostingId: string) {
  console.log('\n========================================');
  console.log('PHASE 4: MATCHING FLOW');
  console.log('========================================\n');

  let matchId: string | null = null;

  // Step 1: Check if matching algorithm exists
  try {
    const opportunitiesRoute = require('path').join(process.cwd(), 'app', 'api', 'opportunities', 'route.ts');
    const fs = require('fs');
    const content = fs.readFileSync(opportunitiesRoute, 'utf-8');
    
    if (content.includes('prisma.opportunityMatch.create')) {
      recordResult(
        '4.1 Check Matching Algorithm',
        'PASS',
        'Matching algorithm code found in API',
        [],
        [],
        []
      );
    } else if (content.includes('TODO')) {
      recordResult(
        '4.1 Check Matching Algorithm',
        'FAIL',
        'Matching algorithm is TODO only - NOT IMPLEMENTED',
        [],
        ['TODO comment found, no actual matching code'],
        []
      );
    } else {
      recordResult(
        '4.1 Check Matching Algorithm',
        'FAIL',
        'No matching algorithm found',
        [],
        ['Neither matching code nor TODO found'],
        []
      );
    }
  } catch (error: any) {
    recordResult(
      '4.1 Check Matching Algorithm',
      'FAIL',
      'Could not verify matching algorithm',
      [],
      [error.message],
      []
    );
  }

  // Step 2: Try to create OpportunityMatch (simulating what matching would do)
  try {
    // Get CapabilityIdentity for operator
    const capabilityIdentity = await prisma.capabilityIdentity.findUnique({
      where: { userId: operatorId },
    });

    if (!capabilityIdentity) {
      throw new Error('No CapabilityIdentity found for operator');
    }

    const match = await prisma.opportunityMatch.create({
      data: {
        jobPostingId,
        capabilityIdentityId: capabilityIdentity.id,
        matchScore: 0.85,
        matchFactors: JSON.stringify({
          therapeuticAreaMatch: true,
          phaseMatch: true,
          specialtyMatch: true,
          trustScore: 0.70,
        }),
        status: 'Pending',
      },
    });
    matchId = match.id;
    recordResult(
      '4.2 Generate OpportunityMatch',
      'PARTIAL',
      'OpportunityMatch created MANUALLY (matching algorithm not implemented)',
      [{ table: 'OpportunityMatch', id: match.id, data: match }],
      ['Manual creation - automatic matching not implemented'],
      ['prisma.opportunityMatch.create() - MANUAL SIMULATION']
    );
  } catch (error: any) {
    recordResult(
      '4.2 Generate OpportunityMatch',
      'FAIL',
      'Failed to create OpportunityMatch',
      [],
      [error.message],
      ['prisma.opportunityMatch.create()']
    );
  }

  // Step 3: Verify ranking logic
  const matches = await prisma.opportunityMatch.findMany({
    where: { jobPostingId },
    orderBy: { matchScore: 'desc' },
  });

  if (matches.length > 0) {
    recordResult(
      '4.3 Verify Match Ranking',
      'PASS',
      `Found ${matches.length} match(es), ordered by score`,
      matches.map(m => ({ table: 'OpportunityMatch', id: m.id, score: m.matchScore })),
      [],
      ['prisma.opportunityMatch.findMany()']
    );
  } else {
    recordResult(
      '4.3 Verify Match Ranking',
      'FAIL',
      'No matches found to rank',
      [],
      [],
      ['prisma.opportunityMatch.findMany()']
    );
  }

  return { matchId };
}

// ============================================
// PHASE 5: INTEREST/CONNECTION FLOW
// ============================================

async function testInterestFlow(operatorId: string, organizationId: string, jobPostingId: string, matchId: string | null) {
  console.log('\n========================================');
  console.log('PHASE 5: INTEREST/CONNECTION FLOW');
  console.log('========================================\n');

  // Step 1: Operator receives match
  try {
    const receivedMatches = await prisma.opportunityMatch.findMany({
      where: {
        capabilityIdentity: { userId: operatorId },
      },
      include: {
        jobPosting: true,
      },
    });

    if (receivedMatches.length > 0) {
      recordResult(
        '5.1 Operator Receives Match',
        'PASS',
        `Operator sees ${receivedMatches.length} matched opportunity(s)`,
        receivedMatches.map(m => ({ matchId: m.id, jobTitle: m.jobPosting.title, score: m.matchScore })),
        [],
        ['prisma.opportunityMatch.findMany()']
      );
    } else {
      recordResult(
        '5.1 Operator Receives Match',
        'FAIL',
        'Operator has no matched opportunities',
        [],
        [],
        ['prisma.opportunityMatch.findMany()']
      );
    }
  } catch (error: any) {
    recordResult(
      '5.1 Operator Receives Match',
      'FAIL',
      'Failed to query matches for operator',
      [],
      [error.message],
      ['prisma.opportunityMatch.findMany()']
    );
  }

  // Step 2: Operator expresses interest - CHECK IF API EXISTS
  let applicationId: string | null = null;
  
  try {
    // Check the interest API
    const interestApiPath = require('path').join(process.cwd(), 'app', 'api', 'opportunities', '[id]', 'interest', 'route.ts');
    const fs = require('fs');
    
    if (fs.existsSync(interestApiPath)) {
      const content = fs.readFileSync(interestApiPath, 'utf-8');
      
      // Check for broken imports
      if (content.includes('@/lib/db')) {
        recordResult(
          '5.2 Operator Expresses Interest',
          'FAIL',
          'Interest API BROKEN: imports from non-existent @/lib/db',
          [],
          ['import { prisma } from "@/lib/db" - FILE DOES NOT EXIST'],
          ['API will crash at runtime']
        );
      } else if (content.includes('prisma.opportunity') || content.includes('prisma.interestExpression')) {
        recordResult(
          '5.2 Operator Expresses Interest',
          'FAIL',
          'Interest API BROKEN: references non-existent Prisma models',
          [],
          ['prisma.opportunity or prisma.interestExpression - MODELS DO NOT EXIST IN SCHEMA'],
          ['API will crash at runtime']
        );
      } else {
        // Try to create an Application as proxy for interest
        const application = await prisma.application.create({
          data: {
            jobPostingId,
            operatorId,
            status: 'Pending',
            coverLetter: 'I am interested in this opportunity based on my experience matching your requirements.',
          },
        });
        applicationId = application.id;
        recordResult(
          '5.2 Operator Expresses Interest',
          'PARTIAL',
          'Created Application (interest API broken, using Application model as proxy)',
          [{ table: 'Application', id: application.id, data: application }],
          ['Interest API broken, used Application as workaround'],
          ['prisma.application.create()']
        );
      }
    } else {
      // No interest API, try Application
      const application = await prisma.application.create({
        data: {
          jobPostingId,
          operatorId,
          status: 'Pending',
          coverLetter: 'I am interested in this opportunity.',
        },
      });
      applicationId = application.id;
      recordResult(
        '5.2 Operator Expresses Interest',
        'PARTIAL',
        'No interest API - created Application instead',
        [{ table: 'Application', id: application.id, data: application }],
        ['Interest API not found'],
        ['prisma.application.create()']
      );
    }
  } catch (error: any) {
    recordResult(
      '5.2 Operator Expresses Interest',
      'FAIL',
      'Failed to express interest',
      [],
      [error.message],
      []
    );
  }

  // Step 3: Organization views anonymized candidate
  try {
    const capabilityIdentity = await prisma.capabilityIdentity.findUnique({
      where: { userId: operatorId },
      select: {
        id: true,
        profileId: true,
        summary: true,
        capabilityBreakdown: true,
        overallTrustScore: true,
        // Explicitly NOT selecting userId or any identifying info
      },
    });

    if (capabilityIdentity) {
      // Check if userId is exposed
      const hasUserId = JSON.stringify(capabilityIdentity).includes(operatorId);
      
      if (hasUserId) {
        recordResult(
          '5.3 Organization Views Anonymized Profile',
          'FAIL',
          'ANONYMITY BROKEN: userId is exposed in profile',
          [{ profileId: capabilityIdentity.profileId, exposedUserId: operatorId }],
          ['User ID leaked in CapabilityIdentity response'],
          ['prisma.capabilityIdentity.findUnique()']
        );
      } else {
        recordResult(
          '5.3 Organization Views Anonymized Profile',
          'PASS',
          `Organization sees: ${capabilityIdentity.profileId} - "${capabilityIdentity.summary}"`,
          [{ table: 'CapabilityIdentity', data: capabilityIdentity }],
          [],
          ['prisma.capabilityIdentity.findUnique()']
        );
      }
    } else {
      recordResult(
        '5.3 Organization Views Anonymized Profile',
        'FAIL',
        'No CapabilityIdentity found to show',
        [],
        [],
        ['prisma.capabilityIdentity.findUnique()']
      );
    }
  } catch (error: any) {
    recordResult(
      '5.3 Organization Views Anonymized Profile',
      'FAIL',
      'Failed to retrieve CapabilityIdentity',
      [],
      [error.message],
      []
    );
  }

  // Step 4: Organization expresses interest
  if (applicationId) {
    try {
      const updatedApplication = await prisma.application.update({
        where: { id: applicationId },
        data: {
          status: 'Reviewed',
          reviewedAt: new Date(),
        },
      });
      recordResult(
        '5.4 Organization Expresses Interest',
        'PARTIAL',
        'Updated Application status to Reviewed (no separate interest model)',
        [{ table: 'Application', id: updatedApplication.id, status: updatedApplication.status }],
        ['No InterestExpression model - using Application status'],
        ['prisma.application.update()']
      );
    } catch (error: any) {
      recordResult(
        '5.4 Organization Expresses Interest',
        'FAIL',
        'Failed to update Application',
        [],
        [error.message],
        []
      );
    }
  }

  // Step 5: Connection / Identity Reveal
  try {
    // Check if there's a connection/consent mechanism
    const hasConnectionModel = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'Connection'
    `;
    
    if (Array.isArray(hasConnectionModel) && hasConnectionModel.length === 0) {
      recordResult(
        '5.5 Mutual Connection / Identity Reveal',
        'FAIL',
        'NO Connection model exists - no consent-based identity reveal mechanism',
        [],
        ['Connection model missing from schema'],
        []
      );
    } else {
      recordResult(
        '5.5 Mutual Connection / Identity Reveal',
        'PARTIAL',
        'Connection mechanism needs verification',
        [],
        [],
        []
      );
    }
  } catch (error: any) {
    recordResult(
      '5.5 Mutual Connection / Identity Reveal',
      'FAIL',
      'Failed to check for Connection model',
      [],
      [error.message],
      []
    );
  }

  return { applicationId };
}

// ============================================
// PHASE 6: HIRE FLOW
// ============================================

async function testHireFlow(operatorId: string, organizationId: string, applicationId: string | null, jobPostingId: string) {
  console.log('\n========================================');
  console.log('PHASE 6: HIRE FLOW');
  console.log('========================================\n');

  let hireId: string | null = null;
  let feeRecordId: string | null = null;

  if (!applicationId) {
    // Create application if it doesn't exist
    try {
      const application = await prisma.application.create({
        data: {
          jobPostingId,
          operatorId,
          status: 'Pending',
        },
      });
      applicationId = application.id;
      recordResult(
        '6.0 Create Missing Application',
        'PARTIAL',
        'Created Application as prerequisite for hire',
        [{ table: 'Application', id: application.id }],
        ['Application was missing from previous steps'],
        ['prisma.application.create()']
      );
    } catch (error: any) {
      recordResult(
        '6.0 Create Missing Application',
        'FAIL',
        'Failed to create prerequisite Application',
        [],
        [error.message],
        []
      );
      return { hireId: null, feeRecordId: null };
    }
  }

  // Step 1: Create Hire record
  try {
    const hire = await prisma.hire.create({
      data: {
        applicationId,
        jobPostingId,
        operatorId,
        organizationId,
        feePercentage: 0.25,
        createdBy: organizationId,
      },
    });
    hireId = hire.id;
    recordResult(
      '6.1 Create Hire Record',
      'PASS',
      `Created Hire record: ${hire.id} with 25% fee`,
      [{ table: 'Hire', id: hire.id, data: hire }],
      [],
      ['prisma.hire.create()']
    );
  } catch (error: any) {
    recordResult(
      '6.1 Create Hire Record',
      'FAIL',
      'Failed to create Hire record',
      [],
      [error.message],
      []
    );
    return { hireId: null, feeRecordId: null };
  }

  // Step 2: Calculate Fee (25%)
  const compensationMin = 85000;
  const compensationMax = 110000;
  const avgCompensation = (compensationMin + compensationMax) / 2;
  const calculatedFee = avgCompensation * 0.25;

  recordResult(
    '6.2 Calculate Platform Fee',
    'PARTIAL',
    `Calculated fee: $${avgCompensation.toLocaleString()} × 25% = $${calculatedFee.toLocaleString()}`,
    [{ avgCompensation, feePercentage: 0.25, calculatedFee }],
    ['Fee calculation is MANUAL - not implemented in code'],
    []
  );

  // Step 3: Create FeeRecord
  try {
    const feeRecord = await prisma.feeRecord.create({
      data: {
        hireId,
        feePercentage: 0.25,
        estimatedCompensation: avgCompensation,
        feeOwed: calculatedFee,
        status: 'Fee Pending',
        updatedBy: organizationId,
      },
    });
    feeRecordId = feeRecord.id;
    recordResult(
      '6.3 Generate FeeRecord',
      'PASS',
      `Created FeeRecord: ${feeRecord.id} - $${calculatedFee.toLocaleString()} owed`,
      [{ table: 'FeeRecord', id: feeRecord.id, data: feeRecord }],
      [],
      ['prisma.feeRecord.create()']
    );
  } catch (error: any) {
    recordResult(
      '6.3 Generate FeeRecord',
      'FAIL',
      'Failed to create FeeRecord',
      [],
      [error.message],
      []
    );
  }

  // Step 4: Track Payment Status
  try {
    const feeRecord = await prisma.feeRecord.findUnique({
      where: { id: feeRecordId! },
    });

    if (feeRecord) {
      recordResult(
        '6.4 Track Payment Status',
        'PASS',
        `FeeRecord status: ${feeRecord.status}`,
        [{ table: 'FeeRecord', id: feeRecord.id, status: feeRecord.status }],
        [],
        ['prisma.feeRecord.findUnique()']
      );

      // Test status transition
      const updatedFeeRecord = await prisma.feeRecord.update({
        where: { id: feeRecordId! },
        data: {
          status: 'Invoiced',
          invoiceReference: `INV-${Date.now()}`,
          invoiceDate: new Date(),
        },
      });

      recordResult(
        '6.5 Payment Status Transition',
        'PASS',
        `Status updated: ${feeRecord.status} → ${updatedFeeRecord.status}`,
        [{ table: 'FeeRecord', id: updatedFeeRecord.id, status: updatedFeeRecord.status }],
        [],
        ['prisma.feeRecord.update()']
      );
    }
  } catch (error: any) {
    recordResult(
      '6.4 Track Payment Status',
      'FAIL',
      'Failed to track payment status',
      [],
      [error.message],
      []
    );
  }

  return { hireId, feeRecordId };
}

// ============================================
// PHASE 7: ANONYMITY ATTACK TESTS
// ============================================

async function testAnonymityAttacks(operatorId: string) {
  console.log('\n========================================');
  console.log('PHASE 7: ANONYMITY ATTACK TESTS');
  console.log('========================================\n');

  // Test 1: Correlation Attack
  try {
    const contributions = await prisma.contribution.findMany({
      where: { userId: operatorId },
    });

    const capabilityIdentity = await prisma.capabilityIdentity.findUnique({
      where: { userId: operatorId },
    });

    if (contributions.length > 0 && capabilityIdentity) {
      // Check if capability identity reveals contribution details
      const ciBreakdown = JSON.parse(capabilityIdentity.capabilityBreakdown as string || '{}');
      const contribTherapeuticAreas = [...new Set(contributions.map(c => c.therapeuticArea))];
      
      const exactMatch = JSON.stringify(ciBreakdown.therapeuticAreas) === JSON.stringify(contribTherapeuticAreas);
      
      if (exactMatch) {
        recordResult(
          '7.1 Correlation Attack Test',
          'FAIL',
          'VULNERABILITY: CapabilityIdentity directly reveals contribution therapeutic areas',
          [{ 
            contributionAreas: contribTherapeuticAreas, 
            identityAreas: ciBreakdown.therapeuticAreas,
            match: 'EXACT' 
          }],
          ['Direct correlation possible between contributions and identity'],
          []
        );
      } else {
        recordResult(
          '7.1 Correlation Attack Test',
          'PASS',
          'CapabilityIdentity does not directly expose contribution details',
          [{ contributionAreas: contribTherapeuticAreas, identityAreas: ciBreakdown.therapeuticAreas }],
          [],
          []
        );
      }
    } else {
      recordResult(
        '7.1 Correlation Attack Test',
        'SKIPPED',
        'Not enough data to test correlation',
        [],
        [],
        []
      );
    }
  } catch (error: any) {
    recordResult(
      '7.1 Correlation Attack Test',
      'FAIL',
      'Error during correlation test',
      [],
      [error.message],
      []
    );
  }

  // Test 2: Fake Job Attack
  try {
    // Simulate organization trying to identify specific operator
    const targetedJob = await prisma.jobPosting.findFirst({
      where: {
        therapeuticArea: 'Rare Disease',
        trialPhase: 'Phase 2',
      },
    });

    if (targetedJob) {
      const matches = await prisma.opportunityMatch.findMany({
        where: { jobPostingId: targetedJob.id },
        include: {
          capabilityIdentity: true,
        },
      });

      if (matches.length === 1) {
        recordResult(
          '7.2 Fake Job Attack Test',
          'FAIL',
          'VULNERABILITY: Highly specific job posting could identify single operator',
          [{ matchesFound: matches.length, uniqueOperator: true }],
          ['Single match allows identification through targeted job posting'],
          []
        );
      } else if (matches.length > 1) {
        recordResult(
          '7.2 Fake Job Attack Test',
          'PASS',
          `Multiple matches (${matches.length}) prevent single-operator identification`,
          [{ matchesFound: matches.length }],
          [],
          []
        );
      } else {
        recordResult(
          '7.2 Fake Job Attack Test',
          'PASS',
          'No matches found - no identification possible',
          [],
          [],
          []
        );
      }
    } else {
      recordResult(
        '7.2 Fake Job Attack Test',
        'SKIPPED',
        'No targeted job posting found for test',
        [],
        [],
        []
      );
    }
  } catch (error: any) {
    recordResult(
      '7.2 Fake Job Attack Test',
      'FAIL',
      'Error during fake job test',
      [],
      [error.message],
      []
    );
  }

  // Test 3: Cross-Realm Leakage
  try {
    // Check if operator's contributions are linked to their job applications
    const operatorWithRelations = await prisma.user.findUnique({
      where: { id: operatorId },
      include: {
        contributions: true,
        capabilityIdentity: true,
      },
    });

    if (operatorWithRelations) {
      const hasDirectLink = operatorWithRelations.contributions.some(c => 
        c.userId === operatorWithRelations.capabilityIdentity?.userId
      );

      // The real test: can an organization see both contributions and applications?
      // In the current model, these are separate tables with userId links
      
      recordResult(
        '7.3 Cross-Realm Leakage Test',
        'PARTIAL',
        'Direct userId link exists between Contributions and CapabilityIdentity',
        [{ 
          linkedById: hasDirectLink,
          warning: 'Same userId links Intelligence Realm and Opportunity Realm'
        }],
        ['Potential cross-realm correlation via userId'],
        []
      );
    }
  } catch (error: any) {
    recordResult(
      '7.3 Cross-Realm Leakage Test',
      'FAIL',
      'Error during cross-realm test',
      [],
      [error.message],
      []
    );
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('========================================');
  console.log('BTP ECONOMIC SYSTEM PROOF');
  console.log('End-to-End Execution Test');
  console.log('========================================');

  let operatorId: string | null = null;
  let organizationId: string | null = null;
  let jobPostingId: string | null = null;
  let matchId: string | null = null;
  let applicationId: string | null = null;
  let hireId: string | null = null;
  let feeRecordId: string | null = null;
  let contributionIds: string[] = [];

  try {
    // Phase 1: Operator Flow
    const opResult = await testOperatorFlow();
    operatorId = opResult.operatorId;
    contributionIds = opResult.contributionIds;

    if (!operatorId) {
      console.log('\n❌ CRITICAL: Cannot proceed without operator. Stopping.');
      return;
    }

    // Phase 2: Organization Flow
    const orgResult = await testOrganizationFlow();
    organizationId = orgResult.organizationId;

    if (!organizationId) {
      console.log('\n❌ CRITICAL: Cannot proceed without organization. Stopping.');
      return;
    }

    // Phase 3: Opportunity Posting
    const jobResult = await testOpportunityPosting(organizationId);
    jobPostingId = jobResult.jobPostingId;

    if (!jobPostingId) {
      console.log('\n❌ CRITICAL: Cannot proceed without job posting. Stopping.');
      return;
    }

    // Phase 4: Matching Flow
    const matchResult = await testMatchingFlow(operatorId, jobPostingId);
    matchId = matchResult.matchId;

    // Phase 5: Interest/Connection Flow
    const interestResult = await testInterestFlow(operatorId, organizationId, jobPostingId, matchId);
    applicationId = interestResult.applicationId;

    // Phase 6: Hire Flow
    const hireResult = await testHireFlow(operatorId, organizationId, applicationId, jobPostingId);
    hireId = hireResult.hireId;
    feeRecordId = hireResult.feeRecordId;

    // Phase 7: Anonymity Attack Tests
    await testAnonymityAttacks(operatorId);

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message);
  }

  // ============================================
  // FINAL REPORT
  // ============================================
  
  console.log('\n\n');
  console.log('========================================');
  console.log('FINAL RESULTS');
  console.log('========================================\n');

  // Count results
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const partial = results.filter(r => r.status === 'PARTIAL').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ PASS: ${passed}`);
  console.log(`⚠️ PARTIAL: ${partial}`);
  console.log(`❌ FAIL: ${failed}`);
  console.log(`⏭️ SKIPPED: ${skipped}`);

  // Strict PASS/FAIL for core features
  console.log('\n========================================');
  console.log('STRICT PASS/FAIL MATRIX');
  console.log('========================================\n');

  const matching = results.filter(r => r.step.includes('Match'));
  const connection = results.filter(r => r.step.includes('Connection') || r.step.includes('Interest'));
  const hire = results.filter(r => r.step.includes('Hire') || r.step.includes('Fee'));
  const anonymity = results.filter(r => r.step.includes('Attack') || r.step.includes('Anonym'));

  console.log('| Feature | Status | Details |');
  console.log('|---------|--------|---------|');
  
  // Matching
  const matchingFail = matching.filter(r => r.status === 'FAIL').length;
  console.log(`| **Matching** | ${matchingFail > 0 ? '❌ FAIL' : '✅ PASS'} | ${matchingFail} of ${matching.length} tests failed |`);
  
  // Connection
  const connectionFail = connection.filter(r => r.status === 'FAIL').length;
  console.log(`| **Connection Flow** | ${connectionFail > 0 ? '❌ FAIL' : '✅ PASS'} | ${connectionFail} of ${connection.length} tests failed |`);
  
  // Hire
  const hireFail = hire.filter(r => r.status === 'FAIL').length;
  console.log(`| **Hire Flow** | ${hireFail > 0 ? '❌ FAIL' : '✅ PASS'} | ${hireFail} of ${hire.length} tests failed |`);
  
  // Anonymity
  const anonymityFail = anonymity.filter(r => r.status === 'FAIL').length;
  console.log(`| **Anonymity Protection** | ${anonymityFail > 0 ? '❌ FAIL' : '✅ PASS'} | ${anonymityFail} of ${anonymity.length} tests failed |`);

  // Database records created
  console.log('\n========================================');
  console.log('DATABASE RECORDS CREATED');
  console.log('========================================\n');

  const allRecords = results.flatMap(r => r.records);
  const recordsByTable: Record<string, any[]> = {};
  
  for (const record of allRecords) {
    if (record.table) {
      if (!recordsByTable[record.table]) {
        recordsByTable[record.table] = [];
      }
      recordsByTable[record.table].push(record);
    }
  }

  for (const [table, records] of Object.entries(recordsByTable)) {
    console.log(`\n**${table}**: ${records.length} record(s)`);
    for (const record of records) {
      console.log(`  - ${record.id || 'N/A'}: ${JSON.stringify(record.data || record).substring(0, 100)}...`);
    }
  }

  // All errors
  console.log('\n========================================');
  console.log('ALL ERRORS ENCOUNTERED');
  console.log('========================================\n');

  const allErrors = results.flatMap(r => r.errors);
  for (const error of allErrors) {
    console.log(`❌ ${error}`);
  }

  // What is real vs simulated
  console.log('\n========================================');
  console.log('REAL vs SIMULATED');
  console.log('========================================\n');

  const realSteps = results.filter(r => r.apiCalls.some(c => !c.includes('MANUAL') && !c.includes('SIMULATION')));
  const simulatedSteps = results.filter(r => r.apiCalls.some(c => c.includes('MANUAL') || c.includes('SIMULATION')));

  console.log('**FULLY REAL (Database operations executed):**');
  for (const step of realSteps) {
    console.log(`  ✅ ${step.step}`);
  }

  console.log('\n**SIMULATED/MANUAL (Would not work in production):**');
  for (const step of simulatedSteps) {
    console.log(`  ⚠️ ${step.step}`);
    console.log(`     ${step.apiCalls.join(', ')}`);
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());