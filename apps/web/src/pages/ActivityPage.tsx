import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Package,
  FileText,
  GitMerge,
  Clock,
  Filter,
  Bot,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { activityService } from '@/services/api';
import type {
  UserActivityItem,
  ActivityCategory,
} from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  Time format helper (Relative and Local String)
// ─────────────────────────────────────────────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatExactTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ActivityPage — Audit Trail & System Activity Timeline (Real PostgreSQL Data)
// ─────────────────────────────────────────────────────────────────────────────

interface ActivityPageProps {
  productId?: string;
  embedded?: boolean;
}

export function ActivityPage({ productId, embedded = false }: ActivityPageProps): React.ReactElement {
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'ALL'>('ALL');
  const [activities, setActivities] = useState<UserActivityItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Expandable Metadata Row State
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<string>>(new Set());

  const pageSize = 15;

  const filterTabs: { key: ActivityCategory | 'ALL'; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PRODUCT', label: 'Product' },
    { key: 'DOCUMENT', label: 'Documents' },
    { key: 'COMPLIANCE', label: 'Compliance' },
    { key: 'ASSISTANT', label: 'Assistant' },
    { key: 'SYSTEM', label: 'System' },
  ];

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let data;
      if (productId) {
        data = await activityService.getProductActivity(productId, {
          page: currentPage,
          limit: pageSize,
          category: selectedCategory,
        });
      } else {
        data = await activityService.getUserActivity({
          page: currentPage,
          limit: pageSize,
          category: selectedCategory,
        });
      }
      setActivities(data.activities);
      setTotalCount(data.total);
      setHasMore(data.hasMore);
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 401 || status === 403) {
        setErrorMessage('Your access session has expired or is unavailable.');
      } else {
        setErrorMessage(err?.message || 'Unable to load activity records. Please try again.');
      }
      setActivities([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [productId, currentPage, selectedCategory, pageSize]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleCategoryChange = (category: ActivityCategory | 'ALL') => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setExpandedActivityIds(new Set());
  };

  const toggleExpand = (id: string) => {
    setExpandedActivityIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case 'PRODUCT':
        return <Package size={15} className="text-blue-600" />;
      case 'DOCUMENT':
        return <FileText size={15} className="text-emerald-600" />;
      case 'COMPLIANCE':
        return <GitMerge size={15} className="text-purple-600" />;
      case 'ASSISTANT':
        return <Bot size={15} className="text-accent-600" />;
      case 'SYSTEM':
      default:
        return <Layers size={15} className="text-stone-600" />;
    }
  };

  const getCategoryBadge = (category: ActivityCategory) => {
    switch (category) {
      case 'PRODUCT':
        return <Badge variant="blue">Product</Badge>;
      case 'DOCUMENT':
        return <Badge variant="green">Document</Badge>;
      case 'COMPLIANCE':
        return <Badge variant="yellow">Compliance</Badge>;
      case 'ASSISTANT':
        return <Badge variant="blue">Assistant</Badge>;
      case 'SYSTEM':
      default:
        return <Badge variant="grey">System</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Filter out any sensitive keys from metadata object before display
  const sanitizeMetadata = (meta?: Record<string, unknown>) => {
    if (!meta || typeof meta !== 'object') return null;
    const sensitiveKeys = ['password', 'token', 'secret', 'jwt', 'authorization', 'apiKey', 'accessKey'];
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(meta)) {
      if (!sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        safe[key] = value;
      }
    }
    return Object.keys(safe).length > 0 ? safe : null;
  };

  return (
    <div className={`space-y-6 ${embedded ? '' : 'max-w-5xl mx-auto'}`}>
      {/* ── Page Header (hidden in embedded mode) ── */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Activity & Audit Log
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Complete chronological audit trail of workspace actions, compliance evaluations, document records, and assistant queries.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchActivities}
            disabled={isLoading}
            className="flex items-center gap-1.5 self-start sm:self-auto"
            aria-label="Refresh activity"
          >
            <RotateCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>
        </div>
      )}

      {/* ── Error Banner ── */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
            </div>
          </div>
          <Button size="xs" variant="secondary" onClick={fetchActivities}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Category Filter Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={14} className="text-text-muted mr-1 shrink-0" />
          {filterTabs.map((tab) => {
            const isActive = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleCategoryChange(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-accent-50 text-accent-700 font-bold border border-accent-200 shadow-2xs'
                    : 'text-text-secondary hover:bg-surface-muted border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-text-muted">
          Showing {activities.length} of {totalCount} events
        </div>
      </div>

      {/* ── Activity Timeline List ── */}
      <Card>
        <CardBody className="p-5 sm:p-6">
          {isLoading ? (
            <div className="space-y-4 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-muted animate-pulse rounded w-1/3" />
                    <div className="h-3 bg-surface-muted animate-pulse rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <EmptyState
              icon={History}
              title="No activity yet"
              description="Workspace actions, product creation, document uploads, compliance evaluations, and assistant inquiries will appear here."
            />
          ) : (
            <div className="space-y-5 relative">
              {activities.map((act, idx) => {
                const isLast = idx === activities.length - 1;
                const isExpanded = expandedActivityIds.has(act.id);
                const safeMeta = sanitizeMetadata(act.metadata);

                return (
                  <div key={act.id} className="relative flex items-start gap-4 group">
                    {/* Vertical timeline connector */}
                    {!isLast && (
                      <div className="absolute left-[15px] top-8 bottom-[-20px] w-[2px] bg-surface-border" />
                    )}

                    {/* Category Icon */}
                    <div className="z-10 w-8 h-8 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center shrink-0 group-hover:border-accent-300 transition-colors">
                      {getCategoryIcon(act.category)}
                    </div>

                    {/* Event Card Content */}
                    <div className="flex-1 bg-surface-page/60 rounded-xl p-3.5 border border-surface-border hover:border-surface-divider hover:bg-white transition-all space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-text-primary">
                            {act.title}
                          </span>
                          {getCategoryBadge(act.category)}
                          <span className="text-[10px] font-mono bg-surface-muted px-1.5 py-0.2 rounded text-text-muted">
                            {act.action}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1 text-[11px] text-text-muted shrink-0"
                          title={formatExactTime(act.timestamp)}
                        >
                          <Clock size={11} />
                          <span>{formatRelativeTime(act.timestamp)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed">
                        {act.description}
                      </p>

                      <div className="pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-text-muted">
                        <div className="flex items-center gap-2 flex-wrap">
                          {act.productName && (
                            <span className="font-semibold text-text-secondary bg-surface-muted px-2 py-0.5 rounded-md">
                              Product: {act.productName}
                            </span>
                          )}
                          {act.entityType && (
                            <span className="text-text-muted">
                              Entity: {act.entityType}
                            </span>
                          )}
                        </div>

                        {safeMeta && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(act.id)}
                            className="inline-flex items-center gap-1 text-accent-600 hover:text-accent-700 font-medium text-[11px] cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}
                      </div>

                      {/* Expandable Safe Metadata Details */}
                      {isExpanded && safeMeta && (
                        <div className="mt-2 p-2.5 bg-surface-muted/40 rounded-lg border border-surface-border text-[11px] font-mono space-y-1">
                          <p className="font-semibold text-text-secondary text-[10px] uppercase font-sans">
                            Event Metadata:
                          </p>
                          <pre className="whitespace-pre-wrap overflow-x-auto text-text-primary text-[10px]">
                            {JSON.stringify(safeMeta, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Server Pagination Bar ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 mt-4 border-t border-surface-border text-xs text-text-secondary">
              <div>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1 || isLoading}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={13} />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!hasMore || currentPage >= totalPages || isLoading}
                  className="flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
