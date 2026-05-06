/**
 * Risk Scoring Algorithm
 * Calculates comprehensive risk scores for clinical trials
 */

export interface RiskFactors {
  enrollmentRate: number;
  sitePerformance: number;
  dataQuality: number;
  protocolComplexity: number;
  staffTurnover: number;
  timelinePressure: number;
}

export interface RiskAnalysis {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: Record<string, number>;
  recommendations: string[];
}

export function calculateRiskScore(factors: RiskFactors): RiskAnalysis {
  // Weight each factor based on importance
  const weights = {
    enrollmentRate: 0.25,
    sitePerformance: 0.20,
    dataQuality: 0.20,
    protocolComplexity: 0.15,
    staffTurnover: 0.10,
    timelinePressure: 0.10,
  };

  // Calculate individual factor scores (0-100, higher = riskier)
  const scores = {
    enrollmentRate: (100 - factors.enrollmentRate) * 1.5,
    sitePerformance: (100 - factors.sitePerformance) * 1.2,
    dataQuality: (100 - factors.dataQuality) * 1.3,
    protocolComplexity: factors.protocolComplexity * 1.0,
    staffTurnover: factors.staffTurnover * 1.4,
    timelinePressure: factors.timelinePressure * 1.1,
  };

  // Calculate weighted risk score
  const totalScore = Object.entries(scores).reduce((sum, [key, value]) => {
    return sum + (value * weights[key as keyof RiskFactors]);
  }, 0);

  // Determine risk level
  let level: 'LOW' | 'MEDIUM' | 'HIGH';
  if (totalScore < 30) {
    level = 'LOW';
  } else if (totalScore < 60) {
    level = 'MEDIUM';
  } else {
    level = 'HIGH';
  }

  // Generate recommendations based on risk factors
  const recommendations = generateRecommendations(scores, level);

  return {
    score: Math.round(totalScore),
    level,
    factors: scores,
    recommendations,
  };
}

function generateRecommendations(scores: Record<string, number>, level: 'LOW' | 'MEDIUM' | 'HIGH'): string[] {
  const recommendations: string[] = [];
  
  // Enrollment issues
  if (scores.enrollmentRate > 50) {
    recommendations.push('Review recruitment strategy and consider protocol amendment');
    if (scores.enrollmentRate > 70) {
      recommendations.push('CRITICAL: Immediate intervention required - convene enrollment task force');
    }
  }
  
  // Site performance issues
  if (scores.sitePerformance > 50) {
    recommendations.push('Provide additional site support and training');
    if (scores.sitePerformance > 70) {
      recommendations.push('Consider site retraining or replacement');
    }
  }
  
  // Data quality issues
  if (scores.dataQuality > 40) {
    recommendations.push('Increase monitoring frequency and provide additional site training');
  }
  
  // Protocol complexity issues
  if (scores.protocolComplexity > 60) {
    recommendations.push('Evaluate protocol simplification opportunities');
  }
  
  // Staff turnover issues
  if (scores.staffTurnover > 50) {
    recommendations.push('Implement staff retention programs and workload balancing');
  }
  
  // Timeline pressure issues
  if (scores.timelinePressure > 60) {
    recommendations.push('Review timeline feasibility and consider adjustment requests');
  }
  
  // Add level-specific recommendations
  if (level === 'HIGH') {
    recommendations.unshift('HIGH RISK: Immediate executive attention required');
    recommendations.push('Escalate to senior management for risk mitigation');
  } else if (level === 'MEDIUM') {
    recommendations.push('MEDIUM RISK: Increased monitoring recommended');
  }
  
  return recommendations;
}