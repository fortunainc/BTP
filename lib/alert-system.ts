/**
 * Intelligent Alert System
 * Monitors trial data and generates actionable alerts
 */

export interface TrialData {
  enrollment_rate: number;
  site_performance_score: number;
  data_quality_score: number;
  risk_level: string;
  sites: any[];
}

export interface AlertRule {
  condition: (data: TrialData) => boolean;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  action: string;
}

export interface Alert {
  type: string;
  severity: string;
  message: string;
  action: string;
  timestamp: string;
}

const alertRules: AlertRule[] = [
  {
    condition: (data) => data.enrollment_rate < 50,
    severity: 'CRITICAL',
    message: 'Enrollment rate critically low',
    action: 'Review recruitment strategy and consider protocol amendment',
  },
  {
    condition: (data) => data.enrollment_rate < 70 && data.enrollment_rate >= 50,
    severity: 'WARNING',
    message: 'Enrollment rate below target',
    action: 'Increase recruitment efforts and monitor patient acquisition',
  },
  {
    condition: (data) => data.data_quality_score < 70,
    severity: 'WARNING',
    message: 'Data quality declining',
    action: 'Increase monitoring frequency and provide additional site training',
  },
  {
    condition: (data) => data.site_performance_score < 70,
    severity: 'WARNING',
    message: 'Site performance below expectations',
    action: 'Provide additional site support and consider intervention strategies',
  },
  {
    condition: (data) => data.risk_level === 'HIGH',
    severity: 'CRITICAL',
    message: 'High risk level detected',
    action: 'Immediate intervention required - convene risk management team',
  },
  {
    condition: (data) => data.risk_level === 'MEDIUM',
    severity: 'WARNING',
    message: 'Medium risk level detected',
    action: 'Increased monitoring and proactive risk mitigation recommended',
  },
];

export function checkAlerts(trialData: TrialData): Alert[] {
  return alertRules
    .filter(rule => rule.condition(trialData))
    .map(rule => ({
      type: rule.severity,
      severity: rule.severity,
      message: rule.message,
      action: rule.action,
      timestamp: new Date().toISOString(),
    }));
}

export function prioritizeAlerts(alerts: Alert[]): Alert[] {
  const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  
  return alerts.sort((a, b) => {
    const severityA = severityOrder[a.severity as keyof typeof severityOrder];
    const severityB = severityOrder[b.severity as keyof typeof severityOrder];
    return severityA - severityB;
  });
}