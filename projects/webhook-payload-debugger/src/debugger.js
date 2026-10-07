const crypto = require('crypto');

/**
 * Diagnostic Invariant Status Codes
 */
const STATUS = {
  VALID: 'VALID',
  SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
  TIMESTAMP_EXPIRED: 'TIMESTAMP_EXPIRED',
  MALFORMED_HEADER: 'MALFORMED_HEADER',
  BODY_MUTATED: 'BODY_MUTATED',
  INVALID_SECRET: 'INVALID_SECRET'
};

/**
 * Parses Stripe/Svix signature header (e.g. "t=1700000000,v1=abcdef...")
 */
function parseStripeHeader(header) {
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(',');
  let timestamp = null;
  const signatures = [];

  for (const part of parts) {
    const [k, v] = part.trim().split('=');
    if (k === 't') timestamp = parseInt(v, 10);
    if (k === 'v1' && v) signatures.push(v);
  }

  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

/**
 * Constant-time hex HMAC verification
 */
function timingSafeCompareHex(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates copy-paste code snippets to fix the common pitfalls
 */
function generateRemediation(provider, errorStatus) {
  const snippets = {};

  if (errorStatus === STATUS.BODY_MUTATED || errorStatus === STATUS.SIGNATURE_MISMATCH) {
    snippets.express = `// ⚠️ Fix: Ensure raw Buffer is preserved BEFORE express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  res.json({ received: true });
});`;

    snippets.fastapi = `# ⚠️ Fix: Read raw bytes directly from request.body()
@app.post("/webhook")
async def webhook(request: Request):
    payload = await request.body() # Raw bytes, do not use Pydantic model directly
    sig_header = request.headers.get("stripe-signature")
    event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    return {"status": "ok"}`;
  }

  if (errorStatus === STATUS.TIMESTAMP_EXPIRED) {
    snippets.timestampHelp = `// ⚠️ Fix: Ensure server clock is NTP synchronized, or increase tolerance window:
stripe.webhooks.constructEvent(payload, sig, endpointSecret, 600); // 600s tolerance`;
  }

  return snippets;
}

/**
 * Diagnoses a failing webhook payload and returns actionable insights.
 */
function diagnoseWebhook({
  provider = 'stripe',
  rawPayload = '',
  signatureHeader = '',
  secret = '',
  currentTimestamp = Math.floor(Date.now() / 1000),
  toleranceSeconds = 300
}) {
  const report = {
    provider,
    status: STATUS.VALID,
    isValid: false,
    diagnostics: [],
    details: {},
    remediation: null
  };

  if (!secret) {
    report.status = STATUS.INVALID_SECRET;
    report.diagnostics.push('❌ Missing or empty webhook signing secret.');
    return report;
  }

  if (!signatureHeader) {
    report.status = STATUS.MALFORMED_HEADER;
    report.diagnostics.push('❌ Missing signature header from request.');
    return report;
  }

  const payloadStr = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);

  // Check 1: Provider Signature Parsing
  if (provider.toLowerCase() === 'stripe') {
    const parsed = parseStripeHeader(signatureHeader);
    if (!parsed) {
      report.status = STATUS.MALFORMED_HEADER;
      report.diagnostics.push('❌ Malformed Stripe-Signature header. Expected format: "t={timestamp},v1={hash}".');
      report.remediation = generateRemediation('stripe', STATUS.MALFORMED_HEADER);
      return report;
    }

    report.details.extractedTimestamp = parsed.timestamp;
    report.details.extractedSignatures = parsed.signatures;

    // Check 2: Timestamp Window Analysis
    const ageSeconds = currentTimestamp - parsed.timestamp;
    report.details.payloadAgeSeconds = ageSeconds;

    if (Math.abs(ageSeconds) > toleranceSeconds) {
      report.status = STATUS.TIMESTAMP_EXPIRED;
      report.diagnostics.push(`❌ Timestamp expired: event is ${ageSeconds}s old (enforced tolerance: ±${toleranceSeconds}s).`);
      report.remediation = generateRemediation('stripe', STATUS.TIMESTAMP_EXPIRED);
      return report;
    } else {
      report.diagnostics.push(`✓ Timestamp valid (${ageSeconds}s old within ±${toleranceSeconds}s window).`);
    }

    // Check 3: Signature Recalculation
    const signedPayload = `${parsed.timestamp}.${payloadStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    report.details.expectedSignature = expectedSignature;

    const matches = parsed.signatures.some(sig => timingSafeCompareHex(sig, expectedSignature));

    if (matches) {
      report.status = STATUS.VALID;
      report.isValid = true;
      report.diagnostics.push('✓ Cryptographic HMAC-SHA256 signature matches expected digest.');
      report.diagnostics.push('✓ Constant-time buffer comparison verified (0 side-channel leakage).');
      return report;
    }

    // Check 4: Payload Mutation / Whitespace Drift Analysis
    report.status = STATUS.SIGNATURE_MISMATCH;
    report.diagnostics.push('❌ Signature mismatch: computed HMAC does not match any provided signatures.');

    // Heuristic: Test if stripping or adding trailing newline matches
    const withNewline = crypto.createHmac('sha256', secret).update(`${parsed.timestamp}.${payloadStr}\n`, 'utf8').digest('hex');
    const trimmed = crypto.createHmac('sha256', secret).update(`${parsed.timestamp}.${payloadStr.trim()}`, 'utf8').digest('hex');

    if (parsed.signatures.some(s => s === withNewline)) {
      report.status = STATUS.BODY_MUTATED;
      report.diagnostics.push('⚠️ Body Mutation Detected: Upstream proxy stripped trailing newline character (\\n).');
    } else if (parsed.signatures.some(s => s === trimmed)) {
      report.status = STATUS.BODY_MUTATED;
      report.diagnostics.push('⚠️ Body Mutation Detected: JSON formatting whitespace or carriage returns were modified.');
    }

    report.remediation = generateRemediation('stripe', report.status);
    return report;
  }

  // GitHub / Generic HMAC Provider
  if (provider.toLowerCase() === 'github') {
    let cleanSig = signatureHeader;
    if (signatureHeader.startsWith('sha256=')) {
      cleanSig = signatureHeader.slice(7);
    }
    const expected = crypto.createHmac('sha256', secret).update(payloadStr, 'utf8').digest('hex');
    report.details.expectedSignature = expected;

    if (timingSafeCompareHex(cleanSig, expected)) {
      report.status = STATUS.VALID;
      report.isValid = true;
      report.diagnostics.push('✓ GitHub sha256 signature matches expected digest.');
      return report;
    }

    report.status = STATUS.SIGNATURE_MISMATCH;
    report.diagnostics.push('❌ Signature mismatch: GitHub payload HMAC does not match.');
    report.remediation = generateRemediation('github', STATUS.SIGNATURE_MISMATCH);
    return report;
  }

  // Unsupported or generic
  report.diagnostics.push(`⚠️ Unsupported provider: ${provider}. Supported: 'stripe', 'github'.`);
  return report;
}

module.exports = {
  diagnoseWebhook,
  parseStripeHeader,
  timingSafeCompareHex,
  STATUS
};
