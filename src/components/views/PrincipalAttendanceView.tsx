import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Calendar,
  Building,
  Phone,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  UserX,
  Send,
  Check,
  X,
  Sliders,
  Activity,
  Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface PrincipalAttendanceViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface ClassAttendanceSummary {
  id: string;
  classArm: string;
  level: string;
  enrolment: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number; // percentage
  formTeacher: string;
  submissionTime: string;
  status: 'Submitted' | 'Pending';
}

const CLASS_ATTENDANCE_DATA: ClassAttendanceSummary[] = [
  {
    id: 'att_j1a',
    classArm: 'JSS 1A',
    level: 'Junior',
    enrolment: 52,
    present: 50,
    absent: 1,
    late: 1,
    excused: 0,
    rate: 98.1,
    formTeacher: 'Mrs. Eze',
    submissionTime: '08:05 AM',
    status: 'Submitted'
  },
  {
    id: 'att_j1b',
    classArm: 'JSS 1B',
    level: 'Junior',
    enrolment: 53,
    present: 49,
    absent: 2,
    late: 2,
    excused: 0,
    rate: 96.2,
    formTeacher: 'Mr. Gabriel Okon',
    submissionTime: '08:10 AM',
    status: 'Submitted'
  },
  {
    id: 'att_j2a',
    classArm: 'JSS 2A',
    level: 'Junior',
    enrolment: 51,
    present: 48,
    absent: 2,
    late: 1,
    excused: 0,
    rate: 96.1,
    formTeacher: 'Mr. Adewale',
    submissionTime: '08:02 AM',
    status: 'Submitted'
  },
  {
    id: 'att_j2b',
    classArm: 'JSS 2B',
    level: 'Junior',
    enrolment: 51,
    present: 47,
    absent: 3,
    late: 1,
    excused: 0,
    rate: 94.1,
    formTeacher: 'Mrs. Bello',
    submissionTime: '08:14 AM',
    status: 'Submitted'
  },
  {
    id: 'att_j3a',
    classArm: 'JSS 3A',
    level: 'Junior',
    enrolment: 50,
    present: 49,
    absent: 0,
    late: 1,
    excused: 0,
    rate: 100.0,
    formTeacher: 'Dr. Okon',
    submissionTime: '07:58 AM',
    status: 'Submitted'
  },
  {
    id: 'att_s1_sci',
    classArm: 'SSS 1 Science',
    level: 'Senior',
    enrolment: 55,
    present: 52,
    absent: 2,
    late: 1,
    excused: 0,
    rate: 96.4,
    formTeacher: 'Mrs. Folashade',
    submissionTime: '08:08 AM',
    status: 'Submitted'
  },
  {
    id: 'att_s2_sci',
    classArm: 'SSS 2 Science',
    level: 'Senior',
    enrolment: 53,
    present: 50,
    absent: 1,
    late: 2,
    excused: 0,
    rate: 98.1,
    formTeacher: 'Engr. Ibrahim',
    submissionTime: '08:04 AM',
    status: 'Submitted'
  },
  {
    id: 'att_s3_all',
    classArm: 'SSS 3 WAEC Cohort',
    level: 'Senior',
    enrolment: 51,
    present: 50,
    absent: 0,
    late: 1,
    excused: 0,
    rate: 100.0,
    formTeacher: 'Mr. Adeleke',
    submissionTime: '07:55 AM',
    status: 'Submitted'
  }
];

const STAFF_CLOCKIN_DATA = [
  { id: 'st_1', name: 'Mr. Babatunde Adewale', role: 'Mathematics Teacher (HOD)', time: '07:18 AM', status: 'On Time', rfidTag: 'TAG-8821' },
  { id: 'st_2', name: 'Mrs. Chioma Eze', role: 'English Language Teacher', time: '07:22 AM', status: 'On Time', rfidTag: 'TAG-8822' },
  { id: 'st_3', name: 'Engr. Aliyu Ibrahim', role: 'Physics & Further Maths', time: '07:25 AM', status: 'On Time', rfidTag: 'TAG-8823' },
  { id: 'st_4', name: 'Dr. Gabriel Okon', role: 'Basic Science & Tech', time: '07:15 AM', status: 'On Time', rfidTag: 'TAG-8824' },
  { id: 'st_5', name: 'Mrs. Folashade Adeleke', role: 'Chemistry & Biology', time: '07:48 AM', status: 'Late Arrival', rfidTag: 'TAG-8825' },
  { id: 'st_6', name: 'Mr. Emmanuel Danjuma', role: 'Physical & Health Edu', time: '07:10 AM', status: 'On Time', rfidTag: 'TAG-8826' },
  { id: 'st_7', name: 'Mrs. Zainab Umar', role: 'French & Music', time: '—', status: 'Approved Sick Leave', rfidTag: 'TAG-8827' }
];

