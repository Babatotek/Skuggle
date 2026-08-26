import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Camera,
  MessageSquare,
  ClipboardList,
  CheckCircle2,
  Clock,
  Download,
  Upload,
  Plus,
  Search,
  Calendar,
  FileText,
  Send,
  Eye,
  Edit3,
  Trash2,
  Printer,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Building,
  UserCheck,
  Check,
  X
} from 'lucide-react';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface TeacherMoreViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface SchemeWeekItem {
  week: number;
  topic: string;
  subtopics: string[];
  objectives: string;
  teachingAids: string;
  status: 'Approved' | 'Pending Approval' | 'Draft';
  hodRemarks?: string;
}

interface HomeworkItem {
  id: string;
  title: string;
  classArm: string;
  subject: string;
  dueDate: string;
  submitted: number;
  total: number;
  status: 'Active' | 'Graded' | 'Closed';
}

const SCHEME_OF_WORK: SchemeWeekItem[] = [
  {
    week: 1,
    topic: 'Whole Numbers & Standard Form',
    subtopics: ['Significant figures', 'Decimal places', 'Standard form of large and small numbers'],
    objectives: 'Students will be able to convert ordinary decimal numbers to standard index form.',
    teachingAids: 'Place value charts, Scientific calculators, Flash cards',
    status: 'Approved',
    hodRemarks: 'Very thorough plan. Approved for delivery.'
  },
  {
    week: 2,
    topic: 'Fractions, Decimals and Approximations',
    subtopics: ['Addition & subtraction of algebraic fractions', 'Simplification of compound fractions'],
    objectives: 'Simplify algebraic fractions with monomial and binomial denominators.',
    teachingAids: 'Fraction wall charts, algebra tile kit',
    status: 'Approved'
  },
  {
    week: 3,
    topic: 'Simultaneous Linear Equations (Part 1)',
    subtopics: ['Elimination method', 'Substitution method with 2 variables'],
    objectives: 'Solve pairs of linear equations simultaneously using elimination & substitution.',
    teachingAids: 'Coordinate grid boards, balance scale model',
    status: 'Approved'
  },
  {
    week: 4,
    topic: 'Simultaneous Linear Equations (Part 2)',
    subtopics: ['Graphical solutions', 'Word problems involving two unknowns'],
    objectives: 'Plot straight lines on Cartesian plane and identify point of intersection.',
    teachingAids: 'Graph sheets, GeoGebra projection',
    status: 'Approved'
  },
  {
    week: 5,
    topic: 'Plane Geometry & Angle Theorems',
    subtopics: ['Angles on a straight line', 'Angles around a point', 'Alternate & corresponding angles'],
    objectives: 'Prove and apply angle theorems for parallel lines intersected by transversals.',
    teachingAids: 'Geometric protractors, wooden angle models',
    status: 'Approved'
  },
  {
    week: 6,
    topic: 'Continuous Assessment Week & Mid-Term Review',
    subtopics: ['CA 1 & CA 2 administration', 'Correction of common misconceptions'],
    objectives: 'Formative evaluation of Weeks 1 to 5 mastery.',
    teachingAids: 'SmartMark OMR answer sheets, test papers',
    status: 'Approved'
  },
  {
    week: 7,
    topic: 'Mid-Term Break',
    subtopics: ['Curriculum audit & gradebook verification'],
    objectives: 'Departmental review of students requiring academic clinics.',
    teachingAids: 'Analytics broadsheet',
    status: 'Approved'
  },
  {
    week: 8,
    topic: 'Quadratic Equations (Factorization)',
    subtopics: ['Factorizing quadratic expressions ax^2 + bx + c', 'Solving equations by factorization'],
    objectives: 'Factorize quadratic trinomials and deduce roots accurately.',
    teachingAids: 'Algebra tiles, step-by-step flowchart',
    status: 'Approved'
  },
  {
    week: 9,
    topic: 'Trigonometric Ratios of Acute Angles',
    subtopics: ['Sine, Cosine, and Tangent in right-angled triangles', 'SOH CAH TOA application'],
    objectives: 'Calculate unknown sides and angles of right triangles.',
    teachingAids: 'Clinometer, 3D right-triangle models, trigonometric tables',
    status: 'Pending Approval',
    hodRemarks: 'Please add real-life height measurement practical activity.'
  },
  {
    week: 10,
    topic: 'Angles of Elevation and Depression',
    subtopics: ['Angle of elevation definition', 'Angle of depression and bearing correlation'],
    objectives: 'Formulate and solve word problems involving heights and distances.',
    teachingAids: 'Campus flagpole measuring exercise, measuring tapes',
    status: 'Draft'
  },
  {
    week: 11,
    topic: 'Statistics: Frequency Distribution & Mean/Median',
    subtopics: ['Ungrouped and grouped frequency tables', 'Calculation of mean, median, mode'],
    objectives: 'Construct frequency tables and compute measures of central tendency.',
    teachingAids: 'Student height/age survey data, bar chart templates',
    status: 'Draft'
  },
  {
    week: 12,
    topic: 'Revision & First Term Terminal Examination',
    subtopics: ['Comprehensive review', 'Unified examination conduct'],
    objectives: 'Summative terminal mastery assessment.',
    teachingAids: 'Unified examination booklets, SmartMark scanner',
    status: 'Draft'
  }
];

