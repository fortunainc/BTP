/**
 * BTP Economic System Proof - CODE ANALYSIS
 * 
 * This script PROVES whether BTP works by analyzing the ACTUAL CODE.
 * No database needed - we trace the execution paths and prove what exists.
 * 
 * Run with: npx tsx test-economic-flow-code.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// TEST RESULTS TRACKING
// ============================================

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'PARTIAL' | 'SKIPPED';
  evidence: string;
  codeFound?: string;
  issues: string[];
}

const results: TestResult[] = [];

function recordResult(
  step: string, 
  status: TestResult['status'], 
  evidence: string,
  codeFound?: string,
  issues: string[] = []
) {
  results.push({ step, status, evidence, codeFound, issues });
  console.log(`\n[${status}] ${step}`);
  console.log(`  ${evidence}`);
  if (issues.length > 0) {
    console.log(`  Issues: ${issues.join('; ')}`);
  }
}

function readFile(filePath: string): string | null {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    return null;
  } catch (e) {
    return null;
  }
}

function grepFiles(dir: string, pattern: RegExp, filePattern: string = '.ts'): { file: string; line: string; match: string }[] {
  const results: { file: string; line: string; match: string }[] = [];
  
  function walk(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            walk(fullPath);
          }
        } else if (entry.name.endsWith(filePattern)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(pattern);
            if (match) {
              results.push({
                file: fullPath.replace(process.cwd(), ''),
                line: `${i + 1}`,
                match: match[0]
              });
            }
          }
        }
      }
    } catch (e) {}
  }
  
  walk(dir);
  return results;
}

// ============================================
// PHASE 1: OPERATOR FLOW
// ============================================

function testOperatorFlow() {
  console.log('\n========================================');
  console.log('PHASE 1: OPERATOR FLOW');
  console.log('========================================\n');

  // 1.1 Create Operator - Check User model and API
  const userSchema = readFile('prisma/schema.prisma');
  if (userSchema?.includes('model User')) {
    const hasClerkId = userSchema.includes('clerkId');
    const hasUserRole = userSchema.includes('userRole');
    const hasRoleCategory = userSchema.includes('roleCategory');
    
    recordResult(
      '1.1 Create Operator User',
      'PASS',
      `User model exists with fields: clerkId=${hasClerkId}, userRole=${hasUserRole}, roleCategory=${hasRoleCategory}`,
      userSchema.match(/model User \{[^}]+\}/s)?.[0]?.substring(0, 500),
      []
    );
  } else {
    recordResult('1.1 Create Operator User', 'FAIL', 'User model not found in schema', undefined, ['Schema missing User model']);
  }

  // 1.2 Submit Situations - Check Contribution model and API
  const contributionSchema = userSchema?.match(/model Contribution \{[^}]+\}/s)?.[0];
  if (contributionSchema) {
    const hasContributionType = contributionSchema.includes('contributionType');
    const hasTherapeuticArea = contributionSchema.includes('therapeuticArea');
    
    const situationsApi = readFile('app/api/situations/route.ts');
    const hasCreateHandler = situationsApi?.includes('POST') || situationsApi?.includes('create');
    
    recordResult(
      '1.2 Submit Situations',
      hasCreateHandler ? 'PASS' : 'PARTIAL',
      `Contribution model exists. API create handler: ${hasCreateHandler}`,
      contributionSchema.substring(0, 300),
      hasCreateHandler ? [] : ['No POST handler found in situations API']
    );
  }

  // 1.3 TrustVector - Check if update function exists
  const trustVectorLib = readFile('lib/trust-vector.ts');
  if (trustVectorLib) {
    const hasUpdateFunction = trustVectorLib.includes('export') && trustVectorLib.includes('updateTrustVector');
    const hasDimensions = trustVectorLib.includes('quality') && trustVectorLib.includes('reliability');
    const hasCalculation = trustVectorLib.includes('overallScore') || trustVectorLib.includes('calculate');
    
    recordResult(
      '1.3 Build TrustVector',
      hasUpdateFunction && hasCalculation ? 'PASS' : 'PARTIAL',
      `updateTrustVector function: ${hasUpdateFunction}. Calculation logic: ${hasCalculation}`,
      trustVectorLib.substring(0, 500),
      !hasUpdateFunction ? ['No exported updateTrustVector function'] : []
    );
  } else {
    recordResult('1.3 Build TrustVector', 'FAIL', 'lib/trust-vector.ts not found', undefined, ['File missing']);
  }

  // 1.4 CapabilityIdentity - Check if generation function exists
  const capabilityLib = readFile('lib/capability-identity.ts');
  if (capabilityLib) {
    const hasGenerateFunction = capabilityLib.includes('generateCapabilityIdentity') || capabilityLib.includes('createCapabilityIdentity');
    const hasProfileId = capabilityLib.includes('profileId') || capabilityLib.includes('CAP-');
    const hasAnonymization = !capabilityLib.includes('userId') || capabilityLib.includes('select');
    
    recordResult(
      '1.4 Generate CapabilityIdentity',
      hasGenerateFunction ? 'PASS' : 'PARTIAL',
      `Generation function: ${hasGenerateFunction}. Profile ID: ${hasProfileId}`,
      capabilityLib.substring(0, 500),
      []
    );
  } else {
    recordResult('1.4 Generate CapabilityIdentity', 'FAIL', 'lib/capability-identity.ts not found', undefined, ['File missing']);
  }
}

// ============================================
// PHASE 2: ORGANIZATION FLOW
// ============================================

function testOrganizationFlow() {
  console.log('\n========================================');
  console.log('PHASE 2: ORGANIZATION FLOW');
  console.log('========================================\n');

  // 2.1 Create Organization - Check if userRole can be 'organization'
  const userSchema = readFile('prisma/schema.prisma');
  const hasOrgRole = userSchema?.includes('organization') && userSchema?.includes('userRole');
  
  recordResult(
    '2.1 Create Organization User',
    hasOrgRole ? 'PASS' : 'FAIL',
    hasOrgRole ? 'userRole field supports "organization" value' : 'Cannot create organization users',
    userSchema?.match(/userRole\s+String/)?.[0],
    hasOrgRole ? [] : ['No organization role support found']
  );

  // 2.2 Post Opportunity - Check JobPosting model and API
  const jobPostingSchema = userSchema?.match(/model JobPosting \{[^}]+\}/s)?.[0];
  const opportunitiesApi = readFile('app/api/opportunities/route.ts');
  const jobPostingsApi = readFile('app/api/job-postings/route.ts');
  
  if (jobPostingSchema) {
    const hasOrgId = jobPostingSchema.includes('organizationId');
    const hasStatus = jobPostingSchema.includes('status');
    const hasCompensation = jobPostingSchema.includes('compensation');
    
    const activeApi = opportunitiesApi || jobPostingsApi;
    const hasPostHandler = activeApi?.includes('POST') || activeApi?.includes('create');
    
    recordResult(
      '2.2 Post Opportunity (JobPosting)',
      hasPostHandler && hasOrgId ? 'PASS' : 'PARTIAL',
      `JobPosting model: ${!!jobPostingSchema}. POST handler: ${hasPostHandler}`,
      jobPostingSchema?.substring(0, 400),
      !hasPostHandler ? ['No POST handler for creating opportunities'] : []
    );
  } else {
    recordResult('2.2 Post Opportunity', 'FAIL', 'JobPosting model not found', undefined, ['Schema missing JobPosting']);
  }
}

// ============================================
// PHASE 3: MATCHING FLOW
// ============================================

function testMatchingFlow() {
  console.log('\n========================================');
  console.log('PHASE 3: MATCHING FLOW');
  console.log('========================================\n');

  // 3.1 Check OpportunityMatch model
  const userSchema = readFile('prisma/schema.prisma');
  const matchSchema = userSchema?.match(/model OpportunityMatch \{[^}]+\}/s)?.[0];
  
  if (matchSchema) {
    const hasScore = matchSchema.includes('matchScore');
    const hasStatus = matchSchema.includes('status');
    const hasJobPostingId = matchSchema.includes('jobPostingId');
    const hasCapabilityId = matchSchema.includes('capabilityIdentityId');
    
    recordResult(
      '3.1 OpportunityMatch Model',
      'PASS',
      `Schema has: matchScore=${hasScore}, status=${hasStatus}, jobPostingId=${hasJobPostingId}, capabilityIdentityId=${hasCapabilityId}`,
      matchSchema.substring(0, 400),
      []
    );
  } else {
    recordResult('3.1 OpportunityMatch Model', 'FAIL', 'OpportunityMatch model not found in schema', undefined, ['Model missing']);
  }

  // 3.2 Check if matching algorithm EXISTS and CREATES matches
  console.log('\n  --- SEARCHING FOR MATCHING ALGORITHM ---');
  
  const opportunitiesApi = readFile('app/api/opportunities/route.ts');
  
  // Look for OpportunityMatch creation
  const allTsFiles = grepFiles(path.join(process.cwd(), 'app'), /prisma\.opportunityMatch\.create/, '.ts');
  const allLibFiles = grepFiles(path.join(process.cwd(), 'lib'), /opportunityMatch/, '.ts');
  
  if (allTsFiles.length > 0) {
    recordResult(
      '3.2 Matching Algorithm Implementation',
      'PASS',
      `Found ${allTsFiles.length} places where OpportunityMatch is created`,
      allTsFiles.map(f => `${f.file}:${f.line}`).join('\n'),
      []
    );
  } else {
    // Check for TODO
    const todoMatches = grepFiles(path.join(process.cwd()), /TODO.*match/i, '.ts');
    const matchingTodos = todoMatches.filter(t => t.match.toLowerCase().includes('match'));
    
    if (matchingTodos.length > 0) {
      recordResult(
        '3.2 Matching Algorithm Implementation',
        'FAIL',
        'NO OpportunityMatch.create() found. Only TODO comments exist.',
        matchingTodos.map(t => `${t.file}:${t.line}: ${t.match}`).join('\n'),
        ['Matching algorithm is NOT IMPLEMENTED - only TODO comment']
      );
    } else {
      recordResult(
        '3.2 Matching Algorithm Implementation',
        'FAIL',
        'NO matching algorithm found anywhere in codebase',
        undefined,
        ['No prisma.opportunityMatch.create() found', 'No matching-related TODO found']
      );
    }
  }

  // 3.3 Check if matching triggers automatically on opportunity creation
  if (opportunitiesApi) {
    const hasTrigger = opportunitiesApi.includes('opportunityMatch') && opportunitiesApi.includes('create');
    const hasBackgroundJob = opportunitiesApi.includes('background') || opportunitiesApi.includes('queue') || opportunitiesApi.includes('job');
    const hasTodo = opportunitiesApi.includes('TODO');
    
    recordResult(
      '3.3 Automatic Matching Trigger',
      hasTrigger ? 'PASS' : 'FAIL',
      hasTrigger ? 'Matching triggers on opportunity creation' : 
        hasTodo ? 'TODO comment says matching should happen but DOES NOT' :
        'No automatic matching trigger',
      opportunitiesApi?.match(/TODO[^}]+/)?.[0] || 'No matching code found',
      !hasTrigger ? ['Opportunity creation does NOT trigger matching'] : []
    );
  }
}

// ============================================
// PHASE 4: INTEREST/CONNECTION FLOW
// ============================================

function testInterestFlow() {
  console.log('\n========================================');
  console.log('PHASE 4: INTEREST/CONNECTION FLOW');
  console.log('========================================\n');

  // 4.1 Operator views matches - Check API endpoint
  const matchesApi = readFile('app/api/matches/route.ts');
  const workforceMatches = readFile('app/workforce/matches/page.tsx');
  
  if (matchesApi || workforceMatches) {
    recordResult(
      '4.1 Operator Views Matches',
      'PASS',
      'Matches API or page exists',
      matchesApi?.substring(0, 300) || workforceMatches?.substring(0, 300),
      []
    );
  } else {
    // Check if OpportunityMatch is queryable
    const matchQueries = grepFiles(path.join(process.cwd(), 'app'), /prisma\.opportunityMatch\.findMany/, '.ts');
    recordResult(
      '4.1 Operator Views Matches',
      matchQueries.length > 0 ? 'PARTIAL' : 'FAIL',
      matchQueries.length > 0 ? `${matchQueries.length} places query OpportunityMatch` : 'No way for operator to view matches',
      matchQueries[0]?.file,
      matchQueries.length === 0 ? ['No API for operators to view their matches'] : []
    );
  }

  // 4.2 Operator expresses interest - CRITICAL CHECK
  console.log('\n  --- CHECKING INTEREST API ---');
  
  const interestApi = readFile('app/api/opportunities/[id]/interest/route.ts');
  
  if (interestApi) {
    // Check for broken imports
    const hasBrokenImport = interestApi.includes('@/lib/db');
    const hasBrokenModel = interestApi.includes('prisma.opportunity') || interestApi.includes('prisma.interestExpression');
    
    if (hasBrokenImport) {
      recordResult(
        '4.2 Operator Expresses Interest',
        'FAIL',
        'Interest API imports from NON-EXISTENT @/lib/db - WILL CRASH',
        interestApi.match(/import.*@\/lib\/db/)?.[0],
        ['import { prisma } from "@/lib/db" - THIS FILE DOES NOT EXIST', 'API will throw runtime error']
      );
    } else if (hasBrokenModel) {
      recordResult(
        '4.2 Operator Expresses Interest',
        'FAIL',
        'Interest API uses NON-EXISTENT Prisma models - WILL CRASH',
        interestApi.match(/prisma\.(opportunity|interestExpression)/g)?.join(', '),
        ['prisma.opportunity - MODEL DOES NOT EXIST IN SCHEMA', 'prisma.interestExpression - MODEL DOES NOT EXIST IN SCHEMA']
      );
    } else {
      recordResult(
        '4.2 Operator Expresses Interest',
        'PASS',
        'Interest API exists with valid imports',
        interestApi.substring(0, 300),
        []
      );
    }
  } else {
    recordResult(
      '4.2 Operator Expresses Interest',
      'FAIL',
      'Interest API not found',
      undefined,
      ['app/api/opportunities/[id]/interest/route.ts does not exist']
    );
  }

  // 4.3 Organization views candidates - Check API
  const orgCandidatesApi = readFile('app/api/applications/organization-applications/route.ts');
  const myPostingsApi = readFile('app/api/job-postings/my-postings/route.ts');
  
  if (orgCandidatesApi) {
    const hasFindMany = orgCandidatesApi.includes('findMany');
    const hasInclude = orgCandidatesApi.includes('include');
    
    recordResult(
      '4.3 Organization Views Candidates',
      hasFindMany ? 'PASS' : 'PARTIAL',
      `Organization can view applications: ${hasFindMany}`,
      orgCandidatesApi.substring(0, 300),
      []
    );
  } else {
    recordResult(
      '4.3 Organization Views Candidates',
      'FAIL',
      'No API for organization to view candidates',
      undefined,
      ['Missing organization-applications API']
    );
  }

  // 4.4 Mutual connection / Identity reveal
  const schemaContent = readFile('prisma/schema.prisma');
  const connections = grepFiles(path.join(process.cwd()), /Connection|consent|reveal|identity/, '.ts');
  const hasConnectionModel = schemaContent?.includes('model Connection');
  
  recordResult(
    '4.4 Mutual Connection / Identity Reveal',
    hasConnectionModel ? 'PARTIAL' : 'FAIL',
    hasConnectionModel ? 'Connection model exists' : 'NO Connection model - no consent-based identity reveal',
    undefined,
    ['No mechanism for mutual consent before identity reveal']
  );
}

// ============================================
// PHASE 5: HIRE FLOW
// ============================================

function testHireFlow() {
  console.log('\n========================================');
  console.log('PHASE 5: HIRE FLOW');
  console.log('========================================\n');

  const userSchema = readFile('prisma/schema.prisma');
  
  // 5.1 Hire record creation
  const hireSchema = userSchema?.match(/model Hire \{[^}]+\}/s)?.[0];
  const applicationsApi = readFile('app/api/applications/[id]/route.ts');
  
  if (hireSchema) {
    const hasFeePercentage = hireSchema.includes('feePercentage');
    const hasApplicationId = hireSchema.includes('applicationId');
    
    // Check if Hire is created automatically
    const hireCreation = grepFiles(path.join(process.cwd()), /prisma\.hire\.create/, '.ts');
    
    recordResult(
      '5.1 Hire Record Creation',
      hireCreation.length > 0 ? 'PASS' : 'PARTIAL',
      `Hire model exists. Found ${hireCreation.length} places creating Hire records`,
      hireSchema.substring(0, 300),
      []
    );
    
    // Show where Hire is created
    if (hireCreation.length > 0) {
      console.log(`  \n  Hire creation found at:`);
      hireCreation.forEach(h => console.log(`    ${h.file}:${h.line}`));
    }
  }

  // 5.2 Fee calculation
  const feeSchema = userSchema?.match(/model FeeRecord \{[^}]+\}/s)?.[0];
  
  if (feeSchema) {
    const hasFeeOwed = feeSchema.includes('feeOwed');
    const hasFeePercentage = feeSchema.includes('feePercentage');
    const hasStatus = feeSchema.includes('status');
    
    // Check if fee is CALCULATED (not just stored)
    const feeCalculation = grepFiles(path.join(process.cwd()), /feeOwed\s*=|calculatedFee|fee\s*\*/, '.ts');
    
    recordResult(
      '5.2 Fee Calculation (25%)',
      feeCalculation.length > 0 ? 'PASS' : 'FAIL',
      feeCalculation.length > 0 ? `Fee calculation found in ${feeCalculation.length} places` : 'NO fee calculation code found',
      feeCalculation[0]?.file,
      feeCalculation.length === 0 ? ['feeOwed field exists but is NEVER calculated', 'Fee would be $0 or undefined'] : []
    );
  }

  // 5.3 FeeRecord creation
  const feeRecordCreation = grepFiles(path.join(process.cwd()), /prisma\.feeRecord\.create/, '.ts');
  
  if (feeRecordCreation.length > 0) {
    recordResult(
      '5.3 FeeRecord Generation',
      'PASS',
      `FeeRecord creation found in ${feeRecordCreation.length} places`,
      feeRecordCreation.map(f => `${f.file}:${f.line}`).join('\n'),
      []
    );
    
    // Check if it's tied to Hire
    const applicationsIdRoute = readFile('app/api/applications/[id]/route.ts');
    const createsFeeWithHire = applicationsIdRoute?.includes('Hired') && applicationsIdRoute?.includes('feeRecord.create');
    
    if (createsFeeWithHire) {
      recordResult(
        '5.4 Automatic FeeRecord on Hire',
        'PASS',
        'FeeRecord is created automatically when Application status changes to "Hired"',
        applicationsIdRoute?.match(/status.*Hired[^}]+feeRecord\.create/s)?.[0]?.substring(0, 200),
        []
      );
    }
  } else {
    recordResult(
      '5.3 FeeRecord Generation',
      'FAIL',
      'NO FeeRecord creation found',
      undefined,
      ['No code creates FeeRecord']
    );
  }

  // 5.5 Payment status tracking
  const feeRecordApi = readFile('app/api/fee-records/[id]/route.ts');
  
  if (feeRecordApi) {
    const hasUpdate = feeRecordApi.includes('update');
    const hasStatusUpdate = feeRecordApi.includes('status');
    
    recordResult(
      '5.5 Payment Status Tracking',
      hasUpdate && hasStatusUpdate ? 'PASS' : 'PARTIAL',
      `FeeRecord API has update capability: ${hasUpdate}`,
      feeRecordApi.substring(0, 300),
      []
    );
  }
}

