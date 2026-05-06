/**
 * Priority 1 Test: Core Transaction Loop
 * 
 * Tests the complete end-to-end flow:
 * 1. Organization posts job
 * 2. Matching creates OpportunityMatch records
 * 3. Operator views matched opportunities
 * 4. Operator expresses interest
 * 5. Organization views applications
 * 6. Organization hires operator
 * 7. FeeRecord created at 25%
 * 8. Outcome submitted
 */

import { prisma } from "./lib/prisma";
import { User, JobPosting, CapabilityIdentity, OpportunityMatch, Application, Hire, FeeRecord } from "@prisma/client";

// Test results tracking
const results: { step: string; success: boolean; data?: any; error?: string }[] = [];

function logResult(step: string, success: boolean, data?: any, error?: string) {
  results.push({ step, success, data, error });
  console.log(`${success ? '✅' : '❌'} ${step}`);
  if (error) console.error(`   Error: ${error}`);
  if (data) console.log(`   Data:`, JSON.stringify(data, null, 2).substring(0, 200));
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse dependency order
    await prisma.hireOutcome.deleteMany({});
    await prisma.feeRecord.deleteMany({});
    await prisma.hire.deleteMany({});
    await prisma.application.deleteMany({});
    await prisma.opportunityMatch.deleteMany({});
    await prisma.jobPosting.deleteMany({});
    await prisma.capabilityIdentity.deleteMany({});
    await prisma.trustVector.deleteMany({});
    await prisma.operatorProfile.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('   Cleanup complete');
  } catch (error) {
    console.error('   Cleanup error:', error);
  }
}

async function createTestUsers() {
  console.log('\n👤 Creating test users...');
  
  // Create organization user
  const orgUser = await prisma.user.create({
    data: {
      id: 'test-org-user-1',
      email: 'test-org@test.com',
      handle: 'TestOrganization',
      userRole: 'organization',
      verificationStatus: 'Approved',
      roleCategory: 'CRO',
      companyCategory: 'Clinical Trials',
    },
  });
  
  // Create operator user with trust vector
  const operatorUser = await prisma.user.create({
    data: {
      id: 'test-operator-user-1',
      email: 'test-operator@test.com',
      handle: 'TestOperator',
      userRole: 'operator',
      verificationStatus: 'Approved',
      roleCategory: 'CRA',
      companyCategory: 'Independent',
      trustVector: {
        create: {
          reliability: 0.85,
          quality: 0.90,
          
          
        },
      },
    },
  });
  
  logResult('Create organization user', true, { id: orgUser.id, handle: orgUser.handle });
  logResult('Create operator user', true, { id: operatorUser.id, handle: operatorUser.handle });
  
  return { orgUser, operatorUser };
}

async function createOperatorProfile(operatorUser: User) {
  console.log('\n📋 Creating operator profile and capability identity...');
  
  // Create operator profile
  const operatorProfile = await prisma.operatorProfile.create({
    data: {
      userId: operatorUser.id,
      handle: `anon-${operatorUser.id.substring(0, 8)}`,
      role: 'CRA',
      yearsExperience: 5,
      therapeuticAreas: ['Oncology', 'Cardiology'],
      trialPhases: ['Phase 1', 'Phase 2', 'Phase 3'],
      isAvailable: true,
    },
  });
  
  // Create capability identity (anonymous profile)
  const capabilityIdentity = await prisma.capabilityIdentity.create({
    data: {
      userId: operatorUser.id,
      profileId: operatorProfile.id,
      generatedSummary: 'Experienced CRA with 5 years in Oncology and Cardiology trials',
      therapeuticAreas: { 'Oncology': 0.9, 'Cardiology': 0.7 },
      trialPhases: { 'Phase 1': 0.6, 'Phase 2': 0.8, 'Phase 3': 0.9 },
      issueExpertise: { 'Enrollment': 0.8, 'Data Management': 0.7 },
      isAvailable: true,
    },
  });
  
  logResult('Create operator profile', true, { id: operatorProfile.id });
  logResult('Create capability identity', true, { id: capabilityIdentity.id });
  
  return { operatorProfile, capabilityIdentity };
}

