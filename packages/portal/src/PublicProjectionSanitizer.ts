import { ProjectRecord } from '@gideon/shared';

export interface PublicProjectProjection {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: string;
  businessObjective: string;
  problemSolved?: string;
  targetCustomer?: string;
  currentVersion: string;
  pricingCents: number;
  currency: 'USD' | 'NGN';
  cashReceivedCents: number;
  settledSpendCents: number;
  previewAvailable: boolean;
  activePort?: number; // Intentionally masked/undefined in public view
}

export class PublicProjectionSanitizer {
  /**
   * Sanitizes a project record for public client presentation.
   * Strips all internal metadata, prompt instructions, memory lessons,
   * terminal commands, PIDs, internal ports, and database secrets.
   */
  public static sanitizeProject(
    project: ProjectRecord,
    options?: { hasActiveRunner?: boolean }
  ): PublicProjectProjection {
    return {
      id: project.id,
      slug: project.slug,
      name: project.name,
      category: project.category,
      status: project.status,
      businessObjective: project.businessObjective,
      problemSolved: project.problemSolved,
      targetCustomer: project.targetCustomer,
      currentVersion: project.currentVersion,
      pricingCents: project.pricingCents,
      currency: project.currency,
      cashReceivedCents: project.cashReceivedCents || 0,
      settledSpendCents: project.settledSpendCents || 0,
      previewAvailable: options?.hasActiveRunner ?? false
      // Explicitly omits:
      // - workspacePath
      // - repository
      // - activePort
      // - buildCostCents
      // - totalTokensUsed
      // - budgetCapCents
      // - reservedSpendCents
      // - paymentState
      // - stripeCustomerId
      // - metadata
    };
  }

  /**
   * Cleanses arbitrary text or HTML for display in public client portal.
   */
  public static cleanText(input: string): string {
    if (!input) return '';
    return input
      .replace(/<[^>]*>?/gm, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .trim();
  }
}
