import React from 'react';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  Table Component Family
// ─────────────────────────────────────────────────────────────────────────────

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className, ...props }: TableProps): React.ReactElement {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-surface-border bg-white shadow-card">
      <table className={cn('w-full text-left text-sm text-text-primary', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>): React.ReactElement {
  return (
    <thead className={cn('border-b border-surface-border bg-surface-muted/60 text-xs font-semibold uppercase text-text-secondary', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>): React.ReactElement {
  return (
    <tbody className={cn('divide-y divide-surface-border', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, hoverable = true, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { hoverable?: boolean }): React.ReactElement {
  return (
    <tr
      className={cn(
        'transition-colors duration-100',
        hoverable && 'hover:bg-surface-page/80',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
  return (
    <th className={cn('px-4 py-3 font-semibold text-text-secondary tracking-wider text-xs', className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
  return (
    <td className={cn('px-4 py-3.5 text-sm text-text-primary align-middle', className)} {...props}>
      {children}
    </td>
  );
}
