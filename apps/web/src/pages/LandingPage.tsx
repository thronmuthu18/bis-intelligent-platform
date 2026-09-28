import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  BookOpen,
  Award,
  FlaskConical,
  FileText,
  GitMerge,
  Users,
  ArrowRight,
} from 'lucide-react';
import { PLATFORM } from '@bis/shared';
import { checkApiHealth, type HealthResponse } from '@/services/api';
import { Button } from '@/components/ui/Button';

// ─────────────────────────────────────────────────────────────────────────────
//  Landing Page
//  Professional enterprise entry point for the BIS Intelligent Platform.
// ─────────────────────────────────────────────────────────────────────────────

export function LandingPage(): React.ReactElement {
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    checkApiHealth()
      .then(setHealth)
      .catch((err: Error) => setHealthError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-surface-page flex flex-col justify-between">
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-surface-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary leading-none">
                {PLATFORM.shortName}
              </p>
              <p className="text-xs text-text-muted leading-none mt-0.5">
                Intelligence Platform
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Sign in
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/register')}
            >
              Get started
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-3xl">
            {/* Government Attribution Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-surface-border shadow-2xs mb-6">
              <span className="text-xs text-text-secondary font-medium">
                Ministry of Consumer Affairs, Food &amp; Public Distribution
              </span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-accent-700 font-semibold">
                {PLATFORM.sihProblem}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary leading-tight tracking-tight mb-6 text-balance">
              AI-powered Intelligence for{' '}
              <span className="text-accent-600">Indian Standards</span>{' '}
              &amp; BIS Services
            </h1>

            <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-8 max-w-2xl text-balance">
              Navigate Indian Standards compliance, mandatory Quality Control Orders (QCOs), certification schemes (ISI Mark, CRS, FMCS), testing requirements, and accredited laboratory discovery.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                icon={ArrowRight}
                onClick={() => navigate('/dashboard')}
              >
                Start your compliance journey
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/consumer')}
              >
                Consumer Services Portal
              </Button>
            </div>
          </div>
        </section>

        {/* ── Capabilities Grid ─────────────────────────────────────────── */}
        <section className="border-t border-surface-border bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-10">
              <h2 className="text-xl font-bold text-text-primary tracking-tight">
                Platform Intelligence Modules
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Authoritative and source-grounded tools designed for industries, MSMEs, and consumers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    onClick={() => navigate(feature.path)}
                    className="p-5 rounded-xl border border-surface-border bg-surface-page/40 hover:bg-surface-page hover:border-surface-divider transition-all duration-150 cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center mb-3 group-hover:bg-accent-100 transition-colors">
                      <Icon size={18} />
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1.5 group-hover:text-accent-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── System Status (Development) ──────────────────────────────── */}
        {import.meta.env.DEV && (
          <section className="border-t border-surface-border bg-surface-muted/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-text-muted uppercase tracking-wider">
                  Development Environment Status
                </span>
                {health ? (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-text-secondary">
                      <span className="w-2 h-2 rounded-full bg-status-success" />
                      API: {health.status}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-text-secondary">
                      <span className="w-2 h-2 rounded-full bg-status-success" />
                      DB: {health.database.connected ? 'Connected' : 'Offline'}
                    </span>
                    <span className="text-text-muted font-mono">{health.service}</span>
                  </div>
                ) : healthError ? (
                  <span className="text-status-error">API unreachable: {healthError}</span>
                ) : (
                  <span className="text-text-muted">Checking backend health...</span>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <p>
            © 2026 {PLATFORM.organization}. {PLATFORM.department}.
          </p>
          <p>
            This platform guides BIS compliance. It does not issue BIS certifications.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Platform Feature Definitions
// ─────────────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: BookOpen,
    title: 'Standards Discovery',
    description:
      'Identify applicable Indian Standards for your product using AI-guided retrieval from authoritative BIS sources.',
    path: '/products',
  },
  {
    icon: Award,
    title: 'Certification Guidance',
    description:
      'Understand which BIS scheme applies (ISI Mark Scheme-I, CRS Scheme-II, FMCS), requirements, and application procedures.',
    path: '/products',
  },
  {
    icon: FlaskConical,
    title: 'Testing Requirements',
    description:
      'Determine standard test parameters, sampling requirements, and locate BIS recognized testing laboratories.',
    path: '/products',
  },
  {
    icon: FileText,
    title: 'Document Intelligence',
    description:
      'Upload technical specifications and test certificates for automatic clause matching and requirement checking.',
    path: '/products',
  },
  {
    icon: GitMerge,
    title: 'Guided Compliance Journey',
    description:
      'Follow a structured, milestone-based roadmap with evidence management and pre-application dossiers.',
    path: '/products',
  },
  {
    icon: Users,
    title: 'Consumer Services & Verification',
    description:
      'Verify ISI marks, CRS registrations, HUID gold authenticity, and access consumer grievance redressal guides.',
    path: '/consumer',
  },
];
