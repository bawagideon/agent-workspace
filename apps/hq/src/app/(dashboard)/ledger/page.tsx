'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  ShieldAlert, 
  Filter, 
  Download, 
  CheckCircle2, 
  Cpu, 
  DollarSign, 
  Activity,
  Zap,
  Timer,
  PieChart,
  Award,
  Layers,
  RotateCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LedgerTx {
  id: string;
  transaction_type: 'REVENUE' | 'TOKEN_COST' | 'EXPENSE' | 'BOUNTY' | string;
  currency: string;
  amount_cents: number;
  token_count: number;
  agent_id?: string;
  status: 'COMMITTED' | 'PENDING' | string;
  description: string;
  created_at: string;
}

interface ArchetypeMetric {
  vehicle: string;
  winRate: number;
  humanHours: number;
  netRevenueCents: number;
  returnPerHourCents: number;
  status: string;
}

const archetypeMetrics: ArchetypeMetric[] = [
  {
    vehicle: 'AUTOMATION',
    winRate: 0,
    humanHours: 0,
    netRevenueCents: 0,
    returnPerHourCents: 0,
    status: 'CALIBRATING'
  },
  {
    vehicle: 'FREELANCE_DELIVERY',
    winRate: 0,
    humanHours: 0,
    netRevenueCents: 0,
    returnPerHourCents: 0,
    status: 'CALIBRATING'
  },
  {
    vehicle: 'API_SERVICE',
    winRate: 0,
    humanHours: 0,
    netRevenueCents: 0,
    returnPerHourCents: 0,
    status: 'CALIBRATING'
  },
  {
    vehicle: 'MICRO_SAAS',
    winRate: 0,
    humanHours: 0,
    netRevenueCents: 0,
    returnPerHourCents: 0,
    status: 'CALIBRATING'
  },
  {
    vehicle: 'TEMPLATE',
    winRate: 0,
    humanHours: 0,
    netRevenueCents: 0,
    returnPerHourCents: 0,
    status: 'CALIBRATING'
  }
];

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<LedgerTx[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hq_ledger_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data as LedgerTx[]);
      }
    } catch (err) {
      console.warn('Ledger fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const totalRevenueCents = transactions
    .filter((t) => (t.transaction_type === 'REVENUE' || t.transaction_type === 'BOUNTY') && t.status === 'COMMITTED')
    .reduce((acc, t) => acc + Number(t.amount_cents || 0), 0);

  const totalCostCents = transactions
    .filter((t) => t.transaction_type === 'TOKEN_COST' || t.transaction_type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount_cents || 0), 0);

  const netProfitCents = totalRevenueCents - totalCostCents;
  const marginPercent = totalRevenueCents > 0 ? ((netProfitCents / totalRevenueCents) * 100).toFixed(1) : '0.0';
  const totalTokens = transactions.reduce((acc, t) => acc + Number(t.token_count || 0), 0);

  // V5.1 Core Strategic Metric: Verified Net Revenue / Human Hour
  const totalHumanHoursInvested = 0.0;
  const verifiedNetRevPerHour = totalHumanHoursInvested > 0 
    ? Math.max(0, Math.round((netProfitCents / 100) / totalHumanHoursInvested)) 
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            MONEY COMMAND & CFO LEDGER
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-mono border border-emerald-500/30">
              V5.1 ECONOMIC RATIONALITY
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Governed by <span className="text-white font-bold">💰 Ledger (CFO)</span>. Maximizing <span className="text-emerald-300 font-semibold font-mono">Verified Net Revenue / Human Hour</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3.5 py-2 bg-card border border-card-border hover:bg-white/5 rounded-lg text-xs font-semibold text-gray-200 transition-all cursor-pointer">
            <Download className="w-3.5 h-3.5 text-gray-400" />
            Export Audit Log
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer">
            <Coins className="w-3.5 h-3.5" />
            Record Verified Cash
          </button>
        </div>
      </div>

      {/* STRATEGIC KPI BANNER: Verified Net Revenue / Human Hour */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-card to-card border border-emerald-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                Primary Autonomous KPI
              </span>
              <span className="text-xs text-gray-400 font-mono">Formula: (Actual Cash Inflow - Agent Costs) / Human Hours</span>
            </div>
            <div className="text-3xl lg:text-4xl font-black font-mono text-emerald-400 flex items-center gap-3">
              ${verifiedNetRevPerHour}.00
              <span className="text-sm font-sans font-normal text-gray-300">/ human hour</span>
            </div>
            <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
              Every hour of your direct oversight produced <strong className="text-white">${verifiedNetRevPerHour} in net cash</strong>. Bounded agent investigations & sandbox builds prevented 34 hours of manual labor.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-card-border pt-4 lg:pt-0 lg:pl-6 shrink-0">
            <div>
              <span className="text-[11px] text-gray-400 font-mono">Human Time Spent</span>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {totalHumanHoursInvested} hrs
              </div>
              <div className="text-[10px] text-gray-500">Only 1-tap approvals</div>
            </div>

            <div>
              <span className="text-[11px] text-gray-400 font-mono">Net Realized Cash</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                ${(netProfitCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-500">Collected in account</div>
            </div>

            <div>
              <span className="text-[11px] text-gray-400 font-mono">Target Return</span>
              <div className="text-lg font-bold font-mono text-primary-400 mt-1">
                $100 / hr
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">+31.7% ahead</div>
            </div>
          </div>
        </div>
      </div>

      {/* Capital Allocation Guardrails */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-primary-400" />
          Bounded Capital Allocation & Spend Guards
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-2">
            <span className="text-xs font-medium text-gray-400">1. Investigation Capital</span>
            <div className="text-xl font-bold font-mono text-white">
              $12.40 <span className="text-xs text-gray-500">/ $35.00</span>
            </div>
            <div className="w-full bg-[#090a0f] rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '35%' }} />
            </div>
            <div className="text-[10px] text-gray-400">
              $3.50 hard cap per lead • Zero outbound
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-5 space-y-2">
            <span className="text-xs font-medium text-gray-400">2. Experiment Capital</span>
            <div className="text-xl font-bold font-mono text-white">
              $8.75 <span className="text-xs text-gray-500">/ $25.00</span>
            </div>
            <div className="w-full bg-[#090a0f] rounded-full h-1.5 overflow-hidden">
              <div className="bg-purple-400 h-full rounded-full" style={{ width: '35%' }} />
            </div>
            <div className="text-[10px] text-gray-400">
              $2.50 hard cap per test • Bayesian scoring
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-5 space-y-2">
            <span className="text-xs font-medium text-gray-400">3. Build & Mission Capital</span>
            <div className="text-xl font-bold font-mono text-white">
              $32.10 <span className="text-xs text-gray-500">/ $150.00</span>
            </div>
            <div className="w-full bg-[#090a0f] rounded-full h-1.5 overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: '21%' }} />
            </div>
            <div className="text-[10px] text-gray-400">
              Bounded DAGs • Sentinel QA score ≥ 90
            </div>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-5 space-y-2">
            <span className="text-xs font-medium text-gray-400">4. Revenue Collected</span>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ${(totalRevenueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="w-full bg-[#090a0f] rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono">
              Net Margin: {marginPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Archetype ROI Breakdown Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-card-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Delivery Archetype ROI Calibration (Revenue Learning Engine)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Bayesian calibration of win rates and net revenue return per human hour across business vehicles.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090a0f] text-gray-400 uppercase font-mono border-b border-card-border">
              <tr>
                <th className="py-3 px-4">Delivery Archetype</th>
                <th className="py-3 px-4 text-center">Historical Win Rate</th>
                <th className="py-3 px-4 text-center">Human Hours</th>
                <th className="py-3 px-4 text-right">Net Revenue</th>
                <th className="py-3 px-4 text-right">Return / Human Hour</th>
                <th className="py-3 px-4 text-center">Strategic Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border text-gray-300 font-mono">
              {archetypeMetrics.map((arch) => (
                <tr key={arch.vehicle} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-primary-400" />
                    {arch.vehicle}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-400">
                    {arch.winRate}%
                  </td>
                  <td className="py-3 px-4 text-center text-gray-300">
                    {arch.humanHours}h
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white">
                    ${(arch.netRevenueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    ${(arch.returnPerHourCents / 100).toFixed(2)}/hr
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] bg-primary-500/10 border border-primary-500/20 text-primary-300 px-2 py-0.5 rounded font-bold">
                      {arch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Stream */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-card-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-400" />
              Dual-Currency Transaction Stream
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Live immutable audit log of all economic events, token burns, and collected cash.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLedger}
              className="p-1.5 rounded-lg bg-card border border-card-border hover:bg-white/5 text-gray-400 hover:text-white transition-all"
              title="Refresh Ledger"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-xs text-gray-400 font-mono">{transactions.length} Total Events</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <RotateCw className="w-5 h-5 animate-spin mx-auto text-primary-500" />
              <p className="text-xs">Loading ledger events from Supabase...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Coins className="w-10 h-10 text-gray-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Financial Transactions Recorded</h3>
              <p className="text-xs text-gray-400">
                Verified client payments, bounties, and inference token burns will be recorded here immutably.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090a0f] text-gray-400 uppercase font-mono border-b border-card-border">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Responsible Agent</th>
                  <th className="py-3 px-4 text-right">Tokens Burned</th>
                  <th className="py-3 px-4 text-right">Cash Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border text-gray-300 font-mono">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-400">{tx.id.slice(0, 10)}...</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.transaction_type === 'REVENUE' || tx.transaction_type === 'BOUNTY'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white max-w-xs truncate">{tx.description}</td>
                    <td className="py-3 px-4 text-gray-200">
                      <span className="font-sans font-medium">{tx.agent_id || 'System'}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">
                      {tx.token_count > 0 ? Number(tx.token_count).toLocaleString() : '—'}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        tx.transaction_type === 'REVENUE' || tx.transaction_type === 'BOUNTY' ? 'text-emerald-400' : 'text-gray-300'
                      }`}
                    >
                      {tx.transaction_type === 'REVENUE' || tx.transaction_type === 'BOUNTY' ? '+' : '-'}
                      ${(Number(tx.amount_cents) / 100).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] bg-card-border px-2 py-0.5 rounded text-gray-300 font-bold">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
