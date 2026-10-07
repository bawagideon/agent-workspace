import { NextResponse } from 'next/server';
import { getCommunicationsService } from '@/lib/communications/CommunicationsService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { draftId, operatorId, notes } = body;
    const service = getCommunicationsService();

    if (!draftId || !operatorId) {
      return NextResponse.json({ success: false, error: 'draftId and operatorId required' }, { status: 400 });
    }

    const conversation = service.store.getConversation(id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    const contact = service.store.getContact(conversation.contactId);
    if (!contact) {
      return NextResponse.json({ success: false, error: 'Contact not found' }, { status: 404 });
    }

    const draft = service.store.getDraft(draftId);
    if (!draft) {
      return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
    }

    // 1. Authorize draft & issue cryptographic envelope
    const { approval, envelope } = service.authEngine.authorizeDraft({
      draft,
      conversation,
      operatorId,
      recipientAddress: contact.primaryContact,
      notes
    });

    // 2. Mark draft as APPROVED in store
    await service.draftManager.approveDraft(draft.id, approval.id);
    await service.store.saveApproval(approval);

    // 3. Dispatch to Channel
    const dispatchResult = await service.dispatcher.dispatch({
      envelope,
      approval,
      draft,
      conversation
    });

    return NextResponse.json({
      success: true,
      approval,
      envelope,
      dispatchResult
    });
  } catch (err: any) {
    console.error('[API /api/communications/[id]/approve POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
