import { NextResponse } from 'next/server';
import { getCommunicationsService } from '@/lib/communications/CommunicationsService';
import { opportunityDossierAdapter } from '@/lib/OpportunityDossierAdapter';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = getCommunicationsService();
    const convId = `conv-${id}`;
    const conversation = service.store.getConversation(convId);
    const contact = service.store.getContact(`cnt-${id}`);
    const messages = service.store.getMessages(convId);
    const drafts = service.store.getDrafts(convId);
    const activeDraft = drafts.find(d => d.status === 'DRAFT' || d.status === 'PENDING_APPROVAL') || drafts[drafts.length - 1];
    const timeline = await service.timelineAggregator.getTimeline({ conversationId: convId });

    return NextResponse.json({
      success: true,
      opportunityId: id,
      conversation,
      contact,
      messages,
      drafts,
      activeDraft,
      timeline
    });
  } catch (err: any) {
    console.error('[API /api/opportunities/dossiers/[id]/comms GET] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, notes, customText } = body;
    const service = getCommunicationsService();
    const convId = `conv-${id}`;
    const contactId = `cnt-${id}`;

    const conversation = service.store.getConversation(convId);
    const contact = service.store.getContact(contactId);

    if (!conversation || !contact) {
      return NextResponse.json({ 
        success: false, 
        error: `Conversation or contact for opportunity ${id} not found in Communications Control Plane.` 
      }, { status: 404 });
    }

    if (action === 'AUTHORIZE_DISPATCH') {
      const drafts = service.store.getDrafts(convId);
      const draft = drafts.find(d => d.status === 'PENDING_APPROVAL' || d.status === 'DRAFT') || drafts[0];

      if (!draft) {
        return NextResponse.json({ success: false, error: 'No active draft found to authorize.' }, { status: 400 });
      }

      // 1. Authorize draft & issue cryptographic envelope via OutboundAuthorization
      const { approval, envelope } = service.authEngine.authorizeDraft({
        draft,
        conversation,
        operatorId: 'operator_human_command',
        recipientAddress: contact.primaryContact,
        notes: notes || 'Operator approved via Gideon AI HQ Opportunity Studio'
      });

      // 2. Mark draft as APPROVED in store
      await service.draftManager.approveDraft(draft.id, approval.id);
      await service.store.saveApproval(approval);

      // 3. Dispatch to Channel through ChannelDispatcher
      const dispatchResult = await service.dispatcher.dispatch({
        envelope,
        approval,
        draft,
        conversation
      });

      // Update dossier status
      const dossier = opportunityDossierAdapter.getById(id);
      if (dossier && dossier.contact) {
        dossier.contact.communicationIntegration.status = 'DISPATCHED';
        dossier.lifecycle = 'CONTACTED';
      }

      return NextResponse.json({
        success: true,
        action: 'AUTHORIZE_DISPATCH',
        approval,
        envelope,
        dispatchResult,
        status: 'DISPATCHED'
      });
    }

    if (action === 'SIMULATE_INBOUND') {
      const dossier = opportunityDossierAdapter.getById(id);
      const businessName = dossier?.business.name || 'Prospect';
      const decisionMakerName = dossier?.contact?.decisionMaker.name || 'Decision Maker';

      const simulatedText = customText || `Hi Gideon team, this is ${decisionMakerName.split(' ')[0]} from ${businessName}. We received your note and reviewed the interactive prototype. This looks promising. What is the turnaround time to deploy this to our live domain, and can we include SMS notifications?`;

      // Ingest message via MessageIngestor
      const ingestResult = await service.ingestor.ingestInbound({
        conversationId: convId,
        sender: contactId,
        senderAddress: contact.primaryContact,
        rawContent: simulatedText,
        externalMessageId: `ext-sim-${Date.now()}`
      });

      // Classify message
      const classification = service.classifier.classify(simulatedText);
      const acceptanceConfidence = service.acceptanceEvaluator.evaluate(simulatedText);
      const scopeAnalysis = service.scopeAnalyzer.analyze(simulatedText, ['Next.js App', 'Tailwind', 'Stripe']);

      // Auto-generate Atlas draft reply
      const replyBody = `Hi ${decisionMakerName.split(' ')[0]},

Thanks for the prompt response! 

Turnaround for the full ${dossier?.solution.productName || 'solution'} is ${dossier?.economics.estimatedBuildHours || 24} engineering hours. SMS dispatch integration is fully supported via our Twilio capability primitive.

We can stage this immediately upon receipt of the 50% deposit ($${dossier?.economics.depositRequirementUSD.toLocaleString()} USD).

Stripe Secure Deposit: http://localhost:4102/checkout?package=${encodeURIComponent(dossier?.solution.productName || 'Digital Solution')}&amount=${dossier?.economics.proposedPriceUSD || 2400}

Best regards,
Gideon Autonomous Engineering Team`;

      const replyDraft = await service.draftManager.createDraft({
        conversationId: convId,
        inReplyToMessageId: ingestResult.message.id,
        proposedSubject: `Re: ${conversation.subject}`,
        proposedBody: replyBody
      });

      return NextResponse.json({
        success: true,
        action: 'SIMULATE_INBOUND',
        inboundMessage: ingestResult.message,
        classification,
        acceptanceConfidence,
        scopeAnalysis,
        generatedReplyDraft: replyDraft
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('[API /api/opportunities/dossiers/[id]/comms POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