// ============================================
// PHASE 6: ANONYMITY ATTACK TESTS
// ============================================

function testAnonymityAttacks() {
  console.log('\n========================================');
  console.log('PHASE 6: ANONYMITY ATTACK TESTS');
  console.log('========================================\n');

  // 6.1 Check if userId is exposed in CapabilityIdentity
  const capabilityLib = readFile('lib/capability-identity.ts');
  const userSchema = readFile('prisma/schema.prisma');
  
  const ciSchema = userSchema?.match(/model CapabilityIdentity \{[^}]+\}/s)?.[0];
  
  if (ciSchema) {
    const hasUserId = ciSchema.includes('userId');
    
    recordResult(
      '6.1 User ID in CapabilityIdentity',
      hasUserId ? 'FAIL' : 'PASS',
      hasUserId ? 'VULNERABILITY: userId is stored in CapabilityIdentity' : 'CapabilityIdentity does not store userId',
      ciSchema.substring(0, 200),
      hasUserId ? ['Direct correlation: CapabilityIdentity.userId links to User.id', 'Organization could de-anonymize candidates'] : []
    );
  }

  // 6.2 Check correlation protection
  const antiCorrelation = readFile('lib/anti-correlation.ts');
  
  if (antiCorrelation) {
    const hasCalculateRisk = antiCorrelation.includes('calculateCorrelationRisk');
    const hasRedaction = antiCorrelation.includes('redact') || antiCorrelation.includes('Redact');
    
    recordResult(
      '6.2 Correlation Protection',
      hasCalculateRisk ? 'PASS' : 'PARTIAL',
      `Anti-correlation library exists. Risk calculation: ${hasCalculateRisk}`,
      antiCorrelation.substring(0, 300),
      []
    );
  } else {
    recordResult(
      '6.2 Correlation Protection',
      'PARTIAL',
      'No anti-correlation library found',
      undefined,
      ['lib/anti-correlation.ts not found']
    );
  }

  // 6.3 Check cross-realm data leakage
  // Intelligence Realm = Contributions (anonymous)
  // Opportunity Realm = Applications, JobPostings (can have org identity)
  
  const applicationSchema = userSchema?.match(/model Application \{[^}]+\}/s)?.[0];
  
  if (applicationSchema) {
    const hasOperatorId = applicationSchema.includes('operatorId');
    
    // Check if operatorId in Application links to the same User as contributions
    const contributionSchema = userSchema?.match(/model Contribution \{[^}]+\}/s)?.[0];
    const contributionHasUserId = contributionSchema?.includes('userId');
    
    if (hasOperatorId && contributionHasUserId) {
      recordResult(
        '6.3 Cross-Realm Data Leakage',
        'PARTIAL',
        'Both Contribution.userId and Application.operatorId link to User - potential correlation',
        'Contribution.userId + Application.operatorId → same User',
        ['If org sees both contributions (Intelligence) and applications (Opportunity), they can correlate', 'Same userId connects both realms']
      );
    }
  }

  // 6.4 Check redaction implementation
  const redactionLib = readFile('lib/redaction.ts');
  
  if (redactionLib) {
    const hasSponsors = redactionLib.includes('sponsor') || redactionLib.includes('Pfizer') || redactionLib.includes('Merck');
    const hasProtocols = redactionLib.includes('NCT') || redactionLib.includes('protocol');
    const hasContact = redactionLib.includes('email') || redactionLib.includes('phone');
    
    recordResult(
      '6.4 Content Redaction',
      hasSponsors && hasProtocols ? 'PASS' : 'PARTIAL',
      `Redacts: sponsors=${hasSponsors}, protocols=${hasProtocols}, contact=${hasContact}`,
      redactionLib.substring(0, 300),
      []
    );
  }
}

