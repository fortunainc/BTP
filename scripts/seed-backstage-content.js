const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config();

const prisma = new PrismaClient();

// Post-Mortem Seeds (10 total)
const postMortemSeeds = [
  {
    role: 'CRC',
    trialPhase: 'PHASE_III',
    therapeuticArea: 'Oncology',
    failureType: 'ENROLLMENT_COLLAPSE',
    whatFailed: 'Trial failed to enroll a single patient at 5 community sites over 6 months, despite promising feasibility reports from each site claiming ability to enroll 2-3 patients per month. Sites attributed failure to patient pool exhaustion, competitive landscape, and lack of patient recruitment support.',
    earlyWarningSigns: `Site feasibility overestimated patient pool by 300% based on actual chart reviews conducted 6 months later\nThree competing trials with similar inclusion criteria active at same sites during enrollment period\nPatient population already depleted by 3 prior oncology trials at these sites in past 18 months\nSites lacked dedicated research coordinators - relied on overburdened clinic staff\nNo patient recruitment strategy or materials provided by sponsor to sites\nSites unable to identify any potential patients during initial chart reviews after activation`,
    leadershipMisunderstanding: 'Sponsor believed site feasibility reports without independent verification. Assumed sites would handle patient recruitment independently. Misinterpreted low screening failure rates as good site selection rather than poor screening activity. Failed to recognize that sites were competing for the same small patient pool.',
    whatWouldDoDifferently: 'Would conduct real patient chart reviews during feasibility phase, not rely on site estimates. Would track competitive landscape at each site before activation. Would require dedicated research coordinator allocation as site qualification criterion. Would provide patient recruitment materials and strategies to sites. Would stagger site activation to avoid competing with own trials at same sites.',
    failureObviousAt: 'Month 3 - after zero enrollments across all activated sites despite screening activity',
    confidenceLevel: 'HIGH',
    title: 'Phase III Oncology Trial - Enrollment Collapse at Community Sites'
  },
  {
    role: 'PM',
    trialPhase: 'PHASE_II',
    therapeuticArea: 'Cardiology',
    failureType: 'PROTOCOL_OVERLOAD',
    whatFailed: '2 of 8 sites withdrew from trial within 3 months, citing excessive protocol complexity and unmanageable workload. Remaining sites struggled with data quality issues and protocol deviations, leading to complete data re-entry at 3 sites.',
    earlyWarningSigns: `Protocol document exceeded 150 pages\nMore than 20 eligibility criteria with complex conditional logic\nMultiple complex primary and secondary endpoints requiring different assessment schedules\nFrequent source document verification requirements conflicting with standard care\nSite coordinators unable to explain protocol to patients during screening\nHigh rate of protocol deviations even before first patient enrolled`,
    leadershipMisunderstanding: 'Protocol team optimized for statistical power and regulatory requirements without considering operational feasibility. Sites overpromised during feasibility to win business, and sponsor failed to validate actual site capacity. Leadership viewed protocol complexity as necessary for scientific rigor rather than a risk factor.',
    whatWouldDoDifferently: 'Would involve site operators in protocol design phase to validate operational feasibility. Would implement protocol complexity metrics and set clear limits. Would require sites to have dedicated research coordinators with prior complex protocol experience. Would conduct pilot testing at 2 sites before broader activation.',
    failureObviousAt: 'Month 2 - first site withdrawal citing protocol complexity',
    confidenceLevel: 'HIGH',
    title: 'Phase II Cardiology Trial - Protocol Overload Leading to Site Withdrawal'
  },
  {
    role: 'SITE_DIRECTOR',
    trialPhase: 'PHASE_I',
    therapeuticArea: 'Neurology',
    failureType: 'BUDGET_UNDERFUNDING',
    whatFailed: 'Academic site unable to cover costs of complex procedures and dedicated staff time, leading to quality compromises and study delays. Site requested budget revisions 3 times, each rejected. Eventually halted enrollment until payment terms renegotiated.',
    earlyWarningSigns: `Budget below published industry standards per patient\nMultiple non-reimbursable procedures required as standard of care\nNo allowance for extra research coordinator time beyond base budget\nSites required to subsidize trial activities with internal funds\nMultiple sites declined participation or withdrew during budget negotiations\nSite staff voiced concerns about unsustainable financial model`,
    leadershipMisunderstanding: 'Sponsor viewed budget as market-competitive based on outdated benchmarks. Failed to account for increased regulatory burden and inflation. Assumed academic sites would accept lower budgets for prestige and scientific contribution. Did not understand true operational costs at academic centers.',
    whatWouldDoDifferently: 'Would conduct thorough cost analysis including all procedures, staff time, and overhead before budgeting. Would include realistic staff time allocations based on actual protocol complexity. Would budget for contingency and inflation. Would negotiate payment terms that ensure site sustainability.',
    failureObviousAt: 'Month 4 - when site requested budget increase after seeing actual costs',
    confidenceLevel: 'MEDIUM',
    title: 'Phase I Neurology Trial - Budget Insufficiency at Academic Site'
  },
  {
    role: 'CRA',
    trialPhase: 'PHASE_III',
    therapeuticArea: 'Oncology',
    failureType: 'CRO_EXECUTION_FAILURE',
    whatFailed: 'CRO failed to provide adequate site monitoring and support. Sites reported CRAs visiting infrequently, delayed data review cycles, and unresponsive to site queries. Data quality declined, and 3 sites terminated relationship due to lack of support.',
    earlyWarningSigns: `CRA visits scheduled quarterly instead of monthly per contract\nData review cycles taking 4-6 weeks instead of 2 weeks\nSite queries unanswered for 2+ weeks\nCRA turnover exceeding 40% in first 6 months\nSites unable to reach study management team\nIncreasing protocol deviations correlated with lack of CRA oversight`,
    leadershipMisunderstanding: 'Sponsor believed CRO\'s claims of capacity and experience without verifying. Assumed CRO would provide adequate oversight based on contract terms. Failed to monitor CRA performance metrics until sites complained. Did not realize CRO was understaffing due to winning too many trials simultaneously.',
    whatWouldDoDifferently: 'Would require CRA performance metrics and regular reporting in contract. Would implement site satisfaction surveys quarterly. Would monitor CRA workload and turnover. Would have backup CRA clause in contract. Would conduct regular site check-ins to verify CRO performance.',
    failureObviousAt: 'Month 5 - when first site terminated relationship citing lack of support',
    confidenceLevel: 'HIGH',
    title: 'Phase III Oncology Trial - CRO Signal Loss After Study Start'
  },
  {
    role: 'PM',
    trialPhase: 'PHASE_III',
    therapeuticArea: 'Oncology',
    failureType: 'SITE_SELECTION_MISMATCH',
    whatFailed: '6 of 10 selected sites failed to enroll any patients despite strong feasibility reports. Investigation revealed sites promised capabilities they did not have, and sponsor failed to verify actual site performance before activation.',
    earlyWarningSigns: `Discrepancy between feasibility reports and actual patient chart availability\nSites lacking prior experience with similar trial types\nInadequate staff qualification for complex protocol requirements\nSite infrastructure limitations not disclosed during feasibility\nSite leadership unable to commit resources despite claims\nRapid site turnover during pre-activation phase`,
    leadershipMisunderstanding: 'Sponsor accepted site feasibility at face value without independent verification. Assumed sites would be honest about capabilities. Failed to conduct site qualification visits. Prioritized site relationships over actual capability. Did not understand difference between site claims and site reality.',
    whatWouldDoDifferently: 'Would conduct independent patient chart reviews at each site during feasibility. Would require site qualification visits before selection. Would verify site staff qualifications and availability. Would prioritize sites with proven track record over promises. Would implement site performance metrics before activation.',
    failureObviousAt: 'Month 4 - after zero enrollments at 6 of 10 activated sites',
    confidenceLevel: 'HIGH',
    title: 'Phase III Oncology Trial - Site Selection Mismatch'
  },
  {
    role: 'CRC',
    trialPhase: 'PHASE_II',
    therapeuticArea: 'Neurology',
    failureType: 'AMENDMENT_CASCADE',
    whatFailed: 'Protocol underwent 4 amendments in 6 months, each requiring re-training, protocol deviations, and enrollment pauses. Sites became confused, protocol deviation rates exceeded 30%, and 2 sites withdrew due to administrative burden.',
    earlyWarningSigns: `Protocol changes proposed within 2 months of first patient in\nSites requiring re-training for each amendment\nIncrease in protocol deviations after each amendment\nEnrollment suspension periods lasting 2-4 weeks\nSite staff unable to keep track of current protocol version\nMultiple outstanding queries related to protocol interpretation`,
    leadershipMisunderstanding: 'Sponsor viewed amendments as necessary for patient safety and scientific rigor, not recognizing operational impact. Failed to consider cumulative effect of multiple amendments. Did not understand that frequent changes undermine site confidence and protocol adherence. Believed sites would adapt to changes quickly.',
    whatWouldDoDifferently: 'Would consolidate amendments into single comprehensive update when possible. Would provide advanced notice and clear implementation timeline. Would conduct joint training for all sites on amendments. Would minimize protocol changes after first patient in. Would provide clear documentation and communication on all changes.',
    failureObviousAt: 'Month 4 - when second site withdrew citing amendment fatigue',
    confidenceLevel: 'MEDIUM',
    title: 'Phase II Neurology Trial - Amendment Cascade'
  },
  {
    role: 'PM',
    trialPhase: 'PHASE_III',
    therapeuticArea: 'Oncology',
    failureType: 'VENDOR_BREAKDOWN',
    whatFailed: 'Central lab providing critical assay failed to deliver results within contract SLAs. Results delayed by 4-6 weeks, causing enrollment delays at 8 sites. Communication from lab was poor, and contingency vendors were not identified in advance.',
    earlyWarningSigns: `Lab missed first few result delivery deadlines\nCommunication from lab became infrequent and vague\nSites reporting lack of clarity on sample processing requirements\nQuality control issues identified but not resolved promptly\nLab leadership unresponsive to sponsor escalation`,
    leadershipMisunderstanding: 'Sponsor assumed lab would perform based on contract terms and past performance. Failed to monitor lab performance metrics early. Did not have contingency plan for lab failure. Believed lab\'s reputation guaranteed performance. Did not realize lab was capacity-constrained.',
    whatWouldDoDifferently: 'Would implement lab performance monitoring from day one. Would identify and qualify backup vendors before trial start. Would have clear escalation path in contract. Would conduct regular performance reviews with lab leadership. Would build buffer time into timeline for potential delays.',
    failureObviousAt: 'Month 3 - when results consistently 4+ weeks late and sites complained',
    confidenceLevel: 'MEDIUM',
    title: 'Phase III Oncology Trial - Vendor Breakdown'
  },
  {
    role: 'CRC',
    trialPhase: 'PHASE_II',
    therapeuticArea: 'Cardiology',
    failureType: 'ENROLLMENT_COLLAPSE',
    whatFailed: 'Trial targeted high-risk patient population but screening failure rate exceeded 85% due to overly stringent inclusion criteria. Sites spent months screening patients who failed eligibility, exhausting staff and resources.',
    earlyWarningSigns: `Inclusion criteria more restrictive than similar trials\nScreening failure rate exceeding 50% at all activated sites\nSites unable to identify eligible patients despite large patient pool\nProtocol violations related to eligibility assessment`,
    leadershipMisunderstanding: 'Sponsor believed strict criteria would ensure high-quality data but did not consider operational impact. Failed to conduct pilot testing of eligibility criteria.',
    whatWouldDoDifferently: 'Would conduct pilot testing of eligibility criteria. Would relax criteria or adjust statistical assumptions. Would provide clear guidance on eligibility assessment.',
    failureObviousAt: 'Month 3 - after screening 200+ patients with zero enrollments',
    confidenceLevel: 'HIGH',
    title: 'Phase II Cardiology Trial - Overly Stringent Eligibility Criteria'
  },
  {
    role: 'PI',
    trialPhase: 'PHASE_I',
    therapeuticArea: 'Oncology',
    failureType: 'PROTOCOL_OVERLOAD',
    whatFailed: 'Phase I protocol with dose escalation, multiple dose levels, and complex safety monitoring created overwhelming workload for site staff. Safety data reporting errors led to protocol violations and data quality issues.',
    earlyWarningSigns: `Multiple dose levels requiring different procedures\nFrequent safety assessments and reporting requirements\nComplex dose modification algorithms\nSafety data reporting errors increasing`,
    leadershipMisunderstanding: 'Sponsor prioritized patient safety but did not consider operational feasibility. Failed to simplify procedures where possible.',
    whatWouldDoDifferently: 'Would simplify safety monitoring procedures. Would use electronic data capture for safety reporting. Would provide dedicated safety monitoring support.',
    failureObviousAt: 'Month 2 - after multiple safety reporting errors',
    confidenceLevel: 'HIGH',
    title: 'Phase I Oncology Trial - Complex Safety Monitoring'
  },
  {
    role: 'PM',
    trialPhase: 'PHASE_III',
    therapeuticArea: 'Oncology',
    failureType: 'BUDGET_UNDERFUNDING',
    whatFailed: 'Community site budgets did not account for increasing regulatory burden and inflation. Sites operating at loss, leading to staff turnover and poor performance.',
    earlyWarningSigns: `Sites requesting budget increases shortly after activation\nStaff turnover at funded sites higher than usual\nQuality concerns at budget-constrained sites`,
    leadershipMisunderstanding: 'Sponsor used outdated budget benchmarks. Failed to account for inflation and regulatory changes.',
    whatWouldDoDifferently: 'Would use current budget benchmarks. Would build in inflation adjustments. Would monitor site financial health.',
    failureObviousAt: 'Month 6 - when sites threatened withdrawal over budget',
    confidenceLevel: 'MEDIUM',
    title: 'Phase III Oncology Trial - Budget Inflation Not Accounted For'
  }
];

