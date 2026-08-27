import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MySkuggleWorkspace } from './MySkuggleWorkspace';

afterEach(cleanup);

describe('MySkuggleWorkspace', () => {
  it('presents a private, portable teacher workspace', () => {
    const selectTab = vi.fn();

    render(
      <MySkuggleWorkspace
        role="teacher"
        userId="teacher-1"
        userName="Ada Okafor"
        activeTab="home"
        schoolCount={2}
        onSelectTab={selectTab}
        onOpenModal={vi.fn()}
      />,
    );

    expect(screen.getByText(/My Skuggle · Personal workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/Private by default/i)).toBeInTheDocument();
    expect(screen.getByText(/2 authorised workspaces/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Open my resources/i }));
    expect(selectTab).toHaveBeenCalledWith('resources');
  });

  it('keeps personal resources distinct from school-owned records', () => {
    render(
      <MySkuggleWorkspace
        role="student"
        userId="student-1"
        userName="Timi Bello"
        activeTab="resources"
        schoolCount={1}
        onSelectTab={vi.fn()}
        onOpenModal={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: /Personal resources/i })).toBeInTheDocument();
    expect(screen.getByText(/school-owned copy/i)).toBeInTheDocument();
  });

  it('lists connected schools and switches without exposing school records in personal mode', () => {
    const onSwitch = vi.fn();
    render(
      <MySkuggleWorkspace
        role="teacher"
        userId="teacher-1"
        userName="Ada Okafor"
        activeTab="schools"
        schoolCount={1}
        schools={[
          {
            tenantId: 'school-1',
            tenantName: 'Adunni Academy',
            tenantCode: 'ADN',
            roleLabel: 'Teacher',
          },
        ]}
        onSelectTab={vi.fn()}
        onOpenModal={vi.fn()}
        onSwitchWorkspace={onSwitch}
      />,
    );

    expect(screen.getByText(/Adunni Academy · Teacher/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Switch to school/i }));
    expect(onSwitch).toHaveBeenCalledWith('school-1');
  });
});
