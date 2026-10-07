const test = require('node:test');
const assert = require('node:assert');
const { RevenueLeakObservatory } = require('../src/index.js');

test('RevenueLeakObservatory: calculates total multi-funnel monthly cash bleed', () => {
  const obs = new RevenueLeakObservatory();
  const res = obs.aggregateFunnelLeaks({
    lostLeadsValue: 12000,
    ghostedQuotesValue: 24000,
    checkoutAbandonmentValue: 8000,
    overdueInvoicesValue: 15000,
    churnAtRiskValue: 10000
  });
  assert.strictEqual(res.totalBleedMonthly, 69000);
  assert.strictEqual(res.totalBleedAnnual, 828000);
  assert.strictEqual(res.primaryLeakPillar, 'Ghosted / Unfollowed Quotes');
});
