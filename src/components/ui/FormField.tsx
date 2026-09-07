import React, { forwardRef, useId } from 'react';
import { Search, X } from 'lucide-react';
import { IconButton } from './Button';

export interface FormFieldProps {
  label?: React.ReactNode; hint?: React.ReactNode; error?: React.ReactNode; required?: boolean;
  htmlFor?: string; className?: string; children: React.ReactNode;
}
export const FormField: React.FC<FormFieldProps> = ({ label, hint, error, required, htmlFor, className = '', children }) => {
  const generated = useId(); const controlId = htmlFor ?? generated;
  const hintId = hint ? `${controlId}-hint` : undefined; const errorId = error ? `${controlId}-error` : undefined;
  const child = React.isValidElement<Record<string, unknown>>(children)
    ? React.cloneElement(children, { id: children.props.id ?? controlId, required: children.props.required ?? required, 'aria-invalid': error ? true : children.props['aria-invalid'], 'aria-describedby': [children.props['aria-describedby'], hintId, errorId].filter(Boolean).join(' ') || undefined })
    : children;
  return <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label htmlFor={controlId} className="text-sm font-semibold text-[var(--color-text-secondary)]">{label}{required && <span aria-hidden="true" className="ml-0.5 text-[var(--color-status-negative-text)]">*</span>}{required && <span className="sr-only"> (required)</span>}</label>}
    {child}
    {hint && <div id={hintId} className="text-xs leading-4 text-[var(--color-text-muted)]">{hint}</div>}
    {error && <div id={errorId} role="alert" className="text-xs font-medium text-[var(--color-status-negative-text)]">{error}</div>}
  </div>;
};
export const Field = FormField;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { error?: boolean | string; leftIcon?: React.ReactNode; rightIcon?: React.ReactNode; isLoading?: boolean; }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ error, leftIcon, rightIcon, isLoading, className = '', ...props }, ref) => (
  <div className="relative flex w-full items-center">
    {leftIcon && <span aria-hidden="true" className="pointer-events-none absolute left-3 text-[var(--color-text-muted)]">{leftIcon}</span>}
    <input {...props} ref={ref} aria-invalid={error ? true : props['aria-invalid']} aria-busy={isLoading || undefined} className={`ds-field-control ds-focus-ring ${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`} />
    {rightIcon && <span className="absolute right-1 flex items-center">{rightIcon}</span>}
  </div>
));
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { error?: boolean | string; isLoading?: boolean; }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ error, isLoading, className = '', children, ...props }, ref) => (
  <select {...props} ref={ref} aria-invalid={error ? true : props['aria-invalid']} aria-busy={isLoading || undefined} className={`ds-field-control ds-focus-ring ${className}`}>{children}</select>
));
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { error?: boolean | string; isLoading?: boolean; }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ error, isLoading, className = '', rows = 4, ...props }, ref) => (
  <textarea {...props} ref={ref} rows={rows} aria-invalid={error ? true : props['aria-invalid']} aria-busy={isLoading || undefined} className={`ds-field-control ds-focus-ring resize-y ${className}`} />
));
Textarea.displayName = 'Textarea';

export interface SearchInputProps extends Omit<InputProps, 'onChange'> { value: string; onChange: (value: string) => void; onClear?: () => void; }
export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, onClear, placeholder = 'Search…', className = '', ...props }) => (
  <Input {...props} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} leftIcon={<Search className="h-4 w-4" />}
    rightIcon={value ? <IconButton variant="ghost" size="icon-sm" label="Clear search" icon={<X className="h-4 w-4" />} onClick={() => { onChange(''); onClear?.(); }} /> : undefined} className={className} />
);

