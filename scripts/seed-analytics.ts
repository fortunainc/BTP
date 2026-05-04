/**
 * Seed Script for Analytics Dashboard
 * 
 * Creates sample data for testing the Founder Analytics Dashboard.
 * All user IDs are anonymized - no real identities.
 */

import { prisma } from '../lib/prisma';

const THERAPEUTIC_AREAS = ['Oncology', 'Rare Disease', 'CNS', 'Cardiovascular', 'Infectious Disease', 'Device'];
const ISSUE_CATEGORIES = ['Enrollment', 'Protocol burden', 'Sponsor expectations', 'Data integrity', 'Regulatory', 'Operational'];
const SEVERITY_LEVELS = ['Normal', 'Needs Advice', 'Urgent', 'Critical'];

function generateAnonymousId(role: 'user' | 'operator' | 'organization'): string {
  const prefix = role === 'operator' ? 'OPR' : role === 'organization' ? 'ORG' : 'USR';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function toDateBucket(daysAgo: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('🌱 Seeding analytics data...');

  // Clean up existing analytics data
  await prisma.analyticsEvent.deleteMany();
  await prisma.userMetrics.deleteMany();
  await prisma.dailyMetrics.deleteMany();
  await prisma.adminAccessLog.deleteMany();

  // Create user metrics
  console.log('Creating user metrics...');
  const userMetrics = [];
  
  // Create 50 regular users
  for (let i = 0; i < 50; i++) {
    const anonymousId = generateAnonymousId('user');
    const daysSinceSignup = randomInt(1, 90);
    const lastActiveDaysAgo = Math.random() > 0.3 ? randomInt(0, daysSinceSignup) : randomInt(daysSinceSignup, daysSinceSignup + 30);
    
    userMetrics.push(await prisma.userMetrics.create({
      data: {
        anonymousUserId: anonymousId,
        roleType: 'user',
        verificationStatus: Math.random() > 0.3 ? 'Verified' : 'Pending',
        signupDateBucket: toDateBucket(daysSinceSignup),
        lastActiveBucket: toDateBucket(lastActiveDaysAgo),
        postCount: randomInt(0, 20),
        interactionCount: randomInt(0, 50),
        reflectionOpenCount: randomInt(0, 10),
        opportunityInviteCount: randomInt(0, 5),
        microConsultCount: randomInt(0, 3),
        revenueGeneratedCents: randomInt(0, 50000),
        retentionStatus: lastActiveDaysAgo < 7 ? 'active' : lastActiveDaysAgo < 30 ? 'dormant' : 'churned',
      },
    }));
  }

  // Create 30 operators
  for (let i = 0; i < 30; i++) {
    const anonymousId = generateAnonymousId('operator');
    const daysSinceSignup = randomInt(1, 90);
    const lastActiveDaysAgo = Math.random() > 0.2 ? randomInt(0, daysSinceSignup) : randomInt(daysSinceSignup, daysSinceSignup + 30);
    
    userMetrics.push(await prisma.userMetrics.create({
      data: {
        anonymousUserId: anonymousId,
        roleType: 'operator',
        verificationStatus: Math.random() > 0.2 ? 'Verified' : 'Pending',
        signupDateBucket: toDateBucket(daysSinceSignup),
        lastActiveBucket: toDateBucket(lastActiveDaysAgo),
        postCount: randomInt(0, 30),
        interactionCount: randomInt(0, 100),
        reflectionOpenCount: randomInt(0, 15),
        opportunityInviteCount: randomInt(0, 10),
        microConsultCount: randomInt(0, 8),
        revenueGeneratedCents: randomInt(0, 150000),
        retentionStatus: lastActiveDaysAgo < 7 ? 'active' : lastActiveDaysAgo < 30 ? 'dormant' : 'churned',
      },
    }));
  }

  // Create 10 organizations
  for (let i = 0; i < 10; i++) {
    const anonymousId = generateAnonymousId('organization');
    const daysSinceSignup = randomInt(1, 90);
    
    userMetrics.push(await prisma.userMetrics.create({
      data: {
        anonymousUserId: anonymousId,
        roleType: 'organization',
        verificationStatus: Math.random() > 0.3 ? 'Verified' : 'Pending',
        signupDateBucket: toDateBucket(daysSinceSignup),
        lastActiveBucket: toDateBucket(randomInt(0, 7)),
        postCount: randomInt(1, 50),
        interactionCount: randomInt(0, 20),
        reflectionOpenCount: 0,
        opportunityInviteCount: randomInt(0, 30),
        microConsultCount: 0,
        revenueGeneratedCents: randomInt(0, 500000),
        retentionStatus: 'active',
      },
    }));
  }

  // Create daily metrics for last 30 days
  console.log('Creating daily metrics...');
  let runningTotal = 0;
  
  for (let day = 30; day >= 0; day--) {
    const newUsers = randomInt(2, 8);
    runningTotal += newUsers;
    
    const dailyMetrics = await prisma.dailyMetrics.create({
      data: {
        dateBucket: toDateBucket(day),
        totalUsers: runningTotal,
        newUsers: newUsers,
        verifiedOperators: Math.floor(runningTotal * 0.3),
        verifiedOrgs: Math.floor(runningTotal * 0.1),
        onboardingCompleted: Math.floor(newUsers * 0.7),
        dau: randomInt(15, 40),
        sessions: randomInt(30, 80),
        notificationsSent: randomInt(20, 60),
        notificationsOpened: randomInt(10, 40),
        postsCreated: randomInt(5, 15),
        interactions: randomInt(10, 30),
        reflectionsSent: randomInt(3, 10),
        reflectionsOpened: randomInt(2, 8),
        microOppsCreated: randomInt(1, 5),
        operatorInvites: randomInt(3, 12),
        operatorInterests: randomInt(1, 6),
        consultsCompleted: randomInt(0, 3),
        gmvCents: randomInt(5000, 50000),
        platformRevenueCents: randomInt(1000, 10000),
        operatorPayoutsCents: randomInt(3000, 30000),
        flaggedContent: randomInt(0, 3),
        redactionsApplied: randomInt(5, 20),
        highRiskPosts: randomInt(0, 2),
      },
    });
  }

  // Create analytics events
  console.log('Creating analytics events...');
  const eventTypes = [
    { type: 'signup_completed', category: 'user' },
    { type: 'onboarding_completed', category: 'user' },
    { type: 'login', category: 'user' },
    { type: 'situation_submitted', category: 'situation' },
    { type: 'situation_reflection_opened', category: 'situation' },
    { type: 'interaction_clicked', category: 'engagement' },
    { type: 'notification_opened', category: 'engagement' },
    { type: 'micro_opportunity_created', category: 'micro_opportunity' },
    { type: 'operator_interested', category: 'micro_opportunity' },
    { type: 'consult_completed', category: 'micro_opportunity' },
  ];

  for (let i = 0; i < 500; i++) {
    const eventType = randomElement(eventTypes);
    const user = randomElement(userMetrics);
    const daysAgo = randomInt(0, 30);
    
    await prisma.analyticsEvent.create({
      data: {
        anonymousUserId: user.anonymousUserId,
        eventType: eventType.type,
        eventCategory: eventType.category as 'user' | 'situation' | 'engagement' | 'micro_opportunity',
        createdAtBucket: toDateBucket(daysAgo),
      },
    });
  }

  // Create sample micro-opportunities
  console.log('Creating micro-opportunities...');
  const contributions = await prisma.contribution.findMany({ take: 10 });
  
  for (let i = 0; i < 15; i++) {
    const contribution = contributions.length > 0 ? randomElement(contributions) : null;
    const status = randomElement(['open', 'matched', 'completed', 'closed']);
    
    await prisma.microOpportunity.create({
      data: {
        contributionId: contribution?.id || `seed-${i}`,
        triggerReason: randomElement(['high_severity', 'repeated_pattern', 'niche_expertise']),
        title: `Consultation Opportunity ${i + 1}`,
        description: 'Sample micro-opportunity for testing',
        issueType: randomElement(ISSUE_CATEGORIES),
        therapeuticArea: randomElement(THERAPEUTIC_AREAS),
        estimatedMinutes: 30,
        minCompensation: 150,
        maxCompensation: 300,
        requiredExpertise: [randomElement(ISSUE_CATEGORIES)],
        matchedOperators: [],
        interestedOperators: [],
        status: status,
        actualCompensation: status === 'completed' ? randomInt(150, 300) : null,
        completedAt: status === 'completed' ? new Date() : null,
      },
    });
  }

  // Create sample admin access logs
  console.log('Creating admin access logs...');
  const adminActions = ['view_analytics', 'view_user', 'investigate', 'export_data'];
  
  for (let i = 0; i < 20; i++) {
    const action = randomElement(adminActions);
    
    await prisma.adminAccessLog.create({
      data: {
        adminUserId: 'admin-demo',
        action: action,
        reason: action === 'investigate' ? randomElement(['abuse', 'spam', 'safety_escalation']) : null,
        targetType: action === 'view_user' || action === 'investigate' ? 'User' : null,
        targetId: action === 'investigate' ? randomElement(userMetrics).anonymousUserId : null,
        fieldsAccessed: action === 'view_user' ? ['postCount', 'interactionCount'] : [],
      },
    });
  }

  console.log('✅ Seeding complete!');
  console.log(`
    Created:
    - ${userMetrics.length} user metrics records
    - 31 daily metrics records
    - 500 analytics events
    - 15 micro-opportunities
    - 20 admin access logs
  `);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });