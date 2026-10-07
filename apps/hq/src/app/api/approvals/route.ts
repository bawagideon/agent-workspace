import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

function getWorkspaceRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..')
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'scripts')) && fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
  }
  return process.cwd();
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('hq_approvals')
      .select('*, hq_tasks(title)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const approvals = (data || []).map((item: any) => ({
      ...item,
      task_title: item.hq_tasks?.title || item.task_title || `Task #${item.task_id?.slice(0, 8) || 'unknown'}`
    }));

    return NextResponse.json({ success: true, approvals });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { approvalId, decision, reviewerNotes } = body;

    if (!approvalId || !decision) {
      return NextResponse.json(
        { success: false, error: 'Missing approvalId or decision.' },
        { status: 400 }
      );
    }

    // 1. Fetch current approval record
    const { data: approval, error: fetchErr } = await supabaseAdmin
      .from('hq_approvals')
      .select('*')
      .eq('id', approvalId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }

    if (!approval) {
      return NextResponse.json(
        { success: false, error: `Approval record ${approvalId} not found.` },
        { status: 404 }
      );
    }

    // 2. If decision is REJECTED, record and return immediately
    if (decision === 'REJECTED') {
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('hq_approvals')
        .update({
          status: 'REJECTED',
          reviewer_notes: reviewerNotes || 'Rejected by operator in HQ Approval Center',
          resolved_at: new Date().toISOString()
        })
        .eq('id', approvalId)
        .select()
        .maybeSingle();

      if (updateErr) {
        return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        approval: updated,
        message: 'Plan rejected.'
      });
    }

    // 3. If decision is APPROVED:
    let executionOutput = '';
    if (approval.command_preview && approval.command_preview.trim()) {
      const rootDir = getWorkspaceRoot();
      console.log(`[APPROVALS API] Executing authorized command in ${rootDir}:`, approval.command_preview);

      try {
        const { stdout, stderr } = await execAsync(approval.command_preview, {
          cwd: rootDir,
          env: process.env,
          timeout: 60000
        });

        executionOutput = stdout || stderr || 'Command executed cleanly.';
        console.log(`[APPROVALS API] Command execution output:\n`, executionOutput);
      } catch (execErr: any) {
        console.error(`[APPROVALS API] Command execution notice/error:`, execErr);
        executionOutput = `[Notice]: ${execErr.stdout || execErr.stderr || execErr.message}`;
      }
    }

    // 4. Update status to APPROVED with execution audit trail
    const combinedNotes = [
      reviewerNotes || 'Authorized via HQ Web Approval Center',
      executionOutput ? `\n[Execution Log]:\n${executionOutput.slice(0, 2000)}` : ''
    ].filter(Boolean).join('\n');

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('hq_approvals')
      .update({
        status: 'APPROVED',
        reviewer_notes: combinedNotes,
        resolved_at: new Date().toISOString()
      })
      .eq('id', approvalId)
      .select()
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      approval: updated,
      execution: {
        command: approval.command_preview,
        output: executionOutput
      }
    });
  } catch (err: any) {
    console.error('[APPROVALS API] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
