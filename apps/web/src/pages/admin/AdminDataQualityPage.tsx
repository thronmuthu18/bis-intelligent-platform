// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Data Quality Center Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  CheckCircle,
  Info,
  XCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { adminService } from '../../services/api';
import type { DataQualityReport } from '@bis/shared';

export const AdminDataQualityPage: React.FC = () => {
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDataQualityReport();
      setReport(data);
    } catch (err: any) {
      console.error('Failed to run data quality scan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredIssues = report?.issues.filter((issue) => {
    if (severityFilter !== 'ALL' && issue.severity !== severityFilter) return false;
    if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Knowledge Governance & Data Quality Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated repository-wide integrity scanning, provenance checks, orphan detection, and freshness audits.
          </p>
        </div>
        <button
          onClick={fetchReport}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          Run Integrity Scan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/40 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Critical Issues</p>
            <p className="text-xl font-bold text-rose-400">{report?.criticalCount ?? '-'}</p>
            <p className="text-[10px] text-slate-500">Unprovenanced records</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/40 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Error Issues</p>
            <p className="text-xl font-bold text-amber-400">{report?.errorCount ?? '-'}</p>
            <p className="text-[10px] text-slate-500">Orphan/broken items</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-yellow-900/40 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Warnings</p>
            <p className="text-xl font-bold text-yellow-400">{report?.warningCount ?? '-'}</p>
            <p className="text-[10px] text-slate-500">Stale source URLs</p>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/40 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400">Info Notices</p>
            <p className="text-xl font-bold text-blue-400">{report?.infoCount ?? '-'}</p>
            <p className="text-[10px] text-slate-500">Periodic review items</p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Severity:</span>
          </div>
          {(['ALL', 'CRITICAL', 'ERROR', 'WARNING', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                severityFilter === sev
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Category filter"
            className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded-md px-2 py-1 focus:outline-none ml-2"
          >
            <option value="ALL">All Categories</option>
            <option value="MISSING_SOURCE">Missing Source</option>
            <option value="STALE_RECORD">Stale Record</option>
            <option value="DUPLICATE">Duplicate</option>
            <option value="BROKEN_MAPPING">Broken Mapping</option>
            <option value="ORPHAN_CHUNK">Orphan Chunk</option>
            <option value="MISSING_EMBEDDING">Missing Embedding</option>
            <option value="UNTRANSLATED_KEY">Untranslated Key</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Last Scan:{' '}
          {report?.scannedAt ? new Date(report.scannedAt).toLocaleTimeString() : 'Pending'}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-8 text-center text-slate-400 text-xs">
            Running repository data quality scan...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-8 text-center text-emerald-400 text-xs flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <p className="font-semibold">All Checked Records Comply with Data Quality Standards</p>
            <p className="text-slate-500 text-[11px]">No issues matching current filters were detected.</p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const severityColor =
              issue.severity === 'CRITICAL'
                ? 'border-rose-800/60 bg-rose-950/20 text-rose-300'
                : issue.severity === 'ERROR'
                ? 'border-amber-800/60 bg-amber-950/20 text-amber-300'
                : issue.severity === 'WARNING'
                ? 'border-yellow-800/60 bg-yellow-950/20 text-yellow-300'
                : 'border-blue-800/60 bg-blue-950/20 text-blue-300';

            return (
              <div
                key={issue.id}
                className={`p-4 rounded-xl border ${severityColor} flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-all`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        issue.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : issue.severity === 'ERROR'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : issue.severity === 'WARNING'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[10px] border border-slate-800">
                      {issue.category}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      Entity: <span className="text-slate-300">{issue.entityType}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white">{issue.title}</h3>
                  <p className="text-xs text-slate-300">{issue.description}</p>

                  <div className="pt-2 flex items-start gap-1.5 text-xs text-slate-400">
                    <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-300">Remediation: </span>
                      <span className="text-slate-300">{issue.remediation}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
