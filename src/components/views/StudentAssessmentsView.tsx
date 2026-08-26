import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  Award,
  AlertCircle,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  FileText,
  Upload,
  Calendar,
  Layers,
  ChevronRight,
  BookOpen,
  Send,
  Flag,
  Calculator,
  HelpCircle,
  X,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { useStudentWorkspace } from '../../features/student/useStudentWorkspace';

interface StudentAssessmentsViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface AssessmentItem {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  type: 'cbt_test' | 'homework' | 'project' | 'bece_drill';
  dueDate: string;
  dueTimeAgo: string;
  duration?: string;
  totalMarks: number;
  score?: number;
  status: 'active' | 'submitted' | 'graded' | 'practice';
  teacher: string;
  instructions: string;
  questionsCount?: number;
}

export const StudentAssessmentsView: React.FC<StudentAssessmentsViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const workspace = useStudentWorkspace();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'graded' | 'drills'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // CBT Exam Simulator State
  const [isCbtActive, setIsCbtActive] = useState<boolean>(false);
  const [cbtTimeRemaining, setCbtTimeRemaining] = useState<number>(600); // 10 mins in seconds
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [isCbtSubmitted, setIsCbtSubmitted] = useState<boolean>(false);
  const [cbtFinalScore, setCbtFinalScore] = useState<number>(0);
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);
  const [scratchpadText, setScratchpadText] = useState<string>('');

  // Homework submission modal state
  const [selectedHomeworkForSubmit, setSelectedHomeworkForSubmit] = useState<AssessmentItem | null>(null);
  const [homeworkTextSubmission, setHomeworkTextSubmission] = useState<string>('');

  const assessments: AssessmentItem[] = [
    {
      id: 'ass_1',
      title: 'Continuous Assessment 2: Simultaneous Equations & Graphs',
      subject: 'Mathematics',
      subjectCode: 'MTH-201',
      type: 'cbt_test',
      dueDate: 'Tomorrow at 4:00 PM',
      dueTimeAgo: 'Due in 24 hours',
      duration: '15 mins',
      totalMarks: 20,
      status: 'active',
      teacher: 'Mr. Adewale Olawale',
      instructions: 'Timed CBT test. 10 multiple-choice questions covering elimination, substitution, and graphical intersection points.',
      questionsCount: 10,
    },
    {
      id: 'ass_2',
      title: 'Weekly Homework: Summary of "The Concubine" Chapter 4',
      subject: 'English Studies',
      subjectCode: 'ENG-201',
      type: 'homework',
      dueDate: 'Friday at 11:59 PM',
      dueTimeAgo: 'Due in 3 days',
      totalMarks: 10,
      status: 'active',
      teacher: 'Mrs. Folake Johnson',
      instructions: 'Write a 150-word concise summary highlighting the conflict between Madume and Emenike in Chapter 4.',
    },
    {
      id: 'ass_3',
      title: 'Python Function & List Algorithm Lab Project',
      subject: 'ICT & Coding',
      subjectCode: 'ICT-202',
      type: 'project',
      dueDate: 'Next Monday at 8:00 AM',
      dueTimeAgo: 'Due in 6 days',
      totalMarks: 25,
      status: 'active',
      teacher: 'Engr. Kenneth Obi',
      instructions: 'Submit a Python script (.py or text) that calculates student grade averages from an array of 5 subject scores.',
    },
    {
      id: 'ass_4',
      title: 'Continuous Assessment 1: Work, Energy & Simple Machines',
      subject: 'Basic Science',
      subjectCode: 'BST-201',
      type: 'cbt_test',
      dueDate: 'Completed on 10 Feb',
      dueTimeAgo: 'Graded',
      totalMarks: 20,
      score: 18,
      status: 'graded',
      teacher: 'Dr. (Mrs.) Alabi',
      instructions: 'CA1 covering kinetic and potential energy equations and velocity ratio calculations.',
      questionsCount: 10,
    },
    {
      id: 'ass_5',
      title: 'Civic Studies: Fundamental Human Rights Essay',
      subject: 'Civic Education',
      subjectCode: 'CVC-201',
      type: 'homework',
      dueDate: 'Completed on 05 Feb',
      dueTimeAgo: 'Graded',
      totalMarks: 15,
      score: 14,
      status: 'graded',
      teacher: 'Mr. Babatunde Musa',
      instructions: 'Discuss the role of the 1999 Nigerian Constitution in safeguarding citizens rights to free speech and association.',
    },
    {
      id: 'ass_6',
      title: 'National BECE Junior WAEC Past Exam Drill (2025 Paper 1)',
      subject: 'Mathematics',
      subjectCode: 'MTH-201',
      type: 'bece_drill',
      dueDate: 'Self-Paced Practice',
      dueTimeAgo: 'Open Access',
      duration: '10 mins',
      totalMarks: 20,
      status: 'practice',
      teacher: 'NERDC Examination Board',
      instructions: 'Official past questions from the National Examinations Council (NECO) BECE junior secondary syllabus.',
      questionsCount: 6,
    },
  ];

  // CBT Practice Exam Questions
  const cbtQuestions = [
    {
      id: 1,
      question: 'Solve for x and y in the simultaneous equations: x + y = 14 and x - y = 6.',
      options: ['x = 10, y = 4', 'x = 8, y = 6', 'x = 12, y = 2', 'x = 9, y = 5'],
      correct: 0,
      explanation: 'Add both equations: 2x = 20 → x = 10. Substitute x = 10 into x + y = 14 → y = 4.',
    },
    {
      id: 2,
      question: 'What is the gradient (slope) of the straight line with equation: 3y = 6x - 9?',
      options: ['m = 6', 'm = 2', 'm = -3', 'm = 3'],
      correct: 1,
      explanation: 'Divide both sides by 3 to get standard form y = mx + c: y = 2x - 3. The gradient m = 2.',
    },
    {
      id: 3,
      question: 'Factorize completely the algebraic expression: 9x² - 25y².',
      options: ['(3x - 5y)²', '(9x - 5y)(x + 5y)', '(3x - 5y)(3x + 5y)', '(3x + 5y)²'],
      correct: 2,
      explanation: 'This is a difference of two squares: a² - b² = (a - b)(a + b) where a = 3x and b = 5y.',
    },
    {
      id: 4,
      question: 'Calculate the length of the hypotenuse of a right-angled triangle with sides 6 cm and 8 cm.',
      options: ['10 cm', '14 cm', '12 cm', '48 cm'],
      correct: 0,
      explanation: 'By Pythagoras theorem: c² = a² + b² = 6² + 8² = 36 + 64 = 100 → c = √100 = 10 cm.',
    },
    {
      id: 5,
      question: 'If 4x - 7 = 21, what is the value of 2x + 3?',
      options: ['17', '14', '7', '11'],
      correct: 0,
      explanation: '4x = 21 + 7 = 28 → x = 7. Then 2x + 3 = 2(7) + 3 = 14 + 3 = 17.',
    },
    {
      id: 6,
      question: 'Find the simple interest on ₦50,000 for 3 years at 5% per annum.',
      options: ['₦7,500', '₦15,000', '₦2,500', '₦5,500'],
      correct: 0,
      explanation: 'Simple Interest I = (P × R × T) / 100 = (50,000 × 5 × 3) / 100 = ₦7,500.',
    },
  ];

  // CBT Timer countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCbtActive && !isCbtSubmitted && cbtTimeRemaining > 0) {
      timer = setInterval(() => {
        setCbtTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmitCbt();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCbtActive, isCbtSubmitted, cbtTimeRemaining]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStartCbt = () => {
    setIsCbtActive(true);
    setCbtTimeRemaining(600);
    setCurrentQuestionIdx(0);
    setUserAnswers({});
    setFlaggedQuestions({});
    setIsCbtSubmitted(false);
    setCbtFinalScore(0);
  };

  const handleSelectCbtOption = (optionIdx: number) => {
    if (isCbtSubmitted) return;
    setUserAnswers({ ...userAnswers, [currentQuestionIdx]: optionIdx });
  };

  const handleToggleFlag = () => {
    setFlaggedQuestions({
      ...flaggedQuestions,
      [currentQuestionIdx]: !flaggedQuestions[currentQuestionIdx],
    });
  };

  const handleAutoSubmitCbt = () => {
    let score = 0;
    cbtQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct) {
        score += 1;
      }
    });
    const calculatedScore = Math.round((score / cbtQuestions.length) * 20);
    setCbtFinalScore(calculatedScore);
    setIsCbtSubmitted(true);

    if (calculatedScore >= 16) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleSubmitHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkTextSubmission.trim()) return;

    feedbackBus.success(`Assignment "${selectedHomeworkForSubmit?.title}" submitted successfully for grading!`);
    setSelectedHomeworkForSubmit(null);
    setHomeworkTextSubmission('');
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
  };

  const filteredAssessments = assessments.filter((a) => {
    const matchesStatus =
      activeFilter === 'all'
        ? true
        : activeFilter === 'active'
        ? a.status === 'active'
        : activeFilter === 'graded'
        ? a.status === 'graded'
        : a.type === 'bece_drill';

    const matchesSubject =
      selectedSubject === 'all' || a.subject.toLowerCase().includes(selectedSubject.toLowerCase());

    return matchesStatus && matchesSubject;
  });

  if (workspace.isLive && !isCbtActive) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <CheckSquare className="mx-auto mb-3 h-10 w-10 text-indigo-500" />
          <h1 className="text-xl font-bold text-slate-900">No assessments assigned</h1>
          <p className="mt-2 text-sm text-slate-500">
            {workspace.isPersonal
              ? `${workspace.firstName}, school quizzes and homework appear after you join a school. You can still try a practice CBT below.`
              : `${workspace.firstName}, ${workspace.schoolLabel} has not assigned any assessments to you yet.`}
          </p>
          <button
            onClick={handleStartCbt}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            <Play className="h-4 w-4 fill-white" />
            Launch practice CBT
          </button>
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
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px] uppercase tracking-wide">
              Examinations & Continuous Assessment
            </span>
            <span className="text-xs text-slate-400 font-medium">JSS 2 Term 2 Evaluation Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Assessments, Quizzes & CBT Simulator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Take timed computer-based tests, submit homework essays, and practice BECE junior secondary exam papers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartCbt}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            Launch Live CBT Mock Exam
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            All Assessments ({assessments.length})
          </button>
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'active'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Active / Due Soon ({assessments.filter((a) => a.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveFilter('graded')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'graded'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Graded ({assessments.filter((a) => a.status === 'graded').length})
          </button>
          <button
            onClick={() => setActiveFilter('drills')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'drills'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            BECE / WAEC Drills
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Basic Science">Basic Science</option>
            <option value="English Studies">English Studies</option>
            <option value="ICT">ICT & Coding</option>
            <option value="Civic Education">Civic Education</option>
          </select>
        </div>
      </div>

      {/* Grid of Assessments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssessments.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {item.subject} • {item.subjectCode}
                </span>

                {item.status === 'active' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    {item.dueTimeAgo}
                  </span>
                ) : item.status === 'graded' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Score: {item.score}/{item.totalMarks} ({Math.round(((item.score || 0) / item.totalMarks) * 100)}%)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    Practice Drill
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                {item.instructions}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Teacher: <strong className="text-slate-700">{item.teacher}</strong></span>
                <span>Max: <strong className="text-slate-700">{item.totalMarks} Marks</strong></span>
              </div>

              {item.status === 'active' && item.type === 'cbt_test' && (
                <button
                  onClick={handleStartCbt}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Start CBT Test ({item.duration})
                </button>
              )}

              {item.status === 'active' && (item.type === 'homework' || item.type === 'project') && (
                <button
                  onClick={() => setSelectedHomeworkForSubmit(item)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Submit Assignment
                </button>
              )}

              {item.status === 'graded' && (
                <button
                  onClick={() => onOpenModal('report_card')}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  View Correction & Rubric
                </button>
              )}

              {item.status === 'practice' && (
                <button
                  onClick={handleStartCbt}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Practice Now ({item.questionsCount} Qs)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FULL SCREEN / MODAL CBT SIMULATOR */}
      {isCbtActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            
            {/* Top CBT Navigation Bar */}
            <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between gap-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                  CBT
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">
                    {workspace.schoolLabel} • CBT Examination System
                  </h3>
                  <p className="text-[10px] text-indigo-300">
                    Candidate: {workspace.displayName}
                    {workspace.classLabel ? ` (${workspace.classLabel})` : ''} • Mathematics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Timer Clock */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold ${
                  cbtTimeRemaining < 120 ? 'bg-rose-500/20 text-rose-300 animate-pulse border border-rose-500/30' : 'bg-white/10 text-emerald-300'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimer(cbtTimeRemaining)}</span>
                </div>

                <button
                  onClick={() => setShowScratchpad(!showScratchpad)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Calculator className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Scratchpad</span>
                </button>

                {!isCbtSubmitted && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to end this CBT exam session?')) {
                        handleAutoSubmitCbt();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    Submit Exam
                  </button>
                )}

                <button
                  onClick={() => setIsCbtActive(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CBT Body Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
              
              {/* Left Question Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-5">
                {!isCbtSubmitted ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl">
                        Question {currentQuestionIdx + 1} of {cbtQuestions.length}
                      </span>

                      <button
                        onClick={handleToggleFlag}
                        className={`text-xs font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5 transition-colors ${
                          flaggedQuestions[currentQuestionIdx]
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Flag className={`w-3.5 h-3.5 ${flaggedQuestions[currentQuestionIdx] ? 'fill-amber-500 text-amber-500' : ''}`} />
                        <span>{flaggedQuestions[currentQuestionIdx] ? 'Flagged for Review' : 'Flag Question'}</span>
                      </button>
                    </div>

                    {/* Question Statement */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                      <p className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                        {cbtQuestions[currentQuestionIdx].question}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-2.5">
                      {cbtQuestions[currentQuestionIdx].options.map((optionText, optIdx) => {
                        const isSelected = userAnswers[currentQuestionIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectCbtOption(optIdx)}
                            className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{optionText}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next / Previous Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <button
                        disabled={currentQuestionIdx === 0}
                        onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors"
                      >
                        ← Previous
                      </button>

                      <span className="text-xs text-slate-400">
                        Answered {Object.keys(userAnswers).length} of {cbtQuestions.length}
                      </span>

                      <button
                        disabled={currentQuestionIdx === cbtQuestions.length - 1}
                        onClick={() => setCurrentQuestionIdx((prev) => Math.min(cbtQuestions.length - 1, prev + 1))}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </>
                ) : (
                  /* SUBMITTED RESULTS SUMMARY */
                  <div className="space-y-6 animate-in fade-in">
                    <div className="p-6 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl text-white text-center space-y-3 shadow-lg">
                      <Trophy className="w-12 h-12 text-amber-300 mx-auto animate-bounce" />
                      <h3 className="text-xl font-extrabold text-white">CBT Exam Completed!</h3>
                      <p className="text-xs text-indigo-200">
                        {workspace.displayName} • Mathematics Mid-Term CA Drill
                      </p>

                      <div className="p-4 bg-white/10 rounded-2xl inline-block min-w-[200px] border border-white/10 mt-2">
                        <span className="text-3xl font-extrabold text-white">{cbtFinalScore} / 20</span>
                        <p className="text-[11px] text-amber-300 font-bold mt-0.5">
                          {cbtFinalScore >= 16 ? 'Distinction Performance! 🌟' : 'Good Effort!'}
                        </p>
                      </div>
                    </div>

                    {/* Question by Question Review */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detailed Solution Breakdown</h4>
                      {cbtQuestions.map((q, idx) => {
                        const isCorrect = userAnswers[idx] === q.correct;
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border ${
                              isCorrect ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
                            } space-y-2`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                Question {idx + 1}: {q.question}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isCorrect ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                                }`}
                              >
                                {isCorrect ? 'Correct (+3.3 pts)' : 'Incorrect (0 pts)'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600">
                              Correct Answer: <strong className="text-emerald-800">{q.options[q.correct]}</strong>
                            </p>
                            <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200">
                              💡 <strong>Explanation:</strong> {q.explanation}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Palette & Scratchpad (Desktop) */}
              <div className="w-full md:w-72 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-5 space-y-5 overflow-y-auto">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Question Palette
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {cbtQuestions.map((_, idx) => {
                      const isAnswered = userAnswers[idx] !== undefined;
                      const isFlagged = flaggedQuestions[idx];
                      const isCurrent = currentQuestionIdx === idx;

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentQuestionIdx(idx)}
                          className={`h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'ring-2 ring-indigo-600 ring-offset-2'
                              : ''
                          } ${
                            isFlagged
                              ? 'bg-amber-400 text-slate-900'
                              : isAnswered
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-4 pt-3 border-t border-slate-100 flex-wrap">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600" /> Answered</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400" /> Flagged</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-200" /> Unanswered</span>
                  </div>
                </div>

                {/* Scratchpad Card */}
                {showScratchpad && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
                      <Calculator className="w-3.5 h-3.5 text-amber-700" />
                      Rough Work Scratchpad
                    </p>
                    <textarea
                      rows={5}
                      placeholder="Type calculations or rough notes here..."
                      value={scratchpadText}
                      onChange={(e) => setScratchpadText(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-amber-200 rounded-xl font-mono focus:outline-none"
                    />
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Homework Submission Modal */}
      {selectedHomeworkForSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {selectedHomeworkForSubmit.subject} • {selectedHomeworkForSubmit.subjectCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Submit Assignment</h3>
              </div>
              <button
                onClick={() => setSelectedHomeworkForSubmit(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedHomeworkForSubmit.title}</p>
              <p className="text-slate-500">{selectedHomeworkForSubmit.instructions}</p>
            </div>

            <form onSubmit={handleSubmitHomework} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your Answer / Essay Text
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Type or paste your completed assignment essay or code solution here..."
                  value={homeworkTextSubmission}
                  onChange={(e) => setHomeworkTextSubmission(e.target.value)}
                  className="w-full text-xs p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3.5 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-1 bg-slate-50 hover:bg-indigo-50/30 transition-colors cursor-pointer">
                <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Attach Document / Photo of Written Notes</p>
                <p className="text-[10px] text-slate-400">Supports PDF, DOCX, JPG, PNG up to 15MB</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedHomeworkForSubmit(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Turn In Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
