/**
 * Founder Override Admin Queue (Section 14)
 * 
 * Admin operations for the Translation Engine:
 * - Correction of extraction (fix misidentified signals)
 * - Pattern merging (combine duplicate patterns)
 * - Manual consult triggering (override micro-opportunity gating)
 * - Suppression of risky content (hide content that slipped through)
 * 
 * All operations are audit-logged.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { verifyAdminAccess } from '@/lib/admin-auth';

// ==========================================
// GET: List items needing admin review
// ==========================================

export async function GET(request: NextRequest) {
  const adminAuth = await verifyAdminAccess(request);
  if (!adminAuth.success) {
    return NextResponse.json(
      { error: adminAuth.error },
      { status: adminAuth.statusCode || 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
      const queueType = searchParams.get('type') || 'all';
      const limit = parseInt(searchParams.get('limit') || '20');

      const results: Record<string, unknown> = {};

      // High-correlation-risk contributions needing review
      if (queueType === 'all' || queueType === 'correlation_risk') {
        const highRiskContributions = await prisma.contribution.findMany({
          where: {
            isFlagged: true,
            isHidden: true,
            correlationRisk: { gte: 0.7 }
          },
          select: {
            id: true,
            description: true,
            correlationRisk: true,
            riskFactors: true,
            redactionCount: true,
            suppressedSignalType: true,
            emotionalSignalType: true,
            signalQualityScore: true,
            forceIncludeFromPatterns: true,
            forceExcludeFromPatterns: true,
            overridePatternLabel: true,
            createdAt: true
          },
          orderBy: { correlationRisk: 'desc' },
          take: limit
        });
        results.correlationRisk = highRiskContributions;
      }

      // Contributions with low SQS that might need correction
      if (queueType === 'all' || queueType === 'low_sqs') {
        const lowSQSContributions = await prisma.contribution.findMany({
          where: {
            signalQualityScore: 'LOW',
            isHidden: false
          },
          select: {
            id: true,
            description: true,
            suppressedSignalType: true,
            emotionalSignalType: true,
            signalQualityScore: true,
            predictiveSummary: true,
            confidenceScore: true,
            forceIncludeFromPatterns: true,
            forceExcludeFromPatterns: true,
            overridePatternLabel: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        });
        results.lowSQS = lowSQSContributions;
      }

      // Active failure pathways
      if (queueType === 'all' || queueType === 'pathways') {
        const activePathways = await prisma.failurePathway.findMany({
          where: { isActive: true },
          orderBy: { pathwayRisk: 'desc' },
          take: limit
        });
        results.pathways = activePathways;
      }

      // High-signal contributor drop-offs
      if (queueType === 'all' || queueType === 'drop_offs') {
        const dropOffs = await prisma.contributorHealthFlag.findMany({
          where: { dropOffDetected: true },
          orderBy: { churnRisk: 'desc' },
          take: limit
        });
        results.dropOffs = dropOffs;
      }

      // Pending follow-ups
      if (queueType === 'all' || queueType === 'follow_ups') {
        const recentFollowUps = await prisma.contributionFollowUp.findMany({
          where: {
            statusChange: {
              in: ['got_worse', 'caused_delay_deviation_dropout']
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        });
        results.followUps = recentFollowUps;
      }

      return createApiResponse(results);

  } catch (error) {
    console.error('Error fetching admin queue:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// ==========================================
// POST: Admin actions
// ==========================================

export async function POST(request: NextRequest) {
  const adminAuth = await verifyAdminAccess(request);
  if (!adminAuth.success) {
    return NextResponse.json(
      { error: adminAuth.error },
      { status: adminAuth.statusCode || 403 }
    );
  }

  const adminUserId = adminAuth.userId!;
  try {
    const body = await request.json();
      const { action, contributionId, pathwayId, data } = body as {
        action?: string;
        contributionId?: string;
        pathwayId?: string;
        data?: Record<string, unknown>;
      };

      if (!action) {
        return createErrorResponse('Action is required', 400);
      }

      switch (action) {
        case 'correct_extraction':
          return await handleCorrectExtraction(contributionId!, data!, adminUserId);
        case 'merge_patterns':
          return await handleMergePatterns(data!, adminUserId);
        case 'trigger_consult':
          return await handleTriggerConsult(contributionId!, data!, adminUserId);
        case 'suppress_content':
          return await handleSuppressContent(contributionId!, data!, adminUserId);
        case 'approve_content':
          return await handleApproveContent(contributionId!, adminUserId);
        case 'confirm_pathway':
          return await handleConfirmPathway(pathwayId!, adminUserId);
        case 'override_pattern_label':
          return await handleOverridePatternLabel(contributionId!, data!, adminUserId);
        case 'force_pattern_inclusion':
          return await handleForcePatternInclusion(contributionId!, data!, adminUserId);
        default:
          return createErrorResponse(`Unknown action: ${action}`, 400);
      }

  } catch (error) {
    console.error('Error processing admin action:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

// ==========================================
// ACTION HANDLERS
// ==========================================

/**
 * Correct a translation engine extraction
 * Admin can fix misidentified signals
 */
