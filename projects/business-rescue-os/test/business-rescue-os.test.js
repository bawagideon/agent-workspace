const test = require('node:test');
const assert = require('node:assert');
const { BusinessRescueOS } = require('../src/index.js');

test('BusinessRescueOS: runs comprehensive 50-weapon meta diagnostic', () => {
  const os = new BusinessRescueOS();
  const res = os.runFullDiagnostic({
    name: 'Omni Global Enterprise',
    annualRevenue: 5000000,
    inboundVolumeMonthly: 200,
    activeAccounts: 80
  });
  assert.strictEqual(res.totalWeaponsReady, 50);
  assert.strictEqual(res.diagnosedPillarsScanned, 10);
  assert.ok(res.annualRecoverableARR > 0);
  assert.strictEqual(res.systemStatus, 'RESCUE_OPERATION_ACTIVE');
});
