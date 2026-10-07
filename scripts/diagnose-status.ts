import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../apps/hq/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { supabase } from '../apps/hq/src/lib/supabase';
import { OpenClawBridgeClient } from '../packages/runner/src/OpenClawBridgeClient';

async function diagnose() {
  console.log('1. Testing Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  const t1 = Date.now();
  try {
    const res = await supabase.from('hq_machines').select('*').limit(1);
    console.log('Supabase hq_machines query completed in', Date.now() - t1, 'ms:', res.data);
  } catch (e: any) {
    console.error('Supabase error:', e.message);
  }

  const t2 = Date.now();
  try {
    const bridge = new OpenClawBridgeClient();
    console.log('Connecting to OpenClaw...');
    const connected = await bridge.connect();
    console.log('Bridge connect result in', Date.now() - t2, 'ms:', connected);
    bridge.disconnect();
  } catch (e: any) {
    console.error('Bridge error:', e.message);
  }

  console.log('Diagnosis complete.');
}

diagnose();
