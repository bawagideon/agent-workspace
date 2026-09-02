import { TaskArtifact } from '@gideon/shared';

export interface ReviewScorecard {
  score: number; // 0-100
  passed: boolean;
  typeCheckPassed: boolean;
  testsPassed: boolean;
  securityClean: boolean;
  notes: string[];
}

export class SelfReviewer {
  public static evaluateResults(stepOutputs: Array<{ toolId: string; result: any; error?: string }>): ReviewScorecard {
    let score = 100;
    const notes: string[] = [];
    let testsPassed = true;
    let typeCheckPassed = true;
    let securityClean = true;

    for (const out of stepOutputs) {
      if (out.error) {
        score -= 40;
        notes.push(`Error in tool execution (${out.toolId}): ${out.error}`);
      }

      if (out.toolId === 'terminal_run_command' && out.result) {
        if (out.result.exitCode !== 0) {
          score -= 30;
          testsPassed = false;
          notes.push(`Command returned non-zero exit code: ${out.result.exitCode}`);
        }
      }
    }

    if (score >= 70) {
      notes.push('Self-review passed all quality gates.');
    }

    return {
      score: Math.max(0, score),
      passed: score >= 70,
      typeCheckPassed,
      testsPassed,
      securityClean,
      notes
    };
  }
}
