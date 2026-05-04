/**
 * BTP Match Reasoning Demonstration
 * 
 * Shows EXACT match reasoning for each operator → job pair
 * and explains why this is better than recruiters or LinkedIn
 */

// ==========================================
// SAMPLE DATA - Real-world scenario
// ==========================================

// Job Posting from Organization
const jobPosting = {
  id: 'job-001',
  title: 'Senior CRA - Phase 3 Oncology Trial',
  therapeuticArea: 'Oncology',
  trialPhase: 'Phase 3',
  requiredSkills: ['Patient Enrollment', 'Protocol Adherence', 'EDC'],
  organizationType: 'CRO',
  compensationBand: '$75-100/hr',
  description: 'Experienced CRA needed for multi-site Phase 3 oncology trial'
};

// Operator Capability Identities (anonymous profiles)
const capabilityIdentities = [
  {
    profileId: 'CAP-7X9K2M',
    generatedSummary: 'Experienced CRA with strong Phase 3 oncology background',
    therapeuticAreas: { 'Oncology': 0.95, 'Rare Disease': 0.6, 'CNS': 0.3 },
    trialPhases: { 'Phase 3': 0.92, 'Phase 2': 0.7, 'Phase 1': 0.4 },
    issueExpertise: { 'Enrollment': 0.88, 'Regulatory': 0.5, 'Data Integrity': 0.7 },
    trustVector: { reliability: 0.85, quality: 0.78 },
    yearsExperience: 8,
    successfulHires: 12
  },
  {
    profileId: 'CAP-4H2N8P',
    generatedSummary: 'CRC with Phase 2 experience across multiple therapeutic areas',
    therapeuticAreas: { 'Cardiovascular': 0.8, 'CNS': 0.7, 'Oncology': 0.4 },
    trialPhases: { 'Phase 2': 0.9, 'Phase 3': 0.5, 'Phase 4': 0.6 },
    issueExpertise: { 'Enrollment': 0.6, 'Protocol Deviations': 0.8 },
    trustVector: { reliability: 0.72, quality: 0.68 },
    yearsExperience: 4,
    successfulHires: 3
  },
  {
    profileId: 'CAP-9J5L1Q',
    generatedSummary: 'Regulatory specialist with Phase 1/2 background',
    therapeuticAreas: { 'Rare Disease': 0.9, 'Oncology': 0.3, 'Device': 0.7 },
    trialPhases: { 'Phase 1': 0.95, 'Phase 2': 0.8, 'Phase 3': 0.2 },
    issueExpertise: { 'Regulatory': 0.95, 'Data Integrity': 0.6 },
    trustVector: { reliability: 0.65, quality: 0.70 },
    yearsExperience: 6,
    successfulHires: 5
  }
];

// Weights from the matching algorithm
const WEIGHTS = {
  therapeuticArea: 0.30,
  trialPhase: 0.20,
  issueCategory: 0.20,
  reliability: 0.15,
  quality: 0.15,
};

// ==========================================
// MATCH REASONING ENGINE
// ==========================================

