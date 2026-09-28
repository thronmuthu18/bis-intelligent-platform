import React from 'react';
import { cn } from '@/lib/cn';
import type { ComplianceWorkflowStage } from '@bis/shared';
import { STAGE_LABELS } from '@/mocks/mockProducts';

// ─────────────────────────────────────────────────────────────────────────────
//  Badge Component
// ─────────────────────────────────────────────────────────────────────────────

export type BadgeVariant = 'blue' | 'green' | 'yellow' | 'red' | 'grey' | 'orange';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  blue:   'bg-blue-50 text-blue-700 border border-blue-200',
  green:  'bg-green-50 text-green-700 border border-green-200',
  yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
  red:    'bg-red-50 text-red-700 border border-red-200',
  grey:   'bg-surface-muted text-text-secondary border border-surface-border',
  orange: 'bg-orange-50 text-orange-700 border border-orange-200',
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  yellow: 'bg-amber-500',
  red:    'bg-red-500',
  grey:   'bg-text-muted',
  orange: 'bg-orange-500',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({
  variant = 'grey',
  children,
  dot = false,
  className,
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        BADGE_CLASSES[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', DOT_CLASSES[variant])}
        />
      )}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  StatusBadge — maps workflow stages and product statuses to visual states
// ─────────────────────────────────────────────────────────────────────────────

export interface StatusBadgeProps {
  stage?: ComplianceWorkflowStage | string;
  status?: string;
  label?: string;
}

const STATUS_MAP: Record<string, BadgeVariant> = {
  DRAFT: 'grey',
  INFORMATION_COLLECTION: 'blue',
  READY_FOR_ANALYSIS: 'yellow',
  ACTIVE: 'green',
  ARCHIVED: 'red',
  PRODUCT_IDENTIFIED: 'blue',
  DOCUMENT_COLLECTION: 'blue',
  ANALYSIS: 'yellow',
  STANDARD_IDENTIFICATION: 'yellow',
  CERTIFICATION_ANALYSIS: 'yellow',
  TESTING_ANALYSIS: 'yellow',
  LAB_SELECTION: 'yellow',
  DOCUMENT_VERIFICATION: 'orange',
  READY_FOR_OFFICIAL_ACTION: 'green',
  OFFICIAL_ACTION: 'green',
  COMPLIANCE_TRACKING: 'green',
};

const DEFAULT_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  INFORMATION_COLLECTION: 'Information Collection',
  READY_FOR_ANALYSIS: 'Ready for Analysis',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  PRODUCT_IDENTIFIED: 'Product Identified',
  DOCUMENT_COLLECTION: 'Document Collection',
  ANALYSIS: 'Under Analysis',
  STANDARD_IDENTIFICATION: 'Standards Identified',
  CERTIFICATION_ANALYSIS: 'Certification Analysis',
  TESTING_ANALYSIS: 'Testing Analysis',
  LAB_SELECTION: 'Lab Selection',
  DOCUMENT_VERIFICATION: 'Document Verification',
  READY_FOR_OFFICIAL_ACTION: 'Ready for Action',
  OFFICIAL_ACTION: 'Official Action',
  COMPLIANCE_TRACKING: 'Compliance Tracking',
};

export function StatusBadge({ stage, status, label }: StatusBadgeProps): React.ReactElement {
  const currentKey = stage || status || 'DRAFT';
  const variant = STATUS_MAP[currentKey] ?? 'grey';
  const displayLabel = label || (stage && STAGE_LABELS[stage as ComplianceWorkflowStage]) || DEFAULT_LABELS[currentKey] || currentKey;
  return <Badge variant={variant} dot>{displayLabel}</Badge>;
}
