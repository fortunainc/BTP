/**
 * SEEDED DEMO MOMENT DATA
 * 
 * Creates realistic situations that demonstrate:
 * - Real operational challenges
 * - Multiple perspectives
 * - Tension and disagreement
 * - Pattern formation
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// SITUATION DATA
// ==========================================

const SITUATIONS = [
  // ENROLLMENT CHALLENGES
  {
    title: 'Protocol amendments killing enrollment momentum',
    description: 'We had strong enrollment going, then three protocol amendments in two months. Now sites are confused and patients are dropping. Sponsors don\'t seem to understand the operational impact.',
    issueCategory: 'enrollment',
    therapeuticArea: 'Oncology',
    trialPhase: 'Phase 3',
    roleContext: 'CRC',
    tags: ['protocol', 'amendment', 'enrollment']
  },
  {
    title: 'Eligibility criteria too narrow for real patients',
    description: 'The I/E criteria are so restrictive we\'re screening 20 patients to enroll 1. Meanwhile the sponsor keeps asking why enrollment is slow. Real patients have comorbidities.',
    issueCategory: 'enrollment',
    therapeuticArea: 'Cardiology',
    trialPhase: 'Phase 2',
    roleContext: 'CRA',
    tags: ['eligibility', 'screening', 'real-world']
  },
  {
    title: 'Competing trials draining our patient pool',
    description: 'Three different sponsors running similar trials in our area. We\'re all competing for the same small patient population. Someone\'s going to miss their targets.',
    issueCategory: 'enrollment',
    therapeuticArea: 'Oncology',
    trialPhase: 'Phase 3',
    roleContext: 'Site Director',
    tags: ['competition', 'patient-pool', 'multiple-trials']
  },

  // PROTOCOL BURDEN
  {
    title: 'Visit schedule is crushing site capacity',
    description: 'Weekly visits for 6 months, each with 15+ assessments. Patients are exhausted, staff is burned out. Two patients withdrew this month specifically because of visit frequency.',
    issueCategory: 'protocol-burden',
    therapeuticArea: 'Neurology',
    trialPhase: 'Phase 2',
    roleContext: 'CRC',
    tags: ['visit-burden', 'patient-fatigue', 'staff-burnout']
  },
  {
    title: 'Optional procedures becoming mandatory in practice',
    description: 'Protocol says these assessments are optional, but monitors keep flagging them as missing. Now we\'re doing everything "optional" because we don\'t want findings.',
    issueCategory: 'protocol-burden',
    therapeuticArea: 'Immunology',
    trialPhase: 'Phase 3',
    roleContext: 'Site Director',
    tags: ['optional', 'monitoring', 'scope-creep']
  },

  // SITE OVERLOAD
  {
    title: 'We\'re running 12 studies with 3 coordinators',
    description: 'Every sponsor thinks their study is the priority. We\'re underwater. Quality is suffering and everyone knows it, but no one wants to say it out loud.',
    issueCategory: 'site-overload',
    therapeuticArea: 'Multiple',
    trialPhase: 'Multiple',
    roleContext: 'CRC',
    tags: ['staffing', 'capacity', 'quality-risk']
  },
  {
    title: 'Monitoring visits back to back with no buffer',
    description: 'Had four monitoring visits in five days last week. Different sponsors, different systems, different expectations. Nothing got done properly.',
    issueCategory: 'site-overload',
    therapeuticArea: 'Oncology',
    trialPhase: 'Phase 3',
    roleContext: 'CRC',
    tags: ['monitoring', 'capacity', 'competing-demands']
  },

  // PATIENT BURDEN
  {
    title: 'Patients dropping out due to travel burden',
    description: 'Central reading requirement means patients travel 3 hours each way. We\'ve lost 4 patients to this. Sponsor won\'t approve local reading options.',
    issueCategory: 'patient-burden',
    therapeuticArea: 'Radiology',
    trialPhase: 'Phase 2',
    roleContext: 'CRA',
    tags: ['travel', 'patient-retention', 'logistics']
  },
  {
    title: 'ePRO compliance dropping after month 3',
    description: 'Patients start strong with daily ePRO entries, but by month 3-4 compliance crashes. Reminders don\'t help. The burden is just too high.',
    issueCategory: 'patient-burden',
    therapeuticArea: 'Dermatology',
    trialPhase: 'Phase 3',
    roleContext: 'CRC',
    tags: ['epro', 'compliance', 'long-term']
  },

  // CRO-SPONSOR DISCONNECT
  {
    title: 'Getting different answers from CRO and sponsor',
    description: 'Asked the CRO about a protocol deviation handling, they said one thing. Sponsor audit later said something completely different. We followed CRO guidance and now we have findings.',
    issueCategory: 'cro-disconnect',
    therapeuticArea: 'Oncology',
    trialPhase: 'Phase 3',
    roleContext: 'Site Director',
    tags: ['communication', 'accountability', 'mixed-messages']
  },
  {
    title: 'CRO turnover breaking continuity',
    description: 'Third project manager in 18 months. Each one has different priorities and interpretations. We spend more time re-explaining the study than doing it.',
    issueCategory: 'cro-disconnect',
    therapeuticArea: 'Cardiology',
    trialPhase: 'Phase 2',
    roleContext: 'CRC',
    tags: ['turnover', 'continuity', 'training']
  },

  // REIMBURSEMENT ISSUES
  {
    title: 'Reimbursement delays threatening site viability',
    description: 'We haven\'t received payment for completed visits in 4 months. Our institution is questioning whether to keep this study open. Sponsors don\'t seem to care.',
    issueCategory: 'reimbursement',
    therapeuticArea: 'Multiple',
    trialPhase: 'Phase 3',
    roleContext: 'Site Director',
    tags: ['payment', 'viability', 'institution']
  },
  {
    title: 'Start-up costs front-loaded with no support',
    description: 'Sponsor required IRB, regulatory, and recruitment costs upfront. Six months in, we\'re still waiting for reimbursement. Small sites can\'t float this.',
    issueCategory: 'reimbursement',
    therapeuticArea: 'Neurology',
    trialPhase: 'Phase 2',
    roleContext: 'Site Director',
    tags: ['start-up', 'costs', 'small-sites']
  },

  // DATA QUALITY
  {
    title: 'EDC changes breaking our workflows',
    description: 'Mid-study EDC update changed data entry paths. Now we\'re making errors we never made before. Training was a 30-minute webinar, totally inadequate.',
    issueCategory: 'data-quality',
    therapeuticArea: 'Immunology',
    trialPhase: 'Phase 3',
    roleContext: 'CRC',
    tags: ['edc', 'training', 'mid-study-change']
  },

  // TIMELINE PRESSURE
  {
    title: 'Enrollment targets forcing questionable decisions',
    description: 'The pressure to hit enrollment numbers is intense. I\'ve seen sites enroll patients who probably shouldn\'t be enrolled. The system incentivizes this.',
    issueCategory: 'timeline-pressure',
    therapeuticArea: 'Oncology',
    trialPhase: 'Phase 3',
    roleContext: 'CRA',
    tags: ['targets', 'pressure', 'quality']
  }
];

// ==========================================
// INTERACTION TYPES
// ==========================================

const INTERACTION_TYPES = [
  { type: 'SEEN_THIS', weight: 0.5, reply: 'Yep, seen this exact thing. You\'re not alone.' },
  { type: 'SEEN_THIS', weight: 0.5, reply: 'This is happening at our site too.' },
  { type: 'THIS_WORKED', weight: 0.3, reply: 'We pushed back on the sponsor and got some flexibility. Document everything in writing.' },
  { type: 'THIS_WORKED', weight: 0.3, reply: 'Escalated through our institution\'s research office. That got attention.' },
  { type: 'DIDNT_WORK', weight: 0.3, reply: 'Tried that. They just replaced us with a site that would comply.' },
  { type: 'DIDNT_WORK', weight: 0.3, reply: 'Documentation didn\'t help in our case. They just ignored it.' },
  { type: 'DIFFERENT_CAUSE', weight: 0.2, reply: 'In our case this was actually driven by the CRO, not the sponsor.' },
  { type: 'DIFFERENT_CAUSE', weight: 0.2, reply: 'Different for us - it was the IRB that was the bottleneck, not the sponsor.' }
];

// ==========================================
// CAPABILITY IDENTITIES (FOR MATCHING)
// ==========================================

const CAPABILITY_IDENTITIES = [
  {
    profileCode: 'CAP-7291',
    summary: 'Senior CRC with 8 years oncology experience',
    capabilities: ['Oncology', 'Phase 3', 'enrollment', 'protocol-deviation'],
    reliability: 'high'
  },
  {
    profileCode: 'CAP-3847',
    summary: 'Site Director at high-volume research center',
    capabilities: ['Cardiology', 'Neurology', 'site-overload', 'staffing'],
    reliability: 'high'
  },
  {
    profileCode: 'CAP-9156',
    summary: 'CRA with multisite coordination experience',
    capabilities: ['Oncology', 'monitoring', 'cro-disconnect', 'communication'],
    reliability: 'medium'
  },
  {
    profileCode: 'CAP-4823',
    summary: 'CRC specializing in patient retention',
    capabilities: ['patient-burden', 'retention', 'compliance', 'Dermatology'],
    reliability: 'high'
  },
  {
    profileCode: 'CAP-6018',
    summary: 'Research coordinator at community site',
    capabilities: ['reimbursement', 'site-viability', 'institution', 'Multiple'],
    reliability: 'medium'
  }
];

// ==========================================
// SEED FUNCTION
// ==========================================

async function seedBTPReality() {
  console.log('🌱 Seeding BTP Reality Data...\n');

  try {
    // Clear existing data (optional - comment out if you want to keep)
    // await prisma.reply.deleteMany({});
    // await prisma.contribution.deleteMany({ where: { contributionType: 'situation' } });

    // Create situations
    console.log('Creating situations...');
    const createdSituations = [];

    for (const situation of SITUATIONS) {
      const created = await prisma.contribution.create({
        data: {
          contributionType: 'situation',
          title: situation.title,
          description: situation.description,
          issueCategory: situation.issueCategory,
          therapeuticArea: situation.therapeuticArea,
          trialPhase: situation.trialPhase,
          moderationStatus: 'approved',
          anonymousId: `anon-${Math.random().toString(36).substring(2, 8)}`,
          authorId: null, // Will be null for seeded data
        }
      });
      createdSituations.push(created);
      console.log(`  ✓ Created: ${situation.title}`);
    }

    // Create interactions (replies)
    console.log('\nCreating interactions...');
    for (const situation of createdSituations) {
      // Add 2-4 interactions per situation
      const numInteractions = 2 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numInteractions; i++) {
        const interaction = INTERACTION_TYPES[Math.floor(Math.random() * INTERACTION_TYPES.length)];
        
        await prisma.reply.create({
          data: {
            contributionId: situation.id,
            content: interaction.reply,
            interactionType: interaction.type,
            anonymousId: `anon-${Math.random().toString(36).substring(2, 8)}`,
            authorId: null
          }
        });
      }
      console.log(`  ✓ Added ${numInteractions} interactions to: ${situation.title?.substring(0, 40)}...`);
    }

    console.log('\n✅ Seeding complete!');
    console.log(`   ${SITUATIONS.length} situations created`);
    console.log(`   ~${SITUATIONS.length * 3} interactions created`);

  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedBTPReality()
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedBTPReality, SITUATIONS, INTERACTION_TYPES, CAPABILITY_IDENTITIES };