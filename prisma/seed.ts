import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data in correct order (respecting foreign keys)
  await prisma.interaction.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.contributionOutcome.deleteMany();
  await prisma.hireOutcome.deleteMany();
  await prisma.opportunityMatch.deleteMany();
  await prisma.capabilityIdentity.deleteMany();
  await prisma.trustVector.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.hire.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.operatorProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.flaggedContent.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create Users with TrustVector
  const users = await Promise.all([
    prisma.user.create({
      data: {
        clerkId: 'user_1',
        handle: 'Operator_4821',
        userRole: 'operator',
        roleCategory: 'cra',
        companyCategory: 'other',
        isFoundingOperator: true,
        trustVector: { create: { quality: 0.75, reliability: 0.8 } },
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_2',
        handle: 'CRA_3927',
        userRole: 'operator',
        roleCategory: 'cra',
        companyCategory: 'cro',
        trustVector: { create: { quality: 0.6, reliability: 0.65 } },
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_3',
        handle: 'CRC_7184',
        userRole: 'operator',
        roleCategory: 'crc',
        companyCategory: 'site',
        trustVector: { create: {} },
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_4',
        handle: 'SiteLead_9256',
        userRole: 'operator',
        roleCategory: 'site_coordinator',
        companyCategory: 'site',
        isFoundingOperator: true,
        trustVector: { create: { quality: 0.85, reliability: 0.9, peerConfidence: 0.8 } },
      },
    }),
    prisma.user.create({
      data: {
        clerkId: 'user_5',
        handle: 'PM_1643',
        userRole: 'organization',
        roleCategory: 'other',
        companyCategory: 'sponsor',
        trustVector: { create: { quality: 0.7 } },
      },
    }),
  ]);

  console.log('✅ Created users with trust vectors');

  // Create Contributions (replacing threads with new architecture)
  const contributionData = [
    {
      contributionType: 'situation',
      title: 'Protocol amendment added procedures without increasing site budget',
      description: 'Sponsor just amended the protocol to add 3 new mandatory procedures per visit, but refused to increase our site budget. These procedures add about 2 hours per patient visit. Has anyone dealt with this before?',
      therapeuticArea: 'Oncology',
      trialPhase: 'Phase 3',
      issueCategory: 'Protocol burden',
      userId: users[0].id,
    },
    {
      contributionType: 'situation',
      title: 'Enrollment completely stalled - unrealistic expectations from CRA',
      description: 'Our CRA is pushing for 5 patients per month when we only have 12 qualified patients in our database. The study has very strict inclusion criteria. How do I push back without damaging the relationship?',
      therapeuticArea: 'Rare Disease',
      trialPhase: 'Phase 2',
      issueCategory: 'Enrollment',
      userId: users[1].id,
    },
    {
      contributionType: 'situation',
      title: 'IRB keeps rejecting our consent form updates',
      description: 'We submitted consent form updates required by the sponsor, but our local IRB has rejected them 3 times now citing language issues. The sponsor template language conflicts with local IRB requirements. Anyone else dealt with this conflict?',
      therapeuticArea: 'Cardiovascular',
      trialPhase: 'Phase 3',
      issueCategory: 'Protocol burden',
      userId: users[2].id,
    },
  ];

  const contributions = await Promise.all(
    contributionData.map((data) =>
      prisma.contribution.create({
        data,
      })
    )
  );

  console.log('✅ Created contributions');

  // Create Interactions (replacing replies with new architecture)
  await Promise.all([
    prisma.interaction.create({
      data: {
        contributionId: contributions[0].id,
        userId: users[1].id,
        interactionType: 'ADD_CONTEXT',
        context: 'This happened to us on an oncology study. We documented all the additional time and presented it to the CRA. They eventually agreed to a budget adjustment. Key was showing the actual cost impact.',
        weight: 1.2,
      },
    }),
    prisma.interaction.create({
      data: {
        contributionId: contributions[0].id,
        userId: users[2].id,
        interactionType: 'SEEN_TOO',
        weight: 1.5,
      },
    }),
    prisma.interaction.create({
      data: {
        contributionId: contributions[1].id,
        userId: users[3].id,
        interactionType: 'ADD_CONTEXT',
        context: 'We had the same issue. I scheduled a call with the CRA manager and project manager together to discuss realistic enrollment expectations based on our patient database. They revised the targets.',
        weight: 1.2,
      },
    }),
    prisma.interaction.create({
      data: {
        contributionId: contributions[1].id,
        userId: users[0].id,
        interactionType: 'SOLUTION_WORKED',
        weight: 2.0,
      },
    }),
  ]);

  console.log('✅ Created interactions');

  // Create CapabilityIdentities for operators
  await Promise.all([
    prisma.capabilityIdentity.create({
      data: {
        userId: users[0].id,
        profileId: 'CAP-A7X9K2M4',
        therapeuticAreas: { Oncology: 0.8, Cardiovascular: 0.5 },
        trialPhases: { 'Phase 2': 0.7, 'Phase 3': 0.9 },
        reliabilityScore: 0.75,
        generatedSummary: 'Experienced CRA with strong oncology background and Phase 3 expertise.',
      },
    }),
    prisma.capabilityIdentity.create({
      data: {
        userId: users[3].id,
        profileId: 'CAP-B3Y8L1N5',
        therapeuticAreas: { 'Rare Disease': 0.6, Oncology: 0.4 },
        trialPhases: { 'Phase 1': 0.5, 'Phase 2': 0.8 },
        reliabilityScore: 0.85,
        generatedSummary: 'Senior site coordinator with diverse therapeutic experience.',
      },
    }),
  ]);

  console.log('✅ Created capability identities');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`- ${users.length} users created with trust vectors`);
  console.log(`- ${contributions.length} contributions created`);
  console.log(`- 4 interactions created`);
  console.log(`- 2 capability identities created`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });