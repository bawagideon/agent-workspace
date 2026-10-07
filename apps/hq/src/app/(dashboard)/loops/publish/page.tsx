'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  Film, 
  Plus, 
  Search, 
  ArrowLeft, 
  X, 
  Share2, 
  Eye,
  Building2,
  Image as ImageIcon
} from 'lucide-react';
import { GideonContextChat } from '@/components/chat/GideonContextChat';
import { LoopMission } from '@/lib/LoopMissionAdapter';

const LINKEDIN_POST_CONTENT = `Your webhook probably works.
Until Stripe retries the exact same payment 20 times in 3 seconds.

When engineers build payment webhook handlers, the initial implementation almost always looks like this:
1. Receive POST /webhook
2. Parse body
3. Update database
4. Return 200 OK

On localhost, it passes every test.

In production, distributed networks don't behave like localhost.
Network drops happen. Upstream gateways drop connections before reading the 200 OK.
So Stripe's automated backoff engine fires retries.
Or worse: parallel worker threads receive concurrent deliveries of the exact same event at the exact same millisecond.

If your handler relies on "if (!exists) insert()", database race conditions allow concurrent deliveries to pass read checks simultaneously. Our bridge enforces atomic idempotency locks, guaranteeing 0 duplicate downstream deliveries under concurrent replay assaults.

To solve this properly, I built the Webhook Billing Bridge around 5 zero-compromise invariants:

1. Constant-Time Signature Validation
We use crypto.timingSafeEqual over raw byte buffers rather than ordinary string comparison for signature verification to reduce timing side-channel exposure.

2. Anti-Replay Timestamp Decay
Every event header is validated against an enforced 300-second TTL window (|now - t| <= 300s). Replay attacks from captured packets get rejected before touching business logic.

3. Atomic Idempotency Locks
Instead of optimistic database checks, incoming events must acquire an atomic in-memory lock on the idempotency key.
In our stress test firing 20 concurrent identical requests at the exact same millisecond:
• Exactly 1 was processed and committed.
• 19 were intercepted and deduplicated.
• 0.00% duplicate downstream deliveries.

4. Downstream Uncertainty Quarantine
Downstream billing APIs fail and timeout. Naively retrying duplicates payment charges.
Our bridge transitions uncertain timeouts into a QUARANTINED state, returning 503 so upstream uses backoff while preventing duplicate processing.

5. Interactive Assault Simulator
I didn't want this to just be a theoretical architecture post. I built an interactive sandbox verifier right into the repo where you can tamper with signatures, simulate expired timestamps, and trigger a 20-thread concurrency assault in your browser.

The implementation is written in TypeScript and verified with 100% automated tests (11/11 passing tests, 0 secrets detected, sealed under Sentinel QA contract ev-qa-contract-1790547094069-41f1e2d3).

Reliable systems aren't built by hoping edge cases don't happen.
They're built by assuming every edge case is happening right now.

Full source code, architecture diagrams, and the interactive simulator:
👉 https://github.com/bawagideon/webhook-billing-bridge

Interactive Simulator: https://github.com/bawagideon/webhook-billing-bridge/blob/main/public/index.html
Live 3D Portfolio: https://gideonbawa-website.netlify.app/#work

How are you handling idempotency and delivery uncertainty in your webhook pipelines? Drop your thoughts below.

#DistributedSystems #SoftwareEngineering #TypeScript #Webhooks #SystemDesign #BackendEngineering`;

