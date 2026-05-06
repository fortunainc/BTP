/**
 * BTP Return Engine - Module Index
 * 
 * Re-exports all components of the Return Engine for easy importing
 */

// Types
export * from './types';

// Core Engine
export { ReturnEngine } from './engine';

// Integration Functions
export {
  // Contribution triggers
  onPostCreated,
  
  // Interaction triggers
  onSeenThisBefore,
  onThisIsAccurate,
  onThisWorked,
  onDidntWork,
  onAddContext,
  onDifferentCause,
  
  // Pattern triggers
  onPatternForming,
  onPatternConnected,
  
  // Momentum triggers
  onTrustIncreased,
  onTierImproved,
  onAccessPriorityUp,
  onDomainStrengthened,
  
  // Pressure triggers
  onOpportunityMissedClose,
  onOpportunityMissedAccess,
  onInactivityWarning,
  onTierProximityBelow,
  
  // Opportunity triggers
  onOpportunityReleased,
  onOpportunityMovingFast,
  onOpportunityDomainMatch,
  
  // Hiring triggers
  onMatchCreated,
  onInterestExpressed,
  onInterviewRequested,
  onHired,
  onHireCompleted,
} from './integration';

// Database functions
export {
  // Notification CRUD
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markAsDismissed,
  deleteNotification,
  
  // Batch operations
  createBatch,
  getPendingBatches,
  updateBatchStatus,
  
  // User settings
  getUserSettings,
  createDefaultSettings,
  updateUserSettings,
  
  // Cleanup
  deleteOldNotifications,
  
  // Types
  type Notification,
  type NotificationClass,
  type NotificationPriority,
  type DeliverySurface,
  type DisplayTime,
  type UserNotificationSettings,
} from './database';