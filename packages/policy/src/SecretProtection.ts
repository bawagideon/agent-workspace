import path from 'path';

export class SecretProtection {
  private static BLOCKED_PATTERNS = [
    /^\.env(\..+)?$/i,
    /^\.git\/config$/i,
    /^\.git\/credentials$/i,
    /id_rsa.*$/i,
    /\.pem$/i,
    /\.key$/i,
    /node_modules/i
  ];

  public static isSecretFile(filePath: string): boolean {
    const normalized = path.normalize(filePath).replace(/\\/g, '/');
    const baseName = path.basename(normalized);

    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(baseName) || pattern.test(normalized)) {
        return true;
      }
    }
    return false;
  }

  public static redactSecrets(content: string): string {
    return content
      .replace(/ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, '[REDACTED_JWT]')
      .replace(/(?:api_key|apikey|secret|token|password)\s*[:=]\s*['"][^'"]+['"]/gi, '$1: "[REDACTED]"')
      .replace(/ghp_[A-Za-z0-9_]{36}/g, '[REDACTED_GITHUB_TOKEN]')
      .replace(/sk-[A-Za-z0-9-_]{32,}/g, '[REDACTED_OPENAI_KEY]');
  }
}
