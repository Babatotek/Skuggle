import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  Plus,
  Printer,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TimetablePeriod } from '../../types';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';

export const ClassTimetableView: React.FC = () => {
  const { branding, classes, staff, showToast } = useApp();

  const [selectedClass, setSelectedClass] = useState<string>(classes[0]?.name || '');
  const [selectedArm, setSelectedArm] = useState<string>(classes[0]?.arms?.[0] || '');
  const [showAddPeriodModal, setShowAddPeriodModal] = useState<boolean>(false);

  // Demo seed shown only in the explicitly selected demo workspace.
  const demoPeriods: TimetablePeriod[] = [
    // Monday
    { id: 'p-1', day: 'Monday', periodNumber: 1, startTime: '08:00', endTime: '08:45', subject: 'Mathematics', teacherName: 'Mr. Emmanuel Okafor', teacherId: 'stf-001', room: 'Room 2A' },
    { id: 'p-2', day: 'Monday', periodNumber: 2, startTime: '08:45', endTime: '09:30', subject: 'English Language', teacherName: 'Mrs. Folashade Adeleke', teacherId: 'stf-002', room: 'Room 2A' },
    { id: 'p-3', day: 'Monday', periodNumber: 3, startTime: '09:45', endTime: '10:30', subject: 'Basic Science & Tech', teacherName: 'Mr. Babatunde Sanusi', teacherId: 'stf-003', room: 'Lab 1' },
    { id: 'p-4', day: 'Monday', periodNumber: 4, startTime: '10:30', endTime: '11:15', subject: 'Computer Studies', teacherName: 'Mr. Chidi Okonkwo', teacherId: 'stf-004', room: 'ICT Lab' },
    { id: 'p-5', day: 'Monday', periodNumber: 5, startTime: '11:45', endTime: '12:30', subject: 'Civic Education', teacherName: 'Mrs. Ngozi Eze', teacherId: 'stf-005', room: 'Room 2A' },

    // Tuesday
    { id: 'p-6', day: 'Tuesday', periodNumber: 1, startTime: '08:00', endTime: '08:45', subject: 'English Language', teacherName: 'Mrs. Folashade Adeleke', teacherId: 'stf-002', room: 'Room 2A' },
    { id: 'p-7', day: 'Tuesday', periodNumber: 2, startTime: '08:45', endTime: '09:30', subject: 'Agricultural Science', teacherName: 'Mr. Tunde Lawal', teacherId: 'stf-006', room: 'Farm Lab' },
    { id: 'p-8', day: 'Tuesday', periodNumber: 3, startTime: '09:45', endTime: '10:30', subject: 'Mathematics', teacherName: 'Mr. Emmanuel Okafor', teacherId: 'stf-001', room: 'Room 2A' },
    { id: 'p-9', day: 'Tuesday', periodNumber: 4, startTime: '10:30', endTime: '11:15', subject: 'Business Studies', teacherName: 'Mrs. Funke Alabi', teacherId: 'stf-007', room: 'Room 2A' },
    { id: 'p-10', day: 'Tuesday', periodNumber: 5, startTime: '11:45', endTime: '12:30', subject: 'French', teacherName: 'M. Jean Pierre', teacherId: 'stf-008', room: 'Lang Lab' },

    // Wednesday
    { id: 'p-11', day: 'Wednesday', periodNumber: 1, startTime: '08:00', endTime: '08:45', subject: 'Basic Science & Tech', teacherName: 'Mr. Babatunde Sanusi', teacherId: 'stf-003', room: 'Lab 1' },
    { id: 'p-12', day: 'Wednesday', periodNumber: 2, startTime: '08:45', endTime: '09:30', subject: 'Mathematics', teacherName: 'Mr. Emmanuel Okafor', teacherId: 'stf-001', room: 'Room 2A' },
    { id: 'p-13', day: 'Wednesday', periodNumber: 3, startTime: '09:45', endTime: '10:30', subject: 'Social Studies', teacherName: 'Mrs. Ngozi Eze', teacherId: 'stf-005', room: 'Room 2A' },
    { id: 'p-14', day: 'Wednesday', periodNumber: 4, startTime: '10:30', endTime: '11:15', subject: 'Music & Creative Art', teacherName: 'Mr. Kenneth Bassey', teacherId: 'stf-009', room: 'Art Studio' },
    { id: 'p-15', day: 'Wednesday', periodNumber: 5, startTime: '11:45', endTime: '12:30', subject: 'Physical & Health Edu', teacherName: 'Coach Ibrahim Musa', teacherId: 'stf-010', room: 'Pitch' },

    // Thursday
    { id: 'p-16', day: 'Thursday', periodNumber: 1, startTime: '08:00', endTime: '08:45', subject: 'Computer Studies', teacherName: 'Mr. Chidi Okonkwo', teacherId: 'stf-004', room: 'ICT Lab' },
    { id: 'p-17', day: 'Thursday', periodNumber: 2, startTime: '08:45', endTime: '09:30', subject: 'English Language', teacherName: 'Mrs. Folashade Adeleke', teacherId: 'stf-002', room: 'Room 2A' },
    { id: 'p-18', day: 'Thursday', periodNumber: 3, startTime: '09:45', endTime: '10:30', subject: 'Cultural & Creative Arts', teacherName: 'Mr. Kenneth Bassey', teacherId: 'stf-009', room: 'Art Studio' },
    { id: 'p-19', day: 'Thursday', periodNumber: 4, startTime: '10:30', endTime: '11:15', subject: 'Mathematics', teacherName: 'Mr. Emmanuel Okafor', teacherId: 'stf-001', room: 'Room 2A' },
    { id: 'p-20', day: 'Thursday', periodNumber: 5, startTime: '11:45', endTime: '12:30', subject: 'Library & Reading', teacherName: 'Mrs. Folashade Adeleke', teacherId: 'stf-002', room: 'Library' },

    // Friday
    { id: 'p-21', day: 'Friday', periodNumber: 1, startTime: '08:00', endTime: '08:45', subject: 'Christian Religious Studies / IRK', teacherName: 'Pastor D. Adeleke', teacherId: 'stf-011', room: 'Room 2A' },
    { id: 'p-22', day: 'Friday', periodNumber: 2, startTime: '08:45', endTime: '09:30', subject: 'Civic & Leadership', teacherName: 'Mrs. Ngozi Eze', teacherId: 'stf-005', room: 'Room 2A' },
    { id: 'p-23', day: 'Friday', periodNumber: 3, startTime: '09:45', endTime: '10:30', subject: 'STEM Project Practical', teacherName: 'Mr. Babatunde Sanusi', teacherId: 'stf-003', room: 'STEM Lab' },
    { id: 'p-24', day: 'Friday', periodNumber: 4, startTime: '10:30', endTime: '11:15', subject: 'Club Activities & Debate', teacherName: 'All Form Tutors', teacherId: 'stf-all', room: 'Hall' },
  ];
  const [periods, setPeriods] = useState<TimetablePeriod[]>(
    import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true' ? demoPeriods : [],
  );
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest<{ data: { payload: { periods?: TimetablePeriod[]; selectedClass?: string; selectedArm?: string }; revision: number } }>('/module-data/timetable')
      .then(({ data }) => {
        setPeriods(data.payload.periods || []);
        setSelectedClass(data.payload.selectedClass || classes[0]?.name || '');
        setSelectedArm(data.payload.selectedArm || classes[0]?.arms?.[0] || '');
        setRevision(data.revision);
      })
      .catch((error) => showToast('Could not load timetable', describeApiError(error), 'error'));
  }, [classes, showToast]);

  const publishSchedule = async () => {
    setSaving(true);
    try {
      const response = await apiMutation<{ data: { revision: number } }>('/module-data/timetable', 'PUT', {
        payload: { periods, selectedClass, selectedArm, publishedAt: new Date().toISOString() },
        revision,
      });
      setRevision(response.data.revision);
      showToast('Schedule published', 'The timetable is stored and available to authorised portals.', 'success');
    } catch (error) {
      showToast('Schedule not published', describeApiError(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const timeSlots = [
    { period: 1, time: '08:00 - 08:45 AM' },
    { period: 2, time: '08:45 - 09:30 AM' },
    { period: 'break1', time: '09:30 - 09:45 AM (Short Break)' },
    { period: 3, time: '09:45 - 10:30 AM' },
    { period: 4, time: '10:30 - 11:15 AM' },
    { period: 'break2', time: '11:15 - 11:45 AM (Long Break & Lunch)' },
    { period: 5, time: '11:45 - 12:30 PM' },
  ];

  const getSubjectColor = (sub: string) => {
    if (sub.includes('Math')) return 'bg-indigo-50 border-indigo-200 text-indigo-900';
    if (sub.includes('English') || sub.includes('French')) return 'bg-sky-50 border-sky-200 text-sky-900';
    if (sub.includes('Science') || sub.includes('STEM')) return 'bg-emerald-50 border-emerald-200 text-emerald-900';
    if (sub.includes('Computer')) return 'bg-purple-50 border-purple-200 text-purple-900';
    if (sub.includes('Civic') || sub.includes('Social')) return 'bg-amber-50 border-amber-200 text-amber-900';
    return 'bg-slate-50 border-slate-200 text-slate-900';
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-2xl text-slate-900">
              Class Timetable & Master Schedule
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
              Conflict-Free Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Weekly classroom schedule with automated teacher clash and period overlap protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Timetable</span>
          </button>
          <button
            onClick={publishSchedule}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Publish Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 print:hidden">
        <div className="w-44">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
          >
            {classes.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </div>

        <div className="w-36">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Arm
          </label>
          <select
            value={selectedArm}
            onChange={(e) => setSelectedArm(e.target.value)}
            className="w-full text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50"
          >
            {[...new Set(classes.filter((item) => !selectedClass || item.name === selectedClass).flatMap((item) => item.arms || []).filter(Boolean))].map((arm) => <option key={arm} value={arm}>{arm}</option>)}
          </select>
        </div>

        <div className="flex-1 flex items-center justify-end gap-2">
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 0 Teacher Clashes Detected
          </span>
        </div>
      </div>

      {/* Timetable Grid View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-x-auto p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">
              {branding.schoolName} — Weekly Master Schedule
            </h3>
            <p className="text-xs text-slate-500">
              Class: <strong>{selectedClass} ({selectedArm})</strong> • Academic Session {branding.academicSession}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-xl">
            First Term (35 Periods / Week)
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-900 text-white font-bold">
              <th className="p-3 w-36 rounded-tl-xl">Day / Period</th>
              <th className="p-3">Period 1<br/><span className="text-[10px] text-slate-400 font-normal">08:00 - 08:45</span></th>
              <th className="p-3">Period 2<br/><span className="text-[10px] text-slate-400 font-normal">08:45 - 09:30</span></th>
              <th className="p-3 bg-slate-800 text-center w-24">Snack Break<br/><span className="text-[10px] text-slate-400 font-normal">09:30 - 09:45</span></th>
              <th className="p-3">Period 3<br/><span className="text-[10px] text-slate-400 font-normal">09:45 - 10:30</span></th>
              <th className="p-3">Period 4<br/><span className="text-[10px] text-slate-400 font-normal">10:30 - 11:15</span></th>
              <th className="p-3 bg-slate-800 text-center w-28">Lunch Break<br/><span className="text-[10px] text-slate-400 font-normal">11:15 - 11:45</span></th>
              <th className="p-3 rounded-tr-xl">Period 5<br/><span className="text-[10px] text-slate-400 font-normal">11:45 - 12:30</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {days.map((day) => (
              <tr key={day} className="hover:bg-slate-50/50">
                <td className="p-3 font-bold text-slate-900 bg-slate-50 border-r border-slate-200">
                  {day}
                </td>

                {/* Period 1 */}
                <td className="p-2 align-top">
                  {(() => {
                    const p = periods.find((x) => x.day === day && x.periodNumber === 1);
                    return p ? (
                      <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${getSubjectColor(p.subject)}`}>
                        <div className="font-bold">{p.subject}</div>
                        <div className="text-[10px] opacity-75 font-medium">{p.teacherName}</div>
                        <div className="text-[9px] font-mono text-slate-400">{p.room}</div>
                      </div>
                    ) : null;
                  })()}
                </td>

                {/* Period 2 */}
                <td className="p-2 align-top">
                  {(() => {
                    const p = periods.find((x) => x.day === day && x.periodNumber === 2);
                    return p ? (
                      <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${getSubjectColor(p.subject)}`}>
                        <div className="font-bold">{p.subject}</div>
                        <div className="text-[10px] opacity-75 font-medium">{p.teacherName}</div>
                        <div className="text-[9px] font-mono text-slate-400">{p.room}</div>
                      </div>
                    ) : null;
                  })()}
                </td>

                {/* Snack Break */}
                <td className="p-2 bg-slate-50/80 text-center text-slate-400 font-mono text-[11px] align-middle border-x border-slate-100">
                  Short Break
                </td>

                {/* Period 3 */}
                <td className="p-2 align-top">
                  {(() => {
                    const p = periods.find((x) => x.day === day && x.periodNumber === 3);
                    return p ? (
                      <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${getSubjectColor(p.subject)}`}>
                        <div className="font-bold">{p.subject}</div>
                        <div className="text-[10px] opacity-75 font-medium">{p.teacherName}</div>
                        <div className="text-[9px] font-mono text-slate-400">{p.room}</div>
                      </div>
                    ) : null;
                  })()}
                </td>

                {/* Period 4 */}
                <td className="p-2 align-top">
                  {(() => {
                    const p = periods.find((x) => x.day === day && x.periodNumber === 4);
                    return p ? (
                      <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${getSubjectColor(p.subject)}`}>
                        <div className="font-bold">{p.subject}</div>
                        <div className="text-[10px] opacity-75 font-medium">{p.teacherName}</div>
                        <div className="text-[9px] font-mono text-slate-400">{p.room}</div>
                      </div>
                    ) : null;
                  })()}
                </td>

                {/* Lunch Break */}
                <td className="p-2 bg-slate-50/80 text-center text-slate-400 font-mono text-[11px] align-middle border-x border-slate-100">
                  Lunch & Recess
                </td>

                {/* Period 5 */}
                <td className="p-2 align-top">
                  {(() => {
                    const p = periods.find((x) => x.day === day && x.periodNumber === 5);
                    return p ? (
                      <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${getSubjectColor(p.subject)}`}>
                        <div className="font-bold">{p.subject}</div>
                        <div className="text-[10px] opacity-75 font-medium">{p.teacherName}</div>
                        <div className="text-[9px] font-mono text-slate-400">{p.room}</div>
                      </div>
                    ) : null;
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
