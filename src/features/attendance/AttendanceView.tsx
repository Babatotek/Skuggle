import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Save,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus, StudentRecord } from '../../types';
import { AttendanceTrendChart } from '../dashboard/AttendanceTrendChart';
import {
  Button,
  StatusBadge,
  MetricCard,
  Select,
  Input,
  SearchInput,
  DataTable,
  Column,
} from '../../components/ui';

interface AttendanceViewProps {
  initialTab?: 'roll-call' | 'trends' | 'summary';
  hideInternalNav?: boolean;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ initialTab = 'roll-call', hideInternalNav = false }) => {
  const { students, recordAttendance, isOnline, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'roll-call' | 'trends' | 'summary'>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const filteredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        s.classLevel === selectedClass &&
        (s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [students, selectedClass, searchQuery]);

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
    setAttendanceState((prev) => ({ ...prev, ...updated }));
    showToast('All Marked Present', `Marked ${filteredStudents.length} students as present for ${selectedClass}.`, 'success');
  };

  const handleSaveAttendance = () => {
    Object.entries(attendanceState).forEach(([studentId, data]: [string, { status: AttendanceStatus; reason?: string }]) => {
      recordAttendance(studentId, selectedDate, data.status, data.reason);
    });

    if (!isOnline) {
      showToast('Saved Offline', 'Attendance records queued locally. Will sync automatically when online.', 'info');
    } else {
      showToast('Attendance Recorded', `Class roll for ${selectedDate} synced successfully.`, 'success');
    }
  };

  const attendanceValues = Object.values(attendanceState) as { status: AttendanceStatus; reason?: string }[];
  const presentCount = attendanceValues.filter((v) => v.status === 'present').length;
  const absentCount = attendanceValues.filter((v) => v.status === 'absent').length;
  const lateCount = attendanceValues.filter((v) => v.status === 'late').length;

  const summaryColumns: Column<StudentRecord>[] = [
    {
      key: 'student',
      header: 'Student Name',
      sortable: true,
      sortValue: (row) => `${row.firstName} ${row.lastName}`,
      accessor: (st) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-100/80">
            {st.firstName[0]}
            {st.lastName[0]}
          </div>
          <span className="font-semibold text-slate-900">
            {st.firstName} {st.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'admissionNo',
      header: 'Admission No',
      sortable: true,
      accessor: (st) => (
        <span className="font-mono font-medium text-slate-700 text-xs px-2 py-0.5 rounded-md bg-slate-100">
          {st.admissionNo}
        </span>
      ),
    },
    {
      key: 'classLevel',
      header: 'Class & Arm',
      sortable: true,
      accessor: (st) => (
        <span className="font-medium text-slate-700">
          {st.classLevel} ({st.arm})
        </span>
      ),
    },
    {
      key: 'attendanceRate',
      header: 'Attendance Rate',
      sortable: true,
      accessor: (st) => {
        const rate = st.attendanceRate || 95;
        const isLow = rate < 75;
        return (
          <span className={`font-bold font-display ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
            {rate}%
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Standing',
      accessor: (st) => {
        const rate = st.attendanceRate || 95;
        const isLow = rate < 75;
        return (
          <StatusBadge
            status={isLow ? 'Intervention Flagged' : 'Good Standing'}
            variant={isLow ? 'danger' : 'success'}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full">
            NERDC 75% Benchmark
          </span>
          <span className="text-xs text-slate-500">Offline-capable roll call register</span>
        </div>

        {activeTab === 'roll-call' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
              Mark All Present
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-3.5 h-3.5" />}
              onClick={handleSaveAttendance}
            >
              Save Roll Record
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      {!hideInternalNav && (
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('roll-call')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'roll-call'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Roll Call Register</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'trends'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Daily Attendance Trends</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'summary'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Cohort Overview</span>
          </button>
        </div>
      )}

      {/* Tab 1: Daily Roll Call Register */}
      {activeTab === 'roll-call' && (
        <div className="space-y-6">
          {/* Roll Call KPI Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold block">Class & Arm</span>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="h-8.5 text-xs font-semibold"
                >
                  <option value="JSS 1">JSS 1</option>
                  <option value="JSS 2">JSS 2</option>
                  <option value="SSS 1">SSS 1</option>
                </Select>
                <Select
                  value={selectedArm}
                  onChange={(e) => setSelectedArm(e.target.value)}
                  className="h-8.5 text-xs font-semibold"
                >
                  <option value="A">Arm A</option>
                  <option value="B">Arm B</option>
                </Select>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs text-slate-500 font-semibold block">Roll Date</span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8.5 text-xs font-medium"
              />
            </div>

            <MetricCard
              label="Present Today"
              value={presentCount}
              icon={<CheckCircle2 className="w-5 h-5" />}
              variant="success"
              subtitle="Marked on roll"
            />

            <MetricCard
              label="Late / Absent"
              value={lateCount + absentCount}
              icon={<Clock className="w-5 h-5" />}
              variant={lateCount + absentCount > 0 ? 'warning' : 'default'}
              subtitle="Requires follow-up"
            />
          </div>

          {/* Student Roll Call Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
              <h3 className="font-display font-bold text-base text-slate-900">
                {selectedClass} ({selectedArm}) Roll Call Register ({filteredStudents.length} Students)
              </h3>

              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search student name or admission no..."
                className="w-full sm:w-64 h-9 text-xs"
              />
            </div>

            <div className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No students found in {selectedClass} ({selectedArm}).
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const currentStatus = attendanceState[student.id]?.status || 'present';
                  return (
                    <div
                      key={student.id}
                      className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-100/80 shrink-0">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            {student.firstName} {student.lastName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {student.admissionNo} · Term Attendance: {student.attendanceRate}%
                          </span>
                        </div>
                      </div>

                      {/* 1-Tap Toggle Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
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
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Trends */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <AttendanceTrendChart students={students} onNavigateAttendance={() => setActiveTab('roll-call')} />
        </div>
      )}

      {/* Tab 3: Cohort Overview */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="font-display font-bold text-base text-slate-900">
              Term Attendance Summary & NERDC Qualification Status
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Students with cumulative attendance below 75% are flagged for review before terminal report cards and exam admit slips are issued.
            </p>
          </div>

          <DataTable
            columns={summaryColumns}
            data={students}
            keyExtractor={(st) => st.id}
            pageSize={10}
            emptyTitle="No attendance records"
            emptyDescription="Student attendance records will appear here as roll calls are completed."
          />
        </div>
      )}
    </div>
  );
};
