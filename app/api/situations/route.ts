import { notifyFoundingResponders } from '@/lib/engagement';
import { after } from 'next/server';
import { isAdminMember, isApprovedMember } from '@/lib/access-policy';
import { getOrCreateTeamUser } from '@/lib/team-account';
/**
 * Situations API - Intelligence Realm
 * 
 * TRANSLATION ENGINE + ZERO-FRICTION INPUT
 * 
 * Architecture Rules:
 * - Minimal input (just description required)
 * - Automatic AI structuring + Translation Engine extraction
 * - Safe-to-Submit: user reviews sanitized content before posting
 * - Signal Quality Score (SQS) hidden from users
 * - Pattern maturity: EMERGING/REPEATING/ESTABLISHED
 * - Reflection engine generates human-language insights
 * - Uses Contribution model (NOT Signal)
 * - Uses Interaction model (NOT SignalEndorsement)
 * - NO social metrics (no counts, rankings, leaderboards)
 * - Time bucketing instead of timestamps (prevents temporal correlation)
 * - Automatic redaction of identifying information
 * - Correlation risk scoring on all content
 * 
 * Flow:
 * 1. User types raw text → POST /api/situations/review → sees sanitized version
 * 2. User confirms sanitized version → POST /api/situations (this route)
 * 3. Translation engine extracts structured intelligence
 * 4. Reflection engine generates human-language insights
 * 5. All translation fields stored on Contribution model
 * 6. Confirmation screen shows reflection content
 */

import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { 
  applyAutomaticRedaction, 
  calculateCorrelationRisk,
  checkExtractionCorrelationRisk,
  generalizeExtractionFields,
  bucketTimestamp
} from '@/lib/anti-correlation';
import { updateTrustVector } from '@/lib/trust-vector';
import { translateAndStructure } from '@/lib/translation-engine';
import { generateQuickReflection, generateReflection } from '@/lib/reflection-engine';
import { createPathwaysForContribution } from '@/lib/failure-pathway';
import { scanForAggressiveTriggers } from '@/lib/micro-opportunity';
import { getOrCreateUserMetrics, trackEvent, EVENT_TYPES } from '@/lib/analytics-tracker';
import type { ExecutionSignal } from '@/lib/translation-engine';
import { buildLedgerEvent } from '@/lib/knowledge-ledger';

// Valid therapeutic areas
const THERAPEUTIC_AREAS = [
  'Oncology',
  'Cardiology', 
  'Neurology',
  'Immunology',
  'Rare Disease',
  'Pediatrics',
  'Infectious Disease',
  'Metabolism',
  'Respiratory',
  'Dermatology',
  'Device',
  'CNS',
  'Cardiovascular',
  'Other'
];

// Valid issue categories
const ISSUE_CATEGORIES = [
  'Enrollment',
  'Protocol burden',
  'Sponsor expectations',
  'Data integrity',
  'Regulatory',
  'Operational',
  'Staffing',
  'Site Overload',
  'Patient Retention',
  'Budget/Reimbursement',
  'Other'
];

