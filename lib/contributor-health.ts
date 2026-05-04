/**
 * Contributor Health Tracking (Section 11)
 * 
 * Silence and behavior signals for high-value contributors.
 * 
 * Tracks:
 * - High-signal contributors (those with consistently HIGH SQS)
 * - Inactivity drop-offs (when high-signal contributors go silent)
 * - Churn risk (predictive model for contributor disengagement)
 * - Response patterns (follow-up and reflection engagement)
 * 
 * The goal: detect when the system is losing its best sources
 * of execution intelligence, and flag it before they're gone.
 */

import { prisma } from './prisma';

// ==========================================
// TYPES
// ==========================================

export interface ContributorHealthStatus {
  userId: string;
  signalLevel: 'high_signal' | 'normal' | 'low_signal' | 'dormant';
  contributionCount: number;
  avgSignalQuality: number;
  daysSinceLastContribution: number | null;
  followUpResponseRate: number;
  reflectionOpenRate: number;
  churnRisk: number;
  isInactive: boolean;
  dropOffDetected: boolean;
}

export interface DropOffAlert {
  userId: string;
  previousSignalLevel: string;
  daysInactive: number;
  lastContributionDate: Date | null;
  riskFactors: string[];
  recommendedAction: string;
}

// ==========================================
// CONSTANTS
// ==========================================

// Thresholds for inactivity detection
const INACTIVITY_THRESHOLD_DAYS = 30;       // Flag as inactive after 30 days
const DROP_OFF_THRESHOLD_DAYS = 14;         // Detect drop-off after 14 days for high-signal
const HIGH_SIGNAL_MIN_CONTRIBUTIONS = 3;    // Minimum contributions to be considered high-signal
const HIGH_SIGNAL_MIN_AVG_SQS = 0.7;       // Minimum average SQS to be high-signal
const CHURN_RISK_THRESHOLD = 0.6;          // Above this = high churn risk

// ==========================================
// MAIN EXPORTS
// ==========================================

/**
 * Get the health status of a specific contributor
 */
