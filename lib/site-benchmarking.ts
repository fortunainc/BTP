/**
 * Site Performance Benchmarking
 * Calculates site performance scores and provides comparative analysis
 */

export interface SitePerformanceData {
  enrollmentVelocity: number;
  protocolCompliance: number;
  dataQuality: number;
  staffEfficiency: number;
}

export interface SiteBenchmarkResult {
  score: number;
  percentile: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export function calculateSitePerformance(siteData: SitePerformanceData): SiteBenchmarkResult {
  // Performance metrics and thresholds
  const metrics = {
    enrollmentVelocity: { weight: 0.3, threshold: 2.5, label: 'Enrollment Velocity' },
    protocolCompliance: { weight: 0.25, threshold: 95, label: 'Protocol Compliance' },
    dataQuality: { weight: 0.25, threshold: 90, label: 'Data Quality' },
    staffEfficiency: { weight: 0.2, threshold: 80, label: 'Staff Efficiency' },
  };

  // Calculate score
  let totalScore = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  Object.entries(metrics).forEach(([metric, config]) => {
    const value = siteData[metric as keyof SitePerformanceData] || 0;
    const score = Math.min((value / config.threshold) * 100, 100);
    totalScore += score * config.weight;

    if (score >= 90) strengths.push(config.label);
    if (score < 70) weaknesses.push(config.label);
  });

  // Calculate percentile (simplified)
  const percentile = Math.min(totalScore, 95);

  // Generate recommendations
  const recommendations = generateSiteRecommendations(weaknesses, strengths);

  return {
    score: Math.round(totalScore),
    percentile: Math.round(percentile),
    strengths,
    weaknesses,
    recommendations,
  };
}

function generateSiteRecommendations(weaknesses: string[], strengths: string[]): string[] {
  const recommendations: string[] = [];

  if (weaknesses.includes('Enrollment Velocity')) {
    recommendations.push('Increase patient recruitment efforts and consider community outreach');
  }

  if (weaknesses.includes('Protocol Compliance')) {
    recommendations.push('Provide additional protocol training and support');
  }

  if (weaknesses.includes('Data Quality')) {
    recommendations.push('Implement enhanced data quality monitoring and training');
  }

  if (weaknesses.includes('Staff Efficiency')) {
    recommendations.push('Review staff workload and consider resource allocation');
  }

  // Leverage strengths
  if (strengths.length > 0) {
    recommendations.push(`Continue best practices in: ${strengths.join(', ')}`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current high performance standards');
  }

  return recommendations;
}