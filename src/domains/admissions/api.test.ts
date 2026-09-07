import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  convertAdmissionApplication,
  getAdmissionApplications,
  getAdmissionsOverview,
  recordAdmissionDecision,
  updateAdmissionCycle,
} from './api';

const jsonResponse = (data: unknown, status = 200) => new Response(JSON.stringify({ success: true, data }), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

afterEach(() => vi.unstubAllGlobals());

describe('Admissions API adapter', () => {
  it('maps the persisted overview aggregate to the four-card V2 contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      metrics: [
        { id: 'totalApplications', label: 'Total applications', value: 48 },
        { id: 'awaitingScreening', label: 'Awaiting screening', value: 12 },
        { id: 'offersAndAcceptances', label: 'Offers', value: 18 },
      ],
      pipeline: [{ status: 'submitted', count: 8 }, { status: 'screening', count: 4 }, { status: 'offered', count: 18 }],
      recentApplications: [{ id: 'app_1', reference: 'APP-1', status: 'submitted', fullName: 'Ada Obi' }],
      trend: [{ label: 'Sep', applications: 48 }],
      tasks: [{ id: 'screening', label: 'Awaiting screening', count: 12 }],
      conversion: { converted: 15, decided: 20, rate: 75 },
    })));

    const response = await getAdmissionsOverview();
    expect(response.data.metrics.totalApplications.value).toBe(48);
    expect(response.data.metrics.enrolled.value).toBe(15);
    expect(response.data.metrics.pendingScreening.context).toContain('25%');
    expect(response.data.pipeline.find((stage) => stage.key === 'screening')?.count).toBe(12);
    expect(response.data.pipeline.find((stage) => stage.key === 'offer')?.count).toBe(18);
    expect(response.data.pipeline.find((stage) => stage.key === 'enrolment')?.context).toBe('Successfully enrolled');
    expect(response.data.recentApplications[0].applicationNumber).toBe('APP-1');
  });

  it('uses the backend search, class and pagination parameter names', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      data: [{ id: 'app_1', reference: 'APP-1', status: 'submitted', fullName: 'Ada Obi', requestedClass: { id: 'class_1', name: 'JSS 1' } }],
      meta: { currentPage: 2, perPage: 10, total: 11, lastPage: 2 },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await getAdmissionApplications({ query: 'Ada', status: 'submitted', classId: 'class_1', page: 2, perPage: 10 });
    expect(String(fetchMock.mock.calls[0][0])).toContain('search=Ada');
    expect(String(fetchMock.mock.calls[0][0])).toContain('classId=class_1');
    expect(String(fetchMock.mock.calls[0][0])).toContain('perPage=10');
    expect(response.data.items[0].classApplied).toBe('JSS 1');
  });

  it('targets the authoritative decision, conversion and cycle endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'saved' }));
    vi.stubGlobal('fetch', fetchMock);

    await recordAdmissionDecision('app_1', { decision: 'offered', offeredClassId: 'class_1' });
    await convertAdmissionApplication('app_1', { academicSessionId: 'session_1' });
    await updateAdmissionCycle({ name: '2026', status: 'active', currency: 'NGN', applicationFeeMinor: 0 });

    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls[0]).toContain('/admissions/applications/app_1/decision');
    expect(urls[1]).toContain('/admissions/applications/app_1/convert');
    expect(urls[2]).toContain('/admissions/settings/cycle');
  });
});
