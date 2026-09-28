import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit3,
  Archive,
  ArrowRight,
  FileText,
  BookOpen,
  Award,
  FlaskConical,
  Building2,
  GitMerge,
  Info,
  Calendar,
  Building,
  Globe,
  MapPin,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useProduct } from '@/contexts/ProductContext';
import type { ProductStatus, UpdateProductInput } from '@bis/shared';

// ─────────────────────────────────────────────────────────────────────────────
//  ProductOverviewPage — Product Workspace Overview & Management (Phase 3)
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'Electronics & IT Goods', label: 'Electronics & IT Goods' },
  { value: 'Electrical Equipment & Luminaires', label: 'Electrical Equipment & Luminaires' },
  { value: 'Household Appliances & Kitchenware', label: 'Household Appliances & Kitchenware' },
  { value: 'Personal Protective Equipment (PPE)', label: 'Personal Protective Equipment (PPE)' },
  { value: 'Chemicals & Petrochemicals', label: 'Chemicals & Petrochemicals' },
  { value: 'Steel & Metal Products', label: 'Steel & Metal Products' },
  { value: 'Food & Agricultural Products', label: 'Food & Agricultural Products' },
  { value: 'Toys & Children Products', label: 'Toys & Children Products' },
  { value: 'Industrial Machinery & Equipment', label: 'Industrial Machinery & Equipment' },
  { value: 'Automotive Components', label: 'Automotive Components' },
  { value: 'Other Industrial Products', label: 'Other Industrial Products' },
];

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'INFORMATION_COLLECTION', label: 'Information Collection' },
  { value: 'READY_FOR_ANALYSIS', label: 'Ready for Analysis' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function ProductOverviewPage(): React.ReactElement {
  const { product, updateProduct, archiveProduct } = useProduct();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProductInput>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Archive Modal State
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  if (!product) {
    return <></>;
  }

  const base = `/products/${product.id}`;

  const openEditModal = () => {
    setEditForm({
      name: product.name,
      category: product.category,
      description: product.description || '',
      manufacturerType: product.manufacturerType || '',
      intendedUse: product.intendedUse || '',
      targetMarket: product.targetMarket || '',
      countryOfManufacture: product.countryOfManufacture || '',
      status: product.status,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name?.trim()) {
      showToast({ type: 'error', title: 'Validation Error', message: 'Product name cannot be empty.' });
      return;
    }
    if (!editForm.category?.trim()) {
      showToast({ type: 'error', title: 'Validation Error', message: 'Category cannot be empty.' });
      return;
    }

    try {
      setIsUpdating(true);
      await updateProduct(editForm);
      setIsEditOpen(false);
      showToast({ type: 'success', title: 'Product Updated', message: 'Product specifications updated successfully.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Update Failed', message: err instanceof Error ? err.message : 'Could not update product.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmArchive = async () => {
    try {
      setIsArchiving(true);
      await archiveProduct();
      showToast({ type: 'success', title: 'Product Archived', message: `${product.name} has been archived.` });
    } catch (err) {
      showToast({ type: 'error', title: 'Archive Failed', message: err instanceof Error ? err.message : 'Could not archive product.' });
      setIsArchiving(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not available';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Product Information & Action Header ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{product.name}</CardTitle>
                <StatusBadge status={product.status} />
              </div>
              <CardDescription className="mt-1">
                Registered Product Workspace in PostgreSQL Compliance Database
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Edit3}
                onClick={openEditModal}
              >
                Edit Product
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Archive}
                onClick={() => setIsArchiveOpen(true)}
              >
                Archive Product
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Specifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-lg bg-surface-page border border-surface-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Tag size={13} className="text-accent-500" />
                <span>Product Category</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {product.category || 'Not specified'}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-page border border-surface-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Building size={13} className="text-accent-500" />
                <span>Manufacturer Category</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {product.manufacturerType || 'Standard Manufacturer'}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-page border border-surface-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <MapPin size={13} className="text-accent-500" />
                <span>Country of Origin</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {product.countryOfManufacture || 'India'}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-page border border-surface-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Globe size={13} className="text-accent-500" />
                <span>Target Market</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {product.targetMarket || 'Domestic Market (India Only)'}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-page border border-surface-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Calendar size={13} className="text-accent-500" />
                <span>Created On</span>
              </div>
              <p className="text-xs text-text-primary font-medium">
                {formatDate(product.createdAt)}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-page border border-surface-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                <Calendar size={13} className="text-accent-500" />
                <span>Last Activity</span>
              </div>
              <p className="text-xs text-text-primary font-medium">
                {formatDate(product.lastActivityAt || product.updatedAt)}
              </p>
            </div>
          </div>

          {/* Description & Intended Use */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5 p-4 rounded-xl border border-surface-border bg-white shadow-2xs">
              <h3 className="text-xs font-bold text-text-primary">Product Description</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {product.description || 'No detailed technical description provided yet. Click "Edit Product" to add specifications.'}
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl border border-surface-border bg-white shadow-2xs">
              <h3 className="text-xs font-bold text-text-primary">Intended Use & Operational Context</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {product.intendedUse || 'No intended use details specified yet.'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ── Workspace Modules Overview ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text-primary">
            Workspace Modules
          </h2>
          <span className="text-xs text-text-muted">
            Anchored to {product.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card hoverable onClick={() => navigate(`${base}/documents`)} className="flex flex-col justify-between">
            <CardBody className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary">Document Repository</h3>
                <p className="text-[11px] text-text-secondary mt-1">
                  Manage test certificates, technical dossiers, and factory manuals for this product.
                </p>
              </div>
              <div className="text-xs font-semibold text-accent-600 flex items-center gap-1 pt-2 border-t border-surface-border">
                Open Documents <ArrowRight size={12} />
              </div>
            </CardBody>
          </Card>

          <Card hoverable onClick={() => navigate(`${base}/standards`)} className="flex flex-col justify-between">
            <CardBody className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary">Indian Standards (IS)</h3>
                <p className="text-[11px] text-text-secondary mt-1">
                  Applicable Bureau of Indian Standards specifications and Quality Control Orders.
                </p>
              </div>
              <div className="text-xs font-semibold text-accent-600 flex items-center gap-1 pt-2 border-t border-surface-border">
                View Standards <ArrowRight size={12} />
              </div>
            </CardBody>
          </Card>

          <Card hoverable onClick={() => navigate(`${base}/certification`)} className="flex flex-col justify-between">
            <CardBody className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary">Certification Schemes</h3>
                <p className="text-[11px] text-text-secondary mt-1">
                  Applicable BIS schemes: Scheme I (ISI Mark), Scheme II (CRS), or FMCS requirements.
                </p>
              </div>
              <div className="text-xs font-semibold text-accent-600 flex items-center gap-1 pt-2 border-t border-surface-border">
                View Schemes <ArrowRight size={12} />
              </div>
            </CardBody>
          </Card>

          <Card hoverable onClick={() => navigate(`${base}/testing`)} className="flex flex-col justify-between">
            <CardBody className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FlaskConical size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary">Testing Requirements</h3>
                <p className="text-[11px] text-text-secondary mt-1">
                  Test parameters, sampling guidelines, and standard compliance test clauses.
                </p>
              </div>
              <div className="text-xs font-semibold text-accent-600 flex items-center gap-1 pt-2 border-t border-surface-border">
                View Testing <ArrowRight size={12} />
              </div>
            </CardBody>
          </Card>

          <Card hoverable onClick={() => navigate(`${base}/laboratories`)} className="flex flex-col justify-between">
            <CardBody className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary">Laboratories</h3>
                <p className="text-[11px] text-text-secondary mt-1">
                  BIS-recognized & NABL-accredited testing laboratories with matching testing scope.
                </p>
              </div>
              <div className="text-xs font-semibold text-accent-600 flex items-center gap-1 pt-2 border-t border-surface-border">
                Explore Labs <ArrowRight size={12} />
              </div>
            </CardBody>
          </Card>

          <Card hoverable onClick={() => navigate(`${base}/compliance`)} className="flex flex-col justify-between">
            <CardBody className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <GitMerge size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text-primary">Compliance Journey</h3>
                <p className="text-[11px] text-text-secondary mt-1">
                  Step-by-step regulatory roadmap from product identification to official application.
                </p>
              </div>
              <div className="text-xs font-semibold text-accent-600 flex items-center gap-1 pt-2 border-t border-surface-border">
                Track Journey <ArrowRight size={12} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Guidance Banner ── */}
      <div className="p-3.5 bg-surface-muted/50 rounded-xl border border-surface-border flex items-start gap-3 text-xs text-text-secondary">
        <Info size={16} className="text-accent-500 shrink-0 mt-0.5" />
        <span>
          <strong>Product Workspace Status:</strong> This workspace maintains the persistent product record in PostgreSQL. In later phases, standards discovery, document analysis, and AI assistant capabilities will populate these modules.
        </span>
      </div>

      {/* ── Edit Product Modal ── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Product Details"
        description="Update specifications for this product workspace."
        size="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name *"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
            <Select
              label="Category *"
              options={CATEGORIES}
              value={editForm.category || ''}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              required
            />
          </div>

          <Textarea
            label="Product Description"
            value={editForm.description || ''}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Manufacturer Type"
              value={editForm.manufacturerType || ''}
              onChange={(e) => setEditForm({ ...editForm, manufacturerType: e.target.value })}
            />
            <Input
              label="Country of Manufacture"
              value={editForm.countryOfManufacture || ''}
              onChange={(e) => setEditForm({ ...editForm, countryOfManufacture: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Intended Use"
              value={editForm.intendedUse || ''}
              onChange={(e) => setEditForm({ ...editForm, intendedUse: e.target.value })}
            />
            <Select
              label="Workflow Status"
              options={STATUS_OPTIONS}
              value={editForm.status || 'DRAFT'}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ProductStatus })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdating}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Archive Confirmation Modal ── */}
      <Modal
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        title="Archive Product"
        description="Are you sure you want to archive this product workspace?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
            <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
            <span>
              Archiving <strong>{product.name}</strong> will hide it from your active products list. Product records and history are preserved.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
            <Button
              variant="secondary"
              onClick={() => setIsArchiveOpen(false)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmArchive}
              isLoading={isArchiving}
            >
              Confirm Archive
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
