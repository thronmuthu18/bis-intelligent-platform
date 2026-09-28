import React from 'react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  phase?: string;
}

/**
 * PlaceholderPage — used for routes that will be implemented in future phases.
 * Shows a clean, professional "coming soon" state without fake content.
 */
export function PlaceholderPage({
  title,
  description,
  phase = 'upcoming phase',
}: PlaceholderPageProps): React.ReactElement {
  return (
    <div className="page-container py-12">
      <div className="max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-muted border border-surface-border mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
          <span className="text-xs text-text-secondary font-medium">
            Planned for {phase}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-text-primary mb-3">{title}</h1>
        {description && (
          <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
        )}
        <div className="mt-8 p-4 rounded-lg bg-surface-muted border border-surface-border">
          <p className="text-xs text-text-muted">
            This page is part of the BIS Intelligent Platform architecture.
            It will be implemented in an upcoming development phase.
          </p>
        </div>
      </div>
    </div>
  );
}
