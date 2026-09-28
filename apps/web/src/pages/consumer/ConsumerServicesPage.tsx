// ─────────────────────────────────────────────────────────────────────────────
//  Phase 11 — Official Citizen Services & Grievance Guidance Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ExternalLink,
  Info,
  ArrowLeft,
} from 'lucide-react';
import { consumerService } from '../../services/api';
import type { ConsumerGuidanceItem } from '@bis/shared';

export const ConsumerServicesPage: React.FC = () => {
  const [guidance, setGuidance] = useState<ConsumerGuidanceItem | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string>('CONSUMER_COMPLAINT');

  useEffect(() => {
    async function loadData() {
      try {
        const guidRes = await consumerService.getGuidance(selectedServiceType);
        setGuidance(guidRes.guidance || null);
      } catch (err) {
        console.error('Failed to load consumer services guidance:', err);
      }
    }
    loadData();
  }, [selectedServiceType]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/consumer" className="hover:text-blue-600 inline-flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Consumer Hub
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Citizen Services & Complaints</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">BIS Citizen Services & Grievance Redressal</h1>
              <p className="text-xs text-slate-600 mt-1">
                Official guide to Bureau of Indian Standards public services, complaint filing, and redressal mechanisms.
              </p>
            </div>
          </div>
        </div>

        {/* Guidance Selector Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setSelectedServiceType('CONSUMER_COMPLAINT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              selectedServiceType === 'CONSUMER_COMPLAINT'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Lodge Consumer Complaint
          </button>
          <button
            onClick={() => setSelectedServiceType('HUID_VERIFICATION')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              selectedServiceType === 'HUID_VERIFICATION'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Hallmark Verification Guidance
          </button>
          <button
            onClick={() => setSelectedServiceType('LICENCE_VERIFICATION')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              selectedServiceType === 'LICENCE_VERIFICATION'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Licence Verification Guidance
          </button>
        </div>

        {/* Selected Guidance Content */}
        {guidance && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {guidance.guidanceStatus}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{guidance.title}</h2>
                <p className="text-xs text-slate-600 mt-0.5">{guidance.summary}</p>
              </div>

              {guidance.officialPortalUrl && (
                <a
                  href={guidance.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Official Complaint Portal
                </a>
              )}
            </div>

            {/* Step-by-Step Guidance */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Step-by-Step Procedure</h3>
              <div className="space-y-4">
                {guidance.steps.map((step) => (
                  <div key={step.stepNumber} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm flex items-center justify-center shrink-0">
                      {step.stepNumber}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                      {step.requiredDocuments && step.requiredDocuments.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[11px] font-semibold text-slate-500">Required Documents: </span>
                          <span className="text-[11px] text-slate-700 font-medium">
                            {step.requiredDocuments.join(', ')}
                          </span>
                        </div>
                      )}
                      {step.officialActionLink && (
                        <a
                          href={step.officialActionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 pt-1"
                        >
                          Access Portal Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips & Precautions */}
            {guidance.tips && guidance.tips.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-700" /> Essential Consumer Tips
                </h4>
                <ul className="space-y-1 text-xs text-amber-950 pl-5 list-disc">
                  {guidance.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Official Helpline Contacts */}
            {guidance.contacts && guidance.contacts.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">
                  Official Contact Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {guidance.contacts.map((contact, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-500 block mb-0.5">{contact.label}</span>
                      <span className="font-bold text-slate-900">{contact.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
