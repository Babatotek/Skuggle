import React, { forwardRef, useId } from 'react';

type ChoiceProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: React.ReactNode;
  description?: React.ReactNode;
};

function Choice({ type, label, description, id, className = '', ...props }: ChoiceProps & { type: 'checkbox' | 'radio' }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <input
        {...props}
        id={inputId}
        type={type}
        aria-describedby={descriptionId}
        className="ds-focus-ring mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-action-primary)] disabled:opacity-[var(--opacity-disabled)]"
      />
      <div className="min-w-0">
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text-primary)]">{label}</label>
        {description && <p id={descriptionId} className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{description}</p>}
      </div>
    </div>
  );
}

export const Checkbox = (props: ChoiceProps) => <Choice {...props} type="checkbox" />;
export const Radio = (props: ChoiceProps) => <Choice {...props} type="radio" />;

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, label, description, disabled, className = '', ...props }, ref) => (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <span id={`${props.id ?? 'switch'}-label`} className="block text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
        {description && <span className="block text-xs text-[var(--color-text-secondary)]">{description}</span>}
      </div>
      <button
        {...props}
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${props.id ?? 'switch'}-label`}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className="ds-focus-ring ds-control relative h-6 min-h-6 w-11 shrink-0 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-0.5 aria-checked:bg-[var(--color-action-primary)] disabled:opacity-[var(--opacity-disabled)]"
      >
        <span className={`block h-4 w-4 rounded-full bg-[var(--color-surface)] shadow-sm transition-transform duration-[var(--motion-micro)] ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  ),
);
Switch.displayName = 'Switch';

