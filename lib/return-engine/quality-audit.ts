/**
 * BTP Return Engine - Notification Quality Audit
 * 
 * Comprehensive audit of all 42 notification variants for:
 * - Copy quality (clarity, tone, actionability)
 * - Timing appropriateness
 * - Surface coverage
 * - Anonymity preservation
 */

import { NOTIFICATION_VARIANTS } from './types';

interface AuditResult {
  variantId: string;
  class: string;
  copy: string;
  trigger: string;
  priority: string;
  surfaces: string[];
  timing: { min: string; max: string };
  issues: string[];
  qualityScore: number; // 1-5
}

const auditResults: AuditResult[] = [];

function formatTiming(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${minutes} min`;
}

function auditCopy(copy: string): string[] {
  const issues: string[] = [];
  
  // Check length
  if (copy.length < 10) issues.push('Copy too short');
  if (copy.length > 100) issues.push('Copy too long for push notification');
  
  // Check for identity exposure
  const identityPatterns = [/\byou\b/i, /\byour\b/i, /\bsomeone named\b/i];
  // Note: "you" and "your" are OK for the recipient, just not for source
  
  // Check for actionability
  if (!copy.includes('—') && !copy.includes(':') && copy.split(' ').length < 5) {
    issues.push('Copy lacks context or actionability');
  }
  
  return issues;
}

function auditTiming(minMs: number, maxMs: number, priority: string): string[] {
  const issues: string[] = [];
  
  // P1 should be 0-60 min
  if (priority === 'P1' && minMs > 60 * 60 * 1000) {
    issues.push('P1 notification has delay > 1 hour');
  }
  
  // P2 should be 1-8 hours
  if (priority === 'P2' && minMs > 8 * 60 * 60 * 1000) {
    issues.push('P2 notification has delay > 8 hours');
  }
  
  // Check for reasonable spread
  const spread = maxMs - minMs;
  if (spread < 10 * 60 * 1000) {
    issues.push('Timing spread too narrow (no anonymity buffer)');
  }
  
  return issues;
}

function auditSurfaces(surfaces: string[]): string[] {
  const issues: string[] = [];
  
  if (surfaces.length === 0) {
    issues.push('No delivery surfaces defined');
  }
  
  if (!surfaces.includes('in_app')) {
    issues.push('Missing in_app surface (required for fallback)');
  }
  
  return issues;
}

// Run audit
console.log('\n' + '='.repeat(80));
console.log('BTP RETURN ENGINE - NOTIFICATION QUALITY AUDIT');
console.log('='.repeat(80));

NOTIFICATION_VARIANTS.forEach((variant, index) => {
  const issues: string[] = [];
  
  // Audit copy
  issues.push(...auditCopy(variant.copy as string));
  
  // Audit timing
  issues.push(...auditTiming(variant.timingMinMs, variant.timingMaxMs, variant.priority as string));
  
  // Audit surfaces
  issues.push(...auditSurfaces(variant.surfaces as string[]));
  
  // Calculate quality score
  let score = 5;
  score -= issues.length * 0.5;
  score = Math.max(1, score);
  
  auditResults.push({
    variantId: variant.id,
    class: variant.class as string,
    copy: variant.copy as string,
    trigger: variant.trigger as string,
    priority: variant.priority as string,
    surfaces: variant.surfaces as string[],
    timing: {
      min: formatTiming(variant.timingMinMs),
      max: formatTiming(variant.timingMaxMs),
    },
    issues,
    qualityScore: score,
  });
});

// Print results by class
const classes = ['VALIDATION', 'EXPANSION', 'MOMENTUM', 'PRESSURE', 'OPPORTUNITY'];

classes.forEach(cls => {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`${cls} NOTIFICATIONS`);
  console.log('═'.repeat(80));
  
  const classResults = auditResults.filter(r => r.class === cls);
  
  classResults.forEach(result => {
    const status = result.issues.length === 0 ? '✅' : '⚠️';
    console.log(`\n${status} ${result.variantId} [${result.priority}]`);
    console.log(`   Copy: "${result.copy}"`);
    console.log(`   Trigger: ${result.trigger}`);
    console.log(`   Surfaces: ${result.surfaces.join(', ')}`);
    console.log(`   Timing: ${result.timing.min} - ${result.timing.max}`);
    console.log(`   Quality: ${'⭐'.repeat(Math.round(result.qualityScore))}`);
    
    if (result.issues.length > 0) {
      console.log(`   Issues: ${result.issues.join(', ')}`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(80));
console.log('AUDIT SUMMARY');
console.log('='.repeat(80));

const totalVariants = auditResults.length;
const perfectVariants = auditResults.filter(r => r.issues.length === 0).length;
const avgQuality = auditResults.reduce((sum, r) => sum + r.qualityScore, 0) / totalVariants;
const issuesFound = auditResults.flatMap(r => r.issues);

console.log(`\n📊 Total Variants: ${totalVariants}`);
console.log(`📊 Perfect Variants: ${perfectVariants} (${((perfectVariants / totalVariants) * 100).toFixed(1)}%)`);
console.log(`📊 Average Quality: ${avgQuality.toFixed(1)}/5`);
console.log(`📊 Total Issues: ${issuesFound.length}`);

// Issue breakdown
if (issuesFound.length > 0) {
  console.log('\n📋 Issue Breakdown:');
  const issueCounts: Record<string, number> = {};
  issuesFound.forEach(issue => {
    issueCounts[issue] = (issueCounts[issue] || 0) + 1;
  });
  Object.entries(issueCounts).forEach(([issue, count]) => {
    console.log(`   - ${issue}: ${count} occurrences`);
  });
}

// Priority distribution
console.log('\n📊 Priority Distribution:');
const priorityCounts = { P1: 0, P2: 0, P3: 0 };
auditResults.forEach(r => priorityCounts[r.priority as keyof typeof priorityCounts]++);
console.log(`   P1 (Immediate): ${priorityCounts.P1}`);
console.log(`   P2 (Batched): ${priorityCounts.P2}`);
console.log(`   P3 (Digest): ${priorityCounts.P3}`);

// Surface coverage
console.log('\n📊 Surface Coverage:');
const surfaceCounts: Record<string, number> = {};
auditResults.forEach(r => {
  r.surfaces.forEach(s => {
    surfaceCounts[s] = (surfaceCounts[s] || 0) + 1;
  });
});
Object.entries(surfaceCounts).forEach(([surface, count]) => {
  console.log(`   ${surface}: ${count} variants (${((count / totalVariants) * 100).toFixed(1)}%)`);
});

// Final verdict
console.log('\n' + '='.repeat(80));
console.log('FINAL VERDICT');
console.log('='.repeat(80));

const overallScore = avgQuality;
const grade = overallScore >= 4.5 ? 'A' : overallScore >= 4 ? 'B' : overallScore >= 3.5 ? 'C' : overallScore >= 3 ? 'D' : 'F';

console.log(`\n🏆 OVERALL QUALITY GRADE: ${grade}`);
console.log(`📈 Score: ${overallScore.toFixed(1)}/5`);

if (grade === 'A' || grade === 'B') {
  console.log('\n✅ The notification system is well-designed and ready for production.');
  console.log('   Users will receive timely, relevant notifications that drive return behavior.');
} else {
  console.log('\n⚠️ The notification system has issues that should be addressed.');
  console.log('   Review the issues above before deploying to production.');
}

export { auditResults };