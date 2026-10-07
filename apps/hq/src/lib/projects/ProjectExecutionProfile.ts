import fs from 'fs';
import path from 'path';
import { ProjectExecutionProfile } from '@gideon/shared';

export class ExecutionProfilePolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutionProfilePolicyError';
  }
}

export class ProjectExecutionProfileValidator {
  private static DISALLOWED_COMMAND_FRAGMENTS = [
    'rm -rf',
    'mkfs',
    'dd if=',
    ':(){ :|:& };:',
    '> /dev/',
    'format ',
    'shutdown',
    'powershell -c "rm',
    'del /f /s /q c:'
  ];

  /**
   * Generates a proposed execution profile for a project workspace.
   */
  public static proposeProfile(projectId: string, workspacePath: string, isNode: boolean = true): ProjectExecutionProfile {
    const candidates = [
      path.resolve(workspacePath, 'src/index.ts'),
      path.resolve(process.cwd(), workspacePath, 'src/index.ts'),
      path.resolve(process.cwd(), '../../', workspacePath, 'src/index.ts')
    ];
    const isTs = candidates.some(c => fs.existsSync(c));
    const startCmd = isTs ? 'node --import tsx/esm src/index.ts' : 'node src/index.js';

    return {
      projectId,
      allowedStartCommand: isNode ? startCmd : 'npm start',
      allowedTestCommands: isNode ? ['node --test tests/*.spec.js', 'npm test'] : ['npm test'],
      workingDirectory: workspacePath,
      environmentPolicy: ['PORT', 'NODE_ENV', 'STRIPE_PUBLIC_KEY', 'PAYSTACK_PUBLIC_KEY'],
      allowedPorts: [4100, 4199], // dynamic port block
      resourceLimits: {
        maxMemoryMb: 512,
        timeoutMs: 600000 // 10 minutes default run cap
      },
      profileVersion: 1
    };
  }

  /**
   * Validates a profile against security and isolation policies before signing.
   */
  public static validateProfile(profile: ProjectExecutionProfile): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Working directory validation
    const normalizedWd = path.normalize(profile.workingDirectory).replace(/\\/g, '/');
    if (!normalizedWd.startsWith('projects/')) {
      errors.push(`Security Violation: Working directory '${profile.workingDirectory}' must reside within projects/ boundary.`);
    }

    // 2. Start command checks
    for (const fragment of this.DISALLOWED_COMMAND_FRAGMENTS) {
      if (profile.allowedStartCommand.toLowerCase().includes(fragment)) {
        errors.push(`Dangerous start command detected containing forbidden sequence: ${fragment}`);
      }
    }

    // 3. Test command checks
    for (const cmd of profile.allowedTestCommands) {
      for (const fragment of this.DISALLOWED_COMMAND_FRAGMENTS) {
        if (cmd.toLowerCase().includes(fragment)) {
          errors.push(`Dangerous test command detected containing forbidden sequence: ${fragment}`);
        }
      }
    }

    // 4. Memory and timeout limits
    if (profile.resourceLimits.maxMemoryMb > 2048) {
      errors.push('Memory limit exceeds maximum permitted allocation of 2048 MB.');
    }
    if (profile.resourceLimits.timeoutMs > 3600000) {
      errors.push('Process execution timeout exceeds maximum permitted limit of 1 hour.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Signs and approves an execution profile.
   */
  public static approveProfile(profile: ProjectExecutionProfile, approver: string = 'sentinel'): ProjectExecutionProfile {
    const { valid, errors } = this.validateProfile(profile);
    if (!valid) {
      throw new ExecutionProfilePolicyError(`Profile validation failed: ${errors.join('; ')}`);
    }

    return {
      ...profile,
      approvedAt: new Date().toISOString(),
      approvedBy: approver
    };
  }

  /**
   * Authoritative gate: verifies whether a command is permitted to execute against an execution profile.
   */
  public static verifyExecutionPermitted(
    profile: ProjectExecutionProfile | undefined | null,
    command: string
  ): { permitted: boolean; reason?: string } {
    if (!profile) {
      return { permitted: false, reason: 'Missing execution profile: execution rejected' };
    }

    const validation = this.validateProfile(profile);
    if (!validation.valid) {
      return { permitted: false, reason: `Invalid profile: ${validation.errors.join('; ')}` };
    }

    if (!profile.approvedAt || !profile.approvedBy) {
      return { permitted: false, reason: 'Profile is unapproved: requires authority approval before execution' };
    }

    const trimmedCmd = command.trim();
    const isStartCmd = trimmedCmd === profile.allowedStartCommand.trim();
    const isTestCmd = profile.allowedTestCommands.some(allowed => {
      const allowedTrimmed = allowed.trim();
      if (allowedTrimmed === trimmedCmd) return true;
      if (allowedTrimmed.includes('*')) {
        const prefix = allowedTrimmed.split('*')[0];
        return trimmedCmd.startsWith(prefix);
      }
      return false;
    });

    if (!isStartCmd && !isTestCmd) {
      return {
        permitted: false,
        reason: `Unauthorized command: '${command}' is not in the approved start or test command whitelist`
      };
    }

    return { permitted: true };
  }
}

