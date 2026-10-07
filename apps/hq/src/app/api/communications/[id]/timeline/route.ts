import { NextResponse } from 'next/server';
import { getCommunicationsService } from '@/lib/communications/CommunicationsService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = getCommunicationsService();
    const conversation = service.store.getConversation(id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const timeline = await service.timelineAggregator.getDealTimeline({
      conversationId: id,
      projectId: conversation.projectId,
      opportunityId: conversation.opportunityId
    });

    return NextResponse.json({
      success: true,
      timeline
    });
  } catch (err: any) {
    console.error('[API /api/communications/[id]/timeline GET] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
