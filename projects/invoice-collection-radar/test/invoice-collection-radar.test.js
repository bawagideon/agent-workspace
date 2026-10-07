const test = require('node:test');
const assert = require('node:assert');
const { InvoiceCollectionRadar } = require('../src/index.js');

test('InvoiceCollectionRadar: classifies aging invoices correctly', () => {
  const radar = new InvoiceCollectionRadar();
  const inv1 = radar.evaluateInvoice({ id: 'inv1', clientName: 'Corp A', amount: 5000, daysOverdue: 95 });
  assert.strictEqual(inv1.bucket, '90+_DAYS_OVERDUE');
  assert.strictEqual(inv1.suggestedAction, 'PAUSE_SERVICES_AND_DEMAND_SETTLEMENT');

  const inv2 = radar.evaluateInvoice({ id: 'inv2', clientName: 'Corp B', amount: 2000, daysOverdue: 35 });
  assert.strictEqual(inv2.bucket, '30_DAYS_OVERDUE');
  assert.strictEqual(inv2.tone, 'POLITE_FOLLOW_UP');
});
