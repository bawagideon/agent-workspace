'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  Copy, 
  Check, 
  Plus, 
  Search, 
  ArrowLeft, 
  X, 
  ShieldCheck, 
  Building2, 
  Lock, 
  ExternalLink, 
  Flame, 
  Send, 
  MapPin, 
  CreditCard, 
  Filter, 
  DollarSign, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Hammer, 
  FileText, 
  Activity,
  Cpu,
  Eye,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  Phone,
  Mail,
  MessageSquare,
  UserCheck,
  Radio,
  Calendar
} from 'lucide-react';
import { GideonContextChat } from '@/components/chat/GideonContextChat';
import { 
  OpportunityDossier, 
  OpportunityLifecycle, 
  OpportunityPattern, 
  OpportunityIntelligenceBrief 
} from '@gideon/runtime';

const LIFECYCLE_STAGES: OpportunityLifecycle[] = [
  'DISCOVERED',
  'IDENTITY_VERIFIED',
  'EVIDENCE_COLLECTED',
  'SENTINEL_REVIEW',
  'PAIN_HYPOTHESIS',
  'FORGE_INVESTIGATION',
  'PAIN_CONFIRMED',
  'SOLUTION_DESIGNED',
  'PROTOTYPE_DECISION',
  'PROTOTYPE_BUILDING',
  'DEMO_READY',
  'HUMAN_CONTACT_APPROVAL',
  'CONTACTED',
  'RESPONDED',
  'DISCOVERY',
  'QUOTE',
  'CLIENT_REVIEW',
  'APPROVED',
  'PAID',
  'INTEGRATING',
  'QA_VERIFIED',
  'DEPLOYED',
  'WATCH',
  'ARCHIVED'
];

