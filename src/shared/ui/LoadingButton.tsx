import React from 'react';
import { ActionSpinner } from './ActionSpinner';

type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
  /** Keep icon visible next to spinner when not loading */
  icon?: React.ReactNode;
};

/**
 * Primary action button with spiked spinner while the request/action runs.
 */
export function LoadingButton({
  loading = false,
  loadingText,
  spinnerSize = 'md',
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-1.5 transition-opacity disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <ActionSpinner size={spinnerSize} />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