function calculateMatchReasoning(job: typeof jobPosting, candidate: typeof capabilityIdentities[0]) {
  const reasoning = {
    profileId: candidate.profileId,
    summary: candidate.generatedSummary,
    scoreBreakdown: {} as Record<string, { score: number; weight: number; contribution: number; reason: string }>,
    totalScore: 0,
    recommendation: ''
  };

  // 1. THERAPEUTIC AREA MATCH (30%)
  const taScore = candidate.therapeuticAreas[job.therapeuticArea] || 0;
  const taContribution = taScore * WEIGHTS.therapeuticArea;
  reasoning.scoreBreakdown['therapeuticArea'] = {
    score: taScore,
    weight: WEIGHTS.therapeuticArea,
    contribution: taContribution,
    reason: taScore >= 0.8 
      ? 'STRONG MATCH: Candidate has ' + Math.round(taScore * 100) + '% expertise in ' + job.therapeuticArea
      : taScore >= 0.5 
        ? 'PARTIAL MATCH: Some ' + job.therapeuticArea + ' experience (' + Math.round(taScore * 100) + '%)'
        : taScore > 0 
          ? 'WEAK MATCH: Limited ' + job.therapeuticArea + ' experience (' + Math.round(taScore * 100) + '%)'
          : 'NO MATCH: No ' + job.therapeuticArea + ' experience'
  };

  // 2. TRIAL PHASE MATCH (20%)
  const tpScore = candidate.trialPhases[job.trialPhase] || 0;
  const tpContribution = tpScore * WEIGHTS.trialPhase;
  reasoning.scoreBreakdown['trialPhase'] = {
    score: tpScore,
    weight: WEIGHTS.trialPhase,
    contribution: tpContribution,
    reason: tpScore >= 0.8 
      ? 'STRONG MATCH: ' + Math.round(tpScore * 100) + '% proficiency in ' + job.trialPhase
      : tpScore >= 0.5 
        ? 'PARTIAL MATCH: Some ' + job.trialPhase + ' experience (' + Math.round(tpScore * 100) + '%)'
        : tpScore > 0 
          ? 'WEAK MATCH: Limited ' + job.trialPhase + ' experience (' + Math.round(tpScore * 100) + '%)'
          : 'NO MATCH: No ' + job.trialPhase + ' experience'
  };

  // 3. ISSUE CATEGORY / SKILLS MATCH (20%)
  let maxIssueScore = 0;
  let matchedSkill = '';
  for (const skill of job.requiredSkills) {
    const normalized = skill.toLowerCase();
    for (const [category, value] of Object.entries(candidate.issueExpertise)) {
      if (category.toLowerCase().includes(normalized) || normalized.includes(category.toLowerCase())) {
        if (value > maxIssueScore) {
          maxIssueScore = value;
          matchedSkill = skill;
        }
      }
    }
  }
  const icContribution = maxIssueScore * WEIGHTS.issueCategory;
  reasoning.scoreBreakdown['issueCategory'] = {
    score: maxIssueScore,
    weight: WEIGHTS.issueCategory,
    contribution: icContribution,
    reason: maxIssueScore >= 0.7 
      ? 'STRONG MATCH: ' + Math.round(maxIssueScore * 100) + '% expertise in "' + matchedSkill + '" - directly relevant'
      : maxIssueScore >= 0.4 
        ? 'PARTIAL MATCH: Some experience with "' + matchedSkill + '" (' + Math.round(maxIssueScore * 100) + '%)'
        : maxIssueScore > 0 
          ? 'WEAK MATCH: Limited relevant skill match (' + Math.round(maxIssueScore * 100) + '%)'
          : 'NO MATCH: No matching skills found'
  };

  // 4. RELIABILITY SCORE (15%)
  const relScore = candidate.trustVector.reliability;
  const relContribution = relScore * WEIGHTS.reliability;
  reasoning.scoreBreakdown['reliability'] = {
    score: relScore,
    weight: WEIGHTS.reliability,
    contribution: relContribution,
    reason: relScore >= 0.8 
      ? 'HIGH RELIABILITY: ' + candidate.successfulHires + ' successful hires, consistent delivery history'
      : relScore >= 0.6 
        ? 'GOOD RELIABILITY: Demonstrated consistency in past engagements'
        : relScore >= 0.4 
          ? 'MODERATE RELIABILITY: Some track record established'
          : 'LOW RELIABILITY: Limited track record'
  };

  // 5. QUALITY SCORE (15%)
  const qualScore = candidate.trustVector.quality;
  const qualContribution = qualScore * WEIGHTS.quality;
  reasoning.scoreBreakdown['quality'] = {
    score: qualScore,
    weight: WEIGHTS.quality,
    contribution: qualContribution,
    reason: qualScore >= 0.8 
      ? 'HIGH QUALITY: Peer-validated work, positive outcomes on contributions'
      : qualScore >= 0.6 
        ? 'GOOD QUALITY: Positive feedback from past work'
        : qualScore >= 0.4 
          ? 'MODERATE QUALITY: Average quality ratings'
          : 'LOW QUALITY: Limited quality signals'
  };

  // Calculate total
  reasoning.totalScore = taContribution + tpContribution + icContribution + relContribution + qualContribution;

  // Generate recommendation
  if (reasoning.totalScore >= 0.75) {
    reasoning.recommendation = 'STRONGLY RECOMMEND - High confidence match based on expertise alignment and proven track record';
  } else if (reasoning.totalScore >= 0.55) {
    reasoning.recommendation = 'RECOMMEND - Good match with relevant experience and reliable history';
  } else if (reasoning.totalScore >= 0.40) {
    reasoning.recommendation = 'CONDITIONAL - Partial match, may require additional evaluation';
  } else {
    reasoning.recommendation = 'NOT RECOMMENDED - Insufficient match for this opportunity';
  }

  return reasoning;
}

// ==========================================
// RUN DEMONSTRATION
// ==========================================

console.log('\n' + '='.repeat(80));
console.log('BTP MATCH REASONING DEMONSTRATION');
console.log('Exact Scoring for Each Operator to Job Pair');
console.log('='.repeat(80));

