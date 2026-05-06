/**
 * ClinicalTrials.gov API Integration
 * 
 * API Documentation: https://clinicaltrials.gov/data-api/api
 * 
 * This module provides functions to:
 * 1. Search for clinical trials
 * 2. Fetch trial details
 * 3. Parse trial data
 * 4. Calculate predictions vs actual outcomes
 */

interface TrialSearchParams {
  query?: string;
  condition?: string;
  intervention?: string;
  phase?: string;
  status?: string;
  pageSize?: number;
  pageToken?: string;
}

interface TrialData {
  nctId: string;
  title: string;
  status: string;
  phase: string[];
  conditions: string[];
  interventions: string[];
  sponsor: string;
  startDate: string | null;
  completionDate: string | null;
  enrollmentCount: number | null;
  enrollmentType: string | null;
  studyType: string;
  hasResults: boolean;
}

interface PredictionData {
  predictedEnrollment: number;
  actualEnrollment: number | null;
  predictedDuration: number; // months
  actualDuration: number | null; // months
  predictedSuccess: number; // percentage
  actualSuccess: boolean | null;
}

const API_BASE_URL = 'https://clinicaltrials.gov/api/v2';

/**
 * Search for clinical trials
 */
export async function searchTrials(params: TrialSearchParams): Promise<any> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.query) {
      queryParams.append('query.term', params.query);
    }
    
    if (params.condition) {
      queryParams.append('query.cond', params.condition);
    }
    
    if (params.intervention) {
      queryParams.append('query.intr', params.intervention);
    }
    
    if (params.phase && params.phase !== 'ALL') {
      queryParams.append('filter.advanced', `AREA[Phase]${params.phase}`);
    }
    
    if (params.status) {
      queryParams.append('filter.overallStatus', params.status);
    }
    
    queryParams.append('pageSize', (params.pageSize || 10).toString());
    
    if (params.pageToken) {
      queryParams.append('pageToken', params.pageToken);
    }
    
    // Add fields we want to retrieve
    queryParams.append('fields', 'NCTId,BriefTitle,OverallStatus,Phase,Condition,InterventionName,LeadSponsorName,StartDate,CompletionDate,EnrollmentCount,EnrollmentType,StudyType,HasResults');
    
    const url = `${API_BASE_URL}/studies?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`ClinicalTrials.gov API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching trials:', error);
    throw error;
  }
}

/**
 * Fetch detailed trial information
 */
export async function getTrialDetails(nctId: string): Promise<any> {
  try {
    const url = `${API_BASE_URL}/studies/${nctId}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`ClinicalTrials.gov API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching trial details:', error);
    throw error;
  }
}

/**
 * Parse trial data from API response
 */
export function parseTrialData(apiData: any): TrialData {
  const study = apiData.protocolSection || apiData;
  const identification = study.identificationModule || {};
  const status = study.statusModule || {};
  const design = study.designModule || {};
  const conditions = study.conditionsModule || {};
  const interventions = study.armsInterventionsModule || {};
  const sponsor = study.sponsorCollaboratorsModule || {};
  
  return {
    nctId: identification.nctId || '',
    title: identification.briefTitle || '',
    status: status.overallStatus || '',
    phase: design.phases || [],
    conditions: conditions.conditions || [],
    interventions: (interventions.interventions || []).map((i: any) => i.name),
    sponsor: sponsor.leadSponsor?.name || '',
    startDate: status.startDateStruct?.date || null,
    completionDate: status.completionDateStruct?.date || null,
    enrollmentCount: design.enrollmentInfo?.count || null,
    enrollmentType: design.enrollmentInfo?.type || null,
    studyType: design.studyType || '',
    hasResults: status.hasResults || false,
  };
}

/**
 * Calculate trial duration in months
 */
export function calculateDuration(startDate: string | null, endDate: string | null): number | null {
  if (!startDate || !endDate) return null;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return diffMonths;
  } catch (error) {
    return null;
  }
}

/**
 * Generate AI predictions for a trial
 * (Simplified version - in production, this would use ML models)
 */
