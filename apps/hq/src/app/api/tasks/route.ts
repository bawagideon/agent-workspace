import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('hq_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, tasks: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, goal, assignedAgentId, workspaceId, priority, autonomyMode } = body;

    const { data, error } = await supabase
      .from('hq_tasks')
      .insert({
        title,
        goal,
        assigned_agent_id: assignedAgentId || 'forge',
        workspace_id: workspaceId || 'ws-agent-workspace',
        priority: priority || 'MEDIUM',
        autonomy_mode: autonomyMode || 'PLAN_APPROVAL',
        status: 'CREATED'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, task: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
