import React from 'react';
import fs from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, IconButton } from './Button';
import { Field, Input } from './FormField';
import { StatusBadge } from './StatusBadge';
import { Switch } from './Controls';
import { Tabs } from './Navigation';
import { contrastRatio, resolveTenantTheme } from '../../lib/designSystem/tenantTheme';

describe('Wave 2 accessible primitives', () => {
  it('renders semantic, named and disabled action controls', () => {
    render(<><Button isLoading>Save student</Button><IconButton label="Delete student" icon={<span>×</span>} /><Button disabled>Publish</Button></>);
    expect(screen.getByRole('button', { name: 'Save student' }).getAttribute('aria-busy')).toBe('true');
    expect(screen.getByRole('button', { name: 'Delete student' }).getAttribute('title')).toBe('Delete student');
    expect((screen.getByRole('button', { name: 'Publish' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('associates field label, help, required state and validation', () => {
    render(<Field label="Legal name" hint="As shown on records" error="Enter a name" required><Input /></Field>);
    const input = screen.getByLabelText(/Legal name/);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain('-hint');
    expect(input.getAttribute('aria-describedby')).toContain('-error');
    expect(screen.getByRole('alert').textContent).toBe('Enter a name');
  });

  it('announces semantic status with a non-color cue', () => {
    render(<StatusBadge status="Suspended" />);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Suspended');
    expect(status.querySelector('svg')).toBeTruthy();
  });

  it('exposes switch state and keyboard-operable tab selection', async () => {
    const change = vi.fn(); const tabChange = vi.fn(); const user = userEvent.setup();
    render(<><Switch checked={false} onCheckedChange={change} label="Notify guardian" /><Tabs label="Views" value="one" onValueChange={tabChange} items={[{ id: 'one', label: 'One', panel: 'First' }, { id: 'two', label: 'Two', panel: 'Second' }]} /></>);
    await user.click(screen.getByRole('switch', { name: 'Notify guardian' })); expect(change).toHaveBeenCalledWith(true);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'One' }), { key: 'ArrowRight' }); expect(tabChange).toHaveBeenCalledWith('two');
  });

  it('falls back from unsafe tenant action colors and preserves protected tokens', () => {
    expect(contrastRatio('#ffffff')).toBe(1);
    const unsafe = resolveTenantTheme('#ffffff') as Record<string, string>;
    expect(unsafe['--tenant-action-primary']).toBe('var(--color-action-primary)');
    expect(Object.keys(unsafe)).not.toContain('--color-status-negative-text');
  });

  it('defines a reduced-motion token override', () => {
    const css = fs.readFileSync('src/styles/tokens.css', 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('--motion-standard: 1ms');
  });
});
