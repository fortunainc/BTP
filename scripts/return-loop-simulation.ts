/**
 * Deterministic Operator A/B/C Return Loop Simulation
 *
 * This is intentionally database-free. It validates the product mechanics
 * and privacy constraints of the structured return-loop using production
 * taxonomy/copy/summary helpers.
 */

import assert from 'node:assert/strict';
import {
  INTERACTION_COPY,
  OPERATOR_INTERACTION_TYPES,
  buildInteractionSummary,
  bucketCount,
  normalizeInteractionType,
  type OperatorInteractionType,
} from '../lib/operator-return-loop';

type SimulatedInteraction = {
  actor: 'Operator B' | 'Operator C' | 'Founder Seed';
  interactionType: OperatorInteractionType;
  context?: string;
  displayStatus: 'VISIBLE' | 'PENDING_REVIEW' | 'SUPPRESSED' | 'BLOCKED';
};

const FORBIDDEN_PUBLIC_PATTERNS = [
  /\bOperator A\b/i,
  /\bOperator B\b/i,
  /\bOperator C\b/i,
  /\bUSR-/i,
  /\bOPR-/i,
  /\bprofile\b/i,
  /\brepl(?:y|ies)\b/i,
  /\blikes?\b/i,
  /\bvotes?\b/i,
  /\bkarma\b/i,
  /\bfollowers?\b/i,
];

function assertAntiForumText(label: string, text: string) {
  for (const pattern of FORBIDDEN_PUBLIC_PATTERNS) {
    assert.equal(
      pattern.test(text),
      false,
      `${label} leaked forbidden forum/profile language: ${pattern} in "${text}"`
    );
  }
}

function publicReturnCopyForSubmitter() {
  return 'If other operators add relevant context, your reflection may update. We will only show privacy-safe summaries, not names or exact small counts.';
}

function simulate() {
  const timeline: string[] = [];
  const publicTexts: string[] = [];

  // Operator A submits a situation and is explicitly invited back later.
  const postSubmissionCopy = publicReturnCopyForSubmitter();
  timeline.push('A submits situation and sees return-loop copy.');
  publicTexts.push(postSubmissionCopy);
  assert.match(postSubmissionCopy, /reflection may update/i);
  assert.match(postSubmissionCopy, /privacy-safe summaries/i);

  // Legacy normalization must not reintroduce old/freeform forum taxonomy.
  assert.equal(normalizeInteractionType('SEEN_TOO'), 'SEEN_THIS');
  assert.equal(normalizeInteractionType('WORKED'), 'WORKED_FOR_US');
  assert.equal(normalizeInteractionType('UNSTRUCTURED_REPLY'), null);

  // Operator B adds structured context.
  const interactions: SimulatedInteraction[] = [
    {
      actor: 'Operator B',
      interactionType: 'TRIED_SIMILAR',
      context: 'We tried a lighter escalation path and it reduced repeated follow-up.',
      displayStatus: 'VISIBLE',
    },
  ];
  const bCopy = INTERACTION_COPY.TRIED_SIMILAR.notificationCopy;
  timeline.push(`B adds "${INTERACTION_COPY.TRIED_SIMILAR.label}" and A receives privacy-safe notification copy.`);
  publicTexts.push(bCopy);
  assert.equal(INTERACTION_COPY.TRIED_SIMILAR.notificationClass, 'EXPANSION');

  // Operator C adds downstream-risk pressure signal.
  interactions.push({
    actor: 'Operator C',
    interactionType: 'GOT_WORSE_LATER',
    context: 'It looked manageable at first, then created recurring protocol exceptions.',
    displayStatus: 'VISIBLE',
  });
  const cCopy = INTERACTION_COPY.GOT_WORSE_LATER.notificationCopy;
  timeline.push(`C adds "${INTERACTION_COPY.GOT_WORSE_LATER.label}" and A's reflection becomes more urgent.`);
  publicTexts.push(cCopy);
  assert.equal(INTERACTION_COPY.GOT_WORSE_LATER.notificationClass, 'PRESSURE');

  // Founder suppresses a hypothetical unsafe item; it must not affect public summary.
  interactions.push({
    actor: 'Founder Seed',
    interactionType: 'SEEN_THIS',
    context: 'Suppressed item should not affect user-facing summary.',
    displayStatus: 'SUPPRESSED',
  });

  const summary = buildInteractionSummary(interactions);
  timeline.push('Reflection summary rebuilds from visible structured signals only.');

  assert.equal(summary.hasInteractions, true);
  assert.equal(summary.updatedReflectionAvailable, true);
  assert.equal(summary.interactionTypesPresent.includes('TRIED_SIMILAR'), true);
  assert.equal(summary.interactionTypesPresent.includes('GOT_WORSE_LATER'), true);
  assert.equal(summary.interactionTypesPresent.includes('SEEN_THIS'), false);
  assert.equal(summary.maturityLabel, 'early indication');
  assert(summary.userSafeSummaries.some(text => /workarounds/i.test(text)));
  assert(summary.userSafeSummaries.some(text => /worse/i.test(text)));

  for (const text of [...publicTexts, ...summary.userSafeSummaries, summary.maturityLabel]) {
    assertAntiForumText('public return-loop text', text);
  }

  // Count buckets are non-exact at user-facing levels.
  assert.equal(bucketCount(1), 'a few');
  assert.equal(bucketCount(5), 'several');
  assert.equal(bucketCount(12), 'many');
  assert.equal(bucketCount(30), 'showing up repeatedly');

  // Seven structured types remain the only allowed public interaction controls.
  assert.deepEqual(OPERATOR_INTERACTION_TYPES, [
    'SEEN_THIS',
    'TRIED_SIMILAR',
    'WORKED_FOR_US',
    'DIDNT_HOLD_UP',
    'CAUSED_OTHER_ISSUES',
    'GOT_WORSE_LATER',
    'STAYED_MANAGEABLE',
  ]);

  const microOpportunityLinkage = {
    source: 'structured_return_loop',
    publicDescription: 'A related short consult may be available because this pattern is repeating.',
    linkedFromPublicThread: false,
    exposesOperators: false,
  };
  timeline.push('Micro-opportunity linkage is represented as an aggregate opportunity signal, not a public discussion thread.');
  assert.equal(microOpportunityLinkage.linkedFromPublicThread, false);
  assert.equal(microOpportunityLinkage.exposesOperators, false);
  assertAntiForumText('micro-opportunity linkage', microOpportunityLinkage.publicDescription);

  return {
    passed: true,
    scenario: 'Operator A submits → B validates/adds context → C adds downstream risk → A returns to updated reflection → opportunity signal remains aggregate/private.',
    timeline,
    publicSummary: summary,
    notificationCopies: {
      operatorBSignal: bCopy,
      operatorCSignal: cCopy,
    },
    microOpportunityLinkage,
  };
}

const result = simulate();
console.log(JSON.stringify(result, null, 2));