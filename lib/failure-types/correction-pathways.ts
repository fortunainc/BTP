/**
 * CORRECTION PATHWAY ENGINE
 * 
 * PATENT-CRITICAL: This decision-safe correction methodology is core BTP IP
 * 
 * Generates correction options that are:
 * - Decision-safe (present options, NOT prescriptions)
 * - Tiered by intervention level
 * - Non-attributable and reusable
 * - System-focused, not blame-focused
 */

import { 
  FailureType, 
  CorrectionPathways, 
  CorrectionOption, 
  SystemLayer,
  SeverityLevel 
} from './types';

/**
 * Correction templates by tier
 * These are decision-safe starting points, NOT prescriptions
 */
const TIER_1_DESIGN_CORRECTIONS: Record<string, CorrectionOption[]> = {
  'CONSENT_GAP': [
    {
      id: 'cor-001',
      title: 'Consent Process Redesign',
      description: 'Redesign consent workflow to include verification checkpoints',
      interventionType: 'PREVENTATIVE',
      effort: 'MEDIUM',
      impact: 'HIGH',
      decisionPoint: 'What verification method fits your workflow?',
      options: ['Witness verification', 'Electronic confirmation', 'Two-step acknowledgment'],
      risks: ['May increase process time', 'Requires training']
    },
    {
      id: 'cor-002',
      title: 'Competency Confirmation Layer',
      description: 'Add competency confirmation before consent collection',
      interventionType: 'PREVENTATIVE',
      effort: 'LOW',
      impact: 'MEDIUM',
      decisionPoint: 'Who validates competency?',
      options: ['Site staff', 'Independent assessor', 'Automated checklist'],
      risks: ['Resource allocation needed']
    }
  ],
  'DOCUMENTATION_GAP': [
    {
      id: 'cor-003',
      title: 'Real-time Documentation Capture',
      description: 'Implement concurrent documentation requirements',
      interventionType: 'PREVENTATIVE',
      effort: 'HIGH',
      impact: 'HIGH',
      decisionPoint: 'What capture method works for your context?',
      options: ['Mobile capture', 'Voice-to-text', 'Template-driven entry'],
      risks: ['Technology investment', 'Change management']
    },
    {
      id: 'cor-004',
      title: 'Documentation Completeness Gates',
      description: 'Add workflow gates that require documentation completeness',
      interventionType: 'PREVENTATIVE',
      effort: 'MEDIUM',
      impact: 'MEDIUM',
      decisionPoint: 'Where should gates be placed?',
      options: ['Pre-visit', 'During visit', 'Post-visit before submission'],
      risks: ['Potential bottleneck', 'Staff resistance']
    }
  ],
  'DEVIATION_ABSORPTION': [
    {
      id: 'cor-005',
      title: 'Deviation Escalation Protocol',
      description: 'Create clear escalation pathways for detected deviations',
      interventionType: 'CORRECTIVE',
      effort: 'LOW',
      impact: 'HIGH',
      decisionPoint: 'What triggers escalation?',
      options: ['Any deviation', 'Significant deviations only', 'Pattern detection'],
      risks: ['Alert fatigue if not calibrated']
    },
    {
      id: 'cor-006',
      title: 'Deviation Pattern Dashboard',
      description: 'Implement visibility into deviation patterns across studies',
      interventionType: 'PREVENTATIVE',
      effort: 'MEDIUM',
      impact: 'MEDIUM',
      decisionPoint: 'Who has access?',
      options: ['Site only', 'Site + CRO', 'Full stakeholder visibility'],
      risks: ['Data interpretation training needed']
    }
  ],
  'OVERSIGHT_GAP': [
    {
      id: 'cor-007',
      title: 'Oversight Checkpoint Integration',
      description: 'Embed oversight checkpoints at critical workflow stages',
      interventionType: 'PREVENTATIVE',
      effort: 'MEDIUM',
      impact: 'HIGH',
      decisionPoint: 'What depth of oversight?',
      options: ['Administrative', 'Scientific', 'Combined'],
      risks: ['Requires clear role definition']
    }
  ],
  'COMMUNICATION_BREAKDOWN': [
    {
      id: 'cor-008',
      title: 'Communication Channel Standardization',
      description: 'Define standard channels and escalation paths for critical communications',
      interventionType: 'PREVENTATIVE',
      effort: 'LOW',
      impact: 'MEDIUM',
      decisionPoint: 'What channels to standardize?',
      options: ['Safety reporting', 'Protocol questions', 'Timeline changes'],
      risks: ['Over-standardization risk']
    }
  ],
  'DEFAULT': [
    {
      id: 'cor-default',
      title: 'Process Analysis Review',
      description: 'Conduct systematic review of the affected process',
      interventionType: 'CORRECTIVE',
      effort: 'MEDIUM',
      impact: 'MEDIUM',
      decisionPoint: 'What scope for the review?',
      options: ['Single site', 'Multi-site', 'System-wide'],
      risks: ['Time investment required']
    }
  ]
};

