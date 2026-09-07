import React from 'react';
import { CircleAlert, CircleCheck, CircleMinus, CircleX, Info, LockKeyhole } from 'lucide-react';
import { resolveStatus, type StatusTone } from './statusRegistry';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'indigo' | 'purple';
export type StatusType = string;
export interface StatusBadgeProps { status?: StatusType; tone?: StatusTone; variant?: BadgeVariant; size?: 'sm' | 'md'; showIcon?: boolean; showDot?: boolean; pulseDot?: boolean; className?: string; children?: React.ReactNode; }
const legacyTone: Record<BadgeVariant, StatusTone> = { success: 'positive', warning: 'attention', danger: 'negative', info: 'informational', neutral: 'neutral', indigo: 'informational', purple: 'restricted' };
const toneStyles: Record<StatusTone, string> = {
  positive: 'bg-[var(--color-status-positive-bg)] text-[var(--color-status-positive-text)] border-[var(--color-status-positive-border)]',
  informational: 'bg-[var(--color-status-information-bg)] text-[var(--color-status-information-text)] border-[var(--color-status-information-border)]',
  attention: 'bg-[var(--color-status-attention-bg)] text-[var(--color-status-attention-text)] border-[var(--color-status-attention-border)]',
  negative: 'bg-[var(--color-status-negative-bg)] text-[var(--color-status-negative-text)] border-[var(--color-status-negative-border)]',
  restricted: 'bg-[var(--color-status-restricted-bg)] text-[var(--color-status-restricted-text)] border-[var(--color-status-restricted-border)]',
  neutral: 'bg-[var(--color-status-neutral-bg)] text-[var(--color-status-neutral-text)] border-[var(--color-status-neutral-border)]',
};
const icons = { positive: CircleCheck, informational: Info, attention: CircleAlert, negative: CircleX, restricted: LockKeyhole, neutral: CircleMinus };
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, tone, variant, size = 'sm', showIcon = true, showDot = false, pulseDot = false, className = '', children }) => {
  const resolvedTone = tone ?? (variant ? legacyTone[variant] : resolveStatus(status).tone);
  const Icon = icons[resolvedTone]; const label = children ?? status ?? 'Unknown';
  return <span role="status" className={`inline-flex shrink-0 items-center rounded-full border font-medium ${toneStyles[resolvedTone]} ${size === 'sm' ? 'gap-1.5 px-2 py-0.5 text-xs' : 'gap-2 px-2.5 py-1 text-sm'} ${className}`}>
    {showIcon && <Icon aria-hidden="true" className="h-3.5 w-3.5" />}
    {showDot && <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full bg-current ${pulseDot ? 'animate-pulse motion-reduce:animate-none' : ''}`} />}
    <span>{label}</span>
  </span>;
};

