// Overdue Invoice Collection Radar Engine
class InvoiceCollectionRadar {
  evaluateInvoice(invoice) {
    const { id, clientName, amount, daysOverdue } = invoice;

    let bucket = 'CURRENT';
    let tone = 'NONE';
    let suggestedAction = 'MONITOR';

    if (daysOverdue > 90) {
      bucket = '90+_DAYS_OVERDUE';
      tone = 'EXECUTIVE_LEGAL_ESCALATION';
      suggestedAction = 'PAUSE_SERVICES_AND_DEMAND_SETTLEMENT';
    } else if (daysOverdue > 60) {
      bucket = '60_DAYS_OVERDUE';
      tone = 'FIRM_PAYMENT_NOTICE';
      suggestedAction = 'DISPATCH_FIRM_REMINDER';
    } else if (daysOverdue > 30) {
      bucket = '30_DAYS_OVERDUE';
      tone = 'POLITE_FOLLOW_UP';
      suggestedAction = 'DISPATCH_FRIENDLY_STATEMENT';
    }

    return {
      invoiceId: id,
      clientName,
      amount,
      daysOverdue,
      bucket,
      tone,
      suggestedAction,
      isOverdue: daysOverdue > 0
    };
  }

  auditLedger(invoices) {
    const evaluated = invoices.map(inv => this.evaluateInvoice(inv));
    const overdue = evaluated.filter(i => i.isOverdue);
    const totalOverdueCash = overdue.reduce((sum, i) => sum + i.amount, 0);

    return {
      totalInvoices: invoices.length,
      overdueCount: overdue.length,
      totalOverdueCash,
      overdueInvoices: overdue
    };
  }
}

module.exports = { InvoiceCollectionRadar };
