'use client';

import { useState } from 'react';
import { CheckCircle, ArrowRight, Eye, Users, TrendingUp, Lightbulb } from 'lucide-react';

// ==========================================
// DEMO STEPS
// ==========================================

const DEMO_STEPS = [
  {
    id: 1,
    title: 'Situation Posted',
    description: 'A CRC shares a real situation from their site',
    example: {
      title: 'Protocol amendments killing enrollment momentum',
      detail: 'We had strong enrollment going, then three protocol amendments in two months. Sites are confused, patients are dropping.'
    },
    icon: '📝'
  },
  {
    id: 2,
    title: 'Others Validate',
    description: 'Other operators confirm they\'ve seen the same thing',
    example: {
      validations: [
        { type: 'SEEN_THIS', text: 'Yep, seen this exact thing.' },
        { type: 'SEEN_THIS', text: 'This is happening at our site too.' },
        { type: 'DIFFERENT_CAUSE', text: 'For us it was the CRO driving it.' }
      ]
    },
    icon: '✓'
  },
  {
    id: 3,
    title: 'Pattern Forms',
    description: 'Multiple similar situations cluster into a pattern',
    example: {
      pattern: 'Enrollment Challenges Keep Appearing',
      meta: 'Appearing in Oncology, Cardiology, Neurology'
    },
    icon: '📊'
  },
  {
    id: 4,
    title: 'Insight Appears',
    description: 'The system generates a grounded insight',
    example: {
      insight: 'This pattern is likely to impact enrollment timelines'
    },
    icon: '💡'
  },
  {
    id: 5,
    title: 'Matching Appears',
    description: 'Find operators who have dealt with this before',
    example: {
      matches: [
        { code: 'CAP-7291', summary: 'Worked on similar Phase 3 oncology trials' },
        { code: 'CAP-3847', summary: 'Resolved enrollment-related issues' }
      ]
    },
    icon: '🔗'
  }
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const nextStep = () => {
    if (currentStep < DEMO_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const playDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= DEMO_STEPS.length - 1) {
          clearInterval(interval);
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">How BTP Works</h1>
          <p className="text-slate-400 mb-6">
            See the full flow from situation to solution in under 60 seconds
          </p>
          
          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={playDemo}
              disabled={isPlaying}
              className="px-6 py-2 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 disabled:opacity-50"
            >
              {isPlaying ? 'Playing...' : 'Play Demo'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 px-4">
          {DEMO_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                  index <= currentStep
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {index < currentStep ? <CheckCircle className="w-5 h-5" /> : step.icon}
              </div>
              {index < DEMO_STEPS.length - 1 && (
                <div
                  className={`w-16 h-1 mx-2 rounded transition-all ${
                    index < currentStep ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Current Step */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{DEMO_STEPS[currentStep].icon}</span>
            <h2 className="text-xl font-bold">
              Step {DEMO_STEPS[currentStep].id}: {DEMO_STEPS[currentStep].title}
            </h2>
          </div>
          
          <p className="text-slate-400 mb-6">{DEMO_STEPS[currentStep].description}</p>

          {/* Example Content */}
          <div className="bg-slate-800/50 rounded-lg p-6">
            {renderExample(DEMO_STEPS[currentStep])}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={nextStep}
            disabled={currentStep === DEMO_STEPS.length - 1}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Success Message */}
        {currentStep === DEMO_STEPS.length - 1 && (
          <div className="mt-8 bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-400 mb-2">
              This system actually works end-to-end
            </h3>
            <p className="text-slate-400">
              Real situations → Patterns → Insights → People who can help
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// RENDER EXAMPLE
// ==========================================

function renderExample(step: typeof DEMO_STEPS[0]) {
  const example = step.example;

  if ('title' in example) {
    return (
      <div>
        <h4 className="font-semibold text-white mb-2">{example.title}</h4>
        <p className="text-slate-400">{example.detail}</p>
      </div>
    );
  }

  if ('validations' in example && example.validations) {
    return (
      <div className="space-y-3">
        {example.validations.map((v, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-xs ${
              v.type === 'SEEN_THIS' ? 'bg-blue-500/20 text-blue-400' :
              v.type === 'DIFFERENT_CAUSE' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-700 text-slate-400'
            }`}>
              {v.type.replace(/_/g, ' ')}
            </span>
            <span className="text-slate-300">{v.text}</span>
          </div>
        ))}
      </div>
    );
  }

  if ('pattern' in example) {
    return (
      <div>
        <h4 className="font-semibold text-white mb-2">{example.pattern}</h4>
        <p className="text-slate-400">{example.meta}</p>
      </div>
    );
  }

  if ('insight' in example) {
    return (
      <div className="flex items-start gap-3">
        <span className="text-amber-500">⚠️</span>
        <p className="text-slate-300">{example.insight}</p>
      </div>
    );
  }

  if ('matches' in example) {
    return (
      <div className="space-y-3">
        <p className="text-slate-400 text-sm">Who has dealt with this?</p>
        {example.matches.map((m, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-slate-500 font-mono">{m.code}</span>
            <span className="text-slate-300">{m.summary}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}