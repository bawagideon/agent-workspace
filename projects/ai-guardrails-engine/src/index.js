/**
 * AI Guardrails Engine (Zero-Dependency, Sub-5ms Edge Security)
 * 
 * Invariants:
 * 1. Deterministic Injection Shield: Intercepts roleplay hijack, delimiter evasion,
 *    base64 obfuscation, and system extraction probes without remote LLM latency.
 * 2. High-Entropy Secret & PII Sanitizer: Redacts API keys, tokens, credit cards (with Luhn check),
 *    SSNs, and emails with zero data leak.
 * 3. Self-Healing JSON Schema Enforcer: Automatically repairs Markdown code fences, trailing commas,
 *    and truncated unclosed braces from hallucinating LLMs.
 * 
 * Author: Gideon Systems Engineering
 */

const crypto = require('node:crypto');

// 1. INJECTION THREAT PATTERNS
const INJECTION_PATTERNS = [
  {
    id: 'ROLEPLAY_HIJACK',
    name: 'Directive Override & Roleplay Hijacking',
    regex: /(ignore|disregard|forget|override|bypass)\s+(all\s+)?(previous|prior|above|system)\s+(instructions|directives|prompts|rules)/i,
    severity: 'CRITICAL',
    weight: 0.95
  },
  {
    id: 'DAN_JAILBREAK',
    name: 'Jailbreak Persona Mode',
    regex: /\b(DAN\s+mode|unrestricted\s+mode|developer\s+mode\s+enabled|jailbreak|evil\s+confidant|always\s+say\s+yes)\b/i,
    severity: 'CRITICAL',
    weight: 0.90
  },
  {
    id: 'DELIMITER_COLLISION',
    name: 'Prompt Delimiter Injection',
    regex: /(###\s*(system|instruction|admin)|<\|im_start\|>system|\[INST\]\s*<<SYS>>|<\/?system>|"""\s*system:)/i,
    severity: 'HIGH',
    weight: 0.85
  },
  {
    id: 'SYSTEM_PROMPT_LEAK',
    name: 'System Prompt Extraction Probe',
    regex: /(reveal|print|repeat|show|dump|output|verbatim)\s+(your\s+)?(initial|original|internal|full)?\s*(system\s+prompt|core\s+directives|configuration|instructions)/i,
    severity: 'HIGH',
    weight: 0.80
  },
  {
    id: 'TOOL_EXEC_POISONING',
    name: 'Privileged Tool Execution Attempt',
    regex: /(curl\s+https?:\/\/|rm\s+-rf|SELECT\s+.*FROM\s+information_schema|DROP\s+TABLE|bash\s+-c|eval\(|os\.system\()/i,
    severity: 'CRITICAL',
    weight: 0.95
  }
];

// 2. HIGH-ENTROPY SECRETS & PII PATTERNS
const PII_PATTERNS = [
  {
    type: 'STRIPE_SECRET_KEY',
    regex: /\b(sk_live_[a-zA-Z0-9]{24,}|rk_live_[a-zA-Z0-9]{24,})\b/g,
    placeholder: '[REDACTED_STRIPE_SECRET]'
  },
  {
    type: 'GITHUB_PAT',
    regex: /\b(ghp_[a-zA-Z0-9]{36,}|github_pat_[a-zA-Z0-9_]{50,})\b/g,
    placeholder: '[REDACTED_GITHUB_TOKEN]'
  },
  {
    type: 'OPENAI_API_KEY',
    regex: /\b(sk-[a-zA-Z0-9]{20,}T3BlbkFJ[a-zA-Z0-9]{20,}|sk-proj-[a-zA-Z0-9-_]{40,})\b/g,
    placeholder: '[REDACTED_OPENAI_KEY]'
  },
  {
    type: 'AWS_ACCESS_KEY',
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    placeholder: '[REDACTED_AWS_KEY]'
  },
  {
    type: 'JWT_TOKEN',
    regex: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
    placeholder: '[REDACTED_JWT_TOKEN]'
  },
  {
    type: 'US_SSN',
    regex: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
    placeholder: '[REDACTED_SSN]'
  },
  {
    type: 'EMAIL_ADDRESS',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    placeholder: '[REDACTED_EMAIL]'
  }
];

// Helper: Luhn checksum validator for credit cards
function isValidLuhn(numberString) {
  const clean = numberString.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean[i], 10);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

// Helper: Base64 extraction detector
function detectBase64Injections(text) {
  const base64CandidateRegex = /\b[A-Za-z0-9+/]{20,}={0,2}\b/g;
  const matches = text.match(base64CandidateRegex) || [];
  const decodedThreats = [];

  for (const candidate of matches) {
    try {
      const decoded = Buffer.from(candidate, 'base64').toString('utf8');
      if (/[\x00-\x08\x0E-\x1F]/.test(decoded)) continue; // ignore binary garbage
      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.regex.test(decoded)) {
          decodedThreats.push({
            id: `OBFUSCATED_${pattern.id}`,
            name: `Base64 Obfuscated ${pattern.name}`,
            decodedSnippet: decoded.slice(0, 60),
            weight: pattern.weight
          });
        }
      }
    } catch {
      // not base64 or failed decoding
    }
  }
  return decodedThreats;
}

/**
 * 1. Inspect Prompt for Ingress Threats
 */
function inspectPrompt(promptText, options = {}) {
  const startTime = process.hrtime.bigint();
  if (typeof promptText !== 'string') {
    return { passed: false, riskScore: 1.0, threats: ['INVALID_PAYLOAD_TYPE'], latencyMs: 0.1 };
  }

  const threats = [];
  let maxRisk = 0.0;

  // Pattern checks
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.regex.test(promptText)) {
      threats.push({
        id: pattern.id,
        name: pattern.name,
        severity: pattern.severity,
        weight: pattern.weight
      });
      if (pattern.weight > maxRisk) maxRisk = pattern.weight;
    }
  }

  // Base64 obfuscation scan
  const obfuscated = detectBase64Injections(promptText);
  for (const ob of obfuscated) {
    threats.push(ob);
    if (ob.weight > maxRisk) maxRisk = ob.weight;
  }

  // Unicode homoglyph normalization check (e.g. Cyrillic spoofing)
  const normalized = promptText.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  if (normalized !== promptText) {
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.regex.test(normalized) && !threats.some(t => t.id === pattern.id)) {
        threats.push({
          id: `HOMOGLYPH_${pattern.id}`,
          name: `Unicode Homoglyph ${pattern.name}`,
          severity: 'HIGH',
          weight: pattern.weight
        });
        if (pattern.weight > maxRisk) maxRisk = pattern.weight;
      }
    }
  }

  const threshold = options.threshold || 0.75;
  const passed = threats.length === 0 || maxRisk < threshold;
  const endTime = process.hrtime.bigint();
  const latencyMs = Number(endTime - startTime) / 1e6;

  return {
    passed,
    riskScore: Number(maxRisk.toFixed(2)),
    threats,
    threatCount: threats.length,
    latencyMs: Number(latencyMs.toFixed(3))
  };
}

