import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { productService, ApiClientError } from '@/services/api';

// ─────────────────────────────────────────────────────────────────────────────
//  CreateProductPage — Onboarding form connected to backend (Phase 3)
// ─────────────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  category: string;
  description: string;
  manufacturerType: string;
  intendedUse: string;
  targetMarket: string;
  countryOfManufacture: string;
}

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

const MANUFACTURER_TYPES = [
  { value: 'Domestic Large Enterprise', label: 'Domestic Large Enterprise' },
  { value: 'Domestic MSME / Small Enterprise', label: 'Domestic MSME / Small Enterprise' },
  { value: 'Foreign Manufacturer (FMCS applicant)', label: 'Foreign Manufacturer (FMCS applicant)' },
  { value: 'Importer / Authorized Indian Representative (AIR)', label: 'Importer / Authorized Indian Representative (AIR)' },
];

const TARGET_MARKETS = [
  { value: 'Domestic Market (India Only)', label: 'Domestic Market (India Only)' },
  { value: 'Domestic & Export Markets', label: 'Domestic & Export Markets' },
  { value: 'Government e-Marketplace (GeM)', label: 'Government e-Marketplace (GeM)' },
];

const COUNTRIES = [
  { value: 'India', label: 'India' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Japan', label: 'Japan' },
  { value: 'South Korea', label: 'South Korea' },
  { value: 'United States', label: 'United States' },
  { value: 'China', label: 'China' },
  { value: 'Vietnam', label: 'Vietnam' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Other Country', label: 'Other Country' },
];

export function CreateProductPage(): React.ReactElement {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<FormState>({
    name: '',
    category: '',
    description: '',
    manufacturerType: 'Domestic MSME / Small Enterprise',
    intendedUse: '',
    targetMarket: 'Domestic Market (India Only)',
    countryOfManufacture: 'India',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const steps = [
    { number: 1, title: 'Product Info', description: 'Basic Specifications', active: true },
    { number: 2, title: 'Standards', description: 'Applicable IS Codes', active: false },
    { number: 3, title: 'Documents', description: 'Test Reports & Dossiers', active: false },
    { number: 4, title: 'Certification', description: 'BIS Scheme Mapping', active: false },
  ];

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!formData.name.trim()) errs.name = 'Product name is required (minimum 2 characters)';
    else if (formData.name.trim().length < 2) errs.name = 'Product name must be at least 2 characters';

    if (!formData.category.trim()) errs.category = 'Please select a product category';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields marked with *',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await productService.createProduct({
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim() || undefined,
        manufacturerType: formData.manufacturerType.trim() || undefined,
        intendedUse: formData.intendedUse.trim() || undefined,
        targetMarket: formData.targetMarket.trim() || undefined,
        countryOfManufacture: formData.countryOfManufacture.trim() || undefined,
      });

      showToast({
        type: 'success',
        title: 'Product Created',
        message: `${created.name} has been added to your compliance workspace.`,
      });

      navigate(`/products/${created.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setServerError(err.message || 'Failed to create product.');
      } else {
        setServerError('Unable to connect to the product service. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="pb-4 border-b border-surface-border">
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary mb-2 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Products
        </button>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Create a Product
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Tell us about your product. We will use this information to build your guided compliance workspace.
        </p>
      </div>

      {/* ── Step Indicator ── */}
      <div className="bg-white p-4 rounded-xl border border-surface-border shadow-card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                step.active
                  ? 'border-accent-500 bg-accent-50/50'
                  : 'border-surface-border bg-surface-page/40 opacity-70'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step.active
                    ? 'bg-accent-500 text-white shadow-xs'
                    : 'bg-surface-muted text-text-muted'
                }`}
              >
                {step.number}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${step.active ? 'text-accent-700' : 'text-text-secondary'}`}>
                  {step.title}
                </p>
                <p className="text-[10px] text-text-muted truncate hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Server Error Banner ── */}
      {serverError && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-status-danger text-xs flex items-start gap-2.5"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      {/* ── Onboarding Form ── */}
      <Card>
        <form onSubmit={handleSubmit} noValidate>
          <CardHeader>
            <CardTitle>Step 1: Product Identification</CardTitle>
            <CardDescription>
              Enter accurate product specifications to begin your Indian Standards compliance workspace.
            </CardDescription>
          </CardHeader>

          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                placeholder="e.g., LED Light Fitting (Type B) or Industrial Water Pump"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                error={errors.name}
                hint="Use the commercial model or product category identifier"
                disabled={isSubmitting}
                required
              />

              <Select
                label="Product Category *"
                options={CATEGORIES}
                placeholder="Select category..."
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                  if (errors.category) setErrors({ ...errors, category: undefined });
                }}
                error={errors.category}
                disabled={isSubmitting}
                required
              />
            </div>

            <Textarea
              label="Product Description (Optional)"
              placeholder="Describe the product, operational ratings (voltage, power, pressure, etc.), intended use environment, and materials..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              error={errors.description}
              disabled={isSubmitting}
              hint="Descriptions help accurately reference Indian Standards in later phases"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Manufacturer Type (Optional)"
                options={MANUFACTURER_TYPES}
                value={formData.manufacturerType}
                onChange={(e) => setFormData({ ...formData, manufacturerType: e.target.value })}
                disabled={isSubmitting}
                hint="Used to establish applicable BIS fee concessions (e.g. MSME / Start-up discounts)"
              />

              <Select
                label="Country of Manufacture (Optional)"
                options={COUNTRIES}
                value={formData.countryOfManufacture}
                onChange={(e) => setFormData({ ...formData, countryOfManufacture: e.target.value })}
                disabled={isSubmitting}
                hint="Foreign manufacturers apply under Foreign Manufacturers Certification Scheme (FMCS)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Intended Use / Application (Optional)"
                placeholder="e.g., Commercial indoor lighting, municipal water pumping"
                value={formData.intendedUse}
                onChange={(e) => setFormData({ ...formData, intendedUse: e.target.value })}
                error={errors.intendedUse}
                disabled={isSubmitting}
              />

              <Select
                label="Target Market (Optional)"
                options={TARGET_MARKETS}
                value={formData.targetMarket}
                onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Notice */}
            <div className="p-3 bg-surface-muted/50 rounded-lg border border-surface-border flex items-start gap-2.5 text-xs text-text-secondary">
              <Info size={16} className="text-accent-500 shrink-0 mt-0.5" />
              <span>
                <strong>Workspace Notice:</strong> Creating a product establishes your product workspace in the platform database. In subsequent phases, this connects to official BIS standard mapping and testing requirements.
              </span>
            </div>
          </CardBody>

          <CardFooter className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/products')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              icon={ArrowRight}
            >
              {isSubmitting ? 'Creating Product...' : 'Create & Open Workspace'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
