'use client';

import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Shield, 
  Check, 
  Trash2, 
  PlusCircle, 
  RotateCw,
  X,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MemoryItem {
  id: string;
  category: string;
  key: string;
  value: any;
  confidence: number;
  source_type: string;
  source_reference?: string;
  created_at?: string;
}

export default function MemoryVaultPage() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Memory Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState('PROJECT');
  const [key, setKey] = useState('');
  const [factText, setFactText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hq_memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMemories(data as MemoryItem[]);
      }
    } catch (err) {
      console.warn('Memory fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !factText.trim()) {
      setError('Key and Fact details are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const newMem = {
      category,
      key: key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      value: { summary: factText.trim() },
      confidence: 1.0,
      source_type: 'USER_EXPLICIT',
      source_reference: 'Operator Added via HQ Web'
    };

    try {
      const { data, error: insertError } = await supabase
        .from('hq_memories')
        .insert(newMem)
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
      } else if (data) {
        setMemories((prev) => [data as MemoryItem, ...prev]);
        setIsModalOpen(false);
        setKey('');
        setFactText('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save memory.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('hq_memories').delete().eq('id', id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.warn('Delete error:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary-500" />
            Personal & Project Memory Vault
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Scoped knowledge repository with explicit provenance tags, confidence metrics, and editable verification status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMemories}
            className="p-2 rounded-lg bg-card border border-card-border hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            title="Refresh Memories"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-primary-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            Add Memory Fact
          </button>
        </div>
      </div>

      {/* Memories List */}
      {loading ? (
        <div className="p-16 text-center text-gray-500 space-y-2 bg-card border border-card-border rounded-xl">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-primary-500" />
          <p className="text-xs">Loading memories from Supabase...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-16 text-center space-y-3">
          <BrainCircuit className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Memory Facts Stored</h3>
          <p className="text-xs text-gray-400">
            Agents learn lessons and retrieve explicit user instructions from this vault.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {memories.map((mem) => {
            const summary = typeof mem.value === 'object' && mem.value !== null
              ? (mem.value.summary || JSON.stringify(mem.value))
              : String(mem.value);

            return (
              <div key={mem.id} className="bg-card border border-card-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-card-border/80 transition-all">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-primary-600/20 text-primary-400 px-2 py-0.5 rounded font-mono font-bold">
                      {mem.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{mem.key}</span>
                    <span className="text-[10px] text-success font-mono font-bold bg-success/10 px-2 py-0.5 rounded">
                      {((Number(mem.confidence) || 1) * 100).toFixed(0)}% CONFIDENCE
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{summary}</p>
                  <div className="flex items-center gap-4 text-[11px] font-mono text-gray-500">
                    <span>Source: <strong className="text-gray-400">{mem.source_type}</strong> ({mem.source_reference || 'System'})</span>
                    {mem.created_at && (
                      <span>Created: <strong className="text-gray-400">{new Date(mem.created_at).toLocaleDateString()}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(mem.id)}
                    className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                    title="Delete Memory Fact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Memory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-card-border rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-card-border">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-primary-500" />
                Store New Memory Fact
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4 text-xs">
              {error && (
                <div className="p-2.5 bg-danger/10 border border-danger/30 text-danger rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-bold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-primary-500"
                  >
                    <option value="USER">USER (Preference)</option>
                    <option value="PROJECT">PROJECT (Architecture/Rules)</option>
                    <option value="LESSON">LESSON (Operational Takeaway)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-bold">Memory Key</label>
                  <input
                    type="text"
                    placeholder="e.g. stack_preference"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    required
                    className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-bold">Fact Summary / Directive</label>
                <textarea
                  rows={3}
                  placeholder="State the rule, preference, or lesson clearly..."
                  value={factText}
                  onChange={(e) => setFactText(e.target.value)}
                  required
                  className="w-full bg-[#090a0f] border border-card-border rounded-lg px-3 py-2 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-card-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-card-border text-gray-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold disabled:opacity-50 transition-all shadow-lg shadow-primary-600/20"
                >
                  {submitting ? 'Saving...' : 'Save Fact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
