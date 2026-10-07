const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { diagnoseWebhook, parseStripeHeader, timingSafeCompareHex, STATUS } = require('../src/debugger');

test('Webhook Payload Debugger Test Suite', async (t) => {
  const secret = 'whsec_test_secret_key_12345';
  const payload = JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded', amount: 5000 });
  const now = Math.floor(Date.now() / 1000);

  await t.test('1. Valid Stripe payload signature passes validation', () => {
    const signedPayload = `${now}.${payload}`;
    const sig = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
    const header = `t=${now},v1=${sig}`;

    const report = diagnoseWebhook({
      provider: 'stripe',
      rawPayload: payload,
      signatureHeader: header,
      secret,
      currentTimestamp: now
    });

    assert.strictEqual(report.isValid, true);
    assert.strictEqual(report.status, STATUS.VALID);
    assert(report.diagnostics.some(d => d.includes('matches expected digest')));
  });

  await t.test('2. Expired timestamp triggers TIMESTAMP_EXPIRED', () => {
    const oldTimestamp = now - 400; // 400 seconds old (> 300s window)
    const signedPayload = `${oldTimestamp}.${payload}`;
    const sig = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
    const header = `t=${oldTimestamp},v1=${sig}`;

    const report = diagnoseWebhook({
      provider: 'stripe',
      rawPayload: payload,
      signatureHeader: header,
      secret,
      currentTimestamp: now
    });

    assert.strictEqual(report.isValid, false);
    assert.strictEqual(report.status, STATUS.TIMESTAMP_EXPIRED);
    assert(report.diagnostics.some(d => d.includes('Timestamp expired')));
    assert(report.remediation !== null);
  });

  await t.test('3. Tampered body triggers SIGNATURE_MISMATCH', () => {
    const signedPayload = `${now}.${payload}`;
    const sig = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
    const header = `t=${now},v1=${sig}`;
    const tamperedPayload = JSON.stringify({ id: 'evt_123', type: 'payment_intent.succeeded', amount: 999999 });

    const report = diagnoseWebhook({
      provider: 'stripe',
      rawPayload: tamperedPayload,
      signatureHeader: header,
      secret,
      currentTimestamp: now
    });

    assert.strictEqual(report.isValid, false);
    assert.strictEqual(report.status, STATUS.SIGNATURE_MISMATCH);
    assert(report.diagnostics.some(d => d.includes('Signature mismatch')));
  });

  await t.test('4. Trailing newline whitespace drift detected as BODY_MUTATED', () => {
    const signedPayload = `${now}.${payload}\n`; // signed with newline
    const sig = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
    const header = `t=${now},v1=${sig}`;

    // Delivered without newline
    const report = diagnoseWebhook({
      provider: 'stripe',
      rawPayload: payload,
      signatureHeader: header,
      secret,
      currentTimestamp: now
    });

    assert.strictEqual(report.isValid, false);
    assert.strictEqual(report.status, STATUS.BODY_MUTATED);
    assert(report.diagnostics.some(d => d.includes('trailing newline')));
  });

  await t.test('5. Malformed header triggers MALFORMED_HEADER', () => {
    const report = diagnoseWebhook({
      provider: 'stripe',
      rawPayload: payload,
      signatureHeader: 'invalid-header-string',
      secret,
      currentTimestamp: now
    });

    assert.strictEqual(report.isValid, false);
    assert.strictEqual(report.status, STATUS.MALFORMED_HEADER);
  });

  await t.test('6. Valid GitHub sha256 signature passes validation', () => {
    const gitSecret = 'github_webhook_secret_xyz';
    const sig = crypto.createHmac('sha256', gitSecret).update(payload, 'utf8').digest('hex');
    const header = `sha256=${sig}`;

    const report = diagnoseWebhook({
      provider: 'github',
      rawPayload: payload,
      signatureHeader: header,
      secret: gitSecret
    });

    assert.strictEqual(report.isValid, true);
    assert.strictEqual(report.status, STATUS.VALID);
  });

  await t.test('7. Timing-safe comparison verifies constant-time bounds', () => {
    const hexA = crypto.randomBytes(32).toString('hex');
    const hexB = Buffer.from(hexA, 'hex').toString('hex');
    const hexC = crypto.randomBytes(32).toString('hex');

    assert.strictEqual(timingSafeCompareHex(hexA, hexB), true);
    assert.strictEqual(timingSafeCompareHex(hexA, hexC), false);
    assert.strictEqual(timingSafeCompareHex(hexA, 'short'), false);
  });
});