const AT_RISK_STUDENTS = [
  { id: 'ar_1', name: 'Ifeanyi Nnamdi', admNo: 'RGA26/1009', classArm: 'JSS 2A', consecutiveAbsences: 3, termRate: 78, parentName: 'Barrister Nnamdi', parentPhone: '+234 807 901 2345', status: 'Unexplained' },
  { id: 'ar_2', name: 'Emmanuel Eze', admNo: 'RGA26/1005', classArm: 'JSS 2A', consecutiveAbsences: 2, termRate: 84, parentName: 'Pastor Eze', parentPhone: '+234 809 567 8901', status: 'Medical (Malaria)' },
  { id: 'ar_3', name: 'Blessing Udoh', admNo: 'RGA26/1042', classArm: 'SSS 2 Gold', consecutiveAbsences: 3, termRate: 81, parentName: 'Chief Udoh', parentPhone: '+234 803 445 1122', status: 'Unexplained' },
  { id: 'ar_4', name: 'Farouk Usman', admNo: 'RGA26/1088', classArm: 'JSS 1C', consecutiveAbsences: 4, termRate: 74, parentName: 'Alhaji Usman', parentPhone: '+234 802 889 9900', status: 'Welfare Follow-up' }
];

const WEEKLY_TREND = [
  { day: 'Mon', students: 95.8, staff: 98.5 },
  { day: 'Tue', students: 94.2, staff: 97.4 },
  { day: 'Wed', students: 93.8, staff: 96.2 },
  { day: 'Thu', students: 94.9, staff: 98.7 },
  { day: 'Fri (Today)', students: 94.8, staff: 97.4 }
];

