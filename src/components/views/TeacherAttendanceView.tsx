import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Filter,
  Save,
  Send,
  Building,
  Phone,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  UserCheck,
  UserX,
  Printer,
  Sparkles,
  TrendingUp,
  ShieldAlert
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
  Line
} from 'recharts';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
import { useAuth } from '@/features/auth/AuthProvider';

interface TeacherAttendanceViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentAttendanceRecord {
  id: string;
  admNo: string;
  name: string;
  gender: 'M' | 'F';
  photo: string;
  parentName: string;
  parentPhone: string;
  status: AttendanceStatus;
  arrivalTime?: string;
  absenceReason?: string;
  consecutiveAbsences: number;
  termAttendanceRate: number; // percentage
  history: ('P' | 'A' | 'L' | 'E')[]; // last 5 days: Mon, Tue, Wed, Thu, Fri
}

const INITIAL_STUDENTS_ATTENDANCE: StudentAttendanceRecord[] = [
  {
    id: 'att_1',
    admNo: 'RGA26/1001',
    name: 'Aarav Johnson',
    gender: 'M',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    parentName: 'Mr. & Mrs. Johnson',
    parentPhone: '+234 803 123 4567',
    status: 'present',
    consecutiveAbsences: 0,
    termAttendanceRate: 98,
    history: ['P', 'P', 'P', 'P', 'P']
  },
  {
    id: 'att_2',
    admNo: 'RGA26/1002',
    name: 'Amina Bello',
    gender: 'F',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    parentName: 'Alhaji Bello',
    parentPhone: '+234 802 234 5678',
    status: 'present',
    consecutiveAbsences: 0,
    termAttendanceRate: 100,
    history: ['P', 'P', 'P', 'P', 'P']
  },
  {
    id: 'att_3',
    admNo: 'RGA26/1003',
    name: 'Chukwudi Okafor',
    gender: 'M',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    parentName: 'Chief Okafor',
    parentPhone: '+234 805 345 6789',
    status: 'late',
    arrivalTime: '08:18 AM',
    consecutiveAbsences: 0,
    termAttendanceRate: 92,
    history: ['P', 'L', 'P', 'P', 'L']
  },
  {
    id: 'att_4',
    admNo: 'RGA26/1004',
    name: 'Damilola Adeleke',
    gender: 'F',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    parentName: 'Mrs. Adeleke',
    parentPhone: '+234 807 456 7890',
    status: 'present',
    consecutiveAbsences: 0,
    termAttendanceRate: 96,
    history: ['P', 'P', 'P', 'P', 'P']
  },
  {
    id: 'att_5',
    admNo: 'RGA26/1005',
    name: 'Emmanuel Eze',
    gender: 'M',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    parentName: 'Pastor Eze',
    parentPhone: '+234 809 567 8901',
    status: 'absent',
    absenceReason: 'Reported ill (Malaria treatment)',
    consecutiveAbsences: 2,
    termAttendanceRate: 84,
    history: ['P', 'P', 'P', 'A', 'A']
  },
  {
    id: 'att_6',
    admNo: 'RGA26/1006',
    name: 'Fatima Abubakar',
    gender: 'F',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    parentName: 'Dr. Abubakar',
    parentPhone: '+234 803 678 9012',
    status: 'present',
    consecutiveAbsences: 0,
    termAttendanceRate: 98,
    history: ['P', 'P', 'P', 'P', 'P']
  },
  {
    id: 'att_7',
    admNo: 'RGA26/1007',
    name: 'Gabriel Okon',
    gender: 'M',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    parentName: 'Engr. Okon',
    parentPhone: '+234 802 789 0123',
    status: 'present',
    consecutiveAbsences: 0,
    termAttendanceRate: 94,
    history: ['P', 'P', 'P', 'P', 'P']
  },
  {
    id: 'att_8',
    admNo: 'RGA26/1008',
    name: 'Hauwa Ibrahim',
    gender: 'F',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    parentName: 'Hajia Ibrahim',
    parentPhone: '+234 805 890 1234',
    status: 'present',
    consecutiveAbsences: 0,
    termAttendanceRate: 100,
    history: ['P', 'P', 'P', 'P', 'P']
  },
  {
    id: 'att_9',
    admNo: 'RGA26/1009',
    name: 'Ifeanyi Nnamdi',
    gender: 'M',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    parentName: 'Barrister Nnamdi',
    parentPhone: '+234 807 901 2345',
    status: 'absent',
    absenceReason: 'Unexplained absence',
    consecutiveAbsences: 3,
    termAttendanceRate: 78,
    history: ['P', 'P', 'A', 'A', 'A']
  },
  {
    id: 'att_10',
    admNo: 'RGA26/1010',
    name: 'Joy Danjuma',
    gender: 'F',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    parentName: 'Mrs. Danjuma',
    parentPhone: '+234 809 012 3456',
    status: 'late',
    arrivalTime: '08:24 AM',
    consecutiveAbsences: 0,
    termAttendanceRate: 90,
    history: ['P', 'P', 'L', 'P', 'L']
  }
];

