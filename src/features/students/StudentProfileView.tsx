import React, { useCallback, useEffect, useState } from 'react';
import { Download, Edit, Loader2, Printer } from 'lucide-react';
import { printStudentIdCard, printStudentProfileSheet } from '../../lib/studentPrint';
import { apiRequest, describeApiError } from '../../lib/apiClient';
import { Button, Drawer, StatusBadge } from '../../components/ui';
import { StudentRecord } from '../../types';
import { useApp } from '../../context/AppContext';
import { StudentEditProfileModal } from './StudentEditProfileModal';
import type { FormDefinition } from '../../lib/forms/types';

interface StudentProfileData {
  id: string;
  fullName: string;
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  preferredName?: string;
  lastName: string;
  status: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  stateOfOrigin?: string;
  religion?: string;
  photoUrl?: string;
  className?: string;
  arm?: string;
  profileCompletionPercent?: number;
  profileCompleteness?: { percent: number; sections: Record<string, { complete: boolean; label: string; detail?: string }> };
  guardians?: Array<{ name: string; phone: string; email?: string; relationship: string }>;
  residential?: { address?: string; city?: string; state?: string };
  emergency?: { name?: string; phone?: string; relationship?: string };
  enrollment?: { className?: string; arm?: string; sessionName?: string };
  customFields?: Record<string, string | boolean | number | string[]>;
  profileForm?: FormDefinition;
}

