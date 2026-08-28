import React, { useState } from 'react';
import type { CBTQuiz, StudentScoreEntry } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Save,
  Send,
  Sparkles,
  ShieldCheck,
  Download,
  Printer,
  Plus,
  Brain,
  Clock,
  BookOpen,
  HelpCircle,
  Layers,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  Share2,
  FileText,
  Scan,
  RefreshCw,
  Copy,
  Sliders,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiMutation, describeApiError } from '../../lib/apiClient';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';

type AssessmentStudioTab = 'builder' | 'scores' | 'repository' | 'analytics';
type AssessmentType = 'terminal-exam' | 'periodic-test' | 'assignment' | 'quick-quiz';

interface GeneratedMCQ {
  number: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
  cognitiveLevel: string;
}

interface GeneratedTheoryPart {
  subQuestion: string;
  marks: number;
  markingGuide: string;
}

interface GeneratedTheory {
  number: number;
  parts: GeneratedTheoryPart[];
}

interface GeneratedAssessment {
  title: string;
  schoolName: string;
  subject: string;
  classLevel: string;
  term: string;
  topics: string;
  timeAllowed: string;
  totalMarks: number;
  generalInstructions: string;
  sectionA: {
    title: string;
    instructions: string;
    totalMarks: number;
    questions: GeneratedMCQ[];
  };
  sectionB: {
    title: string;
    instructions: string;
    totalMarks: number;
    questions: GeneratedTheory[];
  };
  markingScheme: {
    summary: string;
    gradeBoundaries: { grade: string; minScore: number; description: string }[];
  };
}

