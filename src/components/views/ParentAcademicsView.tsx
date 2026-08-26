import React, { useState } from 'react';
import {
  BookOpen,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  Award,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  Calendar,
  MessageSquare,
  BarChart3,
  Layers,
  GraduationCap
} from 'lucide-react';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface ParentAcademicsViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface SubjectGrade {
  subject: string;
  ca1: number; // /20
  ca2: number; // /20
  exam: number; // /60
  total: number; // /100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  classAverage: number;
  position: string;
  teacherRemark: string;
  tutor: string;
}

interface AssignmentItem {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  status: 'Graded' | 'Submitted' | 'Pending';
  score?: string;
  teacherFeedback?: string;
}

const ACADEMIC_SUBJECTS: Record<string, SubjectGrade[]> = {
  child_1: [
    {
      subject: 'Mathematics',
      ca1: 19,
      ca2: 18,
      exam: 52,
      total: 89,
      grade: 'A',
      classAverage: 68.4,
      position: '2nd / 38',
      teacherRemark: 'Outstanding grasp of algebraic quadratic equations and geometry theorems.',
      tutor: 'Mr. Adewale'
    },
    {
      subject: 'English Studies',
      ca1: 17,
      ca2: 18,
      exam: 49,
      total: 84,
      grade: 'A',
      classAverage: 71.2,
      position: '5th / 38',
      teacherRemark: 'Excellent vocabulary and expository composition skills.',
      tutor: 'Mrs. Okafor'
    },
    {
      subject: 'Basic Science & Technology',
      ca1: 20,
      ca2: 19,
      exam: 54,
      total: 93,
      grade: 'A+',
      classAverage: 65.0,
      position: '1st / 38',
      teacherRemark: 'Exceptional aptitude in Physics and practical electronics laboratory.',
      tutor: 'Dr. (Mrs.) Bello'
    },
    {
      subject: 'Robotics & Computer Studies',
      ca1: 19,
      ca2: 20,
      exam: 55,
      total: 94,
      grade: 'A+',
      classAverage: 69.5,
      position: '1st / 38',
      teacherRemark: 'Top of class in Python logic structures and Arduino microcontrollers.',
      tutor: 'Engr. D. Kalu'
    },
    {
      subject: 'Business Studies',
      ca1: 16,
      ca2: 17,
      exam: 46,
      total: 79,
      grade: 'B',
      classAverage: 64.2,
      position: '6th / 38',
      teacherRemark: 'Good understanding of double-entry ledger bookkeeping.',
      tutor: 'Mr. F. Ogundele'
    },
    {
      subject: 'Civic Education & Social Studies',
      ca1: 18,
      ca2: 17,
      exam: 48,
      total: 83,
      grade: 'A',
      classAverage: 72.8,
      position: '4th / 38',
      teacherRemark: 'Displays commendable civic awareness and leadership qualities.',
      tutor: 'Mrs. H. Danjuma'
    },
    {
      subject: 'Agricultural Science',
      ca1: 17,
      ca2: 16,
      exam: 45,
      total: 78,
      grade: 'B',
      classAverage: 66.1,
      position: '8th / 38',
      teacherRemark: 'Active participant in school farm crop cultivation exercises.',
      tutor: 'Mr. S. Balogun'
    },
    {
      subject: 'French Language',
      ca1: 15,
      ca2: 16,
      exam: 41,
      total: 72,
      grade: 'B',
      classAverage: 61.5,
      position: '9th / 38',
      teacherRemark: 'Good pronunciation; needs to practice past-tense conjugation.',
      tutor: 'Madame E. Dupont'
    }
  ],
  child_2: [
    {
      subject: 'Mathematics',
      ca1: 18,
      ca2: 19,
      exam: 53,
      total: 90,
      grade: 'A+',
      classAverage: 72.0,
      position: '2nd / 32',
      teacherRemark: 'Brilliant speed in long division and fractions arithmetic.',
      tutor: 'Mr. Adeleke'
    },
    {
      subject: 'English & Grammar',
      ca1: 19,
      ca2: 20,
      exam: 55,
      total: 94,
      grade: 'A+',
      classAverage: 74.5,
      position: '1st / 32',
      teacherRemark: 'Superb creative writing and spelling mastery.',
      tutor: 'Mrs. Williams'
    },
    {
      subject: 'Elementary Science',
      ca1: 17,
      ca2: 18,
      exam: 48,
      total: 83,
      grade: 'A',
      classAverage: 70.2,
      position: '4th / 32',
      teacherRemark: 'Curious and enthusiastic about animal habitats and botany.',
      tutor: 'Mr. Adeleke'
    }
  ],
  child_3: [
    {
      subject: 'Literacy & Phonics',
      ca1: 20,
      ca2: 19,
      exam: 56,
      total: 95,
      grade: 'A+',
      classAverage: 80.0,
      position: '1st / 24',
      teacherRemark: 'Recognizes full letter blends and reads simple short stories fluently.',
      tutor: 'Miss Lawson'
    },
    {
      subject: 'Numeracy & Shapes',
      ca1: 19,
      ca2: 18,
      exam: 54,
      total: 91,
      grade: 'A+',
      classAverage: 78.5,
      position: '2nd / 24',
      teacherRemark: 'Excels in counting up to 100 and basic addition.',
      tutor: 'Miss Lawson'
    }
  ]
};

