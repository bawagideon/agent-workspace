export type PersonalDomain = 
  | 'WORK' 
  | 'BUSINESS' 
  | 'SOCIAL' 
  | 'FINANCE' 
  | 'PERSONAL_ADMIN';

export type ActionTier = 'READ' | 'ANALYZE' | 'PREPARE' | 'ACT';

export type SensitivityLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export interface ContextRecord {
  id: string;
  domain: PersonalDomain;
  subject: string;
  value: Record<string, any> | string;
  sensitivity: SensitivityLevel;
  allowedAgents: string[]; // Agent IDs or ['*']
  allowedActions: ActionTier[];
  requiresHumanApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DomainPermissionCheck {
  isPermitted: boolean;
  requiresApproval: boolean;
  approvalReason?: string;
  denialReason?: string;
}

export class PersonalContextEngine {
  private records: Map<string, ContextRecord> = new Map();

  constructor() {
    this.initializeDefaultContexts();
  }

  /**
   * Initializes default domain partitions according to the Domain Permissions Matrix.
   */
  private initializeDefaultContexts(): void {
    // 1. WORK Domain (Code repos, issues, architecture, test runs)
    this.setContextRecord({
      domain: 'WORK',
      subject: 'Primary Architecture and Codebases',
      value: {
        activeRepositories: ['agent-workspace', 'sample-app'],
        defaultLanguage: 'TypeScript',
        targetRuntime: 'Node.js 20'
      },
      sensitivity: 'INTERNAL',
      allowedAgents: ['atlas', 'forge', 'sentinel', 'release'],
      allowedActions: ['READ', 'ANALYZE', 'PREPARE', 'ACT'],
      requiresHumanApproval: false // Prep is auto; production deploy ACT handled by RiskEngine
    });

    // 2. BUSINESS Domain (Upwork/GitHub bounties, market rates, RFP analysis)
    this.setContextRecord({
      domain: 'BUSINESS',
      subject: 'Market Opportunity and Client Leads',
      value: {
        targetSkills: ['TypeScript', 'Next.js', 'AI Agents', 'Automation'],
        minBountyCents: 5000, // $50 minimum
        contractHourlyRateCents: 15000 // $150/hr target
      },
      sensitivity: 'CONFIDENTIAL',
      allowedAgents: ['atlas', 'scout', 'ledger'],
      allowedActions: ['READ', 'ANALYZE', 'PREPARE'], // 'ACT' (submitting contracts) requires ALWAYS_ASK
      requiresHumanApproval: true
    });

    // 3. SOCIAL Domain (Audience analytics, trends, content strategy)
    this.setContextRecord({
      domain: 'SOCIAL',
      subject: 'Social Strategy and Content Pipeline',
      value: {
        channels: ['Twitter/X', 'LinkedIn', 'YouTube'],
        brandTone: 'Deep engineering, truth-focused, high precision',
        draftCadenceDays: 2
      },
      sensitivity: 'INTERNAL',
      allowedAgents: ['atlas', 'scout'],
      allowedActions: ['READ', 'ANALYZE', 'PREPARE'], // 'ACT' (live posting) requires ALWAYS_ASK
      requiresHumanApproval: true
    });

    // 4. FINANCE Domain (Ledger transactions, token costs, cash burn, margins)
    this.setContextRecord({
      domain: 'FINANCE',
      subject: 'Financial Ledger & Budget Policies',
      value: {
        monthlyBudgetLimitCents: 100000, // $1,000 cap
        hardStopThresholdPercent: 95,
        defaultMissionBudgetCapCents: 2500, // $25
        currency: 'USD'
      },
      sensitivity: 'RESTRICTED',
      allowedAgents: ['atlas', 'ledger'],
      allowedActions: ['READ', 'ANALYZE'], // 'ACT' (money movement) is NEVER automated
      requiresHumanApproval: true
    });

    // 5. PERSONAL_ADMIN Domain (Preferences, operating hours, whitelist)
    this.setContextRecord({
      domain: 'PERSONAL_ADMIN',
      subject: 'Personal User Operating Preferences',
      value: {
        operatingHours: '09:00-21:00 UTC+1',
        notificationChannel: 'telegram',
        authorizedPhone: '+10000000000',
        approvalTimeoutHours: 24
      },
      sensitivity: 'RESTRICTED',
      allowedAgents: ['atlas'],
      allowedActions: ['READ', 'ANALYZE'],
      requiresHumanApproval: true
    });
  }

  public setContextRecord(data: Omit<ContextRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): ContextRecord {
    const id = data.id || `ctx-${data.domain.toLowerCase()}-${Date.now()}`;
    const record: ContextRecord = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.records.set(id, record);
    return record;
  }

  public getRecord(id: string): ContextRecord | undefined {
    return this.records.get(id);
  }

  /**
   * Principle of Least Privilege: Returns only records in the specified domain
   * that the requesting agent is permitted to see.
   */
  public getContextForAgent(agentId: string, domain?: PersonalDomain): ContextRecord[] {
    const records = Array.from(this.records.values());

    return records.filter((r) => {
      // 1. Domain filter if provided
      if (domain && r.domain !== domain) {
        return false;
      }

      // 2. Check if agent is allowed
      const isAllowedAgent = r.allowedAgents.includes('*') || r.allowedAgents.includes(agentId.toLowerCase());
      return isAllowedAgent;
    });
  }

  /**
   * Evaluates if an agent can perform a specific tier of action in a domain.
   * Enforces the Strict Domain Security & Financial Invariant.
   */
  public evaluateActionPermission(
    agentId: string,
    domain: PersonalDomain,
    actionTier: ActionTier
  ): DomainPermissionCheck {
    // 1. Rule of Iron: Money movement is NEVER automated
    if (domain === 'FINANCE' && actionTier === 'ACT') {
      return {
        isPermitted: false,
        requiresApproval: true,
        denialReason: 'Financial Rule of Iron: Automated outgoing payments or money movement are permanently forbidden without explicit human authorization (ALWAYS_ASK).'
      };
    }

    // 2. Outbound Social/Public publishing requires human approval
    if (domain === 'SOCIAL' && actionTier === 'ACT') {
      return {
        isPermitted: true,
        requiresApproval: true,
        approvalReason: 'Social Domain Policy: Public post publishing requires human verification.'
      };
    }

    // 3. Submitting binding business proposals requires human approval
    if (domain === 'BUSINESS' && actionTier === 'ACT') {
      return {
        isPermitted: true,
        requiresApproval: true,
        approvalReason: 'Business Domain Policy: Submitting binding contracts requires human review.'
      };
    }

    // 4. Check domain context records for the agent's rights
    const records = this.getContextForAgent(agentId, domain);
    if (records.length === 0) {
      return {
        isPermitted: false,
        requiresApproval: false,
        denialReason: `Agent '${agentId}' has no granted permissions in domain '${domain}'. Data firewall active.`
      };
    }

    // Check if any record in this domain permits the action tier
    const actionAllowed = records.some((r) => r.allowedActions.includes(actionTier));
    if (!actionAllowed) {
      return {
        isPermitted: false,
        requiresApproval: false,
        denialReason: `Agent '${agentId}' is not authorized for '${actionTier}' actions in '${domain}'.`
      };
    }

    // Check if human approval is required for this action tier
    const requiresApproval = actionTier === 'ACT' || records.some((r) => r.requiresHumanApproval && actionTier === 'PREPARE');

    return {
      isPermitted: true,
      requiresApproval,
      approvalReason: requiresApproval ? `Human signoff required for ${actionTier} action in ${domain}` : undefined
    };
  }

  /**
   * Sanitizes personal context for injection into LLM prompts.
   * Strips restricted fields and formats safe markdown bullet points.
   */
  public buildSanitizedPromptContext(agentId: string, domain?: PersonalDomain): string {
    const accessible = this.getContextForAgent(agentId, domain);
    if (accessible.length === 0) {
      return '';
    }

    const lines: string[] = ['### Personal Operating Context (Domain-Scoped):'];
    for (const record of accessible) {
      lines.push(`- **[${record.domain}] ${record.subject}**:`);
      if (typeof record.value === 'object') {
        for (const [key, val] of Object.entries(record.value)) {
          lines.push(`  • ${key}: ${JSON.stringify(val)}`);
        }
      } else {
        lines.push(`  • ${record.value}`);
      }
    }

    return lines.join('\n');
  }

  public getAllRecords(): ContextRecord[] {
    return Array.from(this.records.values());
  }
}