export const AssessmentsView: React.FC = () => {
  const {
    assessments,
    updateAssessmentScore,
    lockAssessment,
    currentRole,
    branding,
    showToast,
    cbtQuizzes,
    setCbtQuizzes,
  } = useApp();

  const [activeStudioTab, setActiveStudioTab] = useState<AssessmentStudioTab>('builder');

  // =========================================================================
  // AI ASSESSMENT BUILDER FORM STATE
  // =========================================================================
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('periodic-test');
  const [subject, setSubject] = useState('Mathematics');
  const [classLevel, setClassLevel] = useState('JSS 2');
  const [term, setTerm] = useState('1st Term');
  const [topics, setTopics] = useState('Linear Equations, Algebraic Simplification & Word Problems');
  const [totalMarks, setTotalMarks] = useState(40);
  const [timeAllowed, setTimeAllowed] = useState('45 Minutes');
  const [mcqCount, setMcqCount] = useState(5);
  const [theoryCount, setTheoryCount] = useState(2);
  const [difficulty, setDifficulty] = useState('Medium');
  const [instructions, setInstructions] = useState('Answer all questions in Section A and two questions in Section B. Show all mathematical workings.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(true);

  // Generated Assessment State
  const [generatedAssessment, setGeneratedAssessment] = useState<GeneratedAssessment | null>({
    title: "1st Term Continuous Assessment Test: Mathematics",
    schoolName: branding.schoolName,
    subject: "Mathematics",
    classLevel: "JSS 2 Diamond",
    term: "1st Term",
    topics: "Linear Equations and Algebraic Expressions",
    timeAllowed: "45 Minutes",
    totalMarks: 40,
    generalInstructions: "Answer all questions in Section A and all questions in Section B. Write clearly and show orderly mathematical workings.",
    sectionA: {
      title: "Section A: Multiple-Choice Questions (Objective)",
      instructions: "Choose the correct option from the lettered choices A - D. (2 Marks each)",
      totalMarks: 10,
      questions: [
        {
          number: 1,
          text: "If 3x + 7 = 22, what is the value of x in the given linear equation?",
          options: ["A) x = 3", "B) x = 5", "C) x = 7", "D) x = 15"],
          correctAnswer: "B",
          explanation: "Subtract 7 from both sides to obtain 3x = 15. Divide both sides by 3 to get x = 5.",
          marks: 2,
          cognitiveLevel: "Application",
        },
        {
          number: 2,
          text: "Simplify the algebraic expression: 4(2a - 3b) + 5b.",
          options: ["A) 8a - 7b", "B) 8a + 7b", "C) 8a - 12b", "D) 6a - b"],
          correctAnswer: "A",
          explanation: "Expanding the brackets gives 8a - 12b. Adding + 5b gives 8a - 7b.",
          marks: 2,
          cognitiveLevel: "Comprehension",
        },
        {
          number: 3,
          text: "Find the coefficient of y in the expression: 7x² - 9y + 14.",
          options: ["A) 7", "B) 9", "C) -9", "D) 14"],
          correctAnswer: "C",
          explanation: "The coefficient includes the negative sign preceding the variable, hence -9.",
          marks: 2,
          cognitiveLevel: "Knowledge",
        },
        {
          number: 4,
          text: "A father is 4 times as old as his son. If the sum of their ages is 50 years, how old is the son?",
          options: ["A) 8 years", "B) 10 years", "C) 12 years", "D) 15 years"],
          correctAnswer: "B",
          explanation: "Let son's age = s. Father's age = 4s. s + 4s = 50 => 5s = 50 => s = 10 years.",
          marks: 2,
          cognitiveLevel: "Analysis",
        },
        {
          number: 5,
          text: "Evaluate 2m² - 3n when m = 3 and n = 4.",
          options: ["A) 6", "B) 12", "C) 18", "D) 24"],
          correctAnswer: "A",
          explanation: "Substitute values: 2(3)² - 3(4) = 2(9) - 12 = 18 - 12 = 6.",
          marks: 2,
          cognitiveLevel: "Application",
        },
      ],
    },
    sectionB: {
      title: "Section B: Structured Theory Questions",
      instructions: "Answer all questions. Show clear step-by-step working. Total = 30 Marks.",
      totalMarks: 30,
      questions: [
        {
          number: 1,
          parts: [
            {
              subQuestion: "(a) Define what is meant by an algebraic equation and state the difference between an expression and an equation.",
              marks: 5,
              markingGuide: "2 marks for formal definition (mathematical statement asserting equality of two expressions), 3 marks for stating that an equation contains an equality symbol '=' whereas an expression does not.",
            },
            {
              subQuestion: "(b) Solve the equation: 5(2x - 1) = 3(x + 4) + 4. Show each step clearly.",
              marks: 10,
              markingGuide: "Step 1: Expand brackets 10x - 5 = 3x + 12 + 4 (3 marks). Step 2: Simplify RHS 10x - 5 = 3x + 16 (2 marks). Step 3: Collect like terms 10x - 3x = 16 + 5 => 7x = 21 (3 marks). Step 4: Divide by 7 => x = 3 (2 marks).",
            },
          ],
        },
        {
          number: 2,
          parts: [
            {
              subQuestion: "(a) The perimeter of a rectangle is 36 cm. If the length is 4 cm longer than the breadth, find the length and breadth of the rectangle.",
              marks: 10,
              markingGuide: "Let breadth = b. Length = b + 4 (2 marks). Perimeter = 2(l + b) = 2(b + 4 + b) = 2(2b + 4) = 4b + 8 (3 marks). Set 4b + 8 = 36 => 4b = 28 => b = 7 cm (3 marks). Length = 7 + 4 = 11 cm (2 marks).",
            },
            {
              subQuestion: "(b) Verify your answer by calculating the perimeter with the obtained dimensions.",
              marks: 5,
              markingGuide: "Perimeter = 2(11 + 7) = 2(18) = 36 cm. Confirmed equal to given perimeter (5 marks).",
            },
          ],
        },
      ],
    },
    markingScheme: {
      summary: "NERDC Continuous Assessment Scheme: Objective (10 Marks) + Theory (30 Marks) = 40 Total Marks.",
      gradeBoundaries: [
        { grade: "A1 (Distinction)", minScore: 30, description: "Exceptional mastery of algebraic procedures." },
        { grade: "B2 (Very Good)", minScore: 28, description: "Commendable understanding with minor computational errors." },
        { grade: "C4 (Credit)", minScore: 24, description: "Adequate problem-solving competence." },
        { grade: "C6 (Pass)", minScore: 20, description: "Minimum threshold for continuous assessment." },
        { grade: "F9 (Needs Support)", minScore: 0, description: "Requires remedial intervention and extra tutoring." },
      ],
    },
  });

  // Saved Assessments Repository — populated by the AI builder's "Save to Bank" action
  const [repository, setRepository] = useState<Array<{
    id: string; title: string; type: string; subject: string; level: string;
    marks: number; questionsCount: string; date: string; status: string;
  }>>([]);

  // =========================================================================
  // CONTINUOUS ASSESSMENT SCORE SHEET STATE
  // =========================================================================
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(assessments[0]?.id || 'asm-1');
  const currentAssessment = assessments.find((a) => a.id === selectedAssessmentId) || assessments[0];

  const handleScoreChange = (scoreId: string, field: 'ca1' | 'ca2' | 'midTerm' | 'exam', value: number) => {
    if (currentAssessment.status === 'Approved') {
      showToast('Assessment Locked', 'Approved score sheets cannot be edited without Principal unlock.');
      return;
    }

    const targetScore = currentAssessment.scores.find((s) => (s.id ?? s.studentId) === scoreId);
    if (!targetScore) return;

    const ca1 = field === 'ca1' ? value : targetScore.ca1;
    const ca2 = field === 'ca2' ? value : targetScore.ca2;
    const midTerm = field === 'midTerm' ? value : targetScore.midTerm;
    const exam = field === 'exam' ? value : targetScore.exam;
    const total = ca1 + ca2 + midTerm + exam;

    let grade: StudentScoreEntry['grade'] = 'F9';
    if (total >= 75) grade = 'A1';
    else if (total >= 70) grade = 'B2';
    else if (total >= 65) grade = 'B3';
    else if (total >= 60) grade = 'C4';
    else if (total >= 55) grade = 'C5';
    else if (total >= 50) grade = 'C6';
    else if (total >= 45) grade = 'D7';
    else if (total >= 40) grade = 'E8';

    updateAssessmentScore(currentAssessment.id, scoreId, {
      [field]: value,
      total,
      grade,
    });
  };

  const handleToggleLock = () => {
    if (currentAssessment.status === 'Approved') {
      lockAssessment(currentAssessment.id, false);
      showToast('Sheet Unlocked', 'Assessment score sheet unlocked for revisions.');
    } else {
      lockAssessment(currentAssessment.id, true);
      showToast('Sheet Approved & Locked', 'Scores finalized for term report card compilation.');
    }
  };

  // AI Generation Trigger
  const handleGenerateAssessment = async () => {
    setIsGenerating(true);
    try {
      const response = await apiMutation<{ success: true; data: { assessment: any } }>('/ai/assessment', 'POST', {
          assessmentType,
          subject,
          classLevel,
          term,
          topics,
          totalMarks,
          timeAllowed,
          mcqCount,
          theoryCount,
          difficulty,
          instructions,
          schoolName: branding.schoolName,
      });
      if (response.data.assessment) {
        setGeneratedAssessment(response.data.assessment);
        showToast('Assessment Generated', `Successfully built ${response.data.assessment.title} with full marking scheme!`);
      } else {
        throw new Error('No assessment returned');
      }
    } catch (err) {
      showToast('Assessment generation failed', describeApiError(err), 'failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Deploy to CBT Engine
  const handleDeployToCbt = () => {
    if (!generatedAssessment) return;

    const newCbtQuiz: CBTQuiz = {
      id: `cbt-gen-${Date.now()}`,
      title: generatedAssessment.title,
      subject: generatedAssessment.subject,
      classLevel: generatedAssessment.classLevel,
      term,
      session: branding.academicSession,
      durationMinutes: parseInt(generatedAssessment.timeAllowed) || 45,
      totalQuestions: generatedAssessment.sectionA.questions.length,
      totalMarks: generatedAssessment.totalMarks,
      passPercentage: 50,
      isPublished: true,
      shuffleQuestions: true,
      status: 'active' as const,
      attemptCount: 0,
      avgScore: 0,
      questions: generatedAssessment.sectionA.questions.map((q) => ({
        id: `q-${q.number}`,
        text: q.text,
        options: q.options.map((option, index) => ({ id: String.fromCharCode(65 + index), text: option })),
        correctOptionId: q.correctAnswer,
        explanation: q.explanation,
      })),
    };

    setCbtQuizzes([newCbtQuiz, ...cbtQuizzes]);
    showToast('Deployed to CBT Engine', 'Students can now take this examination online in the CBT portal!');
  };

  // Save to Repository
  const handleSaveToRepository = () => {
    if (!generatedAssessment) return;

    const newEntry = {
      id: `rep-${Date.now()}`,
      title: generatedAssessment.title,
      type: assessmentType === 'terminal-exam' ? 'Terminal Exam' : assessmentType === 'assignment' ? 'Assignment' : assessmentType === 'quick-quiz' ? 'Quick Quiz' : 'Periodic Test',
      subject: generatedAssessment.subject,
      level: generatedAssessment.classLevel,
      marks: generatedAssessment.totalMarks,
      questionsCount: `${generatedAssessment.sectionA.questions.length} MCQ + ${generatedAssessment.sectionB.questions.length} Theory`,
      date: 'Just now',
      status: 'Saved in Bank',
    };

    setRepository([newEntry, ...repository]);
    showToast('Saved to Repository', 'Assessment stored in school item bank.');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. STUDIO HEADER WITH TABS                                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">
                  Assessment Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  AI-Powered
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Set exams, periodic tests, classroom assignments, and CBT quizzes with marking schemes & score sheets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveStudioTab('builder');
                showToast('AI Studio Ready', 'Select your subject and topic to generate a fresh assessment.');
              }}
              className="px-4 py-2 bg-indigo-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-300" />
              <span>Create New Assessment</span>
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveStudioTab('builder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeStudioTab === 'builder'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Assessment Creator</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('scores')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeStudioTab === 'scores'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Continuous Assessment Score Sheets</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('repository')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeStudioTab === 'repository'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Assessment Question Bank ({repository.length})</span>
          </button>

          <button
            onClick={() => setActiveStudioTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeStudioTab === 'analytics'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Curriculum Mastery Radar</span>
          </button>
        </div>
      </div>

      <SkuggleAIBuddy
        variant="inline"
        contextHint="Assessment Assistant: I can generate terminal exam questions with objective and theory sections, format marking schemes, or calculate CA grades automatically."
      />

      {/* ========================================================================= */}
      {/* 2. TAB CONTENT 1: AI ASSESSMENT BUILDER                                   */}
      {/* ========================================================================= */}
      {activeStudioTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Generator Form Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-indigo-700" />
                <h3 className="font-display font-bold text-sm text-slate-900">
                  Assessment Parameters
                </h3>
              </div>

              {/* Assessment Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assessment Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'terminal-exam', label: 'Terminal Exam', icon: Award },
                    { id: 'periodic-test', label: 'Periodic Test', icon: FileSpreadsheet },
                    { id: 'assignment', label: 'Assignment', icon: BookOpen },
                    { id: 'quick-quiz', label: 'Quick Quiz', icon: Brain },
                  ].map((t) => {
                    const IconComp = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAssessmentType(t.id as AssessmentType)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          assessmentType === t.id
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject & Class */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Basic Science & Technology">Basic Science</option>
                    <option value="English Studies">English Studies</option>
                    <option value="Civic Education">Civic Education</option>
                    <option value="Business Studies">Business Studies</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Economics">Economics</option>
                    <option value="Agricultural Science">Agricultural Science</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Class Level
                  </label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="JSS 1">JSS 1</option>
                    <option value="JSS 2">JSS 2</option>
                    <option value="JSS 3">JSS 3</option>
                    <option value="SS 1">SS 1</option>
                    <option value="SS 2">SS 2</option>
                    <option value="SS 3">SS 3</option>
                    <option value="Primary 5">Primary 5</option>
                    <option value="Primary 6">Primary 6</option>
                  </select>
                </div>
              </div>

              {/* Term & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Academic Term
                  </label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="1st Term">1st Term</option>
                    <option value="2nd Term">2nd Term</option>
                    <option value="3rd Term">3rd Term</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cognitive Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Balanced (NERDC Standard)">Balanced (Standard)</option>
                    <option value="Foundational / Easy">Foundational / Easy</option>
                    <option value="Advanced / Olympiad Level">Advanced / Rigorous</option>
                  </select>
                </div>
              </div>

              {/* Topics Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Curriculum Topic(s) / Scheme Focus
                </label>
                <textarea
                  rows={2}
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="e.g. Linear Equations, Simultaneous Equations, Word Problems"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Counts & Marks */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    MCQs
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={mcqCount}
                    onChange={(e) => setMcqCount(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-bold p-2 text-center rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Theory Qs
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={theoryCount}
                    onChange={(e) => setTheoryCount(parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-bold p-2 text-center rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(parseInt(e.target.value) || 40)}
                    className="w-full text-xs font-bold p-2 text-center rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Time Allowed */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Time Allowed
                </label>
                <input
                  type="text"
                  value={timeAllowed}
                  onChange={(e) => setTimeAllowed(e.target.value)}
                  placeholder="e.g. 45 Minutes or 1 Hour 30 Mins"
                  className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Generate Action Button */}
              <button
                onClick={handleGenerateAssessment}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-900 to-purple-900 hover:from-indigo-950 hover:to-purple-950 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] disabled:opacity-70"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                    <span>Constructing Assessment Paper...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span>Generate Assessment with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Complete Assessment Paper & Marking Scheme (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {generatedAssessment && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Paper Header / Toolbar */}
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-extrabold bg-indigo-100 text-indigo-900 rounded-lg">
                      {generatedAssessment.classLevel}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {generatedAssessment.subject} · {generatedAssessment.term}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Toggle Answer Key Button */}
                    <button
                      onClick={() => setShowAnswerKey(!showAnswerKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                        showAnswerKey
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {showAnswerKey ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-purple-600" />
                          <span>Marking Scheme Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Student View (Hidden Key)</span>
                        </>
                      )}
                    </button>

                    {/* Deploy to CBT */}
                    <button
                      onClick={handleDeployToCbt}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      <span>Deploy to CBT</span>
                    </button>

                    {/* Save to Repo */}
                    <button
                      onClick={handleSaveToRepository}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save to Bank</span>
                    </button>

                    {/* Print */}
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print PDF</span>
                    </button>
                  </div>
                </div>

                {/* Printable Paper Canvas */}
                <div className="p-6 sm:p-8 space-y-6 text-slate-900 font-sans">
                  {/* Institutional Exam Header */}
                  <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                    <h2 className="font-display font-extrabold text-lg sm:text-xl text-slate-950 uppercase tracking-tight">
                      {branding.schoolName}
                    </h2>
                    <h3 className="font-display font-bold text-sm text-slate-800">
                      {generatedAssessment.title}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                      <span><strong>Class:</strong> {generatedAssessment.classLevel}</span>
                      <span>•</span>
                      <span><strong>Subject:</strong> {generatedAssessment.subject}</span>
                      <span>•</span>
                      <span><strong>Time Allowed:</strong> {generatedAssessment.timeAllowed}</span>
                      <span>•</span>
                      <span><strong>Total Marks:</strong> {generatedAssessment.totalMarks} Marks</span>
                    </div>
                  </div>

                  {/* General Instructions Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <strong>General Instructions:</strong> {generatedAssessment.generalInstructions}
                  </div>

                  {/* SECTION A: MULTIPLE CHOICE QUESTIONS */}
                  {generatedAssessment.sectionA.questions.length > 0 && (
                    <div className="space-y-4">
                      <div className="pb-1 border-b border-slate-200 flex items-center justify-between">
                        <h4 className="font-display font-bold text-sm text-slate-900 uppercase">
                          {generatedAssessment.sectionA.title}
                        </h4>
                        <span className="text-xs font-bold text-indigo-700">
                          {generatedAssessment.sectionA.totalMarks} Marks
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 italic">
                        {generatedAssessment.sectionA.instructions}
                      </p>

                      <div className="space-y-4 pt-1">
                        {generatedAssessment.sectionA.questions.map((q) => (
                          <div
                            key={q.number}
                            className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold text-slate-900">
                                {q.number}. {q.text}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                                {q.marks} Marks
                              </span>
                            </div>

                            {/* 4 Options Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-2">
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = showAnswerKey && opt.startsWith(q.correctAnswer);
                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2 rounded-xl border text-xs font-medium ${
                                      isCorrect
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                                        : 'bg-slate-50/60 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {opt}
                                    {isCorrect && (
                                      <span className="ml-2 text-[10px] text-emerald-700 font-extrabold uppercase">
                                        ✓ Correct Key
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Marking Explanation */}
                            {showAnswerKey && q.explanation && (
                              <div className="mt-2 p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 text-[11px] text-purple-900">
                                <strong>Rationale / Teacher Guide:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION B: THEORY & STRUCTURED QUESTIONS */}
                  {generatedAssessment.sectionB.questions.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="pb-1 border-b border-slate-200 flex items-center justify-between">
                        <h4 className="font-display font-bold text-sm text-slate-900 uppercase">
                          {generatedAssessment.sectionB.title}
                        </h4>
                        <span className="text-xs font-bold text-indigo-700">
                          {generatedAssessment.sectionB.totalMarks} Marks
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 italic">
                        {generatedAssessment.sectionB.instructions}
                      </p>

                      <div className="space-y-4 pt-1">
                        {generatedAssessment.sectionB.questions.map((q) => (
                          <div
                            key={q.number}
                            className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 text-xs"
                          >
                            <h5 className="font-bold text-slate-900 text-sm">
                              Question {q.number}:
                            </h5>

                            <div className="space-y-3 pl-2">
                              {q.parts.map((part, pIdx) => (
                                <div key={pIdx} className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-medium text-slate-800">
                                      {part.subQuestion}
                                    </p>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 shrink-0">
                                      ({part.marks} Marks)
                                    </span>
                                  </div>

                                  {/* Detailed Rubric & Marking Guide */}
                                  {showAnswerKey && part.markingGuide && (
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 space-y-1">
                                      <strong className="text-slate-900 font-bold block">
                                        Marking Rubric & Step Allocation:
                                      </strong>
                                      <p>{part.markingGuide}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SECTION C: NERDC GRADING SCHEME */}
                  {showAnswerKey && generatedAssessment.markingScheme && (
                    <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-700" />
                        <h4 className="font-display font-bold text-xs text-indigo-950 uppercase tracking-wide">
                          Continuous Assessment Grade Scale & Pass Thresholds
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        {generatedAssessment.markingScheme.gradeBoundaries.map((gb, i) => (
                          <div key={i} className="p-2 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                            <strong className="text-indigo-900 font-bold block">{gb.grade}</strong>
                            <span className="text-[11px] text-slate-600 block">≥ {gb.minScore} Marks</span>
                            <span className="text-[10px] text-slate-500">{gb.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB CONTENT 2: CONTINUOUS ASSESSMENT SCORE SHEETS                      */}
      {/* ========================================================================= */}
      {activeStudioTab === 'scores' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Continuous Assessment & Terminal Score Register
              </h3>
              <p className="text-xs text-slate-500">
                Enter CA1 (15mks), CA2 (15mks), Mid-Term (10mks), and Exam (60mks) with automated NERDC grading.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  currentAssessment.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentAssessment.status === 'Submitted'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentAssessment.status === 'Approved'
                  ? 'Approved & Locked'
                  : currentAssessment.status === 'Submitted'
                  ? 'Submitted for Review'
                  : 'Draft in Progress'}
              </span>

              {(currentRole === 'Principal' || currentRole === 'School Admin') && (
                <button
                  onClick={handleToggleLock}
                  className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    currentAssessment.status === 'Approved'
                      ? 'bg-slate-800 hover:bg-slate-900 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {currentAssessment.status === 'Approved' ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock Sheet</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Approve & Lock</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
            {assessments.map((asm) => (
              <button
                key={asm.id}
                onClick={() => setSelectedAssessmentId(asm.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  selectedAssessmentId === asm.id
                    ? 'bg-indigo-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{asm.subject} ({asm.classLevel})</span>
                {asm.status === 'Approved' && <Lock className="w-3 h-3 text-emerald-400" />}
              </button>
            ))}
          </div>

          {/* Scores Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-800 font-bold">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-2 text-center w-24">CA 1 (15)</th>
                  <th className="py-3 px-2 text-center w-24">CA 2 (15)</th>
                  <th className="py-3 px-2 text-center w-24">Mid-Term (10)</th>
                  <th className="py-3 px-2 text-center w-24">Exam (60)</th>
                  <th className="py-3 px-3 text-center bg-indigo-50 font-extrabold w-24">Total (100)</th>
                  <th className="py-3 px-3 text-center w-20">Grade</th>
                  <th className="py-3 px-4">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentAssessment.scores.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <strong className="text-xs font-bold text-slate-900 block">{row.studentName}</strong>
                      <span className="text-[10px] font-mono text-slate-500">{row.studentId}</span>
                    </td>

                    {/* CA 1 */}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        max={15}
                        min={0}
                        value={row.ca1}
                        disabled={currentAssessment.status === 'Approved'}
                        onChange={(e) => handleScoreChange(row.id, 'ca1', parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-bold text-xs p-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
                      />
                    </td>

                    {/* CA 2 */}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        max={15}
                        min={0}
                        value={row.ca2}
                        disabled={currentAssessment.status === 'Approved'}
                        onChange={(e) => handleScoreChange(row.id, 'ca2', parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-bold text-xs p-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
                      />
                    </td>

                    {/* Mid-Term */}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        max={10}
                        min={0}
                        value={row.midTerm}
                        disabled={currentAssessment.status === 'Approved'}
                        onChange={(e) => handleScoreChange(row.id, 'midTerm', parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-bold text-xs p-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
                      />
                    </td>

                    {/* Exam */}
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        max={60}
                        min={0}
                        value={row.exam}
                        disabled={currentAssessment.status === 'Approved'}
                        onChange={(e) => handleScoreChange(row.id, 'exam', parseInt(e.target.value) || 0)}
                        className="w-16 text-center font-bold text-xs p-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
                      />
                    </td>

                    {/* Total */}
                    <td className="py-3 px-3 text-center font-extrabold bg-indigo-50/60 text-indigo-950 text-sm">
                      {row.total}
                    </td>

                    {/* Grade */}
                    <td className="py-3 px-3 text-center font-extrabold text-indigo-900 text-sm">
                      {row.grade}
                    </td>

                    {/* Remark */}
                    <td className="py-3 px-4 text-slate-700 italic">
                      {row.teacherRemark || 'Satisfactory academic progress.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB CONTENT 3: QUESTION BANK & REPOSITORY                              */}
      {/* ========================================================================= */}
      {activeStudioTab === 'repository' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                School Assessment Question Bank & Item Repository
              </h3>
              <p className="text-xs text-slate-500">
                Manage, duplicate, print, and deploy set examinations across classes.
              </p>
            </div>
            <button
              onClick={() => setActiveStudioTab('builder')}
              className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Draft New Paper</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repository.length === 0 ? (
              <div className="md:col-span-2 py-16 text-center text-sm text-slate-400">
                No assessments saved yet. Use the AI Assessment Creator to generate and save papers to the bank.
              </div>
            ) : repository.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                      {item.type}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{item.title}</h4>
                    <span className="text-xs text-slate-500">{item.questionsCount} · Total {item.marks} Marks</span>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                  <button
                    onClick={() => {
                      setActiveStudioTab('builder');
                      showToast('Paper Loaded', `Opened ${item.title} in Assessment Builder.`);
                    }}
                    className="flex-1 py-1.5 text-center text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                  >
                    View & Edit Paper
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl"
                    title="Print Test Paper"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => showToast('OMR Generated', 'SmartMark 40-question bubble sheet generated.')}
                    className="p-2 text-purple-700 hover:text-purple-900 bg-purple-50 border border-purple-200 rounded-xl"
                    title="Download OMR Bubble Sheet"
                  >
                    <Scan className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB CONTENT 4: CURRICULUM MASTERY RADAR                                */}
      {/* ========================================================================= */}
      {activeStudioTab === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900">
              Curriculum Scheme Mastery & Item Difficulty Radar
            </h3>
            <p className="text-xs text-slate-500">
              Diagnostic analytics across Mathematics and Basic Science continuous assessment tests.
            </p>

            {assessments.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                No assessments submitted yet. Mastery data will appear once teachers submit score sheets.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {assessments.slice(0, 3).map((asm) => {
                  const avgTotal = asm.scores.length > 0
                    ? Math.round(asm.scores.reduce((sum, s) => sum + s.total, 0) / asm.scores.length)
                    : 0;
                  return (
                    <div key={asm.id} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                      <span className="text-xs font-bold text-indigo-900 block">{asm.subject}</span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Class Average:</span>
                        <strong className={`font-extrabold ${avgTotal >= 75 ? 'text-emerald-700' : avgTotal >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                          {avgTotal}% ({asm.classLevel})
                        </strong>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${avgTotal >= 75 ? 'bg-emerald-600' : avgTotal >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${Math.min(100, avgTotal)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
