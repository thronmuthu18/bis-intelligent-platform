import React from 'react';
import type { SourceDocument, AuthorityLevel } from '@bis/shared';

interface SourceProvenanceCardProps {
  sourceDocument?: SourceDocument;
  fallbackUrl?: string;
  compact?: boolean;
}

export const SourceProvenanceCard: React.FC<SourceProvenanceCardProps> = ({
  sourceDocument,
  fallbackUrl,
  compact = false,
}) => {
  if (!sourceDocument && !fallbackUrl) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800">
        <span className="font-semibold">Provenance Note:</span> Source metadata is currently pending official registry linkage.
      </div>
    );
  }

  const url = sourceDocument?.url || fallbackUrl || '#';
  const authorityLevel: AuthorityLevel = sourceDocument?.authorityLevel || 'AUTHORITATIVE';

  const authorityBadgeStyles: Record<AuthorityLevel, string> = {
    AUTHORITATIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REFERENCE: 'bg-blue-50 text-blue-700 border-blue-200',
    UNVERIFIED: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const authorityLabels: Record<AuthorityLevel, string> = {
    AUTHORITATIVE: 'Authoritative Official Source',
    REFERENCE: 'Official Reference Material',
    UNVERIFIED: 'Unverified Reference',
  };

  const formattedRetrievedDate = sourceDocument?.retrievedAt
    ? new Date(sourceDocument.retrievedAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Verified';

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${authorityBadgeStyles[authorityLevel]}`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {authorityLabels[authorityLevel]}
        </span>
        <span className="text-slate-400">•</span>
        <span>Retrieved: {formattedRetrievedDate}</span>
        <span className="text-slate-400">•</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-blue-700 hover:text-blue-800 hover:underline"
          title="Open official BIS source portal"
        >
          Official BIS Source
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${authorityBadgeStyles[authorityLevel]}`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {authorityLabels[authorityLevel]}
            </span>
            <span className="text-xs text-slate-500">
              Source Type: <strong className="font-medium text-slate-700">{sourceDocument?.sourceType || 'BIS Official'}</strong>
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-900">
            {sourceDocument?.title || 'Bureau of Indian Standards Official Portal'}
          </h4>
          <p className="text-xs text-slate-500">
            Retrieved and verified: <span className="font-medium text-slate-700">{formattedRetrievedDate}</span>
            {sourceDocument?.versionLabel ? ` • Edition/Version: ${sourceDocument.versionLabel}` : ''}
          </p>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <span>View Official Source</span>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
};
