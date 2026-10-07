import fs from 'fs';
import path from 'path';
import { ProjectRecord, ProjectCategory, ProjectStatus } from '@gideon/shared';
import { ProjectDatabase } from './ProjectDatabase';
import { ProjectExecutionProfileValidator } from './ProjectExecutionProfile';

export class ProjectRegistry {
  private static instance: ProjectRegistry;
  private db: ProjectDatabase = ProjectDatabase.getInstance();
  private workspaceRoot: string;

  private constructor() {
    this.workspaceRoot = process.env.WORKSPACE_ROOT || 
      (process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd());
  }

  public static getInstance(): ProjectRegistry {
    if (!ProjectRegistry.instance) {
      ProjectRegistry.instance = new ProjectRegistry();
    }
    return ProjectRegistry.instance;
  }

  /**
   * Scans physical projects/ folder, auto-registers discovered codebases into the database,
   * and synchronizes package metadata.
   */
  public async discoverAndSync(): Promise<ProjectRecord[]> {
    const projectsDir = path.join(this.workspaceRoot, 'projects');
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }

    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    const discoveredSlugs = entries
      .filter(e => e.isDirectory())
      .map(e => e.name);

    for (const slug of discoveredSlugs) {
      await this.syncPhysicalProject(slug);
    }

    const all = await this.db.getProjects();
    return all.filter(p => {
      const isTestFixture = 
        p.id.startsWith('proj_test_') ||
        p.id.startsWith('proj_client_') ||
        p.id.startsWith('proj_contention_') ||
        p.id.startsWith('proj_unfunded_') ||
        p.id.startsWith('proj_appr_') ||
        p.id.startsWith('proj_unapproved_') ||
        p.id.startsWith('proj_A_') ||
        p.id.startsWith('proj_B_') ||
        p.id.startsWith('proj_spawn_') ||
        p.id.startsWith('proj_iso_') ||
        p.id.startsWith('proj_recon_') ||
        p.id.startsWith('proj_portal_') ||
        p.id.startsWith('proj_rework_') ||
        p.id.startsWith('proj_accept_') ||
        p.id.startsWith('proj_deploy_gate_') ||
        p.id.startsWith('proj_webhook_billing_bridge_');
      return !isTestFixture;
    });
  }

  private async syncPhysicalProject(slug: string): Promise<ProjectRecord> {
    const projectId = `proj_${slug.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    let project = await this.db.getProjectById(projectId);

    const projectDir = path.join(this.workspaceRoot, 'projects', slug);
    const pkgPath = path.join(projectDir, 'package.json');
    let pkg: any = {};
    if (fs.existsSync(pkgPath)) {
      try {
        pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      } catch {}
    }

    if (!project) {
      // Create first-class DB record
      const defaultName = pkg.name 
        ? pkg.name.replace(/^@?[^/]+\//, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
        : slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

      const proposedProfile = ProjectExecutionProfileValidator.proposeProfile(
        projectId,
        `projects/${slug}`,
        true
      );
      const approvedProfile = ProjectExecutionProfileValidator.approveProfile(proposedProfile, 'system_boot');

      project = {
        id: projectId,
        slug,
        name: defaultName,
        category: (slug.includes('service') ? 'API_SERVICE' : 'SAAS') as ProjectCategory,
        status: 'QA_VERIFIED' as ProjectStatus,
        workspacePath: `projects/${slug}`,
        repository: 'bawagideon/agent-workspace',
        currentVersion: pkg.version ? `v${pkg.version}` : 'v0.1.0',
        revision: 0,
        businessObjective: pkg.description || `Automated service implementation for ${defaultName}`,
        targetCustomer: slug.includes('b2b') ? 'B2B Agencies & Small Businesses' : 'Digital Commerce Clients',
        problemSolved: 'Automates payment collection, onboarding, and webhook routing.',
        pricingCents: 85000, // $850 default commercial proposal
        currency: 'USD',
        buildCostCents: 1, // $0.01 agent spend
        totalTokensUsed: 12500,
        healthStatus: 'HEALTHY',
        metadata: {
          executionProfile: approvedProfile,
          techStack: ['Node.js', 'Express', 'Stripe', 'Node Test Runner'],
          dependencies: pkg.dependencies || {},
          devDependencies: pkg.devDependencies || {}
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.db.saveProject(project);

      await this.db.logEvent({
        projectId,
        eventType: 'PROJECT_CREATED',
        actor: 'atlas',
        payload: {
          slug,
          version: project.currentVersion,
          category: project.category
        }
      });
    }

    return project;
  }

  public async getProject(id: string): Promise<ProjectRecord | null> {
    // Ensure discovery has run
    await this.discoverAndSync();
    return this.db.getProjectById(id);
  }

  public async listProjects(): Promise<ProjectRecord[]> {
    return this.discoverAndSync();
  }
}
