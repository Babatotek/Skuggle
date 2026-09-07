import React, { useId, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem { label: React.ReactNode; href?: string; onClick?: () => void; }
export const Breadcrumb: React.FC<{ items: BreadcrumbItem[]; label?: string; className?: string }> = ({ items, label = 'Breadcrumb', className = '' }) => (
  <nav aria-label={label} className={className}><ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
    {items.map((item, index) => <li key={index} className="flex items-center gap-1.5">
      {index > 0 && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />}
      {item.href ? <a className="ds-focus-ring rounded-sm hover:text-[var(--color-text-primary)]" href={item.href}>{item.label}</a>
        : item.onClick ? <button type="button" onClick={item.onClick} className="ds-focus-ring rounded-sm hover:text-[var(--color-text-primary)]">{item.label}</button>
        : <span aria-current={index === items.length - 1 ? 'page' : undefined} className="font-medium text-[var(--color-text-secondary)]">{item.label}</span>}
    </li>)}
  </ol></nav>
);

export interface TabItem { id: string; label: React.ReactNode; panel: React.ReactNode; disabled?: boolean; }
export const Tabs: React.FC<{ items: TabItem[]; value: string; onValueChange: (value: string) => void; label: string }> = ({ items, value, onValueChange, label }) => {
  const baseId = useId(); const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const move = (index: number, direction: number) => { let next = index; do next = (next + direction + items.length) % items.length; while (items[next].disabled && next !== index); refs.current[next]?.focus(); onValueChange(items[next].id); };
  const selected = items.find((item) => item.id === value) ?? items[0];
  return <div><div role="tablist" aria-label={label} className="flex gap-1 border-b border-[var(--color-border-default)]">
    {items.map((item, index) => <button key={item.id} ref={(node) => { refs.current[index] = node; }} role="tab" id={`${baseId}-${item.id}-tab`} aria-controls={`${baseId}-${item.id}-panel`} aria-selected={item.id === selected.id} tabIndex={item.id === selected.id ? 0 : -1} disabled={item.disabled} onClick={() => onValueChange(item.id)} onKeyDown={(event) => { if (event.key === 'ArrowRight') move(index, 1); if (event.key === 'ArrowLeft') move(index, -1); }} className="ds-focus-ring min-h-[var(--size-control-md)] border-b-2 border-transparent px-3 text-sm font-medium text-[var(--color-text-secondary)] aria-selected:border-[var(--color-action-primary)] aria-selected:text-[var(--color-action-primary)]">{item.label}</button>)}
  </div><div role="tabpanel" id={`${baseId}-${selected.id}-panel`} aria-labelledby={`${baseId}-${selected.id}-tab`} tabIndex={0}>{selected.panel}</div></div>;
};

export interface Segment { value: string; label: React.ReactNode; disabled?: boolean; }
export const SegmentedControl: React.FC<{ segments: Segment[]; value: string; onValueChange: (value: string) => void; label: string }> = ({ segments, value, onValueChange, label }) => (
  <fieldset className="inline-flex rounded-[var(--radius-control)] border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] p-1"><legend className="sr-only">{label}</legend>
    {segments.map((segment) => <label key={segment.value} className={`ds-focus-ring relative cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${value === segment.value ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}><input className="sr-only" type="radio" name={label} value={segment.value} checked={value === segment.value} disabled={segment.disabled} onChange={() => onValueChange(segment.value)} />{segment.label}</label>)}
  </fieldset>
);

