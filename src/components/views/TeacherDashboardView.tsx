import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Clock,
  ClipboardList,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Building,
  Plus,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  FileCheck,
  Download,
  Eye,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  TEACHER_SCHEDULE,
  TEACHER_CLASS_PERFORMANCE,
  STUDENTS_ATTENTION,
  RECENT_NOTIFICATIONS
} from '../../data/mockData';
import { appConfig } from '@/app/config';
import { useAuth } from '@/features/auth/AuthProvider';

const RESOURCE_USAGE_DATA = [
  { name: 'Physics Notes Wk 3', views: 248, downloads: 142, category: 'Lecture Notes' },
  { name: 'SSS 2 Calc Quiz', views: 195, downloads: 120, category: 'Assignments' },
  { name: 'Chemistry Lab Sheet', views: 164, downloads: 98, category: 'Lab & Practicals' },
  { name: 'BECE Past Questions', views: 310, downloads: 215, category: 'Exams' },
  { name: 'Organic Chemistry Handout', views: 180, downloads: 110, category: 'Lecture Notes' },
];

interface TeacherDashboardViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'Teacher';
  const [selectedTerm, setSelectedTerm] = useState('First Term, 2026/2027');
  const [selectedCampus, setSelectedCampus] = useState('Royal Gateway Academy');

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">Your dashboard will populate once your school publishes class and assessment data.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'My Classes', tab: 'my_classes', desc: 'View assigned classes and student lists' },
            { icon: ClipboardList, label: 'Assessments', tab: 'assessments', desc: 'Create and grade assessments' },
            { icon: Calendar, label: 'Attendance', tab: 'attendance', desc: 'Take and review class attendance' },
            { icon: BookOpen, label: 'Library', tab: 'resources', desc: 'Upload and manage learning resources' },
            { icon: GraduationCap, label: 'More Tools', tab: 'more', desc: 'Scheme of work, messaging and SmartMark' },
            { icon: Sparkles, label: 'AI Lesson Builder', tab: '', desc: 'Generate lesson plans instantly with AI', action: () => onOpenModal('ai_lesson') },
          ].map(({ icon: Icon, label, tab, desc, action }) => (
            <button
              key={label}
              type="button"
              onClick={action ?? (() => onNavigateTab(tab))}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Good morning, Mr. Adewale <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here's what's happening in your classes today.
          </p>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* School Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>{selectedCampus}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Term Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{selectedTerm}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Resource Library Button */}
          <button
            id="btn-teacher-resource-library"
            onClick={() => onNavigateTab('resources')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Resource Library</span>
          </button>

          {/* Take Attendance Button */}
          <button
            id="btn-teacher-take-attendance"
            onClick={() => onNavigateTab('attendance')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Take Attendance</span>
          </button>

          {/* Create Assessment Button */}
          <button
            id="btn-teacher-create-assessment"
            onClick={() => onNavigateTab('assessments')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
            <span>Assessments & Gradebook</span>
          </button>

          {/* Build Lesson with AI Button */}
          <button
            id="btn-teacher-build-lesson-ai"
            onClick={() => onOpenModal('ai_lesson')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all hover:shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Build Lesson with AI</span>
          </button>
        </div>
      </div>

      {/* 5 Top Metric Stat Cards - Exact Layout from Image 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Today's Classes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Today's Classes</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">4</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Scheduled</p>
          </div>
        </div>

        {/* Card 2: Students Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Students Today</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">168</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Enrolled</p>
          </div>
        </div>

        {/* Card 3: Attendance Pending */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between cursor-pointer hover:border-amber-200 transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Attendance Pending</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">2 classes</p>
            <p className="text-[11px] text-amber-600 font-semibold mt-1 hover:underline">Take attendance</p>
          </div>
        </div>

        {/* Card 4: Assessments to Mark */}
        <div
          onClick={() => onNavigateTab('assessments')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between cursor-pointer hover:border-purple-200 transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Assessments to Mark</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">18</p>
            <p className="text-[11px] text-purple-600 font-semibold mt-1 hover:underline">View queue</p>
          </div>
        </div>

        {/* Card 5: Average Class Performance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Average Class Performance</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">72%</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>4% vs last week</span>
            </p>
          </div>
        </div>

      </div>

      {/* Row 2: Today's Classes Table + Class Performance + Assessment Queue Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Today's Classes Table (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Today's Classes</h3>
              <button
                onClick={() => onNavigateTab('my_classes')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
              >
                <span>View Full Schedule</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {TEACHER_SCHEDULE.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{item.class} • <span className="font-medium text-slate-600">{item.subject}</span></p>
                      <p className="text-[11px] text-slate-400">{item.time} ({item.room})</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenModal('attendance', { classArm: item.class })}
                    className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-[11px] transition-colors whitespace-nowrap"
                  >
                    Take Attendance
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Class Performance (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">My Class Performance</h3>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                This Term <ChevronDown className="w-3 h-3 text-slate-400" />
              </span>
            </div>

            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                  <th className="pb-2 pl-1">Class</th>
                  <th className="pb-2">Average Score</th>
                  <th className="pb-2 text-right pr-1">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {TEACHER_CLASS_PERFORMANCE.map((cp) => (
                  <tr key={cp.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pl-1 font-bold text-slate-800">{cp.class}</td>
                    <td className="py-2.5 font-extrabold text-slate-900">{cp.averageScore}%</td>
                    <td className="py-2.5 text-right pr-1">
                      <span className={`inline-flex items-center gap-0.5 font-bold ${
                        cp.trend > 0 ? 'text-emerald-600' : cp.trend < 0 ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        {cp.trend > 0 ? '↑ ' : cp.trend < 0 ? '↓ ' : '→ '}
                        {Math.abs(cp.trend)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => onNavigateTab('assessments')}
            className="w-full pt-3 mt-2 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1"
          >
            <span>View Performance Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Assessment Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Assessment Queue</h3>
              <button
                onClick={() => onOpenModal('smartmark_scan')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              {/* Donut Chart */}
              <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#3B82F6" strokeWidth="12" fill="none" strokeDasharray="125 238.8" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="38" stroke="#8B5CF6" strokeWidth="12" fill="none" strokeDasharray="62 238.8" strokeDashoffset="-125" />
                  <circle cx="50" cy="50" r="38" stroke="#F59E0B" strokeWidth="12" fill="none" strokeDasharray="31 238.8" strokeDashoffset="-187" />
                  <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="12" fill="none" strokeDasharray="20 238.8" strokeDashoffset="-218" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-base font-extrabold text-slate-900">23</span>
                  <span className="text-[9px] text-slate-400 font-medium">Total Items</span>
                </div>
              </div>

              {/* Breakdown Legend */}
              <div className="flex-1 space-y-1.5 text-[11.5px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Objective tests pending marking
                  </span>
                  <span className="font-bold text-slate-900">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Theory scripts to review
                  </span>
                  <span className="font-bold text-slate-900">6</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Submitted results awaiting approval
                  </span>
                  <span className="font-bold text-slate-900">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    SmartMark scan exceptions
                  </span>
                  <span className="font-bold text-slate-900">2</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenModal('smartmark_scan')}
            className="w-full pt-3 mt-2 border-t border-slate-100 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1"
          >
            <span>Go to Assessment Queue</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* Row 3: AI Lesson Assistant + Students Requiring Attention + Recent Notifications + Attendance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* AI Lesson Assistant Card (3 cols) */}
        <div className="lg:col-span-3 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white rounded-2xl border border-indigo-100 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">AI Lesson Assistant</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 bg-white/80 rounded-xl p-3 border border-indigo-50">
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Pending lesson plans</p>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">2</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Curriculum</p>
                  <p className="text-xl font-extrabold text-indigo-600 mt-0.5">66%</p>
                </div>
                {/* Circular ring */}
                <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent" />
              </div>
            </div>

            <button
              id="btn-draft-lesson-plan"
              onClick={() => onOpenModal('ai_lesson')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 mb-2.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Draft Lesson Plan</span>
            </button>

            <button
              onClick={() => onOpenModal('ai_lesson', { topic: 'JSS 2 Algebraic Fractions & Operations' })}
              className="w-full py-2 bg-white hover:bg-indigo-50/80 text-indigo-700 border border-indigo-200/80 rounded-xl text-[11px] font-semibold transition-colors flex items-center justify-between px-3"
            >
              <span className="truncate">✨ Generate JSS 2 fractions lesson</span>
              <ArrowRight className="w-3 h-3 text-indigo-500 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Students Requiring Attention (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Students Requiring Attention</h3>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
            >
              <span>View All Students</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {STUDENTS_ATTENTION.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/60 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <span className="absolute -bottom-1 -right-1 text-[9px] bg-slate-800 text-white font-bold px-1 rounded-full">
                      {item.initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.class}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10.5px] font-semibold text-amber-700 flex items-center gap-1 leading-tight">
                    <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    <span className="truncate">{item.tag}</span>
                  </p>

                  <button
                    onClick={() => onOpenModal('report_card', { name: item.name, classArm: item.class })}
                    className="text-[10.5px] font-semibold text-indigo-600 hover:underline block pt-1"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notifications (2.5 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Notifications</h3>
              <span className="text-xs font-semibold text-indigo-600 cursor-pointer">View All →</span>
            </div>

            <div className="space-y-3">
              {RECENT_NOTIFICATIONS.map((notif) => (
                <div key={notif.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {notif.iconType === 'assignment' && <FileCheck className="w-3.5 h-3.5" />}
                    {notif.iconType === 'result' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {notif.iconType === 'parent' && <MessageSquare className="w-3.5 h-3.5" />}
                    {notif.iconType === 'meeting' && <Calendar className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 leading-tight">{notif.title}</p>
                    <p className="text-[10.5px] text-slate-500 truncate">{notif.subtitle}</p>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">{notif.timeAgo}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Summary (2.5 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Attendance Summary</h3>
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-0.5">
                This Week <ChevronDown className="w-3 h-3" />
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              {/* Donut */}
              <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                  <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="12" fill="none" strokeDasharray="195 238.8" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="38" stroke="#F59E0B" strokeWidth="12" fill="none" strokeDasharray="28 238.8" strokeDashoffset="-195" />
                  <circle cx="50" cy="50" r="38" stroke="#EF4444" strokeWidth="12" fill="none" strokeDasharray="15 238.8" strokeDashoffset="-223" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-sm font-extrabold text-slate-900">168</span>
                  <span className="text-[8.5px] text-slate-400">Students</span>
                </div>
              </div>

              <div className="w-full space-y-1 text-[10.5px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Present
                  </span>
                  <span className="font-bold text-slate-900">82% (138)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Absent
                  </span>
                  <span className="font-bold text-slate-900">12% (20)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Late
                  </span>
                  <span className="font-bold text-slate-900">6% (10)</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenModal('attendance')}
            className="w-full pt-2 border-t border-slate-100 text-center text-xs font-semibold text-indigo-600 hover:underline"
          >
            View Attendance Report →
          </button>
        </div>

      </div>

      {/* Row 4: Student Resource Access & Usage Insights (Recharts) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Resource Library Usage Insights</h3>
              <p className="text-xs text-slate-500">Most accessed and downloaded study materials by students this term</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-3 h-3 rounded-md bg-indigo-600" />
              <span>Student Views</span>
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span>Downloads</span>
            </span>
            <button
              onClick={() => onNavigateTab('resources')}
              className="ml-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors"
            >
              Open Resource Library →
            </button>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={RESOURCE_USAGE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="views" name="Student Views" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={36} />
              <Bar dataKey="downloads" name="Downloads" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
