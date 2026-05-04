from pathlib import Path

p = Path("app/api/situations/route.ts")
text = p.read_text()

text = text.replace(
    "      // Schedule 7-day truth loop follow-up\n      scheduleTruthLoopFollowUp(situation.id, user.id).catch(err => {\n        console.error('Error scheduling truth loop follow-up:', err);\n      });",
    "      // Schedule 7-day truth loop follow-up\n      scheduleTruthLoopFollowUp(situation.id, user.id).catch(err => {\n        console.error('Error scheduling truth loop follow-up:', err);\n      });\n      \n      // Schedule an honest cold-start return prompt for the first 24-72 hours.\n      // This does not imply peer activity; it simply invites the author to return\n      // and add what changed if no organic structured context has appeared yet.\n      scheduleColdStartReturnPrompt(situation.id, user.id, metrics.anonymousUserId).catch(err => {\n        console.error('Error scheduling cold-start return prompt:', err);\n      });"
)

insert_after = """async function scheduleTruthLoopFollowUp(
  contributionId: string,
  userId: string
): Promise<void> {
"""

helper = """async function scheduleColdStartReturnPrompt(
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
"""

old_block_start = """/**
 * Schedule the 7-14 Day Truth Loop follow-up
 * 
 * Uses the Notification model for scheduling (ContributionFollowUp records
 * are created when the user actually responds, not when we schedule).
 * 
 * Flow:
 * 1. Schedule notification at 7 days → user responds → ContributionFollowUp created
 * 2. If no response, schedule at 14 days → same
 */
"""
text = text.replace(old_block_start, helper)

p.write_text(text)
print("updated app/api/situations/route.ts")