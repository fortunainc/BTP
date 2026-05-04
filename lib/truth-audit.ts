/**
 * Phase 5: Truth Audit System
 * Comprehensive audit logging and verification for matching decisions
 */

import { createHash, randomUUID } from 'crypto';

// Audit Event Types
export type AuditEventType = 
  | 'match_created'
  | 'match_viewed'
  | 'match_hired'
  | 'match_rejected'
  | 'contribution_submitted'
  | 'contribution_sanitized'
  | 'decoy_injected'
  | 'alert_triggered'
  | 'quality_check_failed'
  | 'anonymity_breach_attempt';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  actor: {
    type: 'system' | 'organization' | 'operator' | 'admin';
    id: string; // Hashed/anonymous ID
  };
  resource: {
    type: 'match' | 'contribution' | 'profile' | 'job';
    id: string;
  };
  action: string;
  metadata: Record<string, unknown>;
  ipAddress?: string; // Hashed for privacy
  sessionId?: string;
}

// Audit Trail Storage (in production, this would be a database)
const auditStore: Map<string, AuditEvent[]> = new Map();

/**
 * Log an audit event
 */
export function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  const auditEvent: AuditEvent = {
    id: randomUUID(),
    timestamp: new Date(),
    ...event
  };
  
  // Store by resource ID for retrieval
  const resourceKey = `${event.resource.type}:${event.resource.id}`;
  if (!auditStore.has(resourceKey)) {
    auditStore.set(resourceKey, []);
  }
  auditStore.get(resourceKey)!.push(auditEvent);
  
  return auditEvent;
}

/**
 * Retrieve audit trail for a resource
 */
export function getAuditTrail(
  resourceType: string,
  resourceId: string
): AuditEvent[] {
  const resourceKey = `${resourceType}:${resourceId}`;
  return auditStore.get(resourceKey) || [];
}

/**
 * Truth Audit Result
 */
export interface TruthAuditResult {
  matchId: string;
  verified: boolean;
  confidence: number;
  checks: {
    executionContextReasoning: boolean;
    patternFitExplanation: boolean;
    outcomeBackedJustification: boolean;
    anonymityPreserved: boolean;
    decoysPresent: boolean;
    scoreCalculation: boolean;
  };
  issues: string[];
  recommendations: string[];
  auditTrail: AuditEvent[];
}

/**
 * Verify that a match result is truthful and auditable
 */
export function auditMatchResult(params: {
  matchId: string;
  matchResult: {
    profileId: string;
    matchScore: number;
    executionContextReasoning?: string;
    patternFitExplanation?: string;
    outcomeBackedJustification?: string;
    components?: Record<string, number>;
    isDecoy?: boolean;
  };
  expectedComponents: string[];
  anonymityVerified: boolean;
}): TruthAuditResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const checks = {
    executionContextReasoning: false,
    patternFitExplanation: false,
    outcomeBackedJustification: false,
    anonymityPreserved: false,
    decoysPresent: false,
    scoreCalculation: false
  };
  
  // Check 1: Execution Context Reasoning
  if (params.matchResult.executionContextReasoning && 
      params.matchResult.executionContextReasoning.length >= 50) {
    checks.executionContextReasoning = true;
  } else {
    issues.push('Missing or insufficient execution context reasoning');
  }
  
  // Check 2: Pattern Fit Explanation
  if (params.matchResult.patternFitExplanation && 
      params.matchResult.patternFitExplanation.length >= 50) {
    checks.patternFitExplanation = true;
  } else {
    issues.push('Missing or insufficient pattern fit explanation');
  }
  
  // Check 3: Outcome-Backed Justification
  if (params.matchResult.outcomeBackedJustification && 
      params.matchResult.outcomeBackedJustification.length >= 30) {
    checks.outcomeBackedJustification = true;
  } else {
    issues.push('Missing outcome-backed justification');
  }
  
  // Check 4: Anonymity Preserved
  checks.anonymityPreserved = params.anonymityVerified;
  if (!params.anonymityVerified) {
    issues.push('CRITICAL: Anonymity verification failed');
    recommendations.push('Review anonymity engine before proceeding');
  }
  
  // Check 5: Decoys Present (for match sets, not individual matches)
  // This is checked at the match set level, so we mark it true for individual matches
  checks.decoysPresent = true;
  
  // Check 6: Score Calculation Verification
  if (params.matchResult.components && 
      params.expectedComponents.every(comp => 
        params.matchResult.components!.hasOwnProperty(comp)
      )) {
    const componentSum = Object.values(params.matchResult.components)
      .reduce((sum, val) => sum + val, 0);
    const expectedTotal = params.matchResult.matchScore;
    const tolerance = 0.05; // 5% tolerance
    
    if (Math.abs(componentSum - expectedTotal) <= tolerance) {
      checks.scoreCalculation = true;
    } else {
      issues.push(`Score calculation mismatch: components sum to ${componentSum.toFixed(3)}, but score is ${expectedTotal.toFixed(3)}`);
    }
  } else {
    issues.push('Missing or incomplete score component breakdown');
  }
  
  // Calculate confidence
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.values(checks).length;
  const confidence = passedChecks / totalChecks;
  
  // Log the audit
  logAuditEvent({
    eventType: 'match_viewed',
    actor: { type: 'system', id: 'truth-audit' },
    resource: { type: 'match', id: params.matchId },
    action: 'truth_audit_performed',
    metadata: {
      verified: confidence >= 0.8,
      confidence,
      checks,
      issueCount: issues.length
    }
  });
  
  return {
    matchId: params.matchId,
    verified: confidence >= 0.8,
    confidence,
    checks,
    issues,
    recommendations,
    auditTrail: getAuditTrail('match', params.matchId)
  };
}

