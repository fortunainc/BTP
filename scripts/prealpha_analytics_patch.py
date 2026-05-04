from pathlib import Path

# Patch analytics event constants
p = Path("lib/analytics-tracker.ts")
text = p.read_text()
text = text.replace(
    "    SITUATION_SUBMITTED: 'situation_submitted',\n    SITUATION_REDACTED: 'situation_redacted',",
    "    SITUATION_SUBMITTED: 'situation_submitted',\n    IMMEDIATE_FEEDBACK_VIEWED: 'immediate_feedback_viewed',\n    SECOND_SITUATION_SUBMITTED: 'second_situation_submitted',\n    SITUATION_REDACTED: 'situation_redacted',"
)
p.write_text(text)
print("updated lib/analytics-tracker.ts")

# Patch situations route imports and tracking
p = Path("app/api/situations/route.ts")
text = p.read_text()
text = text.replace(
    "import { scanForAggressiveTriggers } from '@/lib/micro-opportunity';\nimport type { ExecutionSignal } from '@/lib/translation-engine';",
    "import { scanForAggressiveTriggers } from '@/lib/micro-opportunity';\nimport { getOrCreateUserMetrics, trackEvent, EVENT_TYPES } from '@/lib/analytics-tracker';\nimport type { ExecutionSignal } from '@/lib/translation-engine';"
)
text = text.replace(
    "      // ─── CREATE THE CONTRIBUTION ───\n      const situation = await prisma.contribution.create({",
    "      const priorSituationCount = await prisma.contribution.count({\n        where: {\n          userId: user.id,\n          contributionType: 'situation',\n        },\n      });\n      \n      // ─── CREATE THE CONTRIBUTION ───\n      const situation = await prisma.contribution.create({"
)
text = text.replace(
    "      // Update user's trust vector\n      await updateTrustVector(user.id);\n      \n      // ─── GENERATE REFLECTION (quick, synchronous) ───",
    "      const metrics = await getOrCreateUserMetrics(user.id, 'operator');\n      await trackEvent({\n        anonymousUserId: metrics.anonymousUserId,\n        eventType: EVENT_TYPES.SITUATION.SITUATION_SUBMITTED,\n        eventCategory: 'situation',\n        objectType: 'Contribution',\n        objectId: situation.id,\n        metadata: {\n          privacySafe: true,\n          redactionsApplied: redactions.length,\n          requiresReview,\n          repeatSubmission: priorSituationCount > 0,\n          microOpportunityEligible,\n        },\n      });\n      \n      if (priorSituationCount > 0) {\n        await trackEvent({\n          anonymousUserId: metrics.anonymousUserId,\n          eventType: EVENT_TYPES.SITUATION.SECOND_SITUATION_SUBMITTED,\n          eventCategory: 'situation',\n          objectType: 'Contribution',\n          objectId: situation.id,\n          metadata: {\n            privacySafe: true,\n            priorSituationBucket: priorSituationCount >= 3 ? '3_or_more' : '1_to_2',\n          },\n        });\n      }\n      \n      // Update user's trust vector\n      await updateTrustVector(user.id);\n      \n      // ─── GENERATE REFLECTION (quick, synchronous) ───"
)
text = text.replace(
    "      // Schedule the full async reflection (with database queries)\n      scheduleFullReflection(situation.id, signal, finalIssueCategory, {",
    "      await trackEvent({\n        anonymousUserId: metrics.anonymousUserId,\n        eventType: EVENT_TYPES.SITUATION.IMMEDIATE_FEEDBACK_VIEWED,\n        eventCategory: 'situation',\n        objectType: 'Contribution',\n        objectId: situation.id,\n        metadata: {\n          privacySafe: true,\n          hasPatternName: Boolean(reflection.patternName),\n          hasTrajectory: Boolean(reflection.trajectoryAssessment),\n        },\n      });\n      \n      await trackEvent({\n        anonymousUserId: metrics.anonymousUserId,\n        eventType: EVENT_TYPES.SITUATION.REFLECTION_GENERATED,\n        eventCategory: 'situation',\n        objectType: 'Contribution',\n        objectId: situation.id,\n        metadata: { privacySafe: true, generationType: 'quick' },\n      });\n      \n      await trackEvent({\n        anonymousUserId: metrics.anonymousUserId,\n        eventType: EVENT_TYPES.SITUATION.REFLECTION_SCHEDULED,\n        eventCategory: 'situation',\n        objectType: 'Contribution',\n        objectId: situation.id,\n        metadata: { privacySafe: true, scheduledWindow: 'within_48_hours' },\n      });\n      \n      // Schedule the full async reflection (with database queries)\n      scheduleFullReflection(situation.id, signal, finalIssueCategory, {"
)
p.write_text(text)
print("updated app/api/situations/route.ts")

# Patch founder analytics event lists and return-loop KPI payload
p = Path("app/api/admin/analytics/route.ts")
text = p.read_text()
text = text.replace(
    "            'interaction_clicked',\n            'context_added',\n            'reflection_opened',\n            'return_loop_notification_sent',",
    "            'situation_submitted',\n            'immediate_feedback_viewed',\n            'second_situation_submitted',\n            'interaction_clicked',\n            'context_added',\n            'reflection_opened',\n            'return_to_interacted_situation',\n            'return_loop_notification_sent',"
)
text = text.replace(
    "    reflectionReturn: {\n      reflectionsOpened: eventsByType.reflection_opened || 0,",
    "    alphaKpis: {\n      situationsSubmitted: eventsByType.situation_submitted || 0,\n      immediateFeedbackViewed: eventsByType.immediate_feedback_viewed || 0,\n      secondSubmissions: eventsByType.second_situation_submitted || 0,\n      returnsToInteractedSituation: eventsByType.return_to_interacted_situation || 0,\n      returnRate72h: 'tracked via submitter return events; calculate on REAL-only cohorts during alpha review',\n      primaryKpi: '% submitters who return within 72 hours',\n    },\n    reflectionReturn: {\n      reflectionsOpened: eventsByType.reflection_opened || 0,"
)
text = text.replace(
    "      'situation_submitted',\n      'interaction_clicked',",
    "      'situation_submitted',\n      'immediate_feedback_viewed',\n      'second_situation_submitted',\n      'interaction_clicked',"
)
text = text.replace(
    "    'situation_submitted',\n    'reflection_opened',",
    "    'situation_submitted',\n    'immediate_feedback_viewed',\n    'second_situation_submitted',\n    'reflection_opened',"
)
text = text.replace(
    "    'situation_submitted',\n    'micro_opportunity_created',",
    "    'situation_submitted',\n    'immediate_feedback_viewed',\n    'second_situation_submitted',\n    'micro_opportunity_created',"
)
text = text.replace(
    "    'situation_submitted',\n    'reflection_generated',",
    "    'situation_submitted',\n    'immediate_feedback_viewed',\n    'second_situation_submitted',\n    'reflection_generated',"
)
p.write_text(text)
print("updated app/api/admin/analytics/route.ts")