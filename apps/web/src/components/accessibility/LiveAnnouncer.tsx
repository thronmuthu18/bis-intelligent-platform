// ─────────────────────────────────────────────────────────────────────────────
//  Phase 12 — Screen Reader Live Announcer Component (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export const LiveAnnouncer: React.FC = () => {
  const { announcement } = useLanguage();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {announcement}
    </div>
  );
};
