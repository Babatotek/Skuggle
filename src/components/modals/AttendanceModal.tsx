import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_STUDENTS } from '../../data/mockData';
import { LoadingButton } from '../../shared/ui';
import { feedbackBus } from '../../shared/feedback/feedbackBus';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassArm?: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  initialClassArm = 'JSS 2A',
}) => {
  const [classArm, setClassArm] = useState(initialClassArm);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, 'present' | 'absent' | 'late'>>({
    stu_1: 'present',
    stu_2: 'present',
    stu_3: 'present',
    stu_4: 'absent',
    stu_5: 'present',
    stu_6: 'present',
    stu_7: 'late',
    stu_8: 'present',
    stu_9: 'present',
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleStatus = (id: string, newStatus: 'present' | 'absent' | 'late') => {
    setStatuses(prev => ({ ...prev, [id]: newStatus }));
  };

  const markAllPresent = () => {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    INITIAL_STUDENTS.forEach(s => { updated[s.id] = 'present'; });
    setStatuses(updated);
  };

  const handleSave = () => {
    setIsSaving(true);
    window.setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      feedbackBus.success(
        `Attendance for ${classArm} saved. SMS alerts queued for absent guardians.`,
      );
      setIsSaving(false);
      onClose();
    }, 700);
  };

  const presentCount = Object.values(statuses).filter(s => s === 'present').length;
  const absentCount = Object.values(statuses).filter(s => s === 'absent').length;
  const lateCount = Object.values(statuses).filter(s => s === 'late').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Roll Call & Class Attendance Register</h2>
              <p className="text-xs text-slate-500">Real-time attendance recording with parent SMS alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Users className="w-4 h-4 text-slate-400" />
              <select
                value={classArm}
                onChange={(e) => setClassArm(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                <option>JSS 2A</option>
                <option>JSS 3B</option>
                <option>JSS 1A</option>
                <option>SS 1C</option>
                <option>Grade 6A</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllPresent}
              className="px-3 py-1 bg-white border border-emerald-300 text-emerald-700 font-bold rounded-lg hover:bg-emerald-50"
            >
              Mark All Present
            </button>
          </div>
        </div>

        {/* Stat badges */}
        <div className="px-6 py-2 bg-slate-100/50 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Present: <strong className="text-emerald-600">{presentCount}</strong></span>
          <span>Absent: <strong className="text-rose-600">{absentCount}</strong></span>
          <span>Late: <strong className="text-amber-600">{lateCount}</strong></span>
          <span>Total: <strong className="text-slate-900">{INITIAL_STUDENTS.length}</strong></span>
        </div>

        {/* Students List */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100">
          {INITIAL_STUDENTS.map((student) => {
            const status = statuses[student.id] || 'present';
            return (
              <div key={student.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <p className="font-bold text-slate-900">{student.name}</p>
                    <p className="text-[11px] text-slate-400">{student.admissionNo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleStatus(student.id, 'present')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      status === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    Present
                  </button>

                  <button
                    onClick={() => toggleStatus(student.id, 'late')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      status === 'late'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    Late
                  </button>

                  <button
                    onClick={() => toggleStatus(student.id, 'absent')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      status === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Automated SMS will be dispatched to parents of absent students.
          </span>

          <LoadingButton
            onClick={handleSave}
            loading={isSaving}
            loadingText="Submitting Roll Call…"
            icon={<Save className="w-4 h-4" />}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200"
          >
            Submit Roll Call
          </LoadingButton>
        </div>

      </div>
    </div>
  );
};