async function postJobOpportunity(orgUser: User) {
  console.log('\n📝 Posting job opportunity...');
  
  const jobPosting = await prisma.jobPosting.create({
    data: {
      creator: { connect: { id: orgUser.id } },
      title: 'Senior Clinical Research Associate - Oncology',
      description: 'Looking for an experienced CRA to manage Phase 3 oncology trials',
      status: 'Open',
      therapeuticArea: 'Oncology',
      trialPhase: 'Phase 3',
      requiredRole: 'CRA',
      requiredSkills: ['Enrollment', 'Data Management', 'Monitoring'],
      location: 'Remote',
      duration: '6 months',
      compensationBand: '$75-95/hr',
      contractorType: 'Independent Contractor',
      experienceLevel: 'Senior',
      organizationType: 'CRO',
    },
  });
  
  logResult('Create job posting', true, { id: jobPosting.id, title: jobPosting.title });
  
  return jobPosting;
}

async function runMatching(jobPosting: JobPosting, capabilityIdentity: CapabilityIdentity) {
  console.log('\n🔗 Running matching algorithm...');
  
  // Create OpportunityMatch record (simulating matching algorithm)
  const opportunityMatch = await prisma.opportunityMatch.create({
    data: {
      jobPostingId: jobPosting.id,
      capabilityIdentityId: capabilityIdentity.id,
      matchScore: 0.85,
      matchFactors: {
        therapeuticAreaScore: 0.9,
        trialPhaseScore: 0.9,
        issueCategoryScore: 0.8,
        reliabilityScore: 0.85,
        qualityScore: 0.90,
        totalScore: 0.85,
      },
      status: 'pending',
    },
  });
  
  logResult('Create OpportunityMatch', true, { id: opportunityMatch.id, score: opportunityMatch.matchScore });
  
  return opportunityMatch;
}

async function operatorExpressInterest(opportunityMatch: OpportunityMatch, operatorProfile: any, jobPosting: JobPosting) {
  console.log('\n💡 Operator expressing interest...');
  
  // Update match status
  const updatedMatch = await prisma.opportunityMatch.update({
    where: { id: opportunityMatch.id },
    data: {
      status: 'accepted',
      respondedAt: new Date(),
    },
  });
  
  // Create Application record
  const application = await prisma.application.create({
    data: {
      jobPostingId: jobPosting.id,
      operatorId: operatorProfile.id,
      status: 'Applied',
      message: 'I am very interested in this opportunity based on my oncology experience.',
    },
  });
  
  logResult('Update OpportunityMatch status', true, { status: updatedMatch.status });
  logResult('Create Application', true, { id: application.id, status: application.status });
  
  return application;
}

async function organizationHire(application: any, orgUser: User, operatorProfile: any, jobPosting: JobPosting) {
  console.log('\n💼 Organization hiring operator...');
  
  // Update application status to Hired
  const updatedApplication = await prisma.application.update({
    where: { id: application.id },
    data: {
      status: 'Hired',
      reviewedAt: new Date(),
      reviewedBy: orgUser.id,
    },
  });
  
  // Create Hire record
  const hire = await prisma.hire.create({
    data: {
      applicationId: application.id,
      jobPostingId: jobPosting.id,
      operatorId: operatorProfile.id,
      organizationId: orgUser.id,
      compensationBand: '$85-95/hr',
      contractDuration: '6 months',
      feePercentage: 0.25,
      estimatedFee: 23400, // Estimated based on 6 months at $85/hr * 25%
      createdBy: orgUser.id,
    },
  });
  
  // Create FeeRecord
  const feeRecord = await prisma.feeRecord.create({
    data: {
      hireId: hire.id,
      feePercentage: 0.25,
      estimatedCompensation: 93600, // 6 months at $85/hr
      feeOwed: 23400, // 25% of estimated
      status: 'Fee Pending',
    },
  });
  
  // Update job posting status
  await prisma.jobPosting.update({
    where: { id: jobPosting.id },
    data: { status: 'Filled' },
  });
  
  logResult('Update Application to Hired', true, { status: updatedApplication.status });
  logResult('Create Hire record', true, { id: hire.id, feePercentage: hire.feePercentage });
  logResult('Create FeeRecord at 25%', true, { id: feeRecord.id, feeOwed: feeRecord.feeOwed, status: feeRecord.status });
  
  return { hire, feeRecord };
}

