import { NextResponse } from 'next/server';
import { EvidenceExtractor, StoryPackGenerator } from '@gideon/runtime';
import path from 'path';
import fs from 'fs';

function getWorkspaceRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..')
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'projects')) && fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
  }
  return process.cwd();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || 'webhook-billing-bridge';

    const root = getWorkspaceRoot();
    const projectPath = path.join(root, 'projects', projectId);
    
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json(
        { success: false, error: `Project path '${projectPath}' does not exist.` },
        { status: 404 }
      );
    }

    const extractor = new EvidenceExtractor(path.join(root, '.gideon', 'evidence'));
    const evidence = extractor.extractFromProject(projectPath);

    const storyGen = new StoryPackGenerator();
    const pack = storyGen.generateStoryPack(evidence, {
      outputDir: path.join(root, 'fixtures', 'story', projectId),
      publicDir: path.join(root, 'apps', 'hq', 'public', 'story', projectId)
    });

    return NextResponse.json({
      success: true,
      storyPack: pack
    });
  } catch (err: any) {
    console.error('Error generating story pack:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate story pack' },
      { status: 500 }
    );
  }
}
