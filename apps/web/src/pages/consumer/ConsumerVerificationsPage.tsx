// ─────────────────────────────────────────────────────────────────────────────
//  Phase 11 — Saved Consumer Verifications History Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Gem,
} from 'lucide-react';
import { consumerService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { ConsumerVerificationHistoryItem } from '@bis/shared';

export const ConsumerVerificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState<ConsumerVerificationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<ConsumerVerificationHistoryItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchVerifications = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await consumerService.getVerifications();
      setVerifications(res.verifications || []);
    } catch (err) {
      console.error('Failed to load saved verifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      setDeleteError(null);
      await consumerService.deleteVerification(id);
      setVerifications((prev) => prev.filter((v) => v.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (err: any) {
      setDeleteError(err?.response?.data?.error?.message || 'Failed to delete verification.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/consumer" className="hover:text-blue-600 inline-flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Consumer Hub
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Saved Verifications</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Saved Verification History</h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Review and manage your saved BIS CM/L licence and HUID hallmark verifications.
              </p>
            </div>
          </div>
        </div>

        {!user ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-3">
            <p className="text-sm font-bold text-slate-800">Sign in to view saved verifications</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please sign in to your platform account to store and manage your licence and hallmark verification records.
            </p>
            <Link
              to="/login"
              className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
            >
              Sign In
            </Link>
          </div>
        ) : isLoading ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-xs text-slate-500">
            Loading your verification records...
          </div>
        ) : verifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-3">
            <History className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Saved Verifications</p>
            <p className="text-xs text-slate-500">
              Perform a licence or HUID verification and choose "Save to account" to keep records here.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                to="/consumer/licence"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
              >
                Verify a Licence
              </Link>
              <Link
                to="/consumer/huid"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
              >
                Verify a HUID
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {deleteError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs border-b border-rose-200">{deleteError}</div>
            )}
            <div className="divide-y divide-slate-100">
              {verifications.map((item) => (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-lg shrink-0 ${
                        item.verificationType === 'LICENCE'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.verificationType === 'LICENCE' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <Gem className="w-5 h-5" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{item.summary}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.resultStatus === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.resultStatus === 'NOT_FOUND'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.resultStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Saved on {new Date(item.createdAt).toLocaleDateString()} at{' '}
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete verification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {selectedItem.verificationType} Record
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedItem.summary}</h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-semibold block mb-1">Result Status</span>
                  <span className="font-bold text-slate-900">{selectedItem.resultStatus}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-semibold block mb-1">Query Parameters</span>
                  <pre className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                    {JSON.stringify(selectedItem.query, null, 2)}
                  </pre>
                </div>

                {selectedItem.evidence && Object.keys(selectedItem.evidence).length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 font-semibold block mb-1">Evidence / Notes</span>
                    <pre className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                      {JSON.stringify(selectedItem.evidence, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
