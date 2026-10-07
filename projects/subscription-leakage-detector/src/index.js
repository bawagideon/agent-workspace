// Subscription License & Billing Leakage Detector Engine
class SubscriptionLeakageDetector {
  reconcileAccount(account) {
    const { id, companyName, billedSeats, activePlatformUsers, seatPricePerMonth } = account;
    const excessUsers = Math.max(0, activePlatformUsers - billedSeats);
    const monthlyLeakage = excessUsers * seatPricePerMonth;

    const hasLeakage = excessUsers > 0;

    return {
      accountId: id,
      companyName,
      billedSeats,
      activePlatformUsers,
      excessUsers,
      monthlyLeakage,
      annualLeakage: monthlyLeakage * 12,
      hasLeakage,
      action: hasLeakage ? 'BILL_FOR_EXCESS_SEATS_OR_REVOKE' : 'IN_COMPLIANCE'
    };
  }

  auditAllAccounts(accounts) {
    const evaluated = accounts.map(a => this.reconcileAccount(a));
    const leakingAccounts = evaluated.filter(a => a.hasLeakage);
    const totalMonthlyLeakage = leakingAccounts.reduce((sum, a) => sum + a.monthlyLeakage, 0);

    return {
      totalAccounts: accounts.length,
      leakingAccountsCount: leakingAccounts.length,
      totalMonthlyLeakage,
      totalAnnualLeakage: totalMonthlyLeakage * 12,
      leakingAccounts
    };
  }
}

module.exports = { SubscriptionLeakageDetector };
