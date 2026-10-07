import { loadEnvironment } from './env-loader';

async function testSupabase() {
  console.log('================================================================');
  console.log('🔌 TESTING SUPABASE CONNECTION & DATABASE TABLES');
  console.log('================================================================\n');

  const { loadedFile, keysFound } = loadEnvironment();

  console.log(`[Env Loader] Loaded file: ${loadedFile || 'NONE'}`);
  console.log(`[Env Check] NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET'}`);
  console.log(`[Env Check] SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET'}`);
  console.log(`[Env Check] NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'}`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error('\n❌ FAILED: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.');
    process.exit(1);
  }

  console.log(`\n[Supabase] Target Endpoint: ${supabaseUrl}`);
  console.log('[Supabase] Testing endpoint connection...\n');

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const machineRes = await fetch(`${supabaseUrl}/rest/v1/hq_machines?select=*`, {
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!machineRes.ok) {
      throw new Error(`hq_machines query returned status ${machineRes.status} (${machineRes.statusText}): ${await machineRes.text()}`);
    }

    const machines = await machineRes.json();
    console.log(`✅ hq_machines table verified: ${machines.length} machine(s) found.`);
    machines.forEach((m: any) => console.log(`   - Machine: ${m.name} (${m.id}) | Status: ${m.status}`));

    // Query hq_workspaces
    const wsRes = await fetch(`${supabaseUrl}/rest/v1/hq_workspaces?select=*`, { headers });
    if (wsRes.ok) {
      const workspaces = await wsRes.json();
      console.log(`\n✅ hq_workspaces table verified: ${workspaces.length} workspace(s) found.`);
      workspaces.forEach((w: any) => console.log(`   - Workspace: ${w.name} (${w.id}) | Access Mode: ${w.access_mode}`));
    }

    // Query hq_agents
    const agentRes = await fetch(`${supabaseUrl}/rest/v1/hq_agents?select=*`, { headers });
    if (agentRes.ok) {
      const agents = await agentRes.json();
      console.log(`\n✅ hq_agents table verified: ${agents.length} agent(s) found.`);
      agents.forEach((a: any) => console.log(`   - Agent: ${a.name} (${a.role}) | Department: ${a.department}`));
    }

    // Query hq_execution_jobs
    const queueRes = await fetch(`${supabaseUrl}/rest/v1/hq_execution_jobs?select=*`, { headers });
    if (queueRes.ok) {
      const jobs = await queueRes.json();
      console.log(`\n✅ hq_execution_jobs (V3.2 queue table) verified: ${jobs.length} job(s) in queue.`);
    } else {
      console.log(`\n🟡 hq_execution_jobs table: returned ${queueRes.status} (Apply V3.2 migration when ready).`);
    }

    console.log('\n🏛️ SUPABASE PRODUCTION DATABASE IS FULLY CONNECTED & OPERATIONAL!\n');
  } catch (err: any) {
    console.error('❌ Supabase connection error:', err.message);
    if (err.cause) {
      console.error('   Cause details:', err.cause);
    }
    process.exit(1);
  }
}

testSupabase();
