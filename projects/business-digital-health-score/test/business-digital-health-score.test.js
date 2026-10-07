const test = require('node:test');
const assert = require('node:assert');
const { BusinessDigitalHealthScore } = require('../src/index.js');

test('BusinessDigitalHealthScore: scores business accurately', () => {
  const auditor = new BusinessDigitalHealthScore();
  const res = auditor.auditBusiness({
    mobileScore: 65, // -25
    leadResponseMinutes: 120, // -30
    hasSSL: true,
    hasStickyCTA: true,
    formFieldCount: 4
  });
  assert.strictEqual(res.digitalHealthScore, 45);
  assert.strictEqual(res.rating, 'GRADE_F_CRITICAL_LEAKS');
  assert.strictEqual(res.deductionsCount, 2);
});
