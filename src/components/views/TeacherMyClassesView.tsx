import React, { useState } from 'react';
import {
  Building2,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  Award,
  Plus,
  Search,
  Filter,
  Eye,
  Sliders,
  Send,
  X
} from 'lucide-react';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';

interface TeacherMyClassesViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface ClassCardData {
  id: string;
  name: string;
  level: string;
  role: 'Form Tutor & Subject Teacher' | 'Subject Teacher';
  subject: string;
  studentsCount: number;
  boysCount: number;
  girlsCount: number;
  room: string;
  periodsPerWeek: number;
  termAverage: number;
  attendanceRate: number;
  syllabusProgress: number; // percentage
  prefects: { role: string; name: string }[];
  schedule: { day: string; time: string; period: string }[];
}

const MY_CLASSES: ClassCardData[] = [
  {
    id: 'cls_1',
    name: 'JSS 2A',
    level: 'Junior Secondary 2',
    role: 'Form Tutor & Subject Teacher',
    subject: 'Mathematics',
    studentsCount: 38,
    boysCount: 20,
    girlsCount: 18,
    room: 'Block B, Room 104',
    periodsPerWeek: 5,
    termAverage: 74.8,
    attendanceRate: 96.2,
    syllabusProgress: 66,
    prefects: [
      { role: 'Class Captain', name: 'Aarav Johnson' },
      { role: 'Assistant Captain', name: 'Amina Bello' }
    ],
    schedule: [
      { day: 'Mon', time: '08:30 - 09:15 AM', period: 'Period 1' },
      { day: 'Tue', time: '10:00 - 10:45 AM', period: 'Period 3' },
      { day: 'Wed', time: '11:15 - 12:00 PM', period: 'Period 4' },
      { day: 'Thu', time: '09:15 - 10:00 AM', period: 'Period 2' },
      { day: 'Fri', time: '08:30 - 09:15 AM', period: 'Period 1' }
    ]
  },
  {
    id: 'cls_2',
    name: 'JSS 2B',
    level: 'Junior Secondary 2',
    role: 'Subject Teacher',
    subject: 'Mathematics',
    studentsCount: 36,
    boysCount: 19,
    girlsCount: 17,
    room: 'Block B, Room 105',
    periodsPerWeek: 5,
    termAverage: 71.4,
    attendanceRate: 94.8,
    syllabusProgress: 66,
    prefects: [
      { role: 'Class Captain', name: 'Kelechi Nwosu' },
      { role: 'Assistant Captain', name: 'Zainab Umar' }
    ],
    schedule: [
      { day: 'Mon', time: '10:00 - 10:45 AM', period: 'Period 3' },
      { day: 'Tue', time: '08:30 - 09:15 AM', period: 'Period 1' },
      { day: 'Wed', time: '09:15 - 10:00 AM', period: 'Period 2' },
      { day: 'Thu', time: '11:15 - 12:00 PM', period: 'Period 4' },
      { day: 'Fri', time: '10:00 - 10:45 AM', period: 'Period 3' }
    ]
  },
  {
    id: 'cls_3',
    name: 'SSS 1 Diamond',
    level: 'Senior Secondary 1',
    role: 'Subject Teacher',
    subject: 'Further Mathematics',
    studentsCount: 32,
    boysCount: 18,
    girlsCount: 14,
    room: 'Science Complex, Lab 2',
    periodsPerWeek: 4,
    termAverage: 82.1,
    attendanceRate: 97.5,
    syllabusProgress: 75,
    prefects: [
      { role: 'Class Captain', name: 'Tobi Fashola' },
      { role: 'Assistant Captain', name: 'Chioma Obi' }
    ],
    schedule: [
      { day: 'Mon', time: '11:15 - 12:45 PM', period: 'Double Period' },
      { day: 'Wed', time: '08:30 - 09:15 AM', period: 'Period 1' },
      { day: 'Thu', time: '10:00 - 10:45 AM', period: 'Period 3' }
    ]
  },
  {
    id: 'cls_4',
    name: 'SSS 2 Gold',
    level: 'Senior Secondary 2',
    role: 'Subject Teacher',
    subject: 'Physics',
    studentsCount: 28,
    boysCount: 15,
    girlsCount: 13,
    room: 'Physics Lab 1',
    periodsPerWeek: 4,
    termAverage: 76.5,
    attendanceRate: 95.0,
    syllabusProgress: 58,
    prefects: [
      { role: 'Class Captain', name: 'Sadiq Mohammed' },
      { role: 'Assistant Captain', name: 'Blessing Udoh' }
    ],
    schedule: [
      { day: 'Tue', time: '11:15 - 12:45 PM', period: 'Practical Lab' },
      { day: 'Wed', time: '10:00 - 10:45 AM', period: 'Period 3' },
      { day: 'Fri', time: '11:15 - 12:00 PM', period: 'Period 4' }
    ]
  }
];