const TIER_2_EXECUTION_CORRECTIONS: Record<string, CorrectionOption[]> = {
  'CONSENT_GAP': [
    {
      id: 'exe-001',
      title: 'Consent Retraining Initiative',
      description: 'Deploy targeted retraining for consent process',
      interventionType: 'CORRECTIVE',
      effort: 'MEDIUM',
      impact: 'HIGH',
      decisionPoint: 'Who needs retraining?',
      options: ['All staff', 'Specific roles', 'Identified individuals'],
      risks: ['Scheduling coordination', 'Coverage during training']
    },
    {
      id: 'exe-002',
      title: 'Consent Monitoring Protocol',
      description: 'Implement ongoing monitoring of consent quality',
      interventionType: 'PREVENTATIVE',
      effort: 'LOW',
      impact: 'HIGH',
      decisionPoint: 'What monitoring frequency?',
      options: ['Continuous', 'Periodic', 'Risk-triggered'],
      risks: ['Resource commitment']
    }
  ],
  'DOCUMENTATION_GAP': [
    {
      id: 'exe-003',
      title: 'Documentation Quality Audit',
      description: 'Execute focused audit of documentation practices',
      interventionType: 'CORRECTIVE',
      effort: 'MEDIUM',
      impact: 'MEDIUM',
      decisionPoint: 'What audit scope?',
      options: ['Random sample', 'Risk-based', 'Comprehensive'],
      risks: ['Time away from primary duties']
    }
  ],
  'DEVIATION_ABSORPTION': [
    {
      id: 'exe-004',
      title: 'Deviation Response Protocol',
      description: 'Implement standardized deviation response procedures',
      interventionType: 'CORRECTIVE',
      effort: 'LOW',
      impact: 'HIGH',
      decisionPoint: 'Who approves responses?',
      options: ['PI', 'Study coordinator', 'QA team'],
      risks: ['Approval bottleneck potential']
    }
  ],
  'DEFAULT': [
    {
      id: 'exe-default',
      title: 'Standard Operating Procedure Update',
      description: 'Review and update relevant SOPs',
      interventionType: 'CORRECTIVE',
      effort: 'LOW',
      impact: 'MEDIUM',
      decisionPoint: 'Which SOPs need updating?',
      options: ['All related', 'Critical only', 'Flagged procedures'],
      risks: ['Version control complexity']
    }
  ]
};

