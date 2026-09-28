// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Accessible Status Badge (WCAG 2.1 AA Non-Color-Only Indicators)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Clock } from 'lucide-react';
import type { VerificationStatus } from '@bis/shared';
import { useLanguage } from '../../contexts/LanguageContext';

interface AccessibleStatusProps {
  status: VerificationStatus | string;
  className?: string;
  showIcon?: boolean;
}

export const AccessibleStatus: React.FC<AccessibleStatusProps> = ({
  status,
  className = '',
  showIcon = true,
}) => {
  const { t } = useLanguage();

  const normalized = (status || 'UNKNOWN').toUpperCase();

  switch (normalized) {
    case 'VERIFIED':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'CURRENT':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
          role="status"
          aria-label={`Status: ${t('status.verified')}`}
        >
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />}
          <span>✓ {t('status.verified')}</span>
        </span>
      );

    case 'NOT_FOUND':
    case 'NOT_MATCHED':
    case 'FAILED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 ${className}`}
          role="status"
          aria-label={`Status: ${t('status.notFound')}`}
        >
          {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />}
          <span>● {t('status.notFound')}</span>
        </span>
      );

    case 'NEEDS_REVIEW':
    case 'PARTIAL_MATCH':
    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
          role="status"
          aria-label={`Status: ${t('status.needsReview')}`}
        >
          {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />}
          <span>! {t('status.needsReview')}</span>
        </span>
      );

    case 'SOURCE_UNAVAILABLE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 ${className}`}
          role="status"
          aria-label={`Status: ${t('status.sourceUnavailable')}`}
        >
          {showIcon && <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />}
          <span>— {t('status.sourceUnavailable')}</span>
        </span>
      );

    case 'UNKNOWN':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 ${className}`}
          role="status"
          aria-label={`Status: ${t('status.unknown')}`}
        >
          {showIcon && <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />}
          <span>? {t('status.unknown')}</span>
        </span>
      );
  }
};