interface StudentProfileViewProps {
  studentId: string | null;
  fallback?: StudentRecord | null;
  onClose: () => void;
  onUpdated?: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'failed' | 'info' | 'error') => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ studentId, fallback, onClose, onUpdated, showToast }) => {
  const { branding, currentUser, demoMode } = useApp();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<'download' | 'print' | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const canEdit = demoMode || (currentUser.permissions?.includes('students.edit') ?? false);

  const loadProfile = useCallback(() => {
    if (!studentId) { setProfile(null); return; }
    setLoading(true);
    apiRequest<{ success: true; data: StudentProfileData }>(`/students/${encodeURIComponent(studentId)}`)
      .then((res) => setProfile(res.data))
      .catch(() => {
        if (fallback) {
          setProfile({
            id: fallback.id,
            fullName: `${fallback.firstName} ${fallback.lastName}`,
            admissionNumber: fallback.admissionNo,
            firstName: fallback.firstName,
            lastName: fallback.lastName,
            status: fallback.status,
            gender: fallback.gender,
            dateOfBirth: fallback.dateOfBirth,
            className: fallback.classLevel,
            arm: fallback.arm,
            guardians: [{ name: fallback.guardianName, phone: fallback.guardianPhone, email: fallback.guardianEmail, relationship: fallback.guardianRelationship }],
          });
        }
      })
      .finally(() => setLoading(false));
  }, [studentId, fallback]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const data = profile;
  const completeness = data?.profileCompleteness?.percent ?? data?.profileCompletionPercent ?? 0;

  const downloadProfile = async () => {
    if (!studentId || !data) return;
    setActionLoading('download');
    try {
      await printStudentProfileSheet(studentId, data.fullName);
      showToast('Profile opened', 'Use Print A4 Profile in the new window.', 'success');
    } catch (error) {
      showToast('Download failed', describeApiError(error), 'failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrintId = () => {
    if (!data) return;
    setActionLoading('print');
    try {
      printStudentIdCard(
        {
          id: data.id,
          fullName: data.fullName,
          firstName: data.firstName,
          lastName: data.lastName,
          admissionNumber: data.admissionNumber,
          className: data.className,
          arm: data.arm,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          photoUrl: data.photoUrl,
          status: data.status,
          guardians: data.guardians,
          enrollment: data.enrollment,
        },
        {
          schoolName: branding.schoolName,
          primaryColor: branding.primaryColor,
          address: branding.address,
          phone: branding.phone,
          email: branding.email,
        },
      );
      showToast('ID card opened', 'Use Print Student ID Card in the new window.', 'success');
    } catch (error) {
      showToast('Print failed', error instanceof Error ? error.message : 'Could not open the ID card print view.', 'failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Drawer
        isOpen={!!studentId}
        onClose={onClose}
        title={data && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
              {data.photoUrl ? <img src={data.photoUrl} alt="" className="w-full h-full object-cover" /> : <>{data.firstName[0]}{data.lastName[0]}</>}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{data.fullName}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{data.admissionNumber} · {data.className} {data.arm}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={data.status} />
                <span className="text-[11px] text-slate-400">Profile {completeness}% complete</span>
              </div>
            </div>
          </div>
        )}
        footer={data && (
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <Button variant="primary" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />} onClick={() => setIsEditOpen(true)}>
                Edit Profile
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={actionLoading === 'download' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              onClick={() => void downloadProfile()}
              disabled={!!actionLoading}
            >
              Download Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={actionLoading === 'print' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              onClick={handlePrintId}
              disabled={!!actionLoading}
            >
              Print Student ID
            </Button>
          </div>
        )}
      >
        {loading && <p className="text-sm text-slate-500 py-8 text-center">Loading profile...</p>}
        {data && !loading && (
          <div className="space-y-5">
            {data.profileCompleteness && (
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-700 uppercase">Profile Completeness</p>
                  <span className="text-sm font-bold text-indigo-700">{completeness}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${completeness}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(data.profileCompleteness.sections).map(([key, section]) => {
                    const s = section as { complete: boolean; label: string; detail?: string };
                    return (
                      <div key={key} className="text-xs flex items-center gap-1.5">
                        <span className={s.complete ? 'text-emerald-600' : 'text-slate-400'}>{s.complete ? '✓' : '○'}</span>
                        <span className="text-slate-600">{s.label}</span>
                        {s.detail && <span className="text-slate-400">({s.detail})</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <section className="rounded-xl border border-slate-200 p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Bio Information</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-slate-400 block">Gender</span><span className="font-medium">{data.gender ?? '—'}</span></div>
                <div><span className="text-slate-400 block">Date of Birth</span><span className="font-medium">{data.dateOfBirth ?? '—'}</span></div>
                <div><span className="text-slate-400 block">Session</span><span className="font-medium">{data.enrollment?.sessionName ?? '—'}</span></div>
                <div><span className="text-slate-400 block">Status</span><StatusBadge status={data.status} /></div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase">Guardian</h4>
              {(data.guardians ?? []).map((g, i) => (
                <div key={i} className="text-xs space-y-1">
                  <p className="font-semibold text-sm">{g.name} <span className="text-slate-400 font-normal">({g.relationship})</span></p>
                  <p className="text-slate-600">{g.phone}</p>
                  {g.email && <p className="text-slate-600">{g.email}</p>}
                </div>
              ))}
            </section>

            {(data.residential?.address || data.emergency?.name) && (
              <section className="rounded-xl border border-slate-200 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Contact & Emergency</h4>
                {data.residential?.address && <p className="text-xs text-slate-600">{data.residential.address}, {data.residential.city}</p>}
                {data.emergency?.name && <p className="text-xs text-slate-600">Emergency: {data.emergency.name} · {data.emergency.phone}</p>}
              </section>
            )}

            {data.profileForm?.sections.map((section) => {
              const fields = section.fields.filter((field) => field.source !== 'system' && field.visible !== false);
              if (fields.length === 0) return null;
              return (
                <section key={section.key} className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">{section.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {fields.map((field) => {
                      const value = data.customFields?.[field.key];
                      const display = Array.isArray(value) ? value.join(', ') : value === true ? 'Yes' : value === false ? 'No' : String(value ?? 'â€”');
                      const masked = field.sensitive && display !== 'â€”' ? `${'*'.repeat(Math.max(4, display.length - 2))}${display.slice(-2)}` : display;
                      return <div key={field.key}><span className="text-slate-400 block">{field.label}</span><span className="font-medium text-slate-800">{masked}</span></div>;
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </Drawer>

      <StudentEditProfileModal
        isOpen={isEditOpen}
        studentId={studentId}
        initial={{
          firstName: data?.firstName,
          middleName: data?.middleName,
          preferredName: data?.preferredName,
          lastName: data?.lastName,
          gender: data?.gender,
          dateOfBirth: data?.dateOfBirth,
          nationality: data?.nationality,
          stateOfOrigin: data?.stateOfOrigin,
          religion: data?.religion,
          status: data?.status,
          residential: data?.residential,
          emergency: data?.emergency,
          customFields: data?.customFields,
        }}
        profileForm={data?.profileForm}
        onClose={() => setIsEditOpen(false)}
        onSaved={() => { loadProfile(); onUpdated?.(); }}
        showToast={showToast}
      />
    </>
  );
};
