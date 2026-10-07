// Internal IT & Ops Request Router Engine
class InternalRequestRouter {
  routeRequest(rawMessage) {
    const text = (rawMessage || '').toLowerCase();

    let department = 'GENERAL_OPERATIONS';
    let urgency = 'NORMAL';

    if (text.includes('vpn') || text.includes('laptop') || text.includes('password') || text.includes('access') || text.includes('figma')) {
      department = 'IT_SUPPORT';
    } else if (text.includes('contract') || text.includes('nda') || text.includes('legal') || text.includes('dpa')) {
      department = 'LEGAL';
    } else if (text.includes('invoice') || text.includes('reimbursement') || text.includes('expense') || text.includes('stripe')) {
      department = 'FINANCE';
    } else if (text.includes('pto') || text.includes('leave') || text.includes('salary') || text.includes('onboard')) {
      department = 'HR';
    }

    if (text.includes('urgent') || text.includes('asap') || text.includes('blocking client') || text.includes('outage')) {
      urgency = 'HIGH_URGENCY';
    }

    return {
      department,
      urgency,
      assignedSLAHours: urgency === 'HIGH_URGENCY' ? 2 : 24,
      targetChannel: `#ops-${department.toLowerCase()}`,
      status: 'AUTO_ROUTED'
    };
  }
}

module.exports = { InternalRequestRouter };
