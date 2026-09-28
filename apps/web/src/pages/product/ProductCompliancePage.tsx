import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  FileCheck2,
  ShieldAlert,
  Layers,
  FileText,
  Building2,
  FlaskConical,
  Award,
  BookOpen,
  Lock,
  Unlock,
  Info,
  ChevronRight,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProduct } from '@/contexts/ProductContext';
import { complianceService } from '@/services/api/compliance.service';
import type {
  ComplianceJourneyOverviewResponse,
  ComplianceTaskItem,
  ApplicationDossierResponse,
  ValidateDossierResponse,
  ComplianceAlertItem,
} from '@bis/shared';

function PriorityBadgeHelper({ priority }: { priority: string }): React.ReactElement {
  let variant: 'red' | 'orange' | 'yellow' | 'blue' | 'grey' = 'grey';
  if (priority === 'CRITICAL') variant = 'red';
  else if (priority === 'HIGH') variant = 'orange';
  else if (priority === 'MEDIUM') variant = 'yellow';
  else if (priority === 'LOW') variant = 'blue';

  return <Badge variant={variant}>{priority}</Badge>;
}

export function ProductCompliancePage(): React.ReactElement {
  const { product } = useProduct();

  const [overview, setOverview] = useState<ComplianceJourneyOverviewResponse | null>(null);
  const [dossier, setDossier] = useState<ApplicationDossierResponse | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateDossierResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'TODO' | 'BLOCKED' | 'COMPLETED'>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'TASKS' | 'DOSSIER' | 'ALERTS' | 'TIMELINE'>('TASKS');

  const fetchOverview = useCallback(async () => {
    if (!product) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await complianceService.getJourneyOverview(product.id);
      setOverview(res);
      const dossierRes = await complianceService.getDossier(product.id);
      setDossier(dossierRes);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load compliance journey overview');
    } finally {
      setIsLoading(false);
    }
  }, [product]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleRecalculate = async () => {
    if (!product) return;
    try {
      setIsRecalculating(true);
      setErrorMessage(null);
      const res = await complianceService.recalculateJourney(product.id, 'User manual refresh');
      setOverview(res);
      const dossierRes = await complianceService.getDossier(product.id);
      setDossier(dossierRes);
      setActionSuccessMessage('Compliance journey recalculated successfully.');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Recalculation failed');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleCompleteTask = async (task: ComplianceTaskItem) => {
    if (!product) return;
    try {
      setErrorMessage(null);
      await complianceService.completeTask(product.id, task.id);
      setActionSuccessMessage(`Task "${task.title}" marked as completed.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await fetchOverview();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete task');
    }
  };

  const handleReopenTask = async (task: ComplianceTaskItem) => {
    if (!product) return;
    try {
      setErrorMessage(null);
      await complianceService.reopenTask(product.id, task.id);
      setActionSuccessMessage(`Task "${task.title}" reopened.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      await fetchOverview();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reopen task');
    }
  };

  const handleValidateDossier = async () => {
    if (!product) return;
    try {
      setIsValidating(true);
      setErrorMessage(null);
      const result = await complianceService.validateDossier(product.id);
      setValidationResult(result);
      const dossierRes = await complianceService.getDossier(product.id);
      setDossier(dossierRes);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to validate dossier');
    } finally {
      setIsValidating(false);
    }
  };

  const handleMarkAlertRead = async (alert: ComplianceAlertItem) => {
    if (!product) return;
    try {
      await complianceService.markAlertRead(product.id, alert.id);
      await fetchOverview();
    } catch (err: any) {
      console.error('Failed to mark alert as read', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-xl border border-surface-border p-8">
        <LoadingState message="Loading compliance journey..." subMessage="Orchestrating multi-standard requirements, tasks, and readiness..." />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-8">
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load Compliance Journey"
          description={errorMessage || 'An error occurred while loading the compliance journey for this product.'}
          actionLabel="Retry"
          onAction={fetchOverview}
        />
      </div>
    );
  }

  const { journey, readiness, confirmedStandards, tasks, alerts, regulatoryImpacts, timeline } = overview;

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'TODO') return t.status === 'TODO' || t.status === 'IN_PROGRESS';
    if (taskFilter === 'BLOCKED') return t.isBlocked;
    if (taskFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  const unreadAlerts = alerts.filter((a) => !a.isRead);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Top Feedback Banners ── */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">Compliance Blocker / Error</h4>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 text-sm font-bold">×</button>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{actionSuccessMessage}</p>
          </div>
          <button type="button" onClick={() => setActionSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 text-sm font-bold">×</button>
        </div>
      )}

      {/* ── 1. Compliance Journey Header & Stage Indicator ── */}
      <div className="bg-white rounded-xl border border-surface-border p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-100 text-accent-800">
                Phase 10 Compliance Orchestration
              </span>
              <StatusBadge status={journey.status} />
              <span className="text-xs text-text-muted">v{journey.journeyVersion}</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary mt-1.5">
              Compliance Journey: {journey.productName || product?.name}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Automated multi-standard requirement graph, task blocker enforcement, readiness assessment, and preparation dossier.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              isLoading={isRecalculating}
              onClick={handleRecalculate}
            >
              Recalculate Journey
            </Button>
          </div>
        </div>

        {/* Confirmed Standards Chips */}
        {confirmedStandards.length > 0 && (
          <div className="mt-4 pt-3 border-t border-surface-border flex items-center gap-2 flex-wrap text-xs">
            <span className="font-medium text-text-secondary flex items-center gap-1">
              <BookOpen size={13} className="text-accent-600" /> Applicable Standards:
            </span>
            {confirmedStandards.map((std) => (
              <span
                key={std.id}
                className="px-2.5 py-1 bg-surface-muted rounded-md font-semibold text-text-primary border border-surface-border"
              >
                {std.isNumber} <span className="font-normal text-text-muted">({std.schemeTitle || 'ISI Mark'})</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── 2. Platform Compliance Readiness Gauge & Domain Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Readiness Card */}
        <Card className="lg:col-span-1 bg-gradient-to-br from-white to-accent-50/30 border-accent-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Platform Compliance Readiness</span>
              <span className="text-2xl font-black text-accent-700">{readiness.overallScore}%</span>
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-surface-muted rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  readiness.overallScore >= 80
                    ? 'bg-emerald-500'
                    : readiness.overallScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-accent-600'
                }`}
                style={{ width: `${readiness.overallScore}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Status: <strong className="text-text-primary">{readiness.readinessStatus}</strong></span>
              <span>Reqs: <strong className="text-text-primary">{readiness.completedRequirements}/{readiness.completedRequirements + readiness.incompleteRequirements}</strong></span>
            </div>

            {/* Disclaimer */}
            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
              <Info size={13} className="text-amber-700 inline mr-1 -mt-0.5" />
              <strong>Notice:</strong> This is a platform-generated readiness assessment and does not constitute official BIS approval or certification.
            </div>

            {/* Critical Next Actions */}
            {readiness.criticalNextActions.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-surface-border">
                <span className="text-xs font-bold text-text-primary">Next Recommended Steps:</span>
                <ul className="space-y-1 text-xs text-text-secondary">
                  {readiness.criticalNextActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <ChevronRight size={13} className="text-accent-600 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Domain Scores Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {readiness.domainScores.map((ds) => {
            let Icon = Layers;
            if (ds.domain === 'STANDARDS') Icon = BookOpen;
            if (ds.domain === 'CERTIFICATION') Icon = Award;
            if (ds.domain === 'TESTING') Icon = FlaskConical;
            if (ds.domain === 'LABORATORY') Icon = Building2;
            if (ds.domain === 'DOCUMENTS') Icon = FileText;

            return (
              <Card key={ds.domain} className="p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Icon size={14} className="text-accent-600" />
                      <span>{ds.domain}</span>
                    </div>
                    <span className="text-sm font-black text-text-primary">{ds.score}%</span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-2 leading-tight">
                    {ds.details}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-surface-border flex items-center justify-between text-[10px] text-text-muted">
                  <span>Reqs: {ds.completedRequirements}/{ds.totalRequirements}</span>
                  <StatusBadge status={ds.status} />
                </div>
              </Card>
            );
          })}

          {/* Regulatory Alerts Mini Card */}
          <Card className="p-4 flex flex-col justify-between bg-amber-50/40 border-amber-200/70">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <ShieldAlert size={14} className="text-amber-600" />
                  <span>Regulatory Alerts</span>
                </div>
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-200 text-amber-900 rounded-full">
                  {unreadAlerts.length}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-2">
                {unreadAlerts.length > 0
                  ? `${unreadAlerts.length} proactive alerts require your review (QCOs, Expiries).`
                  : 'All regulatory change events and document expiries are in good standing.'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full text-xs text-amber-900 border-amber-300 hover:bg-amber-100"
              onClick={() => setActiveTab('ALERTS')}
            >
              View Alerts
            </Button>
          </Card>
        </div>
      </div>

      {/* ── 3. Section Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('TASKS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'TASKS'
              ? 'bg-accent-600 text-white shadow-sm'
              : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
          }`}
        >
          <CheckCircle2 size={14} />
          Compliance Tasks ({tasks.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DOSSIER')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'DOSSIER'
              ? 'bg-accent-600 text-white shadow-sm'
              : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
          }`}
        >
          <FileCheck2 size={14} />
          Preparation Dossier ({dossier?.items.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALERTS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ALERTS'
              ? 'bg-accent-600 text-white shadow-sm'
              : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
          }`}
        >
          <ShieldAlert size={14} />
          Regulatory Updates ({alerts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TIMELINE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'TIMELINE'
              ? 'bg-accent-600 text-white shadow-sm'
              : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
          }`}
        >
          <Clock size={14} />
          Journey Timeline ({timeline.length})
        </button>
      </div>

      {/* ── TAB 1: Actionable Compliance Tasks ── */}
      {activeTab === 'TASKS' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-3.5 rounded-xl border border-surface-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">Filter Tasks:</span>
              <div className="flex gap-1">
                {(['ALL', 'TODO', 'BLOCKED', 'COMPLETED'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setTaskFilter(f)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      taskFilter === f
                        ? 'bg-accent-100 text-accent-800 font-bold'
                        : 'text-text-secondary hover:bg-surface-muted'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-text-muted">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={CheckCircle2}
                title="No tasks match the selected filter"
                description="Try changing the filter option above to view tasks."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`p-4 transition-all ${
                    task.status === 'COMPLETED'
                      ? 'bg-surface-page/50 border-surface-border opacity-85'
                      : task.isBlocked
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'hover:border-accent-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox / Completion Control */}
                      <button
                        type="button"
                        onClick={() =>
                          task.status === 'COMPLETED'
                            ? handleReopenTask(task)
                            : handleCompleteTask(task)
                        }
                        aria-label={
                          task.isBlocked
                            ? `Task blocked: ${task.title}`
                            : task.status === 'COMPLETED'
                            ? `Reopen Task: ${task.title}`
                            : `Complete Task: ${task.title}`
                        }
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 border cursor-pointer transition-colors ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : task.isBlocked
                            ? 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200'
                            : 'border-surface-border hover:border-accent-500 text-transparent hover:text-accent-500'
                        }`}
                        title={
                          task.isBlocked
                            ? 'Task is blocked by prerequisite requirements'
                            : task.status === 'COMPLETED'
                            ? 'Click to reopen task'
                            : 'Click to mark as complete'
                        }
                      >
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle2 size={16} />
                        ) : task.isBlocked ? (
                          <Lock size={13} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                      </button>

                      {/* Content */}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-sm font-bold ${
                              task.status === 'COMPLETED'
                                ? 'line-through text-text-secondary'
                                : 'text-text-primary'
                            }`}
                          >
                            {task.title}
                          </h4>
                          <span className="px-2 py-0.5 bg-surface-muted text-text-secondary text-[10px] font-semibold rounded">
                            {task.taskType}
                          </span>
                          <PriorityBadgeHelper priority={task.priority} />
                          {task.isBlocked && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded flex items-center gap-1">
                              <Lock size={10} /> BLOCKED
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-text-secondary leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Blocker Reasons */}
                        {task.isBlocked && task.blockingReasons && task.blockingReasons.length > 0 && (
                          <div className="mt-2 p-2.5 bg-amber-50 rounded-md border border-amber-200 text-xs text-amber-900">
                            <span className="font-bold flex items-center gap-1">
                              <AlertTriangle size={12} className="text-amber-700" /> Prerequisite Requirements Unresolved:
                            </span>
                            <ul className="mt-1 space-y-0.5 list-disc list-inside text-[11px] text-amber-800">
                              {task.blockingReasons.map((reason, rIdx) => (
                                <li key={rIdx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Source Evidence if present */}
                        {task.sourceEvidence && (
                          <div className="text-[11px] text-text-muted mt-1">
                            {task.sourceEvidence.standardNumber && (
                              <span>Standard: <strong>{task.sourceEvidence.standardNumber}</strong> </span>
                            )}
                            {task.sourceEvidence.clause && (
                              <span>• Clause: <strong>{task.sourceEvidence.clause}</strong></span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 sm:self-start">
                      {task.status === 'COMPLETED' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Unlock}
                          className="text-xs text-text-secondary hover:text-text-primary"
                          onClick={() => handleReopenTask(task)}
                        >
                          Reopen
                        </Button>
                      ) : (
                        <Button
                          variant={task.isBlocked ? 'secondary' : 'primary'}
                          size="sm"
                          disabled={task.isBlocked}
                          onClick={() => handleCompleteTask(task)}
                        >
                          Complete Task
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Application Preparation Dossier ── */}
      {activeTab === 'DOSSIER' && dossier && (
        <div className="space-y-6">
          {/* Dossier Header Card */}
          <Card className="p-6 bg-gradient-to-br from-white to-surface-muted/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-text-primary">{dossier.title}</h3>
                  <StatusBadge status={dossier.status} />
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Structured preparation package compiling technical specifications, confirmed standards, test reports, and factory records.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ShieldAlert}
                  isLoading={isValidating}
                  onClick={handleValidateDossier}
                >
                  Validate Dossier
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dossier, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', dataStr);
                    downloadAnchor.setAttribute('download', `BIS_Preparation_Dossier_${product?.name.replace(/\s+/g, '_')}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                >
                  Export Preparation JSON
                </Button>
              </div>
            </div>

            {/* Dossier Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-surface-border">
              <div className="p-3 bg-white rounded-lg border border-surface-border">
                <span className="text-[11px] text-text-secondary font-medium">Completeness</span>
                <p className="text-lg font-bold text-accent-700">{dossier.completenessScore}%</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-surface-border">
                <span className="text-[11px] text-emerald-800 font-medium">Verified Items</span>
                <p className="text-lg font-bold text-emerald-600">{dossier.verifiedCount}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-surface-border">
                <span className="text-[11px] text-amber-800 font-medium">Needs Review</span>
                <p className="text-lg font-bold text-amber-600">{dossier.unverifiedCount}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-surface-border">
                <span className="text-[11px] text-red-800 font-medium">Missing Evidence</span>
                <p className="text-lg font-bold text-red-600">{dossier.missingCount}</p>
              </div>
            </div>
          </Card>

          {/* Validation Drawer / Banner */}
          {validationResult && (
            <Card className={`p-5 ${validationResult.isValid ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
              <div className="flex items-start gap-3">
                {validationResult.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-text-primary">
                    {validationResult.isValid
                      ? 'Preparation Dossier Complete & Verified for Official Action'
                      : 'Dossier Incomplete — Mandatory Evidence Missing'}
                  </h4>
                  <p className="text-xs text-text-secondary">
                    {validationResult.isValid
                      ? 'All mandatory test reports, factory documents, and standard requirements have verified evidence in the platform.'
                      : 'The following blockers prevent this preparation dossier from being ready for official filing:'}
                  </p>

                  {validationResult.blockers.length > 0 && (
                    <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-red-800 font-medium">
                      {validationResult.blockers.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <ul className="mt-1 space-y-1 list-disc list-inside text-xs text-amber-800">
                      {validationResult.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Dossier Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Preparation Dossier Evidence Items ({dossier.items.length})</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-page border-b border-surface-border text-text-secondary font-bold">
                      <th className="p-3">#</th>
                      <th className="p-3">Item Title & Description</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Document / Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {dossier.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-surface-page/60 transition-colors">
                        <td className="p-3 font-semibold text-text-muted">{idx + 1}</td>
                        <td className="p-3 max-w-xs">
                          <div className="font-bold text-text-primary">{item.title}</div>
                          {item.description && (
                            <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-surface-muted rounded text-[10px] font-semibold text-text-secondary">
                            {item.itemType}
                          </span>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="p-3">
                          {item.documentFileName ? (
                            <span className="font-medium text-text-primary flex items-center gap-1">
                              <FileText size={13} className="text-accent-600" />
                              {item.documentFileName}
                            </span>
                          ) : item.status === 'VERIFIED' ? (
                            <span className="text-emerald-700 font-semibold text-[11px]">System Verified</span>
                          ) : (
                            <span className="text-red-600 font-medium text-[11px]">Upload Required</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── TAB 3: Regulatory Alerts & Gazette Changes ── */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-6">
          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts & Notifications ({alerts.length})</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {alerts.length === 0 ? (
                <EmptyState
                  icon={ShieldAlert}
                  title="No active alerts"
                  description="Your product compliance records and document calibration dates are up to date."
                />
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all ${
                      alert.isRead ? 'bg-surface-page border-surface-border' : 'bg-amber-50/50 border-amber-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-text-primary">{alert.title}</h4>
                          <PriorityBadgeHelper priority={alert.priority} />
                          <span className="text-[10px] text-text-muted">
                            {new Date(alert.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{alert.reason}</p>
                        {alert.recommendedAction && (
                          <div className="mt-2 p-2 bg-white rounded border border-surface-border text-xs text-text-primary">
                            <strong>Recommended Action:</strong> {alert.recommendedAction}
                          </div>
                        )}
                      </div>

                      {!alert.isRead && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="shrink-0 text-xs"
                          onClick={() => handleMarkAlertRead(alert)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          {/* Regulatory Gazette Impacts */}
          {regulatoryImpacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Official Gazette & QCO Impacts ({regulatoryImpacts.length})</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {regulatoryImpacts.map((imp) => (
                  <div key={imp.id} className="p-4 bg-white rounded-xl border border-surface-border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-text-primary">{imp.changeEvent?.title || 'Regulatory Change'}</h4>
                      <StatusBadge status={imp.impactLevel} />
                    </div>
                    {imp.changeEvent?.summary && (
                      <p className="text-xs text-text-secondary">{imp.changeEvent.summary}</p>
                    )}
                    {imp.requiredActions && imp.requiredActions.length > 0 && (
                      <ul className="space-y-1 list-disc list-inside text-xs text-text-secondary pt-1">
                        {imp.requiredActions.map((act, aIdx) => (
                          <li key={aIdx}>{act}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ── TAB 4: Journey Timeline ── */}
      {activeTab === 'TIMELINE' && (
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Chronological Compliance Journey Timeline</CardTitle>
          </CardHeader>
          <CardBody className="px-0 pb-0">
            <div className="relative pl-6 border-l-2 border-accent-200 space-y-6">
              {timeline.map((event) => (
                <div key={event.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-accent-600 border-2 border-white shadow" />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-text-primary">{event.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 bg-surface-muted rounded font-semibold text-text-secondary">
                        {event.stage}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {new Date(event.timestamp).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{event.description}</p>
                    {event.actor && (
                      <span className="text-[10px] text-text-muted">Actor: {event.actor}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
