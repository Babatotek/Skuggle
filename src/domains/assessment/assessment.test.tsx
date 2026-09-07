import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AssessmentDomainWorkspace, { Registry } from './AssessmentDomainWorkspace';
import ScoreEntryGrid from './ScoreEntryGrid';
import { pasteScores, validScore } from './scoreLogic';
import { normalizeGeneratedQuestions } from './QuestionBank';
import { assessmentFreezeSummary, assessmentMigrationManifest, ASSESSMENT_MVP_FREEZE_ROUTE_IDS } from '../../frontend-v2/assessmentMigrationManifest';
import { routeById, matchCanonicalPath } from '../../routing/builders';
import { CANONICAL_ROUTES } from '../../routing/registry';
import { primaryNavigationIdForRoute, SCHOOL_STAFF_PRIMARY_NAVIGATION } from '../../routing/primaryNavigation';

const request = vi.fn(); const mutation = vi.fn();
vi.mock('../../lib/apiClient', () => ({ apiRequest: (...args: unknown[]) => request(...args), apiMutation: (...args: unknown[]) => mutation(...args), describeApiError: (e: Error) => e.message }));
vi.mock('../../state/ApplicationStateProviders', () => ({ useAccess: () => ({ hasCapability: () => true }), useAcademicContext: () => ({ workspaceGeneration: 1, session: { id: 's' }, term: { id: 't' } }), useWorkspace: () => ({ generation: 1 }) }));
const record = { id: 'assessment-id', title: 'Tenant assessment', type: 'test', className: 'Class A', subject: 'Mathematics', date: '2026-09-05', status: 'marking', maxScore: 40, delivery: 'manual', marked: 1, expected: 2, metadata: {} };
const overview = { metrics: { active: 7, marking: 2, scheduled: 3, moderation: 1 }, workflow: { Planned: 4, Scheduled: 3, Delivered: 1, Marking: 2, Moderation: 1, Locked: 8 }, myWork: [record], trend: [{ month: 'Sep', assessments: 7, completed: 2 }], coverage: [{ id: 'coverage-id', className: 'Class A', subject: 'Mathematics', planned: 7, completed: 2, marked: 1 }], recent: [record], upcoming: [record] };
const rows = [{ id: 'student-a', fullName: 'Learner A', admissionNumber: 'A', score: null, state: 'NOT_ENTERED', comment: '' }, { id: 'student-b', fullName: 'Learner B', admissionNumber: 'B', score: null, state: 'NOT_ENTERED', comment: '' }];
beforeEach(() => { request.mockReset(); mutation.mockReset(); });
describe('Assessment V2 ownership', () => {
  it('opens overview and keeps all deep routes in one primary destination', () => {
    expect(matchCanonicalPath('/school/assessment')?.route.pageContext?.tab).toBe('overview');
    expect(SCHOOL_STAFF_PRIMARY_NAVIGATION.flatMap(g => g.items).filter(x => x.routeId.startsWith('school.assessment'))).toHaveLength(1);
    for (const route of CANONICAL_ROUTES.filter(x => x.workspace === 'school' && x.domain === 'assessment')) expect(primaryNavigationIdForRoute(route)).toBe('school.assessment');
    expect(new Set(CANONICAL_ROUTES.map(x => x.path)).size).toBe(CANONICAL_ROUTES.length);
    expect(matchCanonicalPath('/school/assessment/assessments/create')?.route.id).toBe('school.assessment.create');
  });
  it('renders six destinations and authoritative overview regions without duplicate headings', async () => {
    request.mockResolvedValue({ data: overview });
    render(<MemoryRouter initialEntries={['/school/assessment']}><AssessmentDomainWorkspace route={routeById('school.assessment')} /></MemoryRouter>);
    await screen.findByText('Assessment Workflow');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const nav = screen.getByRole('navigation', { name: 'Assessment sections' });
    expect(nav.querySelectorAll('a')).toHaveLength(6);
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe('Overview');
    for (const title of ['My Work', 'Assessment Trend', 'Assessment Coverage', 'Recent Assessments', 'Upcoming Assessments']) expect(screen.getByRole('heading', { name: title })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Sep: 7 assessments, 2 completed' })).toBeTruthy();
    expect(request.mock.calls.filter(x => x[0] === '/assessments/overview')).toHaveLength(1);
  });
  it('keeps navigation available on API failure and retries', async () => {
    request.mockRejectedValueOnce(new Error('Connection interrupted')).mockResolvedValueOnce({ data: overview });
    render(<MemoryRouter><AssessmentDomainWorkspace route={routeById('school.assessment')} /></MemoryRouter>);
    await screen.findByRole('alert');
    expect(screen.getByRole('navigation', { name: 'Assessment sections' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('Assessment Workflow');
  });
  it('uses server pages and filters instead of slicing a downloaded collection', async () => {
    request.mockImplementation((url: string) => Promise.resolve({ data: url.includes('lookups') ? { classes: [], subjects: [], session: { name: '2026' }, term: { name: 'Term 1' } } : { data: [record], meta: { total: 20, currentPage: url.includes('page=2') ? 2 : 1, lastPage: 2 } } }));
    render(<MemoryRouter><Registry /></MemoryRouter>);
    await screen.findByText('20 records · Page 1 of 2');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('20 records · Page 2 of 2');
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'exam' } });
    await waitFor(() => expect(request.mock.calls.some(x => x[0].includes('type=exam') && x[0].includes('page=1'))).toBe(true));
  });
  it('shows empty and loading states on exam schedule', async () => {
    request.mockResolvedValue({ data: { data: [], meta: { total: 0, currentPage: 1, lastPage: 1 } } });
    render(<MemoryRouter><AssessmentDomainWorkspace route={routeById('school.assessment.exam-schedule')} /></MemoryRouter>);
    expect(screen.getByLabelText(/Loading exam schedule/i)).toBeTruthy();
    await screen.findByText('No assessments scheduled this month.');
  });
  it('loads assessment settings with moderation workflow options', async () => {
    request.mockResolvedValue({ data: { moderationRequired: true, defaultDuration: 60 } });
    render(<MemoryRouter><AssessmentDomainWorkspace route={routeById('school.assessment.settings')} /></MemoryRouter>);
    await screen.findByText('Assessment Settings');
    expect((screen.getByLabelText('Moderation workflow') as HTMLSelectElement).value).toBe('true');
    expect((screen.getByLabelText('Default duration (minutes)') as HTMLInputElement).value).toBe('60');
  });
  it('renders marking queue filters and registry empty state', async () => {
    request.mockImplementation((url: string) => Promise.resolve({
      data: url.includes('lookups')
        ? { classes: [], subjects: [], session: { name: '2026' }, term: { name: 'Term 1' } }
        : { data: [], meta: { total: 0, currentPage: 1, lastPage: 1 } },
    }));
    render(<MemoryRouter><AssessmentDomainWorkspace route={routeById('school.assessment.marking')} /></MemoryRouter>);
    await screen.findByText('No assessments yet.');
    expect(screen.getByLabelText('Marking & Moderation view')).toBeTruthy();
  });
  it('keeps a mobile list sibling for assessment tables', async () => {
    request.mockImplementation((url: string) => Promise.resolve({
      data: url.includes('lookups')
        ? { classes: [], subjects: [], session: { name: '2026' }, term: { name: 'Term 1' } }
        : { data: [record], meta: { total: 1, currentPage: 1, lastPage: 1 } },
    }));
    const { container } = render(<MemoryRouter><Registry /></MemoryRouter>);
    await waitFor(() => expect(container.querySelector('.assessment-mobile-row')).toBeTruthy());
    expect(container.querySelector('.assessment-mobile-list')).toBeTruthy();
    expect(container.querySelector('.assessment-table-wrap')).toBeTruthy();
  });
});
describe('Assessment MVP freeze gates', () => {
  it('marks A1–A9 freeze routes verified while leaving CBT open', () => {
    const summary = assessmentFreezeSummary();
    expect(summary.mvpTotal).toBe(ASSESSMENT_MVP_FREEZE_ROUTE_IDS.length);
    expect(summary.mvpVisual).toBe(summary.mvpTotal);
    expect(summary.mvpResponsive).toBe(summary.mvpTotal);
    expect(summary.mvpFunctional).toBe(summary.mvpTotal);
    expect(summary.openCbt).toBe(true);
    expect(summary.cbtDeliveryFused).toBe(true);
    expect(summary.cbtStudentPlayer).toBe(true);
    for (const id of ASSESSMENT_MVP_FREEZE_ROUTE_IDS) {
      const entry = assessmentMigrationManifest.find(e => e.routeId === id);
      expect(entry?.cutoverStatus).toBe('VERIFIED');
      expect(entry?.legacyRemoved).toBe(true);
    }
    const cbt = assessmentMigrationManifest.find(e => e.routeId === 'school.assessment.cbt');
    expect(cbt?.visualValidated).toBe(false);
    expect(cbt?.cutoverStatus).toBe('CUTOVER');
  });
  it('lists CBT assessments from Assessment delivery filter on Online Assessments', async () => {
    const cbtRecord = { ...record, delivery: 'cbt', availableFrom: '2026-09-07T10:00:00+01:00', availableUntil: '2026-09-07T10:45:00+01:00', metadata: { duration: 45, startTime: '10:00' } };
    request.mockResolvedValue({ data: { data: [cbtRecord], meta: { total: 1, currentPage: 1, lastPage: 1 } } });
    const OnlineAssessments = (await import('./OnlineAssessments')).default;
    render(<MemoryRouter><OnlineAssessments /></MemoryRouter>);
    await screen.findByText('Tenant assessment');
    expect(request.mock.calls.some(x => String(x[0]).includes('delivery=cbt'))).toBe(true);
    expect(screen.getByText(/roster 2/i)).toBeTruthy();
  });
});
describe('Score entry integrity', () => {
  it('validates maximum, zero, absence, and atomic spreadsheet paste', () => {
    expect(validScore('0', 40)).toBe(true); expect(validScore('41', 40)).toBe(false); expect(validScore('-1', 40)).toBe(false);
    expect(pasteScores(rows, 0, '12\n0', 40).map(r => r.score)).toEqual([12, 0]);
    expect(() => pasteScores(rows, 0, '12\n41', 40)).toThrow();
    expect(() => pasteScores(rows, 1, '12\n10', 40)).toThrow();
    expect(rows[0].score).toBeNull();
  });
  it('autosaves absent state and advances score focus using Enter', async () => {
    request.mockResolvedValue({ data: { assessmentId: 'id', maxScore: 40, editable: true, revision: 'rev', status: 'marking', students: rows } }); mutation.mockResolvedValue({ data: { revision: 'next' } });
    render(<ScoreEntryGrid id="id" />);
    const first = await screen.findByLabelText('Score for Learner A');
    fireEvent.keyDown(first, { key: 'Enter' }); expect(document.activeElement).toBe(screen.getByLabelText('Score for Learner B'));
    fireEvent.change(screen.getByLabelText('Status for Learner A'), { target: { value: 'ABSENT' } });
    await waitFor(() => expect(mutation).toHaveBeenCalled(), { timeout: 2500 });
    expect(mutation.mock.calls[0][2].states['student-a']).toBe('ABSENT'); expect(mutation.mock.calls[0][2].scores['student-a']).toBeNull();
  });
  it('locks inputs when the server marks the grid immutable', async () => {
    request.mockResolvedValue({ data: { assessmentId: 'id', maxScore: 40, editable: false, revision: 'rev', status: 'locked', students: rows } });
    render(<ScoreEntryGrid id="id" />);
    expect((await screen.findByLabelText('Score for Learner A') as HTMLInputElement).disabled).toBe(true);
  });
  it('assigns separate identities even to identical generated display numbers', () => {
    const questions = normalizeGeneratedQuestions({ questions: [{ number: 1, text: 'Same' }, { number: 1, text: 'Same' }] });
    expect(questions[0].id).not.toBe(questions[1].id); expect(questions.every(q => q.status === 'draft')).toBe(true);
  });
});