/**
 * 2. Redact PII & High-Entropy Credentials
 */
function redactSensitiveData(text) {
  const startTime = process.hrtime.bigint();
  if (typeof text !== 'string') {
    return { cleanText: '', redactedCount: 0, redactions: [], latencyMs: 0.05 };
  }

  let cleanText = text;
  const redactionSummary = [];
  let totalRedacted = 0;

  // 1. Redact Known Regex Patterns
  for (const p of PII_PATTERNS) {
    const matches = cleanText.match(p.regex);
    if (matches && matches.length > 0) {
      cleanText = cleanText.replace(p.regex, p.placeholder);
      totalRedacted += matches.length;
      redactionSummary.push({ type: p.type, count: matches.length });
    }
  }

  // 2. Validate and Redact Credit Card PANs with Luhn Filter
  const ccCandidateRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g;
  cleanText = cleanText.replace(ccCandidateRegex, (match) => {
    if (isValidLuhn(match)) {
      totalRedacted++;
      const existing = redactionSummary.find(r => r.type === 'CREDIT_CARD_PAN');
      if (existing) existing.count++;
      else redactionSummary.push({ type: 'CREDIT_CARD_PAN', count: 1 });
      return '[REDACTED_CREDIT_CARD]';
    }
    return match;
  });

  const endTime = process.hrtime.bigint();
  const latencyMs = Number(endTime - startTime) / 1e6;

  return {
    cleanText,
    redactedCount: totalRedacted,
    redactions: redactionSummary,
    latencyMs: Number(latencyMs.toFixed(3))
  };
}

/**
 * 3. Self-Healing JSON Schema Enforcer
 */
