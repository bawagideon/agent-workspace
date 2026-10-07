import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ExecutionEvidence } from '@gideon/shared';

export class EvidenceStore {
  private static evidenceDir = path.resolve(process.cwd(), '.gideon', 'evidence');
  private static secretKey = process.env.GIDEON_HMAC_SECRET || 'gideon-immutable-evidence-secret-2026';

  private static ensureDir(): void {
    if (!fs.existsSync(this.evidenceDir)) {
      fs.mkdirSync(this.evidenceDir, { recursive: true });
    }
  }

  /**
   * Generates a cryptographic HMAC-SHA256 signature for an evidence record.
   */
  public static signEvidence(data: Omit<ExecutionEvidence, 'signature'>): string {
    const payload = `${data.id}:${data.taskId}:${data.agentId}:${data.sessionKey}:${data.model}:${data.tokensUsed}:${data.costCents}:${data.exitCode}:${data.timestamp}`;
    return crypto.createHmac('sha256', this.secretKey).update(payload).digest('hex');
  }

  /**
   * Saves an execution evidence bundle to disk with cryptographic seal.
   */
  public static saveEvidence(evidence: Omit<ExecutionEvidence, 'signature'>): ExecutionEvidence {
    this.ensureDir();

    const signature = this.signEvidence(evidence);
    const completeEvidence: ExecutionEvidence = {
      ...evidence,
      signature
    };

    const filePath = path.join(this.evidenceDir, `${evidence.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(completeEvidence, null, 2), 'utf8');

    return completeEvidence;
  }

  /**
   * Reads and verifies the cryptographic integrity of an evidence bundle.
   */
  public static getEvidence(evidenceId: string): { evidence: ExecutionEvidence; verified: boolean } | null {
    const filePath = path.join(this.evidenceDir, `${evidenceId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const evidence: ExecutionEvidence = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const expectedSignature = this.signEvidence(evidence);
      const verified = evidence.signature === expectedSignature;

      return { evidence, verified };
    } catch {
      return null;
    }
  }

  /**
   * Lists all evidence bundles on disk.
   */
  public static listEvidence(): ExecutionEvidence[] {
    this.ensureDir();
    const files = fs.readdirSync(this.evidenceDir).filter((f) => f.endsWith('.json'));
    const list: ExecutionEvidence[] = [];

    for (const file of files) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(this.evidenceDir, file), 'utf8'));
        list.push(content);
      } catch {
        // ignore malformed
      }
    }

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
