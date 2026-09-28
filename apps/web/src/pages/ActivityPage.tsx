import React, { useState } from 'react';
import {
  History,
  Package,
  FileText,
  GitMerge,
  Clock,
  Filter,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { DEMO_ACTIVITIES } from '@/mocks/mockActivities';

// ─────────────────────────────────────────────────────────────────────────────
//  ActivityPage — Audit Trail & System Activity Timeline
// ─────────────────────────────────────────────────────────────────────────────

export function ActivityPage(): React.ReactElement {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const filterTabs = [
    { key: 'ALL', label: 'All Activities' },
    { key: 'PRODUCT', label: 'Products' },
    { key: 'DOCUMENT', label: 'Documents' },
    { key: 'COMPLIANCE', label: 'Compliance' },
  ];

  const filteredActivities =
    selectedFilter === 'ALL'
      ? DEMO_ACTIVITIES
      : DEMO_ACTIVITIES.filter((a) => a.category === selectedFilter);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PRODUCT':
        return <Package size={15} className="text-blue-600" />;
      case 'DOCUMENT':
        return <FileText size={15} className="text-emerald-600" />;
      case 'COMPLIANCE':
        return <GitMerge size={15} className="text-purple-600" />;
      default:
        return <History size={15} className="text-accent-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'PRODUCT':
        return <Badge variant="blue">Product</Badge>;
      case 'DOCUMENT':
        return <Badge variant="green">Document</Badge>;
      case 'COMPLIANCE':
        return <Badge variant="yellow">Compliance</Badge>;
      default:
        return <Badge variant="grey">System</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Page Header ── */}
      <div className="pb-4 border-b border-surface-border">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Activity & Audit Log
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Complete chronological timeline of workspace actions, uploads, and compliance milestones.
        </p>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3">
        <Filter size={14} className="text-text-muted mr-1" />
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedFilter === tab.key
                ? 'bg-accent-50 text-accent-600 font-semibold'
                : 'text-text-secondary hover:bg-white hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Activity Timeline Card ── */}
      <Card>
        <CardBody className="p-6">
          <div className="space-y-6 relative">
            {filteredActivities.map((act, idx) => {
              const isLast = idx === filteredActivities.length - 1;
              return (
                <div key={act.id} className="relative flex items-start gap-4">
                  {/* Vertical timeline line */}
                  {!isLast && (
                    <div className="absolute left-[15px] top-8 bottom-[-24px] w-[2px] bg-surface-border" />
                  )}

                  {/* Avatar / Icon */}
                  <div className="z-10 w-8 h-8 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center shrink-0">
                    {getCategoryIcon(act.category)}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 bg-surface-page/50 rounded-xl p-3.5 border border-surface-border hover:bg-surface-page transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text-primary">
                          {act.title}
                        </span>
                        {getCategoryBadge(act.category)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-text-muted">
                        <Clock size={11} />
                        <span>{act.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-xs text-text-secondary mt-1.5">{act.description}</p>

                    <div className="mt-2.5 pt-2 border-t border-surface-border/60 flex items-center justify-between text-[11px] text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={act.user} size="xs" />
                        <span>{act.user}</span>
                      </div>
                      {act.productName && (
                        <span className="font-medium text-text-secondary">
                          {act.productName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
