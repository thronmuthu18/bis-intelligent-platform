import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { productService } from '@/services/api';
import type { Product } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  ProductsPage — My Products Directory & Compliance Workspaces (Phase 3)
// ─────────────────────────────────────────────────────────────────────────────

export function ProductsPage(): React.ReactElement {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prod.category && prod.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            My Products
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage your product catalog and guided Indian Standards compliance workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadProducts}
            isLoading={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => navigate('/products/new')}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* ── Controls / Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-surface-border shadow-card">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-page rounded-lg border border-surface-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-500"
          />
        </div>

        {/* Category & View Toggles */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Filter size={14} className="text-text-muted mr-1 hidden sm:inline" />
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-accent-50 text-accent-600 font-semibold'
                    : 'text-text-secondary hover:bg-surface-page'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center border-l border-surface-border pl-2 gap-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'table' ? 'bg-surface-muted text-accent-600' : 'text-text-muted hover:text-text-primary'
              }`}
              aria-label="Table view"
            >
              <ListIcon size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'grid' ? 'bg-surface-muted text-accent-600' : 'text-text-muted hover:text-text-primary'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content States ── */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-surface-border p-12 shadow-card flex items-center justify-center">
          <LoadingState message="Loading your products..." subMessage="Connecting to compliance database..." />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-red-200 p-8 shadow-card text-center">
          <AlertCircle size={32} className="mx-auto text-status-danger mb-3" />
          <h2 className="text-base font-bold text-text-primary">Failed to load products</h2>
          <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">{error}</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={loadProducts}>
            Try Again
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={products.length === 0 ? 'No products yet' : 'No matching products'}
          description={
            products.length === 0
              ? 'Create your first product to begin your guided compliance journey.'
              : 'No products match your current search or category filter.'
          }
          actionLabel="Add Product"
          onAction={() => navigate('/products/new')}
        />
      ) : viewMode === 'table' ? (
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Workflow Status</TableHead>
              <TableHead>Manufacturer Type</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((prod) => (
              <TableRow key={prod.id}>
                <TableCell>
                  <div>
                    <span className="font-semibold text-text-primary text-sm block">
                      {prod.name}
                    </span>
                    {prod.description && (
                      <span className="text-xs text-text-muted line-clamp-1">
                        {prod.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="grey">{prod.category}</Badge>
                </TableCell>
                <TableCell>
                  <StatusBadge status={prod.status} />
                </TableCell>
                <TableCell>
                  <span className="text-xs text-text-secondary">
                    {prod.manufacturerType || 'Standard'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-text-secondary">
                    <Clock size={12} className="text-text-muted" />
                    <span>{formatDate(prod.updatedAt)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/products/${prod.id}`)}
                  >
                    Open Workspace
                    <ArrowRight size={13} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => (
            <Card
              key={prod.id}
              hoverable
              onClick={() => navigate(`/products/${prod.id}`)}
              className="flex flex-col justify-between"
            >
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center shrink-0">
                    <Package size={18} />
                  </div>
                  <StatusBadge status={prod.status} />
                </div>

                <div>
                  <h3 className="font-semibold text-text-primary text-sm group-hover:text-accent-600">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">{prod.category}</p>
                  {prod.description && (
                    <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                      {prod.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-surface-border">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(prod.updatedAt)}
                  </span>
                  <span className="text-accent-600 font-semibold inline-flex items-center gap-1">
                    Workspace <ArrowRight size={12} />
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
