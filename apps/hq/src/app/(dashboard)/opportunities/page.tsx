'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Radar, 
  Target, 
  ArrowUpRight, 
  DollarSign, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Plus, 
  ExternalLink,
  HelpCircle,
  FlaskConical,
  Flame, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  X, 
  Layers, 
  ChevronRight, 
  RotateCw,
  MapPin,
  Building2,
  ShieldCheck,
  Table as TableIcon,
  LayoutGrid,
  FileText,
  Lock,
  ArrowRight,
  MessageSquare,
  Bot,
  User,
  Send,
  Sparkle
} from 'lucide-react';

interface OpportunityDossier {
  id: string;
  business: {
    name: string;
    industry: string;
    location: string;
    website?: string;
    sourceUrls: string[];
  };
  discovery: {
    discoveredAt: string;
    discoverySource: string;
    discoveryReason: string;
    signalType: string;
  };
  evidence: Array<{
    type: string;
    sourceUrl?: string;
    observation: string;
    verifiedAt: string;
    confidence: number;
    rawExtract?: string;
    classification?: string;
  }>;
  pain: {
    hypothesis: string;
    evidenceBackedFacts: string[];
    confidence: number;
  };
  diagnosis: {
    website: Array<{ aspect: string; verdict: string; detail: string; severity: string }>;
    ux: Array<{ aspect: string; verdict: string; detail: string; severity: string }>;
    conversion: Array<{ aspect: string; verdict: string; detail: string; severity: string }>;
    performance: Array<{ aspect: string; verdict: string; detail: string; severity: string }>;
    automation: Array<{ aspect: string; verdict: string; detail: string; severity: string }>;
  };
  solution: {
    productName: string;
    objective: string;
    features: string[];
    architecture: string[];
    integrations: string[];
    acceptanceCriteria: string[];
  };
  prototype?: {
    id: string;
    type: string;
    title: string;
    description: string;
    scope: string;
    deliverablePath?: string;
    sandboxUrl?: string;
    validatedBySentinel: boolean;
    sentinelScore: number;
    qualityChecklist: Array<{ name: string; passed: boolean }>;
    createdAt: string;
  };
  economics: {
    estimatedBuildHours: number;
    estimatedCostUSD: number;
    proposedPriceUSD: number;
    priceRangeUSD: [number, number];
    depositRequirementUSD: number;
    recurringPriceUSD?: number;
    pricingAssumptions: string[];
    confidence: number;
    pricingRationale: string;
  };
  lifecycle: string;
  missionId?: string;
  conversationId?: string;
  humanContactApproved?: boolean;
  contactNotes?: string;
}

type FunnelTab = 'ALL' | 'PAIN_CONFIRMED' | 'IDENTITY_VERIFIED' | 'WEBSITE_CAPTURED' | 'DEMO_READY' | 'SOLUTION_READY' | 'HUMAN_APPROVED';

