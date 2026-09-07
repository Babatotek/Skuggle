import React, { useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useDialogLifecycle } from './useDialogLifecycle';
import { IconButton } from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  ariaLabel?: string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-[95vw] sm:max-w-6xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeOnBackdrop = false,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  ariaLabel,
}) => {
  const modalRef = useDialogLifecycle(isOpen, onClose, closeOnEscape);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop with subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="fixed inset-0 bg-[var(--color-surface-overlay)] backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Dialog Card */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={!title ? (ariaLabel ?? 'Dialog') : undefined}
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative my-8 w-full ${sizeStyles[size]} overflow-hidden rounded-[var(--radius-dialog)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-overlay)] ${className}`}
          >
            {/* Modal Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-border-default)] bg-[var(--color-surface-muted)]">
                <div className="min-w-0 pr-4" id={title ? titleId : undefined}>
                  {title && (
                    typeof title === 'string' ? (
                      <h3 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">{title}</h3>
                    ) : (
                      title
                    )
                  )}
                  {description && (
                    typeof description === 'string' ? (
                      <p id={descriptionId} className="text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">{description}</p>
                    ) : (
                      <div id={descriptionId}>{description}</div>
                    )
                  )}
                </div>
                {showCloseButton && (
                  <IconButton variant="ghost" label="Close dialog" icon={<X className="w-5 h-5" />} onClick={onClose} />
                )}
              </div>
            )}

            {/* Modal Body */}
            <div className="px-6 py-5 max-h-[calc(85vh-160px)] overflow-y-auto">{children}</div>

            {/* Modal Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border-default)] bg-[var(--color-surface-muted)]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
