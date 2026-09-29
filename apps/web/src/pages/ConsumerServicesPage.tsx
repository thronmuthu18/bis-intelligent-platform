import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Search,
  FileQuestion,
  ExternalLink,
  Info,
  QrCode,
  Award,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

// ─────────────────────────────────────────────────────────────────────────────
//  ConsumerServicesPage — Consumer Protection, BIS Care & Verification
// ─────────────────────────────────────────────────────────────────────────────

export function ConsumerServicesPage(): React.ReactElement {
  const { showToast } = useToast();
  const [cmlNumber, setCmlNumber] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmlNumber.trim()) {
      showToast({
        type: 'warning',
        title: 'Input Required',
        message: 'Please enter a license (CM/L) number or registration number.',
      });
      return;
    }
    showToast({
      type: 'info',
      title: 'Verification Search',
      message: `Searching official BIS registry for license "${cmlNumber}". Use the dedicated Consumer Portal for full verification records.`,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="pb-4 border-b border-surface-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-accent-600 uppercase tracking-wider mb-1">
          <Users size={15} />
          <span>Department of Consumer Affairs (DoCA)</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Consumer Services & BIS Verification
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Verify ISI mark authenticity, check CRS registration, lodge quality complaints, and understand your rights as a consumer.
        </p>
      </div>

      {/* ── Verification Tool Card ── */}
      <Card className="border-accent-200 bg-linear-to-r from-white to-blue-50/30">
        <CardBody className="p-6">
          <div className="max-w-2xl">
            <h2 className="text-base font-bold text-text-primary">
              Verify BIS License / Registration Number
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Enter the CM/L number printed below the Standard Mark (ISI) or CRS Registration Number (R-XXXXXXXX) to verify validity.
            </p>

            <form onSubmit={handleVerify} className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="e.g. CM/L-1234567 or R-41000000"
                  value={cmlNumber}
                  onChange={(e) => setCmlNumber(e.target.value)}
                  className="w-full text-xs bg-white rounded-lg border border-surface-border px-3.5 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-500 shadow-xs"
                />
              </div>
              <Button type="submit" variant="primary" icon={Search}>
                Verify License
              </Button>
            </form>
          </div>
        </CardBody>
      </Card>

      {/* ── Consumer Guidance Service Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hoverable>
          <CardBody className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award size={20} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              BIS Standard Marks Guide
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Understand the difference between ISI Mark (Mandatory & Voluntary certification), CRS mark for electronic products, and Hallmarking for precious metals.
            </p>
            <div className="pt-2">
              <Badge variant="blue">Standard Guidance</Badge>
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              BIS Care Mobile Application
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Learn how to use the official BIS Care mobile app on Android/iOS to scan QR codes on ISI marked products and verify hallmarked jewellery via HUID.
            </p>
            <div className="pt-2">
              <Badge variant="green">Mobile App</Badge>
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileQuestion size={20} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              Mandatory Products List (QCO)
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Review published Quality Control Orders (QCOs) issued by Central Ministries covering toys, steel, helmets, footwear, and consumer goods.
            </p>
            <div className="pt-2">
              <Badge variant="grey">Statutory Orders</Badge>
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode size={20} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              HUID Gold Verification
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Verify 6-character alphanumeric Hallmark Unique Identification (HUID) codes stamped on gold articles to confirm purity and assaying centre identity.
            </p>
            <div className="pt-2">
              <Badge variant="blue">Hallmark Services</Badge>
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ExternalLink size={20} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              National Consumer Helpline
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Integrated access to National Consumer Helpline (NCH - 1915) for consumer disputes, misleading advertisements, and product liability.
            </p>
            <div className="pt-2">
              <Badge variant="grey">Toll-Free 1915</Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── Consumer Portal Notice ── */}
      <div className="p-3.5 bg-surface-muted/60 rounded-xl border border-surface-border flex items-start gap-3">
        <Info size={18} className="text-accent-500 shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          <strong className="text-text-primary">Consumer Verification:</strong> Use the dedicated verification portal for instant licence checks, HUID authentication, hallmarking centre lookup, and BIS standards search.
        </p>
      </div>
    </div>
  );
}
