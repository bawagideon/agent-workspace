const test = require('node:test');
const assert = require('node:assert');
const { OperationsBottleneckMapper } = require('../src/index.js');

test('OperationsBottleneckMapper: pinpoints longest delay bottleneck', () => {
  const mapper = new OperationsBottleneckMapper();
  const stages = [
    { name: 'Intake', durationHours: 2, standardSlaHours: 2 },
    { name: 'Legal Approval', durationHours: 72, standardSlaHours: 12 }, // 60h delay
    { name: 'Fulfillment', durationHours: 6, standardSlaHours: 4 }
  ];
  const res = mapper.calculateCycleTimes(stages);
  assert.strictEqual(res.primaryBottleneck, 'Legal Approval');
  assert.strictEqual(res.worstStageDelayHours, 60);
  assert.strictEqual(res.totalExcessDelayHours, 62);
});