const DEBUGGER_POST_CONTENT = `You just deployed your Stripe webhook handler.
On localhost: 200 OK.
In production: 400 Bad Request. Signature Verification Failed.

Every backend engineer has lost hours to this exact bug.

Here is why webhook signatures fail in production, and the 5 zero-compromise invariants needed to solve it:

1. The "Body Mutation" Trap
Most developers use Express or Fastify with:
app.use(express.json());

When Express parses JSON, it parses the body into an in-memory JavaScript object.
When your webhook library computes the HMAC, it stringifies that object back to text.
Except:
• JSON key order might shift.
• Trailing decimals are truncated (50.00 becomes 50).
• Unicode characters and escaped slashes are transformed.
The result? The raw bytes you verify no longer match what Stripe signed at origin.
Fix: Webhook endpoints MUST preserve the raw Buffer before any body-parser touches it.

2. Timestamp Decay & NTP Clock Skew
Stripe signatures arrive formatted like:
t=1700000000,v1=abcdef12345...

Stripe enforces a strict 300-second TTL window (|now - t| <= 300s) to prevent packet-capture replay attacks.
If your cloud server's clock drifts by 5 minutes, or an upstream gateway retries an event after backoff, the timestamp is expired and rejected before hitting your database.

3. Whitespace & Trailing Newlines
Nginx, Cloudflare, AWS API Gateway, and reverse proxies often normalize HTTP payloads by stripping or adding trailing newlines (\\n or \\r\\n).
In cryptographic hashing, changing ONE whitespace byte completely changes the SHA-256 digest.

4. Timing Side-Channel Attacks
If your verification uses:
if (signature === expectedSignature)

You're introducing a timing vulnerability. Normal string comparison exits on the first mismatched byte, allowing attackers to measure response times and reconstruct valid signatures.
Fix: Always use crypto.timingSafeEqual over raw Buffer instances.

5. I Built a Free Developer Tool to Diagnose This in Seconds
I didn't just want to write a theory post.
I built the Webhook Payload Debugger & Replay Studio.

You paste your failing payload, header, and secret:
• It inspects raw bytes and whitespace drift.
• It tests timestamp validity and clock decay.
• It recalculates HMAC-SHA256 with constant-time equality.
• It gives you exact, copy-paste fixed middleware code for Node.js (Express/Fastify), Python (FastAPI), Go, and cURL.

100% open-source, zero dependencies, verified with 8/8 automated tests under Sentinel QA contracts.

👉 Full Source Code & Interactive Sandbox:
https://github.com/bawagideon/webhook-payload-debugger

👉 Live 3D Architecture Portfolio:
https://gideonbawa-website.netlify.app/#work

Swipe through the 8 slides above for the visual architecture breakdown.

How are you handling raw byte preservation in your webhook ingestion pipeline? Let's discuss in the comments below!

#BackendEngineering #Webhooks #SoftwareEngineering #TypeScript #Stripe #SystemDesign #DistributedSystems #DevOps`;

