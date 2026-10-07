import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ProjectRegistry } from '@/lib/projects/ProjectRegistry';
import { SecretProtection } from '@gideon/policy';

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || 
  (process.cwd().includes('apps') ? path.resolve(process.cwd(), '../..') : process.cwd());

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const subPath = searchParams.get('path') || '';

    const registry = ProjectRegistry.getInstance();
    const project = await registry.getProject(id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const projectCanonicalRoot = fs.realpathSync(path.join(WORKSPACE_ROOT, project.workspacePath));

    // Resolve target path safely
    const targetAbs = path.normalize(path.join(projectCanonicalRoot, subPath));

    // 1. Boundary & Path Traversal Check
    const relative = path.relative(projectCanonicalRoot, targetAbs);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return NextResponse.json({ success: false, error: 'Security Violation: Path traversal blocked' }, { status: 403 });
    }

    if (!fs.existsSync(targetAbs)) {
      return NextResponse.json({ success: false, error: 'Path not found' }, { status: 404 });
    }

    const canonicalTarget = fs.realpathSync(targetAbs);
    const canonicalRelative = path.relative(projectCanonicalRoot, canonicalTarget);
    if (canonicalRelative.startsWith('..') || path.isAbsolute(canonicalRelative)) {
      return NextResponse.json({ success: false, error: 'Security Violation: Symlink escapes workspace root' }, { status: 403 });
    }

    const stat = fs.statSync(canonicalTarget);

    if (stat.isDirectory()) {
      // List Directory
      const entries = fs.readdirSync(canonicalTarget, { withFileTypes: true });
      const files = entries
        .filter(e => e.name !== 'node_modules' && e.name !== '.git')
        .map(e => {
          const itemRelative = path.relative(projectCanonicalRoot, path.join(canonicalTarget, e.name)).replace(/\\/g, '/');
          const isSecret = SecretProtection.isSecretFile(itemRelative);
          return {
            name: e.name,
            isDirectory: e.isDirectory(),
            path: itemRelative,
            size: e.isDirectory() ? 0 : fs.statSync(path.join(canonicalTarget, e.name)).size,
            isSecret
          };
        });

      return NextResponse.json({
        success: true,
        isDirectory: true,
        currentPath: subPath,
        files
      });
    } else {
      // File Read with Security Defense & Secret Redaction
      if (SecretProtection.isSecretFile(subPath)) {
        return NextResponse.json({ success: false, error: 'Security Violation: Access to secret/credential file denied' }, { status: 403 });
      }

      if (stat.size > 2 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'File too large to preview (>2MB)' }, { status: 400 });
      }

      const rawContent = fs.readFileSync(canonicalTarget, 'utf8');
      const safeContent = SecretProtection.redactSecrets(rawContent);

      return NextResponse.json({
        success: true,
        isDirectory: false,
        path: subPath,
        size: stat.size,
        content: safeContent
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
