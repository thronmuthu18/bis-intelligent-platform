// ─────────────────────────────────────────────────────────────────────────────
//  Phase 13 — Admin Audit Trail Viewer Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { History, Filter, User, ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { adminService } from '../../services/api';
import type { AdminAuditLogItem } from '@bis/shared';

const COMMON_ACTIONS = [
  'ALL',
  'STANDARD_CREATED',
  'STANDARD_UPDATED',
  'STANDARD_PUBLISHED',
  'STANDARD_ARCHIVED',
  'SOURCE_DOCUMENT_CREATED',
  'SOURCE_DOCUMENT_UPDATED',
  'SOURCE_DOCUMENT_VERIFIED',
  'QCO_CREATED',
  'SCHEME_CREATED',
  'LABORATORY_CREATED',
  'HALLMARKING_CENTRE_CREATED',
  'INGESTION_RUN_TRIGGERED',
  'REINDEX_TRIGGERED',
];

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAuditLogs({
        page,
        limit,
        action: actionFilter === 'ALL' ? undefined : actionFilter,
        entityType: entityTypeFilter || undefined,
      });
      setLogs(res.logs);
      setTotal(res.total);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityTypeFilter]);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Append-Only Audit Trail & Compliance Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable system logs tracking every administrative action, data mutation, source verification, and state transition.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Append-Only Storage</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            {COMMON_ACTIONS.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Entity Type:</span>
          <input
            type="text"
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setPage(1);
            }}
            placeholder="e.g. Standard, QCO, Source..."
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="ml-auto text-[11px] font-mono text-slate-400">
          Total Records: {total} (Page {page} of {totalPages})
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor / Admin</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Target Entity</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-400 font-sans">
                  Loading immutable audit events...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500 font-sans">
                  No audit logs recorded for this query.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-semibold text-white">{log.userName || log.userEmail || 'System'}</span>
                    </div>
                    {log.userRole && (
                      <span className="text-[10px] text-amber-400 font-mono font-bold">[{log.userRole}]</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-bold border border-blue-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.entityType ? (
                      <span className="text-slate-300">
                        {log.entityType}
                        {log.entityId && <span className="text-slate-500 text-[10px] block">#{log.entityId.substring(0, 8)}...</span>}
                      </span>
                    ) : (
                      <span className="text-slate-600">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {log.metadata ? (
                      <span className="text-slate-400 truncate block max-w-xs text-[10px]">
                        {JSON.stringify(log.metadata)}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} events
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-40"
          >
            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
            Previous
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white disabled:opacity-40"
          >
            Next
            <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
          </button>
        </div>
      </div>

      {/* Selected Log Drawer/Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                Audit Event Inspection
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">IMMUTABLE RECORD</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <p className="text-slate-500 font-medium">Event ID</p>
                  <p className="font-mono text-slate-300">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Timestamp</p>
                  <p className="font-mono text-slate-300">{new Date(selectedLog.createdAt).toISOString()}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Actor</p>
                  <p className="text-slate-200 font-medium">{selectedLog.userName || selectedLog.userEmail || 'System'}</p>
                  {selectedLog.userRole && <p className="text-[10px] text-amber-400 font-mono">Role: {selectedLog.userRole}</p>}
                </div>
                <div>
                  <p className="text-slate-500 font-medium">Action</p>
                  <p className="text-blue-400 font-bold font-mono">{selectedLog.action}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">Payload / Event Metadata</p>
                <pre className="bg-slate-900 border border-slate-800 p-3 rounded-lg font-mono text-[11px] text-slate-200 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
