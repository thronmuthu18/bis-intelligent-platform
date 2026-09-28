// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Knowledge Chunks Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Sparkles, Search, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminKnowledgeChunkItem } from '@bis/shared';

export const AdminKnowledgePage: React.FC = () => {
  const [chunks, setChunks] = useState<AdminKnowledgeChunkItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchChunks = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getKnowledgeChunks({ search });
      setChunks(res.chunks);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load chunks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChunks();
  }, [search]);

  const handleReindex = async (id: string) => {
    try {
      await adminService.reindexKnowledgeChunk(id);
      fetchChunks();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to reindex chunk');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Knowledge Chunks & Provenance
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Atomic standards clauses, technical requirements, and vector embedding status.
        </p>
      </div>

      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chunk content or clause text..."
          className="bg-transparent text-xs text-slate-200 placeholder-slate-500 flex-1 focus:outline-none"
        />
        <span className="text-[11px] font-mono text-slate-400">Total: {total}</span>
      </div>

      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Standard / Clause</th>
              <th className="px-4 py-3">Chunk Type</th>
              <th className="px-4 py-3">Content Excerpt</th>
              <th className="px-4 py-3">Embedding Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                  Loading knowledge chunks...
                </td>
              </tr>
            ) : chunks.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  No knowledge chunks found.
                </td>
              </tr>
            ) : (
              chunks.map((c) => (
                <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                    {c.standardIsNumber || 'General'}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{c.chunkType}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-md truncate">
                    {c.sectionTitle && <span className="font-semibold text-slate-200 mr-1">[{c.sectionTitle}]</span>}
                    {c.content}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.embeddingStatus === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : c.embeddingStatus === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {c.embeddingStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleReindex(c.id)}
                      className="p-1 text-slate-400 hover:text-purple-400 hover:bg-slate-900 rounded transition-colors"
                      title="Reindex vector embedding"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