/**
 * GET /api/situations
 * 
 * List situations with anonymity-preserving filters
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    if (!isApprovedMember(user)) {
      return createErrorResponse('Approved BTP membership is required', 403);
    }

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim().slice(0, 200);
    const cursor = searchParams.get('cursor');
    const limit = 30;
    const therapeuticArea = searchParams.get('therapeuticArea');
    const issueCategory = searchParams.get('issueCategory');
    const timeBucket = searchParams.get('timeBucket'); // 'today', 'week', 'month'
    
    // Build where clause
    // Public questions remain discoverable regardless of their internal signal score.
    // Safety review still wins: hidden, flagged, or founder-excluded records stay out.
    const where: Record<string, unknown> = {
      contributionType: { in: ['question', 'situation'] },
      isHidden: false,
      isFlagged: false,
      forceExcludeFromPatterns: false,
    };
    
    if (query) where.OR = ['title', 'description', 'issueCategory'].map(field => ({ [field]: { contains: query, mode: 'insensitive' } }));

    if (therapeuticArea && THERAPEUTIC_AREAS.includes(therapeuticArea)) {
      where.therapeuticArea = therapeuticArea;
    }
    
    if (issueCategory && ISSUE_CATEGORIES.includes(issueCategory)) {
      where.issueCategory = issueCategory;
    }
    
    // Time bucket filter
    if (timeBucket) {
      const now = new Date();
      let startDate: Date;
      
      switch (timeBucket) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }
      
      where.createdAt = { gte: startDate };
    }
    
    // Fetch situations (Contribution model with type='situation')
    const situations = await prisma.contribution.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        therapeuticArea: true,
        trialPhase: true,
        issueCategory: true,
        urgencyLevel: true,
        resolutionStatus: true,
        createdAt: true,
        // NO userId - complete anonymity
        interactions: {
          where: {
            interactionType: 'ANSWER',
            displayStatus: 'VISIBLE',
          },
          select: {
            interactionType: true
          }
        }
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit + 1
    });
    
    // Transform for output (apply time bucketing, remove timestamps)
    const transformedSituations = situations.slice(0, limit).map(situation => {
      // Bucket the timestamp
      const timeBucketInfo = bucketTimestamp(situation.createdAt);
      
      return {
        id: situation.id,
        title: situation.title,
        description: situation.description,
        therapeuticArea: situation.therapeuticArea,
        trialPhase: situation.trialPhase,
        issueCategory: situation.issueCategory,
        urgencyLevel: situation.urgencyLevel,
        resolutionStatus: situation.resolutionStatus,
        // Time bucket instead of exact timestamp
        timeBucket: timeBucketInfo.bucket,
        timeLabel: timeBucketInfo.label,
        // Coarse response state only. Pending, suppressed, and blocked answers
        // must not leak into member-facing discovery.
        hasVisibleAnswer: situation.interactions.length > 0,
        // Retain the existing web list contract without exposing any additional
        // interaction state. These aliases now describe visible answers only.
        hasInteractions: situation.interactions.length > 0,
        interactionTypesPresent: situation.interactions.length > 0 ? ['ANSWER'] : [],
      };
    });
    
    return createApiResponse({
      situations: transformedSituations,
      nextCursor: situations.length > limit ? situations[limit - 1].id : null,
      filters: {
        therapeuticArea,
        issueCategory,
        timeBucket
      }
    });
    
  } catch (error) {
    console.error('Error fetching situations:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { requireAuth: true });

/**
 * POST /api/situations
 * 
 * Create a new situation with Translation Engine extraction
 * 
 * This route is called AFTER the user has reviewed the sanitized version
 * from /api/situations/review and confirmed it.
 * 
 * Parameters:
 *  - description: The SANITIZED content (user-reviewed)
 *  - confirmedRedaction: Boolean confirming user saw the redacted version
 *  - chips: Optional context chips the user selected
 *  - category: Optional category hint (legacy)
 *  - role: Optional role hint (legacy)
 */