export async function getContributorHealth(userId: string): Promise<ContributorHealthStatus | null> {
  try {
    const flag = await prisma.contributorHealthFlag.findUnique({
      where: { userId }
    });

    if (!flag) {
      return computeContributorHealth(userId);
    }

    const daysSinceLastContribution = flag.lastContributionAt
      ? Math.floor((Date.now() - flag.lastContributionAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      userId: flag.userId,
      signalLevel: flag.signalLevel as ContributorHealthStatus['signalLevel'],
      contributionCount: flag.contributionCount,
      avgSignalQuality: flag.avgSignalQuality,
      daysSinceLastContribution,
      followUpResponseRate: flag.followUpResponseRate,
      reflectionOpenRate: flag.reflectionOpenRate,
      churnRisk: flag.churnRisk,
      isInactive: flag.isInactive,
      dropOffDetected: flag.dropOffDetected
    };
  } catch (error) {
    console.error('Error getting contributor health:', error);
    return null;
  }
}

/**
 * Compute and upsert contributor health from scratch
 * Called after follow-up responses, new contributions, etc.
 */
export async function computeContributorHealth(userId: string): Promise<ContributorHealthStatus> {
  try {
    // Get contribution stats
    const contributions = await prisma.contribution.findMany({
      where: { userId, isHidden: false, isFlagged: false },
      select: {
        id: true,
        signalQualityScore: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const contributionCount = contributions.length;
    const lastContributionAt = contributions.length > 0 ? contributions[0].createdAt : null;
    const daysSinceLastContribution = lastContributionAt
      ? Math.floor((Date.now() - lastContributionAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Calculate average SQS
    const sqsValues = contributions
      .map(c => c.signalQualityScore === 'HIGH' ? 1.0 : c.signalQualityScore === 'MEDIUM' ? 0.5 : 0.25)
      .filter(v => v !== undefined);
    const avgSignalQuality = sqsValues.length > 0
      ? sqsValues.reduce((a, b) => a + b, 0) / sqsValues.length
      : 0.5;

    // Get follow-up response rate
    const followUps = await prisma.contributionFollowUp.count({
      where: { userId }
    });
    const followUpResponseRate = contributionCount > 0
      ? Math.min(1.0, followUps / contributionCount)
      : 0;

    // Determine signal level
    let signalLevel: ContributorHealthStatus['signalLevel'] = 'normal';
    if (contributionCount === 0) signalLevel = 'dormant';
    else if (contributionCount >= HIGH_SIGNAL_MIN_CONTRIBUTIONS && avgSignalQuality >= HIGH_SIGNAL_MIN_AVG_SQS) {
      signalLevel = 'high_signal';
    } else if (avgSignalQuality < 0.3) {
      signalLevel = 'low_signal';
    }

    // Inactivity detection
    const isInactive = daysSinceLastContribution !== null && daysSinceLastContribution > INACTIVITY_THRESHOLD_DAYS;
    
    // Drop-off detection (only for high-signal contributors)
    const dropOffDetected = signalLevel === 'high_signal' && 
      daysSinceLastContribution !== null && 
      daysSinceLastContribution > DROP_OFF_THRESHOLD_DAYS;

    // Churn risk calculation
    let churnRisk = 0;
    if (daysSinceLastContribution !== null) {
      churnRisk += Math.min(0.4, daysSinceLastContribution / 90); // Time-based decay
    }
    if (followUpResponseRate < 0.3) churnRisk += 0.2; // Low engagement
    if (avgSignalQuality < 0.4) churnRisk += 0.1; // Low quality
    churnRisk = Math.min(1.0, churnRisk);

    const status: ContributorHealthStatus = {
      userId,
      signalLevel,
      contributionCount,
      avgSignalQuality,
      daysSinceLastContribution,
      followUpResponseRate,
      reflectionOpenRate: 0, // Not yet tracked
      churnRisk,
      isInactive,
      dropOffDetected
    };

    // Upsert the health flag
    await prisma.contributorHealthFlag.upsert({
      where: { userId },
      update: {
        signalLevel,
        lastContributionAt,
        contributionCount,
        avgSignalQuality,
        followUpResponseRate,
        isInactive,
        inactivityDays: daysSinceLastContribution,
        dropOffDetected,
        churnRisk
      },
      create: {
        userId,
        signalLevel,
        lastContributionAt,
        contributionCount,
        avgSignalQuality,
        followUpResponseRate,
        isInactive,
        inactivityDays: daysSinceLastContribution,
        dropOffDetected,
        churnRisk
      }
    });

    return status;
  } catch (error) {
    console.error('Error computing contributor health:', error);
    return {
      userId,
      signalLevel: 'normal',
      contributionCount: 0,
      avgSignalQuality: 0.5,
      daysSinceLastContribution: null,
      followUpResponseRate: 0,
      reflectionOpenRate: 0,
      churnRisk: 0,
      isInactive: false,
      dropOffDetected: false
    };
  }
}

/**
 * Detect high-signal contributor drop-offs across the system
 * Returns alerts for contributors who were recently active and went silent
 */
export async function detectDropOffs(): Promise<DropOffAlert[]> {
  try {
    // Find high-signal contributors who haven't contributed recently
    const highSignalFlags = await prisma.contributorHealthFlag.findMany({
      where: {
        signalLevel: 'high_signal',
        isInactive: false,
        lastContributionAt: {
          lt: new Date(Date.now() - DROP_OFF_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)
        }
      }
    });

    const alerts: DropOffAlert[] = [];

    for (const flag of highSignalFlags) {
      // Check if we already detected this drop-off
      if (flag.dropOffDetected) continue;

      const daysSinceLastContribution = flag.lastContributionAt
        ? Math.floor((Date.now() - flag.lastContributionAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Build risk factors
      const riskFactors: string[] = [];
      if (daysSinceLastContribution > 21) riskFactors.push('extended_absence');
      if (flag.followUpResponseRate < 0.3) riskFactors.push('low_follow_up_engagement');
      if (flag.churnRisk > CHURN_RISK_THRESHOLD) riskFactors.push('high_churn_risk_score');

      // Mark as drop-off detected
      await prisma.contributorHealthFlag.update({
        where: { userId: flag.userId },
        data: { dropOffDetected: true, dropOffDate: new Date() }
      });

      alerts.push({
        userId: flag.userId,
        previousSignalLevel: flag.signalLevel,
        daysInactive: daysSinceLastContribution,
        lastContributionDate: flag.lastContributionAt,
        riskFactors,
        recommendedAction: getRecommendedAction(daysSinceLastContribution, riskFactors)
      });
    }

    return alerts;
  } catch (error) {
    console.error('Error detecting drop-offs:', error);
    return [];
  }
}

/**
 * Get all contributors at risk of churning
 */
export async function getChurnRisks(): Promise<ContributorHealthStatus[]> {
  try {
    const flags = await prisma.contributorHealthFlag.findMany({
      where: {
        churnRisk: { gte: CHURN_RISK_THRESHOLD },
        isInactive: false
      },
      orderBy: { churnRisk: 'desc' },
      take: 20
    });

    return flags.map(flag => ({
      userId: flag.userId,
      signalLevel: flag.signalLevel as ContributorHealthStatus['signalLevel'],
      contributionCount: flag.contributionCount,
      avgSignalQuality: flag.avgSignalQuality,
      daysSinceLastContribution: flag.inactivityDays,
      followUpResponseRate: flag.followUpResponseRate,
      reflectionOpenRate: flag.reflectionOpenRate,
      churnRisk: flag.churnRisk,
      isInactive: flag.isInactive,
      dropOffDetected: flag.dropOffDetected
    }));
  } catch (error) {
    console.error('Error getting churn risks:', error);
    return [];
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getRecommendedAction(daysInactive: number, riskFactors: string[]): string {
  if (daysInactive > 30) {
    return 'Re-engagement campaign with personalized value proposition';
  }
  if (riskFactors.includes('high_churn_risk_score')) {
    return 'Proactive outreach with acknowledgment of their contributions';
  }
  if (riskFactors.includes('low_follow_up_engagement')) {
    return 'Simplify follow-up process, reduce notification frequency';
  }
  return 'Monitor and include in next engagement cycle';
}

export default {
  getContributorHealth,
  computeContributorHealth,
  detectDropOffs,
  getChurnRisks
};