const WEEKLY_ATTENDANCE_TREND = [
  { day: 'Mon (10/14)', present: 97, late: 2, absent: 1 },
  { day: 'Tue (10/15)', present: 95, late: 3, absent: 2 },
  { day: 'Wed (10/16)', present: 92, late: 4, absent: 4 },
  { day: 'Thu (10/17)', present: 90, late: 5, absent: 5 },
  { day: 'Fri (Today)', present: 92, late: 4, absent: 4 }
];

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'register' | 'history' | 'watchlist'>('register');
  const [selectedClass, setSelectedClass] = useState('JSS 2A');
  const [selectedPeriod, setSelectedPeriod] = useState('Morning Roll Call');
  const [selectedDate, setSelectedDate] = useState('2026-10-18');
  const [notifyParentsChecked, setNotifyParentsChecked] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  
  const [students, setStudents] = useState<StudentAttendanceRecord[]>(INITIAL_STUDENTS_ATTENDANCE);

  // Status counters
  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const lateCount = students.filter((s) => s.status === 'late').length;
  const excusedCount = students.filter((s) => s.status === 'excused').length;
  const totalCount = students.length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  // Single student status toggle
  const handleStatusChange = (id: string, newStatus: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: newStatus,
            arrivalTime: newStatus === 'late' ? s.arrivalTime || '08:15 AM' : undefined,
            absenceReason: newStatus === 'absent' ? s.absenceReason || 'Unexplained' : undefined
          };
        }
        return s;
      })
    );
  };

  // Mass actions
  const handleMarkAll = (status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status,
        arrivalTime: status === 'late' ? '08:15 AM' : undefined
      }))
    );
    feedbackBus.success(`All ${students.length} students marked as ${status.toUpperCase()}`);
  };

  const handleSaveRegister = () => {
    const absentAndLate = students.filter((s) => s.status === 'absent' || s.status === 'late');
    let message = `Daily Attendance Register for ${selectedClass} saved successfully!`;
    if (notifyParentsChecked && absentAndLate.length > 0) {
      message += ` Instant SMS alerts dispatched to ${absentAndLate.length} parents.`;
    }
    feedbackBus.success(message);
  };

  // Filtered student list
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.admNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Class attendance registers will appear here once your school has set up classes and assigned you as a form teacher.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No classes assigned yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Your school admin needs to assign you as a form teacher or subject teacher to a class before you can take attendance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Header & Selectors */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] uppercase tracking-wide">
              Attendance & Roll Call
            </span>
            <span className="text-xs text-slate-400 font-medium">Class: {selectedClass} • Session: 2026/2027</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Daily Student Attendance Register
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record period roll call, track chronic absenteeism, view historical attendance matrices, and dispatch automated parent SMS alerts.
          </p>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <span className="text-slate-400 mr-1.5 font-medium">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="font-bold text-indigo-600 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="JSS 2A">JSS 2A (Form Class)</option>
              <option value="JSS 2B">JSS 2B</option>
              <option value="SSS 1 Diamond">SSS 1 Diamond</option>
              <option value="SSS 2 Gold">SSS 2 Gold</option>
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <span className="text-slate-400 mr-1.5 font-medium">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="Morning Roll Call">Morning Assembly / Form Call</option>
              <option value="Period 1: Mathematics">Period 1: Mathematics (08:30 AM)</option>
              <option value="Period 4: Mathematics">Period 4: Mathematics (11:15 AM)</option>
              <option value="Afternoon Roll Call">Afternoon Closing Roll Call</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          {/* Save Register Button */}
          <button
            id="btn-save-attendance-register"
            onClick={handleSaveRegister}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Register</span>
          </button>
        </div>
      </div>

      {/* 4 Attendance Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Present */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Students Present</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">{presentCount}</p>
              <span className="text-xs text-slate-500 font-medium">/ {totalCount} students</span>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {Math.round((presentCount / totalCount) * 100)}% attendance today
            </p>
          </div>
        </div>

        {/* Card 2: Absent */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Absentees</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-rose-600 tracking-tight">{absentCount}</p>
              <span className="text-xs text-slate-500 font-medium">Students</span>
            </div>
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
              1 with medical excuse • 1 unexcused
            </p>
          </div>
        </div>

        {/* Card 3: Late */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Late Arrivals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-amber-600 tracking-tight">{lateCount}</p>
              <span className="text-xs text-slate-500 font-medium">Students</span>
            </div>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">
              Arrived after 08:15 AM
            </p>
          </div>
        </div>

        {/* Card 4: Term Overall Average */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Class Term Rate</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">95.4%</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Consistent high tier punctuality
            </p>
          </div>
        </div>

      </div>

      {/* Sub-Tab Navigation & Mass Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            id="tab-sub-attendance-register"
            onClick={() => setActiveSubTab('register')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'register'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Daily Roll Call Register</span>
          </button>

          <button
            id="tab-sub-attendance-history"
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Weekly / Term Ledger Matrix</span>
          </button>

          <button
            id="tab-sub-attendance-watchlist"
            onClick={() => setActiveSubTab('watchlist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'watchlist'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Chronic Absence Watchlist</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white">
              2
            </span>
          </button>
        </div>

        {/* Mass Roll Call Actions */}
        {activeSubTab === 'register' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleMarkAll('present')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer"
            >
              ✓ Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('absent')}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
            >
              ✕ Mark All Absent
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyParentsChecked}
                onChange={(e) => setNotifyParentsChecked(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>Send SMS alerts to parents</span>
            </label>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: DAILY ROLL CALL REGISTER */}
      {activeSubTab === 'register' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          
          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student by name or Adm No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-slate-400 mr-1">Filter:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter('present')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  statusFilter === 'present' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                onClick={() => setStatusFilter('absent')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  statusFilter === 'absent' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Absent ({absentCount})
              </button>
              <button
                onClick={() => setStatusFilter('late')}
                className={`px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  statusFilter === 'late' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Late ({lateCount})
              </button>
            </div>
          </div>

          {/* Student Register Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Student Details</th>
                  <th className="py-3 px-3 text-center">Status Action</th>
                  <th className="py-3 px-3">Notes & Reason</th>
                  <th className="py-3 px-3 text-center">Last 5 Days</th>
                  <th className="py-3 px-3 text-center">Term Rate</th>
                  <th className="py-3 px-3 text-right">Parent Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                    
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={student.photo}
                          alt={student.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-[10px] text-slate-400">{student.admNo} • {student.gender === 'M' ? 'Male' : 'Female'}</p>
                        </div>
                        {student.consecutiveAbsences >= 2 && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-extrabold text-[9.5px] border border-rose-200 animate-pulse">
                            ⚠️ {student.consecutiveAbsences} days absent
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quick 4-button Status Selector */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1">
                        <button
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            student.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          P
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'late')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            student.status === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700'
                          }`}
                        >
                          L
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            student.status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          A
                        </button>
                        <button
                          onClick={() => handleStatusChange(student.id, 'excused')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            student.status === 'excused'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-blue-700'
                          }`}
                        >
                          E
                        </button>
                      </div>
                    </td>

                    {/* Notes / Reason */}
                    <td className="py-3 px-3">
                      {student.status === 'late' ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-700">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Arrived at: <strong>{student.arrivalTime}</strong></span>
                        </div>
                      ) : student.status === 'absent' ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-700">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span>{student.absenceReason || 'Unexplained absence'}</span>
                        </div>
                      ) : student.status === 'excused' ? (
                        <span className="text-[11px] text-blue-700 font-semibold">Authorized Leave</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">On time</span>
                      )}
                    </td>

                    {/* Last 5 days dots */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {student.history.map((h, hIdx) => (
                          <span
                            key={hIdx}
                            className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${
                              h === 'P' ? 'bg-emerald-500' : h === 'L' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            title={`Day ${hIdx + 1}: ${h}`}
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Term Attendance Rate */}
                    <td className="py-3 px-3 text-center">
                      <span className={`font-extrabold ${
                        student.termAttendanceRate >= 95 ? 'text-emerald-600' : student.termAttendanceRate >= 85 ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {student.termAttendanceRate}%
                      </span>
                    </td>

                    {/* Parent Contact Quick Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            feedbackBus.info(`Initiated direct SMS message to ${student.parentName} (${student.parentPhone})`);
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg border border-slate-200 transition-colors"
                          title={`Message ${student.parentName}`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`tel:${student.parentPhone}`}
                          className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg border border-slate-200 transition-colors"
                          title={`Call ${student.parentPhone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Class Form Tutor: <strong>Mr. Adewale</strong> • Registered Roll Call time: <strong>08:15 AM</strong></span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                P = Present
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                L = Late
              </span>
              <span className="flex items-center gap-1 font-semibold text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                A = Absent
              </span>
              <span className="flex items-center gap-1 font-semibold text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                E = Excused
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: WEEKLY / TERM LEDGER MATRIX */}
      {activeSubTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Term Attendance Trend & Weekly Breakdown</h3>
              <p className="text-xs text-slate-500">Continuous presence trend across the past 5 school days</p>
            </div>

            <button
              onClick={() => {
                const headers = 'AdmNo,Name,Gender,TermRate,Monday,Tuesday,Wednesday,Thursday,Friday\n';
                const rows = students.map((s) => `"${s.admNo}","${s.name}","${s.gender}",${s.termAttendanceRate}%,"${s.history[0]}","${s.history[1]}","${s.history[2]}","${s.history[3]}","${s.history[4]}"`).join('\n');
                const blob = new Blob([headers + rows], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedClass}_Weekly_Attendance_Register.csv`;
                a.click();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Weekly Register (CSV)</span>
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_ATTENDANCE_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="present" name="Present %" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="late" name="Late %" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="absent" name="Absent %" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
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
                <h3 className="text-sm font-bold text-slate-900">At-Risk Students & Early Intervention Flags</h3>
                <p className="text-xs text-slate-500">Students with attendance &lt;85% or 2+ consecutive unexplained absences</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.filter((s) => s.termAttendanceRate < 90 || s.consecutiveAbsences >= 2).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-rose-100 bg-rose-50/40 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.photo}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-rose-200"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.admNo} • {selectedClass}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-xs">
                      {item.termAttendanceRate}% Term Rate
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-rose-100/80 text-xs space-y-1.5">
                  <p className="text-slate-700 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Trigger: {item.consecutiveAbsences} consecutive absences ({item.absenceReason || 'Unexplained'})</span>
                  </p>
                  <p className="text-slate-500">
                    Parent: <strong>{item.parentName}</strong> ({item.parentPhone})
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      feedbackBus.success(`SMS counseling notification dispatched to ${item.parentName}`);
                    }}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send Parent Notice</span>
                  </button>
                  <button
                    onClick={() => onOpenModal('report_card', { name: item.name, classArm: selectedClass })}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors"
                  >
                    Student File
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