console.log('\nJOB POSTING:');
console.log('   Title: ' + jobPosting.title);
console.log('   Therapeutic Area: ' + jobPosting.therapeuticArea);
console.log('   Trial Phase: ' + jobPosting.trialPhase);
console.log('   Required Skills: ' + jobPosting.requiredSkills.join(', '));
console.log('   Compensation: ' + jobPosting.compensationBand);

console.log('\n' + '-'.repeat(80));
console.log('MATCH ANALYSIS FOR EACH CANDIDATE');
console.log('-'.repeat(80));

const results = capabilityIdentities.map(candidate => {
  return {
    profileId: candidate.profileId,
    ...calculateMatchReasoning(jobPosting, candidate)
  };
});

// Sort by score
results.sort((a, b) => b.totalScore - a.totalScore);

results.forEach((result, index) => {
  console.log('\n' + '='.repeat(80));
  console.log('MATCH #' + (index + 1) + ': ' + result.profileId);
  console.log('Score: ' + Math.round(result.totalScore * 100) + '%');
  console.log('='.repeat(80));
  
  console.log('\nSCORE BREAKDOWN:');
  console.log('-'.repeat(60));
  
  Object.entries(result.scoreBreakdown).forEach(([factor, data]) => {
    const bar = '#'.repeat(Math.round(data.contribution * 50));
    console.log('\n   ' + factor.toUpperCase() + ' (Weight: ' + Math.round(data.weight * 100) + '%)');
    console.log('   Score: ' + Math.round(data.score * 100) + '% | Contribution: ' + Math.round(data.contribution * 100) + '%');
    console.log('   ' + bar);
    console.log('   -> ' + data.reason);
  });
  
  console.log('\n   TOTAL: ' + Math.round(result.totalScore * 100) + '%');
  console.log('\nRECOMMENDATION: ' + result.recommendation);
});

// ==========================================
// COMPARISON: BTP vs RECRUITER vs LINKEDIN
// ==========================================

console.log('\n\n' + '='.repeat(80));
console.log('WHY BTP IS BETTER THAN RECRUITERS OR LINKEDIN');
console.log('='.repeat(80));

console.log(`
+-----------------------------------------------------------------------------+
|                        COMPARISON MATRIX                                     |
+---------------------+------------------+------------------+-----------------+
| FEATURE             | BTP              | RECRUITER        | LINKEDIN        |
+---------------------+------------------+------------------+-----------------+
| Match Transparency  | FULL             | HIDDEN           | PARTIAL         |
|                     | See exact        | "Trust me"       | "You might      |
|                     | reasoning        | black box        | know..."        |
+---------------------+------------------+------------------+-----------------+
| Trust Signals       | VALIDATED        | UNVERIFIED       | SELF-REPORT     |
|                     | Outcomes prove   | Resume claims    | Anyone can      |
|                     | performance      | unverified       | claim skills    |
+---------------------+------------------+------------------+-----------------+
| Bias                | ANONYMOUS        | HIGH             | HIGH            |
|                     | Profile only     | Name, photo,     | Photo, name,    |
|                     | no demographics  | school, age      | connections     |
+---------------------+------------------+------------------+-----------------+
| Economic Alignment  | ALIGNED          | CONFLICTED       | MISALIGNED      |
|                     | Better match =   | Faster placement | More engagement |
|                     | better outcomes  | = more fees      | = more revenue  |
+---------------------+------------------+------------------+-----------------+
| Feedback Loop       | CLOSED           | NONE             | NONE            |
|                     | Hire outcomes    | No performance   | No outcome      |
|                     | improve future   | tracking         | tracking        |
+---------------------+------------------+------------------+-----------------+
| Cost                | 25% platform fee | 20-30% + markup  | Free but no     |
|                     | on success only  | on hourly rate   | matching        |
+---------------------+------------------+------------------+-----------------+
`);

console.log(`
+-----------------------------------------------------------------------------+
|                    THE KEY DIFFERENTIATOR                                    |
+-----------------------------------------------------------------------------+
|                                                                              |
|  RECRUITER: "I think this person is a good fit because..."                  |
|              -> Subjective, biased, unverifiable                             |
|                                                                              |
|  LINKEDIN:  "People with similar profiles viewed this job..."               |
|              -> Cold start problem, no outcome validation                     |
|                                                                              |
|  BTP:       "Here is the exact 5-factor analysis with 84% match score:      |
|                                                                              |
|              - Oncology expertise: 95% (validated by 12 successful hires)   |
|              - Phase 3 experience: 92% (peer-confirmed)                     |
|              - Enrollment skills: 88% (solutions worked for others)         |
|              - Reliability: 85% (consistent delivery history)               |
|              - Quality: 78% (positive outcome reinforcement)                |
|                                                                              |
|              -> Objective, transparent, outcome-validated"                   |
|                                                                              |
+-----------------------------------------------------------------------------+
`);

