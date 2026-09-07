import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'outline' | 'destructive' | 'destructive-outline' | 'subtle';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: ButtonSize; isLoading?: boolean; loadingLabel?: string;
  leftIcon?: React.ReactNode; rightIcon?: React.ReactNode;
}
const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-[var(--tenant-action-primary)] text-[var(--color-action-on-primary)] hover:bg-[var(--color-action-primary-hover)] active:bg-[var(--color-action-primary-active)]',
  secondary: 'border-[var(--color-border-strong)] bg-[var(--color-action-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-action-secondary-hover)]',
  ghost: 'border-transparent bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]',
  danger: 'border-transparent bg-[var(--color-status-negative-text)] text-[var(--color-action-on-primary)] hover:bg-[var(--primitive-red-700)]',
  link: 'min-h-0 border-transparent bg-transparent p-0 text-[var(--color-action-primary)] underline-offset-4 hover:underline',
  outline: 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]',
  destructive: 'border-transparent bg-[var(--color-status-negative-text)] text-[var(--color-action-on-primary)] hover:bg-[var(--primitive-red-700)]',
  'destructive-outline': 'border-[var(--color-status-negative-border)] bg-[var(--color-surface)] text-[var(--color-status-negative-text)] hover:bg-[var(--color-status-negative-bg)]',
  subtle: 'border-[var(--primitive-indigo-100)] bg-[var(--primitive-indigo-50)] text-[var(--color-action-primary)] hover:bg-[var(--primitive-indigo-100)]',
};
const sizes: Record<ButtonSize, string> = {
  xs: 'min-h-8 px-2.5 text-xs gap-1.5', sm: 'px-3 text-sm gap-1.5', md: 'px-4 text-sm gap-2',
  lg: 'min-h-[var(--size-control-lg)] px-5 text-base gap-2.5', icon: 'w-[var(--size-control-md)] p-0', 'icon-sm': 'min-h-9 w-9 p-0',
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, loadingLabel = 'Loading', leftIcon, rightIcon, className = '', disabled, children, type = 'button', ...props }, ref) => (
    <button {...props} ref={ref} type={type} disabled={disabled || isLoading} aria-busy={isLoading || undefined}
      className={`ds-control ds-focus-ring inline-flex items-center justify-center select-none border font-medium transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[var(--opacity-disabled)] ${variants[variant]} ${sizes[size]} ${className}`}>
      {isLoading ? <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" /> : leftIcon && <span aria-hidden="true" className="shrink-0">{leftIcon}</span>}
      {children && <span>{children}</span>}
      {isLoading && !children && <span className="sr-only">{loadingLabel}</span>}
      {!isLoading && rightIcon && <span aria-hidden="true" className="shrink-0">{rightIcon}</span>}
    </button>
  ),
);
Button.displayName = 'Button';

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon' | 'aria-label'> { label: string; icon: React.ReactNode; }
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ label, icon, size = 'icon', ...props }, ref) => (
  <Button {...props} ref={ref} size={size} aria-label={label} title={props.title ?? label}><span aria-hidden="true">{icon}</span></Button>
));
IconButton.displayName = 'IconButton';

