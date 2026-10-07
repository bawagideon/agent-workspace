import { NextResponse } from 'next/server';
import { getOrGenerateStoryPack, generateStoryPackForProject } from '@/lib/story-pack';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || 'webhook-billing-bridge';
    const regenerate = searchParams.get('regenerate') === 'true';

    const pack = getOrGenerateStoryPack(projectId, regenerate);

    return NextResponse.json({
      success: true,
      storyPack: pack
    });
  } catch (err: any) {
    console.error('[API /api/story-pack GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch story pack' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projectId = body.projectId || 'webhook-billing-bridge';

    const pack = generateStoryPackForProject(projectId);

    return NextResponse.json({
      success: true,
      storyPack: pack
    });
  } catch (err: any) {
    console.error('[API /api/story-pack POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate story pack' },
      { status: 500 }
    );
  }
}
