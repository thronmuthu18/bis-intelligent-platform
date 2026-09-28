import React from 'react';
import { Modal, type ModalSize } from './Modal';
import { Button } from './Button';
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
//  Dialog Component — Confirmation & Action dialogs
// ─────────────────────────────────────────────────────────────────────────────

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  size?: ModalSize;
  children?: React.ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  type = 'info',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  size = 'sm',
  children,
}: DialogProps): React.ReactElement | null {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="text-status-error" size={24} />;
      case 'warning':
        return <AlertCircle className="text-status-warning" size={24} />;
      case 'success':
        return <CheckCircle2 className="text-status-success" size={24} />;
      case 'info':
      default:
        return <HelpCircle className="text-status-info" size={24} />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'danger':
        return 'danger' as const;
      default:
        return 'primary' as const;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <div className="flex gap-4">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
            type === 'danger' && 'bg-status-errorBg',
            type === 'warning' && 'bg-status-warningBg',
            type === 'success' && 'bg-status-successBg',
            type === 'info' && 'bg-status-infoBg',
          )}
        >
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary mt-1">{description}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        {onConfirm && (
          <Button
            variant={getButtonVariant()}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        )}
      </div>
    </Modal>
  );
}
