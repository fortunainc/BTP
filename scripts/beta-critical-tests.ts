/**
 * Focused, database-free checks for the invite-only beta's critical behavior.
 *
 * Keep this suite fast and deterministic so it can run before every build.
 */

import assert from 'node:assert/strict';
import { InputSanitization } from '../lib/input-sanitization';
import {
  redactContent,
  validateContent,
} from '../lib/redaction';
import {
  buildInteractionSummary,
  bucketCount,
  normalizeInteractionType,
} from '../lib/operator-return-loop';

function testQuestionAndAnswerSummary() {
  const summary = buildInteractionSummary([
    {
      interactionType: 'ANSWER',
      context: 'A practical, experience-based answer.',
      displayStatus: 'VISIBLE',
    },
    {
      interactionType: 'GOT_WORSE_LATER',
      context: 'A privacy-safe downstream risk signal.',
      displayStatus: 'VISIBLE',
    },
    {
      interactionType: 'SEEN_THIS',
      context: 'Moderated content must not affect the member summary.',
      displayStatus: 'SUPPRESSED',
    },
    {
      interactionType: 'WORKED_FOR_US',
      context: 'Pending review must not leak into member-facing signals.',
      displayStatus: 'PENDING_REVIEW',
    },
  ]);

  assert.equal(summary.hasInteractions, true);
  assert.equal(summary.updatedReflectionAvailable, true);
  assert.deepEqual(summary.interactionTypesPresent, ['ANSWER', 'GOT_WORSE_LATER']);
  assert(summary.userSafeSummaries.includes('Verified operators have answered this question'));
  assert(summary.userSafeSummaries.includes('This may get worse if it is left alone'));
  assert.equal(summary.userSafeSummaries.some((text) => /Moderated content/.test(text)), false);
}

function testInteractionTaxonomyAndCountPrivacy() {
  assert.equal(normalizeInteractionType('ANSWER'), 'ANSWER');
  assert.equal(normalizeInteractionType('SEEN_TOO'), 'SEEN_THIS');
  assert.equal(normalizeInteractionType('UNSTRUCTURED_REPLY'), null);

  assert.equal(bucketCount(0), null);
  assert.equal(bucketCount(1), 'a few');
  assert.equal(bucketCount(4), 'a few');
  assert.equal(bucketCount(5), 'several');
  assert.equal(bucketCount(11), 'several');
  assert.equal(bucketCount(12), 'many');
  assert.equal(bucketCount(29), 'many');
  assert.equal(bucketCount(30), 'showing up repeatedly');
}

function testSensitiveContentRedaction() {
  const redacted = redactContent(
    'Email jane.doe@example.com or call (415) 555-0199 about NCT12345678 at Pfizer for PROTOCOL-1234.'
  );

  assert.equal(redacted.includes('jane.doe@example.com'), false);
  assert.equal(redacted.includes('(415) 555-0199'), false);
  assert.equal(redacted.includes('NCT12345678'), false);
  assert.equal(redacted.toLowerCase().includes('pfizer'), false);
  assert.equal(redacted.includes('PROTOCOL-1234'), false);
  assert.match(redacted, /\[EMAIL\]/);
  assert.match(redacted, /\[PHONE\]/);
  assert.match(redacted, /\[NCT\]/);
  assert.match(redacted, /\[SPONSOR\]/);
  assert.match(redacted, /\[PROTOCOL\]/);

  assert.deepEqual(validateContent('A normal operational question.'), {
    isValid: true,
    errors: [],
  });
}

function testInputSanitization() {
  const dirty = '<script>alert(1)</script><p onclick="steal()">Useful answer</p>';
  const sanitized = InputSanitization.sanitizeHTML(dirty);

  assert.equal(/script/i.test(sanitized), false);
  assert.equal(/onclick/i.test(sanitized), false);
  assert.match(sanitized, /Useful answer/);
  assert.equal(InputSanitization.isValidURL('https://example.com/help'), true);
  assert.equal(InputSanitization.isValidURL('javascript:alert(1)'), false);
}

testQuestionAndAnswerSummary();
testInteractionTaxonomyAndCountPrivacy();
testSensitiveContentRedaction();
testInputSanitization();

console.log('beta-critical tests: passed');
