/**
 * PREDEFINED FAILURE TYPES
 * 
 * 10 fully defined FailureTypes representing common patterns in clinical trials
 * These are structured, named, repeatable, and non-attributable
 * 
 * Each type includes:
 * - Unique ID and memorable name
 * - Clear definition
 * - Pattern signatures
 * - Contributing factors
 * - System layer and severity
 * - Decision-safe correction pathways
 */

import { FailureType, CorrectionPathways, CorrectionOption } from './types';

/**
 * FAILURE TYPE 1: Consent Illusion
 */
const CONSENT_ILLUSION: FailureType = {
  id: 'ft-consent-illusion-001',
  name: 'Consent Illusion',
  definition: 'A systemic failure pattern where consent processes appear complete but lack substantive verification of participant understanding or voluntary agreement. The consent exists in form but not in verified comprehension.',
  patternSignatures: ['CONSENT_GAP', 'COMPETENCE_GAP', 'DOCUMENTATION_GAP'],
  contributingFactors: [
    'Time pressure during enrollment',
    'Inadequate consent training',
    'Language barriers unaddressed',
    'Proxy consent ambiguity'
  ],
  systemLayer: 'SITE',
  severityLevel: 'HIGH',
  frequencyScore: 0.78,
  emergenceVelocity: 'GRADUAL',
  linkedSeeds: [],
  correctionPathways: {
    tier1_Design: [
      {
        id: 'cor-ci-001',
        title: 'Teach-Back Verification Layer',
        description: 'Add structured teach-back verification to consent process',
        interventionType: 'PREVENTATIVE',
        effort: 'LOW',
        impact: 'HIGH',
        decisionPoint: 'What verification threshold?',
        options: ['Full teach-back', 'Key concepts only', 'Risk-focused teach-back'],
        risks: ['May extend consent session duration']
      }
    ],
    tier2_Execution: [
      {
        id: 'cor-ci-002',
        title: 'Consent Quality Audit Program',
        description: 'Implement periodic consent quality assessments',
        interventionType: 'CORRECTIVE',
        effort: 'MEDIUM',
        impact: 'MEDIUM',
        decisionPoint: 'What audit frequency?',
        options: ['Monthly', 'Quarterly', 'Risk-triggered'],
        risks: ['Requires dedicated auditor time']
      }
    ],
    tier3_Governance: [
      {
        id: 'cor-ci-003',
        title: 'Consent Integrity Framework',
        description: 'Establish organization-wide consent integrity standards',
        interventionType: 'PREVENTATIVE',
        effort: 'HIGH',
        impact: 'HIGH',
        decisionPoint: 'What governance scope?',
        options: ['Site-level', 'Network-wide', 'Enterprise'],
        risks: ['Requires stakeholder alignment']
      }
    ],
    decisionSafeStatement: 'The following options address the Consent Illusion pattern. Selection should be based on your specific context, resources, and risk tolerance. No single option is recommended over others.'
  },
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * FAILURE TYPE 2: Data Cleanliness Mirage
 */
const DATA_CLEANLINESS_MIRAGE: FailureType = {
  id: 'ft-data-mirage-001',
  name: 'Data Cleanliness Mirage',
  definition: 'A failure pattern where data appears complete and accurate on surface review but contains systematic errors, missing context, or verification gaps that only emerge under scrutiny or audit.',
  patternSignatures: ['DATA_INTEGRITY', 'DOCUMENTATION_GAP', 'OVERSIGHT_GAP'],
  contributingFactors: [
    'Time pressure on data entry',
    'Inadequate source verification',
    'System validation gaps',
    'Query resolution delays'
  ],
  systemLayer: 'SITE',
  severityLevel: 'HIGH',
  frequencyScore: 0.82,
  emergenceVelocity: 'GRADUAL',
  linkedSeeds: [],
  correctionPathways: {
    tier1_Design: [
      {
        id: 'cor-dm-001',
        title: 'Real-time Data Quality Gates',
        description: 'Implement automated quality checks at data entry points',
        interventionType: 'PREVENTATIVE',
        effort: 'MEDIUM',
        impact: 'HIGH',
        decisionPoint: 'What validation depth?',
        options: ['Format validation', 'Logical consistency', 'Cross-field validation'],
        risks: ['May slow data entry']
      }
    ],
    tier2_Execution: [
      {
        id: 'cor-dm-002',
        title: 'Source Verification Intensification',
        description: 'Increase source document verification sampling',
        interventionType: 'CORRECTIVE',
        effort: 'MEDIUM',
        impact: 'MEDIUM',
        decisionPoint: 'What verification scope?',
        options: ['Risk-based sampling', '100% critical fields', 'Random audit'],
        risks: ['Resource intensive']
      }
    ],
    tier3_Governance: [
      {
        id: 'cor-dm-003',
        title: 'Data Quality Governance Program',
        description: 'Establish data quality metrics and accountability',
        interventionType: 'PREVENTATIVE',
        effort: 'HIGH',
        impact: 'HIGH',
        decisionPoint: 'What accountability model?',
        options: ['Role-based', 'Process-based', 'Combined'],
        risks: ['Change management required']
      }
    ],
    decisionSafeStatement: 'The following options address the Data Cleanliness Mirage pattern. Selection should be based on your specific context, resources, and risk tolerance.'
  },
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * FAILURE TYPE 3: Silent Deviation Absorption
 */
const SILENT_DEVIATION_ABSORPTION: FailureType = {
  id: 'ft-deviation-absorption-001',
  name: 'Silent Deviation Absorption',
  definition: 'A failure pattern where protocol deviations occur but are absorbed into normal operations without proper documentation, escalation, or corrective action. The deviation becomes invisible through normalization.',
  patternSignatures: ['DEVIATION_ABSORPTION', 'DOCUMENTATION_GAP', 'COMMUNICATION_BREAKDOWN'],
  contributingFactors: [
    'Deviation normalization over time',
    'Unclear escalation thresholds',
    'Workaround culture',
    'Time pressure to continue'
  ],
  systemLayer: 'SITE',
  severityLevel: 'CRITICAL',
  frequencyScore: 0.71,
  emergenceVelocity: 'RECURRING',
  linkedSeeds: [],
  correctionPathways: {
    tier1_Design: [
      {
        id: 'cor-da-001',
        title: 'Deviation Detection Protocol',
        description: 'Implement systematic deviation detection and classification',
        interventionType: 'PREVENTATIVE',
        effort: 'MEDIUM',
        impact: 'HIGH',
        decisionPoint: 'What detection approach?',
        options: ['Staff self-report', 'System flags', 'External audit'],
        risks: ['Requires culture shift']
      }
    ],
    tier2_Execution: [
      {
        id: 'cor-da-002',
        title: 'Deviation Response Standardization',
        description: 'Create clear deviation response procedures',
        interventionType: 'CORRECTIVE',
        effort: 'LOW',
        impact: 'HIGH',
        decisionPoint: 'Who approves responses?',
        options: ['PI immediate', 'QA review', 'Medical monitor'],
        risks: ['May delay study activities']
      }
    ],
    tier3_Governance: [
      {
        id: 'cor-da-003',
        title: 'Deviation Tolerance Framework',
        description: 'Define acceptable deviation thresholds and governance',
        interventionType: 'PREVENTATIVE',
        effort: 'HIGH',
        impact: 'HIGH',
        decisionPoint: 'What governance level?',
        options: ['Protocol-level', 'Program-level', 'Enterprise'],
        risks: ['Requires sponsor alignment']
      }
    ],
    decisionSafeStatement: 'The following options address the Silent Deviation Absorption pattern. Selection should be based on your specific context, resources, and risk tolerance.'
  },
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * FAILURE TYPE 4: Oversight Mirage
 */
const OVERSIGHT_MIRAGE: FailureType = {
  id: 'ft-oversight-mirage-001',
  name: 'Oversight Mirage',
  definition: 'A failure pattern where oversight mechanisms exist in theory but fail to detect or respond to issues in practice. Oversight appears active while being substantively ineffective.',
  patternSignatures: ['OVERSIGHT_GAP', 'COMMUNICATION_BREAKDOWN', 'COMPETENCE_GAP'],
  contributingFactors: [
    'Oversight role confusion',
    'Information asymmetry',
    'Passive monitoring mindset',
    'Escalation pathway gaps'
  ],
  systemLayer: 'CRO',
  severityLevel: 'HIGH',
  frequencyScore: 0.65,
  emergenceVelocity: 'GRADUAL',
  linkedSeeds: [],
  correctionPathways: {
    tier1_Design: [
      {
        id: 'cor-om-001',
        title: 'Oversight Activation Checkpoints',
        description: 'Add verification that oversight is functioning',
        interventionType: 'PREVENTATIVE',
        effort: 'MEDIUM',
        impact: 'HIGH',
        decisionPoint: 'What verification method?',
        options: ['Self-certification', 'Independent review', 'Systematic sampling'],
        risks: ['Additional oversight layer']
      }
    ],
    tier2_Execution: [
      {
        id: 'cor-om-002',
        title: 'Oversight Escalation Training',
        description: 'Train oversight roles on detection and response',
        interventionType: 'CORRECTIVE',
        effort: 'LOW',
        impact: 'MEDIUM',
        decisionPoint: 'What training scope?',
        options: ['Detection focus', 'Response focus', 'Combined'],
        risks: ['Time away from operations']
      }
    ],
    tier3_Governance: [
      {
        id: 'cor-om-003',
        title: 'Oversight Effectiveness Metrics',
        description: 'Define and track oversight effectiveness measures',
        interventionType: 'PREVENTATIVE',
        effort: 'HIGH',
        impact: 'HIGH',
        decisionPoint: 'What metrics framework?',
        options: ['Detection rate', 'Response time', 'Issue resolution'],
        risks: ['Metric gaming potential']
      }
    ],
    decisionSafeStatement: 'The following options address the Oversight Mirage pattern. Selection should be based on your specific context, resources, and risk tolerance.'
  },
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * FAILURE TYPE 5: Competence Assumption Failure
 */
const COMPETENCE_ASSUMPTION_FAILURE: FailureType = {
  id: 'ft-competence-assumption-001',
  name: 'Competence Assumption Failure',
  definition: 'A failure pattern where competence is assumed based on credentials, training records, or role assignment without verification of actual capability to perform specific protocol requirements.',
  patternSignatures: ['COMPETENCE_GAP', 'OVERSIGHT_GAP', 'TRAINING_GAP'],
  contributingFactors: [
    'Training completion vs. comprehension gap',
    'Protocol complexity underestimation',
    'Role-specific skill gaps',
    'Inadequate competency verification'
  ],
  systemLayer: 'SITE',
  severityLevel: 'MEDIUM',
  frequencyScore: 0.73,
  emergenceVelocity: 'GRADUAL',
  linkedSeeds: [],
  correctionPathways: {
    tier1_Design: [
      {
        id: 'cor-ca-001',
        title: 'Competency Verification Gates',
        description: 'Add competency verification before critical task assignment',
        interventionType: 'PREVENTATIVE',
        effort: 'MEDIUM',
        impact: 'HIGH',
        decisionPoint: 'What verification method?',
        options: ['Observation', 'Demonstration', 'Simulation'],
        risks: ['Time investment for verification']
      }
    ],
    tier2_Execution: [
      {
        id: 'cor-ca-002',
        title: 'Competency Remediation Pathway',
        description: 'Create pathway for addressing identified competency gaps',
        interventionType: 'CORRECTIVE',
        effort: 'LOW',
        impact: 'MEDIUM',
        decisionPoint: 'Who delivers remediation?',
        options: ['Peer mentoring', 'External training', 'Supervised practice'],
        risks: ['Resource allocation needed']
      }
    ],
    tier3_Governance: [
      {
        id: 'cor-ca-003',
        title: 'Competency Management System',
        description: 'Establish systematic competency tracking and development',
        interventionType: 'PREVENTATIVE',
        effort: 'HIGH',
        impact: 'HIGH',
        decisionPoint: 'What system scope?',
        options: ['Role-based', 'Task-based', 'Protocol-based'],
        risks: ['System development investment']
      }
    ],
    decisionSafeStatement: 'The following options address the Competence Assumption Failure pattern. Selection should be based on your specific context, resources, and risk tolerance.'
  },
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * FAILURE TYPE 6: Protocol Drift Erosion
 */
const PROTOCOL_DRIFT_EROSION: FailureType = {
  id: 'ft-protocol-drift-001',
  name: 'Protocol Drift Erosion',
  definition: 'A failure pattern where protocol adherence gradually erodes over time through small, cumulative accommodations. Individual deviations appear minor but collectively represent significant departure from protocol intent.',
  patternSignatures: ['DEVIATION_ABSORPTION', 'PROCESS_EROSION', 'OVERSIGHT_GAP'],
  contributingFactors: [
    'Practical constraints accommodation',
    'Cumulative workaround adoption',
    'Protocol design-reality gap',
    'Feedback loop absence'
  ],
  systemLayer: 'SITE',
  severityLevel: 'HIGH',
  frequencyScore: 0.68,
  emergenceVelocity: 'RECURRING',
  linkedSeeds: [],
  correctionPathways: {
    tier1_Design: [
      {
        id: 'cor-pd-001',
        title: 'Protocol Fidelity Monitoring',
        description: 'Implement ongoing protocol fidelity assessment',
        interventionType: 'PREVENTATIVE',
        effort: 'MEDIUM',
        impact: 'HIGH',
        decisionPoint: 'What monitoring frequency?',
        options: ['Continuous', 'Milestone-based', 'Risk-triggered'],
        risks: ['Monitoring overhead']
      }
    ],
    tier2_Execution: [
      {
        id: 'cor-pd-002',
        title: 'Drift Correction Protocol',
        description: 'Create process for detecting and correcting drift',
        interventionType: 'CORRECTIVE',
        effort: 'LOW',
        impact: 'MEDIUM',
        decisionPoint: 'What correction authority?',
        options: ['Site-level', 'Sponsor notification', 'Protocol amendment'],
        risks: ['May require formal changes']
      }
    ],
    tier3_Governance: [
      {
        id: 'cor-pd-003',
        title: 'Protocol Design Feedback Loop',
        description: 'Establish systematic feedback from operations to protocol design',
        interventionType: 'PREVENTATIVE',
        effort: 'HIGH',
        impact: 'HIGH',
        decisionPoint: 'What feedback mechanism?',
        options: ['Retrospective review', 'Real-time capture', 'Periodic assessment'],
        risks: ['Requires cross-functional coordination']
      }
    ],
    decisionSafeStatement: 'The following options address the Protocol Drift Erosion pattern. Selection should be based on your specific context, resources, and risk tolerance.'
  },
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * FAILURE TYPE 7: Communication Cascade Collapse
 */
const COMMUNICATION_CASCADE_COLLAPSE: FailureType = {
  id: 'ft-comm-cascade-001',
  name: 'Communication Cascade Collapse',
  definition: 'A failure pattern where critical information fails to propagate through the stakeholder chain. Information is captured at one point but does not reach decision-makers or actors who need it.',
  patternSignatures: ['COMMUNICATION_BREAKDOWN', 'OVERSIGHT_GAP', 'INFORMATION_ASYMMETRY'],
  contributingFactors: [
    'Unclear communication ownership',
    'Handoff point failures',
    'Information overload filtering',
    'Channel fragmentation'
  ],
  systemLayer: 'CRO',
  severityLevel: 'HIGH',
  frequencyScore: 0.62,
  emergenceVelocity: 'SUDDEN',
  linkedSeeds: [],
  correctionPathways: {
    tier1_Design: [
      {
        id: 'cor-cc-001',
        title: 'Communication Chain Mapping',
        description: 'Map and verify critical communication pathways',
        interventionType: 'PREVENTATIVE',
        effort: 'MEDIUM',
        impact: 'HIGH',
        decisionPoint: 'What pathway scope?',
        options: ['Safety-critical only', 'All study communications', 'Risk-based selection'],
        risks: ['Mapping complexity for large studies']
      }
    ],
    tier2_Execution: [
      {
        id: 'cor-cc-002',
        title: 'Communication Confirmation Protocol',
        description: 'Add confirmation requirements for critical communications',
        interventionType: 'CORRECTIVE',
        effort: 'LOW',
        impact: 'MEDIUM',
        decisionPoint: 'What confirmation method?',
        options: ['Read receipt', 'Explicit acknowledgment', 'Secondary verification'],
        risks: ['May slow time-sensitive communications']
      }
    ],
    tier3_Governance: [
      {
        id: 'cor-cc-003',
        title: 'Communication Accountability Framework',
        description: 'Define communication ownership and accountability',
        interventionType: 'PREVENTATIVE',
        effort: 'HIGH',
        impact: 'HIGH',
        decisionPoint: 'What accountability model?',
        options: ['Role-based', 'Process-based', 'Hybrid'],
        risks: ['Role clarity essential']
      }
    ],
    decisionSafeStatement: 'The following options address the Communication Cascade Collapse pattern. Selection should be based on your specific context, resources, and risk tolerance.'
  },
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * FAILURE TYPE 8: Safety Signal Silence
 */
const SAFETY_SIGNAL_SILENCE: FailureType = {
  id: 'ft-safety-silence-001',
  name: 'Safety Signal Silence',
  definition: 'A failure pattern where safety signals emerge but fail to trigger appropriate response due to normalization, attribution ambiguity, or threshold gaming. Signals exist but remain unacted upon.',
  patternSignatures: ['SAFETY_SIGNAL_GAP', 'OVERSIGHT_GAP', 'ESCALATION_FAILURE'],
  contributingFactors: [
    'Signal normalization over time',
    'Attribution uncertainty',
    'Threshold rigidity',
    'Response cost concerns'
  ],
  systemLayer: 'SPONSOR',
  severityLevel: 'CRITICAL',
  frequencyScore: 0.45,
  emergenceVelocity: 'GRADUAL',
  linkedSeeds: [],
  correctionPathways: {
    tier1_Design: [
      {
        id: 'cor-ss-001',
        title: 'Signal Sensitivity Calibration',
        description: 'Review and calibrate signal detection thresholds',
        interventionType: 'PREVENTATIVE',
        effort: 'MEDIUM',
        impact: 'HIGH',
        decisionPoint: 'What sensitivity level?',
        options: ['Current standard', 'Increased sensitivity', 'Adaptive thresholds'],
        risks: ['May increase signal noise']
      }
    ],
    tier2_Execution: [
      {
        id: 'cor-ss-002',
        title: 'Signal Response Audit',
        description: 'Audit recent signal detection and response patterns',
        interventionType: 'CORRECTIVE',
        effort: 'MEDIUM',
        impact: 'HIGH',
        decisionPoint: 'What audit scope?',
        options: ['Last 30 days', 'Study-to-date', 'Program-level'],
        risks: ['May reveal previously missed signals']
      }
    ],
    tier3_Governance: [
      {
        id: 'cor-ss-003',
        title: 'Safety Governance Enhancement',
        description: 'Strengthen safety signal governance and accountability',
        interventionType: 'PREVENTATIVE',
        effort: 'HIGH',
        impact: 'HIGH',
        decisionPoint: 'What governance enhancement?',
        options: ['Independent review', 'Committee restructuring', 'Threshold policy review'],
        risks: ['Regulatory implications']
      }
    ],
    decisionSafeStatement: 'The following options address the Safety Signal Silence pattern. Selection should be based on your specific context, resources, and risk tolerance.'
  },
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * FAILURE TYPE 9: Timeline Compression Distortion
 */
const TIMELINE_COMPRESSION_DISTORTION: FailureType = {
  id: 'ft-timeline-distortion-001',
  name: 'Timeline Compression Distortion',
  definition: 'A failure pattern where timeline pressures distort operational decisions, leading to quality compromises, skipped steps, or inadequate review periods. Time pressure becomes the primary decision driver.',
  patternSignatures: ['TIMELINE_PRESSURE', 'QUALITY_COMPROMISE', 'PROCESS_SKIPPING'],
  contributingFactors: [
    'Aggressive enrollment targets',
    'Milestone pressure from sponsors',
    'Competitive enrollment dynamics',
    'Resource-timeline mismatch'
  ],
  systemLayer: 'SPONSOR',
  severityLevel: 'MEDIUM',
  frequencyScore: 0.75,
  emergenceVelocity: 'RECURRING',
  linkedSeeds: [],
  correctionPathways: {
    tier1_Design: [
      {
        id: 'cor-tc-001',
        title: 'Timeline Buffer Integration',
        description: 'Build realistic buffers into timeline planning',
        interventionType: 'PREVENTATIVE',
        effort: 'LOW',
        impact: 'MEDIUM',
        decisionPoint: 'What buffer allocation?',
        options: ['Fixed percentage', 'Risk-based', 'Milestone-specific'],
        risks: ['May extend overall timeline']
      }
    ],
    tier2_Execution: [
      {
        id: 'cor-tc-002',
        title: 'Quality Gate Reinforcement',
        description: 'Strengthen quality gates that resist timeline pressure',
        interventionType: 'CORRECTIVE',
        effort: 'MEDIUM',
        impact: 'HIGH',
        decisionPoint: 'What gate reinforcement?',
        options: ['Authority clarification', 'Visibility enhancement', 'Escalation pathway'],
        risks: ['May create schedule friction']
      }
    ],
    tier3_Governance: [
      {
        id: 'cor-tc-003',
        title: 'Timeline-Quality Balance Policy',
        description: 'Establish clear policy on timeline vs. quality trade-offs',
        interventionType: 'PREVENTATIVE',
        effort: 'HIGH',
        impact: 'HIGH',
        decisionPoint: 'What policy scope?',
        options: ['Study-level', 'Program-level', 'Organization-wide'],
        risks: ['Requires leadership commitment']
      }
    ],
    decisionSafeStatement: 'The following options address the Timeline Compression Distortion pattern. Selection should be based on your specific context, resources, and risk tolerance.'
  },
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * FAILURE TYPE 10: Resource Mirage
 */
const RESOURCE_MIRAGE: FailureType = {
  id: 'ft-resource-mirage-001',
  name: 'Resource Mirage',
  definition: 'A failure pattern where resource allocation appears adequate on paper but is insufficient for actual operational demands. Resources are allocated but not available when and where needed.',
  patternSignatures: ['RESOURCE_GAP', 'CAPACITY_MISMATCH', 'ALLOCATION_FAILURE'],
  contributingFactors: [
    'Resource planning vs. reality gap',
    'Competing study demands',
    'Turnover and vacancy impacts',
    'Skill-specific shortages'
  ],
  systemLayer: 'SITE',
  severityLevel: 'MEDIUM',
  frequencyScore: 0.69,
  emergenceVelocity: 'GRADUAL',
  linkedSeeds: [],
  correctionPathways: {
    tier1_Design: [
      {
        id: 'cor-rm-001',
        title: 'Resource Reality Verification',
        description: 'Add verification of actual resource availability',
        interventionType: 'PREVENTATIVE',
        effort: 'LOW',
        impact: 'MEDIUM',
        decisionPoint: 'What verification method?',
        options: ['Capacity assessment', 'Skill inventory', 'Availability calendar'],
        risks: ['Additional planning overhead']
      }
    ],
    tier2_Execution: [
      {
        id: 'cor-rm-002',
        title: 'Resource Contingency Activation',
        description: 'Activate contingency resources when gaps identified',
        interventionType: 'CORRECTIVE',
        effort: 'MEDIUM',
        impact: 'HIGH',
        decisionPoint: 'What contingency type?',
        options: ['Staff augmentation', 'Task redistribution', 'Timeline adjustment'],
        risks: ['May require budget flexibility']
      }
    ],
    tier3_Governance: [
      {
        id: 'cor-rm-003',
        title: 'Resource Planning Governance',
        description: 'Establish resource planning standards and oversight',
        interventionType: 'PREVENTATIVE',
        effort: 'HIGH',
        impact: 'HIGH',
        decisionPoint: 'What governance scope?',
        options: ['Site-level', 'Network-level', 'Portfolio-level'],
        risks: ['Requires resource planning investment']
      }
    ],
    decisionSafeStatement: 'The following options address the Resource Mirage pattern. Selection should be based on your specific context, resources, and risk tolerance.'
  },
  createdAt: new Date(),
  lastUpdated: new Date()
};

/**
 * All predefined FailureTypes
 */
export const PREDEFINED_FAILURE_TYPES: FailureType[] = [
  CONSENT_ILLUSION,
  DATA_CLEANLINESS_MIRAGE,
  SILENT_DEVIATION_ABSORPTION,
  OVERSIGHT_MIRAGE,
  COMPETENCE_ASSUMPTION_FAILURE,
  PROTOCOL_DRIFT_EROSION,
  COMMUNICATION_CASCADE_COLLAPSE,
  SAFETY_SIGNAL_SILENCE,
  TIMELINE_COMPRESSION_DISTORTION,
  RESOURCE_MIRAGE
];

/**
 * Get FailureType by ID
 */
export function getFailureTypeById(id: string): FailureType | undefined {
  return PREDEFINED_FAILURE_TYPES.find(ft => ft.id === id);
}

/**
 * Get FailureType by name
 */
export function getFailureTypeByName(name: string): FailureType | undefined {
  return PREDEFINED_FAILURE_TYPES.find(
    ft => ft.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get FailureTypes by system layer
 */
export function getFailureTypesByLayer(layer: string): FailureType[] {
  return PREDEFINED_FAILURE_TYPES.filter(ft => ft.systemLayer === layer);
}

/**
 * Get FailureTypes by severity
 */
export function getFailureTypesBySeverity(severity: string): FailureType[] {
  return PREDEFINED_FAILURE_TYPES.filter(ft => ft.severityLevel === severity);
}

/**
 * Search FailureTypes by pattern signature
 */
export function searchByPatternSignature(signature: string): FailureType[] {
  return PREDEFINED_FAILURE_TYPES.filter(
    ft => ft.patternSignatures.includes(signature)
  );
}

export default PREDEFINED_FAILURE_TYPES;