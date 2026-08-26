import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Sparkles,
  Camera,
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  Upload,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Trash2,
  Eye,
  FileText,
  ChevronDown,
  Users,
  Building,
  Save,
  Send,
  HelpCircle,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Printer,
  ChevronRight,
  RefreshCw,
  Sliders,
  Check,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface TeacherAssessmentsViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface AssessmentItem {
  id: string;
  title: string;
  subject: string;
  classArm: string;
  type: 'CA 1' | 'CA 2' | 'Mid-Term CA' | 'Project / Lab' | 'Terminal Exam' | 'Weekly Quiz';
  maxScore: number;
  weightPercent: number;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
  status: 'Marking Complete' | 'Marking in Progress' | 'Draft' | 'Submitted for Approval' | 'Published';
  avgScore: number;
  mode: 'SmartMark OMR' | 'Paper Script' | 'Online CBT' | 'Project Submission';
}

interface StudentGradeRecord {
  id: string;
  admNo: string;
  name: string;
  photo: string;
  ca1: number; // /10
  ca2: number; // /10
  project: number; // /10
  midterm: number; // /10
  exam: number; // /60
  remarks: string;
  attendanceRate: number;
}

const INITIAL_ASSESSMENTS: AssessmentItem[] = [
  {
    id: 'asm_1',
    title: 'Algebraic Fractions & Simultaneous Equations',
    subject: 'Mathematics',
    classArm: 'JSS 2A',
    type: 'CA 1',
    maxScore: 20,
    weightPercent: 10,
    dueDate: '2026-10-14',
    submittedCount: 38,
    totalStudents: 38,
    status: 'Marking Complete',
    avgScore: 78.4,
    mode: 'SmartMark OMR'
  },
  {
    id: 'asm_2',
    title: 'Plane Geometry & Angle Theorems Test',
    subject: 'Mathematics',
    classArm: 'JSS 2A',
    type: 'CA 2',
    maxScore: 20,
    weightPercent: 10,
    dueDate: '2026-10-28',
    submittedCount: 38,
    totalStudents: 38,
    status: 'Marking in Progress',
    avgScore: 71.2,
    mode: 'SmartMark OMR'
  },
  {
    id: 'asm_3',
    title: 'Geometric Constructions Practical Portfolio',
    subject: 'Mathematics',
    classArm: 'JSS 2A',
    type: 'Project / Lab',
    maxScore: 20,
    weightPercent: 10,
    dueDate: '2026-11-10',
    submittedCount: 35,
    totalStudents: 38,
    status: 'Marking in Progress',
    avgScore: 82.0,
    mode: 'Project Submission'
  },
  {
    id: 'asm_4',
    title: 'First Term Mid-Term Unified Examination',
    subject: 'Mathematics',
    classArm: 'JSS 2A',
    type: 'Mid-Term CA',
    maxScore: 40,
    weightPercent: 10,
    dueDate: '2026-11-18',
    submittedCount: 38,
    totalStudents: 38,
    status: 'Submitted for Approval',
    avgScore: 73.5,
    mode: 'Paper Script'
  },
  {
    id: 'asm_5',
    title: 'Terminal Unified Promotion Examination (Mock)',
    subject: 'Mathematics',
    classArm: 'JSS 2A',
    type: 'Terminal Exam',
    maxScore: 100,
    weightPercent: 60,
    dueDate: '2026-12-05',
    submittedCount: 0,
    totalStudents: 38,
    status: 'Draft',
    avgScore: 0,
    mode: 'SmartMark OMR'
  },
  {
    id: 'asm_6',
    title: 'Calculus & Differential Equations Test',
    subject: 'Further Mathematics',
    classArm: 'SSS 1 Diamond',
    type: 'CA 1',
    maxScore: 30,
    weightPercent: 10,
    dueDate: '2026-10-18',
    submittedCount: 32,
    totalStudents: 32,
    status: 'Marking Complete',
    avgScore: 84.6,
    mode: 'Online CBT'
  },
  {
    id: 'asm_7',
    title: 'Vectors & Mechanics Quiz 1',
    subject: 'Further Mathematics',
    classArm: 'SSS 1 Diamond',
    type: 'Weekly Quiz',
    maxScore: 15,
    weightPercent: 5,
    dueDate: '2026-10-25',
    submittedCount: 32,
    totalStudents: 32,
    status: 'Marking Complete',
    avgScore: 79.1,
    mode: 'SmartMark OMR'
  }
];

