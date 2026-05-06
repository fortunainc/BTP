import { prisma } from './prisma';
import { updateTrustVector } from './trust-vector';

/**
 * Updates a user's trust vector when their contribution receives positive interaction
 * In the new architecture, we update TrustVector.peerConfidence instead of helpfulScore
 */
export async function incrementHelpfulScore(userId: string, points: number = 1) {
  try {
    // In the new architecture, helpful contributions improve peer confidence
    // The TrustVector update will handle the calculation
    await updateTrustVector(userId);
    return { success: true };
  } catch (error) {
    console.error('Error updating trust vector:', error);
    return { success: false, error };
  }
}

/**
 * Awards bonus when a contribution is marked as particularly helpful
 * Updates the TrustVector solution utility dimension
 */
export async function awardMostHelpfulBonus(userId: string) {
  try {
    // Update trust vector to reflect solution utility
    await updateTrustVector(userId);
    return { success: true };
  } catch (error) {
    console.error('Error awarding helpful bonus:', error);
    return { success: false, error };
  }
}

/**
 * Awards contribution score for creating a contribution
 * In new architecture, this is handled by the contribution itself
 */
export async function awardThreadParticipationScore(userId: string) {
  try {
    // Trust vector is updated when contribution is created
    await updateTrustVector(userId);
    return { success: true };
  } catch (error) {
    console.error('Error updating trust for participation:', error);
    return { success: false, error };
  }
}

/**
 * Assigns Founding Operator status to first 500 verified users
 * Uses isFoundingOperator boolean field (no badges array)
 */
export async function assignFoundingOperatorBadge(userId: string) {
  try {
    // Check if this is one of the first 500 verified users
    const verifiedCount = await prisma.user.count({
      where: {
        verificationStatus: 'Approved',
      },
    });

    if (verifiedCount <= 500) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isFoundingOperator: true,
        },
      });
      return { success: true, isFounding: true };
    }

    return { success: true, isFounding: false };
  } catch (error) {
    console.error('Error assigning Founding Operator status:', error);
    return { success: false, error };
  }
}