const ASSIGNMENTS_LIST: Record<string, AssignmentItem[]> = {
  child_1: [
    {
      id: 'asg_1',
      subject: 'Mathematics',
      title: 'Quadratic Factorization & Graph Plotting Ex. 4B',
      dueDate: 'Friday, 24 Oct 2026',
      status: 'Submitted',
      score: '19 / 20',
      teacherFeedback: 'Superb solution steps. Remember to label the y-intercept axis.'
    },
    {
      id: 'asg_2',
      subject: 'Basic Science & Technology',
      title: 'Lab Report: Ohm\'s Law Series & Parallel Resistance Circuit',
      dueDate: 'Monday, 27 Oct 2026',
      status: 'Graded',
      score: '20 / 20',
      teacherFeedback: 'Flawless calculations and well-annotated circuit schematic diagrams.'
    },
    {
      id: 'asg_3',
      subject: 'English Studies',
      title: 'Essay: The Impact of Renewable Solar Energy on Rural Nigeria',
      dueDate: 'Wednesday, 29 Oct 2026',
      status: 'Pending'
    },
    {
      id: 'asg_4',
      subject: 'Robotics & Computer Studies',
      title: 'Python Script: Ultrasonic Distance Sensor with LED Indicator',
      dueDate: 'Thursday, 30 Oct 2026',
      status: 'Pending'
    }
  ],
  child_2: [
    {
      id: 'asg_5',
      subject: 'Mathematics',
      title: 'Fraction Word Problems & LCM Worksheet',
      dueDate: 'Friday, 24 Oct 2026',
      status: 'Graded',
      score: '10 / 10',
      teacherFeedback: 'Perfect score!'
    }
  ],
  child_3: [
    {
      id: 'asg_6',
      subject: 'Literacy & Phonics',
      title: 'Sight Words Coloring & Sentence Tracing',
      dueDate: 'Monday, 27 Oct 2026',
      status: 'Graded',
      score: 'Star ⭐️⭐️⭐️',
      teacherFeedback: 'Very neat handwriting!'
    }
  ]
};

