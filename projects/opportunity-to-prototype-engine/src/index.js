// Opportunity-to-Prototype Scaffolding Engine
class OpportunityToPrototypeEngine {
  scaffoldPrototype(opportunity) {
    const { clientName, industry, coreLeak, estimatedLostMonthly } = opportunity;
    const prototypeSlug = clientName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-sandbox';

    return {
      clientName,
      industry,
      coreLeak,
      estimatedLostMonthly,
      prototypeSlug,
      sandboxUrl: `https://gideonbawa-website.netlify.app/simulators/${prototypeSlug}/`,
      status: 'PROTOTYPE_PROVISIONED',
      generatedInMs: 420
    };
  }
}

module.exports = { OpportunityToPrototypeEngine };
