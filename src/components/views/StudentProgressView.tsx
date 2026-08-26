import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Flame,
  Target,
  GraduationCap,
  Link2,
  Trophy,
  Star,
  ChevronRight,
  ArrowUpRight,
  Zap,
  BarChart3,
  Calendar,
  Layers,
  Brain,
  Shield,
  HelpCircle,
  Plus,
  Play,
  RotateCcw,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { useStudentWorkspace } from '../../features/student/useStudentWorkspace';

interface StudentProgressViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface SubjectMastery {
  id: string;
  name: string;
  code: string;
  teacher: string;
  color: string;
  iconBg: string;
  masteryPercent: number;
  totalLessons: number;
  completedLessons: number;
  strongTopics: string[];
  focusTopics: string[];
  recentGrade: string;
  trend: 'up' | 'stable' | 'down';
  trendValue: number;
}

interface AchievementBadge {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  maxProgress?: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export const StudentProgressView: React.FC<StudentProgressViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const workspace = useStudentWorkspace();
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'badges' | 'goals'>('overview');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<'term2' | 'term1'>('term2');

  // Interactive Micro Quiz state
  const [activePracticeTopic, setActivePracticeTopic] = useState<string | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);

  // Interactive goals state
  const [goals, setGoals] = useState([
    { id: '1', title: 'Complete 25 Mathematics CBT Practice Questions', target: '25 questions', current: 20, done: false, tag: 'Mathematics' },
    { id: '2', title: 'Achieve 90%+ in Basic Science Weekly CA Quiz', target: '90% score', current: 88, done: true, tag: 'Basic Science' },
    { id: '3', title: 'Read Chapter 5 of "The Concubine" English Reader', target: 'Chapter 5', current: 1, done: true, tag: 'English Studies' },
    { id: '4', title: 'Submit French Oral Audio Recording Assignment', target: 'Audio file', current: 0, done: false, tag: 'French' },
    { id: '5', title: 'Review ICT Binary & Hexadecimal conversion notes', target: '30 mins revision', current: 15, done: false, tag: 'ICT & Coding' },
  ]);

  const [newGoalInput, setNewGoalInput] = useState('');

  const subjectList: SubjectMastery[] = [
    {
      id: 'math',
      name: 'Mathematics',
      code: 'MTH-201',
      teacher: 'Mr. Adewale Olawale',
      color: 'from-blue-600 to-indigo-600',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      masteryPercent: 92,
      totalLessons: 24,
      completedLessons: 22,
      strongTopics: ['Algebraic Factorization', 'Linear Equations', 'Pythagoras Theorem'],
      focusTopics: ['Simultaneous Equations', 'Surface Area of Prisms'],
      recentGrade: 'A1 (91%)',
      trend: 'up',
      trendValue: 5,
    },
    {
      id: 'science',
      name: 'Basic Science & Technology',
      code: 'BST-201',
      teacher: 'Dr. (Mrs.) Alabi',
      color: 'from-emerald-600 to-teal-600',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      masteryPercent: 88,
      totalLessons: 20,
      completedLessons: 18,
      strongTopics: ['Photosynthesis', 'Human Digestive System', 'Work & Energy'],
      focusTopics: ['Atomic Structure', 'Simple Machines Calculation'],
      recentGrade: 'A1 (88%)',
      trend: 'up',
      trendValue: 3,
    },
    {
      id: 'ict',
      name: 'Computer Studies / ICT & Coding',
      code: 'ICT-202',
      teacher: 'Engr. Kenneth Obi',
      color: 'from-purple-600 to-pink-600',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
      masteryPercent: 96,
      totalLessons: 18,
      completedLessons: 18,
      strongTopics: ['Python Variables & Loops', 'HTML5 Basics', 'Spreadsheets & Formulas'],
      focusTopics: ['Algorithm Flowcharts'],
      recentGrade: 'A1 (96%)',
      trend: 'up',
      trendValue: 4,
    },
    {
      id: 'english',
      name: 'English Studies',
      code: 'ENG-201',
      teacher: 'Mrs. Folake Johnson',
      color: 'from-amber-600 to-orange-600',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      masteryPercent: 84,
      totalLessons: 22,
      completedLessons: 19,
      strongTopics: ['Formal Letter Writing', 'Adverbial Clauses', 'Summary Writing'],
      focusTopics: ['Active & Passive Voice', 'Idiomatic Expressions'],
      recentGrade: 'B2 (78%)',
      trend: 'up',
      trendValue: 8,
    },
    {
      id: 'civic',
      name: 'Civic & Social Studies',
      code: 'CVC-201',
      teacher: 'Mr. Babatunde Musa',
      color: 'from-cyan-600 to-blue-600',
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      masteryPercent: 94,
      totalLessons: 16,
      completedLessons: 15,
      strongTopics: ['Rule of Law', 'National Values & Integrity', 'Consumer Rights'],
      focusTopics: ['Democratic Governance Structures'],
      recentGrade: 'A1 (93%)',
      trend: 'stable',
      trendValue: 0,
    },
    {
      id: 'agric',
      name: 'Agricultural Science',
      code: 'AGR-201',
      teacher: 'Mr. Dennis Eze',
      color: 'from-lime-600 to-green-600',
      iconBg: 'bg-lime-50 text-lime-700 border-lime-200',
      masteryPercent: 82,
      totalLessons: 16,
      completedLessons: 13,
      strongTopics: ['Soil Classification', 'Crop Husbandry (Maize & Cassava)'],
      focusTopics: ['Farm Animal Anatomy & Feed Ratios'],
      recentGrade: 'B3 (74%)',
      trend: 'up',
      trendValue: 6,
    },
    {
      id: 'french',
      name: 'French Language',
      code: 'FRN-201',
      teacher: 'Madame Chantal Dubois',
      color: 'from-rose-600 to-red-600',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      masteryPercent: 76,
      totalLessons: 16,
      completedLessons: 12,
      strongTopics: ['Les Salutations', 'Les Nombres 1-100', 'Présent des Verbes'],
      focusTopics: ['Passé Composé Conjugation', 'Direct Object Pronouns'],
      recentGrade: 'C4 (66%)',
      trend: 'up',
      trendValue: 9,
    },
    {
      id: 'business',
      name: 'Business Studies',
      code: 'BUS-201',
      teacher: 'Mr. Austin Bassey',
      color: 'from-indigo-600 to-teal-600',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      masteryPercent: 80,
      totalLessons: 18,
      completedLessons: 14,
      strongTopics: ['Single Entry Bookkeeping', 'Office Equipment', 'Trade & Commerce'],
      focusTopics: ['Double Entry Ledger Posting'],
      recentGrade: 'B2 (77%)',
      trend: 'up',
      trendValue: 2,
    },
  ];

  const badges: AchievementBadge[] = [
    {
      id: 'b1',
      title: 'Maths Prodigy',
      category: 'Academic',
      icon: '⚡',
      description: 'Solved over 150 algebra and geometry equations with >90% accuracy.',
      unlocked: true,
      unlockedDate: '18 Feb 2026',
      rarity: 'Legendary',
    },
    {
      id: 'b2',
      title: '7-Day Streak Master',
      category: 'Consistency',
      icon: '🔥',
      description: 'Logged in and completed at least 30 minutes of study every day for 7 consecutive days.',
      unlocked: true,
      unlockedDate: '22 Feb 2026',
      rarity: 'Epic',
    },
    {
      id: 'b3',
      title: 'CBT Test Ace',
      category: 'Assessment',
      icon: '🎯',
      description: 'Scored 100% on 3 full-length timed CBT practice drills.',
      unlocked: true,
      unlockedDate: '12 Jan 2026',
      rarity: 'Epic',
    },
    {
      id: 'b4',
      title: 'Punctuality Paragon',
      category: 'Attendance',
      icon: '🛡️',
      description: 'Maintained 100% morning turnstile gate check-in before 7:45 AM for 4 straight weeks.',
      unlocked: true,
      unlockedDate: '01 Feb 2026',
      rarity: 'Rare',
    },
    {
      id: 'b5',
      title: 'Coding Champion',
      category: 'STEM',
      icon: '💻',
      description: 'Built a working Python calculation algorithm in the school ICT Lab.',
      unlocked: true,
      unlockedDate: '28 Jan 2026',
      rarity: 'Rare',
    },
    {
      id: 'b6',
      title: 'Early Bird Submitter',
      category: 'Assignments',
      icon: '🚀',
      description: 'Turned in 10 homework assignments at least 24 hours ahead of deadline.',
      unlocked: true,
      unlockedDate: '14 Feb 2026',
      rarity: 'Common',
    },
    {
      id: 'b7',
      title: 'WAEC / BECE Grandmaster',
      category: 'Exam Prep',
      icon: '👑',
      description: 'Complete 300 past BECE junior secondary exam questions.',
      unlocked: false,
      progress: 184,
      maxProgress: 300,
      rarity: 'Legendary',
    },
    {
      id: 'b8',
      title: 'French Polyglot',
      category: 'Language',
      icon: '🇫🇷',
      description: 'Score 85%+ in 5 French vocabulary & dialogue listening modules.',
      unlocked: false,
      progress: 3,
      maxProgress: 5,
      rarity: 'Epic',
    },
  ];

  const handleToggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const newDone = !g.done;
          if (newDone) {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          }
          return { ...g, done: newDone };
        }
        return g;
      })
    );
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalInput.trim()) return;
    const newGoal = {
      id: Date.now().toString(),
      title: newGoalInput.trim(),
      target: 'Self-set',
      current: 0,
      done: false,
      tag: 'General Study',
    };
    setGoals([newGoal, ...goals]);
    setNewGoalInput('');
    feedbackBus.success('New study goal added!');
  };

  const handlePracticeTopicLaunch = (topic: string) => {
    setActivePracticeTopic(topic);
    setPracticeAnswer(null);
    setIsAnswerSubmitted(false);
  };

  const handleSelectPracticeOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setPracticeAnswer(idx);
    setIsAnswerSubmitted(true);
    if (idx === 1) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
  };

  const filteredSubjects = selectedSubject === 'all'
    ? subjectList
    : subjectList.filter((s) => s.id === selectedSubject);

  if (workspace.isLive) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <GraduationCap className="h-8 w-8 text-indigo-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">No progress data yet</h1>
          <p className="mt-2 text-sm text-slate-500">
            {workspace.isPersonal
              ? `${workspace.firstName}, your personal account is not connected to a school yet. Subject mastery, grades, and ranks appear once you join a school with an invitation code.`
              : `${workspace.firstName}, your school hasn't published assessment scores for your account yet. Check back after your first term results are released.`}
          </p>
          {workspace.isPersonal && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <Link2 className="h-3.5 w-3.5" />
              Ask your school admin for an invitation code to connect
            </p>
          )}
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-left">
            <p className="text-xs font-bold text-slate-700">What you'll see here once connected:</p>
            <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Subject-by-subject mastery percentages</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Term averages, GPA, and class rank</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Achievement badges and study streak</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Personal study goals tracker</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner & Gamification Status */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-indigo-200 border border-white/10 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Level 14 • Grand Scholar
              </span>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-amber-400/30">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                7-Day Study Streak
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-emerald-400/30">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                {workspace.isLive
                  ? workspace.classLabel || workspace.schoolLabel
                  : 'Rank 2nd in JSS 2A'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {workspace.firstName}'s Academic Progress & Mastery Tracker
            </h1>
            <p className="text-sm text-indigo-100/80 max-w-2xl leading-relaxed">
              {workspace.isLive
                ? workspace.isPersonal
                  ? 'Track personal practice and library mastery. School ranks and class averages appear after you join a school.'
                  : 'Track your topic competencies, study hours, and examination readiness for subjects assigned by your school.'
                : 'Track your weekly topic competencies, study hours, achievements, and BECE examination readiness across all 8 registered curriculum subjects.'}
            </p>
          </div>

          {/* XP & Level Progress Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 min-w-[280px] sm:min-w-[320px]">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-indigo-200 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                XP Progress to Level 15
              </span>
              <span className="text-white font-bold">3,850 / 5,000 XP</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 rounded-full transition-all duration-500" style={{ width: '77%' }} />
            </div>

            <div className="flex items-center justify-between text-[11px] text-indigo-200/90 mt-3 pt-2.5 border-t border-white/10">
              <span>Next Title: <strong className="text-white">Junior Luminary</strong></span>
              <span className="text-amber-300 font-bold">+1,150 XP needed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Overview & Study Analytics
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'subjects'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Subject Competencies ({subjectList.length})
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'badges'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Badges & Trophies ({badges.filter((b) => b.unlocked).length}/{badges.length})
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'goals'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Study Targets & Goals
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value as any)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="term2">2025/2026 Second Term (Current)</option>
            <option value="term1">2025/2026 First Term</option>
          </select>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & STUDY ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Overall Term Mastery</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><TrendingUp className="w-4 h-4" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">89.4%</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">+4.2%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Across 8 registered subjects</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Study Time This Week</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600"><Clock className="w-4 h-4" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">19.8 hrs</span>
                <span className="text-xs font-bold text-emerald-600">+2.5 hrs vs last wk</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Goal: 18 hrs / week (Exceeded!)</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>CBT Questions Solved</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Brain className="w-4 h-4" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">412</span>
                <span className="text-xs font-bold text-slate-500">91% accuracy</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">WAEC & BECE practice mock questions</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Completed Lessons</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600"><BookOpen className="w-4 h-4" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">131 / 150</span>
                <span className="text-xs font-bold text-indigo-600">87% syllabus</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">On schedule for Week 8</p>
            </div>
          </div>

          {/* Weekly Study Time Chart + Topic Recommendation Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Weekly Study Bar Visualizer */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Weekly Study Rhythm & Focus Time (Hours)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daily logged study duration across homework, CBT drills and video modules</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  Daily Avg: 2.8 hrs
                </span>
              </div>

              {/* Chart Bars */}
              <div className="pt-4 pb-2">
                <div className="grid grid-cols-7 gap-3 items-end h-44 border-b border-slate-100 pb-2">
                  {[
                    { day: 'Mon', hours: 2.5, percent: 55, active: true },
                    { day: 'Tue', hours: 3.1, percent: 68, active: true },
                    { day: 'Wed', hours: 2.0, percent: 44, active: true },
                    { day: 'Thu', hours: 3.8, percent: 84, active: true },
                    { day: 'Fri', hours: 2.4, percent: 53, active: true },
                    { day: 'Sat', hours: 4.5, percent: 100, active: true, peak: true },
                    { day: 'Sun', hours: 1.5, percent: 33, active: true },
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.hours}h
                      </span>
                      <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            item.peak
                              ? 'bg-gradient-to-t from-indigo-600 to-purple-500'
                              : 'bg-gradient-to-t from-indigo-500 to-indigo-400 group-hover:from-indigo-600 group-hover:to-indigo-500'
                          }`}
                          style={{ height: `${item.percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Category Breakdown Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">CBT Mocks</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">7.0 hrs (35%)</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Video Lessons</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">5.0 hrs (25%)</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Assignments</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">4.0 hrs (20%)</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Reading Notes</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">3.8 hrs (20%)</p>
                </div>
              </div>
            </div>

            {/* Smart Study Recommendations Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  AI Study Insights
                </div>
                <h3 className="text-lg font-bold text-white mt-1">Recommended Next Focus</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Based on your recent Continuous Assessment 2 drills, here are the top 3 high-yield focus areas for {workspace.firstName}:
                </p>

                <div className="space-y-2.5 mt-4">
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                    <p className="text-xs font-bold text-indigo-300">Mathematics: Simultaneous Equations</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">Solve 5 practice problems using the elimination method.</p>
                    <button
                      onClick={() => handlePracticeTopicLaunch('Simultaneous Equations')}
                      className="mt-2 text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                    >
                      Start Quick 2-Min Drill <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                    <p className="text-xs font-bold text-emerald-300">Basic Science: Simple Machines</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">Review mechanical advantage and velocity ratio formulas.</p>
                  </div>

                  <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                    <p className="text-xs font-bold text-rose-300">French: Passé Composé with Être</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">Practice DR & MRS VANDERTRAMP verb agreement.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('learning')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Go to Learning Hub
              </button>
            </div>
          </div>

          {/* Quick Subject Mastery Grid */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Subject Mastery Leaderboard</h3>
                <p className="text-xs text-slate-500">Your current percentage competency across secondary school subjects</p>
              </div>
              <button
                onClick={() => setActiveTab('subjects')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View Detailed Syllabus Breakdown <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {subjectList.map((subject) => (
                <div
                  key={subject.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all bg-white group cursor-pointer"
                  onClick={() => {
                    setSelectedSubject(subject.id);
                    setActiveTab('subjects');
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {subject.name}
                    </span>
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {subject.masteryPercent}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full bg-gradient-to-r ${subject.color} rounded-full transition-all`}
                      style={{ width: `${subject.masteryPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{subject.completedLessons}/{subject.totalLessons} Lessons</span>
                    <span className="font-semibold text-slate-700">{subject.recentGrade}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBJECT COMPETENCIES (DETAILED SYLLABUS) */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          {/* Subject Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSubject === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Subjects ({subjectList.length})
            </button>
            {subjectList.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedSubject === s.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>

          {/* Subject Detail Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSubjects.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${sub.iconBg} border flex items-center justify-center font-extrabold text-sm`}>
                      {sub.code.split('-')[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{sub.name}</h3>
                      <p className="text-xs text-slate-500">{sub.code} • Teacher: {sub.teacher}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-extrabold text-slate-900">{sub.masteryPercent}%</div>
                    <span className="text-[11px] font-semibold text-emerald-600">Mastery Level</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Syllabus Completion ({sub.completedLessons}/{sub.totalLessons} Units)</span>
                    <span className="text-indigo-600 font-bold">{Math.round((sub.completedLessons / sub.totalLessons) * 100)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${sub.color} rounded-full`}
                      style={{ width: `${(sub.completedLessons / sub.totalLessons) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Topic Breakdown: Mastered vs Needs Practice */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1.5">
                    <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Mastered Topics (90%+)
                    </p>
                    <ul className="space-y-1 text-xs text-emerald-950">
                      {sub.strongTopics.map((topic, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="truncate">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1.5">
                    <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-amber-600" />
                      Priority Revision Topics
                    </p>
                    <ul className="space-y-1 text-xs text-amber-950">
                      {sub.focusTopics.map((topic, i) => (
                        <li key={i} className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span className="truncate">{topic}</span>
                          </div>
                          <button
                            onClick={() => handlePracticeTopicLaunch(topic)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-1.5 py-0.5 rounded shadow-2xs border border-amber-200"
                          >
                            Drill
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onOpenModal('report_card')}
                    className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    View Term Scores
                  </button>

                  <button
                    onClick={() => onNavigateTab('assessments')}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-indigo-700" />
                    Practice Subject Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACHIEVEMENT BADGES & TROPHIES */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Academic Milestones & Digital Badges
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Earn badges by completing weekly assignments early, acing CBT quizzes, and maintaining perfect class attendance.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-800 font-bold">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>6 of 8 Badges Unlocked</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  badge.unlocked
                    ? 'bg-white border-slate-200/80 shadow-xs hover:shadow-md'
                    : 'bg-slate-50/80 border-slate-200 opacity-75'
                }`}
              >
                {/* Rarity Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      badge.rarity === 'Legendary'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : badge.rarity === 'Epic'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : badge.rarity === 'Rare'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {badge.rarity}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">{badge.category}</span>
                </div>

                <div className="text-center py-2 space-y-2">
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl shadow-sm ${
                    badge.unlocked ? 'bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {badge.icon}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{badge.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{badge.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  {badge.unlocked ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unlocked on {badge.unlockedDate}
                    </span>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Progress</span>
                        <span>{badge.progress} / {badge.maxProgress}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${((badge.progress || 0) / (badge.maxProgress || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STUDY TARGETS & GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Add Goal Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              Set Weekly Academic Target
            </h3>
            <form onSubmit={handleAddGoal} className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                placeholder="e.g. Master Quadratic Formula, Complete 30 French vocab words..."
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(e.target.value)}
                className="flex-1 w-full text-xs sm:text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Goal
              </button>
            </form>
          </div>

          {/* Goals List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Active Study Goals ({goals.filter((g) => g.done).length}/{goals.length} Completed)</h3>
              <span className="text-xs text-slate-500">Tap checkbox when you complete a task</span>
            </div>

            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => handleToggleGoal(goal.id)}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all ${
                    goal.done
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        goal.done
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white hover:border-indigo-500'
                      }`}
                    >
                      {goal.done && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <div>
                      <p className={`text-xs sm:text-sm font-semibold ${goal.done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {goal.title}
                      </p>
                      <span className="text-[11px] text-slate-500 mt-0.5 inline-block">
                        Target: <strong className="text-slate-700">{goal.target}</strong>
                      </span>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    goal.done ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {goal.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Micro Drill Modal */}
      {activePracticeTopic && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Brain className="w-5 h-5" /></span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Instant Practice Drill</h3>
                  <p className="text-xs text-slate-500">Topic: {activePracticeTopic}</p>
                </div>
              </div>
              <button
                onClick={() => setActivePracticeTopic(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Question Box */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
              <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Question 1 of 1</p>
              <p className="text-sm font-semibold text-slate-900">
                Solve for <strong className="text-indigo-600">x</strong> and <strong className="text-indigo-600">y</strong> in the system:
                <br />
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 inline-block mt-1">2x + y = 10</span> and <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 inline-block mt-1">x - y = 2</span>
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {[
                { label: 'A', text: 'x = 3, y = 4' },
                { label: 'B', text: 'x = 4, y = 2', isCorrect: true },
                { label: 'C', text: 'x = 5, y = 0' },
                { label: 'D', text: 'x = 2, y = 6' },
              ].map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPracticeOption(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    isAnswerSubmitted
                      ? opt.isCorrect
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : practiceAnswer === idx
                        ? 'bg-rose-50 border-rose-500 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                      : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-800'
                  }`}
                >
                  <span><strong className="mr-2 font-mono">{opt.label}.</strong> {opt.text}</span>
                  {isAnswerSubmitted && opt.isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Explanation & Action */}
            {isAnswerSubmitted && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 animate-in fade-in">
                <p className="font-bold text-slate-800">
                  {practiceAnswer === 1 ? '🎉 Correct! +50 XP' : '💡 Explanation:'}
                </p>
                <p className="text-slate-600">
                  Add the two equations: (2x + y) + (x - y) = 10 + 2 → 3x = 12 → <strong>x = 4</strong>.
                  Substitute into x - y = 2: 4 - y = 2 → <strong>y = 2</strong>.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActivePracticeTopic(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                {isAnswerSubmitted ? 'Done & Collect XP' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
