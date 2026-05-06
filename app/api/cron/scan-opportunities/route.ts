/**
 * Cron endpoint for aggressive micro-opportunity scanning
 * 
 * Called periodically (e.g., every 6 hours) to scan for patterns
 * that have reached critical mass and should retroactively trigger
 * micro-opportunities.
 * 
 * Security: Requires CRON_SECRET header to prevent unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanForAggressiveTriggers } from '@/lib/micro-opportunity';

export async function POST(request: NextRequest) {
  // Verify cron secret
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await scanForAggressiveTriggers();
    
    return NextResponse.json({
      success: true,
      triggered: result.triggered,
      details: result.details,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cron scan-opportunities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}