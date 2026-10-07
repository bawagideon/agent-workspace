import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { 
  OpportunityRecord, 
  DeliveryVehicle, 
  MissionContract 
} from '@gideon/shared';
import { MissionEngine, Mission, MissionStep } from './MissionEngine';
import { OpportunityMemory } from '@gideon/memory';

export class MissionConverter {
  constructor(
    private missionEngine?: any,
    private opportunityMemory?: OpportunityMemory,
    private workspaceRoot: string = process.cwd()
  ) {
    if (typeof missionEngine === 'string') {
      this.workspaceRoot = missionEngine;
      this.missionEngine = undefined;
    }
  }

  public selectVehicle(opportunity: OpportunityRecord): DeliveryVehicle {
    return this.selectDeliveryVehicle(opportunity);
  }

  public convertToMissionContract(opportunity: OpportunityRecord): any {
    return this.generateContract(opportunity);
  }

  /**
   * Selects the optimal Delivery Vehicle for the opportunity.
   * Prevents system bias toward "everything is a website or freelance job".
   */
  public selectDeliveryVehicle(opportunity: OpportunityRecord): DeliveryVehicle {
    if (opportunity.deliveryVehicle) {
      return opportunity.deliveryVehicle;
    }

    const title = opportunity.title.toLowerCase();
    const desc = (opportunity.description || '').toLowerCase();
    const type = opportunity.type;

    if (type === 'PRODUCT' || type === 'SAAS' || title.includes('saas') || (opportunity.estimatedRecurringRevenueCents && opportunity.estimatedRecurringRevenueCents > 0)) {
      return 'MICRO_SAAS';
    }
    if (type === 'TEMPLATE' || title.includes('template') || title.includes('boilerplate')) {
      return 'TEMPLATE';
    }
    if (type === 'API_SERVICE' || title.includes('api') || desc.includes('rest api')) {
      return 'API_SERVICE';
    }
    if (type === 'AUTOMATION' || title.includes('automation') || title.includes('bot') || title.includes('script')) {
      return 'AUTOMATION';
    }
    if (type === 'CONTENT' || title.includes('report') || title.includes('content')) {
      return 'CONTENT';
    }

    return 'FREELANCE_DELIVERY';
  }

  /**
   * Converts a validated opportunity into an immutable, bounded MissionContract.
   */
  public generateContract(opportunity: OpportunityRecord): MissionContract {
    const vehicle = this.selectDeliveryVehicle(opportunity);
    opportunity.deliveryVehicle = vehicle;

    const sandboxPath = path.join(this.workspaceRoot, 'fixtures', 'sandboxes', 'missions', opportunity.id);
    if (!fs.existsSync(sandboxPath)) {
      fs.mkdirSync(sandboxPath, { recursive: true });
    }

    // Initialize sandbox scaffold
    const readmePath = path.join(sandboxPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(
        readmePath,
        `# Deliverable: ${opportunity.title}\n\nVehicle: ${vehicle}\nObjective: ${opportunity.description || opportunity.title}\n`,
        'utf8'
      );
    }

    return {
      id: `mcontract-${opportunity.id}-${Date.now()}`,
      opportunityId: opportunity.id,
      objective: `Build and verify ${vehicle} deliverable for: "${opportunity.title}"`,
      deliveryVehicle: vehicle,
      sandboxPath,
      isolatedSandboxDir: sandboxPath,
      allowedDomains: ['WORK'],
      budgetLimitCents: 200, // $2.00 maximum execution budget
      spendCapCents: 200,
      maxRuntimeMinutes: 30,
      allowedTools: ['fs_read_file', 'fs_write_file', 'fs_list_dir', 'execute_command', 'test_run'],
      forbiddenTools: [
        'sessions_send',
        'email_send',
        'channel_post',
        'deploy_production',
        'execute_payment'
      ],
      sentinelAcceptanceScore: 90, // Strict QA threshold
      sentinelQaThreshold: 90,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Translates the MissionContract into an executable DAG on the existing MissionEngine.
   * Zero duplicate runtime: leverages verified Forge, Sentinel, Ledger, and Release machinery!
   */
  public convertToMission(
    opportunity: OpportunityRecord,
    contract?: MissionContract
  ): { contract: MissionContract; mission: Mission } {
    const activeContract = contract || this.generateContract(opportunity);

    const missionId = `mission-${opportunity.id}`;

    const steps: MissionStep[] = [
      {
        id: `${missionId}-step-1-forge`,
        assignedAgentId: 'forge',
        title: `Forge: Build ${activeContract.deliveryVehicle} Prototype`,
        goal: activeContract.objective,
        dependencies: [],
        status: 'PENDING'
      },
      {
        id: `${missionId}-step-2-sentinel`,
        assignedAgentId: 'sentinel',
        title: 'Sentinel: Independent Adversarial QA Audit',
        goal: `Audit build in ${activeContract.sandboxPath}. Scorecard must achieve >= ${activeContract.sentinelAcceptanceScore}/100.`,
        dependencies: [`${missionId}-step-1-forge`],
        status: 'PENDING'
      },
      {
        id: `${missionId}-step-3-ledger`,
        assignedAgentId: 'ledger',
        title: 'Ledger: Economic Rationality & Margin Validation',
        goal: `Calculate variable token cost against estimated revenue of $${(opportunity.estimatedValueCents / 100).toFixed(2)}.`,
        dependencies: [`${missionId}-step-2-sentinel`],
        status: 'PENDING'
      },
      {
        id: `${missionId}-step-4-outreach`,
        assignedAgentId: 'release',
        title: 'Outreach: Package Deliverable & Gated Proposal',
        goal: `Assemble client deliverable and submit for human authorization via phone.`,
        dependencies: [`${missionId}-step-3-ledger`],
        status: 'PENDING',
        requiresApproval: true
      }
    ];

    const mission = this.missionEngine.createMission({
      id: missionId,
      title: `${activeContract.deliveryVehicle}: ${opportunity.title}`,
      objective: activeContract.objective,
      orchestratorId: 'atlas',
      budgetLimitCents: activeContract.budgetLimitCents,
      steps,
      opportunityId: opportunity.id
    });

    opportunity.missionId = mission.id;
    opportunity.status = 'MISSION_READY';

    this.opportunityMemory?.recordTransition(
      opportunity.id,
      'MISSION_READY',
      'mission_converter',
      `Converted to Bounded Mission Contract [${activeContract.id}]. Vehicle: ${activeContract.deliveryVehicle}.`
    );

    this.opportunityMemory?.saveOpportunity(opportunity);

    return { contract: activeContract, mission };
  }
}
