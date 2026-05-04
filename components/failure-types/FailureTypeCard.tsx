'use client';

/**
 * FAILURE TYPE CARD COMPONENT
 * 
 * UI component for displaying FailureType information
 * Includes correction pathways display with decision-safe presentation
 */

import React, { useState } from 'react';

// Types
interface CorrectionOption {
  id: string;
  title: string;
  description: string;
  interventionType: 'PREVENTATIVE' | 'CORRECTIVE';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  decisionPoint: string;
  options: string[];
  risks: string[];
}

interface CorrectionPathways {
  tier1_Design: CorrectionOption[];
  tier2_Execution: CorrectionOption[];
  tier3_Governance: CorrectionOption[];
  decisionSafeStatement: string;
}

interface FailureType {
  id: string;
  name: string;
  definition: string;
  patternSignatures: string[];
  contributingFactors: string[];
  systemLayer: 'PATIENT' | 'SITE' | 'CRO' | 'SPONSOR';
  severityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  frequencyScore: number;
  emergenceVelocity: 'SUDDEN' | 'GRADUAL' | 'RECURRING';
  correctionPathways: CorrectionPathways | null;
}

interface Props {
  failureType: FailureType;
  onSelect?: (id: string) => void;
  selected?: boolean;
  compact?: boolean;
}

// Severity colors
const severityColors = {
  LOW: 'bg-blue-100 text-blue-800 border-blue-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200'
};

// Layer colors
const layerColors = {
  PATIENT: 'bg-purple-100 text-purple-800',
  SITE: 'bg-green-100 text-green-800',
  CRO: 'bg-indigo-100 text-indigo-800',
  SPONSOR: 'bg-slate-100 text-slate-800'
};

export default function FailureTypeCard({ 
  failureType, 
  onSelect, 
  selected = false,
  compact = false 
}: Props) {
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    return severityColors[severity as keyof typeof severityColors] || severityColors.MEDIUM;
  };

  const getLayerColor = (layer: string) => {
    return layerColors[layer as keyof typeof layerColors] || layerColors.SITE;
  };

  if (compact) {
    return (
      <div 
        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
          selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
        }`}
        onClick={() => onSelect?.(failureType.id)}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900">{failureType.name}</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(failureType.severityLevel)}`}>
            {failureType.severityLevel}
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{failureType.definition}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs ${getLayerColor(failureType.systemLayer)}`}>
            {failureType.systemLayer}
          </span>
          <span className="text-xs text-gray-500">
            Frequency: {(failureType.frequencyScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{failureType.name}</h2>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(failureType.severityLevel)}`}>
                {failureType.severityLevel} Severity
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLayerColor(failureType.systemLayer)}`}>
                {failureType.systemLayer} Layer
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                {failureType.emergenceVelocity} Emergence
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Frequency Score</div>
            <div className="text-2xl font-bold text-blue-600">
              {(failureType.frequencyScore * 100).toFixed(0)}%
            </div>
          </div>
        </div>
        
        {/* Definition */}
        <p className="text-gray-700 leading-relaxed">{failureType.definition}</p>
      </div>

      {/* Pattern Signatures */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Pattern Signatures</h3>
        <div className="flex flex-wrap gap-2">
          {failureType.patternSignatures.map((sig, i) => (
            <span 
              key={i}
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
            >
              {sig.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Contributing Factors */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Contributing Factors</h3>
        <ul className="space-y-1">
          {failureType.contributingFactors.slice(0, 4).map((factor, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-gray-400 mt-1">•</span>
              {factor}
            </li>
          ))}
        </ul>
      </div>

      {/* Correction Pathways */}
      {failureType.correctionPathways && (
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Correction Pathways</h3>
          
          {/* Decision-safe notice */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Decision-Safe:</strong> {failureType.correctionPathways.decisionSafeStatement}
            </p>
          </div>

          {/* Correction level tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            {[
              { key: 'tier1', label: 'Level 1: Design', options: failureType.correctionPathways.tier1_Design },
              { key: 'tier2', label: 'Level 2: Execution', options: failureType.correctionPathways.tier2_Execution },
              { key: 'tier3', label: 'Level 3: Governance', options: failureType.correctionPathways.tier3_Governance }
            ].map((tier) => (
              <button
                key={tier.key}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  expandedTier === tier.key
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setExpandedTier(expandedTier === tier.key ? null : tier.key)}
              >
                {tier.label}
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {tier.options.length}
                </span>
              </button>
            ))}
          </div>

          {/* Correction level content */}
          {expandedTier && (
            <div className="space-y-4">
              {(
                expandedTier === 'tier1' ? failureType.correctionPathways.tier1_Design :
                expandedTier === 'tier2' ? failureType.correctionPathways.tier2_Execution :
                failureType.correctionPathways.tier3_Governance
              ).map((option) => (
                <CorrectionOptionCard key={option.id} option={option} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">ID: {failureType.id}</span>
        <button
          onClick={() => onSelect?.(failureType.id)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}

/**
 * Correction Option Card Component
 */
function CorrectionOptionCard({ option }: { option: CorrectionOption }) {
  const [showOptions, setShowOptions] = useState(false);

  const getEffortColor = (effort: string) => {
    const colors = {
      LOW: 'text-green-600 bg-green-50',
      MEDIUM: 'text-yellow-600 bg-yellow-50',
      HIGH: 'text-red-600 bg-red-50'
    };
    return colors[effort as keyof typeof colors] || colors.MEDIUM;
  };

  const getImpactColor = (impact: string) => {
    const colors = {
      LOW: 'text-gray-600 bg-gray-50',
      MEDIUM: 'text-blue-600 bg-blue-50',
      HIGH: 'text-purple-600 bg-purple-50'
    };
    return colors[impact as keyof typeof colors] || colors.MEDIUM;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{option.title}</h4>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getEffortColor(option.effort)}`}>
            {option.effort} Effort
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getImpactColor(option.impact)}`}>
            {option.impact} Impact
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{option.description}</p>
      
      {/* Decision Point */}
      <div className="bg-amber-50 border border-amber-100 rounded p-3 mb-3">
        <div className="text-sm font-medium text-amber-800 mb-1">
          Decision Point: {option.decisionPoint}
        </div>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="text-xs text-amber-600 hover:text-amber-700"
        >
          {showOptions ? 'Hide Options' : `Show ${option.options.length} Options`}
        </button>
        {showOptions && (
          <ul className="mt-2 space-y-1">
            {option.options.map((opt, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                {opt}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Risks */}
      {option.risks.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-xs text-gray-500">Risks:</span>
          <span className="text-xs text-gray-600">{option.risks.join(', ')}</span>
        </div>
      )}
      
      {/* Type Badge */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className={`text-xs font-medium ${
          option.interventionType === 'PREVENTATIVE' ? 'text-green-600' : 'text-orange-600'
        }`}>
          {option.interventionType === 'PREVENTATIVE' ? '🛡️ Preventative' : '🔧 Corrective'}
        </span>
      </div>
    </div>
  );
}