export const POST = withAuth(async (req, user) => {
      if (!isApprovedMember(user)) {
        return createErrorResponse('Approved BTP membership is required', 403);
      }

      const body = await req.json();
      // Admins may publish under the BTP team profile (starter questions).
      const postedByAdminId: string | null = body?.postAsTeam === true && isAdminMember(user) ? user.id : null;
      if (body?.postAsTeam === true && !postedByAdminId) {
        return createErrorResponse('Only admins can post as the BTP team', 403);
      }
      if (postedByAdminId) user = await getOrCreateTeamUser();
      const { 
        description, 
        confirmedRedaction,
        chips,
        category,
        role,
        // Legacy fields for backwards compatibility
        title,
        therapeuticArea,
        trialPhase,
        issueCategory,
        urgencyLevel,
        siteCountRange,
        geographicScope
      } = body;
      
      // Validate required fields - only description needed
      if (typeof description !== 'string' || description.trim().length === 0) {
        return createErrorResponse('Description is required', 400);
      }

      // The review endpoint enforces the same cap, but this route must defend
      // itself because an API client can bypass the preview step entirely.
      if (description.length > 5000) {
        return createErrorResponse('Description is too long (max 5000 characters)', 400);
      }

      // Must confirm they reviewed the redacted version
      if (!confirmedRedaction) {
        return createErrorResponse('Please review the sanitized version before posting', 400);
      }
      
      // ─── TRANSLATION ENGINE ───
      // The approved sanitized question is the source of truth. Raw preview
      // text is not processed or retained after the user approves the preview.
      const rawText = description.trim();
      const { signal, structured } = translateAndStructure(rawText);
      
      // ─── REDACTION ───
      // Apply redaction to the description if it hasn't been done already
      let redactedDescription: string;
      let redactions: Array<{ original: string; replacement: string; type: string; position: [number, number] }>;
      
      if (confirmedRedaction) {
        // Re-run redaction on the approved text for defense in depth.
        const redactionResult = applyAutomaticRedaction(rawText);
        redactedDescription = redactionResult.redactedContent;
        redactions = redactionResult.redactions;
      } else {
        // Fallback: redact the provided description
        redactedDescription = rawText;
        redactions = [];
      }
      
      // ─── POST-EXTRACTION CORRELATION RISK (Section 12) ───
      // Check if the combination of extracted fields creates correlation risk
      const extractionCorrelation = checkExtractionCorrelationRisk({
        suppressedSignalType: signal.suppressedSignalType,
        emotionalSignalType: signal.emotionalSignalType,
        workaroundType: signal.workaroundType,
        systemOfRecordMismatch: signal.systemOfRecordMismatch,
        officialRealityGap: signal.officialRealityGap,
        decisionDistanceLevel: signal.decisionDistanceLevel,
        burdenAbsorber: signal.burdenAbsorber,
        burdenType: signal.burdenType,
        invisibleWorkType: signal.invisibleWorkType,
        likelyDownstreamRisk: signal.likelyDownstreamRisk,
        driftIndicators: signal.driftIndicators
      });
      
      // If extraction correlation is high/critical, generalize fields before storing
      if (extractionCorrelation.riskLevel === 'high' || extractionCorrelation.riskLevel === 'critical') {
        const generalized = generalizeExtractionFields({
          suppressedSignalType: signal.suppressedSignalType,
          emotionalSignalType: signal.emotionalSignalType,
          workaroundType: signal.workaroundType,
          burdenAbsorber: signal.burdenAbsorber,
          burdenType: signal.burdenType,
          invisibleWorkType: signal.invisibleWorkType
        });
        // Apply generalized values back to signal
        if (generalized.suppressedSignalType) signal.suppressedSignalType = generalized.suppressedSignalType as any;
        if (generalized.emotionalSignalType) signal.emotionalSignalType = generalized.emotionalSignalType as any;
        if (generalized.workaroundType) signal.workaroundType = generalized.workaroundType as any;
        if (generalized.burdenAbsorber) signal.burdenAbsorber = generalized.burdenAbsorber as any;
        if (generalized.burdenType) signal.burdenType = generalized.burdenType as any;
        if (generalized.invisibleWorkType) signal.invisibleWorkType = generalized.invisibleWorkType as any;
      }
      
      // ─── CORRELATION RISK ───
      const riskResult = calculateCorrelationRisk(rawText, {
        therapeuticArea: structured.therapeuticArea || therapeuticArea
      });
      
      // Determine if content should be flagged for review
      const requiresReview = riskResult.riskScore > 0.7 || redactions.length > 3;
      
      // Generate title from description if not provided
      const generatedTitle = title || description.slice(0, 100).trim() + (description.length > 100 ? '...' : '');
      
      // Determine values — prefer AI-extracted, fall back to provided, then defaults
      const finalTherapeuticArea = structured.therapeuticArea || therapeuticArea || 'Other';
      const finalTrialPhase = structured.trialPhase || trialPhase || 'Multi-phase';
      const finalIssueCategory = category || structured.structured.issueType || issueCategory || 'Other';
      const finalUrgencyLevel = urgencyLevel || 
        (structured.structured.severity === 'high' ? 'Urgent' :
         structured.structured.severity === 'medium' ? 'Normal' : 'Low');
      
      // ─── PATTERN MATURITY ───
      // New contributions start as EMERGING
      const patternMaturity = 'EMERGING';
      
      // ─── MICRO-OPPORTUNITY GATING ───
      // Only eligible if HIGH SQS AND significant value
      const microOpportunityEligible = signal.microOpportunityEligible;
      
      const priorSituationCount = await prisma.contribution.count({
        where: {
          userId: user.id,
          contributionType: { in: ['question', 'situation'] },
        },
      });
      
      // ─── CREATE THE CONTRIBUTION ───
      const situationId = randomUUID();
      const situationData = {
        data: {
          id: situationId,
          userId: user.id,
          contributionType: 'question',
          title: generatedTitle,
          description: redactedDescription,
          originalContent: null,
          therapeuticArea: finalTherapeuticArea,
          trialPhase: finalTrialPhase,
          issueCategory: finalIssueCategory,
          urgencyLevel: finalUrgencyLevel,
          siteCountRange: siteCountRange || null,
          geographicScope: geographicScope || null,
          correlationRisk: riskResult.riskScore,
          riskFactors: riskResult.factors,
          redactionLog: redactions.length > 0 ? redactions : undefined,
          redactionCount: redactions.length,
          isHidden: requiresReview,
          isFlagged: requiresReview,
          extractedPatterns: {
            issueType: structured.structured.issueType,
            systemInvolved: structured.structured.systemInvolved,
            severity: structured.structured.severity,
            repeatability: structured.structured.repeatability,
            suggestedTags: structured.structured.suggestedTags,
            confidence: structured.structured.confidence,
            userRole: role || null,
            chips: chips || []
          },
          
          // ─── TRANSLATION ENGINE FIELDS ───
          suppressedSignalType: signal.suppressedSignalType,
          emotionalSignalType: signal.emotionalSignalType,
          workaroundPresent: signal.workaroundPresent,
          workaroundType: signal.workaroundType,
          systemOfRecordMismatch: signal.systemOfRecordMismatch,
          officialRealityGap: signal.officialRealityGap,
          decisionDistanceLevel: signal.decisionDistanceLevel,
          burdenAbsorber: signal.burdenAbsorber,
          burdenType: signal.burdenType,
          invisibleWorkType: signal.invisibleWorkType,
          likelyDownstreamRisk: signal.likelyDownstreamRisk,
          escalationPattern: signal.escalationPattern,
          patientImpactPotential: signal.patientImpactPotential,
          operationalDebtLevel: signal.operationalDebtLevel,
          economicValuePotential: signal.economicValuePotential,
          microOpportunityEligible,
          driftIndicatorsJson: signal.driftIndicators,
          failureTrajectoryPrediction: signal.failureTrajectoryPrediction,
          signalQualityScore: signal.signalQualityScore,
          patternMaturity,
          predictiveSummary: signal.predictiveSummary,
          confidenceScore: signal.confidenceScore
        }
      };
      const ledgerEvent = buildLedgerEvent({
        aggregateType: 'QUESTION',
        aggregateId: situationId,
        eventType: 'CREATED',
        actorUserId: user.id,
        payload: {
          question: redactedDescription,
          title: generatedTitle,
          therapeuticArea: finalTherapeuticArea,
          trialPhase: finalTrialPhase,
          issueCategory: finalIssueCategory,
          urgencyLevel: finalUrgencyLevel,
          chips: chips || [],
          redactionCount: redactions.length,
          visibility: requiresReview ? 'PENDING_REVIEW' : 'COMMUNITY_VISIBLE',
        },
      });
      const [situation] = await prisma.$transaction([
        prisma.contribution.create(situationData),
        prisma.knowledgeLedgerEvent.create({ data: ledgerEvent }),
      ]);
      
      // ─── CREATE EXECUTION SIGNAL EXTRACTION RECORD ───
      await prisma.executionSignalExtraction.create({
        data: {
          contributionId: situation.id,
          signalStage: determineSignalStage(signal),
          workaroundPresent: signal.workaroundPresent,
          workaroundType: signal.workaroundType,
          suppressedSignalType: signal.suppressedSignalType,
          emotionalSignalType: signal.emotionalSignalType,
          systemOfRecordMismatch: signal.systemOfRecordMismatch,
          officialRealityGap: signal.officialRealityGap,
          decisionDistanceLevel: signal.decisionDistanceLevel,
          burdenAbsorber: signal.burdenAbsorber,
          burdenType: signal.burdenType,
          invisibleWorkType: signal.invisibleWorkType,
          likelyDownstreamRisk: signal.likelyDownstreamRisk,
          escalationPattern: signal.escalationPattern,
          patientImpactPotential: signal.patientImpactPotential,
          operationalDebtLevel: signal.operationalDebtLevel,
          economicValuePotential: signal.economicValuePotential,
          microOpportunityEligible: signal.microOpportunityEligible,
          driftIndicatorsJson: signal.driftIndicators,
          failureTrajectoryPrediction: signal.failureTrajectoryPrediction,
          signalQualityScore: signal.signalQualityScore,
          predictiveSummary: signal.predictiveSummary,
          confidenceScore: signal.confidenceScore,
          extractionVersion: 2
        }
      });
      
      // Log the creation
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CONTRIBUTION_CREATED',
          resourceType: 'Contribution',
          resourceId: situation.id,
          details: {
            contributionType: 'question',
            postedByAdminId,
            therapeuticArea: finalTherapeuticArea,
            issueCategory: finalIssueCategory,
            correlationRisk: riskResult.riskScore,
            redactionCount: redactions.length,
            translationEngine: {
              suppressedSignalType: signal.suppressedSignalType,
              emotionalSignalType: signal.emotionalSignalType,
              workaroundPresent: signal.workaroundPresent,
              systemMismatch: signal.systemOfRecordMismatch,
              decisionDistance: signal.decisionDistanceLevel,
              signalQualityScore: signal.signalQualityScore,
              failureTrajectory: signal.failureTrajectoryPrediction,
              microOpportunityEligible
            }
          }
        }
      });
      
      const metrics = await getOrCreateUserMetrics(user.id, 'operator');
      await trackEvent({
        anonymousUserId: metrics.anonymousUserId,
        eventType: EVENT_TYPES.SITUATION.SITUATION_SUBMITTED,
        eventCategory: 'situation',
        objectType: 'Contribution',
        objectId: situation.id,
        metadata: {
          privacySafe: true,
          redactionsApplied: redactions.length,
          requiresReview,
          repeatSubmission: priorSituationCount > 0,
          microOpportunityEligible,
        },
      });
      
      if (priorSituationCount > 0) {
        await trackEvent({
          anonymousUserId: metrics.anonymousUserId,
          eventType: EVENT_TYPES.SITUATION.SECOND_SITUATION_SUBMITTED,
          eventCategory: 'situation',
          objectType: 'Contribution',
          objectId: situation.id,
          metadata: {
            privacySafe: true,
            priorSituationBucket: priorSituationCount >= 3 ? '3_or_more' : '1_to_2',
          },
        });
      }
      
      // Update user's trust vector
      await updateTrustVector(user.id);
      
      // ─── GENERATE REFLECTION (quick, synchronous) ───
      const reflection = generateQuickReflection(signal, finalIssueCategory, {
        therapeuticArea: finalTherapeuticArea,
        trialPhase: finalTrialPhase,
        roleCategory: user.roleCategory
      });
      
      await trackEvent({
        anonymousUserId: metrics.anonymousUserId,
        eventType: EVENT_TYPES.SITUATION.IMMEDIATE_FEEDBACK_VIEWED,
        eventCategory: 'situation',
        objectType: 'Contribution',
        objectId: situation.id,
        metadata: {
          privacySafe: true,
          hasPatternName: Boolean(reflection.patternName),
          hasTrajectory: Boolean(reflection.trajectoryAssessment),
        },
      });
      
      await trackEvent({
        anonymousUserId: metrics.anonymousUserId,
        eventType: EVENT_TYPES.SITUATION.REFLECTION_GENERATED,
        eventCategory: 'situation',
        objectType: 'Contribution',
        objectId: situation.id,
        metadata: { privacySafe: true, generationType: 'quick' },
      });
      
      await trackEvent({
        anonymousUserId: metrics.anonymousUserId,
        eventType: EVENT_TYPES.SITUATION.REFLECTION_SCHEDULED,
        eventCategory: 'situation',
        objectType: 'Contribution',
        objectId: situation.id,
        metadata: { privacySafe: true, scheduledWindow: 'within_48_hours' },
      });
      
      // Schedule the full async reflection (with database queries)
      scheduleFullReflection(situation.id, signal, finalIssueCategory, {
        therapeuticArea: finalTherapeuticArea,
        trialPhase: finalTrialPhase,
        roleCategory: user.roleCategory
      }, patternMaturity).catch(err => {
        console.error('Error scheduling full reflection:', err);
      });
      
      // Create failure pathway records from the translation engine signals
      createPathwaysForContribution(situation.id, signal).catch(err => {
        console.error('Error creating failure pathways:', err);
      });
      
      // Ask founding operators for a fast first answer (visible questions only)
      if (!requiresReview) {
        after(() => notifyFoundingResponders({ contributionId: situation.id, authorId: user.id, therapeuticArea: finalTherapeuticArea }).catch(err => {
          console.error('Error notifying founding responders:', err);
        }));
      }

      // Schedule 7-day truth loop follow-up
      scheduleTruthLoopFollowUp(situation.id, user.id).catch(err => {
        console.error('Error scheduling truth loop follow-up:', err);
      });
      
      // Schedule an honest cold-start return prompt for the first 24-72 hours.
      // This does not imply peer activity; it simply invites the author to return
      // and add what changed if no organic structured context has appeared yet.
      scheduleColdStartReturnPrompt(situation.id, user.id, metrics.anonymousUserId).catch(err => {
        console.error('Error scheduling cold-start return prompt:', err);
      });
      
      // Aggressive micro-opportunity scan (Priority 4)
      // After each new HIGH SQS contribution, scan for pattern density triggers
      if (signal.signalQualityScore === 'HIGH') {
        scanForAggressiveTriggers().catch(err => {
          console.error('Error in aggressive micro-opportunity scan:', err);
        });
      }
      
      return createApiResponse({
        success: true,
        id: situation.id,
        message: requiresReview 
          ? 'Your situation has been submitted and is being reviewed for anonymity compliance.'
          : 'Your situation has been shared anonymously.',
        redactionsApplied: redactions.length,
        timeBucket: bucketTimestamp(situation.createdAt).label,
        
        // ─── REFLECTION CONTENT (human language, no system terms) ───
        reflection: {
          patternName: reflection.patternName,
          causalChain: reflection.causalChain,
          contextTag: reflection.contextTag,
          observedWorkarounds: reflection.observedWorkarounds,
          connections: reflection.connections,
          peerObservations: reflection.peerObservations,
          attemptedApproaches: reflection.attemptedApproaches,
          failedApproaches: reflection.failedApproaches,
          trajectoryAssessment: reflection.trajectoryAssessment,
          classificationLabel: reflection.classificationLabel,
          confidenceLevel: reflection.confidenceLevel,
          confidenceQualifier: reflection.confidenceQualifier,
          riskDirection: reflection.riskDirection
        },
        
        // Follow-up promise
        followUp: {
          scheduled: true,
          message: "We'll check back with you in about a week"
        }
      });
      
    }, { requireAuth: true });

