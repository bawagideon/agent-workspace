import { NextResponse } from 'next/server';
import { getCommunicationsService } from '@/lib/communications/CommunicationsService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const service = getCommunicationsService();

    const conversation = service.store.getConversation(id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
    }

    // Atlas Classification and Pricing analysis if requested
    let pricingRecommendation = undefined;
    let classification = undefined;
    let confidence = undefined;

    if (body.inboundMessageId) {
      const inboundMsg = service.store.getMessage(body.inboundMessageId);
      if (inboundMsg) {
        classification = service.classifier.classify(inboundMsg.sanitizedContent);
        confidence = service.acceptanceEvaluator.evaluate(inboundMsg.sanitizedContent);

        if (classification.category === 'CHANGE_REQUEST') {
          const scope = service.scopeAnalyzer.analyze(inboundMsg.sanitizedContent);
          pricingRecommendation = service.pricingEngine.calculateScopeDelta({
            originalPricingCents: 50000,
            requestedItems: scope.identifiedFeatures
          });
        }
      }
    }

    // Create or update draft
    const draft = await service.draftManager.createDraft({
      conversationId: id,
      inReplyToMessageId: body.inboundMessageId,
      proposedSubject: body.proposedSubject || `Re: ${conversation.subject}`,
      proposedBody: body.proposedBody,
      metadata: {
        classification,
        confidence,
        pricingRecommendation
      }
    });

    return NextResponse.json({
      success: true,
      draft,
      classification,
      confidence,
      pricingRecommendation
    });
  } catch (err: any) {
    console.error('[API /api/communications/[id]/draft POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
