#!/usr/bin/env python3
"""Update Prisma schema with Translation Engine models and fields."""

import re

schema_path = 'prisma/schema.prisma'

with open(schema_path, 'r') as f:
    content = f.read()

# 1. Add new fields to Contribution model - insert before "// Relations" in Contribution
contribution_new_fields = '''
  // ==================== TRANSLATION ENGINE FIELDS ====================
  
  // Suppressed Signal Detection
  suppressedSignalType String?  // NOT_ESCALATED, ESCALATED_IGNORED, NORMALIZED_WORKAROUND, FEAR_OF_PUSHBACK, SPONSOR_PRESSURE, CRO_PRESSURE, SITE_SILENCE, UNKNOWN
  
  // Emotional Signal Extraction
  emotionalSignalType  String?  // OVERLOAD, FRUSTRATION, RESIGNATION, SILENCED, ESCALATION_FEAR, UNKNOWN
  
  // Workaround Detection
  workaroundPresent    Boolean  @default(false)
  workaroundType       String?  // PROCESS_SKIP, DATA_SHORTCUT, OFF_LABEL_PROCEDURE, UNOFFICIAL_TOOL, MANUAL_WORKAROUND, UNKNOWN
  
  // System Mismatch Detection
  systemOfRecordMismatch Boolean @default(false)
  officialRealityGap    Float   @default(0.0) // 0-1 score
  
  // Decision Distance
  decisionDistanceLevel String? // LOW, MEDIUM, HIGH, CRITICAL
  
  // Burden Detection
  burdenAbsorber    String?  // SITE, PATIENT, OPERATOR, SPONSOR, CRO, UNKNOWN
  burdenType        String?  // TIME, COMPLEXITY, EMOTIONAL, FINANCIAL, OPERATIONAL, UNKNOWN
  
  // Invisible Work Classification
  invisibleWorkType String?  // COORDINATION, COMMUNICATION, DOCUMENTATION, TRAINING, TROUBLESHOOTING, ADVOCACY, UNKNOWN
  
  // Risk & Impact Prediction
  likelyDownstreamRisk   String?  // NONE, LOW, MEDIUM, HIGH, CRITICAL
  escalationPattern      String?  // NONE, LOCAL, REGIONAL, GLOBAL, ESCALATING
  patientImpactPotential String?  // NONE, LOW, MEDIUM, HIGH, CRITICAL
  operationalDebtLevel   Float    @default(0.0) // 0-1 score
  
  // Economic Value
  economicValuePotential  Float    @default(0.0) // 0-1 score
  microOpportunityEligible Boolean  @default(false)
  
  // Drift Indicators
  driftIndicatorsJson     Json?    // Array of detected drift signals
  
  // Failure Trajectory Prediction
  failureTrajectoryPrediction String? // NONE, LIKELY_ESCALATION, HIGH_RISK_ESCALATION
  
  // Signal Quality & Maturity
  signalQualityScore    String?  // HIGH, MEDIUM, LOW
  patternMaturity       String?  // EMERGING, REPEATING, ESTABLISHED
  
  // Predictive Summary
  predictiveSummary     String?  // AI-generated summary of likely outcomes
  
  // Confidence
  confidenceScore       Float    @default(0.5) // 0-1 score
'''

# Add new relations to Contribution
contribution_new_relations = '''
  followUps         ContributionFollowUp[]
  executionSignal   ExecutionSignalExtraction?
'''

# Add new indexes to Contribution
contribution_new_indexes = '''
  @@index([signalQualityScore])
  @@index([patternMaturity])
  @@index([suppressedSignalType])
  @@index([emotionalSignalType])
'''

# Insert new fields before "// Relations" in Contribution model
# Find the first "// Relations" that's inside the Contribution model
contribution_start = content.find('model Contribution {')
contribution_end = content.find('}', contribution_start)
contribution_body = content[contribution_start:contribution_end]