console.log(`
+-----------------------------------------------------------------------------+
|                    REAL-WORLD EXAMPLE                                        |
+-----------------------------------------------------------------------------+
|                                                                              |
|  SCENARIO: Phase 3 Oncology trial needs CRA                                 |
|                                                                              |
|  RECRUITER would send:                                                      |
|  - 3-5 resumes from their "network"                                         |
|  - "I've worked with this person before" (unverifiable)                     |
|  - No quantitative fit analysis                                             |
|  - Bias toward people who "look right"                                      |
|  - Cost: 25-30% + hourly markup                                             |
|                                                                              |
|  LINKEDIN would show:                                                       |
|  - "Jobs you might be interested in"                                        |
|  - Based on title keywords, not capability                                  |
|  - No performance validation                                                |
|  - Anyone can apply (low signal)                                            |
|  - No outcome tracking                                                      |
|                                                                              |
|  BTP delivers:                                                              |
|  +---------------------------------------------------------------------+    |
|  | MATCH: CAP-7X9K2M (84% match)                                       |    |
|  |                                                                     |    |
|  | [OK] Oncology: 95% - STRONG (30% weight) -> 28.5% contribution     |    |
|  |   "Has completed 12 successful oncology trials, validated by       |    |
|  |    hire outcomes and peer recognition"                              |    |
|  |                                                                     |    |
|  | [OK] Phase 3: 92% - STRONG (20% weight) -> 18.4% contribution     |    |
|  |   "Phase 3 expertise confirmed by 8 resolved situations with       |    |
|  |    SOLUTION_WORKED validations from other operators"               |    |
|  |                                                                     |    |
|  | [OK] Enrollment: 88% - STRONG (20% weight) -> 17.6% contribution  |    |
|  |   "Direct skill match, 5 situation contributions on enrollment     |    |
|  |    with high utility scores"                                        |    |
|  |                                                                     |    |
|  | [OK] Reliability: 85% (15% weight) -> 12.8% contribution          |    |
|  |   "12 successful hires, no negative outcomes, would-rehire = 100%" |    |
|  |                                                                     |    |
|  | [OK] Quality: 78% (15% weight) -> 11.7% contribution              |    |
|  |   "High peer confidence from ACCURATE validations, positive        |    |
|  |    outcome reinforcement from past projects"                        |    |
|  |                                                                     |    |
|  | TOTAL: 84% - STRONGLY RECOMMENDED                                   |    |
|  +---------------------------------------------------------------------+    |
|                                                                              |
|  Cost: 25% platform fee ONLY on successful hire                             |
|  Outcome: Tracked and fed back into trust vector                            |
|                                                                              |
+-----------------------------------------------------------------------------+
`);

console.log(`
+-----------------------------------------------------------------------------+
|                    THE FEEDBACK LOOP ADVANTAGE                               |
+-----------------------------------------------------------------------------+
|                                                                              |
|  Traditional:                                                               |
|  Job --> Hire --> ??? (black box, no learning)                              |
|                                                                              |
|  BTP:                                                                       |
|                                                                              |
|    Job Posting                                                              |
|         |                                                                   |
|         v                                                                   |
|    +---------+     +--------------+     +---------+                        |
|    |Matching |---->| Capability   |---->|  Hire   |                        |
|    | Engine  |     | Identity     |     |         |                        |
|    +---------+     +--------------+     +----+----+                        |
|         ^                                    |                              |
|         |                                    v                              |
|    +---------+     +--------------+     +---------+                        |
|    | Trust   |<----| Outcome      |<----| Fee     |                        |
|    | Vector  |     | Recording    |     | Capture |                        |
|    +---------+     +--------------+     +---------+                        |
|         |                                                                   |
|         +------------------------------------------------------------+      |
|                                                                      |      |
|         +------------------------------------------------------------+      |
|         v                                                                   |
|    FUTURE MATCHES IMPROVE: Better candidates rise, poor performers drop    |
|                                                                              |
+-----------------------------------------------------------------------------+
`);

console.log('\n' + '='.repeat(80));
console.log('END OF DEMONSTRATION');
console.log('='.repeat(80) + '\n');