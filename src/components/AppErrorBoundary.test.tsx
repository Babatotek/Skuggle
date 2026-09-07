import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';

function Broken(): React.ReactNode { throw new Error('sensitive internal details'); }

describe('AppErrorBoundary', () => {
  it('contains a page render failure without replacing the shell', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<div><nav>Workspace navigation</nav><AppErrorBoundary preserveShell resetKey="students"><Broken /></AppErrorBoundary></div>);
    expect(screen.getByText('Workspace navigation')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).not.toContain('sensitive internal details');
    expect(screen.getByText(/Reference:/)).toBeTruthy();
  });

  it('offers a retry path', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let broken = true;
    function SometimesBroken(): React.ReactNode { if (broken) throw new Error('boom'); return <p>Recovered</p>; }
    render(<AppErrorBoundary preserveShell resetKey="reports"><SometimesBroken /></AppErrorBoundary>);
    broken = false;
    fireEvent.click(screen.getByText('Try page again'));
    expect(screen.getByText('Recovered')).toBeTruthy();
  });
});
