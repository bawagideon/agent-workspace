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

    const contact = service.store.getContact(conversation.contactId);
    const messages = service.store.getMessages(id);
    const drafts = service.store.getDrafts(id);
    const activeDraft = drafts.find(d => d.status === 'DRAFT' || d.status === 'PENDING_APPROVAL');

    return NextResponse.json({
      success: true,
      conversation,
      contact,
      messages,
      drafts,
      activeDraft
    });
  } catch (err: any) {
    console.error('[API /api/communications/[id] GET] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
