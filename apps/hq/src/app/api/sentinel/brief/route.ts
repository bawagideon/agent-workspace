import { NextResponse } from 'next/server';
import { SentinelObserver } from '@gideon/runtime';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const brief = SentinelObserver.generateDailyBrief();
    return NextResponse.json({
      success: true,
      brief
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { findingId, operatorNotes } = body;

    if (!findingId || !operatorNotes) {
      return NextResponse.json(
        { success: false, error: 'findingId and operatorNotes are required.' },
        { status: 400 }
      );
    }

    const result = SentinelObserver.challengeFinding(findingId, operatorNotes);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