export default function PublishLoopStudioPage() {
  const [missions, setMissions] = useState<LoopMission[]>([]);
  const [activeMissionId, setActiveMissionId] = useState<string>('publish-webhook-case-study');
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPost, setCopiedPost] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(1);
  const [viewTab, setViewTab] = useState<'slides' | 'memes' | 'article'>('slides');
  const [selectedMeme, setSelectedMeme] = useState<1 | 2>(1);
  const [copiedArticle, setCopiedArticle] = useState(false);
  const [articleContent, setArticleContent] = useState<string>('');

  // New Mission Form State
  const [newTitle, setNewTitle] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newProject, setNewProject] = useState('webhook-billing-bridge');
  const [creating, setCreating] = useState(false);

  const handleSelectMission = (id: string) => {
    setActiveMissionId(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('mission', id);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const loadMissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/loops/missions?loop=PUBLISH');
      const data = await res.json();
      if (data.success && Array.isArray(data.missions)) {
        setMissions(data.missions);
        let selectedId = '';
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const target = urlParams.get('mission') || urlParams.get('missionId');
          if (target && data.missions.some((m: any) => m.id === target)) {
            selectedId = target;
          }
        }
        if (!selectedId && data.missions.length > 0) {
          selectedId = data.missions[0].id;
        }
        setActiveMissionId(selectedId);
      }
    } catch (err) {
      console.warn('Failed to load publish missions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMissions();
    fetch('/story/webhook-payload-debugger/linkedin_article_today.md')
      .then(r => r.ok ? r.text() : '')
      .then(txt => { if (txt) setArticleContent(txt); })
      .catch(err => console.warn('Failed to preload article:', err));
  }, []);

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newObjective.trim() || creating) return;

    try {
      setCreating(true);
      const res = await fetch('/api/loops/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loop: 'PUBLISH',
          title: newTitle,
          objective: newObjective,
          projectId: newProject,
          riskLevel: 'MEDIUM',
          workforce: ['atlas', 'forge', 'sentinel']
        })
      });

      const data = await res.json();
      if (data.success && data.mission) {
        setMissions(prev => [data.mission, ...prev]);
        setActiveMissionId(data.mission.id);
        setShowNewModal(false);
        setNewTitle('');
        setNewObjective('');
      }
    } catch (err) {
      console.error('Failed to create publish mission:', err);
    } finally {
      setCreating(false);
    }
  };

  const activeMission = missions.find(m => m.id === activeMissionId) || missions[0];

  const isDebugger = Boolean(
    activeMission?.projectId === 'webhook-payload-debugger' ||
    activeMission?.title?.toLowerCase().includes('debugger') ||
    activeMission?.id?.includes('debugger')
  );

  const postToCopy = isDebugger ? DEBUGGER_POST_CONTENT : LINKEDIN_POST_CONTENT;
  const storyFolder = isDebugger ? 'webhook-payload-debugger' : 'webhook-billing-bridge';
  const projectLabel = isDebugger ? 'Webhook Payload Debugger & Replay Studio' : 'Webhook Billing Bridge';

  const handleCopyPost = () => {
    navigator.clipboard.writeText(postToCopy);
    setCopiedPost(true);
    setTimeout(() => setCopiedPost(false), 2500);
  };

  const handleCopyArticle = () => {
    if (!articleContent) return;
    navigator.clipboard.writeText(articleContent);
    setCopiedArticle(true);
    setTimeout(() => setCopiedArticle(false), 2500);
  };

  const filteredMissions = missions.filter(m => 
    searchQuery ? m.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col space-y-3 max-w-[1780px] mx-auto min-w-0 font-mono">
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
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
            L2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-tight text-white font-sans">
                PUBLISH • EVIDENCE & SHOWCASE STUDIO
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                LOOP 2
              </span>
            </div>
            <div className="text-[11px] text-gray-400 font-sans">
              Evidence → Story Pack → 8 3D Slides → Narrative Case Study → Gate 3 Approval → Live Broadcast.
            </div>
          </div>
        </div>

        {/* Global Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition text-xs shadow-md font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ NEW PUBLISH MISSION</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Antigravity Studio Shell */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        
        {/* ========================================================================= */}
        {/* COLUMN 1: PUBLISH MISSIONS LIST (3 cols ~ 25%)                            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-3 h-full min-h-0 flex flex-col bg-[#050811] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-3 bg-[#090d16] border-b border-white/[0.07] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                PUBLISH MISSIONS ({missions.length})
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter publish missions..."
                className="w-full bg-black/60 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
            {filteredMissions.map((m) => {
              const isSelected = activeMission?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelectMission(m.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500/50 text-white shadow-md'
                      : 'bg-black/30 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-400 font-bold font-mono truncate max-w-[130px]">
                      {m.projectId || 'showcase'}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      m.status === 'COMPLETED' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                      m.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse' :
                      'bg-white/10 text-gray-300'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div className={`font-sans text-xs line-clamp-2 ${isSelected ? 'font-bold text-white' : 'text-gray-300'}`}>
                    {m.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: ACTIVE MISSION CONVERSATION & CONTENT WORKBENCH (5 cols ~ 42%)   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 h-full min-h-0 flex flex-col">
          {activeMission ? (
            <GideonContextChat
              page="loops-publish"
              missionId={activeMission.id}
              projectId={activeMission.projectId}
              conversationId={activeMission.conversationId}
              placeholder={`Message Atlas & Content Engine on "${activeMission.title}"...`}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 text-xs">
              No active mission selected.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 3: PUBLISH DELIVERABLES & BROADCAST CANVAS (4 cols ~ 33%)          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col bg-[#050811] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-3 bg-[#090d16] border-b border-white/[0.07] flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              PUBLISHING PLANE & STORY PACK
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              GATE 3 SEALED
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
            {/* 1-Click Copy Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-950/40 via-black to-black border border-red-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Ready to Broadcast</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  APPROVED
                </span>
              </div>
              <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                Deterministic visual case study for {projectLabel}. Copy the narrative and upload the 8 3D isometric slides.
              </p>
              <button
                onClick={handleCopyPost}
                className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-glow-primary"
              >
                {copiedPost ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPost ? 'Copied! Ready to post on LinkedIn' : '📋 Copy Full LinkedIn Case Study'}</span>
              </button>
            </div>

            {/* Asset Tab Switcher */}
            <div className="flex items-center gap-1 p-1 bg-black/60 border border-white/10 rounded-xl">
              <button
                type="button"
                onClick={() => setViewTab('slides')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  viewTab === 'slides'
                    ? 'bg-red-600/30 border border-red-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3D Slides (8)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('memes')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  viewTab === 'memes'
                    ? 'bg-amber-600/30 border border-amber-500 text-amber-200 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Viral Memes (2)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('article')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                  viewTab === 'article'
                    ? 'bg-cyan-600/30 border border-cyan-500 text-cyan-200 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Tech Article</span>
              </button>
            </div>

            {/* TAB 1: 3D SLIDES */}
            {viewTab === 'slides' && (
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">8 3D Isometric Slides (Slide {selectedSlide})</span>
                  <a
                    href={`/story/${storyFolder}/slide-${selectedSlide}.svg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px]"
                  >
                    <span>Raw SVG</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sNum => (
                    <button
                      key={sNum}
                      type="button"
                      onClick={() => setSelectedSlide(sNum)}
                      className={`p-1 rounded border text-center transition flex flex-col items-center gap-0.5 ${
                        selectedSlide === sNum
                          ? 'bg-red-600/30 border-red-500 text-white font-bold'
                          : 'bg-black border-white/10 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-[9px]">Slide {sNum}</span>
                      <div className="w-full h-8 rounded bg-[#030712] overflow-hidden flex items-center justify-center">
                        <img
                          src={`/story/${storyFolder}/slide-${sNum}.svg`}
                          alt={`Slide ${sNum}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Active Slide Viewer */}
                <div className="aspect-[16/9] w-full bg-[#050811] rounded-lg overflow-hidden border border-white/10 flex items-center justify-center p-2 mt-2">
                  <img
                    src={`/story/${storyFolder}/slide-${selectedSlide}.svg`}
                    alt={`Slide ${selectedSlide}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: VIRAL MEMES */}
            {viewTab === 'memes' && (
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">Viral Visual Hooks (Meme {selectedMeme})</span>
                  <a
                    href={`/story/${storyFolder}/meme-${selectedMeme}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 text-[10px]"
                  >
                    <span>Open Full Size</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMeme(1)}
                    className={`p-2 rounded-lg border text-left transition flex flex-col gap-1 ${
                      selectedMeme === 1
                        ? 'bg-amber-600/30 border-amber-500 text-white font-bold'
                        : 'bg-black border-white/10 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[10px] text-amber-300">Meme 1</span>
                    <span className="text-[11px] line-clamp-1">Localhost vs. Prod</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMeme(2)}
                    className={`p-2 rounded-lg border text-left transition flex flex-col gap-1 ${
                      selectedMeme === 2
                        ? 'bg-amber-600/30 border-amber-500 text-white font-bold'
                        : 'bg-black border-white/10 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[10px] text-amber-300">Meme 2</span>
                    <span className="text-[11px] line-clamp-1">Body Parser Trap</span>
                  </button>
                </div>
                <div className="aspect-[4/3] w-full bg-[#050811] rounded-lg overflow-hidden border border-white/10 flex items-center justify-center p-1 mt-2">
                  <img
                    src={`/story/${storyFolder}/meme-${selectedMeme}.jpg`}
                    alt={`Meme ${selectedMeme}`}
                    className="w-full h-full object-contain rounded"
                  />
                </div>
                <div className="text-[10px] text-gray-400 leading-normal bg-white/5 p-2 rounded-lg border border-white/5">
                  💡 <span className="text-gray-300 font-bold">Strategy:</span> Upload this meme as the single image on your LinkedIn post. It stops developers mid-scroll, then drives them into your repository and 3D portfolio.
                </div>
              </div>
            )}

            {/* TAB 3: LONG-FORM TECHNICAL ARTICLE */}
            {viewTab === 'article' && (
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5 truncate max-w-[200px]">
                    <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    The $12k Webhook Ghost
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                    LONG-FORM
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyArticle}
                  className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  {copiedArticle ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedArticle ? 'Copied Full Article!' : '📋 Copy Full Technical Article (Markdown)'}</span>
                </button>
                <div className="h-64 overflow-y-auto p-2.5 rounded-lg bg-[#03060e] border border-white/10 font-mono text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed select-text">
                  {articleContent || 'Loading technical article...'}
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>For LinkedIn Pulse, Substack or Dev.to</span>
                  <a
                    href={`/story/${storyFolder}/linkedin_article_today.md`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Raw Markdown</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Quick Links & Assets */}
            <div className="space-y-1.5">
              <a
                href={`/story/${storyFolder}/motion-reel.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-red-500/40 text-gray-300 hover:text-white transition flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-red-400" />
                  <span>Launch 60fps Presentation Reel</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
              </a>

              <a
                href="https://gideonbawa-website.netlify.app/#work"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-emerald-500/40 text-gray-300 hover:text-white transition flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Open Netlify 3D Portfolio</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: + NEW PUBLISH MISSION */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/20 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Create New Publish Mission
              </span>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMission} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1">What do you want to publish?</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Turn B2B Automation into a Technical Case Study"
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Source Project</label>
                <select
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="webhook-payload-debugger">webhook-payload-debugger (Diagnostic Studio)</option>
                  <option value="webhook-billing-bridge">webhook-billing-bridge (Payment Gateway)</option>
                  <option value="b2b-automation-service">b2b-automation-service (Stripe Onboarding)</option>
                  <option value="stripe-client-workflow">stripe-client-workflow (Billing Sync)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Publishing Objective & Narrative Focus</label>
                <textarea
                  required
                  rows={3}
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Describe narrative angle (e.g., 8-slide carousel demonstrating zero SQL/NoSQL injection on Stripe onboarding)..."
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500 resize-none font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <div className="text-[10px] text-gray-400">Channels: LinkedIn • 3D Portfolio</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'CREATE PUBLISH MISSION'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
