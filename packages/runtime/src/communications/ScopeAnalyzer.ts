import { ScopeAnalysisResult } from '@gideon/shared';

export interface ScopeFeatureItem {
  name: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ScopeDeltaDetails {
  identifiedFeatures: ScopeFeatureItem[];
  isExpansion: boolean;
  scopeDelta: string;
  recommendation: 'REWORK' | 'CHANGE_ORDER' | 'PROCEED';
}

export class ScopeAnalyzer {
  public analyze(requestedText: string, approvedScopeBaseline: string[] = []): ScopeDeltaDetails {
    const lower = requestedText.toLowerCase();
    const identifiedFeatures: ScopeFeatureItem[] = [];

    if (lower.includes('slack')) {
      identifiedFeatures.push({ name: 'Slack Integration', complexity: 'MEDIUM' });
    }
    if (lower.includes('oauth')) {
      identifiedFeatures.push({ name: 'OAuth2 Authentication', complexity: 'HIGH' });
    }
    if (lower.includes('csv') || lower.includes('export')) {
      identifiedFeatures.push({ name: 'CSV Export', complexity: 'LOW' });
    }
    if (lower.includes('discord')) {
      identifiedFeatures.push({ name: 'Discord Webhook', complexity: 'MEDIUM' });
    }
    if (lower.includes('teams')) {
      identifiedFeatures.push({ name: 'MS Teams Adapter', complexity: 'HIGH' });
    }

    const isExpansion = identifiedFeatures.length > 0;

    return {
      identifiedFeatures,
      isExpansion,
      scopeDelta: identifiedFeatures.map(f => f.name).join(', ') || 'General Scope Expansion',
      recommendation: isExpansion ? 'CHANGE_ORDER' : 'PROCEED'
    };
  }
}