const INITIAL_GRADEBOOK: StudentGradeRecord[] = [
  {
    id: 'g_1',
    admNo: 'RGA26/1001',
    name: 'Aarav Johnson',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    ca1: 9,
    ca2: 8,
    project: 9,
    midterm: 8,
    exam: 52,
    remarks: 'Demonstrates exceptional problem-solving agility in algebraic equations.',
    attendanceRate: 98
  },
  {
    id: 'g_2',
    admNo: 'RGA26/1002',
    name: 'Amina Bello',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    ca1: 10,
    ca2: 9,
    project: 10,
    midterm: 9,
    exam: 56,
    remarks: 'Consistent top tier mathematical mastery. Highly commended.',
    attendanceRate: 100
  },
  {
    id: 'g_3',
    admNo: 'RGA26/1003',
    name: 'Chukwudi Okafor',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    ca1: 7,
    ca2: 6,
    project: 8,
    midterm: 7,
    exam: 44,
    remarks: 'Good progress. Needs closer attention on geometric angle theorem proofs.',
    attendanceRate: 94
  },
  {
    id: 'g_4',
    admNo: 'RGA26/1004',
    name: 'Damilola Adeleke',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    ca1: 8,
    ca2: 9,
    project: 8,
    midterm: 8,
    exam: 49,
    remarks: 'Very diligent and neat presentation of mathematical steps.',
    attendanceRate: 96
  },
  {
    id: 'g_5',
    admNo: 'RGA26/1005',
    name: 'Emmanuel Eze',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    ca1: 6,
    ca2: 5,
    project: 7,
    midterm: 6,
    exam: 38,
    remarks: 'Requires supplementary clinic sessions for fractions and quadratic roots.',
    attendanceRate: 88
  },
  {
    id: 'g_6',
    admNo: 'RGA26/1006',
    name: 'Fatima Abubakar',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    ca1: 9,
    ca2: 8,
    project: 9,
    midterm: 9,
    exam: 51,
    remarks: 'Sharp analytical intuition and active in class discussions.',
    attendanceRate: 98
  },
  {
    id: 'g_7',
    admNo: 'RGA26/1007',
    name: 'Gabriel Okon',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    ca1: 8,
    ca2: 7,
    project: 8,
    midterm: 7,
    exam: 46,
    remarks: 'Solid grasp of core curriculum. Keep maintaining the high momentum.',
    attendanceRate: 95
  },
  {
    id: 'g_8',
    admNo: 'RGA26/1008',
    name: 'Hauwa Ibrahim',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    ca1: 9,
    ca2: 9,
    project: 10,
    midterm: 9,
    exam: 54,
    remarks: 'Brilliant conceptual depth. High aptitude for further mathematics.',
    attendanceRate: 100
  },
  {
    id: 'g_9',
    admNo: 'RGA26/1009',
    name: 'Ifeanyi Nnamdi',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    ca1: 5,
    ca2: 6,
    project: 6,
    midterm: 5,
    exam: 34,
    remarks: 'Attention needed on quadratic graphs and homework consistency.',
    attendanceRate: 85
  },
  {
    id: 'g_10',
    admNo: 'RGA26/1010',
    name: 'Joy Danjuma',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    ca1: 8,
    ca2: 8,
    project: 9,
    midterm: 8,
    exam: 48,
    remarks: 'Dependable student with sound logical reasoning capabilities.',
    attendanceRate: 97
  }
];

