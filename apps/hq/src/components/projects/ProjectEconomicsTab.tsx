'use client';

import React, { useState, useEffect } from 'react';
import { ProjectRecord } from '@gideon/shared';

interface FinancialProjection {
  projectId: string;
  quotedPriceCents: number;
  budgetCapCents: number;
  cashReceivedCents: number;
  settledSpendCents: number;
  reservedSpendCents: number;
  availableBalanceCents: number;
  paymentState: string;
  depositRequiredCents: number;
  isExecutionAllowed: boolean;
  rejectionReason?: string;
  updatedAt: string;
}

interface LedgerRecord {
  id: string;
  transactionType: string;
  amountCents: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
}

export function ProjectEconomicsTab({ project }: { project: ProjectRecord }) {
  const [projection, setProjection] = useState<FinancialProjection | null>(null);
  const [ledger, setLedger] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${project.id}/financials`);
      const data = await res.json();
      if (data.success) {
        setProjection(data.projection);
        setLedger(data.ledger || []);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, [project.id]);

  const handleGenerateCheckout = async (action: 'DEPOSIT' | 'FULL_PAYMENT') => {
    try {
      setGeneratingLink(true);
      setError(null);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          commercialAction: action
        })
      });
      const data = await res.json();
      if (data.success && data.sessionUrl) {
        setCheckoutUrl(data.sessionUrl);
      } else {
        setError(data.error || 'Failed to generate checkout link');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = () => {
    if (checkoutUrl) {
      navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stateColors: Record<string, string> = {
    FUNDED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    PARTIALLY_FUNDED: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    UNFUNDED: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    BUDGET_EXHAUSTED: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    PAYMENT_REVERSED: 'bg-red-600/30 text-red-400 border-red-600/60',
    EXECUTION_SUSPENDED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
  };

  const cash = projection ? projection.cashReceivedCents / 100 : (project.cashReceivedCents || 0) / 100;
  const available = projection ? projection.availableBalanceCents / 100 : 0;
  const settled = projection ? projection.settledSpendCents / 100 : (project.settledSpendCents || 0) / 100;
  const reserved = projection ? projection.reservedSpendCents / 100 : (project.reservedSpendCents || 0) / 100;
  const budgetCap = projection ? projection.budgetCapCents / 100 : (project.budgetCapCents || 10000) / 100;
  const quoted = projection ? projection.quotedPriceCents / 100 : (project.pricingCents || 0) / 100;
  const state = projection ? projection.paymentState : (project.paymentState || 'UNFUNDED');

  const budgetUsagePercent = budgetCap > 0 ? Math.min(100, Math.round(((settled + reserved) / budgetCap) * 100)) : 0;

  return (
    <div className="bg-[#0d1017] border border-gray-800/80 rounded-xl p-5 space-y-6">
      {/* Header & State Pill */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800/60 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-white">Financial Control Plane & Ledger</h3>
            <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${stateColors[state] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
              {state}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Authoritative Cash & Compute Cost Accounting (Rule of Iron: Zero Unbacked Compute)
          </p>
        </div>

        {/* 1-Tap Checkout Link Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerateCheckout('DEPOSIT')}
            disabled={generatingLink}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            💳 {generatingLink ? 'Generating...' : 'Generate Deposit Link'}
          </button>
          <button
            onClick={fetchFinancials}
            disabled={loading}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-lg transition-all"
            title="Refresh Ledger & Balance"
          >
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 text-xs p-3 rounded-lg font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Generated Checkout URL Display */}
      {checkoutUrl && (
        <div className="bg-emerald-950/30 border border-emerald-800/60 p-3.5 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>Stripe Hosted Checkout Link (Server-Authoritative Deposit)</span>
            <button
              onClick={copyToClipboard}
              className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-0.5 rounded transition-all"
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>
          <input
            type="text"
            readOnly
            value={checkoutUrl}
            className="w-full text-xs font-mono bg-black/60 border border-emerald-900/60 text-emerald-200 px-3 py-1.5 rounded select-all"
          />
        </div>
      )}

      {/* 4 Core Financial Projection Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black/30 p-4 rounded-lg border border-gray-800/60">
          <span className="text-[11px] text-gray-400 font-mono block">VERIFIED CASH RECEIVED</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">
            ${cash.toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-500">Quoted Price: ${quoted.toFixed(2)}</span>
        </div>

        <div className="bg-black/30 p-4 rounded-lg border border-gray-800/60">
          <span className="text-[11px] text-gray-400 font-mono block">AVAILABLE BALANCE</span>
          <span className={`text-xl font-bold mt-1 block ${available > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${available.toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-500">Cash - Settled - Holds</span>
        </div>

        <div className="bg-black/30 p-4 rounded-lg border border-gray-800/60">
          <span className="text-[11px] text-gray-400 font-mono block">SETTLED COMPUTE SPEND</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">
            ${settled.toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-500">Inference & Runner burn</span>
        </div>

        <div className="bg-black/30 p-4 rounded-lg border border-gray-800/60">
          <span className="text-[11px] text-gray-400 font-mono block">ACTIVE SPEND HOLDS</span>
          <span className="text-xl font-bold text-purple-400 mt-1 block">
            ${reserved.toFixed(2)}
          </span>
          <span className="text-[10px] text-gray-500">In-flight task reservations</span>
        </div>
      </div>

      {/* Budget Cap Circuit Breaker Gauge */}
      <div className="bg-black/30 p-4 rounded-lg border border-gray-800/60 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-gray-400">
            BUDGET CAP ALLOCATION: <strong className="text-white">${(settled + reserved).toFixed(2)}</strong> / ${budgetCap.toFixed(2)}
          </span>
          <span className={`font-bold ${budgetUsagePercent >= 90 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {budgetUsagePercent}% CONSUMED
          </span>
        </div>
        <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-gray-800">
          <div
            className={`h-full transition-all duration-500 ${
              budgetUsagePercent >= 90
                ? 'bg-rose-500'
                : budgetUsagePercent >= 70
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${budgetUsagePercent}%` }}
          />
        </div>
        {projection?.rejectionReason && (
          <p className="text-[11px] text-amber-400/90 font-mono mt-1">
            ⚠️ {projection.rejectionReason}
          </p>
        )}
      </div>

      {/* Immutable Ledger Transaction Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-xs text-white">Immutable Ledger Audit Stream</h4>
          <span className="text-[11px] text-gray-500 font-mono">{ledger.length} transactions recorded</span>
        </div>

        <div className="border border-gray-800/80 rounded-lg overflow-hidden bg-black/20">
          {ledger.length === 0 ? (
            <div className="text-center text-gray-500 text-xs font-mono p-6">
              No financial transactions recorded for this project yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-800/60 text-xs font-mono">
              {ledger.map((tx) => {
                const isPositive = tx.transactionType === 'REVENUE';
                const isNegative = tx.transactionType === 'REFUND' || tx.transactionType === 'PAYMENT_REVERSED';
                const isSpend = tx.transactionType === 'TOKEN_COST' || tx.transactionType === 'RUNNER_COST';
                const isHold = tx.transactionType === 'SPEND_RESERVATION';

                return (
                  <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isPositive
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : isNegative
                            ? 'bg-red-950 text-red-400 border border-red-800/60'
                            : isSpend
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            : isHold
                            ? 'bg-purple-950 text-purple-400 border border-purple-800/60'
                            : 'bg-gray-900 text-gray-400'
                        }`}>
                          {tx.transactionType}
                        </span>
                        <span className="text-gray-300 text-xs">{tx.description || tx.id}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block">
                        {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-bold block ${
                        isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : isSpend ? 'text-amber-400' : 'text-purple-400'
                      }`}>
                        {isPositive ? '+' : isNegative ? '-' : ''}${(tx.amountCents / 100).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-gray-500">{tx.currency}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
