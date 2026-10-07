const test = require('node:test');
const assert = require('node:assert');
const { InternalRequestRouter } = require('../src/index.js');

test('InternalRequestRouter: routes IT request with urgency SLA', () => {
  const router = new InternalRequestRouter();
  const res = router.routeRequest('Urgent! I cannot access the VPN and client meeting is in 20 mins');
  assert.strictEqual(res.department, 'IT_SUPPORT');
  assert.strictEqual(res.urgency, 'HIGH_URGENCY');
  assert.strictEqual(res.assignedSLAHours, 2);
  assert.strictEqual(res.targetChannel, '#ops-it_support');
});
