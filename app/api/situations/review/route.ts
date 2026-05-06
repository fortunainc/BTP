/**
 * Safe-to-Submit Review Route
 * 
 * TRANSLATION ENGINE: Section 2 — Zero-Friction Input
 * 
 * Flow: User types → hits "Review & Post" → this route runs redaction
 *       → returns sanitized content + redaction count
 *       → user confirms or edits → then POSTs to /api/situations
 * 
 * This route NEVER stores anything. It's a preview-only step.
 * The actual submission happens in POST /api/situations.
 */

import { NextRequest } from 'next/server';
import { withAuth, createApiResponse, createErrorResponse } from '@/lib/api-auth';
import { applyAutomaticRedaction } from '@/lib/anti-correlation';

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();
    const { description, chips } = body as { description?: string; chips?: string[] };

    if (!description || typeof description !== 'string') {
      return createErrorResponse('Description is required', 400);
    }

    if (description.trim().length === 0) {
      return createErrorResponse('Description cannot be empty', 400);
    }

    if (description.length > 5000) {
      return createErrorResponse('Description is too long (max 5000 characters)', 400);
    }

    // Run automatic redaction on the raw text
    const { redactedContent, redactions } = applyAutomaticRedaction(description);

    // Build the sanitized preview — this is what the user sees and confirms
    const redactionCount = redactions.length;
    const redactionTypes = [...new Set(redactions.map(r => r.type))];

    // PII warning — flag if redactions were applied
    const hasPIIRisk = redactionCount > 0;

    return createApiResponse({
      // The sanitized version the user will review (frontend reads data.redactedContent)
      redactedContent,
      
      // How many items were redacted (frontend reads data.redactionsApplied)
      redactionsApplied: redactionCount,
      
      // Types of redactions applied (e.g., 'name', 'email', 'protocol_number')
      redactionTypes,
      
      // Whether there's PII risk
      hasPIIRisk,
      
      // The chips the user selected (passed through for the actual submission)
      chips: chips || [],
      
      // User guidance
      message: redactionCount > 0
        ? `We removed ${redactionCount} detail${redactionCount > 1 ? 's' : ''} that could identify a study, site, sponsor, or patient. Review the sanitized version below.`
        : 'No identifying details detected. Review your submission below.',
      
      // Warning about additional PII
      piiWarning: redactionCount > 2
        ? 'Multiple identifying details were found. Please review carefully before posting.'
        : null
    });

  } catch (error) {
    console.error('Error in review route:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { requireAuth: true });