# Add fields before "  // Relations" 
content = content.replace(
    '  // Relations\n  user              User?    @relation(fields: [userId], references: [id])\n  interactions      Interaction[]\n  outcomes          ContributionOutcome[]',
    contribution_new_fields + '\n  // Relations\n  user              User?    @relation(fields: [userId], references: [id])\n  interactions      Interaction[]\n  outcomes          ContributionOutcome[]' + contribution_new_relations
)

# Add new indexes before the closing } of Contribution
content = content.replace(
    '  @@index([contributionType])\n  @@index([therapeuticArea])\n  @@index([issueCategory])\n  @@index([resolutionStatus])\n}\n\n// Interaction',
    '  @@index([contributionType])\n  @@index([therapeuticArea])\n  @@index([issueCategory])\n  @@index([resolutionStatus])' + contribution_new_indexes + '}\n\n// Interaction'
)

# 2. Add new models at the end of the file (before the last newline)
new_models = '''
// ==================== EXECUTION INTELLIGENCE INFRASTRUCTURE ====================

// ExecutionSignalExtraction - Structured signal extracted from raw submission
// This is the core Translation Engine output
model ExecutionSignalExtraction {
  id                String   @id @default(cuid())
  contributionId    String   @unique
  
  // Signal Stage
  signalStage       String   // EARLY, ACTIVE, FAILURE, OUTCOME
  
  // Workaround Detection
  workaroundPresent Boolean  @default(false)
  workaroundType    String?  // PROCESS_SKIP, DATA_SHORTCUT, OFF_LABEL_PROCEDURE, UNOFFICIAL_TOOL, MANUAL_WORKAROUND, UNKNOWN
  
  // Suppressed Signal
  suppressedSignalType String?  // NOT_ESCALATED, ESCALATED_IGNORED, NORMALIZED_WORKAROUND, FEAR_OF_PUSHBACK, SPONSOR_PRESSURE, CRO_PRESSURE, SITE_SILENCE, UNKNOWN
  
  // Emotional Signal
  emotionalSignalType  String?  // OVERLOAD, FRUSTRATION, RESIGNATION, SILENCED, ESCALATION_FEAR, UNKNOWN
  
  // Mismatch Detection
  systemOfRecordMismatch Boolean @default(false)
  officialRealityGap  Float    @default(0.0) // 0-1 score
  
  // Decision Distance
  decisionDistanceLevel String? // LOW, MEDIUM, HIGH, CRITICAL
  
  // Burden Detection
  burdenAbsorber    String?  // SITE, PATIENT, OPERATOR, SPONSOR, CRO, UNKNOWN
  burdenType        String?  // TIME, COMPLEXITY, EMOTIONAL, FINANCIAL, OPERATIONAL, UNKNOWN
  
  // Invisible Work
  invisibleWorkType String?  // COORDINATION, COMMUNICATION, DOCUMENTATION, TRAINING, TROUBLESHOOTING, ADVOCACY, UNKNOWN
  
  // Risk & Impact
  likelyDownstreamRisk   String?  // NONE, LOW, MEDIUM, HIGH, CRITICAL
  escalationPattern      String?  // NONE, LOCAL, REGIONAL, GLOBAL, ESCALATING
  patientImpactPotential String?  // NONE, LOW, MEDIUM, HIGH, CRITICAL
  operationalDebtLevel   Float    @default(0.0) // 0-1 score
  
  // Economic Value
  economicValuePotential  Float    @default(0.0) // 0-1 score
  microOpportunityEligible Boolean  @default(false)
  
  // Drift Indicators
  driftIndicatorsJson     Json?    // Array of detected drift signals
  
  // Failure Trajectory
  failureTrajectoryPrediction String? // NONE, LIKELY_ESCALATION, HIGH_RISK_ESCALATION
  
  // Signal Quality
  signalQualityScore    String?  // HIGH, MEDIUM, LOW
  
  // Predictive Summary & Confidence
  predictiveSummary     String?
  confidenceScore       Float    @default(0.5) // 0-1 score
  
  // Metadata
  extractionVersion     Int      @default(1)
  
  // Relations
  contribution      Contribution @relation(fields: [contributionId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([signalStage])
  @@index([suppressedSignalType])
  @@index([signalQualityScore])
  @@index([workaroundPresent])
  @@index([microOpportunityEligible])
}

// ContributionFollowUp - 7-14 Day Truth Loop
// Validates predictions and builds longitudinal intelligence
model ContributionFollowUp {
  id                String    @id @default(cuid())
  contributionId    String
  userId            String?
  
  // Follow-up Type
  followUpType      String    @default("truth_loop") // truth_loop, admin_initiated, self_reported
  
  // Status Change
  statusChange      String    // stayed_manageable, got_worse, caused_delay_deviation_dropout, resolved
  
  // Context
  notes             String?   // Optional additional context
  
  // Validation
  validatedPrediction String?  // Which prediction this validates
  
  // Timing
  daysSinceSubmission Int?     // Days between submission and follow-up
  
  // Relations
  contribution      Contribution @relation(fields: [contributionId], references: [id], onDelete: Cascade)
  user              User?     @relation(fields: [userId], references: [id])
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([contributionId])
  @@index([statusChange])
  @@index([createdAt])
}

// FailurePathway - Causal chain tracking
// Maps sequences: EARLY → ACTIVE → FAILURE → OUTCOME
model FailurePathway {
  id                String    @id @default(cuid())
  
  // Pathway Definition
  pathwayType       String    // workaround_overload_deviation, suppression_escalation_failure, burden_burnout_turnover, drift_protocol_violation
  stage             String    // EARLY, ACTIVE, FAILURE, OUTCOME
  
  // Contributing Signals
  contributionIds   String[]  // IDs of contributions in this pathway
  
  // Detection
  triggerSignals    Json?     // What triggered this pathway
  intermediateSignals Json?   // Signals between stages
  outcomeSignal     Json?     // Final outcome signal
  
  // Risk Assessment
  pathwayRisk       Float     @default(0.0) // 0-1 overall risk score
  confidenceScore   Float     @default(0.5) // 0-1 confidence in pathway
  
  // Status
  isActive          Boolean   @default(true)
  confirmedAt       DateTime?
  
  // Metadata
  detectedAt        DateTime  @default(now())
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([pathwayType])
  @@index([stage])
  @@index([isActive])
  @@index([detectedAt])
}

// ContributorHealthFlag - Silence and behavior signals
// Track high-signal contributors and inactivity drop-offs
model ContributorHealthFlag {
  id                String    @id @default(cuid())
  userId            String    @unique
  
  // Contributor Signal Level
  signalLevel       String    @default("normal") // high_signal, normal, low_signal, dormant
  
  // Activity Tracking
  lastContributionAt DateTime?
  contributionCount Int       @default(0)
  avgSignalQuality  Float     @default(0.5) // Average SQS of contributions
  
  // Behavior Flags
  isInactive        Boolean   @default(false)
  inactivityDays    Int?
  dropOffDetected   Boolean   @default(false)
  dropOffDate       DateTime?
  
  // Engagement
  followUpResponseRate Float  @default(0.0) // 0-1 rate of truth loop responses
  reflectionOpenRate Float    @default(0.0) // 0-1 rate of reflection opens
  
  // Risk
  churnRisk         Float     @default(0.0) // 0-1 risk of contributor churning
  
  // Admin
  adminNoted        Boolean   @default(false)
  adminNotes        String?
  
  // Relations
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([signalLevel])
  @@index([isInactive])
  @@index([churnRisk])
}
'''

# Add followUps and executionSignal to User model too
# User already has contributions relation, just need contributorHealthFlag
content = content.replace(
    '  contributionOutcomes  ContributionOutcome[]\n  hireOutcomes          HireOutcome[]\n}',
    '  contributionOutcomes  ContributionOutcome[]\n  hireOutcomes          HireOutcome[]\n  contributorHealthFlag ContributorHealthFlag?\n  followUps             ContributionFollowUp[]\n}'
)

# Append new models at the end
content = content.rstrip() + '\n' + new_models

with open(schema_path, 'w') as f:
    f.write(content)

print("Schema updated successfully!")