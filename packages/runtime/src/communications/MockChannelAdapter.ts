import crypto from 'crypto';

export class MockChannelAdapter {
  public channelName: string;
  public dispatchedMessages: Array<{ recipient: string; subject: string; body: string; envelope: any }> = [];
  public sentMessages: any[] = [];
  private isTimeout = false;
  private isFailing = false;

  constructor(channelName: string = 'EMAIL') {
    this.channelName = channelName;
  }

  public simulateTimeout(enable: boolean): void {
    this.isTimeout = enable;
  }

  public simulateFailure(enable: boolean): void {
    this.isFailing = enable;
  }

  public async sendMessage(params: { recipient: string; subject: string; body: string; envelope: any }): Promise<{
    success: boolean;
    externalMessageId?: string;
    error?: string;
    uncertain?: boolean;
  }> {
    if (this.isTimeout) {
      return {
        success: false,
        uncertain: true,
        error: 'E_TIMEOUT: Gateway timeout connecting to upstream provider.'
      };
    }

    if (this.isFailing) {
      return {
        success: false,
        uncertain: false,
        error: 'E_REJECTED: Upstream recipient rejected.'
      };
    }

    // Strip CRLF to prevent injection
    const cleanSubject = params.subject.replace(/[\r\n]/g, '');
    const cleanBody = params.body;

    const dispatched = {
      recipient: params.recipient,
      subject: cleanSubject,
      body: cleanBody,
      envelope: params.envelope
    };

    this.dispatchedMessages.push(dispatched);
    this.sentMessages.push(dispatched);

    return {
      success: true,
      externalMessageId: `mock_deliv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`
    };
  }
}