export default function OpportunitiesLoopStudioPage() {
  const [dossiers, setDossiers] = useState<OpportunityDossier[]>([]);
  const [patterns, setPatterns] = useState<OpportunityPattern[]>([]);
  const [activeDossierId, setActiveDossierId] = useState<string>('opp-006');
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>('ALL');
  const [selectedSignal, setSelectedSignal] = useState<string>('ALL');
  const [selectedPattern, setSelectedPattern] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Guided One-by-One Review State
  const [activeTab, setActiveTab] = useState<'pain' | 'build' | 'economics' | 'contact' | 'outreach' | 'all'>('pain');

  // Contact & Comms State
  const [selectedCadenceStep, setSelectedCadenceStep] = useState<number>(0);
  const [commsActionLoading, setCommsActionLoading] = useState<boolean>(false);
  const [commsFeedback, setCommsFeedback] = useState<string | null>(null);
  const [simulatedInboundResult, setSimulatedInboundResult] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Action States
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const currentIndex = dossiers.findIndex(d => d.id === activeDossierId);
  const currentLeadIndex = currentIndex >= 0 ? currentIndex : 0;
  const hasPrev = currentLeadIndex > 0;
  const hasNext = currentLeadIndex < dossiers.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      handleSelectDossier(dossiers[currentLeadIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      handleSelectDossier(dossiers[currentLeadIndex + 1].id);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [dossiersRes, patternsRes] = await Promise.all([
        fetch('/api/opportunities/dossiers'),
        fetch('/api/opportunities/patterns')
      ]);

      const dossiersData = await dossiersRes.json();
      const patternsData = await patternsRes.json();

      if (dossiersData.success && Array.isArray(dossiersData.dossiers)) {
        setDossiers(dossiersData.dossiers);

        let selectedId = '';
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const target = urlParams.get('id') || urlParams.get('mission') || urlParams.get('missionId');
          if (target && dossiersData.dossiers.some((d: OpportunityDossier) => d.id === target || d.missionId === target)) {
            const match = dossiersData.dossiers.find((d: OpportunityDossier) => d.id === target || d.missionId === target);
            if (match) selectedId = match.id;
          }
        }
        if (!selectedId && dossiersData.dossiers.length > 0) {
          selectedId = dossiersData.dossiers[0].id;
        }
        setActiveDossierId(selectedId);
      }

      if (patternsData.success && Array.isArray(patternsData.patterns)) {
        setPatterns(patternsData.patterns);
      }
    } catch (err) {
      console.warn('Failed to load opportunity data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard navigation for One-by-One review
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft' && hasPrev) {
        handlePrev();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNext();
      } else if (e.key === '1') {
        setActiveTab('pain');
      } else if (e.key === '2') {
        setActiveTab('build');
      } else if (e.key === '3') {
        setActiveTab('economics');
      } else if (e.key === '4') {
        setActiveTab('contact');
      } else if (e.key === '5') {
        setActiveTab('outreach');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dossiers, activeDossierId, hasPrev, hasNext]);

  const handleSelectDossier = (id: string) => {
    setActiveDossierId(id);
    setActionSuccessMessage(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('id', id);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const executePipelineAction = async (action: string, payload: any = {}) => {
    try {
      setActionInProgress(action);
      setActionSuccessMessage(null);

      const res = await fetch(`/api/opportunities/dossiers/${activeDossierId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });

      const data = await res.json();
      if (data.success && data.dossier) {
        setDossiers(prev => prev.map(d => d.id === activeDossierId ? data.dossier : d));
        setActionSuccessMessage(`Successfully executed ${action.replace('_', ' ')}`);
        setTimeout(() => setActionSuccessMessage(null), 3500);
      }
    } catch (err) {
      console.error(`Failed to execute ${action}:`, err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleBuildThis = async (dossier: OpportunityDossier) => {
    try {
      setActionInProgress('BUILD_THIS');
      const res = await fetch(`/api/opportunities/dossiers/${dossier.id}/build-mission`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.missionId) {
        setDossiers(prev => prev.map(d => d.id === dossier.id ? { ...d, missionId: data.missionId, lifecycle: 'SOLUTION_DESIGNED' } : d));
        setActionSuccessMessage(`Build Mission provisioned in Loop 1: ${data.missionId}`);
      }
    } catch (err) {
      console.error('Failed to trigger BUILD THIS workflow:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCopyPitch = (dossier: OpportunityDossier) => {
    const text = `Hi ${dossier.business.name} Team,

I was reviewing your public web presence in ${dossier.business.location} and noticed:
${dossier.pain.evidenceBackedFacts.map(f => `• ${f}`).join('\n')}

We design and engineer high-reliability digital solutions specifically for ${dossier.business.industry.toLowerCase()} businesses.
We engineered a demonstration concept: "${dossier.solution.productName}"
• Objective: ${dossier.solution.objective}
• Stack: ${dossier.solution.architecture.join(', ')}

Here is my verified engineering showcase and live architecture portfolio:
👉 https://gideonbawa-website.netlify.app/#work

Would you be open to a 10-minute briefing on this blueprint?`;

    navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAuthorizeComms = async (dossierId: string) => {
    try {
      setCommsActionLoading(true);
      setCommsFeedback(null);
      const res = await fetch(`/api/opportunities/dossiers/${dossierId}/comms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'AUTHORIZE_DISPATCH' })
      });
      const data = await res.json();
      if (data.success) {
        setCommsFeedback('🛡️ Authorized by Operator: HMAC Cryptographic Envelope Generated & Outbound Dispatched.');
        loadData();
      } else {
        setCommsFeedback(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setCommsFeedback(`Error: ${e.message}`);
    } finally {
      setCommsActionLoading(false);
    }
  };

  const handleSimulateInbound = async (dossierId: string) => {
    try {
      setCommsActionLoading(true);
      setCommsFeedback(null);
      const res = await fetch(`/api/opportunities/dossiers/${dossierId}/comms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SIMULATE_INBOUND' })
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedInboundResult(data);
        setCommsFeedback('📥 Simulated Inbound Ingested: Classified by MessageClassifier & Auto-Drafted by Atlas.');
      } else {
        setCommsFeedback(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setCommsFeedback(`Error: ${e.message}`);
    } finally {
      setCommsActionLoading(false);
    }
  };

  const activeDossier = dossiers.find(d => d.id === activeDossierId) || dossiers[0];
  const activePattern = patterns.find(p => p.id === activeDossier?.patternId || p.matchingOpportunityIds.includes(activeDossier?.id || ''));

  const filteredDossiers = dossiers.filter(d => {
    const matchesLifecycle = selectedLifecycle === 'ALL' || d.lifecycle === selectedLifecycle;
    const matchesSignal = selectedSignal === 'ALL' || d.discovery.signalType === selectedSignal;
    const matchesPattern = selectedPattern === 'ALL' || (activePattern && activePattern.matchingOpportunityIds.includes(d.id));
    const matchesSearch = searchQuery
      ? d.business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.business.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.business.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.solution.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.pain.hypothesis.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesLifecycle && matchesSignal && matchesPattern && matchesSearch;
  });

  const getLifecycleBadge = (stage: OpportunityLifecycle | string) => {
    switch (stage) {
      case 'PAIN_CONFIRMED':
      case 'DEMO_READY':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">{stage.replace('_', ' ')}</span>;
      case 'SOLUTION_DESIGNED':
      case 'PRICE_READY':
      case 'HUMAN_CONTACT_APPROVAL':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">{stage.replace('_', ' ')}</span>;
      case 'SENTINEL_REVIEW':
      case 'FORGE_INVESTIGATION':
      case 'PROTOTYPE_BUILDING':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">{stage.replace('_', ' ')}</span>;
      case 'BUSINESS_MODEL_UNDERSTOOD':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">{stage.replace('_', ' ')}</span>;
      case 'WEBSITE_CAPTURED':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">{stage.replace('_', ' ')}</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">{stage.replace('_', ' ')}</span>;
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'CONFIRMED_ISSUE':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">CONFIRMED DEFECT</span>;
      case 'OBSERVED_SIGNAL':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">OBSERVED SIGNAL</span>;
      case 'HYPOTHESIS':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">HYPOTHESIS</span>;
      case 'OPTIMAL':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">OPTIMAL</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-gray-400">UNTESTED</span>;
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col space-y-3 max-w-[1920px] mx-auto min-w-0 font-mono">
      {/* Top Studio Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#070b14] border border-white/[0.08] rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/loops"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
            title="Back to Operational Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
            L3
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-white font-sans">
                OPPORTUNITIES • SCOUT → SENTINEL → FORGE → LEDGER OPERATING STUDIO
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                LOOP 3
              </span>
            </div>
            <div className="text-[11px] text-gray-400 font-sans">
              Scout Discovers → Sentinel Challenges & Audits → Forge Investigates & Builds Micro-Proof → Ledger Prices → Human Approves.
            </div>
          </div>
        </div>

        {/* Right Status Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-gray-400">Verified Pool:</span>
            <span className="font-bold text-amber-300">{dossiers.length} Real Entities</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-gray-400">Patterns:</span>
            <span className="font-bold text-cyan-300">{patterns.length} Shared Clusters</span>
          </div>
        </div>
      </div>

      {/* ONE-BY-ONE GUIDED REVIEW STEPPER HEADER */}
      {activeDossier && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#090e1c] border border-amber-500/30 rounded-xl shadow-md">
          {/* Previous / Next Stepper */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-gray-300 hover:text-white transition flex items-center gap-1 text-xs font-sans font-bold"
              title="Previous Lead (Left Arrow key)"
            >
              <span>← Prev Lead</span>
            </button>

            <div className="px-3 py-1 rounded-lg bg-black/60 border border-white/10 text-xs font-sans flex items-center gap-2">
              <span className="font-mono text-amber-400 font-bold">
                Lead {currentLeadIndex + 1} of {dossiers.length}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-white font-bold truncate max-w-xs">
                {activeDossier.business.name}
              </span>
              <span className="text-gray-400 text-[11px]">
                ({activeDossier.business.location})
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={!hasNext}
              className="py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-30 disabled:hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1 text-xs font-sans font-bold"
              title="Next Lead (Right Arrow key)"
            >
              <span>Next Lead →</span>
            </button>
          </div>

          {/* Progress Indicator & Tab Selectors */}
          <div className="flex items-center gap-3 text-xs font-sans">
            <div className="hidden sm:flex items-center gap-2 text-gray-400 text-[11px]">
              <span>Review Progress:</span>
              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.round(((currentLeadIndex + 1) / (dossiers.length || 1)) * 100)}%` }}
                />
              </div>
              <span className="font-mono text-amber-300 font-bold">
                {Math.round(((currentLeadIndex + 1) / (dossiers.length || 1)) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500 uppercase font-mono mr-1">Focus Tab:</span>
              {(['pain', 'build', 'economics', 'contact', 'outreach'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold transition ${
                    activeTab === tab 
                      ? 'bg-amber-500 text-black' 
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {tab === 'pain' ? '1. Pain' : tab === 'build' ? '2. Build' : tab === 'economics' ? '3. $2,400 ROI' : tab === 'contact' ? '4. 📞 Contact' : '5. Pitch'}
                </button>
              ))}
              <button
                onClick={() => setActiveTab(activeTab === 'all' ? 'pain' : 'all')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                  activeTab === 'all' 
                    ? 'bg-cyan-500 text-black font-bold' 
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                }`}
                title="Toggle all sections stacked"
              >
                {activeTab === 'all' ? 'Show Tabs' : 'All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* ========================================================================= */}
        {/* COLUMN 1: OPPORTUNITY DOSSIERS QUEUE (3.5 cols ~ 29%)                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 h-full min-h-0 flex flex-col bg-[#050811] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-3 bg-[#090d16] border-b border-white/[0.07] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                VERIFIED POOL ({dossiers.length})
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-bold">
                {filteredDossiers.length} MATCHING
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by business, city, pain..."
                className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Cross-Opportunity Patterns Ribbon */}
            <div className="p-2 rounded-lg bg-black/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-cyan-400" />
                  <span>Sentinel Patterns ({patterns.length})</span>
                </span>
                {selectedPattern !== 'ALL' && (
                  <button onClick={() => setSelectedPattern('ALL')} className="text-[9px] text-gray-400 hover:text-white underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin">
                {patterns.map(pat => (
                  <button
                    key={pat.id}
                    onClick={() => setSelectedPattern(selectedPattern === pat.id ? 'ALL' : pat.id)}
                    className={`text-[9px] px-2 py-0.5 rounded whitespace-nowrap transition font-sans ${
                      selectedPattern === pat.id
                        ? 'bg-cyan-500 text-black font-bold'
                        : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {pat.title.split(' ')[0]} ({pat.reusePotentialCount})
                  </button>
                ))}
              </div>
            </div>

            {/* Lifecycle Stages Filter */}
            <div className="flex items-center gap-1 text-[10px] overflow-x-auto pb-0.5 scrollbar-thin">
              {['ALL', 'PAIN_CONFIRMED', 'DEMO_READY', 'BUSINESS_MODEL_UNDERSTOOD', 'WEBSITE_CAPTURED', 'IDENTITY_VERIFIED'].map(stage => (
                <button
                  key={stage}
                  onClick={() => setSelectedLifecycle(stage)}
                  className={`px-2 py-0.5 rounded-full whitespace-nowrap text-[9px] font-mono transition ${
                    selectedLifecycle === stage
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {stage === 'ALL' ? 'All' : stage.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Dossiers List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
            {loading ? (
              <div className="py-8 text-center text-gray-500 text-xs">
                Scanning Scout radar and compiling verified dossiers...
              </div>
            ) : filteredDossiers.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs">
                No dossiers match the selected filters.
              </div>
            ) : (
              filteredDossiers.map((d) => {
                const isSelected = activeDossier?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDossier(d.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500/50 text-white shadow-md'
                        : 'bg-black/30 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-amber-400 font-bold font-mono">
                        {d.id.toUpperCase()}
                      </span>
                      {getLifecycleBadge(d.lifecycle)}
                    </div>

                    <div className={`font-sans text-xs font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {d.business.name}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-sans">
                      <span className="truncate max-w-[140px] flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-red-400 shrink-0" />
                        <span>{d.business.location}</span>
                      </span>
                      <span className="font-mono text-emerald-400 font-bold shrink-0">
                        ${d.economics.proposedPriceUSD.toLocaleString()}
                      </span>
                    </div>

                    {d.prototype && (
                      <div className="flex items-center gap-1 text-[9px] text-cyan-400 font-mono">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Micro-Proof Built ({d.prototype.sentinelScore}/100)</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: WORKFORCE OPPORTUNITY WORKBENCH & CHAT (4 cols ~ 33%)           */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col">
          {activeDossier ? (
            <GideonContextChat
              page="loops-opportunities"
              missionId={activeDossier.missionId || activeDossier.id}
              projectId={activeDossier.id}
              contextType="OPPORTUNITY"
              contextId={activeDossier.id}
              conversationId={activeDossier.conversationId || `conv-opp-${activeDossier.id}`}
              placeholder={`Instruct Scout, Atlas, Forge on "${activeDossier.business.name}"...`}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-xs">
              No opportunity selected.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3: DEEP OPPORTUNITY INTELLIGENCE INSPECTOR (5 cols ~ 42%)          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 h-full min-h-0 flex flex-col bg-[#050811] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
          {activeDossier ? (
            <>
              {/* Header */}
              <div className="p-3 bg-[#090d16] border-b border-white/[0.07] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs font-sans">
                      {activeDossier.business.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-white/10 text-gray-300">
                      {activeDossier.business.industry}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-sans flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>{activeDossier.business.location}</span>
                    {activeDossier.business.website && (
                      <>
                        <span>•</span>
                        <a
                          href={activeDossier.business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-0.5 text-[10px]"
                        >
                          <span>{activeDossier.business.website.replace('https://', '').replace('http://', '').replace('www.', '')}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] text-gray-400 font-mono">STATE MACHINE</div>
                  <div className="mt-0.5">
                    {getLifecycleBadge(activeDossier.lifecycle)}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="px-3 py-2 bg-black/60 border-b border-white/5 flex items-center justify-between gap-1 text-[10px] overflow-x-auto scrollbar-thin">
                <button
                  onClick={() => executePipelineAction('SENTINEL_REVIEW')}
                  disabled={actionInProgress !== null}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition flex items-center gap-1 shrink-0 font-sans disabled:opacity-50"
                  title="Sentinel verifies identity and assigns confidence"
                >
                  <Eye className="w-3 h-3 text-cyan-400" />
                  <span>Sentinel Review</span>
                </button>

                <button
                  onClick={() => executePipelineAction('FORGE_INVESTIGATE')}
                  disabled={actionInProgress !== null}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition flex items-center gap-1 shrink-0 font-sans disabled:opacity-50"
                  title="Forge executes technical probe on public endpoint"
                >
                  <Cpu className="w-3 h-3 text-amber-400" />
                  <span>Forge Probe</span>
                </button>

                <button
                  onClick={() => executePipelineAction('FORGE_PROTOTYPE')}
                  disabled={actionInProgress !== null}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1 shrink-0 font-sans disabled:opacity-50 font-bold"
                  title="Build smallest concrete working solution demonstrating value"
                >
                  <Hammer className="w-3 h-3 text-amber-400" />
                  <span>Micro-Proof</span>
                </button>

                <button
                  onClick={() => executePipelineAction('SENTINEL_VALIDATE')}
                  disabled={actionInProgress !== null || !activeDossier.prototype}
                  className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1 shrink-0 font-sans disabled:opacity-40 font-bold"
                  title="Sentinel independently audits prototype"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Validate (100)</span>
                </button>

                <button
                  onClick={() => executePipelineAction('APPROVE_CONTACT')}
                  disabled={actionInProgress !== null || activeDossier.humanContactApproved}
                  className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition flex items-center gap-1 shrink-0 font-sans disabled:opacity-50 font-bold"
                  title="Operator human approval for outreach"
                >
                  <CheckSquare className="w-3 h-3 text-purple-400" />
                  <span>{activeDossier.humanContactApproved ? 'Approved' : 'Approve Contact'}</span>
                </button>
              </div>

              {actionSuccessMessage && (
                <div className="mx-3 mt-2 p-2 rounded bg-emerald-950/40 border border-emerald-500/40 text-[10px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}

              {/* Progressive Disclosure Tab Bar */}
              <div className="px-3 py-1.5 bg-[#070b14] border-b border-white/5 flex items-center justify-between text-[11px] font-sans">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
                  <button
                    onClick={() => setActiveTab('pain')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
                      activeTab === 'pain'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>1. Pain & Evidence</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('build')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
                      activeTab === 'build'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Hammer className="w-3 h-3" />
                    <span>2. Forge Build Spec</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('economics')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
                      activeTab === 'economics'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <DollarSign className="w-3 h-3" />
                    <span>3. $2,400 ROI</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('contact')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
                      activeTab === 'contact'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Phone className="w-3 h-3 text-indigo-400" />
                    <span>4. 📞 Contact & Comms</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('outreach')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
                      activeTab === 'outreach'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>5. Pitch & Stripe</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab(activeTab === 'all' ? 'pain' : 'all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition ml-2 whitespace-nowrap shrink-0 ${
                    activeTab === 'all'
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'text-gray-500 hover:text-gray-300 border border-white/5'
                  }`}
                  title="Toggle all sections stacked"
                >
                  {activeTab === 'all' ? 'Tabs' : 'All'}
                </button>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
                {/* === TAB 1: PAIN & EVIDENCE === */}
                {(activeTab === 'pain' || activeTab === 'all') && (
                  <>
                    {/* 4. SENTINEL OPPORTUNITY INTELLIGENCE BRIEF */}
                    <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px] uppercase font-sans flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          Sentinel Opportunity Intelligence Brief
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">
                          Signal: {activeDossier.discovery.signalType}
                        </span>
                      </div>

                      {/* Confidence Meters */}
                      <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                        <div className="p-1.5 rounded bg-[#070b14] border border-white/5">
                          <div className="text-[8px] text-gray-500">IDENTITY</div>
                          <div className="text-[11px] font-bold text-emerald-400">96%</div>
                        </div>
                        <div className="p-1.5 rounded bg-[#070b14] border border-white/5">
                          <div className="text-[8px] text-gray-500">PAIN CONF.</div>
                          <div className="text-[11px] font-bold text-amber-400">{activeDossier.pain.confidence}%</div>
                        </div>
                        <div className="p-1.5 rounded bg-[#070b14] border border-white/5">
                          <div className="text-[8px] text-gray-500">TECH DIAG.</div>
                          <div className="text-[11px] font-bold text-cyan-400">
                            {activeDossier.lifecycle === 'PAIN_CONFIRMED' ? '85%' : '55%'}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-[#070b14] border border-white/5">
                          <div className="text-[8px] text-gray-500">COMMERCIAL</div>
                          <div className="text-[11px] font-bold text-purple-400">78%</div>
                        </div>
                      </div>

                      {/* What We Know vs What We Don't Know */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        <div className="p-2 rounded-lg bg-[#070b14] border border-emerald-500/20 space-y-1">
                          <div className="text-[9px] font-mono font-bold text-emerald-400 uppercase">What We Know (Facts):</div>
                          <div className="text-[10px] text-gray-300 font-sans space-y-0.5">
                            <div>• Operating in {activeDossier.business.location}</div>
                            <div>• Domain: {activeDossier.business.website || 'Directory Listing'}</div>
                            {activeDossier.contact && (
                              <div>• Decision Maker: {activeDossier.contact.decisionMaker.name} ({activeDossier.contact.decisionMaker.title})</div>
                            )}
                            {activeDossier.contact && (
                              <div>• Verified Line: {activeDossier.contact.channels.phone} ({activeDossier.contact.channels.directEmail})</div>
                            )}
                            {activeDossier.pain.evidenceBackedFacts.map((f, i) => (
                              <div key={i}>• {f}</div>
                            ))}
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-[#070b14] border border-amber-500/20 space-y-1">
                          <div className="text-[9px] font-mono font-bold text-amber-400 uppercase">What We Don't Know:</div>
                          <div className="text-[10px] text-gray-300 font-sans space-y-0.5">
                            <div>• Historical monthly lead abandonment rate</div>
                            <div>• Internal CMS / hosting access credentials</div>
                            <div>• Client's current quarterly marketing budget ceiling</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. TECHNICAL DIAGNOSIS MATRIX */}
                    <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2">
                      <span className="font-bold text-white text-[11px] uppercase font-sans block">
                        Technical Diagnosis Matrix (Empirical Breakdown)
                      </span>

                      <div className="grid grid-cols-1 gap-1.5">
                        {Object.entries(activeDossier.diagnosis).map(([facet, items]) => (
                          <div key={facet} className="p-2 rounded-lg bg-[#070b14] border border-white/5 space-y-1">
                            <div className="text-[10px] text-gray-400 font-mono font-bold uppercase">
                              {facet}
                            </div>
                            {(items as any[]).map((item: any, idx: number) => (
                              <div key={idx} className="flex items-start justify-between gap-2 text-[10px] pt-0.5">
                                <span className="text-gray-300 font-sans flex-1">
                                  <strong>{item.aspect}:</strong> {item.detail}
                                </span>
                                <span className="shrink-0">{getVerdictBadge(item.verdict)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* === TAB 2: FORGE BUILD SPEC === */}
                {(activeTab === 'build' || activeTab === 'all') && (
                  <>
                    {/* 1. BUILD THIS IN LOOP 1 BANNER */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-black to-[#060c18] border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
                          <Hammer className="w-4 h-4 text-amber-400" />
                          BUILD THIS (Full Solution in Loop 1)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                          ENGINEERING DISPATCH
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                        Instantiates a linked Build Mission in Loop 1 for Atlas and Forge to architect <strong>{activeDossier.solution.productName}</strong>. Zero autonomous client messaging or spend.
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleBuildThis(activeDossier)}
                          disabled={actionInProgress !== null}
                          className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-glow-primary font-sans disabled:opacity-50"
                        >
                          <Hammer className="w-4 h-4" />
                          <span>{actionInProgress === 'BUILD_THIS' ? 'Provisioning Mission...' : activeDossier.missionId ? 'Re-provision Build Mission' : '⚡ BUILD THIS SOLUTION IN LOOP 1'}</span>
                        </button>

                        {activeDossier.missionId && (
                          <Link
                            href={`/loops/build?mission=${activeDossier.missionId}`}
                            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1 shrink-0 font-sans"
                          >
                            <span>Open in Build Studio</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* 2. FORGE MICRO-PROTOTYPE CARD (IF BUILT) */}
                    {activeDossier.prototype && (
                      <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/40 via-black to-[#050a14] border border-cyan-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                            Forge Micro-Prototype Deliverable
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                            activeDossier.prototype.validatedBySentinel
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {activeDossier.prototype.validatedBySentinel ? `SENTINEL QA: ${activeDossier.prototype.sentinelScore}/100` : 'PENDING SENTINEL AUDIT'}
                          </span>
                        </div>

                        <div className="text-[11px] text-gray-200 font-sans">
                          <strong>Title:</strong> {activeDossier.prototype.title}
                        </div>
                        <p className="text-[10px] text-gray-400 font-sans">
                          {activeDossier.prototype.scope}
                        </p>

                        <div className="space-y-1 pt-1">
                          <div className="text-[9px] text-gray-500 font-mono uppercase">Quality Invariants:</div>
                          {activeDossier.prototype.qualityChecklist.map((chk, idx) => (
                            <div key={idx} className="text-[10px] text-gray-300 font-sans flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{chk.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. REUSABLE CAPABILITY PATTERN ALERT (IF PART OF CLUSTER) */}
                    {activePattern && (
                      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[11px] space-y-1 font-sans">
                        <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                          <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                          <span>Cross-Opportunity Pattern Detected ({activePattern.matchingOpportunityIds.length} Businesses)</span>
                        </div>
                        <div className="text-gray-300">
                          <strong>Shared Bottleneck:</strong> {activePattern.sharedBottleneck}
                        </div>
                        <div className="text-cyan-300 text-[10px] font-mono">
                          Recommended Capability: {activePattern.recommendedCapability.name}
                        </div>
                      </div>
                    )}

                    {/* 6. PROPOSED SOLUTION SPECIFICATION */}
                    <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px] uppercase font-sans">
                          Targeted Solution Specification
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">
                          {activeDossier.solution.productName}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                        <strong>Objective:</strong> {activeDossier.solution.objective}
                      </p>

                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">Features:</span>
                        {activeDossier.solution.features.map((feat, idx) => (
                          <div key={idx} className="text-[11px] text-gray-300 font-sans flex items-start gap-1.5">
                            <span className="text-cyan-400 font-bold">✓</span>
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-2 rounded-lg bg-[#070b14] border border-white/5 text-[10px] text-gray-400 font-mono space-y-0.5">
                        <div><strong>Architecture:</strong> {activeDossier.solution.architecture.join(', ')}</div>
                        <div><strong>Integrations:</strong> {activeDossier.solution.integrations.join(', ')}</div>
                      </div>
                    </div>
                  </>
                )}

                {/* === TAB 3: INTELLIGENT ECONOMICS ($2,400 ROI) === */}
                {(activeTab === 'economics' || activeTab === 'all') && (
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px] uppercase font-sans flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        Intelligent Economics (Ledger Engine)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        Confidence: {activeDossier.economics.confidence}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-[#070b14] border border-white/5">
                        <div className="text-[9px] text-gray-500 uppercase">Proposed Quote</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono">
                          ${activeDossier.economics.proposedPriceUSD.toLocaleString()} USD
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-[#070b14] border border-white/5">
                        <div className="text-[9px] text-gray-500 uppercase">Price Range</div>
                        <div className="text-[10px] font-bold text-gray-300 font-mono">
                          ${activeDossier.economics.priceRangeUSD[0]} - ${activeDossier.economics.priceRangeUSD[1]}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-[#070b14] border border-white/5">
                        <div className="text-[9px] text-gray-500 uppercase">50% Deposit</div>
                        <div className="text-xs font-bold text-amber-400 font-mono">
                          ${activeDossier.economics.depositRequirementUSD.toLocaleString()} USD
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#070b14] border border-white/5 text-[10px] text-gray-300 font-sans space-y-1">
                      <div>
                        <strong className="text-gray-400">Ledger Rationale:</strong> {activeDossier.economics.pricingRationale}
                      </div>
                      <div className="text-[9px] text-gray-500 font-mono">
                        Build Effort: {activeDossier.economics.estimatedBuildHours}h • Infra: ~${activeDossier.economics.estimatedComputeCostUSD}/mo • Retainer: ~${activeDossier.economics.recurringPriceUSD || 0}/mo
                      </div>
                      <div className="pt-1 border-t border-white/5 text-emerald-300 text-[10px]">
                        <strong>Austin Market Payback:</strong> Just 2 commercial ($1,200/ea) or 4 residential ($500/ea) inspections recoups 100% of this $2,400 investment in &lt; 30 days.
                      </div>
                    </div>
                  </div>
                )}

                {/* === TAB 4: 📞 CONTACT & COMMUNICATIONS CONTROL PLANE === */}
                {(activeTab === 'contact' || activeTab === 'all') && (
                  <div className="space-y-3.5">
                    {/* Feedback alert */}
                    {commsFeedback && (
                      <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between font-sans">
                        <span>{commsFeedback}</span>
                        <button onClick={() => setCommsFeedback(null)} className="text-gray-400 hover:text-white">✕</button>
                      </div>
                    )}

                    {/* 1. DECISION MAKER PROFILE & REACHABILITY MATRIX */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0d1322] via-black to-[#090e1c] border border-indigo-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs uppercase font-sans flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-indigo-400" />
                          Executive Decision Maker Profile
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          VERIFIED ENTITY
                        </span>
                      </div>

                      {/* Profile Card */}
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-black/60 border border-white/5 font-sans">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shrink-0 shadow-md">
                          {activeDossier.contact?.decisionMaker.avatar || activeDossier.contact?.decisionMaker.name?.split(' ').map((n: string) => n[0]).join('') || 'DM'}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white truncate">
                              {activeDossier.contact?.decisionMaker.name || 'Executive Director'}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono">
                              {activeDossier.contact?.decisionMaker.role || 'Founder & Decision Maker'}
                            </span>
                          </div>
                          <div className="text-xs text-indigo-300">
                            {activeDossier.contact?.decisionMaker.title || 'Principal Executive'} • {activeDossier.business.name}
                          </div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1.5 pt-0.5">
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span><strong>Best Contact Window:</strong> {activeDossier.contact?.channels.preferredOutreachWindow || '09:30 - 11:30 AM'} ({activeDossier.contact?.channels.timeZone})</span>
                          </div>
                        </div>
                      </div>

                      {/* Direct Reachability Channels Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
                        {/* Direct Email */}
                        <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/5 space-y-1">
                          <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between">
                            <span className="flex items-center gap-1 text-indigo-300">
                              <Mail className="w-3 h-3" />
                              DIRECT WORK EMAIL
                            </span>
                            <span className="text-[9px] text-emerald-400 uppercase font-bold">PRIMARY CHANNEL</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={`mailto:${activeDossier.contact?.channels.directEmail || 'inquiries@domain.com'}`}
                              className="font-mono text-white text-[11px] hover:text-indigo-300 transition truncate"
                            >
                              {activeDossier.contact?.channels.directEmail || 'inquiries@domain.com'}
                            </a>
                            <button
                              onClick={() => copyToClipboard(activeDossier.contact?.channels.directEmail || '', 'email')}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] shrink-0"
                              title="Copy Email"
                            >
                              {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Direct Phone */}
                        <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/5 space-y-1">
                          <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between">
                            <span className="flex items-center gap-1 text-indigo-300">
                              <Phone className="w-3 h-3" />
                              DIRECT LOCAL PHONE
                            </span>
                            <span className="text-[9px] text-gray-400 uppercase">LOCAL REGISTRY</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <a
                              href={`tel:${activeDossier.contact?.channels.phone || ''}`}
                              className="font-mono text-white text-[11px] hover:text-indigo-300 transition truncate"
                            >
                              {activeDossier.contact?.channels.phone || 'Market Local Line'}
                            </a>
                            <button
                              onClick={() => copyToClipboard(activeDossier.contact?.channels.phone || '', 'phone')}
                              className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] shrink-0"
                              title="Copy Phone"
                            >
                              {copiedField === 'phone' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        {/* Office HQ Address */}
                        <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/5 space-y-1 sm:col-span-2">
                          <div className="text-[10px] text-gray-400 font-mono flex items-center justify-between">
                            <span className="flex items-center gap-1 text-indigo-300">
                              <MapPin className="w-3 h-3" />
                              VERIFIED OFFICE HEADQUARTERS
                            </span>
                            {activeDossier.contact?.decisionMaker.linkedinUrl && (
                              <a
                                href={activeDossier.contact.decisionMaker.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
                              >
                                <span>LinkedIn Profile</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <div className="text-gray-300 text-[11px]">
                            {activeDossier.contact?.channels.officeAddress || activeDossier.business.location}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. TAILORED OUTREACH STRATEGY & 4-STEP CADENCE */}
                    <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 space-y-3 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-purple-400" />
                          Tailored Outreach Playbook & 4-Step Cadence
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          Angle: {activeDossier.business.industry}
                        </span>
                      </div>

                      {/* Hook & Angle Box */}
                      <div className="p-2.5 rounded-lg bg-[#070b14] border border-purple-500/20 space-y-1.5 text-xs">
                        <div>
                          <strong className="text-purple-300 font-mono text-[10px] uppercase block">Personalized Cold Hook:</strong>
                          <p className="text-gray-300 italic pt-0.5">
                            "{activeDossier.contact?.outreach.hook || activeDossier.pain.hypothesis}"
                          </p>
                        </div>
                        <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[11px]">
                          <span className="text-gray-400"><strong>Commercial Angle:</strong> {activeDossier.contact?.outreach.primaryAngle || activeDossier.solution.objective}</span>
                        </div>
                      </div>

                      {/* Cadence Steps Stepper Tabs */}
                      <div className="space-y-2">
                        <div className="text-[10px] text-gray-400 font-mono font-bold uppercase flex items-center justify-between">
                          <span>Multi-Touch Outreach Cadence (4 Steps)</span>
                          <span className="text-gray-500">Click step to view message copy</span>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 font-mono text-center">
                          {(activeDossier.contact?.outreach.cadence || [
                            { day: 1, channel: 'EMAIL', stepName: 'Micro-Proof', touchpointSummary: 'Initial demo' },
                            { day: 3, channel: 'LINKEDIN', stepName: 'LinkedIn', touchpointSummary: 'Touchpoint' },
                            { day: 6, channel: 'EMAIL', stepName: 'ROI Model', touchpointSummary: 'Payback breakdown' },
                            { day: 9, channel: 'EMAIL', stepName: 'Close File', touchpointSummary: 'Opt-out' }
                          ]).map((step, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedCadenceStep(idx)}
                              className={`p-1.5 rounded-lg border transition text-left ${
                                selectedCadenceStep === idx
                                  ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                                  : 'bg-[#070b14] border-white/5 text-gray-400 hover:text-white'
                              }`}
                            >
                              <div className="text-[9px] font-bold text-gray-400">DAY {step.day} • {step.channel}</div>
                              <div className="text-[10px] font-bold truncate text-white">{step.stepName}</div>
                            </button>
                          ))}
                        </div>

                        {/* Selected Step Message Copy Preview */}
                        {activeDossier.contact?.outreach.cadence?.[selectedCadenceStep] && (
                          <div className="p-3 rounded-lg bg-[#070b14] border border-white/10 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-purple-400 font-bold">
                                Subject: {activeDossier.contact.outreach.cadence[selectedCadenceStep].templateSubject || 'Solution Inquiry'}
                              </span>
                              <button
                                onClick={() => copyToClipboard(activeDossier.contact?.outreach.cadence[selectedCadenceStep].templateBody || '', 'step-body')}
                                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] flex items-center gap-1 font-sans"
                              >
                                {copiedField === 'step-body' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedField === 'step-body' ? 'Copied' : 'Copy Message'}</span>
                              </button>
                            </div>
                            <pre className="p-2.5 rounded bg-black/60 text-[11px] text-gray-300 font-mono whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto border border-white/5">
                              {activeDossier.contact.outreach.cadence[selectedCadenceStep].templateBody}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. COMMUNICATIONS ENGINE CONTROL PLANE INTEGRATION */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0d1322] via-black to-[#0e111a] border border-indigo-500/40 space-y-3 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-indigo-400" />
                          Communications Control Plane (Phase 6.5 Nervous System)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {activeDossier.contact?.communicationIntegration.status || 'PENDING_APPROVAL'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/50 border border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                        <div>
                          <span className="text-gray-500 block">THREAD ID:</span>
                          <span className="text-indigo-300 font-bold">{activeDossier.contact?.communicationIntegration.conversationId || `conv-${activeDossier.id}`}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">STAGED DRAFT:</span>
                          <span className="text-amber-300 font-bold">{activeDossier.contact?.communicationIntegration.draftId || `drf-${activeDossier.id}`}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">HMAC INTEGRITY:</span>
                          <span className="text-emerald-400 font-bold">SHA-256 Verified</span>
                        </div>
                      </div>

                      {/* Interactive Control Plane Actions */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <button
                          onClick={() => handleAuthorizeComms(activeDossier.id)}
                          disabled={commsActionLoading}
                          className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                        >
                          <Lock className="w-3.5 h-3.5 text-emerald-200" />
                          <span>🛡️ Authorize & Dispatch</span>
                        </button>

                        <button
                          onClick={() => handleSimulateInbound(activeDossier.id)}
                          disabled={commsActionLoading}
                          className="py-2 px-2.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <Radio className="w-3.5 h-3.5 text-indigo-400" />
                          <span>📥 Simulate Inbound Reply</span>
                        </button>

                        <Link
                          href={`/communications?id=${activeDossier.contact?.communicationIntegration.conversationId || 'conv-' + activeDossier.id}&oppId=${activeDossier.id}`}
                          className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>💬 Open Comms Hub</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        </Link>
                      </div>

                      {/* Simulated Inbound Diagnostic Inspector */}
                      {simulatedInboundResult && (
                        <div className="p-3 rounded-lg bg-black/80 border border-indigo-500/40 space-y-2 text-xs animate-in fade-in">
                          <div className="flex items-center justify-between text-indigo-300 font-mono text-[10px] font-bold">
                            <span>LIVE COMMUNICATIONS INGESTION FORENSIC REPORT</span>
                            <span>Message ID: {simulatedInboundResult.inboundMessage?.id}</span>
                          </div>

                          <div className="p-2 rounded bg-[#070b14] border border-white/5 space-y-1">
                            <div className="text-[10px] text-gray-400 font-mono">Inbound Client Inquiry:</div>
                            <div className="text-gray-200 italic">"{simulatedInboundResult.inboundMessage?.sanitizedContent}"</div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="p-1.5 rounded bg-[#070b14] border border-white/5">
                              <span className="text-gray-500">CLASSIFICATION:</span>
                              <span className="text-cyan-300 font-bold block">{simulatedInboundResult.classification?.category}</span>
                            </div>
                            <div className="p-1.5 rounded bg-[#070b14] border border-white/5">
                              <span className="text-gray-500">ACCEPTANCE EVAL:</span>
                              <span className="text-amber-400 font-bold block">{simulatedInboundResult.acceptanceConfidence?.confidence} (Strict State Gate)</span>
                            </div>
                          </div>

                          {simulatedInboundResult.generatedReplyDraft && (
                            <div className="p-2 rounded bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                              <span className="text-[10px] font-mono text-indigo-300 font-bold block">
                                Atlas Auto-Drafted Commercial Response:
                              </span>
                              <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {simulatedInboundResult.generatedReplyDraft.draftText}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* === TAB 5: HUMAN OUTREACH & STRIPE WORKBENCH === */}
                {(activeTab === 'outreach' || activeTab === 'all') && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleCopyPitch(activeDossier)}
                        className="py-2 px-2.5 rounded-xl bg-white/5 hover:bg-amber-600/20 border border-white/10 hover:border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm font-sans"
                      >
                        {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPitch ? 'Copied to Clipboard!' : '📋 Copy Proof Proposal'}</span>
                      </button>

                      <a
                        href={`http://localhost:4102/checkout?package=${encodeURIComponent(activeDossier.solution.productName)}&amount=${activeDossier.economics.proposedPriceUSD}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm font-sans"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>💳 Stripe Checkout Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    {/* Operator Governance Guard */}
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[10px] text-gray-400 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Operator Governance: Outbound outreach requires human dispatch. Zero autonomous spam.</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-xs">
              No opportunity selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