const HOMEWORK_ITEMS: HomeworkItem[] = [
  {
    id: 'hw_1',
    title: 'Algebraic Fractions Practice Set (Ex 3.4, Q1-12)',
    classArm: 'JSS 2A',
    subject: 'Mathematics',
    dueDate: '2026-10-22',
    submitted: 36,
    total: 38,
    status: 'Graded'
  },
  {
    id: 'hw_2',
    title: 'Plane Geometry Proofs & Transversal Angles',
    classArm: 'JSS 2A',
    subject: 'Mathematics',
    dueDate: '2026-10-29',
    submitted: 34,
    total: 38,
    status: 'Active'
  },
  {
    id: 'hw_3',
    title: 'Further Maths: Differentiation from First Principles',
    classArm: 'SSS 1 Diamond',
    subject: 'Further Mathematics',
    dueDate: '2026-10-30',
    submitted: 30,
    total: 32,
    status: 'Active'
  }
];

export const TeacherMoreView: React.FC<TeacherMoreViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'scheme' | 'homework' | 'messaging' | 'smartmark'>('scheme');
  const [selectedClass, setSelectedClass] = useState('JSS 2A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">More Tools</h1>
          <p className="text-sm text-slate-500 mt-1">Scheme of work, homework, parent messaging, and SmartMark.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: BookOpen, label: 'Scheme of Work', desc: 'Your curriculum plan will appear once your school admin sets up subjects and terms.', tab: 'scheme' as const },
            { icon: ClipboardList, label: 'Homework Tracker', desc: 'Homework assignments you create will show here.', tab: 'homework' as const },
            { icon: MessageSquare, label: 'Parent Messaging', desc: 'Message threads with parents and staff will appear after your school launches.', tab: 'messaging' as const },
            { icon: Camera, label: 'SmartMark OMR', desc: 'Upload answer sheets to automatically grade them with AI.', action: () => onOpenModal('smartmark') },
          ].map(({ icon: Icon, label, desc, tab, action }) => (
            <button
              key={label}
              type="button"
              onClick={action ?? (() => setActiveTab(tab!))}
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
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200 overflow-x-hidden">

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[11px] uppercase tracking-wide">
              Teacher Toolkit & Planning Hub
            </span>
            <span className="text-xs text-slate-400 font-medium">Session: 2026/2027 • First Term</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Curriculum Planning, Homework & Communication
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            12-week NERDC Scheme of Work, AI Lesson Plan generation, homework tracking, parent messaging, and SmartMark OMR tools.
          </p>
        </div>

        <button
          onClick={() => onOpenModal('ai_lesson')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Build Lesson Plan with AI</span>
        </button>
      </div>

      {/* Top Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center gap-2">
        <button
          id="btn-tab-scheme"
          onClick={() => setActiveTab('scheme')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'scheme'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Scheme of Work & Syllabus (12 Wks)</span>
        </button>

        <button
          id="btn-tab-homework"
          onClick={() => setActiveTab('homework')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'homework'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Homework & Assignments</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {HOMEWORK_ITEMS.length}
          </span>
        </button>

        <button
          id="btn-tab-messaging"
          onClick={() => setActiveTab('messaging')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'messaging'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Parent-Teacher Messages</span>
        </button>

        <button
          id="btn-tab-smartmark"
          onClick={() => setActiveTab('smartmark')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'smartmark'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>SmartMark OMR Templates</span>
        </button>
      </div>

      {/* TAB 1: SCHEME OF WORK */}
      {activeTab === 'scheme' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-indigo-600" />
                <span>NERDC Termly Scheme of Work — {selectedClass} {selectedSubject}</span>
              </h3>
              <p className="text-xs text-slate-500">
                12-week standardized national curriculum with behavioural objectives, instructional materials, and HOD departmental sign-off.
              </p>
            </div>

            <button
              onClick={() => {
                feedbackBus.success('Scheme of work exported to official Ministry PDF format!');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Scheme (PDF)</span>
            </button>
          </div>

          <div className="space-y-3">
            {SCHEME_OF_WORK.map((item) => (
              <div
                key={item.week}
                className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 bg-slate-50/40 hover:bg-slate-50/80 transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex flex-col items-center justify-center flex-shrink-0 text-xs shadow-xs">
                    <span className="text-[9px] uppercase font-semibold text-indigo-200">Wk</span>
                    <span className="text-sm -mt-1">{item.week}</span>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{item.topic}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Pending Approval'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong>Objectives:</strong> {item.objectives}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                      <span><strong>Key Sub-topics:</strong> {item.subtopics.join(' • ')}</span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      <strong>Teaching Aids:</strong> {item.teachingAids}
                    </p>

                    {item.hodRemarks && (
                      <p className="text-[11px] font-semibold text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-100">
                        HOD Note: {item.hodRemarks}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => onOpenModal('ai_lesson', { topic: `${selectedClass} ${selectedSubject}: Week ${item.week} - ${item.topic}` })}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Generate Lesson Note</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: HOMEWORK & ASSIGNMENTS */}
      {activeTab === 'homework' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Homework & Take-Home Assignments</h3>
              <p className="text-xs text-slate-500">Track student homework submissions, grade attachments, and send reminders</p>
            </div>

            <button
              onClick={() => {
                feedbackBus.success('New homework assignment creation wizard opened.');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post New Homework</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOMEWORK_ITEMS.map((hw) => (
              <div
                key={hw.id}
                className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 bg-white shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10.5px]">
                      {hw.classArm} • {hw.subject}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      hw.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {hw.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2">{hw.title}</h4>
                  
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: <strong>{hw.dueDate}</strong></span>
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-500">Submissions</span>
                      <span className="text-slate-900">{hw.submitted} / {hw.total}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${(hw.submitted / hw.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
                  <button
                    onClick={() => onNavigateTab('assessments')}
                    className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-center"
                  >
                    Grade Submissions
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PARENT MESSAGING */}
      {activeTab === 'messaging' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Direct Parent-Teacher Message Feeds</h3>
              <p className="text-xs text-slate-500">Communicate with guardians regarding academic progress and punctuality</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
                    alt="Mrs. Bello"
                    className="w-9 h-9 rounded-full object-cover border"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Mrs. Folashade Bello</h4>
                    <p className="text-[10px] text-slate-500">Parent of Nathan Bello (JSS 2A)</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">10:24 AM</span>
              </div>

              <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                "Good morning Mr. Adewale, thank you for the feedback on Nathan's mathematics homework. We will ensure he reviews simultaneous equations this weekend."
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type reply to Mrs. Bello..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                />
                <button
                  onClick={() => {
                    feedbackBus.success('Reply sent to Mrs. Folashade Bello!');
                  }}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                    alt="Mr. Okafor"
                    className="w-9 h-9 rounded-full object-cover border"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Chief Chukwudi Okafor</h4>
                    <p className="text-[10px] text-slate-500">Parent of Chukwudi Okafor (JSS 2A)</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">Yesterday</span>
              </div>

              <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                "Hello Mr. Adewale, Chukwudi was late today due to heavy traffic on the expressway. Apologies for the delay."
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type reply to Chief Okafor..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                />
                <button
                  onClick={() => {
                    feedbackBus.success('Reply sent to Chief Okafor!');
                  }}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SMARTMARK OMR TEMPLATES */}
      {activeTab === 'smartmark' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">SmartMark Optical OMR Sheet Library</h3>
              <p className="text-xs text-slate-500">Print standard optical bubble sheets for automated camera marking</p>
            </div>
            
            <button
              onClick={() => onOpenModal('smartmark_scan')}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Launch Live Camera Scanner</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10.5px] font-bold">
                  20-Question Quick Test
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-2">Continuous Assessment (CA) OMR Sheet</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Single page A4 layout with 4 choices (A, B, C, D) and barcode student ID reader.
                </p>
              </div>
              <button
                onClick={() => {
                  feedbackBus.success('20-Question OMR Template downloaded!');
                }}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print PDF Sheet</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10.5px] font-bold">
                  50-Question Standard
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-2">Mid-Term & Unified CA Sheet</h4>
                <p className="text-xs text-slate-500 mt-1">
                  5 choices (A, B, C, D, E) standard WAEC/NECO formatting with registration grid.
                </p>
              </div>
              <button
                onClick={() => {
                  feedbackBus.success('50-Question OMR Template downloaded!');
                }}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print PDF Sheet</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-bold">
                  100-Question Comprehensive
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-2">Terminal Unified Mock Examination</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Multi-section format with objective + theory score bubble box.
                </p>
              </div>
              <button
                onClick={() => {
                  feedbackBus.success('100-Question OMR Template downloaded!');
                }}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print PDF Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
