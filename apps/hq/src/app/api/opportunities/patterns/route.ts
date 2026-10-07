import { NextResponse } from 'next/server';
import { opportunityIntelligenceEngine } from '@gideon/runtime';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const patterns = opportunityIntelligenceEngine.loadPatterns();
    return NextResponse.json({
      success: true,
      total: patterns.length,
      patterns
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const patterns = opportunityIntelligenceEngine.detectCrossOpportunityPatterns();
    return NextResponse.json({
      success: true,
      total: patterns.length,
      patterns
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