export const TeacherMyClassesView: React.FC<TeacherMyClassesViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('cls_1');

  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');

  const selectedClass = MY_CLASSES.find((c) => c.id === selectedClassId) || MY_CLASSES[0];

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    feedbackBus.success(`Broadcast sent to all parents of ${selectedClass.name} via SMS & WhatsApp!`);
    setBroadcastModalOpen(false);
    setBroadcastText('');
  };

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Classes</h1>
          <p className="text-sm text-slate-500 mt-1">Your assigned classes will appear here once your school admin has set up the timetable.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No classes assigned yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Once your school admin assigns you to classes, your rosters, syllabus progress and student lists will show here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] uppercase tracking-wide">
              Academic Allocation
            </span>
            <span className="text-xs text-slate-400 font-medium">Session: 2026/2027</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            My Classes & Assigned Arms
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Overview of your 4 teaching assignments, student rosters, period schedules, and direct parent communications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('assessments')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>All Gradebooks</span>
          </button>

          <button
            onClick={() => onNavigateTab('attendance')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Take Daily Attendance</span>
          </button>
        </div>
      </div>

      {/* Broadcast Modal */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Broadcast to {selectedClass.name} Parents</h3>
                  <p className="text-xs text-slate-500">{selectedClass.studentsCount} Registered Parents</p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Announcement Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Reminder: First Term Continuous Assessment (CA 2) in Mathematics will hold on Tuesday. Students should bring mathematical sets."
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>Channels: <strong>SMS Broadcast</strong> + <strong>Parent Portal Feed</strong></span>
                <span className="font-bold text-indigo-600">Sender: ROYAL_GATE</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
                >
                  Dispatch Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid of 4 Assigned Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MY_CLASSES.map((cls) => {
          const isSelected = cls.id === selectedClassId;

          return (
            <div
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-100 hover:border-slate-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-slate-900">{cls.name}</span>
                    <span className="text-xs text-slate-500 font-medium">• {cls.level}</span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                    cls.role.includes('Form Tutor')
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {cls.role}
                  </span>
                </div>

                <p className="text-xs font-bold text-indigo-600 mt-1">
                  Subject: {cls.subject} • <span className="text-slate-500 font-normal">{cls.room}</span>
                </p>

                {/* 4 Stats Chips */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 rounded-xl p-2">
                    <p className="text-[10px] text-slate-400 font-medium">Students</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">{cls.studentsCount}</p>
                    <p className="text-[9.5px] text-slate-400">{cls.boysCount}B / {cls.girlsCount}G</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2">
                    <p className="text-[10px] text-slate-400 font-medium">Term Avg</p>
                    <p className="font-extrabold text-emerald-600 mt-0.5">{cls.termAverage}%</p>
                    <p className="text-[9.5px] text-emerald-600 font-semibold">Good</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2">
                    <p className="text-[10px] text-slate-400 font-medium">Attendance</p>
                    <p className="font-extrabold text-indigo-600 mt-0.5">{cls.attendanceRate}%</p>
                    <p className="text-[9.5px] text-indigo-600">Active</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2">
                    <p className="text-[10px] text-slate-400 font-medium">Syllabus</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">{cls.syllabusProgress}%</p>
                    <p className="text-[9.5px] text-slate-500">Wk 8/12</p>
                  </div>
                </div>

                {/* Prefects info */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  <span>Class Captains:</span>
                  <span className="font-semibold text-slate-700">
                    {cls.prefects.map((p) => `${p.name} (${p.role})`).join(' • ')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateTab('attendance');
                  }}
                  className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Attendance</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateTab('assessments');
                  }}
                  className="py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Gradebook</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClassId(cls.id);
                    setBroadcastModalOpen(true);
                  }}
                  className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Broadcast</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Class Timetable Detail Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-indigo-600" />
              <span>Weekly Timetable Schedule for {selectedClass.name}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {selectedClass.subject} • {selectedClass.periodsPerWeek} allocated teaching periods per week • {selectedClass.room}
            </p>
          </div>

          <button
            onClick={() => onOpenModal('ai_lesson', { topic: `${selectedClass.name} ${selectedClass.subject} Lesson Plan` })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Generate Next Lesson Plan</span>
          </button>
        </div>

        {/* Timetable Period Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {selectedClass.schedule.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/30 flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-extrabold text-xs">
                  {item.day}
                </span>
                <span className="text-[11px] font-bold text-indigo-700">{item.period}</span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900">{selectedClass.subject}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{item.time}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-indigo-100/60 flex items-center justify-between text-[10.5px]">
                <span className="text-slate-400">{selectedClass.room}</span>
                <button
                  onClick={() => onNavigateTab('attendance')}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Roll Call →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