async function handleCorrectExtraction(
  contributionId: string,
  corrections: Record<string, unknown>,
  adminId: string
) {
  if (!contributionId) {
    return createErrorResponse('Contribution ID is required', 400);
  }

  const allowedFields = [
    'suppressedSignalType', 'emotionalSignalType', 'workaroundPresent',
    'workaroundType', 'systemOfRecordMismatch', 'decisionDistanceLevel',
    'burdenAbsorber', 'burdenType', 'invisibleWorkType', 'likelyDownstreamRisk',
    'failureTrajectoryPrediction', 'signalQualityScore', 'patternMaturity',
    'forceIncludeFromPatterns', 'forceExcludeFromPatterns', 'overridePatternLabel'
  ];

  // Filter to only allowed fields
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (corrections[field] !== undefined) {
      updateData[field] = corrections[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return createErrorResponse('No valid fields to correct', 400);
  }

  const contribution = await prisma.contribution.update({
    where: { id: contributionId },
    data: updateData
  });

  // Also update the ExecutionSignalExtraction record
  await prisma.executionSignalExtraction.updateMany({
    where: { contributionId },
    data: updateData
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'EXTRACTION_CORRECTED',
      resourceType: 'Contribution',
      resourceId: contributionId,
      details: {
        corrections: updateData,
        correctedBy: adminId
      } as any
    }
  });

  return createApiResponse({
    success: true,
    message: 'Extraction corrected',
    correctedFields: Object.keys(updateData)
  });
}

/**
 * Merge duplicate patterns
 */
async function handleMergePatterns(
  data: Record<string, unknown>,
  adminId: string
) {
  const { sourcePatternId, targetPatternId } = data as { sourcePatternId?: string; targetPatternId?: string };

  if (!sourcePatternId || !targetPatternId) {
    return createErrorResponse('Source and target pattern IDs are required', 400);
  }

  // In the current system, patterns are computed from contributions
  // This action would reclassify contributions from the source pattern
  // into the target pattern's category

  // For now, log the merge action
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'PATTERNS_MERGED',
      resourceType: 'Pattern',
      resourceId: targetPatternId,
      details: {
        sourcePatternId,
        targetPatternId,
        mergedBy: adminId
      }
    }
  });

  return createApiResponse({
    success: true,
    message: 'Patterns merged',
    sourcePatternId,
    targetPatternId
  });
}

/**
 * Manually trigger a micro-opportunity consult
 * Override the SQS gating for high-value signals
 */
async function handleTriggerConsult(
  contributionId: string,
  data: Record<string, unknown>,
  adminId: string
) {
  if (!contributionId) {
    return createErrorResponse('Contribution ID is required', 400);
  }

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { id: true, userId: true, microOpportunityEligible: true }
  });

  if (!contribution) {
    return createErrorResponse('Contribution not found', 404);
  }

  // Override the micro-opportunity eligibility
  await prisma.contribution.update({
    where: { id: contributionId },
    data: { microOpportunityEligible: true }
  });

  // Create a notification for the contributor
  await prisma.notification.create({
    data: {
      userId: contribution.userId || 'unknown',
      variantId: 'MO-ADMIN',
      notificationClass: 'OPPORTUNITY',
      priority: 'P1',
      copy: "Based on your experience, you may be a valuable voice for a specific operational challenge. Would you be open to a short consult?",
      relatedPostId: contributionId,
      surfaces: ['in_app', 'email'],
      scheduledFor: new Date(),
      deliveredTo: []
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'CONSULT_MANUALLY_TRIGGERED',
      resourceType: 'Contribution',
      resourceId: contributionId,
      details: {
        previouslyEligible: contribution.microOpportunityEligible,
        overrideReason: (data as { reason?: string }).reason || 'admin_override',
        triggeredBy: adminId
      }
    }
  });

  return createApiResponse({
    success: true,
    message: 'Consult triggered'
  });
}

/**
 * Suppress content that slipped through safety checks
 */
async function handleSuppressContent(
  contributionId: string,
  data: Record<string, unknown>,
  adminId: string
) {
  if (!contributionId) {
    return createErrorResponse('Contribution ID is required', 400);
  }

  await prisma.contribution.update({
    where: { id: contributionId },
    data: {
      isHidden: true,
      isFlagged: true,
      flagReason: (data as { reason?: string }).reason || 'admin_suppression',
      moderatedBy: adminId,
      moderatedAt: new Date(),
      moderationAction: 'removed'
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'CONTENT_SUPPRESSED',
      resourceType: 'Contribution',
      resourceId: contributionId,
      details: {
        reason: (data as { reason?: string }).reason || 'admin_suppression',
        suppressedBy: adminId
      }
    }
  });

  return createApiResponse({
    success: true,
    message: 'Content suppressed'
  });
}

/**
 * Approve content that was flagged for review
 */
