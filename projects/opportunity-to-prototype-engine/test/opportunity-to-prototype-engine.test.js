const test = require('node:test');
const assert = require('node:assert');
const { OpportunityToPrototypeEngine } = require('../src/index.js');

test('OpportunityToPrototypeEngine: scaffolds custom client prototype', () => {
  const engine = new OpportunityToPrototypeEngine();
  const res = engine.scaffoldPrototype({
    clientName: 'Apex Dental Group',
    industry: 'Healthcare',
    coreLeak: 'Missed After-Hours Calls',
    estimatedLostMonthly: 14000
  });
  assert.strictEqual(res.prototypeSlug, 'apex-dental-group-sandbox');
  assert.strictEqual(res.status, 'PROTOTYPE_PROVISIONED');
});