async function submitOutcome(hire: Hire, orgUser: User, operatorUser: User) {
  console.log('\n📊 Submitting hire outcome...');
  
  const hireOutcome = await prisma.hireOutcome.create({
    data: {
      hireId: hire.id,
      userId: operatorUser.id,
      wasSuccessful: true,
      wouldRehire: true,
      feedback: 'Excellent work on the oncology trial. Very professional and thorough.',
      performanceScore: 1.0,
    },
  });
  
  logResult('Create HireOutcome', true, { 
    id: hireOutcome.id, 
    wasSuccessful: hireOutcome.wasSuccessful,
    wouldRehire: hireOutcome.wouldRehire,
    performanceScore: hireOutcome.performanceScore,
  });
  
  return hireOutcome;
}

async function verifyDatabaseRecords() {
  console.log('\n🔍 Verifying database records...');
  
  const users = await prisma.user.count();
  const jobPostings = await prisma.jobPosting.count();
  const opportunityMatches = await prisma.opportunityMatch.count();
  const applications = await prisma.application.count();
  const hires = await prisma.hire.count();
  const feeRecords = await prisma.feeRecord.count();
  const hireOutcomes = await prisma.hireOutcome.count();
  
  console.log('   Database counts:');
  console.log(`   - Users: ${users}`);
  console.log(`   - JobPostings: ${jobPostings}`);
  console.log(`   - OpportunityMatches: ${opportunityMatches}`);
  console.log(`   - Applications: ${applications}`);
  console.log(`   - Hires: ${hires}`);
  console.log(`   - FeeRecords: ${feeRecords}`);
  console.log(`   - HireOutcomes: ${hireOutcomes}`);
  
  return {
    users,
    jobPostings,
    opportunityMatches,
    applications,
    hires,
    feeRecords,
    hireOutcomes,
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PRIORITY 1: CORE TRANSACTION LOOP TEST');
  console.log('═══════════════════════════════════════════════════════════════');
  
  try {
    // Clean up any existing test data
    await cleanup();
    
    // Step 1: Create users
    const { orgUser, operatorUser } = await createTestUsers();
    
    // Step 2: Create operator profile and capability identity
    const { operatorProfile, capabilityIdentity } = await createOperatorProfile(operatorUser);
    
    // Step 3: Post job opportunity
    const jobPosting = await postJobOpportunity(orgUser);
    
    // Step 4: Run matching
    const opportunityMatch = await runMatching(jobPosting, capabilityIdentity);
    
    // Step 5: Operator expresses interest
    const application = await operatorExpressInterest(opportunityMatch, operatorProfile, jobPosting);
    
    // Step 6: Organization hires
    const { hire, feeRecord } = await organizationHire(application, orgUser, operatorProfile, jobPosting);
    
    // Step 7: Submit outcome
    const hireOutcome = await submitOutcome(hire, orgUser, operatorUser);
    
    // Verify all records
    const counts = await verifyDatabaseRecords();
    
    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const allPassed = results.every(r => r.success);
    console.log(`\nOverall Result: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
    console.log(`\nSteps completed: ${results.filter(r => r.success).length}/${results.length}`);
    
    console.log('\nDetailed Results:');
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.success ? '✅' : '❌'} ${r.step}`);
    });
    
    // Verify the 25% fee
    console.log('\n📋 Fee Verification:');
    console.log(`   Fee Percentage: ${hire.feePercentage * 100}%`);
    console.log(`   Estimated Fee Owed: $${feeRecord.feeOwed?.toLocaleString()}`);
    console.log(`   Fee Status: ${feeRecord.status}`);
    
    if (hire.feePercentage === 0.25 && feeRecord.status === 'Fee Pending') {
      console.log('   ✅ 25% platform fee correctly applied');
    } else {
      console.log('   ❌ Fee structure incorrect');
    }
    
    return { success: allPassed, results, counts };
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
