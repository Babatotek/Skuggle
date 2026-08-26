import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  FileText,
  Upload,
  UserCheck,
  ShieldCheck,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  AlertTriangle,
  Bus,
  ArrowUpRight
} from 'lucide-react';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface ParentAttendanceViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface AttendanceDayLog {
  date: string;
  day: string;
  status: 'Present' | 'Late' | 'Excused' | 'Absent';
  gateInTime: string;
  rollCallTime: string;
  gateOutTime: string;
  busStatus: string;
  remark: string;
}

interface LeaveRequestItem {
  id: string;
  childName: string;
  startDate: string;
  endDate: string;
  reasonCategory: 'Medical / Sickness' | 'Family Emergency' | 'Travel / Relocation' | 'Religious Observation';
  details: string;
  status: 'Approved' | 'Under Review' | 'Declined';
  submittedOn: string;
  approvedBy?: string;
}

const ATTENDANCE_LOGS: Record<string, AttendanceDayLog[]> = {
  child_1: [
    {
      date: '22 Oct 2026',
      day: 'Thursday',
      status: 'Present',
      gateInTime: '07:38 AM',
      rollCallTime: '08:02 AM',
      gateOutTime: '03:45 PM',
      busStatus: 'Boarded Bus #4 (03:52 PM)',
      remark: 'Punctual • Active participation in morning assembly'
    },
    {
      date: '21 Oct 2026',
      day: 'Wednesday',
      status: 'Present',
      gateInTime: '07:44 AM',
      rollCallTime: '08:05 AM',
      gateOutTime: '03:40 PM',
      busStatus: 'Boarded Bus #4 (03:48 PM)',
      remark: 'Punctual'
    },
    {
      date: '20 Oct 2026',
      day: 'Tuesday',
      status: 'Late',
      gateInTime: '08:14 AM',
      rollCallTime: '08:20 AM',
      gateOutTime: '03:42 PM',
      busStatus: 'Boarded Bus #4 (03:50 PM)',
      remark: 'Traffic congestion on Lekki Express • Excused'
    },
    {
      date: '19 Oct 2026',
      day: 'Monday',
      status: 'Present',
      gateInTime: '07:30 AM',
      rollCallTime: '07:55 AM',
      gateOutTime: '04:15 PM',
      busStatus: 'Boarded Bus #4 (04:22 PM)',
      remark: 'Attended Science Club after school'
    },
    {
      date: '16 Oct 2026',
      day: 'Friday',
      status: 'Excused',
      gateInTime: '--',
      rollCallTime: '--',
      gateOutTime: '--',
      busStatus: 'Not Boarded',
      remark: 'Approved Medical Leave (Dental Appointment)'
    },
    {
      date: '15 Oct 2026',
      day: 'Thursday',
      status: 'Present',
      gateInTime: '07:40 AM',
      rollCallTime: '08:00 AM',
      gateOutTime: '03:35 PM',
      busStatus: 'Boarded Bus #4 (03:44 PM)',
      remark: 'Punctual'
    }
  ],
  child_2: [
    {
      date: '22 Oct 2026',
      day: 'Thursday',
      status: 'Present',
      gateInTime: '07:38 AM',
      rollCallTime: '08:00 AM',
      gateOutTime: '03:45 PM',
      busStatus: 'Boarded Bus #4 (03:52 PM)',
      remark: 'Punctual'
    },
    {
      date: '21 Oct 2026',
      day: 'Wednesday',
      status: 'Present',
      gateInTime: '07:44 AM',
      rollCallTime: '08:01 AM',
      gateOutTime: '03:40 PM',
      busStatus: 'Boarded Bus #4 (03:48 PM)',
      remark: 'Punctual'
    },
    {
      date: '20 Oct 2026',
      day: 'Tuesday',
      status: 'Present',
      gateInTime: '07:42 AM',
      rollCallTime: '08:00 AM',
      gateOutTime: '03:42 PM',
      busStatus: 'Boarded Bus #4 (03:50 PM)',
      remark: 'Punctual'
    }
  ],
  child_3: [
    {
      date: '22 Oct 2026',
      day: 'Thursday',
      status: 'Present',
      gateInTime: '07:38 AM',
      rollCallTime: '08:10 AM',
      gateOutTime: '01:30 PM',
      busStatus: 'Picked up by Mother',
      remark: 'Punctual Nursery Early Dismissal'
    },
    {
      date: '21 Oct 2026',
      day: 'Wednesday',
      status: 'Present',
      gateInTime: '07:44 AM',
      rollCallTime: '08:15 AM',
      gateOutTime: '01:30 PM',
      busStatus: 'Picked up by Mother',
      remark: 'Punctual'
    }
  ]
};