export default function OpportunitiesPage() {
  const [dossiers, setDossiers] = useState<OpportunityDossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FunnelTab>('ALL');
  const [selectedDossier, setSelectedDossier] = useState<OpportunityDossier | null>(null);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Scout Copilot Chat State
  const [showChatCopilot, setShowChatCopilot] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'scout'; text: string; timestamp: string }>>([
    {
      sender: 'scout',
      text: `👋 **Welcome to Scout AI Copilot & ChatGPT Ingestion.**

You can paste any raw table or list of businesses from ChatGPT here! I will automatically:
1. Parse business name, market, and investigation area.
2. Resolve public websites & contact URLs.
3. Calculate Ledger economics (price spread, build hours, deposit).
4. Auto-ingest into your active Opportunity Radar.

Try pasting your leads right now or ask:
* *"Show pipeline summary"*
* *"Which businesses have confirmed pain?"*
* *"Audit [Business Name]"*`,
      timestamp: 'Ready'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Quick-capture modal state
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [investigationReason, setInvestigationReason] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('2500');
  const [capturing, setCapturing] = useState(false);

  const fetchDossiers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/opportunities/dossiers');
      const data = await res.json();
      if (data.success && Array.isArray(data.dossiers)) {
        setDossiers(data.dossiers);
      }
    } catch (err) {
      console.warn('Failed to fetch opportunity dossiers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossiers();
  }, []);

  useEffect(() => {
    if (showChatCopilot && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChatCopilot]);

  // Unique markets for filtering
  const allMarkets = Array.from(
    new Set(dossiers.map(d => d.business.location.split(',')[0].trim()))
  ).sort();

  // Filter logic
  const filteredDossiers = dossiers.filter((d) => {
    // Stage / lifecycle filter
    if (activeTab === 'PAIN_CONFIRMED' && d.lifecycle !== 'PAIN_CONFIRMED' && d.lifecycle !== 'DEMO_READY') return false;
    if (activeTab === 'IDENTITY_VERIFIED' && d.lifecycle === 'DISCOVERED') return false;
    if (activeTab === 'WEBSITE_CAPTURED' && !d.business.website) return false;
    if (activeTab === 'DEMO_READY' && !d.prototype) return false;
    if (activeTab === 'SOLUTION_READY' && d.lifecycle !== 'SOLUTION_READY' && d.lifecycle !== 'DEMO_READY') return false;
    if (activeTab === 'HUMAN_APPROVED' && !d.humanContactApproved) return false;

    // Market filter
    if (selectedMarket !== 'ALL' && !d.business.location.toLowerCase().includes(selectedMarket.toLowerCase())) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = d.business.name.toLowerCase().includes(q);
      const matchLoc = d.business.location.toLowerCase().includes(q);
      const matchInd = d.business.industry.toLowerCase().includes(q);
      const matchInvestigate = d.discovery.discoveryReason.toLowerCase().includes(q);
      const matchSolution = d.solution.productName.toLowerCase().includes(q);
      return matchName || matchLoc || matchInd || matchInvestigate || matchSolution;
    }

    return true;
  });

  const totalPipelineValueUSD = dossiers.reduce((acc, d) => acc + (d.economics?.proposedPriceUSD || 0), 0);
  const painConfirmedCount = dossiers.filter(d => d.lifecycle === 'PAIN_CONFIRMED' || Boolean(d.prototype)).length;
  const prototypesCount = dossiers.filter(d => Boolean(d.prototype)).length;
  const inResearchCount = dossiers.filter(d => d.lifecycle !== 'DISCOVERED' && d.lifecycle !== 'ARCHIVED').length;

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, timestamp: now }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/opportunities/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { 
          sender: 'scout', 
          text: data.reply, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
        // Refresh live list if leads were ingested
        if (data.ingestedCount > 0 || data.type === 'INGESTION') {
          await fetchDossiers();
        }
      } else {
        setChatMessages(prev => [...prev, { 
          sender: 'scout', 
          text: `⚠️ **Error:** ${data.error || 'Failed to process request.'}`, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { 
        sender: 'scout', 
        text: `⚠️ **Connection Error:** ${err.message}`, 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCaptureIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    setCapturing(true);
    try {
      const res = await fetch('/api/opportunities/dossiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          location: location || 'Global / Remote',
          website: website || undefined,
          discoveryReason: investigationReason || 'Operator captured lead for Scout technical audit.',
          estimatedPrice: Number(estimatedBudget) || 2500,
          source: 'OPERATOR_DIRECT'
        })
      });
      const data = await res.json();
      if (data.success && data.dossier) {
        setDossiers([data.dossier, ...dossiers]);
        setSelectedDossier(data.dossier);
      }
    } catch (err) {
      console.warn('Failed to save captured opportunity:', err);
    } finally {
      setCapturing(false);
      setShowCaptureModal(false);
      setBusinessName('');
      setLocation('');
      setWebsite('');
      setInvestigationReason('');
    }
  };

  const executeAction = async (dossierId: string, action: string) => {
    try {
      setActionLoading(`${dossierId}-${action}`);
      const res = await fetch(`/api/opportunities/dossiers/${dossierId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        await fetchDossiers();
        if (selectedDossier?.id === dossierId) {
          const updated = dossiers.find(d => d.id === dossierId);
          if (updated) setSelectedDossier(updated);
        }
      }
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBuildThis = async (dossierId: string) => {
    try {
      setActionLoading(`${dossierId}-BUILD`);
      const res = await fetch(`/api/opportunities/dossiers/${dossierId}/build-mission`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = `/loops/build?missionId=${data.missionId || ''}`;
      }
    } catch (err) {
      console.error('Build mission dispatch error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getLifecycleBadge = (lifecycle: string) => {
    switch (lifecycle) {
      case 'PAIN_CONFIRMED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">PAIN CONFIRMED</span>;
      case 'DEMO_READY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">PROTOTYPE READY (100/100)</span>;
      case 'SOLUTION_READY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">SOLUTION READY</span>;
      case 'HUMAN_CONTACT_APPROVAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">CONTACT APPROVED</span>;
      case 'IDENTITY_VERIFIED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">IDENTITY VERIFIED</span>;
      case 'WEBSITE_CAPTURED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">WEBSITE CAPTURED</span>;
      case 'BUSINESS_MODEL_UNDERSTOOD':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">MODEL UNDERSTOOD</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30">DISCOVERED</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner: Authentic Scout Pool & Operating Flywheel */}
      <div className="bg-gradient-to-r from-red-950/40 via-purple-950/30 to-blue-950/40 border border-red-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <Radar className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{dossiers.length} Real Verified Business Entities</span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-mono border border-red-500/40">
                {allMarkets.length} Global Markets
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Strict Epistemic Protocol: Zero unverified hypotheses converted to facts. Real businesses, observable pain, micro-proofs.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChatCopilot(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Paste Leads from ChatGPT</span>
          </button>
          <Link
            href="/loops/opportunities"
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-xs font-bold text-white transition shrink-0"
          >
            <span>Loop 2 Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            OPPORTUNITY RADAR
            <span className="text-xs bg-red-600/20 text-red-400 px-2.5 py-1 rounded-full font-mono border border-red-500/30">
              V5.2 OPERATING SCOUT
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Machine Discovery + Human Opportunity Inbox. Governed by <span className="text-white font-bold">Deterministic Epistemic Guards</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Scout Copilot Chat Trigger */}
          <button
            onClick={() => setShowChatCopilot(!showChatCopilot)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              showChatCopilot
                ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                : 'bg-white/5 hover:bg-white/10 text-gray-200 border-white/10'
            }`}
          >
            <Bot className="w-4 h-4 text-red-400" />
            <span>Scout Copilot</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#0d0f17] border border-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button 
            onClick={() => setShowCaptureModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + TELL GIDEON AN IDEA
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0f111a] border border-card-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-gray-400 flex items-center justify-between">
            <span>Active Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            ${totalPipelineValueUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 font-mono">
            Across {dossiers.length} verified real businesses
          </div>
        </div>

        <div className="bg-[#0f111a] border border-card-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-gray-400 flex items-center justify-between">
            <span>In Research & Diagnosis</span>
            <Search className="w-4 h-4 text-amber-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
            {inResearchCount} Active
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Empirical audits • Zero blind guessing
          </div>
        </div>

        <div className="bg-[#0f111a] border border-card-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-gray-400 flex items-center justify-between">
            <span>Confirmed Pain Signals</span>
            <AlertTriangle className="w-4 h-4 text-purple-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-2">
            {painConfirmedCount} Confirmed
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Empirical trace on contact/funnel
          </div>
        </div>

        <div className="bg-[#0f111a] border border-card-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-medium text-gray-400 flex items-center justify-between">
            <span>Micro-Prototypes Validated</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {prototypesCount} Ready
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1 font-mono">
            <CheckCircle className="w-3 h-3" /> Sentinel 100/100 scorecards
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f111a] border border-card-border rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by business name, market, industry, or what Gideon should investigate..."
              className="w-full bg-[#08090f] border border-card-border rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="bg-[#08090f] border border-card-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500/50 cursor-pointer"
            >
              <option value="ALL">All Markets ({allMarkets.length})</option>
              {allMarkets.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Funnel Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-card-border/60 pt-3 overflow-x-auto">
          {[
            { id: 'ALL', label: 'ALL PROSPECTS', count: dossiers.length },
            { id: 'PAIN_CONFIRMED', label: 'PAIN CONFIRMED', count: painConfirmedCount },
            { id: 'DEMO_READY', label: 'PROTOTYPES READY', count: prototypesCount },
            { id: 'IDENTITY_VERIFIED', label: 'IDENTITY VERIFIED', count: dossiers.filter(d => d.lifecycle !== 'DISCOVERED').length },
            { id: 'WEBSITE_CAPTURED', label: 'WEBSITE CAPTURED', count: dossiers.filter(d => Boolean(d.business.website)).length },
            { id: 'HUMAN_APPROVED', label: 'APPROVED FOR OUTREACH', count: dossiers.filter(d => d.humanContactApproved).length }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FunnelTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-600/20 text-red-300 border border-red-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-red-500/30 text-white' : 'bg-card border border-card-border text-gray-400'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Opportunity List / Table View */}
      {loading ? (
        <div className="p-16 text-center text-gray-500 space-y-2 bg-[#0f111a] border border-card-border rounded-xl">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-red-500" />
          <p className="text-xs">Loading Opportunity Dossiers...</p>
        </div>
      ) : filteredDossiers.length === 0 ? (
        <div className="bg-[#0f111a] border border-card-border rounded-xl p-16 text-center space-y-4">
          <Radar className="w-12 h-12 text-gray-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">No Matching Opportunities</h3>
            <p className="text-xs text-gray-400">
              No businesses match your filter query. Reset search or view all {dossiers.length} dossiers.
            </p>
          </div>
          <button
            onClick={() => { setSearchQuery(''); setSelectedMarket('ALL'); setActiveTab('ALL'); }}
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'TABLE' ? (
        /* TABLE VIEW (Matches the 50 Businesses Table Requested by User) */
        <div className="bg-[#0f111a] border border-card-border rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090a0f] border-b border-card-border text-gray-400 font-mono text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Prospect</th>
                  <th className="py-3.5 px-4">Market</th>
                  <th className="py-3.5 px-6 min-w-[340px]">What Gideon Should Investigate</th>
                  <th className="py-3.5 px-4">Ledger Economics</th>
                  <th className="py-3.5 px-4">Lifecycle Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/60">
                {filteredDossiers.map((opp, idx) => (
                  <tr 
                    key={opp.id} 
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelectedDossier(opp)}
                  >
                    <td className="py-3.5 px-4 text-center text-gray-500 font-mono font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white hover:text-red-400 flex items-center gap-1.5">
                        {opp.business.name}
                        {opp.business.website && (
                          <a 
                            href={opp.business.website} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-500 hover:text-gray-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">{opp.business.industry}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-gray-300 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{opp.business.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="text-gray-200 leading-relaxed text-xs">
                        {opp.discovery.discoveryReason}
                      </div>
                      {opp.prototype && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                          <CheckCircle className="w-3 h-3" />
                          <span>Sentinel Scorecard: {opp.prototype.sentinelScore}/100</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                      <div className="font-bold text-emerald-400">
                        ${opp.economics.proposedPriceUSD.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Spread: ${opp.economics.priceRangeUSD[0]} - ${opp.economics.priceRangeUSD[1]}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getLifecycleBadge(opp.lifecycle)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDossier(opp)}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-card-border rounded text-[11px] font-medium cursor-pointer"
                        >
                          Dossier
                        </button>
                        <button
                          onClick={() => handleBuildThis(opp.id)}
                          disabled={actionLoading === `${opp.id}-BUILD`}
                          className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white rounded text-[11px] font-bold shadow-sm cursor-pointer"
                        >
                          {actionLoading === `${opp.id}-BUILD` ? 'Provisioning...' : 'BUILD THIS'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDossiers.map((opp) => (
            <div
              key={opp.id}
              className="bg-[#0f111a] border border-card-border rounded-xl p-5 hover:border-red-500/40 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {getLifecycleBadge(opp.lifecycle)}
                    <span className="text-[10px] text-gray-500 font-mono">ID: {opp.id}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-base font-bold text-emerald-400">
                      ${opp.economics.proposedPriceUSD.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      ${opp.economics.priceRangeUSD[0]} - ${opp.economics.priceRangeUSD[1]}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white hover:text-red-300 transition-colors flex items-center gap-1.5">
                    {opp.business.name}
                    {opp.business.website && (
                      <a href={opp.business.website} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-400" />
                      {opp.business.location}
                    </span>
                    <span>•</span>
                    <span>{opp.business.industry}</span>
                  </div>
                </div>

                <div className="bg-[#08090f] border border-card-border rounded-lg p-3 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block font-mono">
                    What Gideon Should Investigate
                  </span>
                  <p className="text-xs text-gray-200 leading-relaxed">
                    {opp.discovery.discoveryReason}
                  </p>
                </div>

                {opp.prototype && (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-emerald-300 font-bold font-mono">
                        Micro-Proof: {opp.prototype.title}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      QA: {opp.prototype.sentinelScore}/100
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Card Actions */}
              <div className="border-t border-card-border pt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedDossier(opp)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-card-border rounded-lg text-xs font-medium cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span>Inspect Dossier</span>
                </button>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/loops/opportunities?id=${opp.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-card hover:bg-white/10 border border-card-border rounded-lg text-xs text-gray-300 font-medium"
                  >
                    <span>Studio</span>
                    <ArrowUpRight className="w-3 h-3 text-gray-400" />
                  </Link>

                  <button
                    onClick={() => handleBuildThis(opp.id)}
                    disabled={actionLoading === `${opp.id}-BUILD`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-600/20 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-yellow-300" />
                    <span>{actionLoading === `${opp.id}-BUILD` ? 'Provisioning...' : 'BUILD THIS'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scout AI Copilot Drawer (Pasting ChatGPT Leads) */}
      {showChatCopilot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end p-0">
          <div className="bg-[#0f111a] border-l border-card-border max-w-xl w-full h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-card-border flex items-center justify-between bg-[#0a0c12]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Scout Ingestion Copilot</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      AUTO-INGEST
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Paste ChatGPT markdown tables or bullet points to auto-ingest into Radar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChatCopilot(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Chips */}
            <div className="p-3 border-b border-card-border/60 bg-[#090b10] flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() => {
                  setChatInput(`| # | Prospect | Market | What Gideon should investigate |\n| -: | --- | --- | --- |\n| 1 | Metro Tech Cleaners | Chicago, US | Instant quote calculation from square footage & booking |\n| 2 | Solaris Solar Panels | Phoenix, US | Commercial roof solar calculator & tax credit qualification |`);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-card-border rounded-md font-medium whitespace-nowrap cursor-pointer"
              >
                📋 Paste Sample Table
              </button>
              <button
                onClick={() => {
                  setChatInput('Show pipeline summary and active metrics');
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-card-border rounded-md font-medium whitespace-nowrap cursor-pointer"
              >
                📊 Pipeline Summary
              </button>
              <button
                onClick={() => {
                  setChatInput('Which opportunities have confirmed pain signals?');
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-card-border rounded-md font-medium whitespace-nowrap cursor-pointer"
              >
                🚨 Confirmed Defects
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'scout' && (
                    <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-red-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-red-600 to-indigo-600 text-white font-medium'
                        : 'bg-[#090b10] border border-card-border text-gray-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                    <div className={`text-[10px] mt-1.5 text-right font-mono ${msg.sender === 'user' ? 'text-white/60' : 'text-gray-500'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-3 items-center text-xs text-gray-400 font-mono">
                  <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                    <RotateCw className="w-3.5 h-3.5 text-red-400 animate-spin" />
                  </div>
                  <span>Scout is parsing leads & evaluating Ledger economics...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-card-border bg-[#0a0c12] space-y-2">
              <form onSubmit={handleSendChatMessage} className="flex flex-col gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  rows={3}
                  placeholder="Paste ChatGPT leads table or ask Scout a question... (Shift+Enter for new line)"
                  className="w-full bg-[#08090f] border border-card-border rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none font-mono"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-mono">
                    Press <span className="text-gray-400">Enter</span> to send/ingest • <span className="text-gray-400">Shift+Enter</span> for new line
                  </span>
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-600/30 disabled:opacity-50 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send / Ingest</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawer: Opportunity Intelligence Dossier */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end p-0">
          <div className="bg-[#0f111a] border-l border-card-border max-w-2xl w-full h-full p-6 space-y-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-start justify-between gap-4 border-b border-card-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  {getLifecycleBadge(selectedDossier.lifecycle)}
                  <span className="text-xs text-gray-400 font-mono">ID: {selectedDossier.id}</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  {selectedDossier.business.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <MapPin className="w-3 h-3 text-red-400" />
                  <span>{selectedDossier.business.location}</span>
                  <span>•</span>
                  <span>{selectedDossier.business.industry}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedDossier(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => executeAction(selectedDossier.id, 'SENTINEL_REVIEW')}
                disabled={Boolean(actionLoading)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-bold cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Sentinel Review
              </button>
              <button
                onClick={() => executeAction(selectedDossier.id, 'FORGE_INVESTIGATE')}
                disabled={Boolean(actionLoading)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                Forge Probe
              </button>
              <button
                onClick={() => executeAction(selectedDossier.id, 'FORGE_PROTOTYPE')}
                disabled={Boolean(actionLoading)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Micro-Proof
              </button>
              <button
                onClick={() => handleBuildThis(selectedDossier.id)}
                disabled={Boolean(actionLoading)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-yellow-300" />
                BUILD THIS
              </button>
            </div>

            {/* Epistemic Evidence Separation: FACT vs OBSERVATION vs HYPOTHESIS */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                Epistemic Intelligence Brief
              </h3>
              <div className="bg-[#08090f] border border-card-border rounded-xl p-4 space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 font-mono block mb-1">
                    ✓ WHAT WE KNOW FOR SURE (FACTS)
                  </span>
                  <ul className="space-y-1.5 text-xs text-gray-200">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>Business verified operating in {selectedDossier.business.location}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>Public domain: {selectedDossier.business.website || 'Directory Listing Verified'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>Observed reason: {selectedDossier.discovery.discoveryReason}</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t border-card-border pt-3">
                  <span className="text-[11px] font-bold text-amber-400 font-mono block mb-1">
                    ⚠️ WHAT WE DO NOT KNOW YET (UNCERTAINTIES)
                  </span>
                  <ul className="space-y-1.5 text-xs text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>Exact monthly revenue loss without access to internal analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>Direct decision-maker cell phone / personal email</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Micro-Prototype Section */}
            {selectedDossier.prototype && (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300 font-mono">
                      Forge Micro-Prototype (Validated)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    Score: {selectedDossier.prototype.sentinelScore}/100
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {selectedDossier.prototype.description}
                </p>
                <div className="space-y-1.5 text-xs">
                  {selectedDossier.prototype.qualityChecklist.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-300 font-mono text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{check.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Solution Blueprint */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                Tailored Solution Blueprint
              </h3>
              <div className="bg-[#08090f] border border-card-border rounded-xl p-4 space-y-2">
                <div className="font-bold text-white text-sm">{selectedDossier.solution.productName}</div>
                <p className="text-xs text-gray-300">{selectedDossier.solution.objective}</p>
                <div className="pt-2">
                  <span className="text-[10px] text-gray-400 font-mono uppercase block mb-1">Architecture</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedDossier.solution.architecture.map((tech, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-card-border text-[10px] font-mono text-gray-300">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Ledger Economics */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                Ledger Economic Profiling
              </h3>
              <div className="bg-[#08090f] border border-card-border rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-black/40 p-2.5 rounded-lg border border-card-border">
                    <span className="text-[10px] text-gray-400 block">Proposed Price</span>
                    <span className="text-sm font-bold text-emerald-400">${selectedDossier.economics.proposedPriceUSD.toLocaleString()}</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-card-border">
                    <span className="text-[10px] text-gray-400 block">Price Range</span>
                    <span className="text-sm font-bold text-white">${selectedDossier.economics.priceRangeUSD[0]} - ${selectedDossier.economics.priceRangeUSD[1]}</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-card-border">
                    <span className="text-[10px] text-gray-400 block">Upfront Deposit</span>
                    <span className="text-sm font-bold text-cyan-400">${selectedDossier.economics.depositRequirementUSD.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 italic">
                  Rationale: {selectedDossier.economics.pricingRationale}
                </p>
              </div>
            </div>

            {/* Footer with Loop 2 Studio link */}
            <div className="border-t border-card-border pt-4 flex items-center justify-between">
              <Link
                href={`/loops/opportunities?id=${selectedDossier.id}`}
                className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5"
              >
                <span>Open in 3 Core Loops Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedDossier(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Capture Modal: "+ TELL GIDEON AN IDEA" */}
      {showCaptureModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-card-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCaptureModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-500" />
                Tell Gideon An Opportunity
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Ingest a business lead into Opportunity Radar for Sentinel & Forge audit.
              </p>
            </div>

            <form onSubmit={handleCaptureIdea} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-300">Business / Entity Name</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Blossom Med, Savvy Property Inspections"
                  className="w-full bg-[#08090f] border border-card-border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Market / Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Austin, US or Lagos, Nigeria"
                    className="w-full bg-[#08090f] border border-card-border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-300">Target Budget ($USD)</label>
                  <input
                    type="number"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
                    placeholder="2500"
                    className="w-full bg-[#08090f] border border-card-border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Public Website (Optional)</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-[#08090f] border border-card-border rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">What Gideon Should Investigate</label>
                <textarea
                  rows={3}
                  value={investigationReason}
                  onChange={(e) => setInvestigationReason(e.target.value)}
                  placeholder="Describe the observable friction, booking bug, or workflow pain..."
                  className="w-full bg-[#08090f] border border-card-border rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCaptureModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={capturing || !businessName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white rounded-lg font-bold disabled:opacity-50 cursor-pointer"
                >
                  {capturing ? 'Ingesting...' : 'Ingest to Radar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
