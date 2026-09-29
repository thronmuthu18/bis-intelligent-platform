import React, { useState } from 'react';
import {
  Sparkles,
  QrCode,
  Building2,
  Award,
  Search,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

// ─────────────────────────────────────────────────────────────────────────────
//  HallmarkingPage — Precious Metals Hallmarking & HUID Portal
// ─────────────────────────────────────────────────────────────────────────────

export function HallmarkingPage(): React.ReactElement {
  const { showToast } = useToast();
  const [huidCode, setHuidCode] = useState('');

  const handleVerifyHUID = (e: React.FormEvent) => {
    e.preventDefault();
    if (!huidCode.trim()) {
      showToast({
        type: 'warning',
        title: 'Input Required',
        message: 'Please enter a 6-character alphanumeric HUID code.',
      });
      return;
    }
    showToast({
      type: 'info',
      title: 'HUID Verification Search',
      message: `Searching BIS Hallmarking database for HUID "${huidCode.toUpperCase()}". Navigate to Consumer Services for complete live verification reports.`,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="pb-4 border-b border-surface-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
          <Sparkles size={15} />
          <span>Bureau of Indian Standards Hallmarking</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Gold & Silver Hallmarking (HUID) Services
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Assaying standards, jeweller registration guidance, AHC directory, and Hallmark Unique Identification (HUID) verification.
        </p>
      </div>

      {/* ── HUID Verification Box ── */}
      <Card className="border-amber-200 bg-linear-to-r from-white to-amber-50/30">
        <CardBody className="p-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <QrCode size={20} className="text-amber-700" />
              <h2 className="text-base font-bold text-text-primary">
                Verify Hallmark Unique Identification (HUID)
              </h2>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Enter the 6-digit alphanumeric code stamped on your hallmarked jewellery article to verify purity grade, jeweller registration, and assaying centre date.
            </p>

            <form onSubmit={handleVerifyHUID} className="mt-4 flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. AB12C3"
                value={huidCode}
                onChange={(e) => setHuidCode(e.target.value.toUpperCase())}
                className="w-full sm:w-64 font-mono uppercase tracking-widest text-sm bg-white rounded-lg border border-surface-border px-3.5 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500 shadow-xs text-center"
              />
              <Button type="submit" variant="primary" icon={Search}>
                Verify HUID
              </Button>
            </form>
          </div>
        </CardBody>
      </Card>

      {/* ── Hallmarking Sections ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card hoverable>
          <CardBody className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Award size={20} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              3 Signs of Hallmarking
            </h3>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-amber-700" />
                <span>1. BIS Standard Logo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-amber-700" />
                <span>2. Purity / Fineness Grade (e.g. 22K916)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-amber-700" />
                <span>3. 6-digit Alphanumeric HUID</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              Jeweller Registration Portal
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Guidelines for jewellers applying for mandatory BIS registration to sell hallmarked gold jewellery in notified districts across India.
            </p>
            <div className="pt-2">
              <Badge variant="blue">Jeweller Onboarding</Badge>
            </div>
          </CardBody>
        </Card>

        <Card hoverable>
          <CardBody className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              Assaying & Hallmarking Centres (AHC)
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Find recognized AHC laboratories across all states equipped with XRF spectrometers and fire assaying testing infrastructure.
            </p>
            <div className="pt-2">
              <Badge variant="grey">AHC Network</Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ── Hallmarking Notice ── */}
      <div className="p-3.5 bg-surface-muted/60 rounded-xl border border-surface-border flex items-start gap-3">
        <Info size={18} className="text-accent-500 shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary leading-relaxed">
          <strong className="text-text-primary">Official Hallmarking:</strong> Hallmarking is mandatory in 343+ designated districts in India for 14k, 18k, 20k, 22k, 23k, and 24k gold jewellery articles.
        </p>
      </div>
    </div>
  );
}