// Pattern Seeds (5 total)
const patternSeeds = [
  {
    slug: 'protocol-overload',
    title: 'Protocol Overload',
    failureType: 'PROTOCOL_OVERLOAD',
    therapeuticArea: 'Oncology',
    definition: 'A pattern where protocol complexity exceeds operational capacity, leading to systematic failures before first patient enrollment.',
    earlySignals: `Protocol document length exceeds 100 pages\nMore than 15 eligibility criteria\nMultiple complex primary and secondary endpoints\nFrequent source document verification requirements\nComplex inclusion criteria requiring multiple confirmations\nSite staff struggling to explain protocol to patients`,
    whyMissed: `Sponsor teams optimize for statistical power, not operational feasibility\nSites overpromise during feasibility to win business\nProtocol complexity is viewed as necessary for scientific rigor\nEarly warnings are dismissed as implementation challenges\nSites fear sounding incompetent if they raise concerns`,
    rootCause: `Protocol design without adequate site operator input\nInadequate pilot testing of operational burden\nCompetitive pressure to maximize protocol comprehensiveness\nSiloed teams within sponsor organizations\nUnderestimation of staff turnover impact on complex protocols`,
    mitigation: `Protocol complexity should be measured and tracked during design\nSites with prior experience should be prioritized for complex protocols\nBudget should include provisions for additional staff time\nPhased rollout to high-performing sites before broader activation\nRegular check-ins with sites to identify operational strain early`,
    summary: 'Excessive protocol complexity leading to site fatigue and data quality degradation before first patient enrollment.',
    createdBy: 'editor'
  },
  {
    slug: 'enrollment-mirage',
    title: 'Enrollment Mirage',
    failureType: 'ENROLLMENT_COLLAPSE',
    therapeuticArea: 'Oncology',
    definition: 'A pattern where site feasibility reports promise high enrollment that never materializes due to competitive landscape and patient pool exhaustion.',
    earlySignals: `Overly optimistic site feasibility reports\nCompeting trials in same indication\nRapid patient pool depletion\nScreen failure rates above 80%\nSites unable to identify potential patients\nDeclining patient availability over time`,
    whyMissed: `Sponsor teams accept feasibility at face value without verification\nSites overpromise to win business\nCompetitive landscape not tracked or understood\nPatient pool exhaustion not anticipated\nBelief that "more sites = more patients"`,
    rootCause: `No independent verification of site patient access\nFailure to track competing trials at sites\nInadequate understanding of patient pool dynamics\nSites lacking dedicated research coordinators\nNo patient recruitment strategy provided to sites`,
    mitigation: `Conduct real patient chart reviews during feasibility\nTrack competitive landscape at each site\nPrioritize sites with proven enrollment track records\nRequire dedicated research coordinator allocation\nProvide patient recruitment materials and strategies\nStagger site activation to avoid self-competition`,
    summary: 'Site estimates promising high enrollment that never materializes due to competitive landscape and patient pool exhaustion.',
    createdBy: 'editor'
  },
  {
    slug: 'budget-suffocation',
    title: 'Budget Suffocation',
    failureType: 'BUDGET_UNDERFUNDING',
    therapeuticArea: 'Cardiology',
    definition: 'A pattern where budgets are insufficient to cover actual operational costs, leading to quality compromises and site withdrawals.',
    earlySignals: `Budget below industry standard per patient\nMultiple non-reimbursable procedures required\nNo allowance for extra staff time\nSites declining participation or requesting increases\nSites operating at loss\nStaff turnover at funded sites higher than usual`,
    whyMissed: `Sponsor uses outdated budget benchmarks\nUnderestimation of regulatory burden\nBelief that academic sites accept lower budgets\nAssumption that insurance covers all procedures\nFailure to account for inflation and rising costs`,
    rootCause: `Inadequate cost analysis before budgeting\nOutdated benchmark data\nLack of understanding of site cost structures\nCompetitive pressure to minimize budgets\nFailure to budget for contingencies`,
    mitigation: `Conduct thorough cost analysis including all procedures\nUse current benchmark data\nInclude realistic staff time allocations\nBudget for required genetic testing and special procedures\nBuild in inflation adjustments and contingencies\nMonitor site financial health regularly`,
    summary: 'Community site budgets insufficient to cover actual operational costs, leading to early termination or quality compromises.',
    createdBy: 'editor'
  },
  {
    slug: 'cro-signal-loss',
    title: 'CRO Signal Loss',
    failureType: 'CRO_EXECUTION_FAILURE',
    therapeuticArea: null,
    definition: 'A pattern where communication breakdown between sponsor and CRO leads to operational blind spots and delayed intervention.',
    earlySignals: `Infrequent site monitoring\nDelayed data review cycles\nUnclear escalation pathways\nCRA turnover exceeding 40%\nSites unable to reach study management team\nIncreasing protocol deviations correlated with lack of oversight`,
    whyMissed: `Sponsor assumes CRO capacity based on contract terms\nBelief that CRO will self-monitor and self-correct\nFailure to implement performance metrics\nUnderestimation of CRO staffing issues\nLack of regular sponsor-CRO communication`,
    rootCause: `CRO understaffing due to winning too many trials\nCRA inexperience or lack of therapeutic expertise\nPoor communication between sponsor and CRO\nFailure to monitor CRO performance metrics\nNo contingency plans for CRO failures`,
    mitigation: `Implement CRO performance monitoring from day one\nRequire CRA therapeutic area experience\nHave backup CRA clause in contract\nConduct regular site satisfaction surveys\nImplement clear escalation pathways\nMonitor CRA workload and turnover`,
    summary: 'Communication breakdown between sponsor and CRO leading to operational blind spots and delayed intervention.',
    createdBy: 'editor'
  },
  {
    slug: 'amendment-cascade',
    title: 'Amendment Cascade',
    failureType: 'AMENDMENT_CASCADE',
    therapeuticArea: 'Neurology',
    definition: 'A pattern where multiple protocol amendments in rapid succession cause site confusion, protocol deviations, and enrollment delays.',
    earlySignals: `Protocol changes within 3 months\nSites requiring re-training on amendments\nIncrease in protocol deviations after amendments\nEnrollment suspension periods\nSite confusion about current protocol version\nMultiple outstanding queries related to interpretation`,
    whyMissed: `Sponsor views amendments as necessary for safety or science\nFailure to consider cumulative operational impact\nBelief that sites adapt quickly to changes\nUnderestimation of training burden\nLack of appreciation for protocol version confusion`,
    rootCause: `Inadequate protocol design requiring frequent changes\nPoor communication about amendments\nInsufficient training on protocol changes\nFailure to consolidate multiple changes\nNo consideration for amendment frequency`,
    mitigation: `Consolidate amendments into single comprehensive update\nProvide advanced notice and clear implementation timeline\nConduct joint training for all sites on amendments\nMinimize protocol changes after first patient in\nProvide clear documentation on all changes\nTrack protocol deviation rates after amendments`,
    summary: 'Multiple protocol amendments in rapid succession causing site confusion, protocol deviations, and enrollment delays.',
    createdBy: 'editor'
  }
];

