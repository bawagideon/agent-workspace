import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface OpenClawConfig {
  gatewayUrl: string;
  gatewayToken: string;
  defaultModel: string;
  fallbackModels: string[];
}

export interface AgentDispatchParams {
  agentId?: string;
  prompt: string;
  sessionKey?: string;
  model?: string;
  thinking?: 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'adaptive';
  cwd?: string;
  timeoutSeconds?: number;
}

export interface AgentDispatchResult {
  ok: boolean;
  runId?: string;
  reply?: string;
  model?: string;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  costCents?: number;
  costUsd?: number;
  toolNames?: string[];
  sessionKey?: string;
  error?: string;
  raw?: any;
}

export class OpenClawBridgeClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private isWsConnected: boolean = false;
  private pendingRequests: Map<string, { resolve: (val: any) => void; reject: (err: any) => void; timer: NodeJS.Timeout }> = new Map();
  private config: OpenClawConfig;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isDisposed: boolean = false;

  constructor(customConfig?: Partial<OpenClawConfig>) {
    super();
    this.config = this.loadConfig(customConfig);
  }

  private loadConfig(customConfig?: Partial<OpenClawConfig>): OpenClawConfig {
    let gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN || '';
    let gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789';
    let defaultModel = process.env.GEMINI_MODEL || 'google/gemini-3.7-flash';
    let fallbackModels: string[] = ['google/gemini-3.5-flash', 'google/gemini-2.5-flash'];

    const userHome = os.homedir();
    const configPath = path.join(userHome, '.openclaw', 'openclaw.json');

    if (fs.existsSync(configPath)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (fileContent.gateway?.auth?.token) {
          gatewayToken = fileContent.gateway.auth.token;
        }
        if (fileContent.gateway?.port) {
          gatewayUrl = `ws://127.0.0.1:${fileContent.gateway.port}`;
        }
        if (fileContent.agents?.defaults?.model?.primary) {
          defaultModel = fileContent.agents.defaults.model.primary;
        }
        if (Array.isArray(fileContent.agents?.defaults?.model?.fallbacks)) {
          fallbackModels = fileContent.agents.defaults.model.fallbacks;
        }
      } catch (err: any) {
        console.warn(`[OpenClawBridge] Failed to parse openclaw.json: ${err.message}`);
      }
    }

    return {
      gatewayUrl: customConfig?.gatewayUrl || gatewayUrl,
      gatewayToken: customConfig?.gatewayToken || gatewayToken,
      defaultModel: customConfig?.defaultModel || defaultModel,
      fallbackModels: customConfig?.fallbackModels || fallbackModels
    };
  }

  public async connect(): Promise<boolean> {
    if (this.isWsConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      return true;
    }

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.config.gatewayUrl);

        const connectTimeout = setTimeout(() => {
          if (!this.isWsConnected) {
            console.warn('[OpenClawBridge] WebSocket handshake timed out (falling back to CLI mode).');
            resolve(false);
          }
        }, 15000);

        this.ws.onopen = () => {
          this.emit('socket:open');
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data.toString());
            this.handleFrame(data, resolve, connectTimeout);
          } catch (err: any) {
            console.warn('[OpenClawBridge] Failed to parse inbound WebSocket frame:', err.message);
          }
        };

        this.ws.onclose = () => {
          this.isWsConnected = false;
          this.emit('socket:close');
          if (!this.isDisposed) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (err) => {
          this.emit('socket:error', err);
          clearTimeout(connectTimeout);
          resolve(false);
        };
      } catch (err) {
        resolve(false);
      }
    });
  }

  private handleFrame(data: any, connectResolve: (val: boolean) => void, connectTimeout: NodeJS.Timeout): void {
    // 1. Handshake Challenge
    if (data.type === 'event' && data.event === 'connect.challenge') {
      const connectReq = {
        type: 'req',
        id: 'req-handshake-connect',
        method: 'connect',
        params: {
          minProtocol: 4,
          maxProtocol: 4,
          client: {
            id: 'gateway-client',
            version: '2026.9.3',
            platform: process.platform,
            mode: 'backend'
          },
          role: 'operator',
          scopes: ['operator.read', 'operator.write'],
          auth: { token: this.config.gatewayToken }
        }
      };
      this.ws?.send(JSON.stringify(connectReq));
      return;
    }

    // 2. Handshake Response
    if (data.type === 'res' && data.id === 'req-handshake-connect') {
      clearTimeout(connectTimeout);
      if (data.ok) {
        this.isWsConnected = true;
        this.emit('connected', data.payload);
        connectResolve(true);
      } else {
        console.error('[OpenClawBridge] Handshake rejected by gateway:', data.error);
        connectResolve(false);
      }
      return;
    }

    // 3. General RPC Response
    if (data.type === 'res' && data.id) {
      const pending = this.pendingRequests.get(data.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(data.id);
        if (data.ok) {
          pending.resolve(data.payload);
        } else {
          pending.reject(new Error(data.error?.message || `RPC Error (${data.error?.code || 'UNKNOWN'})`));
        }
      }
      return;
    }

    // 4. Streaming Broadcast Events
    if (data.type === 'event') {
      this.emit('gateway:event', data);
      if (data.event) {
        this.emit(data.event, data.payload);
      }
    }
  }

  public async callRpc<T = any>(method: string, params: Record<string, any> = {}, timeoutMs: number = 30000): Promise<T> {
    const isReady = await this.connect();
    if (!isReady || !this.ws || !this.isWsConnected) {
      throw new Error(`OpenClaw Gateway WebSocket is not reachable at ${this.config.gatewayUrl}`);
    }

    const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const frame = { type: 'req', id, method, params };

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`RPC method '${method}' timed out after ${timeoutMs}ms.`));
      }, timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timer });
      this.ws?.send(JSON.stringify(frame));
    });
  }

  public async getStatus(): Promise<any> {
    return this.callRpc('status', {});
  }

  public async getHealth(): Promise<any> {
    return this.callRpc('health', {});
  }

  public async listTools(): Promise<any> {
    return this.callRpc('tools.catalog', {});
  }

  public async invokeTool(name: string, args: Record<string, any> = {}, sessionKey?: string): Promise<any> {
    return this.callRpc('tools.invoke', {
      name,
      args,
      sessionKey
    });
  }

  /**
   * Dispatches an agent turn with automatic 429 backoff, jitter, and fallback resilience.
   */
  /**
   * Dispatches an agent turn with automatic 429 backoff, jitter, and fallback resilience.
   */
  public async dispatchAgent(params: AgentDispatchParams): Promise<AgentDispatchResult> {
    const candidateModels = [
      params.model || this.config.defaultModel,
      ...this.config.fallbackModels.filter((m) => m !== (params.model || this.config.defaultModel))
    ];

    let lastError = '';

    for (let i = 0; i < candidateModels.length; i++) {
      const currentModel = candidateModels[i];
      const maxAttemptsPerModel = 3;

      for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
        try {
          const runParams = { ...params, model: currentModel };
          const result = await this.executeAgentCli(runParams);
          if (result.ok) {
            return result;
          }

          // Detect 429 quota exhaustion, cooldowns, or rate limits
          const isRateLimited = 
            result.error?.includes('429') || 
            result.error?.includes('RESOURCE_EXHAUSTED') ||
            result.error?.includes('quota') ||
            result.error?.includes('cooldown') ||
            result.error?.includes('rate_limit') ||
            result.error?.includes('timed out');

          lastError = result.error || 'Unknown error';

          if (isRateLimited && attempt < maxAttemptsPerModel) {
            const waitMs = 6000 * attempt;
            console.warn(`[OpenClawBridge] Model ${currentModel} encountered limit (${lastError}). Retrying in ${waitMs}ms...`);
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }

          // If rate limited or failed, break inner loop to try next model in candidateModels
          console.warn(`[OpenClawBridge] Model ${currentModel} failed (${lastError}). Trying next fallback model...`);
          break;
        } catch (err: any) {
          lastError = err.message;
          break;
        }
      }
    }

    return {
      ok: false,
      error: `Agent dispatch failed across all candidate models (${candidateModels.join(', ')}). Last error: ${lastError}`
    };
  }

  private async executeAgentCli(params: AgentDispatchParams): Promise<AgentDispatchResult> {
    // 1. Create temporary message file to prevent quoting/escaping issues on Windows
    const tmpDir = path.join(os.tmpdir(), 'gideon-openclaw');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const tmpFile = path.join(tmpDir, `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.md`);
    fs.writeFileSync(tmpFile, params.prompt, 'utf8');

    const args: string[] = ['agent'];

    if (params.agentId) {
      args.push('--agent', params.agentId);
    }
    if (params.sessionKey) {
      args.push('--session-key', params.sessionKey);
    }
    if (params.model) {
      args.push('--model', params.model);
    }
    if (params.thinking) {
      args.push('--thinking', params.thinking);
    }
    if (params.timeoutSeconds) {
      args.push('--timeout', params.timeoutSeconds.toString());
    }

    args.push('--message-file', tmpFile);
    args.push('--json');

    const isWin = process.platform === 'win32';
    const executable = isWin ? 'openclaw.cmd' : 'openclaw';

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';

      // On Windows Node.js, batch files (.cmd/.bat) require shell: true (CVE-2024-27980)
      const child: ChildProcess = isWin
        ? spawn([executable, ...args].join(' '), {
            cwd: params.cwd || process.cwd(),
            shell: true,
            env: { ...process.env, CI: 'true' }
          })
        : spawn(executable, args, {
            cwd: params.cwd || process.cwd(),
            shell: false,
            env: { ...process.env, CI: 'true' }
          });

      child.stdout?.on('data', (d) => {
        stdout += d.toString();
      });

      child.stderr?.on('data', (d) => {
        stderr += d.toString();
      });

      const timeoutMs = (params.timeoutSeconds || 300) * 1000;
      const timer = setTimeout(() => {
        child.kill();
        this.cleanupFile(tmpFile);
        resolve({
          ok: false,
          error: `OpenClaw agent run timed out after ${timeoutMs}ms.`
        });
      }, timeoutMs);

      child.on('close', (code) => {
        clearTimeout(timer);
        this.cleanupFile(tmpFile);

        // Attempt JSON parse from stdout
        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed.ok === false || parsed.error) {
            resolve({
              ok: false,
              runId: parsed.runId,
              error: parsed.error?.message || JSON.stringify(parsed.error),
              raw: parsed
            });
            return;
          }

          const meta = parsed.result?.meta?.agentMeta;
          const usage = meta?.usage;
          const tokensUsed = usage?.total || 0;
          const inputTokens = usage?.input || 0;
          const outputTokens = usage?.output || 0;
          const costUsd = meta?.costUsd ?? (usage?.cost?.total || 0);
          const costCents = Number((costUsd * 100).toFixed(4));
          const toolNames = meta?.terminalReceipt?.successfulToolNames || meta?.toolSummary?.tools || [];
          const modelUsed = meta?.model || params.model || 'unknown';

          // Check if payload has reply text
          let reply = parsed.result?.reply || parsed.result?.text;
          if (!reply && Array.isArray(parsed.result?.payloads)) {
            reply = parsed.result.payloads.map((p: any) => p.text).filter(Boolean).join('\n');
          }

          resolve({
            ok: code === 0,
            runId: parsed.runId,
            reply: reply || stdout.trim(),
            model: modelUsed,
            tokensUsed,
            inputTokens,
            outputTokens,
            costCents,
            costUsd,
            toolNames,
            sessionKey: params.sessionKey,
            raw: parsed
          });
        } catch {
          // If stdout was not pure JSON, check exit code
          if (code === 0) {
            resolve({
              ok: true,
              reply: stdout.trim(),
              sessionKey: params.sessionKey
            });
          } else {
            resolve({
              ok: false,
              error: stderr.trim() || stdout.trim() || `Process exited with code ${code}`
            });
          }
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        this.cleanupFile(tmpFile);
        resolve({
          ok: false,
          error: `Failed to spawn OpenClaw process: ${err.message}`
        });
      });
    });
  }

  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // Ignore cleanup error
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isDisposed && !this.isWsConnected) {
        this.connect().catch(() => {});
      }
    }, 5000);
  }

  public isConnected(): boolean {
    return this.isWsConnected;
  }

  public disconnect(): void {
    this.isDisposed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isWsConnected = false;
  }
}