function enforceJsonSchema(rawOutput, schemaDefinition = {}) {
  const startTime = process.hrtime.bigint();
  const repairs = [];
  let text = typeof rawOutput === 'string' ? rawOutput.trim() : JSON.stringify(rawOutput);

  // 1. Extract JSON from Markdown Code Blocks if wrapped
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const codeBlockMatch = text.match(codeBlockRegex);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
    repairs.push('EXTRACTED_FROM_MARKDOWN_BLOCK');
  }

  // 2. Auto-repair trailing commas: `, ]` or `, }`
  if (/,\s*([\]}])/.test(text)) {
    text = text.replace(/,\s*([\]}])/g, '$1');
    repairs.push('STRIPPED_TRAILING_COMMAS');
  }

  // 3. Auto-balance unclosed braces / brackets if truncated
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces = Math.max(0, openBraces - 1);
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets = Math.max(0, openBrackets - 1);
    }
  }

  if (inString) {
    text += '"';
    repairs.push('CLOSED_UNTERMINATED_STRING');
  }
  if (/,\s*$/.test(text)) {
    text = text.replace(/,\s*$/, '');
    repairs.push('STRIPPED_TRAILING_COMMAS');
  }
  while (openBrackets > 0) {
    text += ']';
    openBrackets--;
    repairs.push('BALANCED_MISSING_BRACKET');
  }
  while (openBraces > 0) {
    text += '}';
    openBraces--;
    repairs.push('BALANCED_MISSING_BRACE');
  }
  if (/,\s*([\]}])/.test(text)) {
    text = text.replace(/,\s*([\]}])/g, '$1');
    if (!repairs.includes('STRIPPED_TRAILING_COMMAS')) repairs.push('STRIPPED_TRAILING_COMMAS');
  }

  // 4. Parse Attempt
  let parsed = null;
  let parseError = null;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    parseError = err.message;
  }

  if (!parsed || typeof parsed !== 'object') {
    const endTime = process.hrtime.bigint();
    return {
      valid: false,
      data: null,
      errors: [parseError || 'Output is not a valid JSON object'],
      repairsApplied: repairs,
      latencyMs: Number(Number(endTime - startTime) / 1e6).toFixed(3)
    };
  }

  // 5. Schema Validation
  const schemaErrors = [];
  if (schemaDefinition.required && Array.isArray(schemaDefinition.required)) {
    for (const field of schemaDefinition.required) {
      if (!(field in parsed) || parsed[field] === undefined || parsed[field] === null) {
        schemaErrors.push(`Missing required field: '${field}'`);
      }
    }
  }

  if (schemaDefinition.properties && typeof schemaDefinition.properties === 'object') {
    for (const [key, propRule] of Object.entries(schemaDefinition.properties)) {
      if (key in parsed) {
        const val = parsed[key];
        if (propRule.type === 'string' && typeof val !== 'string') {
          schemaErrors.push(`Field '${key}' expected string, got ${typeof val}`);
        } else if (propRule.type === 'number' && typeof val !== 'number') {
          schemaErrors.push(`Field '${key}' expected number, got ${typeof val}`);
        } else if (propRule.type === 'boolean' && typeof val !== 'boolean') {
          schemaErrors.push(`Field '${key}' expected boolean, got ${typeof val}`);
        } else if (propRule.type === 'array' && !Array.isArray(val)) {
          schemaErrors.push(`Field '${key}' expected array, got ${typeof val}`);
        }
      }
    }
  }

  const endTime = process.hrtime.bigint();
  const latencyMs = Number(endTime - startTime) / 1e6;

  return {
    valid: schemaErrors.length === 0,
    data: parsed,
    errors: schemaErrors,
    repairsApplied: repairs,
    latencyMs: Number(latencyMs.toFixed(3))
  };
}

/**
 * 4. Unified Full-Lifecycle Guardrail Interceptor
 */
function processGuardrail({ prompt, llmResponse, schema, options = {} }) {
  const result = {
    ingress: null,
    egress: null,
    blocked: false,
    reason: null,
    totalLatencyMs: 0
  };

  const start = process.hrtime.bigint();

  // Ingress prompt check
  if (prompt) {
    result.ingress = inspectPrompt(prompt, options);
    if (!result.ingress.passed) {
      result.blocked = true;
      result.reason = `Ingress Prompt Blocked: High-risk injection detected (${result.ingress.threats.map(t => t.id).join(', ')})`;
    }
  }

  // Egress sanitization & schema enforcement
  if (!result.blocked && llmResponse) {
    const piiResult = redactSensitiveData(llmResponse);
    let schemaResult = null;
    if (schema) {
      schemaResult = enforceJsonSchema(piiResult.cleanText, schema);
    }

    result.egress = {
      sanitizedText: piiResult.cleanText,
      redactedCount: piiResult.redactedCount,
      redactions: piiResult.redactions,
      schema: schemaResult
    };

    if (schemaResult && !schemaResult.valid) {
      result.blocked = true;
      result.reason = `Egress Schema Rejected: ${schemaResult.errors.join('; ')}`;
    }
  }

  const end = process.hrtime.bigint();
  result.totalLatencyMs = Number((Number(end - start) / 1e6).toFixed(3));

  return result;
}

module.exports = {
  inspectPrompt,
  redactSensitiveData,
  enforceJsonSchema,
  processGuardrail,
  isValidLuhn
};
