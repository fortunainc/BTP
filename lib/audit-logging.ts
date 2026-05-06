/**
 * Audit Logging Service
 */

export enum AuditEventType {
  // User Events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_VERIFIED = 'USER_VERIFIED',
  USER_VERIFICATION_REJECTED = 'USER_VERIFICATION_REJECTED',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  
  // Content Events
  THREAD_CREATED = 'THREAD_CREATED',
  THREAD_UPDATED = 'THREAD_UPDATED',
  THREAD_DELETED = 'THREAD_DELETED',
  REPLY_CREATED = 'REPLY_CREATED',
  REPLY_UPDATED = 'REPLY_UPDATED',
  REPLY_DELETED = 'REPLY_DELETED',
  REPLY_VOTED_HELPFUL = 'REPLY_VOTED_HELPFUL',
  REPLY_MARKED_MOST_HELPFUL = 'REPLY_MARKED_MOST_HELPFUL',
  POLL_CREATED = 'POLL_CREATED',
  POLL_VOTED = 'POLL_VOTED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  APPLICATION_CREATED = 'APPLICATION_CREATED',
  APPLICATION_UPDATED = 'APPLICATION_UPDATED',
  APPLICATION_DELETED = 'APPLICATION_DELETED',
  
  // Moderation Events
  CONTENT_FLAGGED = 'CONTENT_FLAGGED',
  CONTENT_UPDATED = 'CONTENT_UPDATED',
  CONTENT_REMOVED = 'CONTENT_REMOVED',
  CONTENT_APPROVED = 'CONTENT_APPROVED',
  USER_BANNED = 'USER_BANNED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  
  // Security Events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  SECURITY_ERROR = 'SECURITY_ERROR',
  FAILED_AUTHENTICATION = 'FAILED_AUTHENTICATION',
  EMAIL_VERIFICATION_FAILED = 'EMAIL_VERIFICATION_FAILED',
  
  // Admin Events
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_ACTION = 'ADMIN_ACTION',
  DATA_EXPORTED = 'DATA_EXPORTED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
  
  // Hiring Events
  JOB_POSTING_CREATED = 'JOB_POSTING_CREATED',
  JOB_POSTING_UPDATED = 'JOB_POSTING_UPDATED',
  JOB_POSTING_DELETED = 'JOB_POSTING_DELETED',
  HIRE_CREATED = 'HIRE_CREATED',
  FEE_STATUS_UPDATED = 'FEE_STATUS_UPDATED',
}

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  userId?: string; // User who performed the action (if authenticated)
  targetUserId?: string; // User who was the target of the action (if applicable)
  resourceType?: string; // Type of resource affected (thread, reply, etc.)
  resourceId?: string; // ID of resource affected
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>; // Additional context
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Convenience function to log audit events
 */
export function logAuditEvent(event: {
  eventType: AuditEventType;
  userId?: string;
  targetUserId?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}): void {
  AuditLogService.log(event);
}

export class AuditLogService {
  private static logs: AuditLogEntry[] = [];
  private static maxLogs = 10000; // Keep last 10,000 logs in memory

  /**
   * Log an audit event
   */
  static log(event: {
    eventType: AuditEventType;
    userId?: string;
    targetUserId?: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): void {
    const logEntry: AuditLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventType: event.eventType,
      userId: event.userId,
      targetUserId: event.targetUserId,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      timestamp: new Date(),
      metadata: event.metadata,
      severity: event.severity || 'low',
    };

    // Add to logs
    this.logs.push(logEntry);

    // Keep only maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console for now (in production, would send to logging service)
    this.logToConsole(logEntry);
  }

  /**
   * Get logs by user ID
   */
  static getLogsByUserId(userId: string, limit: number = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.userId === userId || log.targetUserId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get logs by event type
   */
  static getLogsByEventType(eventType: AuditEventType, limit: number = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.eventType === eventType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get logs by severity
   */
  static getLogsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical', limit: number = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get recent logs
   */
  static getRecentLogs(limit: number = 100): AuditLogEntry[] {
    return this.logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get logs in date range
   */
  static getLogsByDateRange(startDate: Date, endDate: Date): AuditLogEntry[] {
    return this.logs.filter(log => 
      log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  /**
   * Get security events
   */
  static getSecurityEvents(limit: number = 100): AuditLogEntry[] {
    const securityEventTypes = [
      AuditEventType.RATE_LIMIT_EXCEEDED,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.FAILED_AUTHENTICATION,
      AuditEventType.EMAIL_VERIFICATION_FAILED,
    ];

    return this.logs
      .filter(log => securityEventTypes.includes(log.eventType))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear old logs (older than specified days)
   */
  static clearOldLogs(daysToKeep: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const beforeCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    const afterCount = this.logs.length;

    return beforeCount - afterCount;
  }

  /**
   * Export logs as JSON
   */
  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get log statistics
   */
  static getStatistics(): {
    totalLogs: number;
    logsByEventType: Record<string, number>;
    logsBySeverity: Record<string, number>;
    logsToday: number;
    logsThisWeek: number;
    securityEventsToday: number;
  } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const logsByEventType: Record<string, number> = {};
    const logsBySeverity: Record<string, number> = {};

    for (const log of this.logs) {
      logsByEventType[log.eventType] = (logsByEventType[log.eventType] || 0) + 1;
      logsBySeverity[log.severity] = (logsBySeverity[log.severity] || 0) + 1;
    }

    return {
      totalLogs: this.logs.length,
      logsByEventType,
      logsBySeverity,
      logsToday: this.logs.filter(log => log.timestamp >= today).length,
      logsThisWeek: this.logs.filter(log => log.timestamp >= weekAgo).length,
      securityEventsToday: this.logs.filter(log => 
        this.securityEventTypes.includes(log.eventType) && log.timestamp >= today
      ).length,
    };
  }

  private static securityEventTypes = [
    AuditEventType.RATE_LIMIT_EXCEEDED,
    AuditEventType.SUSPICIOUS_ACTIVITY,
    AuditEventType.FAILED_AUTHENTICATION,
    AuditEventType.EMAIL_VERIFICATION_FAILED,
  ];

  /**
   * Log to console (in production, would send to logging service)
   */
  private static logToConsole(logEntry: AuditLogEntry): void {
    const severityEmoji = {
      low: '📝',
      medium: '⚠️',
      high: '🔴',
      critical: '🚨',
    };

    const emoji = severityEmoji[logEntry.severity];
    console.log(
      `[AUDIT] ${emoji} ${logEntry.eventType} | ` +
      `User: ${logEntry.userId || 'anonymous'} | ` +
      `Resource: ${logEntry.resourceType || 'N/A'}/${logEntry.resourceId || 'N/A'} | ` +
      `IP: ${logEntry.ipAddress || 'N/A'} | ` +
      `Time: ${logEntry.timestamp.toISOString()}`
    );

    if (logEntry.metadata) {
      console.log(`[AUDIT] Metadata:`, logEntry.metadata);
    }
  }
}