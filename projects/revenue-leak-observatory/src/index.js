// Revenue Leak Observatory & Command Center Engine
class RevenueLeakObservatory {
  aggregateFunnelLeaks(telemetry) {
    const {
      lostLeadsValue = 0,
      ghostedQuotesValue = 0,
      checkoutAbandonmentValue = 0,
      overdueInvoicesValue = 0,
      churnAtRiskValue = 0
    } = telemetry;

    const totalBleedMonthly = lostLeadsValue + ghostedQuotesValue + checkoutAbandonmentValue + overdueInvoicesValue + churnAtRiskValue;

    const pillars = [
      { name: 'Uncontacted Inbound Leads', value: lostLeadsValue },
      { name: 'Ghosted / Unfollowed Quotes', value: ghostedQuotesValue },
      { name: 'Checkout Funnel Drop-offs', value: checkoutAbandonmentValue },
      { name: 'Aging Overdue Invoices', value: overdueInvoicesValue },
      { name: 'At-Risk Customer Churn', value: churnAtRiskValue }
    ].sort((a, b) => b.value - a.value);

    return {
      totalBleedMonthly,
      totalBleedAnnual: totalBleedMonthly * 12,
      primaryLeakPillar: pillars[0].name,
      primaryLeakAmount: pillars[0].value,
      pillars
    };
  }
}

module.exports = { RevenueLeakObservatory };
