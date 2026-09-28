// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Search & Embeddings Index Management Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminEmbeddingStatus } from '@bis/shared';

export const AdminEmbeddingsPage: React.FC = () => {
  const [status, setStatus] = useState<AdminEmbeddingStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReindexing, setIsReindexing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const s = await adminService.getEmbeddingStatus();
      setStatus(s);
    } catch (err: any) {
      console.error('Failed to load embedding status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleReindex = async (scope: 'MISSING' | 'FAILED' | 'ALL') => {
    setIsReindexing(true);
    setMessage(null);
    try {
      const res = await adminService.triggerReindex(scope);
      setMessage(`Successfully reindexed ${res.indexedCount} chunks in ${res.durationMs}ms.`);
      fetchStatus();
    } catch (err: any) {
      setMessage(`Reindex failed: ${err?.response?.data?.error?.message || 'Unknown error'}`);
    } finally {
      setIsReindexing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Search className="w-5 h-5 text-purple-400" />
          Vector Search & Embedding Engine
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          pgvector index status, embedding dimension, provider metadata, and reindex triggers.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-blue-950/60 border border-blue-800 text-blue-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          {message}
        </div>
      )}

      {isLoading && (
        <div className="p-3 bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-xl flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
          Loading vector index metrics...
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400">Total Chunks</span>
          <p className="text-2xl font-bold text-white">{status?.totalChunks ?? 0}</p>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400">Embedded (Active)</span>
          <p className="text-2xl font-bold text-emerald-400">{status?.embeddedChunks ?? 0}</p>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400">Pending Indexing</span>
          <p className="text-2xl font-bold text-amber-400">{status?.pendingChunks ?? 0}</p>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400">Failed Embeddings</span>
          <p className="text-2xl font-bold text-rose-400">{status?.failedChunks ?? 0}</p>
        </div>
      </div>

      {/* Provider Details & Actions */}
      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Index Engine Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">Vector Store Provider</span>
            <p className="font-mono text-slate-200 font-bold mt-1">{status?.provider || 'pgvector'}</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">Embedding Model</span>
            <p className="font-mono text-slate-200 font-bold mt-1">{status?.model || 'text-embedding-3-small'}</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500">Vector Dimension</span>
            <p className="font-mono text-slate-200 font-bold mt-1">{status?.dimension || 1536} dimensions</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => handleReindex('MISSING')}
            disabled={isReindexing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin' : ''}`} />
            Index Missing Embeddings ({status?.pendingChunks ?? 0})
          </button>
          <button
            onClick={() => handleReindex('FAILED')}
            disabled={isReindexing}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Retry Failed Chunks ({status?.failedChunks ?? 0})
          </button>
          <button
            onClick={() => handleReindex('ALL')}
            disabled={isReindexing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            Rebuild Complete Vector Index
          </button>
        </div>
      </div>
    </div>
  );
};