export const ParentAcademicsView: React.FC<ParentAcademicsViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Academics</h1>
          <p className="text-sm text-slate-500 mt-1">Your children's subject grades, assignments, and exam timetable will appear here once the school publishes results to the parent portal.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No academic data yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Results and assignments appear once the school records and publishes them for the current term.</p>
        </div>
      </div>
    );
  }
  const [selectedChildId, setSelectedChildId] = useState<string>('child_1');
  const [activeSubTab, setActiveSubTab] = useState<'grades' | 'homework' | 'timetable' | 'affective'>('grades');
  const [selectedTerm, setSelectedTerm] = useState('First Term 2026/2027');

  const children = [
    { id: 'child_1', name: 'Nathan Bello', classArm: 'JSS 2A', average: 84.6, position: '4th / 38', homeworkRate: '96%' },
    { id: 'child_2', name: 'Chidera Bello', classArm: 'Primary 4B', average: 88.2, position: '2nd / 32', homeworkRate: '98%' },
    { id: 'child_3', name: 'Somto Bello', classArm: 'Nursery 2A', average: 92.5, position: '1st / 24', homeworkRate: '100%' }
  ];

  const currentChild = children.find(c => c.id === selectedChildId) || children[0];
  const currentSubjects = ACADEMIC_SUBJECTS[selectedChildId] || ACADEMIC_SUBJECTS.child_1;
  const currentAssignments = ASSIGNMENTS_LIST[selectedChildId] || ASSIGNMENTS_LIST.child_1;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px] uppercase tracking-wide">
              Academic Performance & Continuous Assessment
            </span>
            <span className="text-xs text-slate-400 font-medium">SmartMark Verified Grading</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Ward Academic Scores & Terminal Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View itemized Continuous Assessment (CA1, CA2), examination scores, homework submissions, and teacher evaluations.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenModal('result_checker', currentChild)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-indigo-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Online Result Checker (PIN)</span>
          </button>

          <button
            onClick={() => onOpenModal('report_card', currentChild)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official Report Card (PDF)</span>
          </button>
        </div>
      </div>

      {/* Child Selector & Term Dropdown Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {children.map((child) => {
            const isSelected = selectedChildId === child.id;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{child.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {child.classArm}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap">Academic Session:</span>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="First Term 2026/2027">First Term 2026/2027 (Current)</option>
            <option value="Third Term 2025/2026">Third Term 2025/2026</option>
            <option value="Second Term 2025/2026">Second Term 2025/2026</option>
            <option value="First Term 2025/2026">First Term 2025/2026</option>
          </select>
        </div>
      </div>

      {/* 4 Stat Overview Cards for Selected Child */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Term Average */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Cumulative Term Average</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-0.5">{currentChild.average}%</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Grade Distinction (A)
            </p>
          </div>
        </div>

        {/* Card 2: Position */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Class Standing</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{currentChild.position}</p>
            <p className="text-[11px] text-purple-600 font-semibold mt-0.5">
              Top 10% Academic Decile
            </p>
          </div>
        </div>

        {/* Card 3: Subjects Passed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Subject Pass Rate</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{currentSubjects.length} / {currentSubjects.length}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              100% Credit & Distinction Passes
            </p>
          </div>
        </div>

        {/* Card 4: Homework Completion */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Homework & CA Turn-in</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{currentChild.homeworkRate}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              Consistently submitted on time
            </p>
          </div>
        </div>

      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveSubTab('grades')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'grades'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Subject Grades & Continuous Assessment</span>
        </button>

        <button
          onClick={() => setActiveSubTab('homework')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'homework'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Assignments & Homework ({currentAssignments.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('timetable')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'timetable'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Examination Timetable & Syllabus</span>
        </button>

        <button
          onClick={() => setActiveSubTab('affective')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'affective'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Behavioral & Affective Domain</span>
        </button>
      </div>

      {/* SUB-TAB 1: SUBJECT GRADES & CA */}
      {activeSubTab === 'grades' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Itemized Grade Ledger for {currentChild.name} ({selectedTerm})
              </h3>
              <p className="text-xs text-slate-500">Grading scale: CA1 (20) + CA2 (20) + Examination (60) = Total Score (100).</p>
            </div>

            <button
              onClick={() => onOpenModal('report_card', currentChild)}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-indigo-200 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Preview Official Report Card</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">Subject & Tutor</th>
                  <th className="py-3 px-2 text-center">CA 1 (20)</th>
                  <th className="py-3 px-2 text-center">CA 2 (20)</th>
                  <th className="py-3 px-2 text-center">Exam (60)</th>
                  <th className="py-3 px-2 text-center">Total (100)</th>
                  <th className="py-3 px-2 text-center">Grade</th>
                  <th className="py-3 px-2 text-center">Class Avg</th>
                  <th className="py-3 px-2 text-center">Position</th>
                  <th className="py-3 px-3">Tutor Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {currentSubjects.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div>{sub.subject}</div>
                      <div className="text-[10.5px] text-slate-400 font-normal">{sub.tutor}</div>
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-semibold text-slate-800">
                      {sub.ca1}
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-semibold text-slate-800">
                      {sub.ca2}
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-semibold text-slate-800">
                      {sub.exam}
                    </td>

                    <td className="py-3 px-2 text-center font-mono font-extrabold text-indigo-600 text-sm">
                      {sub.total}
                    </td>

                    <td className="py-3 px-2 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                        sub.grade === 'A+' || sub.grade === 'A'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.grade === 'B'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sub.grade}
                      </span>
                    </td>

                    <td className="py-3 px-2 text-center text-slate-500 font-mono">
                      {sub.classAverage}%
                    </td>

                    <td className="py-3 px-2 text-center font-bold text-slate-800">
                      {sub.position}
                    </td>

                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      {sub.teacherRemark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HOMEWORK & ASSIGNMENTS */}
      {activeSubTab === 'homework' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Assigned Homework, Projects & Quizzes</h3>
              <p className="text-xs text-slate-500">Track tasks assigned on the Skuggle Student Portal with teacher feedback.</p>
            </div>
          </div>

          <div className="space-y-3">
            {currentAssignments.map((asg) => (
              <div key={asg.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {asg.subject}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{asg.title}</h4>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10.5px] ${
                    asg.status === 'Graded'
                      ? 'bg-emerald-100 text-emerald-800'
                      : asg.status === 'Submitted'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {asg.status} {asg.score ? `(${asg.score})` : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Due Date: <strong className="text-slate-800">{asg.dueDate}</strong></span>
                  {asg.teacherFeedback && (
                    <span className="text-slate-700 italic">Teacher Feedback: "{asg.teacherFeedback}"</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EXAM TIMETABLE & SYLLABUS */}
      {activeSubTab === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">First Term Terminal Examination Schedule</h3>
              <p className="text-xs text-slate-500">Standard venue and invigilation timetable for {currentChild.classArm}.</p>
            </div>
            <button
              onClick={() => {
                feedbackBus.success('Official examination timetable PDF downloaded!');
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Exam Schedule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Monday, 24 Nov 2026</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10.5px]">Morning Session</span>
              </div>
              <p className="text-slate-700">09:00 AM - 11:30 AM: <strong>Mathematics Paper I & II</strong></p>
              <p className="text-slate-500 text-[11px]">Venue: Main Examination Hall • Required: Mathematical Set & Calculator</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Tuesday, 25 Nov 2026</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10.5px]">Morning Session</span>
              </div>
              <p className="text-slate-700">09:00 AM - 11:30 AM: <strong>English Studies (Comprehension & Essay)</strong></p>
              <p className="text-slate-500 text-[11px]">Venue: Main Examination Hall</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Wednesday, 26 Nov 2026</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10.5px]">Morning Session</span>
              </div>
              <p className="text-slate-700">09:00 AM - 11:00 AM: <strong>Basic Science & Technology</strong></p>
              <p className="text-slate-500 text-[11px]">Venue: Science Lab Suite 2</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Thursday, 27 Nov 2026</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10.5px]">Practical Lab</span>
              </div>
              <p className="text-slate-700">09:00 AM - 11:00 AM: <strong>Computer Studies / Robotics Practical</strong></p>
              <p className="text-slate-500 text-[11px]">Venue: STEM ICT Suite</p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AFFECTIVE & BEHAVIORAL DOMAIN */}
      {activeSubTab === 'affective' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Affective & Psychomotor Behavioral Evaluation</h3>
            <p className="text-xs text-slate-500">Graded by Class Form Tutor on a 5-point scale (5 = Excellent, 1 = Needs Improvement).</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Punctuality & Regularity</p>
                <p className="text-[10.5px] text-slate-400">Arrival and lesson timeliness</p>
              </div>
              <span className="text-base font-extrabold text-emerald-600">5 / 5 ★★★★★</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Neatness & Uniform Compliance</p>
                <p className="text-[10.5px] text-slate-400">Turnout and desk hygiene</p>
              </div>
              <span className="text-base font-extrabold text-emerald-600">5 / 5 ★★★★★</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Leadership & Initiative</p>
                <p className="text-[10.5px] text-slate-400">Class discussions & sports</p>
              </div>
              <span className="text-base font-extrabold text-emerald-600">5 / 5 ★★★★★</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Politeness & Relationship with Peers</p>
                <p className="text-[10.5px] text-slate-400">Respectful demeanor</p>
              </div>
              <span className="text-base font-extrabold text-indigo-600">4 / 5 ★★★★☆</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Emotional Stability & Focus</p>
                <p className="text-[10.5px] text-slate-400">Attentiveness during lectures</p>
              </div>
              <span className="text-base font-extrabold text-indigo-600">4 / 5 ★★★★☆</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Sports & Psychomotor Agility</p>
                <p className="text-[10.5px] text-slate-400">Physical education & games</p>
              </div>
              <span className="text-base font-extrabold text-emerald-600">5 / 5 ★★★★★</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