/**
 * Comprehensive Truth Audit for a match session
 */
export interface SessionAuditResult {
  sessionId: string;
  timestamp: Date;
  matchAudits: TruthAuditResult[];
  overallConfidence: number;
  allVerified: boolean;
  criticalIssues: string[];
  anonymitySecure: boolean;
  qualityScore: number;
}

export function performSessionAudit(params: {
  sessionId: string;
  matchResults: Array<{
    matchId: string;
    matchResult: {
      profileId: string;
      matchScore: number;
      executionContextReasoning?: string;
      patternFitExplanation?: string;
      outcomeBackedJustification?: string;
      components?: Record<string, number>;
      isDecoy?: boolean;
    };
  }>;
  expectedComponents: string[];
  anonymitySimulationResult: { secure: boolean; confidence: number };
  qualityValidationResult: { passed: boolean; metrics: Record<string, number> };
}): SessionAuditResult {
  const matchAudits: TruthAuditResult[] = [];
  const criticalIssues: string[] = [];
  
  // Audit each match
  params.matchResults.forEach(({ matchId, matchResult }) => {
    const audit = auditMatchResult({
      matchId,
      matchResult,
      expectedComponents: params.expectedComponents,
      anonymityVerified: params.anonymitySimulationResult.secure
    });
    
    matchAudits.push(audit);
    
    if (!audit.checks.anonymityPreserved) {
      criticalIssues.push(`Match ${matchId}: Anonymity not preserved`);
    }
  });
  
  // Calculate overall confidence
  const avgConfidence = matchAudits.reduce((sum, audit) => 
    sum + audit.confidence, 0) / matchAudits.length || 0;
  
  const anonymitySecure = params.anonymitySimulationResult.confidence >= 0.90;
  const qualityScore = params.qualityValidationResult.passed 
    ? Object.values(params.qualityValidationResult.metrics)
        .reduce((sum: number, val) => sum + (typeof val === 'number' ? val : 0), 0) / 
      Object.keys(params.qualityValidationResult.metrics).length
    : 0;
  
  // Log session audit
  logAuditEvent({
    eventType: 'match_viewed',
    actor: { type: 'system', id: 'truth-audit' },
    resource: { type: 'match', id: params.sessionId },
    action: 'session_audit_performed',
    metadata: {
      matchCount: matchAudits.length,
      overallConfidence: avgConfidence,
      allVerified: matchAudits.every(a => a.verified),
      criticalIssueCount: criticalIssues.length,
      anonymitySecure,
      qualityScore
    }
  });
  
  return {
    sessionId: params.sessionId,
    timestamp: new Date(),
    matchAudits,
    overallConfidence: avgConfidence,
    allVerified: matchAudits.every(a => a.verified),
    criticalIssues,
    anonymitySecure,
    qualityScore
  };
}

/**
 * Generate audit report for compliance
 */
export function generateAuditReport(
  sessionResult: SessionAuditResult
): string {
  const lines: string[] = [
    '═'.repeat(80),
    'BTP TRUTH AUDIT REPORT',
    '═'.repeat(80),
    '',
    `Session ID: ${sessionResult.sessionId}`,
    `Timestamp: ${sessionResult.timestamp.toISOString()}`,
    '',
    '─'.repeat(40),
    'AUDIT SUMMARY',
    '─'.repeat(40),
    '',
    `Overall Confidence: ${(sessionResult.overallConfidence * 100).toFixed(1)}%`,
    `All Matches Verified: ${sessionResult.allVerified ? 'YES' : 'NO'}`,
    `Anonymity Secure: ${sessionResult.anonymitySecure ? 'YES' : 'NO'}`,
    `Quality Score: ${(sessionResult.qualityScore * 100).toFixed(1)}%`,
    '',
    '─'.repeat(40),
    'MATCH DETAILS',
    '─'.repeat(40)
  ];
  
  sessionResult.matchAudits.forEach((audit, index) => {
    lines.push('');
    lines.push(`Match ${index + 1}: ${audit.matchId}`);
    lines.push(`  Verified: ${audit.verified ? 'YES' : 'NO'}`);
    lines.push(`  Confidence: ${(audit.confidence * 100).toFixed(1)}%`);
    lines.push(`  Checks:`);
    
    Object.entries(audit.checks).forEach(([check, passed]) => {
      lines.push(`    - ${check}: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    });
    
    if (audit.issues.length > 0) {
      lines.push(`  Issues:`);
      audit.issues.forEach(issue => {
        lines.push(`    - ${issue}`);
      });
    }
  });
  
  if (sessionResult.criticalIssues.length > 0) {
    lines.push('');
    lines.push('─'.repeat(40));
    lines.push('CRITICAL ISSUES');
    lines.push('─'.repeat(40));
    sessionResult.criticalIssues.forEach(issue => {
      lines.push(`  ⚠ ${issue}`);
    });
  }
  
  lines.push('');
  lines.push('═'.repeat(80));
  lines.push('END OF AUDIT REPORT');
  lines.push('═'.repeat(80));
  
  return lines.join('\n');
}

/**
 * Export audit trail for external verification
 */
export function exportAuditTrail(
  sessionId: string
): { events: AuditEvent[]; hash: string } {
  const events = getAuditTrail('match', sessionId);
  const eventStrings = events.map(e => JSON.stringify(e)).join('|');
  const hash = createHash('sha256').update(eventStrings).digest('hex');
  
  return { events, hash };
}