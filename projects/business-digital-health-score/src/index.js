// Business Digital Health & Friction Auditor Engine
class BusinessDigitalHealthScore {
  auditBusiness(metrics) {
    const {
      mobileScore = 80,
      leadResponseMinutes = 45,
      hasSSL = true,
      hasStickyCTA = true,
      formFieldCount = 5
    } = metrics;

    let compositeScore = 100;
    const deductions = [];

    if (mobileScore < 70) {
      compositeScore -= 25;
      deductions.push('POOR_MOBILE_PERFORMANCE');
    }
    if (leadResponseMinutes > 15) {
      compositeScore -= 30;
      deductions.push('SLOW_LEAD_RESPONSE_SLA');
    }
    if (!hasSSL) {
      compositeScore -= 20;
      deductions.push('MISSING_SSL_SECURITY');
    }
    if (!hasStickyCTA) {
      compositeScore -= 10;
      deductions.push('MISSING_PERSISTENT_CTA');
    }
    if (formFieldCount > 6) {
      compositeScore -= 15;
      deductions.push('FORM_FRICTION_EXCESS_FIELDS');
    }

    const finalScore = Math.max(0, compositeScore);

    return {
      digitalHealthScore: finalScore,
      rating: finalScore >= 80 ? 'GRADE_A_OPTIMIZED' : (finalScore >= 50 ? 'GRADE_C_AT_RISK' : 'GRADE_F_CRITICAL_LEAKS'),
      deductionsCount: deductions.length,
      deductions
    };
  }
}

module.exports = { BusinessDigitalHealthScore };
