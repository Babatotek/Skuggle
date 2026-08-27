import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PersonalPlanner } from './PersonalPlanner';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe('PersonalPlanner', () => {
  it('creates, completes and removes a private plan item', () => {
    render(<PersonalPlanner userId="user-a" role="student" />);

    fireEvent.change(screen.getByLabelText(/What do you want to accomplish/i), {
      target: { value: 'Revise algebra' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    expect(screen.getByText('Revise algebra')).toBeInTheDocument();
    expect(screen.getByText(/1 open/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Complete Revise algebra/i }));
    expect(screen.getByText(/0 open/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Delete Revise algebra/i }));
    expect(screen.queryByText('Revise algebra')).not.toBeInTheDocument();
  });

  it('persists plans per user without leaking them to another account', () => {
    const first = render(<PersonalPlanner userId="user-a" role="teacher" />);
    fireEvent.change(screen.getByLabelText(/What do you want to accomplish/i), {
      target: { value: 'Prepare lesson notes' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    first.unmount();

    const returningUser = render(<PersonalPlanner userId="user-a" role="teacher" />);
    expect(screen.getByText('Prepare lesson notes')).toBeInTheDocument();
    returningUser.unmount();

    render(<PersonalPlanner userId="user-b" role="teacher" />);
    expect(screen.queryByText('Prepare lesson notes')).not.toBeInTheDocument();
  });
});
