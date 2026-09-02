import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // 1. Broadcast emergency stop event on realtime channel
    await supabase.channel('gideon-runner-channel').send({
      type: 'broadcast',
      event: 'KILL_SWITCH_TRIGGERED',
      payload: { timestamp: new Date().toISOString() }
    });

    // 2. Mark active tasks as EMERGENCY_STOPPED
    await supabase
      .from('hq_tasks')
      .update({ status: 'EMERGENCY_STOPPED' })
      .in('status', ['EXECUTING', 'WAITING_APPROVAL', 'PLANNING']);

    return NextResponse.json({
      success: true,
      message: '🚨 Universal Kill Switch signal broadcasted to all local runners.'
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
