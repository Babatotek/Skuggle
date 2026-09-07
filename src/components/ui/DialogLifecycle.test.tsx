import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';
import { Drawer } from './Drawer';
import { Modal } from './Modal';

describe('shared dialog focus lifecycle', () => {
  it('traps Tab and Shift+Tab, closes on Escape, and restores trigger focus', async () => {
    const user = userEvent.setup();
    function Consumer() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>Open enrolment</button><Modal isOpen={open} onClose={() => setOpen(false)} title="Student enrolment"><button>First</button><button>Last</button></Modal></>;
    }
    render(<Consumer />);
    const trigger = screen.getByText('Open enrolment');
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Student enrolment' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    screen.getByText('Last').focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close dialog' }));
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByText('Last'));
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('gives confirmation dialogs an accessible name and blocks dismissal while busy', () => {
    const close = vi.fn();
    render(<ConfirmDialog isOpen onClose={close} onConfirm={vi.fn()} title="Delete student?" message="This cannot be undone" isLoading />);
    expect(screen.getByRole('dialog', { name: 'Delete student?' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
  });

  it('applies the same keyboard lifecycle to left-placed drawers', async () => {
    const close = vi.fn();
    render(<Drawer isOpen onClose={close} placement="left" title="Navigation"><button>Nav action</button></Drawer>);
    const drawer = screen.getByRole('dialog', { name: 'Navigation' });
    await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
  });
});
