import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  ArrowRight,
  Clock,
  ExternalLink,
  Layers,
  FileCheck2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { productService } from '@/services/api';
import type { Product, ProductStats } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  DashboardPage — Authenticated User Workspace Dashboard (Real PostgreSQL Data)
// ─────────────────────────────────────────────────────────────────────────────

export function DashboardPage(): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<ProductStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, productsData] = await Promise.all([
        productService.getProductStats(),
        productService.getProducts(),
      ]);
      setStats(statsData);
      setRecentProducts(productsData.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {user?.name ? `Welcome back, ${user.name}` : 'Compliance Dashboard'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Real-time compliance workspace overview and active product pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/products')}
          >
            View All Products
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/products/new')}
          >
            Create Product
          </Button>
        </div>
      </div>

      {/* ── Error Banner if API Fails ── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-status-error shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Metric Summary Cards (Live PostgreSQL Counts) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={isLoading ? '—' : stats?.total ?? 0}
          description="Registered in workspace"
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          onClick={() => navigate('/products')}
        />
        <StatCard
          label="Draft Products"
          value={isLoading ? '—' : stats?.draft ?? 0}
          description="Initial configuration"
          icon={Layers}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => navigate('/products')}
        />
        <StatCard
          label="Info Collection"
          value={isLoading ? '—' : stats?.informationCollection ?? 0}
          description="Gathering specifications"
          icon={Clock}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          onClick={() => navigate('/products')}
        />
        <StatCard
          label="Ready For Analysis"
          value={isLoading ? '—' : stats?.readyForAnalysis ?? 0}
          description="Awaiting standard mapping"
          icon={FileCheck2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          onClick={() => navigate('/products')}
        />
      </div>

      {/* ── Main Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Products Table (2 columns on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/products')}
                  className="text-xs"
                >
                  View all
                  <ArrowRight size={13} />
                </Button>
              }
            >
              <CardTitle>Recent Products</CardTitle>
              <p className="text-xs text-text-secondary mt-0.5">
                Recently updated products undergoing compliance lifecycle setup.
              </p>
            </CardHeader>

            {isLoading ? (
              <div className="p-8 space-y-3">
                <div className="h-10 bg-surface-muted animate-pulse rounded-lg" />
                <div className="h-10 bg-surface-muted animate-pulse rounded-lg" />
                <div className="h-10 bg-surface-muted animate-pulse rounded-lg" />
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-surface-muted text-text-muted flex items-center justify-center mx-auto">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">No products registered yet</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Create your first product to begin your standard compliance and certification journey.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => navigate('/products/new')}
                >
                  Create Product
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow hoverable={false}>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProducts.map((prod) => (
                    <TableRow key={prod.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-text-primary text-xs sm:text-sm">
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-text-muted">{prod.category}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={prod.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <Clock size={12} className="text-text-muted" />
                          <span>{formatLastUpdated(prod.updatedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/products/${prod.id}`)}
                          className="text-xs"
                        >
                          Open Workspace
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Compliance Workflow Notice */}
          <div className="p-3.5 bg-surface-muted/60 rounded-xl border border-surface-border flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold">
              i
            </div>
            <div className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">Compliance Architecture Notice:</span>{' '}
              All product data is stored securely in PostgreSQL with owner-isolated access controls. Official Indian Standard (IS) catalog matching and laboratory discovery will be connected in Phase 4 and Phase 5.
            </div>
          </div>
        </div>

        {/* Quick Portals & Service Links (1 column on lg) */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Actions</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 p-3">
              <button
                type="button"
                onClick={() => navigate('/products/new')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-left bg-surface-page hover:bg-surface-muted transition-colors border border-surface-border text-xs font-medium text-text-primary"
              >
                <div className="flex items-center gap-2">
                  <Plus size={14} className="text-accent-600" />
                  <span>Onboard New Product</span>
                </div>
                <ArrowRight size={14} className="text-text-muted" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-left bg-surface-page hover:bg-surface-muted transition-colors border border-surface-border text-xs font-medium text-text-primary"
              >
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-accent-600" />
                  <span>Manage My Products</span>
                </div>
                <ArrowRight size={14} className="text-text-muted" />
              </button>
            </CardBody>
          </Card>

          {/* Official Portals */}
          <Card>
            <CardHeader>
              <CardTitle>Official BIS Portals</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 p-3">
              <a
                href="https://www.manakonline.in"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-left bg-surface-page hover:bg-surface-muted transition-colors border border-surface-border text-xs font-medium text-text-primary"
              >
                <span>Manakonline Certification Portal</span>
                <ExternalLink size={13} className="text-text-muted" />
              </a>
              <a
                href="https://www.services.bis.gov.in"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-left bg-surface-page hover:bg-surface-muted transition-colors border border-surface-border text-xs font-medium text-text-secondary"
              >
                <span>BIS e-Services & Hallmarking</span>
                <ExternalLink size={13} className="text-text-muted" />
              </a>
              <a
                href="https://www.standardsbis.in"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between p-2.5 rounded-lg text-left bg-surface-page hover:bg-surface-muted transition-colors border border-surface-border text-xs font-medium text-text-secondary"
              >
                <span>Standards BIS Portal</span>
                <ExternalLink size={13} className="text-text-muted" />
              </a>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
