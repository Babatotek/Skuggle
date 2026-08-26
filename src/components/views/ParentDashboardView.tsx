import React, { useState } from 'react';
import {
  Users,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  ArrowUpRight,
  Shield,
  Download,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { INITIAL_STUDENTS, SAMPLE_REPORT_CARD } from '../../data/mockData';
import { appConfig } from '@/app/config';
import { useAuth } from '@/features/auth/AuthProvider';

interface ParentDashboardViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const ParentDashboardView: React.FC<ParentDashboardViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'Parent';
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const children = [
    {
      name: 'Nathan Bello',
      classArm: 'JSS 2A',
      school: 'Royal Gateway Academy',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      average: 74,
      attendance: 96,
      feeBalance: 45000,
      studentData: INITIAL_STUDENTS[5],
    },
    {
      name: 'Chidera Bello',
      classArm: 'Primary 4B',
      school: 'Royal Gateway Academy',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      average: 86,
      attendance: 98,
      feeBalance: 0,
      studentData: INITIAL_STUDENTS[1],
    },
    {
      name: 'Somto Bello',
      classArm: 'Nursery 2A',
      school: 'Royal Gateway Academy',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      average: 92,
      attendance: 95,
      feeBalance: 15000,
      studentData: INITIAL_STUDENTS[2],
    }
  ];

  const currentChild = children[selectedChildIndex];

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {firstName} 👋</h1>
          <p className="text-sm text-slate-500 mt-1">Your children's academic progress, attendance, and fee summaries will appear here once the school publishes data to the parent portal.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'My Children', tab: 'my_children', desc: 'Profiles, medical info, and authorised pickup persons' },
            { icon: CheckCircle2, label: 'Attendance', tab: 'attendance', desc: 'Daily gate logs and term attendance rates' },
            { icon: TrendingUp, label: 'Academics', tab: 'academics', desc: 'Subject grades, assignments, and exam timetable' },
            { icon: CreditCard, label: 'Payments', tab: 'payments', desc: 'Fee invoices, payment history, and receipts' },
            { icon: MessageSquare, label: 'Messages', tab: 'messages', desc: 'Chat with teachers, bursary, and principal' },
            { icon: ArrowRight, label: 'More', tab: 'more', desc: 'Transport, clinic, cafeteria menu, and school calendar' },
          ].map(({ icon: Icon, label, tab, desc }) => (
            <button key={label} type="button" onClick={() => onNavigateTab(tab)}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></div>
              <div><p className="text-sm font-bold text-slate-900">{label}</p><p className="mt-0.5 text-xs text-slate-500">{desc}</p></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Child Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome, Mrs. Bello <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor academic growth, attendance records, and school fee status in real-time.
          </p>
        </div>

        {/* Children Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {children.map((child, idx) => {
            const isSelected = selectedChildIndex === idx;
            return (
              <button
                key={child.name}
                onClick={() => setSelectedChildIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <img
                  src={child.avatar}
                  alt={child.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>{child.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {child.classArm}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Stat Cards for Current Child */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Term Average */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Current Term Average</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{currentChild.average}%</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>4th position out of 38</span>
            </p>
          </div>
        </div>

        {/* Card 2: Attendance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Attendance Rate</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{currentChild.attendance}%</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              126 / 130 school days attended
            </p>
          </div>
        </div>

        {/* Card 3: Pending Fees */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Outstanding School Fees</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              ₦{currentChild.feeBalance.toLocaleString()}
            </p>
            <button
              onClick={() => onOpenModal('make_payment', { student: currentChild.studentData, amount: currentChild.feeBalance })}
              className="text-[11px] text-indigo-600 font-bold hover:underline mt-0.5 block"
            >
              Pay Now via Card / Transfer →
            </button>
          </div>
        </div>

        {/* Card 4: Report Card Download */}
        <div
          onClick={() => onOpenModal('report_card', currentChild.studentData)}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-5 shadow-md shadow-indigo-200 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="mt-3">
            <p className="text-sm font-bold">Terminal Report Card</p>
            <p className="text-xs text-indigo-100 mt-0.5">View signed First Term PDF</p>
          </div>
        </div>

      </div>

      {/* Row 2: Subject Breakdown & Teacher Remarks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Subject Breakdown (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">{currentChild.name}'s Subject Grades</h2>
            </div>

            <button
              onClick={() => onOpenModal('result_checker', currentChild.studentData)}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Verify Result PIN</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[11px]">
                  <th className="pb-2.5 pl-2">Subject</th>
                  <th className="pb-2.5">CA (40)</th>
                  <th className="pb-2.5">Exam (60)</th>
                  <th className="pb-2.5">Total (100)</th>
                  <th className="pb-2.5">Grade</th>
                  <th className="pb-2.5 text-right pr-2">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {SAMPLE_REPORT_CARD.subjects.map((sub) => (
                  <tr key={sub.name} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pl-2 font-bold text-slate-800">{sub.name}</td>
                    <td className="py-2.5 text-slate-600 font-medium">{sub.ca1 + sub.ca2 + sub.assignment + sub.project}</td>
                    <td className="py-2.5 text-slate-600 font-medium">{sub.exam}</td>
                    <td className="py-2.5 font-extrabold text-slate-900">{sub.total}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        sub.grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                        sub.grade === 'B' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {sub.grade}
                      </span>
                    </td>
                    <td className="py-2.5 text-right pr-2 text-slate-500 font-medium">{sub.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Teacher Remarks & Contact Form (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Teacher Remarks Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Class Teacher's Remark</h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
              "{SAMPLE_REPORT_CARD.classTeacherRemarks}"
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-2 text-right">
              — Mr. Adewale (Form Teacher, JSS 2A)
            </p>
          </div>

          {/* Quick Message to Teacher */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Message Form Teacher</h3>
            </div>
            <textarea
              rows={3}
              placeholder="Write a message to Mr. Adewale..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2.5"
            />
            <button
              onClick={() => alert('Message delivered to Mr. Adewale!')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Send Message
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