const TIER_3_GOVERNANCE_CORRECTIONS: Record<string, CorrectionOption[]> = {
  'CONSENT_GAP': [
    {
      id: 'gov-001',
      title: 'Consent Governance Framework',
      description: 'Establish governance framework for consent integrity',
      interventionType: 'PREVENTATIVE',
      effort: 'HIGH',
      impact: 'HIGH',
      decisionPoint: 'What governance level?',
      options: ['Site-level', 'Network-level', 'Organization-wide'],
      risks: ['Requires leadership buy-in', 'Policy development time']
    },
    {
      id: 'gov-002',
      title: 'Consent Quality Metrics Program',
      description: 'Define and track consent quality metrics',
      interventionType: 'PREVENTATIVE',
      effort: 'MEDIUM',
      impact: 'HIGH',
      decisionPoint: 'What metrics to track?',
      options: ['Process completion', 'Comprehension scores', 'Rework rates'],
      risks: ['Metric definition complexity']
    }
  ],
  'DOCUMENTATION_GAP': [
    {
      id: 'gov-003',
      title: 'Documentation Standards Policy',
      description: 'Formalize documentation standards and accountability',
      interventionType: 'PREVENTATIVE',
      effort: 'MEDIUM',
      impact: 'HIGH',
      decisionPoint: 'How to enforce standards?',
      options: ['Training requirement', 'Certification', 'Performance review integration'],
      risks: ['Enforcement mechanism needed']
    }
  ],
  'DEVIATION_ABSORPTION': [
    {
      id: 'gov-004',
      title: 'Deviation Tolerance Framework',
      description: 'Define acceptable deviation thresholds and responses',
      interventionType: 'PREVENTATIVE',
      effort: 'HIGH',
      impact: 'HIGH',
      decisionPoint: 'Who defines thresholds?',
      options: ['QA committee', 'Medical monitor', 'Sponsor input'],
      risks: ['Requires cross-functional alignment']
    }
  ],
  'OVERSIGHT_GAP': [
    {
      id: 'gov-005',
      title: 'Oversight Committee Structure',
      description: 'Establish formal oversight committee with clear charter',
      interventionType: 'PREVENTATIVE',
      effort: 'HIGH',
      impact: 'HIGH',
      decisionPoint: 'What authority level?',
      options: ['Advisory', 'Decision-making', 'Escalation body'],
      risks: ['Role clarity essential']
    }
  ],
  'DEFAULT': [
    {
      id: 'gov-default',
      title: 'Quality Management System Review',
      description: 'Comprehensive QMS review for identified gap patterns',
      interventionType: 'CORRECTIVE',
      effort: 'HIGH',
      impact: 'HIGH',
      decisionPoint: 'What QMS elements to review?',
      options: ['All SOPs', 'Training programs', 'Oversight mechanisms'],
      risks: ['Significant time investment']
    }
  ]
};

/**
 * Generate correction pathways for a failure type
 * 
 * PATENT-CRITICAL: The tiered, decision-safe approach is core IP
 */
export function generateCorrectionPathways(failureType: FailureType): CorrectionPathways {
  const primaryBreakpoint = failureType.patternSignatures[0] || 'DEFAULT';
  
  // Get corrections for each tier
  const tier1 = TIER_1_DESIGN_CORRECTIONS[primaryBreakpoint] || 
                TIER_1_DESIGN_CORRECTIONS['DEFAULT'];
  
  const tier2 = TIER_2_EXECUTION_CORRECTIONS[primaryBreakpoint] || 
                TIER_2_EXECUTION_CORRECTIONS['DEFAULT'];
  
  const tier3 = TIER_3_GOVERNANCE_CORRECTIONS[primaryBreakpoint] || 
                TIER_3_GOVERNANCE_CORRECTIONS['DEFAULT'];
  
  // Customize based on severity
  const severityAdjustedTier1 = adjustForSeverity(tier1, failureType.severityLevel);
  const severityAdjustedTier2 = adjustForSeverity(tier2, failureType.severityLevel);
  const severityAdjustedTier3 = adjustForSeverity(tier3, failureType.severityLevel);
  
  // Customize based on system layer
  const layerAdjustedTier1 = adjustForLayer(severityAdjustedTier1, failureType.systemLayer);
  const layerAdjustedTier2 = adjustForLayer(severityAdjustedTier2, failureType.systemLayer);
  const layerAdjustedTier3 = adjustForLayer(severityAdjustedTier3, failureType.systemLayer);
  
  return {
    tier1_Design: layerAdjustedTier1,
    tier2_Execution: layerAdjustedTier2,
    tier3_Governance: layerAdjustedTier3,
    decisionSafeStatement: generateDecisionSafeStatement(failureType)
  };
}

/**
 * Adjust correction options based on severity level
 */
function adjustForSeverity(
  options: CorrectionOption[], 
  severity: SeverityLevel
): CorrectionOption[] {
  const severityMultipliers = {
    LOW: { effort: 0.8, impact: 0.8 },
    MEDIUM: { effort: 1.0, impact: 1.0 },
    HIGH: { effort: 1.2, impact: 1.3 },
    CRITICAL: { effort: 1.5, impact: 1.5 }
  };
  
  const multiplier = severityMultipliers[severity];
  
  return options.map(option => ({
    ...option,
    // For higher severity, impact becomes more critical
    impact: multiplier.impact > 1.2 ? 'HIGH' : option.impact,
    // Add urgency note for critical issues
    description: severity === 'CRITICAL' 
      ? `[URGENT] ${option.description}`
      : option.description
  }));
}

