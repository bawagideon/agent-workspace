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
        score -= 50;
        notes.push(`Error in tool execution (${out.toolId}): ${out.error}`);
      }

      if (out.toolId === 'terminal_run_command' && out.result) {
        if (out.result.exitCode !== 0) {
          score -= 50;
          testsPassed = false;
          notes.push(`Command returned non-zero exit code: ${out.result.exitCode}`);
        }
        if (out.result.stderr && /error|fatal|fail/i.test(out.result.stderr)) {
          score -= 20;
          notes.push(`Stderr output contains failure indicators: ${out.result.stderr.substring(0, 100)}`);
        }
      }
    }

    const passed = score >= 70 && testsPassed && typeCheckPassed && securityClean;

    if (passed) {
      notes.push('Self-review passed all quality gates.');
    } else {
      notes.push('Self-review failed quality gates. Rework required.');
    }

    return {
      score: Math.max(0, score),
      passed,
      typeCheckPassed,
      testsPassed,
      securityClean,
      notes
    };
  }
}
