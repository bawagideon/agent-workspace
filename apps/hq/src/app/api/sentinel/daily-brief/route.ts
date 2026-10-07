import { NextResponse } from 'next/server';
import { opportunityIntelligenceEngine } from '@gideon/runtime';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const brief = opportunityIntelligenceEngine.generateSentinelDailyBrief();
    return NextResponse.json({
      success: true,
      brief
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
