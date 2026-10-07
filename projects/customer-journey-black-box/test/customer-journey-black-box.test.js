const test = require('node:test');
const assert = require('node:assert');
const { CustomerJourneyBlackBox } = require('../src/index.js');

test('CustomerJourneyBlackBox: stitches multi-channel path correctly', () => {
  const box = new CustomerJourneyBlackBox();
  const res = box.stitchJourney([
    { timestamp: '2026-10-01T10:00:00Z', channel: 'LinkedIn Ad', action: 'CLICK' },
    { timestamp: '2026-10-03T14:00:00Z', channel: 'Email Newsletter', action: 'READ' },
    { timestamp: '2026-10-05T09:00:00Z', channel: 'Direct Sales Call', action: 'CONVERTED' }
  ]);
  assert.strictEqual(res.totalTouchpoints, 3);
  assert.strictEqual(res.firstTouchChannel, 'LinkedIn Ad');
  assert.strictEqual(res.lastTouchChannel, 'Direct Sales Call');
  assert.strictEqual(res.converted, true);
});
