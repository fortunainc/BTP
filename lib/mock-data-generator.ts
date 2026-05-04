/**
 * Mock Data Generator for Execution Intelligence
 * Generates realistic synthetic data for development and testing
 */

export interface MockTrialData {
  trial_id: string;
  enrollment_rate: number;
  site_performance_score: number;
  data_quality_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  sites: MockSiteData[];
  last_updated: string;
}

export interface MockSiteData {
  site_id: string;
  patient_count: number;
  enrollment_velocity: number;
  protocol_compliance: number;
  staff_workload: number;
}

export function generateTrialData(trialId: string): MockTrialData {
  // Generate realistic metrics
  const enrollmentRate = Math.random() * 40 + 60; // 60-100%
  const sitePerformanceScore = Math.random() * 30 + 70; // 70-100%
  const dataQualityScore = Math.random() * 20 + 80; // 80-100%
  
  // Determine risk level based on performance
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  const overallPerformance = (enrollmentRate + sitePerformanceScore + dataQualityScore) / 3;
  
  if (overallPerformance >= 85) {
    riskLevel = 'LOW';
  } else if (overallPerformance >= 70) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'HIGH';
  }
  
  // Generate site data
  const numSites = Math.floor(Math.random() * 5) + 3; // 3-8 sites
  const sites: MockSiteData[] = [];
  
  for (let i = 1; i <= numSites; i++) {
    sites.push({
      site_id: `SITE_${String(i).padStart(3, '0')}`,
      patient_count: Math.floor(Math.random() * 50) + 20,
      enrollment_velocity: Math.random() * 3 + 1, // 1-4 patients/month
      protocol_compliance: Math.random() * 15 + 85, // 85-100%
      staff_workload: Math.random() * 40 + 60, // 60-100%
    });
  }
  
  return {
    trial_id: trialId,
    enrollment_rate: Math.round(enrollmentRate),
    site_performance_score: Math.round(sitePerformanceScore),
    data_quality_score: Math.round(dataQualityScore),
    risk_level: riskLevel,
    sites,
    last_updated: new Date().toISOString(),
  };
}

export function generateMultipleTrials(count: number = 5): Record<string, MockTrialData> {
  const trials: Record<string, MockTrialData> = {};
  
  for (let i = 1; i <= count; i++) {
    const trialId = `TRIAL_${String(i).padStart(3, '0')}`;
    trials[trialId] = generateTrialData(trialId);
  }
  
  return trials;
}

export function simulateRealTimeUpdate(trialData: MockTrialData): MockTrialData {
  // Simulate small changes in metrics
  const variation = () => (Math.random() - 0.5) * 5; // ±2.5% variation
  
  return {
    ...trialData,
    enrollment_rate: Math.max(0, Math.min(100, trialData.enrollment_rate + variation())),
    site_performance_score: Math.max(0, Math.min(100, trialData.site_performance_score + variation())),
    data_quality_score: Math.max(0, Math.min(100, trialData.data_quality_score + variation())),
    last_updated: new Date().toISOString(),
  };
}