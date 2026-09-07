import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { StudentRecord } from '../../../types';
import { StudentsPageContent } from './StudentsPage';

const student: StudentRecord = { id: 'stu_public_1', admissionNo: 'ADM-001', firstName: 'Ada', lastName: 'Okafor', gender: 'Female', dateOfBirth: '2012-01-01', classLevel: 'JSS 2', arm: 'A', status: 'Active', photoUrl: '', guardianId: 'g1', guardianName: 'Ngozi Okafor', guardianRelationship: 'Mother', guardianPhone: '', guardianEmail: '', attendanceRate: 96, termAverage: 72, feesStatus: 'Partial', balanceDue: 12000 };
const base = { students: [student], classes: [{ id: 'jss2', name: 'JSS 2' }], canCreate: true, onOpenStudent: vi.fn(), onEnrol: vi.fn(), onImport: vi.fn() };

describe('Students V2', () => {
  it('renders one canonical heading, action, live metrics and records', () => {
    render(<StudentsPageContent {...base} />);
    expect(screen.getAllByRole('heading', { name: 'Students' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Enrol Student' })).toHaveLength(1);
    expect(screen.getByText('Total Students').parentElement?.textContent).toContain('1');
    expect(screen.getAllByText('Ada Okafor').length).toBeGreaterThan(0);
    expect(screen.queryByText('Teachers')).toBeNull();
    expect(screen.queryByText('Staff')).toBeNull();
  });

  it('filters by search and class', () => {
    render(<StudentsPageContent {...base} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search students' }), { target: { value: 'missing' } });
    expect(screen.getByText('No matching students')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search students' }), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by class' }), { target: { value: 'JSS 2' } });
    expect(screen.getAllByText('Ada Okafor').length).toBeGreaterThan(0);
  });

  it('supports loading, error, empty and view-only states', () => {
    const { rerender } = render(<StudentsPageContent {...base} state="loading" />);
    expect(screen.getByRole('status', { name: /loading/i })).toBeTruthy();
    rerender(<StudentsPageContent {...base} state="error" />);
    expect(screen.getByRole('alert').textContent).toContain('Unable to load students');
    rerender(<StudentsPageContent {...base} students={[]} canCreate={false} state="ready" />);
    expect(screen.getByText('No students enrolled yet')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Enrol Student' })).toBeNull();
  });

  it('opens profiles with the public record id', () => {
    const onOpenStudent = vi.fn();
    render(<StudentsPageContent {...base} onOpenStudent={onOpenStudent} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open actions for Ada Okafor' }));
    expect(onOpenStudent).toHaveBeenCalledWith('stu_public_1');
  });
});