const INITIAL_LEAVE_REQUESTS: LeaveRequestItem[] = [
  {
    id: 'lr_1',
    childName: 'Nathan Bello',
    startDate: '16 Oct 2026',
    endDate: '16 Oct 2026',
    reasonCategory: 'Medical / Sickness',
    details: 'Scheduled Orthodontic and Dental adjustment at Evercare Lekki Clinic.',
    status: 'Approved',
    submittedOn: '14 Oct 2026',
    approvedBy: 'Vice Principal (Academics)'
  },
  {
    id: 'lr_2',
    childName: 'Chidera Bello',
    startDate: '05 Nov 2026',
    endDate: '06 Nov 2026',
    reasonCategory: 'Family Emergency',
    details: 'Attending family commemorative celebration in Abeokuta with parents.',
    status: 'Under Review',
    submittedOn: '21 Oct 2026'
  }
];

export const ParentAttendanceView: React.FC<ParentAttendanceViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Daily gate logs, term rates, and leave requests for your children will appear once the school starts taking attendance.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No attendance records yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Records will appear once teachers take daily attendance and the school links your children to your account.</p>
        </div>
      </div>
    );
  }
  const [selectedChildId, setSelectedChildId] = useState<string>('child_1');
  const [activeSubTab, setActiveSubTab] = useState<'log' | 'request_leave' | 'leave_history' | 'preferences'>('log');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Leave Form State
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveCategory, setLeaveCategory] = useState<'Medical / Sickness' | 'Family Emergency' | 'Travel / Relocation' | 'Religious Observation'>('Medical / Sickness');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>(INITIAL_LEAVE_REQUESTS);

  const children = [
    { id: 'child_1', name: 'Nathan Bello', classArm: 'JSS 2A', attendance: 96.4, daysPresent: 46, daysAbsent: 2, late: 1 },
    { id: 'child_2', name: 'Chidera Bello', classArm: 'Primary 4B', attendance: 98.2, daysPresent: 48, daysAbsent: 0, late: 1 },
    { id: 'child_3', name: 'Somto Bello', classArm: 'Nursery 2A', attendance: 95.0, daysPresent: 45, daysAbsent: 2, late: 0 }
  ];

  const currentChild = children.find(c => c.id === selectedChildId) || children[0];
  const currentLogs = ATTENDANCE_LOGS[selectedChildId] || ATTENDANCE_LOGS.child_1;

  const filteredLogs = currentLogs.filter(log => {
    if (filterStatus === 'all') return true;
    return log.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const handleCreateLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveReason) {
      feedbackBus.error('Please fill in all dates and the reason for the leave request.');
      return;
    }

    const newReq: LeaveRequestItem = {
      id: `lr_${Date.now()}`,
      childName: currentChild.name,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reasonCategory: leaveCategory,
      details: leaveReason,
      status: 'Under Review',
      submittedOn: 'Today, Just now'
    };

    setLeaveRequests([newReq, ...leaveRequests]);
    feedbackBus.success(`Official Absence Leave Request for ${currentChild.name} submitted to Vice Principal & Class Tutor!`);
    setLeaveStartDate('');
    setLeaveEndDate('');
    setLeaveReason('');
    setActiveSubTab('leave_history');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] uppercase tracking-wide">
              Attendance & Punctuality Command
            </span>
            <span className="text-xs text-slate-400 font-medium">RFID Turnstile & Class Register Live</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Ward Attendance & Roll Call Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track real-time gate turnstile scans, morning class roll calls, afternoon bus boardings, and submit medical leave notices.
          </p>
        </div>

        {/* Child Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {children.map((child) => {
            const isSelected = selectedChildId === child.id;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{child.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {child.classArm}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Executive Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Attendance Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Term Attendance Index</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{currentChild.attendance}%</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Minimum statutory requirement: 85.0%
            </p>
          </div>
        </div>

        {/* Card 2: Days Present */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Days Present</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{currentChild.daysPresent} Days</p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
              Out of 48 total school days this term
            </p>
          </div>
        </div>

        {/* Card 3: Late Arrivals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Late Check-ins</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{currentChild.late}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Average arrival time: 07:41 AM
            </p>
          </div>
        </div>

        {/* Card 4: Unexcused Absences */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Excused Leaves / Absences</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{currentChild.daysAbsent} Days</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              100% covered by approved medical notice
            </p>
          </div>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveSubTab('log')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'log'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Daily Roll Call & Gate Scans</span>
        </button>

        <button
          onClick={() => setActiveSubTab('request_leave')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'request_leave'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Submit Absence Excuse / Leave</span>
        </button>

        <button
          onClick={() => setActiveSubTab('leave_history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'leave_history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Leave Request History ({leaveRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'preferences'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>SMS & Push Notification Alerts</span>
        </button>
      </div>

      {/* SUB-TAB 1: DAILY ROLL CALL LEDGER */}
      {activeSubTab === 'log' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Turnstile Gate Scan & Classroom Register for {currentChild.name}
              </h3>
              <p className="text-xs text-slate-500">Live RFID badge timestamps logged at the Main Gate Security Command.</p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Filter:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Days</option>
                <option value="present">Present Only</option>
                <option value="late">Late Check-ins</option>
                <option value="excused">Excused Leaves</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">Date & Day</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Gate In (RFID)</th>
                  <th className="py-3 px-3">Form Tutor Roll Call</th>
                  <th className="py-3 px-3">Dismissal Gate Out</th>
                  <th className="py-3 px-3">Bus Boarding Scan</th>
                  <th className="py-3 px-3">Notes & Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>{log.date}</div>
                      <div className="text-[10.5px] text-slate-400 font-normal">{log.day}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                        log.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'Late'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                      {log.gateInTime}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      {log.rollCallTime}
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      {log.gateOutTime}
                    </td>

                    <td className="py-3 px-3 text-indigo-700 font-semibold">
                      {log.busStatus}
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {log.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SUBMIT LEAVE REQUEST */}
      {activeSubTab === 'request_leave' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 max-w-3xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Submit Absence Excuse / Official Leave of Absence</h3>
            <p className="text-xs text-slate-500">Notifies the Principal, Vice Principal, Form Tutor, and Clinic Staff in advance.</p>
          </div>

          <form onSubmit={handleCreateLeaveRequest} className="space-y-4">
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 font-medium">
              Filing leave for: <strong className="font-bold text-indigo-950">{currentChild.name} ({currentChild.classArm})</strong>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Date of Absence</label>
                <input
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Resumption Date</label>
                <input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Absence Reason Category</label>
              <select
                value={leaveCategory}
                onChange={(e) => setLeaveCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Medical / Sickness">Medical / Sickness (Hospital, Dental, Clinic)</option>
                <option value="Family Emergency">Family Emergency / Bereavement</option>
                <option value="Travel / Relocation">Travel / Visa Appointment / Relocation</option>
                <option value="Religious Observation">Religious Observation / Pilgrimage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Explanation / Notes for School Administration</label>
              <textarea
                rows={3}
                placeholder="Provide details regarding the reason for absence..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-center">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <p className="text-xs font-bold text-slate-700">Attach Medical Doctor's Note / Supporting Document (Optional)</p>
              <p className="text-[10.5px] text-slate-400 mt-0.5">PDF, PNG, or JPG up to 5MB</p>
              <button
                type="button"
                onClick={() => {
                  feedbackBus.success('Doctor note attached from files.');
                }}
                className="mt-2 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Browse Files
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveSubTab('log')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Official Excuse Request</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: LEAVE HISTORY */}
      {activeSubTab === 'leave_history' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Submitted Leave Requests & Academic Approvals</h3>
              <p className="text-xs text-slate-500">Review status of submitted absence notices.</p>
            </div>
            <button
              onClick={() => setActiveSubTab('request_leave')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              + New Leave Request
            </button>
          </div>

          <div className="space-y-3">
            {leaveRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{req.childName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold text-[10.5px]">
                      {req.reasonCategory}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10.5px] ${
                    req.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : req.status === 'Under Review'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <p className="text-slate-700">{req.details}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <span>Period: <strong className="text-slate-800">{req.startDate}</strong> to <strong className="text-slate-800">{req.endDate}</strong></span>
                  <span>Submitted: {req.submittedOn} {req.approvedBy ? `• Approved by ${req.approvedBy}` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: PREFERENCES & SMS ALERTS */}
      {activeSubTab === 'preferences' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 max-w-3xl mx-auto space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Attendance Push Notifications & Instant SMS Alerts</h3>
            <p className="text-xs text-slate-500">Configure arrival and departure alerts dispatched to your registered mobile line (+234 803 112 3344).</p>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Morning Gate Turnstile RFID Check-in SMS</p>
                <p className="text-slate-500 text-[11px]">Receive instantaneous text message when student scans badge at school main gate.</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-0 w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Afternoon Bus Boarding & Route Scan Notification</p>
                <p className="text-slate-500 text-[11px]">Receive push notification when student boards designated school bus #4.</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-0 w-4 h-4" />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">Unexcused Absence Alert (Sent at 08:30 AM)</p>
                <p className="text-slate-500 text-[11px]">Automatic high-priority siren SMS if student is unmarked by 08:30 AM roll call.</p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-0 w-4 h-4" />
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => {
                feedbackBus.success('Attendance notification preferences saved successfully!');
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm shadow-emerald-200"
            >
              Save Alert Preferences
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