const TOPIC_MASTERY_DATA = [
  { topic: 'Algebraic Fractions', mastery: 86, fullMark: 100 },
  { topic: 'Quadratic Equations', mastery: 74, fullMark: 100 },
  { topic: 'Trigonometric Ratios', mastery: 62, fullMark: 100 },
  { topic: 'Plane Geometry & Theorems', mastery: 69, fullMark: 100 },
  { topic: 'Statistics & Frequency Tables', mastery: 91, fullMark: 100 },
  { topic: 'Geometric Constructions', mastery: 84, fullMark: 100 }
];

const GRADE_DISTRIBUTION_DATA = [
  { grade: 'A1 (75-100%)', count: 14, fill: '#10B981' },
  { grade: 'B2 (70-74%)', count: 8, fill: '#3B82F6' },
  { grade: 'B3 (65-69%)', count: 7, fill: '#6366F1' },
  { grade: 'C4-C6 (50-64%)', count: 6, fill: '#F59E0B' },
  { grade: 'D7-E8 (40-49%)', count: 2, fill: '#EC4899' },
  { grade: 'F9 (0-39%)', count: 1, fill: '#EF4444' }
];

export const TeacherAssessmentsView: React.FC<TeacherAssessmentsViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'assessments' | 'gradebook' | 'analytics'>('assessments');
  const [selectedClass, setSelectedClass] = useState('JSS 2A');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  
  const [assessments, setAssessments] = useState<AssessmentItem[]>(INITIAL_ASSESSMENTS);
  const [gradebook, setGradebook] = useState<StudentGradeRecord[]>(INITIAL_GRADEBOOK);
  
  // Create New Assessment Drawer/Modal state
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    type: 'CA 1' as AssessmentItem['type'],
    maxScore: 20,
    weightPercent: 10,
    dueDate: '2026-11-20',
    mode: 'SmartMark OMR' as AssessmentItem['mode']
  });

  // Calculate student totals and grades
  const calculateTotal = (rec: StudentGradeRecord) => {
    const totalCa = (rec.ca1 || 0) + (rec.ca2 || 0) + (rec.project || 0) + (rec.midterm || 0); // /40
    const examScore = rec.exam || 0; // /60
    return totalCa + examScore;
  };

  const getGradeDetails = (total: number) => {
    if (total >= 75) return { grade: 'A1', label: 'Excellent', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (total >= 70) return { grade: 'B2', label: 'Very Good', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (total >= 65) return { grade: 'B3', label: 'Good', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    if (total >= 60) return { grade: 'C4', label: 'Credit', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (total >= 55) return { grade: 'C5', label: 'Credit', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (total >= 50) return { grade: 'C6', label: 'Credit', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (total >= 45) return { grade: 'D7', label: 'Pass', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    if (total >= 40) return { grade: 'E8', label: 'Pass', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    return { grade: 'F9', label: 'Fail', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  // Inline Gradebook Update Handler
  const handleScoreChange = (id: string, field: 'ca1' | 'ca2' | 'project' | 'midterm' | 'exam' | 'remarks', value: string | number) => {
    setGradebook((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (field === 'remarks') {
            return { ...item, remarks: String(value) };
          }
          const numVal = Math.max(0, Number(value) || 0);
          return { ...item, [field]: numVal };
        }
        return item;
      })
    );
  };

  const handleSaveGradebook = () => {
    feedbackBus.success('Gradebook changes saved successfully! All terminal percentages updated.');
  };

  const handleSubmitHOD = () => {
    feedbackBus.success('Scores successfully submitted to HOD Mathematics for terminal approval!');
  };

  const handleAddAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssessment.title.trim()) return;

    const created: AssessmentItem = {
      id: `asm_${Date.now()}`,
      title: newAssessment.title,
      subject: selectedSubject,
      classArm: selectedClass,
      type: newAssessment.type,
      maxScore: newAssessment.maxScore,
      weightPercent: newAssessment.weightPercent,
      dueDate: newAssessment.dueDate,
      submittedCount: 0,
      totalStudents: 38,
      status: 'Draft',
      avgScore: 0,
      mode: newAssessment.mode
    };

    setAssessments([created, ...assessments]);
    setIsCreatingAssessment(false);
    setNewAssessment({
      title: '',
      type: 'CA 1',
      maxScore: 20,
      weightPercent: 10,
      dueDate: '2026-11-20',
      mode: 'SmartMark OMR'
    });
    feedbackBus.success(`New assessment "${created.title}" registered successfully!`);
  };

  // Filtered Assessments
  const filteredAssessments = assessments.filter((a) => {
    const matchesClass = a.classArm === selectedClass;
    const matchesType = filterType === 'All' || a.type === filterType;
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesType && matchesSearch;
  });

  // Calculate sorted rankings for gradebook
  const sortedGradebook = [...gradebook].sort((a, b) => calculateTotal(b) - calculateTotal(a));

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Assessments</h1>
          <p className="text-sm text-slate-500 mt-1">Assessment records and gradebooks will appear once your school has set up classes and you start recording scores.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <CheckSquare className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No assessments yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Create an assessment to start recording CA scores and building your gradebook.</p>
          <button
            type="button"
            onClick={() => onOpenModal('ai_lesson')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" /> Create first assessment
          </button>
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
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] uppercase tracking-wide">
              Teacher Assessment Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">Session: 2026/2027 • First Term</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Assessments & Continuous Assessment Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage test papers, record CA 40% scores, terminal exams, SmartMark OMR grading, and item mastery.
          </p>
        </div>

        {/* Global Controls */}
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
              <option value="JSS 2A">JSS 2A (38 Students)</option>
              <option value="JSS 2B">JSS 2B (36 Students)</option>
              <option value="SSS 1 Diamond">SSS 1 Diamond (32 Students)</option>
              <option value="SSS 2 Gold">SSS 2 Gold (28 Students)</option>
            </select>
          </div>

          {/* Subject Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs text-xs">
            <span className="text-slate-400 mr-1.5 font-medium">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Further Mathematics">Further Mathematics</option>
              <option value="Physics">Physics</option>
            </select>
          </div>

          {/* Launch SmartMark Camera Scanner */}
          <button
            id="btn-teacher-smartmark-scan"
            onClick={() => onOpenModal('smartmark_scan', { classArm: selectedClass, subject: selectedSubject })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>SmartMark OMR Scan</span>
          </button>

          {/* AI Quiz Generator */}
          <button
            id="btn-teacher-ai-quiz"
            onClick={() => onOpenModal('ai_lesson', { topic: `${selectedClass} ${selectedSubject} Assessment Test` })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Quiz Generator</span>
          </button>

          {/* Create Assessment Button */}
          <button
            id="btn-create-new-assessment"
            onClick={() => setIsCreatingAssessment(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Assessment</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Term Assessments</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckSquare className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">5 Total</p>
            <p className="text-[11px] text-slate-500 mt-0.5">3 CAs • 1 Project • 1 Terminal</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Class Average Score</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">74.8%</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">↑ 4.2% higher than class target (70%)</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Marking Queue</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">18 Scripts</p>
            <p className="text-[11px] text-purple-600 font-semibold mt-0.5">CA 2 & Practical Geometry</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">CA Progress Filled</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-extrabold text-slate-900 tracking-tight">30 / 40 Pts</p>
              <span className="text-xs font-bold text-amber-600">75%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            id="tab-sub-assessments-list"
            onClick={() => setActiveSubTab('assessments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'assessments'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Assessments & Tests List</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubTab === 'assessments' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {filteredAssessments.length}
            </span>
          </button>

          <button
            id="tab-sub-gradebook"
            onClick={() => setActiveSubTab('gradebook')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'gradebook'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Interactive Gradebook (CA + Exam)</span>
          </button>

          <button
            id="tab-sub-analytics"
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Item Analysis & Mastery Radar</span>
          </button>
        </div>

        {/* Quick Utilities */}
        <div className="flex items-center gap-2 pr-1">
          <button
            onClick={() => onOpenModal('report_card', { classArm: selectedClass })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Terminal Broadsheet</span>
          </button>
        </div>
      </div>

      {/* CREATE NEW ASSESSMENT MODAL / DRAWER */}
      {isCreatingAssessment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Assessment</h3>
                  <p className="text-xs text-slate-500">{selectedClass} • {selectedSubject}</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatingAssessment(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAssessment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Simultaneous Equations & Word Problems Test"
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assessment Category</label>
                  <select
                    value={newAssessment.type}
                    onChange={(e) => setNewAssessment({ ...newAssessment, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="CA 1">Continuous Assessment 1 (10%)</option>
                    <option value="CA 2">Continuous Assessment 2 (10%)</option>
                    <option value="Project / Lab">Project / Practical Portfolio (10%)</option>
                    <option value="Mid-Term CA">Mid-Term Unified Test (10%)</option>
                    <option value="Terminal Exam">Terminal Examination (60%)</option>
                    <option value="Weekly Quiz">Weekly Pop Quiz (Formative)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marking & Delivery Mode</label>
                  <select
                    value={newAssessment.mode}
                    onChange={(e) => setNewAssessment({ ...newAssessment, mode: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="SmartMark OMR">📷 SmartMark Optical OMR Sheet</option>
                    <option value="Paper Script">✍️ Traditional Paper Theory Script</option>
                    <option value="Online CBT">💻 Online Computer-Based Test (CBT)</option>
                    <option value="Project Submission">📁 File / Project Portfolio Submission</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Raw Marks</label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={newAssessment.maxScore}
                    onChange={(e) => setNewAssessment({ ...newAssessment, maxScore: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Term Weight (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={newAssessment.weightPercent}
                    onChange={(e) => setNewAssessment({ ...newAssessment, weightPercent: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    value={newAssessment.dueDate}
                    onChange={(e) => setNewAssessment({ ...newAssessment, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingAssessment(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                >
                  Create & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: ASSESSMENTS LIST */}
      {activeSubTab === 'assessments' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search assessment title or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Type:</span>
              {['All', 'CA 1', 'CA 2', 'Mid-Term CA', 'Project / Lab', 'Terminal Exam'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    filterType === t
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Assessment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssessments.map((asm) => (
              <div
                key={asm.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-indigo-100 transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[10.5px]">
                      {asm.type} ({asm.weightPercent}%)
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                      asm.status === 'Marking Complete'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : asm.status === 'Marking in Progress'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : asm.status === 'Submitted for Approval'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {asm.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug line-clamp-2">
                    {asm.title}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{asm.classArm} • {asm.subject}</span>
                      </span>
                      <span className="font-semibold text-slate-700">Max: {asm.maxScore} pts</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: {asm.dueDate}</span>
                      </span>
                      <span className="font-medium text-indigo-600">{asm.mode}</span>
                    </div>
                  </div>

                  {/* Submission Progress bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                      <span className="text-slate-500">Submissions Graded</span>
                      <span className="text-slate-900">{asm.submittedCount} / {asm.totalStudents} ({Math.round((asm.submittedCount / asm.totalStudents) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${(asm.submittedCount / asm.totalStudents) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  {asm.mode === 'SmartMark OMR' ? (
                    <button
                      onClick={() => onOpenModal('smartmark_scan', { assessmentTitle: asm.title, classArm: asm.classArm })}
                      className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Scan OMR Sheet</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveSubTab('gradebook')}
                      className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Enter Scores</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveSubTab('analytics')}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
                    title="Item Analysis"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INTERACTIVE GRADEBOOK & CA LEDGER */}
      {activeSubTab === 'gradebook' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <span>{selectedClass} Terminal Continuous Assessment & Exam Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official WAEC / NERDC 40% Continuous Assessment + 60% Exam grading sheet with instant ranking and remark generation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveGradebook}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </button>

              <button
                onClick={handleSubmitHOD}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit to HOD</span>
              </button>

              <button
                onClick={() => {
                  const headers = 'AdmNo,Name,CA1,CA2,Project,Midterm,TotalCA,Exam,OverallTotal,Grade,Remarks\n';
                  const rows = gradebook.map((g) => {
                    const total = calculateTotal(g);
                    const grade = getGradeDetails(total);
                    return `"${g.admNo}","${g.name}",${g.ca1},${g.ca2},${g.project},${g.midterm},${g.ca1+g.ca2+g.project+g.midterm},${g.exam},${total},"${grade.grade}","${g.remarks}"`;
                  }).join('\n');
                  const blob = new Blob([headers + rows], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedClass}_${selectedSubject}_Gradebook.csv`;
                  a.click();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Gradebook Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">Pos</th>
                  <th className="py-3 px-3">Student Details</th>
                  <th className="py-3 px-2 text-center bg-indigo-50/50 border-x border-slate-200">
                    CA 1 <span className="block text-[9px] font-medium text-indigo-600">/10</span>
                  </th>
                  <th className="py-3 px-2 text-center bg-indigo-50/50 border-r border-slate-200">
                    CA 2 <span className="block text-[9px] font-medium text-indigo-600">/10</span>
                  </th>
                  <th className="py-3 px-2 text-center bg-indigo-50/50 border-r border-slate-200">
                    Proj <span className="block text-[9px] font-medium text-indigo-600">/10</span>
                  </th>
                  <th className="py-3 px-2 text-center bg-indigo-50/50 border-r border-slate-200">
                    Mid-T <span className="block text-[9px] font-medium text-indigo-600">/10</span>
                  </th>
                  <th className="py-3 px-2 text-center font-extrabold text-indigo-900 bg-indigo-100/40 border-r border-slate-200">
                    Total CA <span className="block text-[9px] font-bold text-indigo-700">/40</span>
                  </th>
                  <th className="py-3 px-2 text-center bg-purple-50/50 border-r border-slate-200">
                    Exam <span className="block text-[9px] font-medium text-purple-600">/60</span>
                  </th>
                  <th className="py-3 px-3 text-center font-extrabold text-slate-900 bg-slate-100 border-r border-slate-200">
                    Total <span className="block text-[9px] font-bold text-slate-600">/100</span>
                  </th>
                  <th className="py-3 px-2 text-center border-r border-slate-200">Grade</th>
                  <th className="py-3 px-3 min-w-[220px]">Teacher's Formative Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {sortedGradebook.map((student, idx) => {
                  const totalCa = student.ca1 + student.ca2 + student.project + student.midterm;
                  const total = calculateTotal(student);
                  const grade = getGradeDetails(total);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-extrabold text-slate-900">
                        #{idx + 1}
                      </td>
                      
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.photo}
                            alt={student.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{student.name}</p>
                            <p className="text-[10px] text-slate-400">{student.admNo}</p>
                          </div>
                        </div>
                      </td>

                      {/* CA 1 (/10) */}
                      <td className="py-2 px-1 text-center bg-indigo-50/20 border-x border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={student.ca1}
                          onChange={(e) => handleScoreChange(student.id, 'ca1', e.target.value)}
                          className="w-12 text-center bg-white border border-slate-200 rounded-lg py-1 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </td>

                      {/* CA 2 (/10) */}
                      <td className="py-2 px-1 text-center bg-indigo-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={student.ca2}
                          onChange={(e) => handleScoreChange(student.id, 'ca2', e.target.value)}
                          className="w-12 text-center bg-white border border-slate-200 rounded-lg py-1 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </td>

                      {/* Project (/10) */}
                      <td className="py-2 px-1 text-center bg-indigo-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={student.project}
                          onChange={(e) => handleScoreChange(student.id, 'project', e.target.value)}
                          className="w-12 text-center bg-white border border-slate-200 rounded-lg py-1 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </td>

                      {/* Midterm (/10) */}
                      <td className="py-2 px-1 text-center bg-indigo-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={student.midterm}
                          onChange={(e) => handleScoreChange(student.id, 'midterm', e.target.value)}
                          className="w-12 text-center bg-white border border-slate-200 rounded-lg py-1 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </td>

                      {/* Total CA (/40) */}
                      <td className="py-2 px-2 text-center font-extrabold text-indigo-900 bg-indigo-50/60 border-r border-slate-200">
                        {totalCa}
                      </td>

                      {/* Exam (/60) */}
                      <td className="py-2 px-1 text-center bg-purple-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={student.exam}
                          onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
                          className="w-14 text-center bg-white border border-purple-200 rounded-lg py-1 font-bold text-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                        />
                      </td>

                      {/* Overall Total (/100) */}
                      <td className="py-2 px-2 text-center font-extrabold text-sm text-slate-900 bg-slate-50 border-r border-slate-200">
                        {total}%
                      </td>

                      {/* Letter Grade */}
                      <td className="py-2 px-2 text-center border-r border-slate-100">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg font-extrabold text-[11px] border ${grade.color}`}>
                          {grade.grade}
                        </span>
                      </td>

                      {/* Formative Remarks */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={student.remarks}
                          onChange={(e) => handleScoreChange(student.id, 'remarks', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Showing {gradebook.length} student marks recorded</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>A1: 75%+</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>B2/B3: 65-74%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>C4-C6: 50-64%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>F9: &lt;40%</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ITEM ANALYSIS & TOPIC MASTERY ANALYTICS */}
      {activeSubTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Grade Distribution Bar Chart (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Score & Grade Frequency Distribution</h3>
                <span className="text-xs font-semibold text-slate-500">{selectedClass} • {selectedSubject}</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Analysis of letter grade clusters based on current CA (40%) and Examination results.
              </p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={GRADE_DISTRIBUTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="grade" stroke="#94A3B8" fontSize={10.5} tickLine={false} />
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
                    <Bar dataKey="count" name="Number of Students" radius={[6, 6, 0, 0]}>
                      {GRADE_DISTRIBUTION_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-slate-400 font-medium">Pass Rate (≥50%)</p>
                <p className="text-base font-extrabold text-emerald-600 mt-0.5">92.1%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-slate-400 font-medium">Distinction Rate (A1-B3)</p>
                <p className="text-base font-extrabold text-indigo-600 mt-0.5">76.3%</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-slate-400 font-medium">Remedial Watchlist</p>
                <p className="text-base font-extrabold text-rose-600 mt-0.5">3 Students</p>
              </div>
            </div>
          </div>

          {/* Topic Mastery Radar / Bar Breakdown (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Curriculum Topic Mastery Matrix</h3>
                <span className="text-xs font-bold text-indigo-600">NERDC Aligned</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Real-time comprehension levels deduced from SmartMark assessment questions.
              </p>

              <div className="space-y-3">
                {TOPIC_MASTERY_DATA.map((tm) => (
                  <div key={tm.topic} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{tm.topic}</span>
                      <span className={`font-extrabold ${
                        tm.mastery >= 80 ? 'text-emerald-600' : tm.mastery >= 65 ? 'text-indigo-600' : 'text-amber-600'
                      }`}>
                        {tm.mastery}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          tm.mastery >= 80 ? 'bg-emerald-500' : tm.mastery >= 65 ? 'bg-indigo-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${tm.mastery}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendation Box */}
            <div className="mt-4 pt-3 border-t border-slate-100 p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-start gap-2.5 text-xs text-purple-900">
              <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">AI Diagnostic Recommendation:</p>
                <p className="text-[11.5px] text-purple-800 mt-0.5 leading-relaxed">
                  Students struggled on <strong>Trigonometric Ratios (62%)</strong>, specifically with sine and cosine angle conversions. Consider using interactive geometric sketches before moving to 3D trigonometry.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
