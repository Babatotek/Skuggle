import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Award,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Receipt,
  Sparkles,
  Building2,
  User,
  Plus,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';

interface ParentDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenResultChecker: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onNavigateTab, onOpenResultChecker }) => {
  const { branding, students, currentWorkspace, switchSpaceCategory, showToast } = useApp();

  const isPersonal = currentWorkspace.type === 'personal';

  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const currentChild = students[selectedChildIndex] || students[0];

  // Multi-school children state for personal family hub
  const [familyChildren, setFamilyChildren] = useState([
    {
      id: 'fam-1',
      name: 'David Fanimo',
      level: 'JSS 2 Diamond',
      school: 'Crown Heights Int’l Academy',
      schoolCode: 'CHIA-LAGOS',
      avg: '88.4%',
      attendance: '96%',
      status: 'Fees Cleared',
    },
    {
      id: 'fam-2',
      name: 'Grace Fanimo',
      level: 'Primary 5 Gold',
      school: 'Grange School Ikeja',
      schoolCode: 'GSI-IKEJA',
      avg: '92.1%',
      attendance: '98%',
      status: 'Fees Cleared',
    },
  ]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. IDENTITY BANNER                                                        */}
      {/* ========================================================================= */}
      {isPersonal ? (
        /* PERSONAL FAMILY HUB BANNER */
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-amber-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/30 text-amber-200 border border-amber-400/30 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-300" />
                  <span>Personal Space · Family Learning Hub</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  2 Linked Children Across Schools
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {currentWorkspace.name}
              </h1>
              <p className="text-xs sm:text-sm text-amber-200 mt-1">
                Centralized Family Study Routines, Multi-School Result Pin Tracking & Private Tutors
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => switchSpaceCategory('school')}
                className="px-4 py-2.5 text-xs font-bold text-indigo-950 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Switch to Crown Heights School Portal →</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* OFFICIAL SCHOOL WARD PORTAL BANNER */
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-indigo-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                  <span>School Space · Crown Heights Parent Portal</span>
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {branding.schoolCode} · {branding.academicSession} ({branding.currentTerm})
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {branding.schoolName}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                Enrolled Ward: <strong>David Fanimo</strong> (JSS 2 Diamond) · Class Form Master: <strong>Mr. O. Fanimo</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => switchSpaceCategory('personal')}
                className="px-4 py-2.5 text-xs font-bold text-amber-950 bg-white hover:bg-slate-100 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Switch to Personal Family Hub →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ENVIRONMENT CONTENT                                                    */}
      {/* ========================================================================= */}
      {isPersonal ? (
        /* ======================================================================= */
        /* PERSONAL FAMILY HUB                                                     */
        /* ======================================================================= */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint="Family Assistant: I can help coordinate David and Grace's evening study schedules, suggest revision materials for upcoming BECE exams, or track private tutoring sessions."
          />

          {/* Children Across Schools List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Linked Children Across Schools</h3>
                <p className="text-xs text-slate-500">Monitor multiple schools in one personal family view.</p>
              </div>
              <button
                onClick={() => showToast('Link Code Requested', 'Enter the 8-character student code provided by the school.')}
                className="px-3.5 py-2 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Link Another Child / School</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {familyChildren.map((child, idx) => (
                <div
                  key={child.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-amber-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-sm shadow-2xs">
                        {child.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{child.name}</h4>
                        <span className="text-xs text-slate-500 block">{child.level}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 rounded-full">
                      {child.schoolCode}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">School:</span>
                      <strong className="text-slate-800">{child.school}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Term Average:</span>
                      <strong className="text-emerald-700 font-bold">{child.avg}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Attendance:</span>
                      <strong className="text-slate-800">{child.attendance}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={onOpenResultChecker}
                      className="flex-1 py-2 text-center text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                    >
                      Check PIN Report
                    </button>
                    {idx === 0 && (
                      <button
                        onClick={() => switchSpaceCategory('school')}
                        className="py-2 px-3 text-xs font-bold text-slate-700 bg-slate-200/80 hover:bg-slate-300 rounded-xl transition-colors"
                      >
                        Enter School Space →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Home Study Routine & Private Tutors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">Home Study & Revision Schedule</h3>
              <p className="text-xs text-slate-500">
                Daily evening 45-minute focus blocks synchronized with current Nigerian curriculum schemes.
              </p>
              <div className="space-y-2 pt-1 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center">
                  <span>🕔 5:00 PM – 5:45 PM</span>
                  <strong className="text-slate-900">David: Algebra & BECE Math</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl flex justify-between items-center">
                  <span>🕕 6:00 PM – 6:45 PM</span>
                  <strong className="text-slate-900">Grace: English Comprehension</strong>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">Private Home Tutor Tracker</h3>
              <p className="text-xs text-slate-500">
                Coordinate weekend lessons and communicate directly with independent verified tutors.
              </p>
              <div className="space-y-2 pt-1 text-xs">
                <div className="p-2.5 bg-purple-50/50 border border-purple-100 rounded-xl flex justify-between items-center">
                  <span>Mr. Fanimo (Maths)</span>
                  <span className="font-bold text-purple-700">Tuesdays & Saturdays</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================================= */
        /* OFFICIAL SCHOOL WARD PORTAL                                             */
        /* ======================================================================= */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint="Parent assistant: Ask me how David is performing in Mathematics at Crown Heights Academy, or view his fee breakdown."
          />

          {/* Child Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Term 1 Overall Average
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-extrabold text-2xl text-indigo-950">{currentChild.termAverage}%</span>
                <span className="text-xs font-semibold text-emerald-700">Rank: 2nd / {currentChild.totalStudentsInClass}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Excellent academic standing in JSS 2 Diamond</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                School Attendance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-extrabold text-2xl text-emerald-700">{currentChild.attendanceRate}%</span>
                <span className="text-xs font-semibold text-emerald-700">Punctual</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Present on 58 of 60 term days</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                School Fee Status
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-extrabold text-2xl text-emerald-700">Cleared</span>
                <span className="text-xs font-semibold text-slate-500">₦145,000 paid</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Official electronic receipt #CHIA-REC-8821</p>
            </div>
          </div>

          {/* Quick Access to Result & Payments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">Term Result Card</h3>
              <p className="text-xs text-slate-500">
                View verified subject breakdown, continuous assessment marks, teacher remarks, and digital school stamp.
              </p>
              <button
                onClick={onOpenResultChecker}
                className="w-full py-2.5 px-4 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Open Result Sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">Fee Invoices & Receipts</h3>
              <p className="text-xs text-slate-500">
                Download official school fee receipts, review upcoming term bills, and pay securely via Nigerian bank transfer.
              </p>
              <button
                onClick={() => onNavigateTab('finance')}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View School Receipts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
