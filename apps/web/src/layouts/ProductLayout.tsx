import React from 'react';
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  Package,
  Bot,
  FileText,
  BookOpen,
  Award,
  FlaskConical,
  Building2,
  GitMerge,
  ArrowLeft,
  Clock,
  type LucideIcon,
  AlertCircle,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductProvider, useProduct } from '@/contexts/ProductContext';

// ─────────────────────────────────────────────────────────────────────────────
//  ProductLayout — Workspace Shell for a Single Product
// ─────────────────────────────────────────────────────────────────────────────

interface ProductTab {
  path: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const PRODUCT_TABS: ProductTab[] = [
  { path: '',              label: 'Overview',       icon: Package,     exact: true },
  { path: 'assistant',    label: 'AI Assistant',   icon: Bot },
  { path: 'documents',    label: 'Documents',      icon: FileText },
  { path: 'standards',    label: 'Standards',      icon: BookOpen },
  { path: 'certification',label: 'Certification',  icon: Award },
  { path: 'testing',      label: 'Testing',        icon: FlaskConical },
  { path: 'laboratories', label: 'Laboratories',   icon: Building2 },
  { path: 'compliance',   label: 'Compliance',     icon: GitMerge },
];

function ProductLayoutContent(): React.ReactElement {
  const { product, isLoading, error } = useProduct();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-xl border border-surface-border p-8">
        <LoadingState message="Loading product workspace..." subMessage="Fetching product details and compliance records..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-8 shadow-card">
        <EmptyState
          icon={AlertCircle}
          title="Product Not Found"
          description={error || 'The product you requested does not exist or you do not have permission to view it.'}
          actionLabel="Back to My Products"
          onAction={() => navigate('/products')}
        />
      </div>
    );
  }

  const base = `/products/${product.id}`;
  const formattedDate = product.updatedAt
    ? new Date(product.updatedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* ── Product Workspace Header ── */}
      <div className="bg-white rounded-xl border border-surface-border p-5 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="p-1.5 rounded-lg border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors mt-0.5 cursor-pointer"
              title="Back to Products"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-text-primary">
                  {product.name}
                </h1>
                <StatusBadge status={product.status} />
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {product.category} {product.description ? `• ${product.description}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock size={13} />
              <span>Updated: {formattedDate}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={Bot}
              onClick={() => navigate(`${base}/assistant`)}
            >
              AI Assistant
            </Button>
          </div>
        </div>

        {/* ── Secondary Tab Navigation ── */}
        <div className="mt-4 pt-3 border-t border-surface-border -mb-2 overflow-x-auto scrollbar-thin">
          <nav className="flex gap-1 min-w-max">
            {PRODUCT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.exact ? base : `${base}/${tab.path}`}
                  end={tab.exact}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-100',
                      isActive
                        ? 'bg-accent-50 text-accent-700 border-b-2 border-accent-600 font-bold'
                        : 'text-text-secondary hover:bg-surface-page hover:text-text-primary',
                    ].join(' ')
                  }
                >
                  <Icon size={14} className="shrink-0" />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Tab Content Area ── */}
      <div className="min-h-[400px]">
        <Outlet />
      </div>
    </div>
  );
}

export function ProductLayout(): React.ReactElement {
  const { productId } = useParams<{ productId: string }>();
  return (
    <ProductProvider key={productId}>
      <ProductLayoutContent />
    </ProductProvider>
  );
}
