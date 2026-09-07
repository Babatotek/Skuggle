import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={title}
      size="sm"
      showCloseButton={!isLoading}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="flex gap-4">
        <div
          className={`w-10 h-10 rounded-[var(--radius-card)] flex items-center justify-center shrink-0 ${
            isDanger
              ? 'bg-[var(--color-status-negative-bg)] text-[var(--color-status-negative-text)]'
              : isWarning
              ? 'bg-[var(--color-status-attention-bg)] text-[var(--color-status-attention-text)]'
              : 'bg-[var(--color-status-information-bg)] text-[var(--color-status-information-text)]'
          }`}
        >
          {isDanger ? (
            <AlertCircle className="w-5 h-5" />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Info className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[var(--color-text-primary)] leading-snug">{title}</h3>
          <div className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">{message}</div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border-default)]">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button
          variant={isDanger ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