async function main() {
  console.log('🌱 Starting Backstage content seeding...\n');

  // Create a demo user
  const demoUser = await prisma.user.upsert({
    where: { clerkId: 'demo-editor' },
    update: {},
    create: {
      clerkId: 'demo-editor',
      email: 'editor@backstage.ai',
      firstName: 'Editor',
      lastName: 'User',
      role: 'EDITOR',
      isEditor: true
    }
  });
  console.log(`✅ Demo user created: ${demoUser.email}`);

  // Seed post-mortems
  console.log('\n📝 Seeding post-mortems...');
  let postMortemCount = 0;
  
  for (const pm of postMortemSeeds) {
    // Create a user for each post-mortem if doesn't exist
    const user = await prisma.user.upsert({
      where: { clerkId: `user-${pm.role}-${postMortemCount}` },
      update: {},
      create: {
        clerkId: `user-${pm.role}-${postMortemCount}`,
        email: `user-${pm.role.toLowerCase()}${postMortemCount}@backstage.ai`,
        firstName: pm.role,
        lastName: 'Contributor',
        role: 'READER',
        isContributor: true
      }
    });

    const postMortem = await prisma.postMortem.create({
      data: {
        userId: user.id,
        ...pm,
        status: 'APPROVED' // Auto-approve for seeding
      }
    });
    
    postMortemCount++;
    console.log(`   Created post-mortem ${postMortemCount}: ${pm.title.substring(0, 50)}...`);
  }
  console.log(`✅ Created ${postMortemCount} post-mortems`);

  // Seed patterns
  console.log('\n📊 Seeding failure patterns...');
  let patternCount = 0;
  
  for (const pattern of patternSeeds) {
    const createdPattern = await prisma.failurePattern.create({
      data: {
        ...pattern,
        createdBy: demoUser.clerkId
      }
    });
    
    patternCount++;
    console.log(`   Created pattern ${patternCount}: ${pattern.title}`);
  }
  console.log(`✅ Created ${patternCount} failure patterns`);

  // Associate post-mortems with patterns
  console.log('\n🔗 Associating post-mortems with patterns...');
  
  // Get all post-mortems and patterns
  const allPostMortems = await prisma.postMortem.findMany();
  const allPatterns = await prisma.failurePattern.findMany();
  
  let associationCount = 0;
  
  for (const pm of allPostMortems) {
    // Find matching patterns based on failure type
    const matchingPatterns = allPatterns.filter(
      p => p.failureType === pm.failureType
    );
    
    for (const pattern of matchingPatterns) {
      await prisma.postMortemPattern.create({
        data: {
          postMortemId: pm.id,
          patternId: pattern.id,
          confidence: 100
        }
      });
      associationCount++;
    }
  }
  console.log(`✅ Created ${associationCount} pattern associations`);

  console.log('\n🎉 Seeding complete!');
  console.log(`\nSummary:`);
  console.log(`- ${postMortemCount} post-mortems created`);
  console.log(`- ${patternCount} failure patterns created`);
  console.log(`- ${associationCount} pattern associations created`);
  console.log(`\nPlatform is ready for testing! 🚀`);
}

main()
  .catch((e) => {
    console.error('Error seeding content:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });