import { NextResponse } from 'next/server';
import { getCommunicationsService } from '@/lib/communications/CommunicationsService';

export async function GET(req: Request) {
  try {
    const service = getCommunicationsService();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;
    const opportunityId = searchParams.get('opportunityId') || undefined;

    const conversations = service.store.listConversations({ projectId, opportunityId });
    const contacts = conversations.map(c => service.store.getContact(c.contactId)).filter(Boolean);

    return NextResponse.json({
      success: true,
      conversations,
      contacts
    });
  } catch (err: any) {
    console.error('[API /api/communications GET] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const service = getCommunicationsService();

    // Check if this is an inbound message ingestion or conversation creation
    if (body.action === 'ingest') {
      const { conversationId, senderId, senderAddress, rawContent, externalMessageId, channelMetadata } = body;
      if (!conversationId || !senderAddress || rawContent === undefined) {
        return NextResponse.json({ success: false, error: 'Missing conversationId, senderAddress, or rawContent' }, { status: 400 });
      }

      const result = await service.ingestor.ingestInbound({
        conversationId,
        sender: senderId || body.sender,
        senderAddress,
        rawContent,
        externalMessageId,
        channelMetadata
      });

      return NextResponse.json({
        success: true,
        message: result.message,
        conversation: result.conversation,
        senderStatus: result.senderStatus
      });
    }

    // Default: create contact and conversation
    const { contact, conversation } = body;
    if (!contact || !contact.primaryContact) {
      return NextResponse.json({ success: false, error: 'Valid contact details required' }, { status: 400 });
    }

    let contactRecord = service.store.getContactByPrimary(contact.primaryContact);
    if (!contactRecord) {
      contactRecord = {
        id: contact.id || `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clientId: contact.clientId || 'client_default',
        name: contact.name || contact.displayName || contact.primaryContact,
        primaryContact: contact.primaryContact,
        verifiedChannels: contact.verifiedChannels || ['EMAIL'],
        isVerified: !!contact.isVerified,
        metadata: {
          organization: contact.organization,
          channels: contact.channels,
          associatedProjectIds: contact.associatedProjectIds || [],
          associatedOpportunityIds: contact.associatedOpportunityIds || [],
          notes: contact.notes,
          ...contact.metadata
        },
        createdAt: new Date().toISOString()
      };
      await service.store.saveContact(contactRecord);
    }

    const convRecord = await service.store.createConversation({
      opportunityId: conversation?.opportunityId,
      projectId: conversation?.projectId,
      contactId: contactRecord.id,
      channel: conversation?.channel || 'EMAIL',
      externalThreadId: conversation?.externalThreadId || `th_${Date.now()}`,
      subject: conversation?.subject || 'Client Communication',
      stage: conversation?.stage || 'PROSPECTING'
    });

    return NextResponse.json({
      success: true,
      contact: contactRecord,
      conversation: convRecord
    });
  } catch (err: any) {
    console.error('[API /api/communications POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
