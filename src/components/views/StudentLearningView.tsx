import React, { useState } from 'react';
import {
  BookOpen,
  Play,
  FileText,
  Download,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  Bookmark,
  Volume2,
  Send,
  HelpCircle,
  Video,
  Layers,
  ArrowRight,
  Check,
  RotateCcw,
  ListOrdered,
  GraduationCap,
  Link2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { useStudentWorkspace } from '../../features/student/useStudentWorkspace';

interface StudentLearningViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface LessonModule {
  id: string;
  subject: string;
  subjectCode: string;
  subjectColor: string;
  week: number;
  title: string;
  duration: string;
  teacher: string;
  isCompleted: boolean;
  isBookmarked: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  hasPdf: boolean;
  summary: string;
  objectives: string[];
  keyFormulas?: string[];
  workedSteps?: { step: string; explanation: string; math?: string }[];
  quizQuestion?: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
}

export const StudentLearningView: React.FC<StudentLearningViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const workspace = useStudentWorkspace();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('mth_w8');
  const [activeLessonTab, setActiveLessonTab] = useState<'notes' | 'steps' | 'audio_video' | 'quick_quiz'>('notes');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<'1x' | '1.25x' | '1.5x'>('1x');

  // AI Tutor prompt state
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${workspace.firstName}! I'm your Skuggle AI Study Buddy. Ask me anything about your subjects!`,
      time: 'Just now',
    },
  ]);

  // Quiz state inside lesson
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);

  const lessonModules: LessonModule[] = [
    {
      id: 'mth_w8',
      subject: 'Mathematics',
      subjectCode: 'MTH-201',
      subjectColor: 'from-blue-600 to-indigo-600',
      week: 8,
      title: 'Simultaneous Equations by Elimination & Substitution',
      duration: '45 mins',
      teacher: 'Mr. Adewale Olawale',
      isCompleted: false,
      isBookmarked: true,
      hasAudio: true,
      hasVideo: true,
      hasPdf: true,
      summary: 'Learn how to solve systems of two linear equations with two unknown variables using algebraic elimination and substitution methods.',
      objectives: [
        'Understand the definition of a pair of simultaneous equations.',
        'Multiply equations by suitable constants to eliminate one variable.',
        'Substitute the found value to obtain the second unknown variable.',
        'Check solutions by direct substitution into both original equations.',
      ],
      keyFormulas: [
        'Standard form: a₁x + b₁y = c₁  and  a₂x + b₂y = c₂',
        'Elimination rule: If coefficients have the SAME sign, SUBTRACT. If OPPOSITE signs, ADD.',
        'Substitution rule: Express y in terms of x: y = (c₁ - a₁x) / b₁',
      ],
      workedSteps: [
        {
          step: 'Step 1: Write down the equations and check coefficients',
          explanation: 'Let Equation (1) be 3x + 2y = 16, and Equation (2) be 2x - 2y = 4.',
          math: 'Equation 1: 3x + 2y = 16\nEquation 2: 2x - 2y = 4',
        },
        {
          step: 'Step 2: Eliminate the variable y by addition',
          explanation: 'Notice the coefficients of y are +2 and -2 (opposite signs). Adding Equation 1 and Equation 2 eliminates y completely.',
          math: '(3x + 2x) + (2y - 2y) = 16 + 4\n5x = 20\nx = 20 / 5 = 4',
        },
        {
          step: 'Step 3: Substitute x = 4 into Equation 1 to find y',
          explanation: 'Replace x with 4 in 3x + 2y = 16 to solve for y.',
          math: '3(4) + 2y = 16\n12 + 2y = 16\n2y = 16 - 12 = 4\ny = 4 / 2 = 2',
        },
        {
          step: 'Step 4: Check your solution in Equation 2',
          explanation: 'Left Hand Side: 2(4) - 2(2) = 8 - 4 = 4. Since LHS = RHS (4 = 4), the solution is verified: x = 4, y = 2.',
        },
      ],
      quizQuestion: {
        question: 'Solve for y in the system: x + y = 12 and x - y = 4.',
        options: ['y = 8', 'y = 4', 'y = 6', 'y = 2'],
        correct: 1,
        explanation: 'Subtract the second equation from the first: (x - x) + (y - (-y)) = 12 - 4 → 2y = 8 → y = 4.',
      },
    },
    {
      id: 'bst_w8',
      subject: 'Basic Science',
      subjectCode: 'BST-201',
      subjectColor: 'from-emerald-600 to-teal-600',
      week: 8,
      title: 'Photosynthesis & Solar Energy Conversion',
      duration: '35 mins',
      teacher: 'Dr. (Mrs.) Alabi',
      isCompleted: true,
      isBookmarked: false,
      hasAudio: true,
      hasVideo: true,
      hasPdf: true,
      summary: 'Explore how green plants manufacture glucose and oxygen using sunlight energy, water, and carbon dioxide in the presence of chlorophyll.',
      objectives: [
        'State the chemical word and symbolic equation for photosynthesis.',
        'Differentiate between the light-dependent and light-independent stages.',
        'List 4 internal and external conditions necessary for photosynthesis.',
      ],
      keyFormulas: [
        '6CO₂ + 6H₂O + Sunlight (Chlorophyll) → C₆H₁₂O₆ + 6O₂',
        'Carbon dioxide + Water → Glucose + Oxygen',
      ],
      workedSteps: [
        {
          step: 'Step 1: Light absorption in the chloroplast',
          explanation: 'Chlorophyll pigments inside the thylakoid membrane trap photons of sunlight energy.',
        },
        {
          step: 'Step 2: Photolysis of water',
          explanation: 'Light energy splits water molecules into hydrogen ions, electrons, and oxygen gas (which is released into the atmosphere).',
        },
        {
          step: 'Step 3: Carbon fixation (Calvin cycle)',
          explanation: 'Hydrogen reduces carbon dioxide to produce glucose sugar (C₆H₁₂O₆).',
        },
      ],
      quizQuestion: {
        question: 'What gas is released as a byproduct during the light reaction of photosynthesis?',
        options: ['Carbon dioxide', 'Oxygen gas', 'Nitrogen', 'Methane'],
        correct: 1,
        explanation: 'During the photolysis of water in the presence of sunlight, water splits into hydrogen ions and oxygen gas (O₂).',
      },
    },
    {
      id: 'ict_w8',
      subject: 'ICT & Coding',
      subjectCode: 'ICT-202',
      subjectColor: 'from-purple-600 to-pink-600',
      week: 8,
      title: 'Python Data Collections: Lists, Tuples & Loops',
      duration: '50 mins',
      teacher: 'Engr. Kenneth Obi',
      isCompleted: true,
      isBookmarked: true,
      hasAudio: false,
      hasVideo: true,
      hasPdf: true,
      summary: 'Introduction to ordered Python lists, indexing, appending values, and iterating over lists using "for" loops.',
      objectives: [
        'Create and index elements in a Python list (zero-based indexing).',
        'Use list methods: append(), remove(), len(), and sort().',
        'Iterate over items using a for-in loop.',
      ],
      keyFormulas: [
        'fruits = ["Mango", "Cashew", "Orange"]',
        'fruits.append("Guava") → ["Mango", "Cashew", "Orange", "Guava"]',
        'for fruit in fruits: print(fruit)',
      ],
      quizQuestion: {
        question: 'In Python, what is the index of the first item in the list scores = [85, 90, 78]?',
        options: ['Index 1', 'Index 0', 'Index -1', 'Index 2'],
        correct: 1,
        explanation: 'Python lists use zero-based indexing, meaning the very first element is at index 0 (scores[0] is 85).',
      },
    },
    {
      id: 'eng_w8',
      subject: 'English Studies',
      subjectCode: 'ENG-201',
      subjectColor: 'from-amber-600 to-orange-600',
      week: 8,
      title: 'Active Voice vs. Passive Voice in Descriptive Writing',
      duration: '40 mins',
      teacher: 'Mrs. Folake Johnson',
      isCompleted: false,
      isBookmarked: false,
      hasAudio: true,
      hasVideo: false,
      hasPdf: true,
      summary: 'Transform sentences between active and passive voice correctly while maintaining grammatical concord and tense consistency.',
      objectives: [
        'Identify the subject, transitive verb, and object in active sentences.',
        'Convert active verbs into past participle form preceded by the appropriate auxiliary verb.',
        'Recognize when passive voice is appropriate in formal reporting.',
      ],
      keyFormulas: [
        'Active: [Subject] + [Verb] + [Object] → "The principal signed the certificate."',
        'Passive: [Object] + [auxiliary + past participle] + by [Subject] → "The certificate was signed by the principal."',
      ],
      quizQuestion: {
        question: 'What is the passive form of: "Nathan solved the complex equation"?',
        options: [
          'The complex equation had been solved by Nathan.',
          'The complex equation was solved by Nathan.',
          'The complex equation is solved by Nathan.',
          'Nathan was solving the complex equation.',
        ],
        correct: 1,
        explanation: 'Past simple active "solved" transforms into past simple passive "was solved".',
      },
    },
  ];

  const currentLesson = lessonModules.find((l) => l.id === selectedLessonId) || lessonModules[0];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiChatInput.trim()) return;

    const userText = aiChatInput.trim();
    const newMsg = {
      sender: 'user',
      text: userText,
      time: 'Just now',
    };

    setAiChatMessages((prev) => [...prev, newMsg]);
    setAiChatInput('');

    // Automated smart tutor response
    setTimeout(() => {
      let aiReply = "That's an excellent question! In JSS 2 Mathematics and Science, remembering the core formula and checking your units is key. For simultaneous equations, remember: if the signs are the same, subtract; if the signs are opposite, add.";
      if (userText.toLowerCase().includes('photosynthesis')) {
        aiReply = "Photosynthesis occurs in the chloroplasts of green plant cells. The light stage splits water (photolysis) to release Oxygen gas, while the dark stage fixes CO2 into Glucose (C6H12O6)!";
      } else if (userText.toLowerCase().includes('python') || userText.toLowerCase().includes('code')) {
        aiReply = "In Python, lists are mutable and ordered collections defined with square brackets: my_list = [10, 20, 30]. You can access the first item with my_list[0]!";
      } else if (userText.toLowerCase().includes('passive')) {
        aiReply = "To make a sentence passive, make the object the new subject, use the correct form of the verb 'to be' (is/was/were), and use the past participle of the main verb followed by 'by'!";
      }

      setAiChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: 'Just now',
        },
      ]);
    }, 800);
  };

  const handleDownloadPdf = (title: string) => {
    feedbackBus.info(`Downloading lesson notes: "${title}.pdf"...`);
  };

  const handleSelectQuizOption = (idx: number) => {
    if (isQuizSubmitted) return;
    setSelectedQuizAnswer(idx);
    setIsQuizSubmitted(true);
    if (currentLesson.quizQuestion && idx === currentLesson.quizQuestion.correct) {
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.7 } });
    }
  };

  const filteredLessons = lessonModules.filter((l) => {
    const matchesSubject = selectedSubject === 'all' || l.subject.toLowerCase().includes(selectedSubject.toLowerCase());
    const matchesQuery = searchQuery === '' || l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesQuery;
  });

  if (workspace.isLive) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
            <BookOpen className="h-8 w-8 text-indigo-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">No lessons yet</h1>
          <p className="mt-2 text-sm text-slate-500">
            {workspace.isPersonal
              ? `${workspace.firstName}, your personal workspace doesn't have school syllabus modules yet. You can upload your own notes and resources in the Library, or join a school with an invitation code to access teacher-published lessons.`
              : `${workspace.firstName}, your school hasn't published any lesson modules for your account yet. Check back once your teacher uploads materials.`}
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
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Week-by-week syllabus modules per subject</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Audio narrations, video lessons, and PDF notes</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> In-lesson quick quiz with instant feedback</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> AI Study Buddy to answer questions on any topic</li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('learning')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            <GraduationCap className="h-4 w-4" />
            Go to Library instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px] uppercase tracking-wide">
              JSS 2 Digital Learning Hub
            </span>
            <span className="text-xs text-slate-400 font-medium">Week 8 of 12 • Second Term</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Lessons, Schemes of Work & AI Tutor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Access teacher lecture notes, audio podcasts, worked math solvers, and curriculum textbook chapters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenModal('ai_lesson_builder')}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI Tutor a Question
          </button>
        </div>
      </div>

      {/* Search & Subject Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topic, formula, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin">
          {[
            { id: 'all', label: 'All Subjects' },
            { id: 'Mathematics', label: 'Mathematics' },
            { id: 'Basic Science', label: 'Basic Science' },
            { id: 'ICT', label: 'ICT & Coding' },
            { id: 'English', label: 'English Studies' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedSubject(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSubject === item.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Learning Hub Layout: Left Catalog, Middle Reader, Right AI Tutor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Lesson List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Modules ({filteredLessons.length})
            </h3>
            <span className="text-xs font-semibold text-indigo-600">Week 8 Focus</span>
          </div>

          <div className="space-y-3">
            {filteredLessons.map((lesson) => {
              const isSelected = lesson.id === selectedLessonId;
              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    setSelectedLessonId(lesson.id);
                    setIsQuizSubmitted(false);
                    setSelectedQuizAnswer(null);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/10'
                      : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {lesson.subject} • Wk {lesson.week}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      {lesson.hasAudio && <Volume2 className="w-3.5 h-3.5 text-blue-500" />}
                      {lesson.hasVideo && <Video className="w-3.5 h-3.5 text-purple-500" />}
                      {lesson.hasPdf && <FileText className="w-3.5 h-3.5 text-amber-500" />}
                      {lesson.isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                  </div>

                  <h4 className={`text-xs sm:text-sm font-bold line-clamp-2 ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                    {lesson.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {lesson.summary}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
                    <span>{lesson.duration}</span>
                    <span className="truncate">{lesson.teacher}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MIDDLE COLUMN: Interactive Lesson Classroom Player (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          {/* Active Lesson Header */}
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                {currentLesson.subjectCode} • {currentLesson.subject}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(currentLesson.title)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Download Lesson PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => feedbackBus.success('Lesson bookmarked!')}
                  className="p-1.5 text-slate-500 hover:text-amber-500 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Bookmark Lesson"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug">
              {currentLesson.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Prepared by <strong className="text-slate-700">{currentLesson.teacher}</strong> • Duration: {currentLesson.duration}
            </p>
          </div>

          {/* Lesson Sub-Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveLessonTab('notes')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeLessonTab === 'notes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Notes & Concepts
            </button>
            {currentLesson.workedSteps && (
              <button
                onClick={() => setActiveLessonTab('steps')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeLessonTab === 'steps' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Step-by-Step Solver
              </button>
            )}
            <button
              onClick={() => setActiveLessonTab('audio_video')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeLessonTab === 'audio_video' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teacher Audio/Video
            </button>
            {currentLesson.quizQuestion && (
              <button
                onClick={() => setActiveLessonTab('quick_quiz')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeLessonTab === 'quick_quiz' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quick Quiz
              </button>
            )}
          </div>

          {/* TAB CONTENT: NOTES */}
          {activeLessonTab === 'notes' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-1.5">
                <p className="font-bold text-indigo-900 uppercase text-[10px] tracking-wider">Lesson Learning Objectives:</p>
                <ul className="space-y-1">
                  {currentLesson.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-indigo-950">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {currentLesson.keyFormulas && (
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Key Formulas & Reference Rules:
                  </p>
                  <div className="space-y-1.5 font-mono text-[11px] text-slate-200">
                    {currentLesson.keyFormulas.map((f, i) => (
                      <div key={i} className="p-2 bg-white/10 rounded-lg">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Conceptual Overview</h4>
                <p>{currentLesson.summary}</p>
                <p>
                  In this session, students analyze algebraic and scientific principles with continuous real-world examples from the West African secondary school curriculum.
                </p>
              </div>
            </div>
          )}

          {/* TAB CONTENT: STEP-BY-STEP SOLVER */}
          {activeLessonTab === 'steps' && currentLesson.workedSteps && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-indigo-600" />
                  Interactive Worked Example
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Exam Technique
                </span>
              </div>

              <div className="space-y-3">
                {currentLesson.workedSteps.map((ws, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                    <p className="text-xs font-bold text-indigo-900">{ws.step}</p>
                    <p className="text-xs text-slate-600">{ws.explanation}</p>
                    {ws.math && (
                      <pre className="p-2 bg-white rounded-xl border border-slate-200 text-slate-800 font-mono text-[11px] whitespace-pre-wrap">
                        {ws.math}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: AUDIO/VIDEO PODCAST */}
          {activeLessonTab === 'audio_video' && (
            <div className="space-y-4">
              {/* Audio Player Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="text-xs font-bold">Teacher Audio Podcast Walkthrough</p>
                      <p className="text-[10px] text-slate-400">By {currentLesson.teacher}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-indigo-300">03:42 / 12:15</span>
                </div>

                {/* Scrubber */}
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: '30%' }} />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAudioSpeed(audioSpeed === '1x' ? '1.25x' : audioSpeed === '1.25x' ? '1.5x' : '1x')}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold font-mono transition-colors"
                    >
                      {audioSpeed}
                    </button>
                  </div>

                  <button
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-all"
                  >
                    {isPlayingAudio ? '❚❚' : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>

                  <button
                    onClick={() => feedbackBus.success('Audio downloaded for offline review!')}
                    className="text-xs text-indigo-300 hover:text-white flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Offline MP3
                  </button>
                </div>
              </div>

              {/* Video Mockup */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-2">
                <Video className="w-8 h-8 text-indigo-600 mx-auto" />
                <p className="text-xs font-bold text-slate-900">Whiteboard Video Walkthrough</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  High-definition animated slide lesson with step-by-step blackboard annotation.
                </p>
                <button
                  onClick={() => feedbackBus.info('Launching full-screen lesson video player...')}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-white" /> Watch 15-Min Video
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT: QUICK QUIZ */}
          {activeLessonTab === 'quick_quiz' && currentLesson.quizQuestion && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
                <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1">Check Your Understanding</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {currentLesson.quizQuestion.question}
                </p>
              </div>

              <div className="space-y-2">
                {currentLesson.quizQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuizOption(idx)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                      isQuizSubmitted
                        ? idx === currentLesson.quizQuestion!.correct
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                          : selectedQuizAnswer === idx
                          ? 'bg-rose-50 border-rose-500 text-rose-900'
                          : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                        : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-slate-800'
                    }`}
                  >
                    <span><strong className="mr-2 font-mono">{String.fromCharCode(65 + idx)}.</strong> {opt}</span>
                    {isQuizSubmitted && idx === currentLesson.quizQuestion!.correct && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>

              {isQuizSubmitted && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 animate-in fade-in">
                  <p className="font-bold text-slate-800">
                    {selectedQuizAnswer === currentLesson.quizQuestion.correct ? '🎉 Brilliant! +25 XP' : '💡 Explanation:'}
                  </p>
                  <p className="text-slate-600">{currentLesson.quizQuestion.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI Study Buddy Assistant (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 h-full min-h-[500px]">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">AI Study Buddy</h3>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online • JSS 2 Tutor
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="space-y-3 py-3 max-h-[340px] overflow-y-auto pr-1">
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[90%] ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Quick Prompt Chips */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Questions:</p>
              <div className="flex flex-col gap-1">
                {[
                  'How do I factorize quadratic expressions?',
                  'Summarize Photosynthesis light reaction',
                  'Explain Python for-loops with example',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setAiChatInput(prompt);
                    }}
                    className="text-left text-[11px] p-1.5 rounded-lg bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-700 truncate transition-colors"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Ask a question..."
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
