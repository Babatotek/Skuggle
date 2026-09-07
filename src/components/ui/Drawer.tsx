import React, { useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useDialogLifecycle } from './useDialogLifecycle';
import { IconButton } from './Button';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: DrawerSize;
  placement?: 'left' | 'right';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  ariaLabel?: string;
}

const sizeStyles: Record<DrawerSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  placement = 'right',
  children,
  footer,
  closeOnBackdrop = false,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  ariaLabel,
}) => {
  const drawerRef = useDialogLifecycle(isOpen, onClose, closeOnEscape);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[var(--z-drawer)] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="fixed inset-0 bg-[var(--color-surface-overlay)] backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          <div className={`fixed inset-y-0 max-w-full flex ${placement === 'left' ? 'left-0 pr-10' : 'right-0 pl-10'}`}>
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label={!title ? (ariaLabel ?? 'Drawer') : undefined}
              aria-labelledby={title ? titleId : undefined}
              aria-describedby={description ? descriptionId : undefined}
              tabIndex={-1}
              initial={{ x: placement === 'left' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: placement === 'left' ? '-100%' : '100%' }}
              transition={
                typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? { duration: 0 }
                  : { type: 'spring', damping: 30, stiffness: 300 }
              }
              className={`w-screen ${sizeStyles[size]} bg-[var(--color-surface-raised)] shadow-[var(--shadow-overlay)] ${placement === 'left' ? 'border-r' : 'border-l'} border-[var(--color-border-default)] flex flex-col ${className}`}
            >
              {/* Drawer Header */}
              {(title || showCloseButton) && (
                <div className="px-6 py-5 border-b border-[var(--color-border-default)] bg-[var(--color-surface-muted)] flex items-start justify-between">
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
                    <IconButton variant="ghost" label="Close drawer" icon={<X className="w-5 h-5" />} onClick={onClose} />
                  )}
                </div>
              )}

              {/* Drawer Body */}
              <div className="flex-1 px-6 py-6 overflow-y-auto">{children}</div>

              {/* Drawer Footer */}
              {footer && (
                <div className="px-6 py-4 border-t border-[var(--color-border-default)] bg-[var(--color-surface-muted)] flex items-center justify-end gap-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
