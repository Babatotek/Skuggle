import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssessmentStudio } from './AssessmentsView';

const apiMutation = vi.fn();
const showToast = vi.fn();

vi.mock('../../lib/apiClient', () => ({
  apiMutation: (...args: unknown[]) => apiMutation(...args),
  describeApiError: () => 'request failed',
}));

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    assessments: [],
    updateAssessmentScore: vi.fn(),
    lockAssessment: vi.fn(),
    currentRole: 'Teacher',
    branding: { schoolName: 'Test School' },
    showToast,
    cbtQuizzes: [],
    setCbtQuizzes: vi.fn(),
  }),
}));

vi.mock('../../components/SkuggleAIBuddy', () => ({ SkuggleAIBuddy: () => null }));

const question = (text: string) => ({
  number: 1,
  text,
  options: ['A) One', 'B) Two'],
  correctAnswer: 'A',
  explanation: 'Explanation',
  marks: 2,
  cognitiveLevel: 'Application',
});

const assessment = (questions: ReturnType<typeof question>[]) => ({
  title: 'Generated test',
  schoolName: 'Test School',
  subject: 'Mathematics',
  classLevel: 'JSS 2',
  term: 'First Term',
  topics: 'Algebra',
  timeAllowed: '30 minutes',
  totalMarks: 4,
  generalInstructions: 'Answer all questions.',
  sectionA: { title: 'Objective', instructions: 'Choose one.', totalMarks: 4, questions },
  sectionB: { title: 'Theory', instructions: '', totalMarks: 0, questions: [] },
  markingScheme: { summary: 'Summary', gradeBoundaries: [] },
});

describe('AssessmentStudio generated question identity', () => {
  beforeEach(() => {
    apiMutation.mockReset();
    showToast.mockReset();
  });

  it('renders and rerenders distinct questions that reuse a display number without duplicate-key warnings', async () => {
    const duplicateKeyWarnings: unknown[][] = [];
    const originalConsoleError = console.error;
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => {
      if (args.some((arg) => String(arg).includes('same key'))) duplicateKeyWarnings.push(args);
      else originalConsoleError(...args);
    });

    const first = question('First question with display number one?');
    const second = question('Second question with display number one?');
    apiMutation.mockResolvedValueOnce({ data: { assessment: assessment([first, second]) } });

    render(<AssessmentStudio />);
    fireEvent.click(screen.getByRole('button', { name: /generate assessment with ai/i }));

    expect(await screen.findByText(/First question with display number one/)).toBeTruthy();
    expect(screen.getByText(/Second question with display number one/)).toBeTruthy();
    expect(screen.getAllByText(/^1\./)).toHaveLength(2);

    apiMutation.mockResolvedValueOnce({ data: { assessment: assessment([second]) } });
    fireEvent.click(screen.getByRole('button', { name: /generate assessment with ai/i }));

    await waitFor(() => expect(screen.queryByText(/First question with display number one/)).toBeNull());
    expect(screen.getByText(/Second question with display number one/)).toBeTruthy();
    expect(screen.getAllByText(/^1\./)).toHaveLength(1);
    expect(duplicateKeyWarnings).toEqual([]);

    consoleError.mockRestore();
  });
});