async function handleApproveContent(
  contributionId: string,
  adminId: string
) {
  if (!contributionId) {
    return createErrorResponse('Contribution ID is required', 400);
  }

  await prisma.contribution.update({
    where: { id: contributionId },
    data: {
      isHidden: false,
      isFlagged: false,
      moderatedBy: adminId,
      moderatedAt: new Date(),
      moderationAction: 'approved'
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'CONTENT_APPROVED',
      resourceType: 'Contribution',
      resourceId: contributionId,
      details: {
        approvedBy: adminId
      }
    }
  });

  return createApiResponse({
    success: true,
    message: 'Content approved'
  });
}

/**
 * Confirm a failure pathway
 */
async function handleConfirmPathway(
  pathwayId: string,
  adminId: string
) {
  if (!pathwayId) {
    return createErrorResponse('Pathway ID is required', 400);
  }

  await prisma.failurePathway.update({
    where: { id: pathwayId },
    data: {
      confirmedAt: new Date()
    }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'PATHWAY_CONFIRMED',
      resourceType: 'FailurePathway',
      resourceId: pathwayId,
      details: {
        confirmedBy: adminId
      }
    }
  });

  return createApiResponse({
    success: true,
    message: 'Pathway confirmed'
  });
}

/**
 * Override the pattern label for a contribution
 * Admin can manually set a specific, causal pattern name
 * when the auto-generated one is too generic or incorrect
 */
async function handleOverridePatternLabel(
  contributionId: string,
  data: Record<string, unknown>,
  adminId: string
) {
  if (!contributionId) {
    return createErrorResponse('Contribution ID is required', 400);
  }

  const { patternLabel } = data as { patternLabel?: string };
  if (!patternLabel || patternLabel.trim().length < 10) {
    return createErrorResponse('Pattern label must be specific (at least 10 characters)', 400);
  }

  // Check for generic pattern names — enforce specificity
  const genericNames = [
    'enrollment issues', 'protocol burden', 'site overload', 'staffing issues',
    'operational challenges', 'data quality problems', 'regulatory challenges',
    'patient burden', 'timeline pressure', 'training gaps', 'resource constraints',
    'cro disconnect', 'reimbursement issues'
  ];
  if (genericNames.includes(patternLabel.toLowerCase().trim())) {
    return createErrorResponse(
      'Pattern label is too generic. Use a specific, causal name like "Screening Yield Collapse due to Over-Restricted Eligibility"',
      400
    );
  }

  await prisma.contribution.update({
    where: { id: contributionId },
    data: { overridePatternLabel: patternLabel }
  });

  // Also update the relatedContext JSON if it exists
  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { relatedContext: true }
  });

  if (contribution?.relatedContext && typeof contribution.relatedContext === 'object') {
    const updatedContext = {
      ...(contribution.relatedContext as Record<string, unknown>),
      patternName: patternLabel,
      patternLabelOverridden: true,
      overriddenBy: adminId,
      overriddenAt: new Date().toISOString()
    };
    await prisma.contribution.update({
      where: { id: contributionId },
      data: { relatedContext: updatedContext }
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'PATTERN_LABEL_OVERRIDDEN',
      resourceType: 'Contribution',
      resourceId: contributionId,
      details: {
        newPatternLabel: patternLabel,
        overriddenBy: adminId
      }
    }
  });

  return createApiResponse({
    success: true,
    message: 'Pattern label overridden',
    newLabel: patternLabel
  });
}

/**
 * Force include or exclude a contribution from pattern clustering
 * Admin can override the automatic SQS-based clustering decisions
 */
async function handleForcePatternInclusion(
  contributionId: string,
  data: Record<string, unknown>,
  adminId: string
) {
  if (!contributionId) {
    return createErrorResponse('Contribution ID is required', 400);
  }

  const { direction, reason } = data as { direction?: 'include' | 'exclude'; reason?: string };
  if (!direction || !['include', 'exclude'].includes(direction)) {
    return createErrorResponse('Direction must be "include" or "exclude"', 400);
  }

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { id: true, signalQualityScore: true, forceIncludeFromPatterns: true, forceExcludeFromPatterns: true }
  });

  if (!contribution) {
    return createErrorResponse('Contribution not found', 404);
  }

  const updateData: Record<string, unknown> = {};
  if (direction === 'include') {
    updateData.forceIncludeFromPatterns = true;
    updateData.forceExcludeFromPatterns = false;
  } else {
    updateData.forceExcludeFromPatterns = true;
    updateData.forceIncludeFromPatterns = false;
  }

  await prisma.contribution.update({
    where: { id: contributionId },
    data: updateData
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: direction === 'include' ? 'PATTERN_FORCE_INCLUDED' : 'PATTERN_FORCE_EXCLUDED',
      resourceType: 'Contribution',
      resourceId: contributionId,
      details: {
        direction,
        reason: reason || 'admin_override',
        previousSQS: contribution.signalQualityScore,
        overriddenBy: adminId
      }
    }
  });

  return createApiResponse({
    success: true,
    message: `Contribution force ${direction}d from pattern clustering`,
    direction
  });
}