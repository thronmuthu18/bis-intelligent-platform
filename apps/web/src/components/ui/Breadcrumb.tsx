import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  Breadcrumb Component
// ─────────────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumb({ items, showHome = true, className }: BreadcrumbProps): React.ReactElement {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-text-secondary', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {showHome && (
          <li className="inline-flex items-center">
            <Link
              to="/dashboard"
              className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-1"
              title="Dashboard"
            >
              <Home size={13} />
            </Link>
            {items.length > 0 && <ChevronRight size={13} className="text-text-muted mx-1 shrink-0" />}
          </li>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center">
              {item.href && !isLast ? (
                <Link to={item.href} className="text-text-secondary hover:text-text-primary transition-colors font-medium">
                  {item.label}
                </Link>
              ) : (
                <span className={cn('font-medium', isLast ? 'text-text-primary font-semibold' : 'text-text-secondary')}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight size={13} className="text-text-muted mx-1 shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
