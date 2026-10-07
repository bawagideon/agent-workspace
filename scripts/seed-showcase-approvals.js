const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/hq/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: existingTask } = await supabase
    .from('hq_tasks')
    .select('id')
    .eq('title', 'Engineering Showcase: Webhook Billing Bridge Delivery')
    .maybeSingle();

  let taskId = existingTask?.id;
  if (!taskId) {
    const { data: newTask, error: taskErr } = await supabase.from('hq_tasks').insert({
      workspace_id: 'ws-agent-workspace',
      title: 'Engineering Showcase: Webhook Billing Bridge Delivery',
      goal: 'Extract verification evidence, project into 3D portfolio, and execute human-gated deployment across GitHub, Netlify, and LinkedIn.',
      assigned_agent_id: 'sentinel',
      department: 'ENGINEERING',
      priority: 'P1_HIGH',
      autonomy_mode: 'SUPERVISED',
      status: 'IN_PROGRESS',
      result_summary: 'Claims validated with zero hype. Gates 1 & 2 authorized by operator.'
    }).select().single();

    if (taskErr) {
      console.error('Task error:', taskErr);
      return;
    }
    taskId = newTask.id;
  }
  console.log('Task ID:', taskId);

  // Check if approvals already exist for this task
  const { data: existingApps } = await supabase
    .from('hq_approvals')
    .select('id, description')
    .eq('task_id', taskId);

  if (existingApps && existingApps.length > 0) {
    console.log('Approvals already exist for this task:', existingApps.length);
    return;
  }

  const now = new Date().toISOString();
  const approvalsToInsert = [
    {
      task_id: taskId,
      agent_id: 'forge',
      workspace_id: 'ws-agent-workspace',
      risk_level: 'MEDIUM',
      approval_mode: 'ALWAYS_ASK',
      action_type: 'GIT_PUSH',
      description: 'Gate 1: Authorize pushing packaged repository, 5 semantic commits, and CI workflow to public GitHub at https://github.com/bawagideon/webhook-billing-bridge.git',
      command_preview: 'git remote add origin https://github.com/bawagideon/webhook-billing-bridge.git && git push -u origin main',
      status: 'APPROVED',
      reviewer_notes: 'Authorized by operator Gideon Bawa in HQ chat session: "for gate 1 and 2 they are approved by me so far they are highest quality code then yes"',
      resolved_at: now
    },
    {
      task_id: taskId,
      agent_id: 'sentinel',
      workspace_id: 'ws-agent-workspace',
      risk_level: 'MEDIUM',
      approval_mode: 'ALWAYS_ASK',
      action_type: 'DEPLOY',
      description: 'Gate 2: Authorize committing modernized portfolio UI and pushing to my-3d-portfolio-main to trigger Netlify production deployment.',
      command_preview: 'git commit -m "feat(portfolio): modernize projects showcase UI with flagship deliverables and category filtering" && git push origin main',
      status: 'APPROVED',
      reviewer_notes: 'Authorized by operator Gideon Bawa in HQ chat session: "for gate 1 and 2 they are approved by me so far they are highest quality code then yes, you can improve the ui design of the portfolio"',
      resolved_at: now
    },
    {
      task_id: taskId,
      agent_id: 'atlas',
      workspace_id: 'ws-agent-workspace',
      risk_level: 'HIGH',
      approval_mode: 'ALWAYS_ASK',
      action_type: 'DEPLOY',
      description: 'Gate 3: Authorize broadcasting verified senior engineering case study to LinkedIn profile. Post highlights timing-safe HMAC-SHA256 signature verification, 20-thread concurrency benchmark (0 duplicate deliveries), and in-memory replay attack protection.',
      diff_preview: `[LINKEDIN TECHNICAL POST PREVIEW]\n🚀 Most webhook billing integrations fail silently at concurrency, replay attacks, or silent payload drift.\n\nHere is how I architected and benchmarked a resilient Webhook Billing Bridge with deterministic replay protection and zero-duplicate guarantees:\n\n1. Timing-Safe HMAC-SHA256 Signature Verification\n2. In-Memory Atomic Lock & Claim Mechanism (verified under 20-thread assault)\n3. Strict Invariant Verification with automated Sentinel QA\n\nFull source code & benchmarks: https://github.com/bawagideon/webhook-billing-bridge\nLive Architecture: https://gideonbawa-website.netlify.app/#projects`,
      status: 'PENDING'
    }
  ];

  const { data: inserted, error: appErr } = await supabase.from('hq_approvals').insert(approvalsToInsert).select();
  if (appErr) {
    console.error('Approval insert error:', appErr);
  } else {
    console.log('Successfully inserted', inserted.length, 'approvals!');
  }
}

run();