export const PrincipalAttendanceView: React.FC<PrincipalAttendanceViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'staff' | 'watchlist' | 'trends'>('classes');
  const [selectedDate, setSelectedDate] = useState('2026-10-18');

  const handleSendTruancyAlerts = () => {
    feedbackBus.success(`Automated Truancy SMS notifications dispatched to parents of ${AT_RISK_STUDENTS.length} flagged students.`);
  };

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Attendance Overview</h1>
          <p className="text-sm text-slate-500 mt-1">School-wide attendance data will appear once classes are set up and teachers begin taking daily registers.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No attendance records yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Teachers need to take attendance in their classes before summary data appears here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] uppercase tracking-wide">
              Attendance & Roll Call Command
            </span>
            <span className="text-xs text-slate-400 font-medium">Session: 2026/2027 • Date: {selectedDate}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            School-Wide Attendance & Biometric Punctuality
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time daily roll call returns across 24 class arms, staff biometric clock-in ledger, and automated parent truancy alerts.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleSendTruancyAlerts}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-200 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Truancy SMS Digest</span>
          </button>

          <button
            onClick={() => {
              const headers = 'ClassArm,Enrolment,Present,Absent,Late,Rate,FormTeacher,SubmissionTime\n';
              const rows = CLASS_ATTENDANCE_DATA.map((c) => `"${c.classArm}",${c.enrolment},${c.present},${c.absent},${c.late},${c.rate}%,"${c.formTeacher}","${c.submissionTime}"`).join('\n');
              const blob = new Blob([headers + rows], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Royal_Gateway_Attendance_${selectedDate}.csv`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Daily CSV</span>
          </button>
        </div>
      </div>

      {/* 6 Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: Today Student Attendance */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Student Attendance</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">94.8%</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              1,183 / 1,248 present
            </p>
          </div>
        </div>

        {/* Card 2: Staff Clock-In */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Staff Clock-In Rate</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">97.4%</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              76 / 78 on duty
            </p>
          </div>
        </div>

        {/* Card 3: Late Arrivals */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Late Arrivals</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">47</p>
            <p className="text-[10.5px] text-amber-600 font-semibold mt-0.5">
              Arrived after 07:45 AM
            </p>
          </div>
        </div>

        {/* Card 4: Absentees */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Unexplained Absentees</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-0.5">18</p>
            <p className="text-[10.5px] text-rose-600 font-semibold mt-0.5">
              Parents contacted via SMS
            </p>
          </div>
        </div>

        {/* Card 5: Chronic Watchlist */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Chronic Absenteeism</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-0.5">14</p>
            <p className="text-[10.5px] text-purple-600 font-semibold mt-0.5">
              Attendance &lt;80% this term
            </p>
          </div>
        </div>

        {/* Card 6: Roll Call Returns */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Roll Call Returns</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">24 / 24</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              100% submitted by 08:15 AM
            </p>
          </div>
        </div>

      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center gap-2">
        <button
          id="tab-principal-attendance-classes"
          onClick={() => setActiveSubTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'classes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Class Roll Call Returns (24 Arms)</span>
        </button>

        <button
          id="tab-principal-attendance-staff"
          onClick={() => setActiveSubTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'staff'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Staff Biometric & RFID Clock-In</span>
        </button>

        <button
          id="tab-principal-attendance-watchlist"
          onClick={() => setActiveSubTab('watchlist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'watchlist'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Chronic Absenteeism Watchlist</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white">
            4 Critical
          </span>
        </button>

        <button
          id="tab-principal-attendance-trends"
          onClick={() => setActiveSubTab('trends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'trends'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Weekly Longitudinal Trends</span>
        </button>
      </div>

      {/* SUB-TAB 1: CLASS ROLL CALL RETURNS */}
      {activeSubTab === 'classes' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Class-by-Class Attendance Ledger</h3>
              <p className="text-xs text-slate-500">Live feed of morning roll calls submitted by assigned Form Tutors.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">Class Arm</th>
                  <th className="py-3 px-3 text-center">Enrolment</th>
                  <th className="py-3 px-3 text-center">Present</th>
                  <th className="py-3 px-3 text-center">Absent</th>
                  <th className="py-3 px-3 text-center">Late</th>
                  <th className="py-3 px-3 text-center">Attendance %</th>
                  <th className="py-3 px-3">Form Tutor</th>
                  <th className="py-3 px-3 text-center">Submitted At</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {CLASS_ATTENDANCE_DATA.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                      {cls.classArm}
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-slate-700">
                      {cls.enrolment}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      {cls.present}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-rose-600">
                      {cls.absent}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-amber-600">
                      {cls.late}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                        cls.rate >= 96 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {cls.rate}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-800">
                      {cls.formTeacher}
                    </td>

                    <td className="py-3 px-3 text-center text-slate-500">
                      {cls.submissionTime}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onNavigateTab('attendance')}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 text-xs"
                      >
                        Inspect Register
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STAFF BIOMETRIC & RFID CLOCK-IN */}
      {activeSubTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Faculty & Staff Biometric Clock-in Matrix</h3>
              <p className="text-xs text-slate-500">Automated gate RFID scanner timestamps • Morning resumption benchmark: 07:30 AM</p>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              ● Gate Scanner Active: 76 / 78 Checked In
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">Staff Member</th>
                  <th className="py-3 px-3">Designation / Department</th>
                  <th className="py-3 px-3">RFID Badge</th>
                  <th className="py-3 px-3 text-center">Clock-in Time</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {STAFF_CLOCKIN_DATA.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {st.name}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {st.role}
                    </td>

                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {st.rfidTag}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {st.time}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                        st.status === 'On Time'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st.status === 'Late Arrival'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {st.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          feedbackBus.success(`Sent official check-in message to ${st.name}`);
                        }}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg border border-slate-200"
                      >
                        Contact Staff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CHRONIC ABSENTEEISM WATCHLIST */}
      {activeSubTab === 'watchlist' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Chronic Truancy & Parent Welfare Case Files</h3>
                <p className="text-xs text-slate-500">Students with &ge;2 consecutive unexplained absences requiring Dean / Principal intervention</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AT_RISK_STUDENTS.map((st) => (
              <div
                key={st.id}
                className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                    <p className="text-xs text-slate-500">{st.admNo} • {st.classArm}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-xs">
                    {st.termRate}% Term Rate
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-rose-100 text-xs space-y-1">
                  <p className="text-slate-800 font-semibold">
                    Consecutive Absences: <span className="text-rose-600 font-bold">{st.consecutiveAbsences} Days</span> ({st.status})
                  </p>
                  <p className="text-slate-500">
                    Guardian: <strong>{st.parentName}</strong> ({st.parentPhone})
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      feedbackBus.success(`Formal Principal Truancy Summons dispatched to ${st.parentName}`);
                    }}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Principal Summons</span>
                  </button>
                  <button
                    onClick={() => onOpenModal('report_card', { name: st.name, classArm: st.classArm })}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors"
                  >
                    Student Dossier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: WEEKLY LONGITUDINAL TRENDS */}
      {activeSubTab === 'trends' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Weekly Attendance Compliance Curve</h3>
            <p className="text-xs text-slate-500">Comparative attendance stability across students vs faculty throughout the school week.</p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WEEKLY_TREND} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} domain={[85, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="students" name="Students %" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="staff" name="Faculty %" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