/**
 * Schedule the full reflection (async, with database lookups)
 * Updates the contribution's relatedContext when complete
 */
async function scheduleFullReflection(
  contributionId: string,
  signal: ExecutionSignal,
  issueCategory: string,
  contextParams?: {
    therapeuticArea?: string;
    trialPhase?: string;
    roleCategory?: string;
  },
  patternMaturity?: string
): Promise<void> {
  try {
    const fullReflection = await generateReflection(
      contributionId, signal, issueCategory, contextParams,
      patternMaturity as any
    );
    
    // Update the contribution with full reflection data (including new quality fields)
    await prisma.contribution.update({
      where: { id: contributionId },
      data: {
        relatedContext: {
          patternName: fullReflection.patternName,
          causalChain: fullReflection.causalChain,
          contextTag: fullReflection.contextTag,
          observedWorkarounds: fullReflection.observedWorkarounds,
          connections: fullReflection.connections,
          peerObservations: fullReflection.peerObservations,
          attemptedApproaches: fullReflection.attemptedApproaches,
          failedApproaches: fullReflection.failedApproaches,
          trajectoryAssessment: fullReflection.trajectoryAssessment,
          classificationLabel: fullReflection.classificationLabel,
          confidenceLevel: fullReflection.confidenceLevel,
          confidenceQualifier: fullReflection.confidenceQualifier,
          riskDirection: fullReflection.riskDirection,
          generatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error generating full reflection:', error);
  }
}

async function scheduleColdStartReturnPrompt(
  contributionId: string,
  userId: string,
  anonymousUserId: string
): Promise<void> {
  try {
    const existingPrompt = await prisma.notification.findFirst({
      where: {
        userId,
        relatedPostId: contributionId,
        variantId: 'RET-COLD-START-CHECKIN',
        dismissed: false,
      },
    });

    if (existingPrompt) return;

    const delayHours = 24 + Math.floor(Math.random() * 48);
    const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000);

    await prisma.notification.create({
      data: {
        userId,
        variantId: 'RET-COLD-START-CHECKIN',
        notificationClass: 'EXPANSION',
        priority: 'P2',
        copy: 'Worth a quick check: did this stay manageable, get worse, or change shape?',
        relatedPostId: contributionId,
        relatedThreadId: null,
        relatedOpportunityId: null,
        relatedPatternId: null,
        relatedMatchId: null,
        surfaces: ['in_app', 'email'],
        deliveredTo: [],
        scheduledFor,
        batchCount: 1,
      },
    });

    await trackEvent({
      anonymousUserId,
      eventType: EVENT_TYPES.ENGAGEMENT.NOTIFICATION_SENT,
      eventCategory: 'engagement',
      objectType: 'Contribution',
      objectId: contributionId,
      metadata: {
        trigger: 'COLD_START_CHECKIN',
        notificationClass: 'EXPANSION',
        scheduledWindow: '24_to_72_hours',
        honestColdStart: true,
        privacySafe: true,
      },
    });
  } catch (error) {
    console.error('Error scheduling cold-start return prompt:', error);
  }
}

/**
 * Schedule the 7-14 Day Truth Loop follow-up
 * 
 * Uses the Notification model for scheduling (ContributionFollowUp records
 * are created when the user actually responds, not when we schedule).
 * 
 * Flow:
 * 1. Schedule notification at 7 days → user responds → ContributionFollowUp created
 * 2. If no response, schedule at 14 days → same
 */
async function scheduleTruthLoopFollowUp(
  contributionId: string,
  userId: string
): Promise<void> {
  try {
    // Schedule 7-day follow-up notification
    const day7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await prisma.notification.create({
      data: {
        userId,
        variantId: 'TL-01',
        notificationClass: 'EXPANSION',
        priority: 'P2',
        copy: "Has anything changed since you shared? We'd value a quick update.",
        relatedPostId: contributionId,
        surfaces: ['in_app', 'email'],
        scheduledFor: day7,
        deliveredTo: []
      }
    });
    
    // Schedule 14-day follow-up notification (if no response to 7-day)
    const day14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    
    await prisma.notification.create({
      data: {
        userId,
        variantId: 'TL-02',
        notificationClass: 'EXPANSION',
        priority: 'P3',
        copy: "Still relevant? A quick update helps others understand what happened next.",
        relatedPostId: contributionId,
        surfaces: ['in_app'],
        scheduledFor: day14,
        deliveredTo: []
      }
    });
    
  } catch (error) {
    console.error('Error scheduling truth loop follow-up:', error);
  }
}

/**
 * Determine the signal stage for the ExecutionSignalExtraction record
 */
function determineSignalStage(signal: ExecutionSignal): string {
  if (signal.failureTrajectoryPrediction === 'HIGH_RISK_ESCALATION') return 'FAILURE';
  if (signal.failureTrajectoryPrediction === 'LIKELY_ESCALATION') return 'ACTIVE';
  if (signal.workaroundPresent || signal.systemOfRecordMismatch) return 'ACTIVE';
  return 'EARLY';
}
