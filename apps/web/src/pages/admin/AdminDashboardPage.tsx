// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Dashboard Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Database,
  Search,
  AlertTriangle,
  Layers,
  Compass,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminDashboardMetrics } from '@bis/shared';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const data = await adminService.getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load admin metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMetrics();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading operational metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Authoritative Knowledge Ecosystem</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of Indian Standards, QCOs, vector embeddings, provenance registry, and data quality.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <Link
            to="/admin/data-quality"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Quality Diagnostics
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Standards */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Indian Standards (IS)</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {metrics?.knowledge.totalStandards ?? 'No data'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{metrics?.knowledge.activeStandards ?? 0} Active</span>
            <span>•</span>
            <span>{metrics?.knowledge.standardVersions ?? 0} Versions</span>
          </div>
        </div>

        {/* Source Documents */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Source Registry</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {metrics?.sources.totalSources ?? 'No data'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{metrics?.sources.verifiedSources ?? 0} Verified</span>
            <span>•</span>
            <span className="text-amber-400">{metrics?.sources.staleSources ?? 0} Stale (&gt;90d)</span>
          </div>
        </div>

        {/* Search Chunks */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Indexed Knowledge Chunks</span>
            <Search className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {metrics?.search.totalIndexedChunks ?? 'No data'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-semibold">{metrics?.search.embeddedChunks ?? 0} Embedded</span>
            <span>•</span>
            <span className="text-amber-400">{metrics?.search.pendingEmbeddings ?? 0} Pending</span>
          </div>
        </div>

        {/* Data Quality Issues */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Data Quality Issues</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {metrics?.dataQuality.totalIssues ?? '0'}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-rose-400 font-semibold">{metrics?.dataQuality.criticalIssues ?? 0} Critical</span>
            <span>•</span>
            <span>{metrics?.dataQuality.orphanChunkCount ?? 0} Orphans</span>
          </div>
        </div>
      </div>

      {/* Deep Operational Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge & Governance Card */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Standards & Regulatory
            </h3>
            <Link to="/admin/standards" className="text-[11px] text-blue-400 hover:text-blue-300 font-medium">
              Manage →
            </Link>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Quality Control Orders (QCOs):</span>
              <span className="font-semibold">{metrics?.knowledge.qcos ?? 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Certification Schemes:</span>
              <span className="font-semibold">{metrics?.knowledge.schemes ?? 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Product Manuals (STI):</span>
              <span className="font-semibold">{metrics?.knowledge.productManuals ?? 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Standard Amendments:</span>
              <span className="font-semibold">{metrics?.knowledge.amendments ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Consumer & Verification Hub */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              Consumer & Infrastructure
            </h3>
            <Link to="/admin/consumer-services" className="text-[11px] text-blue-400 hover:text-blue-300 font-medium">
              Manage →
            </Link>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Official Consumer Services:</span>
              <span className="font-semibold">{metrics?.consumer.consumerServices ?? 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Assaying & Hallmarking Centres (AHC):</span>
              <span className="font-semibold">{metrics?.consumer.hallmarkingCentres ?? 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Recognized Laboratories:</span>
              <span className="font-semibold">{metrics?.consumer.laboratories ?? 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Regulatory Change Events:</span>
              <span className="font-semibold">{metrics?.compliance.regulatoryChangeEvents ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Search & Ingestion Integrity */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              Search & Vector Engine
            </h3>
            <Link to="/admin/embeddings" className="text-[11px] text-blue-400 hover:text-blue-300 font-medium">
              Inspect →
            </Link>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Active Vector Provider:</span>
              <span className="font-mono text-emerald-400 font-bold">pgvector</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Failed Embedding Count:</span>
              <span className={`font-semibold ${metrics?.search.failedEmbeddings ? 'text-rose-400' : 'text-slate-300'}`}>
                {metrics?.search.failedEmbeddings ?? 0}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Active Regulatory Alerts:</span>
              <span className="font-semibold">{metrics?.compliance.activeAlerts ?? 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Unresolved Impacts:</span>
              <span className="font-semibold">{metrics?.compliance.unresolvedImpacts ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
