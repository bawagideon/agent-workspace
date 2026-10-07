import path from 'path';

export class SecretProtection {
  private static TEMPLATE_PATTERNS = [
    /^\.env\.(example|sample|template|schema|dist|defaults)$/i,
    /\.env\.(example|sample|template|schema|dist|defaults)\./i
  ];

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

    // Whitelist non-secret environment variable template and sample files
    for (const templatePattern of this.TEMPLATE_PATTERNS) {
      if (templatePattern.test(baseName)) {
        return false;
      }
    }

    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(baseName) || pattern.test(normalized)) {
        return true;
      }
    }
    return false;
  }

  public static redactSecrets(content: string): string {
    if (!content || typeof content !== 'string') return content;
    return content
      .replace(/ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, '[REDACTED_JWT]')
      .replace(/ghp_[A-Za-z0-9_]{36}/g, '[REDACTED_GITHUB_TOKEN]')
      .replace(/sk-[A-Za-z0-9-_]{32,}/g, '[REDACTED_SECRET]')
      .replace(/sk_live_[a-zA-Z0-9]+/gi, '[REDACTED_SECRET]')
      .replace(/sk_test_[a-zA-Z0-9]+/gi, '[REDACTED_SECRET]')
      .replace(/sec_[a-zA-Z0-9_]+/gi, '[REDACTED_SECRET]')
      .replace(/TEST_(?:HMAC|STRIPE|SUPABASE|GATEWAY)_[A-Z0-9_]+/gi, '[REDACTED_SECRET]')
      .replace(/(?:Bearer\s+)[A-Za-z0-9-_.]{6,}/gi, 'Bearer [REDACTED_SECRET]')
      .replace(/(?:api_key|apikey|secret|token|password)\s*[:=]\s*['"][^'"]+['"]/gi, '$1: "[REDACTED_SECRET]"')
      .replace(/(?:api_key|apikey|secret|token|password)\s*=\s*([^\s&;]+)/gi, 'secret=[REDACTED_SECRET]');
  }
}