export function generatePredictions(trial: TrialData): PredictionData {
  // Simplified prediction logic
  // In production, this would use trained ML models
  
  // Predict enrollment based on phase
  let predictedEnrollment = 100;
  if (trial.phase.includes('PHASE1')) predictedEnrollment = 30;
  else if (trial.phase.includes('PHASE2')) predictedEnrollment = 100;
  else if (trial.phase.includes('PHASE3')) predictedEnrollment = 500;
  else if (trial.phase.includes('PHASE4')) predictedEnrollment = 1000;
  
  // Predict duration based on phase (in months)
  let predictedDuration = 24;
  if (trial.phase.includes('PHASE1')) predictedDuration = 12;
  else if (trial.phase.includes('PHASE2')) predictedDuration = 18;
  else if (trial.phase.includes('PHASE3')) predictedDuration = 36;
  else if (trial.phase.includes('PHASE4')) predictedDuration = 24;
  
  // Predict success rate (simplified)
  let predictedSuccess = 50;
  if (trial.phase.includes('PHASE1')) predictedSuccess = 70;
  else if (trial.phase.includes('PHASE2')) predictedSuccess = 50;
  else if (trial.phase.includes('PHASE3')) predictedSuccess = 40;
  
  // Calculate actual values
  const actualEnrollment = trial.enrollmentCount;
  const actualDuration = calculateDuration(trial.startDate, trial.completionDate);
  const actualSuccess = trial.status === 'COMPLETED' && trial.hasResults ? true : null;
  
  return {
    predictedEnrollment,
    actualEnrollment,
    predictedDuration,
    actualDuration,
    predictedSuccess,
    actualSuccess,
  };
}

/**
 * Calculate prediction error percentage
 */
export function calculateError(predicted: number, actual: number | null): number | null {
  if (actual === null || actual === 0) return null;
  return Math.abs(((predicted - actual) / actual) * 100);
}

/**
 * Calculate cost impact of prediction errors
 * Average clinical trial costs:
 * - Phase 1: $4M
 * - Phase 2: $13M
 * - Phase 3: $20M
 */
export function calculateCostImpact(
  phase: string[],
  enrollmentError: number | null,
  durationError: number | null
): number {
  let baseCost = 20000000; // $20M default
  
  if (phase.includes('PHASE1')) baseCost = 4000000;
  else if (phase.includes('PHASE2')) baseCost = 13000000;
  else if (phase.includes('PHASE3')) baseCost = 20000000;
  
  let costImpact = 0;
  
  // Enrollment error impact (each % error = 0.5% cost increase)
  if (enrollmentError !== null) {
    costImpact += baseCost * (enrollmentError / 100) * 0.5;
  }
  
  // Duration error impact (each % error = 1% cost increase)
  if (durationError !== null) {
    costImpact += baseCost * (durationError / 100);
  }
  
  return Math.round(costImpact);
}

/**
 * Fetch and analyze multiple trials
 */
export async function analyzeTrials(params: TrialSearchParams): Promise<{
  trials: TrialData[];
  predictions: PredictionData[];
  summary: {
    totalTrials: number;
    avgEnrollmentError: number;
    avgDurationError: number;
    totalCostImpact: number;
  };
}> {
  const searchResults = await searchTrials(params);
  const studies = searchResults.studies || [];
  
  const trials: TrialData[] = [];
  const predictions: PredictionData[] = [];
  
  for (const study of studies.slice(0, 20)) { // Limit to 20 for performance
    try {
      const trialData = parseTrialData(study);
      const prediction = generatePredictions(trialData);
      
      trials.push(trialData);
      predictions.push(prediction);
    } catch (error) {
      console.error('Error processing trial:', error);
    }
  }
  
  // Calculate summary statistics
  const enrollmentErrors = predictions
    .map(p => calculateError(p.predictedEnrollment, p.actualEnrollment))
    .filter(e => e !== null) as number[];
  
  const durationErrors = predictions
    .map(p => calculateError(p.predictedDuration, p.actualDuration))
    .filter(e => e !== null) as number[];
  
  const avgEnrollmentError = enrollmentErrors.length > 0
    ? enrollmentErrors.reduce((a, b) => a + b, 0) / enrollmentErrors.length
    : 0;
  
  const avgDurationError = durationErrors.length > 0
    ? durationErrors.reduce((a, b) => a + b, 0) / durationErrors.length
    : 0;
  
  const totalCostImpact = trials.reduce((sum, trial, index) => {
    const pred = predictions[index];
    const enrollmentError = calculateError(pred.predictedEnrollment, pred.actualEnrollment);
    const durationError = calculateError(pred.predictedDuration, pred.actualDuration);
    return sum + calculateCostImpact(trial.phase, enrollmentError, durationError);
  }, 0);
  
  return {
    trials,
    predictions,
    summary: {
      totalTrials: trials.length,
      avgEnrollmentError: Math.round(avgEnrollmentError),
      avgDurationError: Math.round(avgDurationError),
      totalCostImpact,
    },
  };
}