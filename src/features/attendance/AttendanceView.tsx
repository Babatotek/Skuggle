import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  Search,
  Save,
  Sparkles,
  WifiOff,
  Wifi,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus } from '../../types';
import { AttendanceTrendChart } from '../dashboard/AttendanceTrendChart';

export const AttendanceView: React.FC = () => {
  const { students, recordAttendance, isOnline, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'roll-call' | 'trends' | 'summary'>('roll-call');
  const [selectedClass, setSelectedClass] = useState('JSS 2');
  const [selectedArm, setSelectedArm] = useState('A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const [attendanceState, setAttendanceState] = useState<Record<string, { status: AttendanceStatus; reason?: string }>>({
    'std-1': { status: 'present' },
    'std-2': { status: 'present' },
    'std-3': { status: 'late', reason: 'School bus traffic' },
    'std-4': { status: 'present' },
  });

  const filteredStudents = students.filter(
    (s) =>
      s.classLevel === selectedClass &&
      (s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; reason?: string }> = {};
    filteredStudents.forEach((s) => {
      updated[s.id] = { status: 'present' };
    });
    setAttendanceState(updated);
    showToast('All Marked Present', `Marked ${filteredStudents.length} students as present for ${selectedClass}.`);
  };

  const handleSaveAttendance = () => {
    Object.entries(attendanceState).forEach(([studentId, data]: [string, { status: AttendanceStatus; reason?: string }]) => {
      recordAttendance(studentId, selectedDate, data.status, data.reason);
    });

    if (!isOnline) {
      showToast('Saved Offline', 'Attendance records queued locally. Will sync automatically when online.');
    } else {
      showToast('Attendance Recorded', `Class roll for ${selectedDate} synced successfully.`);
    }
  };

  const attendanceValues = Object.values(attendanceState) as { status: AttendanceStatus; reason?: string }[];
  const presentCount = attendanceValues.filter((v) => v.status === 'present').length;
  const absentCount = attendanceValues.filter((v) => v.status === 'absent').length;
  const lateCount = attendanceValues.filter((v) => v.status === 'late').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              Attendance & Roll Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              NERDC 75% Benchmark
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Record morning roll calls with one-tap status toggles or analyze multi-day attendance trends. Works 100% offline.
          </p>
        </div>

        {activeTab === 'roll-call' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Mark All Present
            </button>
            <button
              onClick={handleSaveAttendance}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Roll Record</span>
            </button>
          </div>
        )}
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('roll-call')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'roll-call'
              ? 'bg-white text-indigo-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Daily Roll Call Register</span>
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'trends'
              ? 'bg-white text-emerald-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Daily Attendance Trends</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-md">
            Charts
          </span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          <span>Cohort Overview</span>
        </button>
      </div>

      {/* Tab 1: Daily Roll Call Register */}
      {activeTab === 'roll-call' && (
        <div className="space-y-6">
          {/* Filter & Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold block">Class & Arm</span>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <option value="JSS 1">JSS 1</option>
                    <option value="JSS 2">JSS 2</option>
                    <option value="SSS 1">SSS 1</option>
                  </select>
                  <select
                    value={selectedArm}
                    onChange={(e) => setSelectedArm(e.target.value)}
                    className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <option value="A">Arm A</option>
                    <option value="B">Arm B</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-bold block">Roll Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-xs font-semibold px-2 py-1 mt-1 rounded-lg border border-slate-200 bg-slate-50"
              />
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 font-bold block">Present Today</span>
                <span className="font-display font-extrabold text-xl text-emerald-950">{presentCount}</span>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-800 font-bold block">Late / Absent</span>
                <span className="font-display font-extrabold text-xl text-amber-950">{lateCount + absentCount}</span>
              </div>
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>

          {/* Student Attendance List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-display font-bold text-base text-slate-900">
                {selectedClass} ({selectedArm}) Student Roll Call ({filteredStudents.length} Students)
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const currentStatus = attendanceState[student.id]?.status || 'present';
                return (
                  <div
                    key={student.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-900 font-bold flex items-center justify-center text-xs">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {student.admissionNo} · Overall Attendance: {student.attendanceRate}%
                        </span>
                      </div>
                    </div>

                    {/* 1-Tap Toggle Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStatus(student.id, 'present')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Present</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(student.id, 'late')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          currentStatus === 'late'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Late</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(student.id, 'absent')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Absent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(student.id, 'excused')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          currentStatus === 'excused'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>Excused</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Daily Attendance Trends */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <AttendanceTrendChart
            students={students}
            onNavigateAttendance={() => setActiveTab('roll-call')}
          />
        </div>
      )}

      {/* Tab 3: Summary Overview */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-slate-900">
            Term Attendance Summary & NERDC Qualification Status
          </h3>
          <p className="text-xs text-slate-500">
            Students with attendance below 75% are flagged for review before terminal report cards and exam admit slips are issued.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Admission No</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Attendance Rate</th>
                  <th className="py-3 px-3">Days Present</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const rate = st.attendanceRate || 95;
                  const isLow = rate < 75;
                  return (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {st.firstName} {st.lastName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{st.admissionNo}</td>
                      <td className="py-3 px-3 text-slate-700 font-semibold">{st.classLevel}</td>
                      <td className="py-3 px-3 font-bold">
                        <span className={isLow ? 'text-rose-600' : 'text-emerald-700'}>
                          {rate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">—</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            isLow
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLow ? 'Intervention Flagged' : 'Good Standing'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
