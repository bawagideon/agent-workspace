import { NextResponse } from 'next/server';
import { chatAdapter } from '@/lib/ChatAdapter';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      const messages = await chatAdapter.getMessages(conversationId);
      return NextResponse.json({ success: true, messages });
    }

    const projectId = searchParams.get('projectId');
    const sessions = await chatAdapter.getSessions();
    const filteredSessions = projectId 
      ? sessions.filter(s => s.projectId === projectId || s.contextId === projectId) 
      : sessions;
    return NextResponse.json({ success: true, sessions: filteredSessions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = (body.text || body.message || '').trim();
    const { conversationId, senderId, contextType, contextId, projectId, attachment } = body;

    if (!text && !attachment) {
      return NextResponse.json({ success: false, error: 'Message text or attachment is required.' }, { status: 400 });
    }

    // If there is an attachment, format it into or alongside the prompt text
    let fullText = text;
    if (attachment) {
      const attachInfo = attachment.type === 'image' 
        ? `\n\n[Attached Screenshot: ${attachment.name || 'screenshot.png'}]`
        : `\n\n[Attached File: ${attachment.name || 'log.txt'}]`;
      fullText = fullText ? `${fullText}${attachInfo}` : `[Attached File: ${attachment.name || 'file'}]`;
    }

    const result = await chatAdapter.processChatMessage({
      conversationId,
      text: fullText,
      senderId: senderId || 'hq-web-user',
      contextType: contextType || (projectId ? 'PROJECT' : 'GLOBAL'),
      contextId: contextId || projectId,
      projectId
    });

    // If an attachment was present, attach metadata to assistant response or session
    if (attachment && result.assistantMessage) {
      result.assistantMessage.metadata = {
        ...result.assistantMessage.metadata,
        hasUserAttachment: true,
        attachmentName: attachment.name
      };
    }

    return NextResponse.json({
      success: true,
      session: result.session,
      message: result.assistantMessage,
      commandResponse: result.response
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
