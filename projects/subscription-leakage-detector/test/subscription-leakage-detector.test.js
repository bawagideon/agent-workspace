const test = require('node:test');
const assert = require('node:assert');
const { SubscriptionLeakageDetector } = require('../src/index.js');

test('SubscriptionLeakageDetector: detects unbilled user seats and calculates leak', () => {
  const detector = new SubscriptionLeakageDetector();
  const res = detector.reconcileAccount({
    id: 'a1',
    companyName: 'TechCorp',
    billedSeats: 10,
    activePlatformUsers: 15,
    seatPricePerMonth: 50
  });
  assert.strictEqual(res.hasLeakage, true);
  assert.strictEqual(res.excessUsers, 5);
  assert.strictEqual(res.monthlyLeakage, 250);
  assert.strictEqual(res.annualLeakage, 3000);
});
