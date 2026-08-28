import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Filter,
  BarChart3,
  Award,
  FileCheck,
  ChevronDown,
  ChevronRight,
  Layers,
  Zap,
  Bell,
  Info,
  Flame,
  ShieldAlert,
  HelpCircle,
  X,
  ExternalLink,
  Target,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StudentRecord, StaffMember, AssessmentRecord } from '../../types';

interface AcademicAndTeacherAnalyticsProps {
  onNavigateTab?: (tab: string) => void;
}

export interface SignificantChangeAlert {
  id: string;
  type: 'spike' | 'dip';
  category: 'subject' | 'class';
  title: string;
  subTitle: string;
  currentPeriodScore: number;
  prevPeriodScore: number;
  delta: number;
  periodLabel: string;
  severity: 'high' | 'moderate';
  keyDriver: string;
  recommendedAction: string;
  affectedStudentsCount: number;
  teacherInCharge: string;
  confidenceScore: number;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Significant Changes Dataset (Sudden Dips & Spikes vs Previous Assessment Period)
// ---------------------------------------------------------------------------
export const significantChangesData: SignificantChangeAlert[] = [
  {
    id: 'sig-001',
    type: 'spike',
    category: 'class',
    title: 'JSS 2 Diamond — Mathematics',
    subTitle: 'Junior Secondary 2 · Flagship Stream',
    currentPeriodScore: 81.5,
    prevPeriodScore: 73.2,
    delta: 8.3,
    periodLabel: 'CA 2 vs CA 1 Period',
    severity: 'high',
    keyDriver: 'SmartMark optical revision drills & peer-led factorisation worksheets in Week 7.',
    recommendedAction: 'Commend Mr. Emmanuel Adeleke and replicate the interactive algebra format in JSS 1.',
    affectedStudentsCount: 38,
    teacherInCharge: 'Mr. Emmanuel Adeleke',
    confidenceScore: 98,
    tags: ['Mathematics', 'STEM', 'Rapid Mastery', 'CA 2 Benchmark'],
  },
  {
    id: 'sig-002',
    type: 'dip',
    category: 'class',
    title: 'JSS 3 Gold — Basic Technology',
    subTitle: 'Junior Secondary 3 · Technical Dept',
    currentPeriodScore: 77.2,
    prevPeriodScore: 84.0,
    delta: -6.8,
    periodLabel: 'CA 2 vs CA 1 Period',
    severity: 'high',
    keyDriver: 'Sudden dip linked to introductory 3D isometric projection theory and orthographic drawing test.',
    recommendedAction: 'Schedule a 2-day practical drafting workshop before terminal mock examinations.',
    affectedStudentsCount: 32,
    teacherInCharge: 'Mr. Emmanuel Adeleke',
    confidenceScore: 94,
    tags: ['Basic Tech', 'Isometric Drawing', 'Intervention Flagged'],
  },
  {
    id: 'sig-003',
    type: 'spike',
    category: 'subject',
    title: 'Basic Science & Laboratory Practice',
    subTitle: 'All Junior Streams (JSS 1 - JSS 3)',
    currentPeriodScore: 82.4,
    prevPeriodScore: 74.8,
    delta: 7.6,
    periodLabel: 'CA 2 vs CA 1 Period',
    severity: 'high',
    keyDriver: 'Hands-on practical apparatus experiments and weekly continuous quizzes logged.',
    recommendedAction: 'Nominate Miss Chidinma Eze for the Term 1 STEM Innovation Faculty Recognition.',
    affectedStudentsCount: 86,
    teacherInCharge: 'Miss Chidinma Eze',
    confidenceScore: 96,
    tags: ['Sciences', 'Laboratory', 'School-wide Spike'],
  },
  {
    id: 'sig-004',
    type: 'dip',
    category: 'class',
    title: 'Primary 5 Emerald — Agricultural Science',
    subTitle: 'Senior Primary Stream',
    currentPeriodScore: 76.5,
    prevPeriodScore: 82.5,
    delta: -6.0,
    periodLabel: 'CA 2 vs CA 1 Period',
    severity: 'moderate',
    keyDriver: 'Crop rotation classification unit test scores were lower due to delayed farm demonstration.',
    recommendedAction: 'Conduct school farm demonstration plot session in Week 11 revision schedule.',
    affectedStudentsCount: 26,
    teacherInCharge: 'Miss Chidinma Eze',
    confidenceScore: 91,
    tags: ['Primary', 'Agric Science', 'Demonstration Needed'],
  },
  {
    id: 'sig-005',
    type: 'spike',
    category: 'subject',
    title: 'Civic Education & Governance',
    subTitle: 'Secondary Streams (JSS & SSS)',
    currentPeriodScore: 85.2,
    prevPeriodScore: 80.1,
    delta: 5.1,
    periodLabel: 'Current Term vs Prev Term',
    severity: 'moderate',
    keyDriver: 'Class debate sessions on Constitution & Citizen Rights drove high retention and test scores.',
    recommendedAction: 'Archive mock debate rubric for upcoming term inter-house symposium.',
    affectedStudentsCount: 110,
    teacherInCharge: 'Mrs. Folashade Adebayo',
    confidenceScore: 97,
    tags: ['Civic', 'Humanities', 'Consistent Surge'],
  },
];

// ---------------------------------------------------------------------------
// Historical & Projected Datasets (Weekly, Multi-Term, Session Comparison)
// ---------------------------------------------------------------------------

// 1. Weekly Student Academic & Teacher Activity over 10 Weeks of Term
const weeklyAnalyticsData = [
  {
    week: 'Week 1',
    shortWeek: 'Wk 1',
    classAvg: 71.2,
    mathAvg: 68.5,
    englishAvg: 73.0,
    scienceAvg: 72.1,
    topQuartile: 86.4,
    passingRate: 88.0,
    lessonPlansSubmitted: 18,
    lessonPlansApproved: 16,
    assessmentsGraded: 4,
    attendanceTimeliness: 91.5,
    activeTeachers: 5,
  },
  {
    week: 'Week 2',
    shortWeek: 'Wk 2',
    classAvg: 72.8,
    mathAvg: 70.2,
    englishAvg: 74.5,
    scienceAvg: 73.8,
    topQuartile: 87.5,
    passingRate: 89.5,
    lessonPlansSubmitted: 20,
    lessonPlansApproved: 19,
    assessmentsGraded: 6,
    attendanceTimeliness: 93.0,
    activeTeachers: 5,
  },
  {
    week: 'Week 3',
    shortWeek: 'Wk 3',
    classAvg: 74.0,
    mathAvg: 71.8,
    englishAvg: 75.2,
    scienceAvg: 75.0,
    topQuartile: 88.9,
    passingRate: 91.0,
    lessonPlansSubmitted: 22,
    lessonPlansApproved: 21,
    assessmentsGraded: 9,
    attendanceTimeliness: 94.8,
    activeTeachers: 5,
  },
  {
    week: 'Week 4',
    shortWeek: 'Wk 4',
    classAvg: 75.5,
    mathAvg: 73.4,
    englishAvg: 76.8,
    scienceAvg: 76.2,
    topQuartile: 90.2,
    passingRate: 92.5,
    lessonPlansSubmitted: 24,
    lessonPlansApproved: 23,
    assessmentsGraded: 14, // CA 1 Testing Period
    attendanceTimeliness: 96.2,
    activeTeachers: 5,
  },
  {
    week: 'Week 5',
    shortWeek: 'Wk 5',
    classAvg: 76.9,
    mathAvg: 75.1,
    englishAvg: 77.5,
    scienceAvg: 78.0,
    topQuartile: 91.4,
    passingRate: 93.8,
    lessonPlansSubmitted: 22,
    lessonPlansApproved: 22,
    assessmentsGraded: 18,
    attendanceTimeliness: 95.0,
    activeTeachers: 5,
  },
  {
    week: 'Week 6 (Mid-Term)',
    shortWeek: 'Wk 6',
    classAvg: 77.8,
    mathAvg: 76.5,
    englishAvg: 78.2,
    scienceAvg: 78.9,
    topQuartile: 92.6,
    passingRate: 94.5,
    lessonPlansSubmitted: 25,
    lessonPlansApproved: 24,
    assessmentsGraded: 26, // Mid-Term Test Submissions
    attendanceTimeliness: 97.4,
    activeTeachers: 5,
  },
  {
    week: 'Week 7',
    shortWeek: 'Wk 7',
    classAvg: 78.4,
    mathAvg: 77.2,
    englishAvg: 79.0,
    scienceAvg: 79.5,
    topQuartile: 93.0,
    passingRate: 95.0,
    lessonPlansSubmitted: 23,
    lessonPlansApproved: 23,
    assessmentsGraded: 12,
    attendanceTimeliness: 96.0,
    activeTeachers: 5,
  },
  {
    week: 'Week 8',
    shortWeek: 'Wk 8',
    classAvg: 79.1,
    mathAvg: 78.0,
    englishAvg: 79.8,
    scienceAvg: 80.2,
    topQuartile: 93.8,
    passingRate: 95.8,
    lessonPlansSubmitted: 24,
    lessonPlansApproved: 24,
    assessmentsGraded: 16, // CA 2 Testing
    attendanceTimeliness: 97.0,
    activeTeachers: 5,
  },
  {
    week: 'Week 9',
    shortWeek: 'Wk 9',
    classAvg: 80.0,
    mathAvg: 79.4,
    englishAvg: 80.5,
    scienceAvg: 81.0,
    topQuartile: 94.5,
    passingRate: 96.4,
    lessonPlansSubmitted: 25,
    lessonPlansApproved: 25,
    assessmentsGraded: 22,
    attendanceTimeliness: 98.2,
    activeTeachers: 5,
  },
  {
    week: 'Week 10 (Current)',
    shortWeek: 'Wk 10',
    classAvg: 80.8,
    mathAvg: 80.1,
    englishAvg: 81.2,
    scienceAvg: 81.8,
    topQuartile: 95.2,
    passingRate: 97.0,
    lessonPlansSubmitted: 26,
    lessonPlansApproved: 26,
    assessmentsGraded: 28, // Terminal Mock & Revision
    attendanceTimeliness: 98.5,
    activeTeachers: 5,
  },
];

// 2. Term-by-Term Multi-Session Academic Progression
const multiTermProgressionData = [
  {
    term: '2024/25 Term 1',
    overallAvg: 73.4,
    stemAvg: 71.0,
    humanitiesAvg: 75.8,
    distinctionRate: 28.5,
    creditRate: 58.2,
    passRate: 92.4,
    lessonNotesCompletion: 88,
    scoreTimeliness: 86,
  },
  {
    term: '2024/25 Term 2',
    overallAvg: 75.1,
    stemAvg: 73.2,
    humanitiesAvg: 77.0,
    distinctionRate: 31.0,
    creditRate: 60.5,
    passRate: 93.8,
    lessonNotesCompletion: 91,
    scoreTimeliness: 89,
  },
  {
    term: '2024/25 Term 3',
    overallAvg: 77.2,
    stemAvg: 75.6,
    humanitiesAvg: 78.8,
    distinctionRate: 34.2,
    creditRate: 62.0,
    passRate: 95.0,
    lessonNotesCompletion: 94,
    scoreTimeliness: 92,
  },
  {
    term: '2025/26 Term 1 (Now)',
    overallAvg: 80.8,
    stemAvg: 79.8,
    humanitiesAvg: 81.8,
    distinctionRate: 39.5,
    creditRate: 64.2,
    passRate: 97.0,
    lessonNotesCompletion: 98,
    scoreTimeliness: 96,
  },
];

// 3. Subject-Specific Performance Breakdown with Significant Change Indicators
export interface SubjectPerformanceItem {
  subject: string;
  currentAvg: number;
  prevTermAvg: number;
  target: number;
  distinctionCount: number;
  creditCount: number;
  interventionNeeded: number;
  teacher: string;
  significantChange?: 'spike' | 'dip' | null;
  delta: number;
  periodLabel: string;
  changeReason?: string;
  impactedClasses?: string;
}

export const subjectPerformanceData: SubjectPerformanceItem[] = [
  {
    subject: 'Mathematics',
    currentAvg: 80.1,
    prevTermAvg: 74.5,
    target: 75.0,
    distinctionCount: 54,
    creditCount: 78,
    interventionNeeded: 13,
    teacher: 'Mr. Emmanuel Adeleke',
    significantChange: 'spike',
    delta: 5.6,
    periodLabel: 'CA 2 vs CA 1',
    changeReason: 'SmartMark optical revision drills & peer factorisation practice boosted cohort scores.',
    impactedClasses: 'JSS 2 Diamond, JSS 1 Ruby',
  },
  {
    subject: 'English Language',
    currentAvg: 81.2,
    prevTermAvg: 77.8,
    target: 75.0,
    distinctionCount: 58,
    creditCount: 76,
    interventionNeeded: 11,
    teacher: 'Mr. Jude Nwachukwu',
    significantChange: null,
    delta: 3.4,
    periodLabel: 'CA 2 vs CA 1',
    changeReason: 'Steady progression across essay composition and comprehension tasks.',
    impactedClasses: 'All Junior & Senior Streams',
  },
  {
    subject: 'Basic Science',
    currentAvg: 81.8,
    prevTermAvg: 76.0,
    target: 75.0,
    distinctionCount: 62,
    creditCount: 72,
    interventionNeeded: 11,
    teacher: 'Miss Chidinma Eze',
    significantChange: 'spike',
    delta: 5.8,
    periodLabel: 'CA 2 vs CA 1',
    changeReason: 'Hands-on practical apparatus experiments and weekly quick check quizzes.',
    impactedClasses: 'JSS 1 Ruby, JSS 2 Diamond',
  },
  {
    subject: 'Basic Technology',
    currentAvg: 78.6,
    prevTermAvg: 83.4,
    target: 75.0,
    distinctionCount: 48,
    creditCount: 82,
    interventionNeeded: 15,
    teacher: 'Mr. Emmanuel Adeleke',
    significantChange: 'dip',
    delta: -4.8,
    periodLabel: 'CA 2 vs CA 1',
    changeReason: 'Sudden dip linked to 3D orthographic projection and technical drawing test.',
    impactedClasses: 'JSS 3 Gold',
  },
  {
    subject: 'Civic Education',
    currentAvg: 84.5,
    prevTermAvg: 80.1,
    target: 75.0,
    distinctionCount: 74,
    creditCount: 64,
    interventionNeeded: 7,
    teacher: 'Mrs. Folashade Adebayo',
    significantChange: 'spike',
    delta: 4.4,
    periodLabel: 'Current vs Prev Term',
    changeReason: 'National constitution debate week drove high recall and test participation.',
    impactedClasses: 'SSS 1 Science, SSS 1 Arts',
  },
  {
    subject: 'Agricultural Science',
    currentAvg: 79.4,
    prevTermAvg: 83.6,
    target: 75.0,
    distinctionCount: 52,
    creditCount: 79,
    interventionNeeded: 14,
    teacher: 'Miss Chidinma Eze',
    significantChange: 'dip',
    delta: -4.2,
    periodLabel: 'CA 2 vs CA 1',
    changeReason: 'Crop classification test dip; awaiting school farm demonstration project logs.',
    impactedClasses: 'Primary 5 Emerald, JSS 1',
  },
  {
    subject: 'Literature in English',
    currentAvg: 82.0,
    prevTermAvg: 78.4,
    target: 75.0,
    distinctionCount: 60,
    creditCount: 74,
    interventionNeeded: 11,
    teacher: 'Mr. Jude Nwachukwu',
    significantChange: null,
    delta: 3.6,
    periodLabel: 'CA 2 vs CA 1',
    changeReason: 'Consistent analysis of WAEC prescribed prose and drama texts.',
    impactedClasses: 'SSS 1 Arts, JSS 3 Gold',
  },
];

// 4. NERDC Official Nigerian Grading Scale Distribution
const nerdcGradeDistributionData = [
  { name: 'A1 (Distinction 75-100%)', count: 58, percentage: 40.0, color: '#10B981' },
  { name: 'B2-B3 (Very Good 65-74%)', count: 48, percentage: 33.1, color: '#4F46E5' },
  { name: 'C4-C6 (Credit 50-64%)', count: 32, percentage: 22.1, color: '#38BDF8' },
  { name: 'D7-E8 (Pass 40-49%)', count: 5, percentage: 3.4, color: '#F59E0B' },
  { name: 'F9 (Fail 0-39%)', count: 2, percentage: 1.4, color: '#F43F5E' },
];

// 5. Individual Teacher Engagement & Performance Scoreboard
const teacherActivityScoreboard = [
  {
    id: 'stf-001',
    name: 'Mr. Emmanuel Adeleke',
    subjects: 'Mathematics, Basic Technology',
    assignedClasses: 'JSS 1, JSS 2, JSS 3',
    lessonNotesSubmitted: 28,
    lessonNotesTarget: 28,
    lessonNoteRate: 100,
    assessmentsSubmitted: 6,
    assessmentsTotal: 6,
    assessmentTimeliness: 98,
    attendanceLogTime: '7:52 AM Avg',
    attendancePunctuality: 99,
    studentAvgScore: 79.4,
    scoreImprovement: '+5.6%',
    smartMarkScans: 145,
    status: 'Excellent',
    statusColor: 'emerald',
  },
  {
    id: 'stf-003',
    name: 'Mr. Jude Nwachukwu',
    subjects: 'English Language, Literature',
    assignedClasses: 'JSS 2, SSS 1',
    lessonNotesSubmitted: 24,
    lessonNotesTarget: 24,
    lessonNoteRate: 100,
    assessmentsSubmitted: 4,
    assessmentsTotal: 4,
    assessmentTimeliness: 96,
    attendanceLogTime: '8:05 AM Avg',
    attendancePunctuality: 97,
    studentAvgScore: 81.6,
    scoreImprovement: '+3.8%',
    smartMarkScans: 120,
    status: 'Excellent',
    statusColor: 'emerald',
  },
  {
    id: 'stf-005',
    name: 'Miss Chidinma Eze',
    subjects: 'Basic Science, Agric Science',
    assignedClasses: 'Primary 5, JSS 1',
    lessonNotesSubmitted: 22,
    lessonNotesTarget: 24,
    lessonNoteRate: 91.6,
    assessmentsSubmitted: 4,
    assessmentsTotal: 4,
    assessmentTimeliness: 94,
    attendanceLogTime: '8:12 AM Avg',
    attendancePunctuality: 94,
    studentAvgScore: 80.6,
    scoreImprovement: '+5.2%',
    smartMarkScans: 85,
    status: 'Good',
    statusColor: 'indigo',
  },
  {
    id: 'stf-002',
    name: 'Mrs. Folashade Adebayo (Principal)',
    subjects: 'Civic Education, Governance',
    assignedClasses: 'All Levels',
    lessonNotesSubmitted: 18,
    lessonNotesTarget: 18,
    lessonNoteRate: 100,
    assessmentsSubmitted: 2,
    assessmentsTotal: 2,
    assessmentTimeliness: 100,
    attendanceLogTime: '7:40 AM Avg',
    attendancePunctuality: 100,
    studentAvgScore: 84.5,
    scoreImprovement: '+4.4%',
    smartMarkScans: 60,
    status: 'Exemplary',
    statusColor: 'emerald',
  },
];

// ---------------------------------------------------------------------------
// Reusable Significant Change Notification Badge Component
// ---------------------------------------------------------------------------
export const SignificantChangeBadge: React.FC<{
  type: 'spike' | 'dip';
  delta: number;
  periodLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showLabel?: boolean;
  pulsing?: boolean;
}> = ({
  type,
  delta,
  periodLabel,
  size = 'md',
  onClick,
  showLabel = true,
  pulsing = true,
}) => {
  const isSpike = type === 'spike';
  const formattedDelta = delta > 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-bold rounded-full transition-all cursor-pointer select-none ${
        isSpike
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 shadow-2xs'
          : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 hover:border-rose-400 shadow-2xs'
      } ${
        size === 'sm'
          ? 'px-2 py-0.5 text-[10px]'
          : size === 'lg'
          ? 'px-3.5 py-1.5 text-xs'
          : 'px-2.5 py-1 text-[11px]'
      }`}
      title={
        isSpike
          ? `Significant Performance Spike of ${formattedDelta} compared to previous assessment period`
          : `Significant Performance Dip of ${formattedDelta} compared to previous assessment period`
      }
    >
      {pulsing && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isSpike ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isSpike ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          />
        </span>
      )}
      {isSpike ? (
        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
      )}
      <span className="font-extrabold">{formattedDelta}</span>
      {showLabel && (
        <span className="font-semibold opacity-90">
          {isSpike ? 'Spike' : 'Dip'}
        </span>
      )}
      {periodLabel && (
        <span className="text-[10px] opacity-75 font-normal ml-0.5">({periodLabel})</span>
      )}
    </button>
  );
};

export const AcademicAndTeacherAnalytics: React.FC<AcademicAndTeacherAnalyticsProps> = ({
  onNavigateTab,
}) => {
  const { branding, students = [], staff = [], assessments = [] } = useApp();

  // Active view tab state
  const [activeTab, setActiveTab] = useState<'academic' | 'teacher' | 'combined'>('academic');
  // Timeframe selector
  const [timeframe, setTimeframe] = useState<'weekly' | 'multiterm'>('weekly');
  // Class filter
  const [selectedClass, setSelectedClass] = useState<string>('all');
  // Subject filter
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  // Significant change filter: 'all' | 'significant' | 'spikes' | 'dips'
  const [significantFilter, setSignificantFilter] = useState<'all' | 'significant' | 'spikes' | 'dips'>('all');
  // Modal / Drawer state for deep diagnostic review
  const [selectedChangeAlert, setSelectedChangeAlert] = useState<SignificantChangeAlert | null>(null);
  // Collapsible toggle for significant alerts banner
  const [isAlertsBannerOpen, setIsAlertsBannerOpen] = useState<boolean>(true);
  // Action toast state
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Count total spikes and dips
  const spikeCount = significantChangesData.filter((a) => a.type === 'spike').length;
  const dipCount = significantChangesData.filter((a) => a.type === 'dip').length;
  const totalSignificantChanges = significantChangesData.length;

  // Filtered Subject Data respecting both subject filter & significant change filter
  const filteredSubjectData = useMemo(() => {
    let list = subjectPerformanceData;
    if (selectedSubject !== 'all') {
      list = list.filter((s) => s.subject === selectedSubject);
    }
    if (significantFilter === 'significant') {
      list = list.filter((s) => s.significantChange !== null);
    } else if (significantFilter === 'spikes') {
      list = list.filter((s) => s.significantChange === 'spike');
    } else if (significantFilter === 'dips') {
      list = list.filter((s) => s.significantChange === 'dip');
    }
    return list;
  }, [selectedSubject, significantFilter]);

  // Trigger brief user feedback notification
  const handleAction = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 4000);
  };

  // Overall calculations
  const totalStudents = students.length || 145;
  const averageAcademicScore = 80.8;
  const distinctionRate = 40.0;
  const creditRate = 55.2;
  const teacherComplianceRate = 96.5;
  const totalLessonPlansPublished = 92;

  // Custom Chart Tooltips
  const AcademicWeeklyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs min-w-56 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold text-slate-200">
            <span>{data.week}</span>
            <span className="text-indigo-400 font-extrabold">{data.classAvg}% Class Avg</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Top Quartile:
              </span>
              <span className="font-bold text-white">{data.topQuartile}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Mathematics:
              </span>
              <span className="font-semibold text-white">{data.mathAvg}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-sky-300">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                English:
              </span>
              <span className="font-semibold text-white">{data.englishAvg}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Basic Science:
              </span>
              <span className="font-semibold text-white">{data.scienceAvg}%</span>
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
              <span>Overall Pass Rate:</span>
              <span className="font-bold text-emerald-400">{data.passingRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const TeacherWeeklyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs min-w-56 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-bold text-slate-200">
            <span>{data.week} Activity</span>
            <span className="text-emerald-400 font-extrabold">{data.attendanceTimeliness}% Punctual</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <BookOpen className="w-3 h-3" /> Lesson Notes Approved:
              </span>
              <span className="font-bold text-white">{data.lessonPlansApproved} plans</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-amber-400">
                <FileCheck className="w-3 h-3" /> Assessments Graded:
              </span>
              <span className="font-bold text-white">{data.assessmentsGraded} score sheets</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Clock className="w-3 h-3" /> Roll Call Punctuality:
              </span>
              <span className="font-bold text-white">{data.attendanceTimeliness}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
      {/* --------------------------------------------------------------------- */}
      {/* 1. Header Section: Title, Subtitle, Mode Switchers & Filters          */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display font-bold text-xl text-slate-900 tracking-tight">
                  Academic & Faculty Analytics Matrix
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                  {branding.academicSession || '2025/2026'} · {branding.currentTerm || 'First Term'}
                </span>

                {/* Top-Level Significant Change Notification Badge */}
                <button
                  onClick={() => setIsAlertsBannerOpen(!isAlertsBannerOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-emerald-500/15 text-slate-900 border border-amber-300 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer select-none"
                  title="Click to view all significant performance spikes and dips"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                  </span>
                  <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{totalSignificantChanges} Significant Changes</span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    ({spikeCount} <span className="text-emerald-700 font-bold">Spikes</span> · {dipCount} <span className="text-rose-700 font-bold">Dips</span>)
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      isAlertsBannerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time correlation of student learning trajectories, subject velocity shifts, and teacher pedagogical pacing.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher + Timeframe Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Analytics Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab('academic')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'academic'
                  ? 'bg-white text-indigo-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Student Performance</span>
            </button>

            <button
              onClick={() => setActiveTab('teacher')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-white text-purple-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>Teacher Activity</span>
            </button>

            <button
              onClick={() => setActiveTab('combined')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'combined'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Impact Matrix</span>
            </button>
          </div>

          {/* Timeframe Scope */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeframe === 'weekly'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Term Weeks (1-10)
            </button>
            <button
              onClick={() => setTimeframe('multiterm')}
              className={`px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeframe === 'multiterm'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Multi-Term History
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1.5 Interactive Significant Change Notification Ribbon                */}
      {/* --------------------------------------------------------------------- */}
      {isAlertsBannerOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50/60 via-slate-50 to-indigo-50/50 border border-amber-200/80 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="font-display font-bold text-sm text-slate-900">
                Performance Velocity & Significant Change Alerts
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                (Sudden shifts ≥ 4.0% vs CA 1 baseline)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Quick Filter:</span>
              <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setSignificantFilter('all')}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    significantFilter === 'all'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Alerts
                </button>
                <button
                  onClick={() => setSignificantFilter('spikes')}
                  className={`px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                    significantFilter === 'spikes'
                      ? 'bg-emerald-700 text-white font-bold'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  Spikes ({spikeCount})
                </button>
                <button
                  onClick={() => setSignificantFilter('dips')}
                  className={`px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 ${
                    significantFilter === 'dips'
                      ? 'bg-rose-700 text-white font-bold'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <TrendingDown className="w-3 h-3" />
                  Dips ({dipCount})
                </button>
              </div>
            </div>
          </div>

          {/* Grid of Alert Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {significantChangesData
              .filter((item) => {
                if (significantFilter === 'spikes') return item.type === 'spike';
                if (significantFilter === 'dips') return item.type === 'dip';
                return true;
              })
              .map((alert) => {
                const isSpike = alert.type === 'spike';
                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedChangeAlert(alert)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer hover:shadow-md text-left flex flex-col justify-between space-y-2.5 ${
                      isSpike
                        ? 'bg-white border-emerald-200/90 hover:border-emerald-400'
                        : 'bg-white border-rose-200/90 hover:border-rose-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">
                            {alert.title}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {alert.category === 'subject' ? 'Subject' : 'Class'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {alert.category === 'subject'
                            ? `Educator: ${alert.teacherInCharge}`
                            : alert.subTitle}
                        </p>
                      </div>

                      <SignificantChangeBadge
                        type={alert.type}
                        delta={alert.delta}
                        periodLabel={alert.periodLabel}
                        size="sm"
                        onClick={() => setSelectedChangeAlert(alert)}
                      />
                    </div>

                    <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                      {alert.keyDriver}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <span>{alert.prevPeriodScore}%</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className={`font-extrabold ${isSpike ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {alert.currentPeriodScore}%
                        </span>
                      </div>

                      <span className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5">
                        Inspect Diagnosis
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 2. Executive Metric Highlight Summary Cards                           */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Overall School Score Average */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 border border-indigo-100/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900/70">
              Attainment Average
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">
              {averageAcademicScore}%
            </span>
            <span className="text-xs font-bold text-emerald-700">+3.6% vs T3</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across Continuous Assessments & Exams</p>
        </div>

        {/* Metric 2: Distinction & Credit Rate */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 border border-emerald-100/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900/70">
              Distinction Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">
              {distinctionRate}%
            </span>
            <span className="text-xs font-bold text-emerald-700">A1 Grade Standard</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">58 Students scoring 75%+ overall</p>
        </div>

        {/* Metric 3: Teacher Lesson Note Completion */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 border border-purple-100/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900/70">
              Lesson Plan Pacing
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">
              {totalLessonPlansPublished}
            </span>
            <span className="text-xs font-bold text-purple-700">96.5% on-time</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">NERDC Schemes of work prepared</p>
        </div>

        {/* Metric 4: Score Sheet Timeliness */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border border-amber-100/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900/70">
              Markbook Timeliness
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">
              98.2%
            </span>
            <span className="text-xs font-bold text-emerald-700">Audit Ready</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">All CA1, CA2 & Mock scores posted</p>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. VIEW TAB 1: STUDENT ACADEMIC TRENDS                                */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          {/* Main Trajectory Chart */}
          <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  <span>Academic Trajectory & Cohort Progression</span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                    {timeframe === 'weekly' ? 'Weekly CA Pacing' : 'Historical Sessions'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {timeframe === 'weekly'
                    ? 'Continuous assessment tracking across Weeks 1-10 with top-quartile benchmark vs class average.'
                    : 'Year-on-year academic growth trajectory across previous academic sessions and terms.'}
                </p>
              </div>

              {/* Class Level Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Class:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Levels (JSS 1 - SSS 2)</option>
                  <option value="jss1">JSS 1 Diamond & Ruby</option>
                  <option value="jss2">JSS 2 Diamond (Flagship)</option>
                  <option value="jss3">JSS 3 Gold</option>
                  <option value="sss1">SSS 1 Science & Arts</option>
                </select>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {timeframe === 'weekly' ? (
                  <AreaChart
                    data={weeklyAnalyticsData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="classAvgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="topQuartileGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="shortWeek"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[60, 100]}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip content={<AcademicWeeklyTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="topQuartile"
                      name="Top Quartile (85th+ Percentile)"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#topQuartileGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="classAvg"
                      name="School-Wide Average %"
                      stroke="#4F46E5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#classAvgGrad)"
                      activeDot={{ r: 6, strokeWidth: 2, stroke: '#ffffff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mathAvg"
                      name="Mathematics"
                      stroke="#6366F1"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="englishAvg"
                      name="English Language"
                      stroke="#0284C7"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={multiTermProgressionData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="term"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[60, 100]}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                    />
                    <Bar
                      dataKey="overallAvg"
                      name="Overall Average %"
                      fill="#4F46E5"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="stemAvg"
                      name="STEM / Sciences"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                    <Bar
                      dataKey="humanitiesAvg"
                      name="Humanities & Arts"
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Grid: Subject Performance & NERDC Grade Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Subject Performance Comparison Bar Chart (7 Cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    Subject Performance vs Previous Assessment Period
                  </h3>
                  <p className="text-xs text-slate-500">
                    Continuous assessment tracking with significant performance velocity indicators.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={significantFilter}
                    onChange={(e: any) => setSignificantFilter(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Subjects</option>
                    <option value="significant">⚡ Significant Variations Only</option>
                    <option value="spikes">🚀 Spikes Only (≥ +4%)</option>
                    <option value="dips">⚠️ Dips Only (≤ -4%)</option>
                  </select>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredSubjectData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="subject"
                      stroke="#94a3b8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[60, 95]}
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
                    />
                    <Bar
                      dataKey="currentAvg"
                      name="Current Period (CA 2)"
                      fill="#4F46E5"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                    <Bar
                      dataKey="prevTermAvg"
                      name="Previous Period (CA 1)"
                      fill="#94A3B8"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={22}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: NERDC Grade Distribution Donut Chart (5 Cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-sm text-slate-900">
                    NERDC Grade Distribution
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    145 Enrolled
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Official grading scale proportions for standard report card compilation.
                </p>
              </div>

              {/* Donut Chart */}
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={nerdcGradeDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="percentage"
                    >
                      {nerdcGradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value}% of class`, 'Proportion']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center pointer-events-none">
                  <span className="font-display font-extrabold text-xl text-slate-900">73.1%</span>
                  <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Distinction & Very Good
                  </span>
                </div>
              </div>

              {/* Legend Badges */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                {nerdcGradeDistributionData.slice(0, 3).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] font-medium text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 text-[11px]">
                      {item.percentage}% ({item.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Subject Velocity & Change Breakdown Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Subject Performance Velocity Breakdown</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    {filteredSubjectData.length} Subjects Listed
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Highlighting assessment period variations, distinction cohorts, and educator lead.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Filter View:</span>
                <button
                  onClick={() => setSignificantFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    significantFilter === 'all'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({subjectPerformanceData.length})
                </button>
                <button
                  onClick={() => setSignificantFilter('significant')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                    significantFilter === 'significant'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Significant Changes Only (4)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5 pl-1">Subject & Lead Educator</th>
                    <th className="pb-2.5">Current Avg</th>
                    <th className="pb-2.5">Previous Period</th>
                    <th className="pb-2.5">Change Trajectory</th>
                    <th className="pb-2.5">Distinctions (A1)</th>
                    <th className="pb-2.5">Intervention Needed</th>
                    <th className="pb-2.5 pr-1 text-right">Diagnostic Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubjectData.map((item) => {
                    const matchingAlert = significantChangesData.find(
                      (a) => a.title.toLowerCase().includes(item.subject.toLowerCase())
                    );

                    return (
                      <tr key={item.subject} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 pl-1">
                          <div className="font-bold text-slate-900 text-xs">{item.subject}</div>
                          <div className="text-[11px] text-slate-500">{item.teacher}</div>
                        </td>
                        <td className="py-3">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {item.currentAvg}%
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 font-medium">
                          {item.prevTermAvg}%
                        </td>
                        <td className="py-3">
                          {item.significantChange ? (
                            <SignificantChangeBadge
                              type={item.significantChange}
                              delta={item.delta}
                              periodLabel={item.periodLabel}
                              size="sm"
                              onClick={() => {
                                if (matchingAlert) {
                                  setSelectedChangeAlert(matchingAlert);
                                } else {
                                  setSelectedChangeAlert({
                                    id: `subj-${item.subject}`,
                                    type: item.significantChange!,
                                    category: 'subject',
                                    title: item.subject,
                                    subTitle: `Educator: ${item.teacher}`,
                                    currentPeriodScore: item.currentAvg,
                                    prevPeriodScore: item.prevTermAvg,
                                    delta: item.delta,
                                    periodLabel: item.periodLabel,
                                    severity: Math.abs(item.delta) >= 7 ? 'high' : 'moderate',
                                    keyDriver: item.changeReason || 'Assessment variance detected.',
                                    recommendedAction: item.significantChange === 'spike'
                                      ? 'Share successful practice with department staff.'
                                      : 'Schedule topic-level diagnostic revision session.',
                                    affectedStudentsCount: item.interventionNeeded,
                                    teacherInCharge: item.teacher,
                                    confidenceScore: 95,
                                    tags: [item.subject, 'Subject Velocity'],
                                  });
                                }
                              }}
                            />
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              <span className="text-slate-400">→</span>
                              +{item.delta.toFixed(1)}% (Steady)
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            {item.distinctionCount} students
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`font-semibold px-2 py-0.5 rounded ${
                            item.interventionNeeded > 12
                              ? 'text-amber-700 bg-amber-50 font-bold'
                              : 'text-slate-600 bg-slate-50'
                          }`}>
                            {item.interventionNeeded} students
                          </span>
                        </td>
                        <td className="py-3 pr-1 text-right">
                          <button
                            onClick={() => {
                              if (matchingAlert) {
                                setSelectedChangeAlert(matchingAlert);
                              } else {
                                setSelectedChangeAlert({
                                  id: `subj-${item.subject}`,
                                  type: item.significantChange || 'spike',
                                  category: 'subject',
                                  title: item.subject,
                                  subTitle: `Educator: ${item.teacher}`,
                                  currentPeriodScore: item.currentAvg,
                                  prevPeriodScore: item.prevTermAvg,
                                  delta: item.delta,
                                  periodLabel: item.periodLabel,
                                  severity: Math.abs(item.delta) >= 7 ? 'high' : 'moderate',
                                  keyDriver: item.changeReason || 'Assessment variance detected.',
                                  recommendedAction: item.significantChange === 'spike'
                                    ? 'Acknowledge teacher performance in staff review.'
                                    : 'Schedule diagnostic revision drills before final term exams.',
                                  affectedStudentsCount: item.interventionNeeded,
                                  teacherInCharge: item.teacher,
                                  confidenceScore: 95,
                                  tags: [item.subject, 'Diagnostic Action'],
                                });
                              }
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            Diagnosis →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 4. VIEW TAB 2: TEACHER ACTIVITY & COMPLIANCE                          */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'teacher' && (
        <div className="space-y-6">
          {/* Main Teacher Weekly Activity Composed Chart */}
          <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  <span>Teacher Lesson Planning, Assessment & Roll Call Velocity</span>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                    Faculty Compliance
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Weekly volume of lesson plans drafted & approved, markbooks submitted, and morning roll call punctuality.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
                  5 of 5 Active Teachers Verified
                </span>
              </div>
            </div>

            {/* Recharts Composed Chart (Bars + Line) */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={weeklyAnalyticsData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="shortWeek"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 32]}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[85, 100]}
                    stroke="#10B981"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<TeacherWeeklyTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="lessonPlansApproved"
                    name="Lesson Plans Approved"
                    fill="#7C3AED"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="assessmentsGraded"
                    name="Assessments Posted"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="attendanceTimeliness"
                    name="Attendance Logging Punctuality (%)"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 4, stroke: '#10B981', fill: '#ffffff', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Teacher Performance & Compliance Scoreboard Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Faculty Operational Compliance Scoreboard
                </h3>
                <p className="text-xs text-slate-500">
                  Individual educator deliverables: Scheme of work coverage, optical grading scans & attendance fidelity.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('staff')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Manage All Staff</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pl-1">Teacher & Department</th>
                    <th className="pb-3">Assigned Classes</th>
                    <th className="pb-3">Lesson Plans (NERDC)</th>
                    <th className="pb-3">Score Sheets</th>
                    <th className="pb-3">Roll Call Punctuality</th>
                    <th className="pb-3">Student Growth</th>
                    <th className="pb-3 pr-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teacherActivityScoreboard.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-1">
                        <div className="font-bold text-slate-900 text-xs">{teacher.name}</div>
                        <div className="text-[11px] text-slate-500">{teacher.subjects}</div>
                      </td>
                      <td className="py-3 text-slate-700 font-medium">{teacher.assignedClasses}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">
                            {teacher.lessonNotesSubmitted}/{teacher.lessonNotesTarget}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {teacher.lessonNoteRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">
                            {teacher.assessmentsSubmitted}/{teacher.assessmentsTotal}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({teacher.smartMarkScans} SmartMark scans)
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span className="font-semibold text-slate-800">{teacher.attendanceLogTime}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {teacher.scoreImprovement}
                        </span>
                      </td>
                      <td className="py-3 pr-1 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          {teacher.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 5. VIEW TAB 3: COMBINED IMPACT MATRIX & CORRELATION                   */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'combined' && (
        <div className="space-y-6">
          {/* Combined Correlation Chart */}
          <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                  <span>Pacing Correlation: Teacher Lesson Delivery vs Student Attainment</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    Direct Impact
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visualizing how prompt scheme-of-work lesson note preparation directly boosts student weekly test scores.
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={weeklyAnalyticsData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="shortWeek"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[65, 95]}
                    stroke="#4F46E5"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[10, 30]}
                    stroke="#7C3AED"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="lessonPlansApproved"
                    name="Teacher Lesson Plans Approved"
                    fill="#C4B5FD"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="classAvg"
                    name="Student Class Average (%)"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#4F46E5', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="passingRate"
                    name="Subject Pass Rate (%)"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Automated Synthesis Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white shadow-sm border border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                  Skuggle Academic Intelligence Takeaway
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed max-w-2xl">
                  Positive correlation coefficient (r = 0.94) between early week lesson plan submissions and student CA2 scores in Mathematics and Basic Science. 0 subjects currently in red warning tier.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab && onNavigateTab('assessments')}
              className="shrink-0 px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Export Report Card Pin Data
            </button>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 6. Footer Audit & Actions Bar                                         */}
      {/* --------------------------------------------------------------------- */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            Analytics compiled from live gradebooks, SmartMark scan batches, and daily roll calls.
          </span>
        </div>

        <div className="flex items-center gap-3 font-semibold text-slate-700">
          <button
            onClick={() => onNavigateTab && onNavigateTab('assessments')}
            className="text-indigo-600 hover:underline cursor-pointer"
          >
            Review Grade Sheets →
          </button>
          <span>·</span>
          <button
            onClick={() => onNavigateTab && onNavigateTab('staff')}
            className="text-purple-600 hover:underline cursor-pointer"
          >
            View Teacher Roster →
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 7. Significant Change Diagnostic & Action Modal                       */}
      {/* --------------------------------------------------------------------- */}
      {selectedChangeAlert && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setSelectedChangeAlert(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`p-6 border-b text-white ${
                selectedChangeAlert.type === 'spike'
                  ? 'bg-gradient-to-r from-emerald-800 to-teal-900 border-emerald-700'
                  : 'bg-gradient-to-r from-rose-900 via-slate-900 to-amber-950 border-rose-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-2xl ${
                      selectedChangeAlert.type === 'spike'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {selectedChangeAlert.type === 'spike' ? (
                      <TrendingUp className="w-6 h-6" />
                    ) : (
                      <TrendingDown className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-white">
                        {selectedChangeAlert.type === 'spike' ? 'Significant Spike' : 'Significant Dip'}
                      </span>
                      <span className="text-xs font-semibold text-slate-300">
                        {selectedChangeAlert.periodLabel}
                      </span>
                    </div>
                    <h3 className="font-display font-extrabold text-xl text-white mt-1">
                      {selectedChangeAlert.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedChangeAlert(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Metric Delta Badge */}
              <div className="mt-4 p-3 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-300 block">
                    Performance Shift
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xs line-through text-slate-300">
                      {selectedChangeAlert.prevPeriodScore}%
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-extrabold text-lg text-white">
                      {selectedChangeAlert.currentPeriodScore}%
                    </span>
                  </div>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-sm ${
                    selectedChangeAlert.type === 'spike'
                      ? 'bg-emerald-400 text-slate-950 shadow-xs'
                      : 'bg-rose-500 text-white shadow-xs'
                  }`}
                >
                  {selectedChangeAlert.delta > 0
                    ? `+${selectedChangeAlert.delta.toFixed(1)}%`
                    : `${selectedChangeAlert.delta.toFixed(1)}%`}
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-600 max-h-[60vh] overflow-y-auto">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Pedagogical Diagnosis & Root Cause
                </h4>
                <p className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-slate-700 leading-relaxed">
                  {selectedChangeAlert.keyDriver}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Lead Educator
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedChangeAlert.teacherInCharge || 'Department Faculty'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {selectedChangeAlert.type === 'spike' ? 'Distinction Learners' : 'Intervention Needed'}
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedChangeAlert.affectedStudentsCount || 14} Students
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5">
                  Recommended Administrative Intervention
                </h4>
                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 font-medium">
                  {selectedChangeAlert.recommendedAction}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  handleAction(`Notification logged for ${selectedChangeAlert.title}`);
                  setSelectedChangeAlert(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Dismiss Alert
              </button>

              <button
                onClick={() => {
                  handleAction(
                    selectedChangeAlert.type === 'spike'
                      ? `Department commendation dispatched to ${selectedChangeAlert.teacherInCharge}`
                      : `Remediation revision drill scheduled for ${selectedChangeAlert.title}`
                  );
                  setSelectedChangeAlert(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer ${
                  selectedChangeAlert.type === 'spike'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {selectedChangeAlert.type === 'spike'
                  ? 'Commend Educator & Share Practice'
                  : 'Assign Remediation Drills'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