/**
 * Adjust correction options based on system layer
 */
function adjustForLayer(
  options: CorrectionOption[], 
  layer: SystemLayer
): CorrectionOption[] {
  // Layer-specific adjustments to options
  return options.map(option => {
    const adjustedOptions = [...option.options];
    
    // Add layer-specific context to decision point
    const layerContext: Record<SystemLayer, string> = {
      PATIENT: 'Consider patient-facing implications',
      SITE: 'Consider site operational constraints',
      CRO: 'Consider CRO oversight responsibilities',
      SPONSOR: 'Consider sponsor governance requirements'
    };
    
    return {
      ...option,
      decisionPoint: `${option.decisionPoint} (${layerContext[layer]})`
    };
  });
}

/**
 * Generate the decision-safe statement
 * This is the PATENT-CRITICAL element ensuring we never prescribe
 */
function generateDecisionSafeStatement(failureType: FailureType): string {
  const statements: string[] = [
    `The following options address the "${failureType.name}" pattern.`,
    'Each option presents choices for implementation.',
    'Selection should be based on your specific context, resources, and risk tolerance.',
    'No single option is recommended over others.',
    'Consider combining options across tiers for comprehensive response.'
  ];
  
  return statements.join(' ');
}

/**
 * Validate that corrections are decision-safe
 */
export function validateDecisionSafe(corrections: CorrectionPathways): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const prescriptiveWords = ['must', 'should', 'required', 'necessary', 'need to', 'always', 'never'];
  
  const allOptions = [
    ...corrections.tier1_Design,
    ...corrections.tier2_Execution,
    ...corrections.tier3_Governance
  ];
  
  for (const option of allOptions) {
    const text = `${option.title} ${option.description}`.toLowerCase();
    
    for (const word of prescriptiveWords) {
      if (text.includes(word)) {
        issues.push(`Option "${option.title}" contains prescriptive language: "${word}"`);
      }
    }
    
    // Check that decision point exists
    if (!option.decisionPoint || !option.options || option.options.length < 2) {
      issues.push(`Option "${option.title}" lacks proper decision structure`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Get correction recommendations by context
 * Returns options filtered and prioritized by context
 */
export function getCorrectionsByContext(
  failureType: FailureType,
  context: {
    availableResources: 'LOW' | 'MEDIUM' | 'HIGH';
    timeline: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
    authority: 'SITE' | 'CRO' | 'SPONSOR';
  }
): CorrectionPathways {
  const baseCorrections = generateCorrectionPathways(failureType);
  
  // Filter by effort based on resources
  const effortFilter = {
    LOW: ['LOW'],
    MEDIUM: ['LOW', 'MEDIUM'],
    HIGH: ['LOW', 'MEDIUM', 'HIGH']
  };
  
  // Filter by timeline
  const interventionFilter = {
    IMMEDIATE: ['CORRECTIVE'],
    SHORT_TERM: ['CORRECTIVE', 'PREVENTATIVE'],
    LONG_TERM: ['PREVENTATIVE']
  };
  
  const filterOptions = (options: CorrectionOption[]) => {
    return options.filter(opt => 
      effortFilter[context.availableResources].includes(opt.effort) &&
      interventionFilter[context.timeline].includes(opt.interventionType)
    );
  };
  
  // Adjust tiers based on authority
  let tier1 = filterOptions(baseCorrections.tier1_Design);
  let tier2 = filterOptions(baseCorrections.tier2_Execution);
  let tier3 = filterOptions(baseCorrections.tier3_Governance);
  
  // Authority limits access to higher tiers
  if (context.authority === 'SITE') {
    tier3 = []; // Sites don't have governance authority
  }
  
  return {
    tier1_Design: tier1,
    tier2_Execution: tier2,
    tier3_Governance: tier3,
    decisionSafeStatement: baseCorrections.decisionSafeStatement
  };
}

export default {
  generateCorrectionPathways,
  validateDecisionSafe,
  getCorrectionsByContext
};