// ============================================
// PHASE 7: BROKEN IMPORTS CHECK
// ============================================

function testBrokenImports() {
  console.log('\n========================================');
  console.log('PHASE 7: BROKEN IMPORTS CHECK');
  console.log('========================================\n');

  // Find all imports from @/lib/db
  const brokenImports = grepFiles(path.join(process.cwd()), /@\/lib\/db/, '.ts');
  
  if (brokenImports.length > 0) {
    console.log(`  Found ${brokenImports.length} files importing from non-existent @/lib/db:\n`);
    
    for (const imp of brokenImports) {
      console.log(`    ${imp.file}:${imp.line}`);
    }
    
    recordResult(
      '7.1 @/lib/db Import Check',
      'FAIL',
      `${brokenImports.length} files will CRASH at runtime - @/lib/db does not exist`,
      brokenImports.map(i => `${i.file}`).join('\n'),
      brokenImports.map(i => `${i.file} imports from non-existent @/lib/db`)
    );
  } else {
    recordResult(
      '7.1 @/lib/db Import Check',
      'PASS',
      'No broken imports from @/lib/db found',
      undefined,
      []
    );
  }

  // Check for correct import @/lib/prisma
  const correctImports = grepFiles(path.join(process.cwd()), /@\/lib\/prisma/, '.ts');
  console.log(`\n  Files using correct @/lib/prisma: ${correctImports.length}`);
}

// ============================================
// MAIN EXECUTION
// ============================================

function main() {
  console.log('========================================');
  console.log('BTP ECONOMIC SYSTEM PROOF');
  console.log('Code-Based Verification');
  console.log('========================================');

  // Run all tests
  testOperatorFlow();
  testOrganizationFlow();
  testMatchingFlow();
  testInterestFlow();
  testHireFlow();
  testAnonymityAttacks();
  testBrokenImports();

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

  // ============================================
  // STRICT PASS/FAIL MATRIX
  // ============================================
  
  console.log('\n========================================');
  console.log('STRICT PASS/FAIL MATRIX');
  console.log('========================================\n');

  console.log('| Feature | Status | Critical Issues |');
  console.log('|---------|--------|-----------------|');
  
  // Matching
  const matchingResults = results.filter(r => r.step.toLowerCase().includes('match'));
  const matchingFails = matchingResults.filter(r => r.status === 'FAIL').length;
  console.log(`| **Matching** | ${matchingFails > 0 ? '❌ FAIL' : '✅ PASS'} | ${matchingFails}/${matchingResults.length} tests failed |`);
  
  // Connection Flow
  const connectionResults = results.filter(r => r.step.toLowerCase().includes('interest') || r.step.toLowerCase().includes('connection') || r.step.toLowerCase().includes('candidate'));
  const connectionFails = connectionResults.filter(r => r.status === 'FAIL').length;
  console.log(`| **Connection Flow** | ${connectionFails > 0 ? '❌ FAIL' : '✅ PASS'} | ${connectionFails}/${connectionResults.length} tests failed |`);
  
  // Hire Flow
  const hireResults = results.filter(r => r.step.toLowerCase().includes('hire') || r.step.toLowerCase().includes('fee'));
  const hireFails = hireResults.filter(r => r.status === 'FAIL').length;
  console.log(`| **Hire Flow** | ${hireFails > 0 ? '❌ FAIL' : '✅ PASS'} | ${hireFails}/${hireResults.length} tests failed |`);
  
  // Anonymity Protection
  const anonymityResults = results.filter(r => r.step.toLowerCase().includes('anonym') || r.step.toLowerCase().includes('correlation') || r.step.toLowerCase().includes('redaction') || r.step.toLowerCase().includes('leak'));
  const anonymityFails = anonymityResults.filter(r => r.status === 'FAIL').length;
  console.log(`| **Anonymity Protection** | ${anonymityFails > 0 ? '❌ FAIL' : '✅ PASS'} | ${anonymityFails}/${anonymityResults.length} tests failed |`);

  // ============================================
  // ALL FAILURES
  // ============================================
  
  console.log('\n========================================');
  console.log('ALL FAILURES (Evidence)');
  console.log('========================================\n');

  const failures = results.filter(r => r.status === 'FAIL');
  for (const failure of failures) {
    console.log(`\n**${failure.step}**`);
    console.log(`  Evidence: ${failure.evidence}`);
    if (failure.codeFound) {
      console.log(`  Code: ${failure.codeFound.substring(0, 200)}...`);
    }
    for (const issue of failure.issues) {
      console.log(`  ❌ ${issue}`);
    }
  }

  // ============================================
  // WHAT IS MISSING FOR PRODUCTION
  // ============================================
  
  console.log('\n========================================');
  console.log('WHAT IS MISSING FOR PRODUCTION');
  console.log('========================================\n');

  const allIssues = results.flatMap(r => r.issues);
  const uniqueIssues = [...new Set(allIssues)];
  
  for (const issue of uniqueIssues) {
    console.log(`• ${issue}`);
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================');
}

main();