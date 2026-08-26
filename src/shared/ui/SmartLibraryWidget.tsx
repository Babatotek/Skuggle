import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Sparkles,
  Search,
  BookMarked,
  Video,
  FileCheck2,
  FileText,
  Lock,
  ChevronRight,
  ExternalLink,
  Download,
  Play,
  CheckCircle2,
  Star,
  ArrowRight,
  X,
  Bot,
  Flame,
  Bookmark,
  Check,
  Share2,
  Clock,
  Award,
  Layers,
  GraduationCap
} from 'lucide-react';
import { UserRole, AuthenticatedUser, UserProfile } from '../../types';
import { appConfig } from '@/app/config';
import {
  libraryService,
  type LibraryResourceSummary,
} from '@/features/library/libraryService';
import { getApiError } from '@/shared/api/client';

export type LibraryCategory = 'all' | 'textbooks' | 'videos' | 'practice' | 'documents';

export interface LibraryResource {
  id: string;
  title: string;
  category: 'textbooks' | 'videos' | 'practice' | 'documents';
  subject: string;
  gradeLevel: string;
  curriculum: 'NERDC' | 'WAEC/NECO' | 'Cambridge' | 'Cambridge / WAEC' | 'General';
  authorOrSource: string;
  durationOrPages: string;
  rating: number;
  readsOrViews: number;
  coverGradient: string;
  badgeText?: string;
  summary: string;
  previewSnippet: string;
  fullContent?: string;
  isPremium?: boolean;
  videoDuration?: string;
  practiceQuestionsCount?: number;
}

const mapSummaryToWidgetResource = (
  item: LibraryResourceSummary,
): LibraryResource => {
  const type = String(item.resourceType || '');
  const category: LibraryResource['category'] =
    type === 'video'
      ? 'videos'
      : type === 'quiz' || type === 'flashcard'
        ? 'practice'
        : type === 'book'
          ? 'textbooks'
          : 'documents';

  return {
    id: item.id,
    title: item.title,
    category,
    subject: item.subject || 'General',
    gradeLevel: item.className || item.educationalLevel || 'All levels',
    curriculum: 'General',
    authorOrSource: item.author || item.sourceLabel || 'School library',
    durationOrPages: item.estimatedStudyMinutes
      ? `${item.estimatedStudyMinutes} min`
      : item.fileSize
        ? `${Math.max(1, Math.round(item.fileSize / 1024))} KB`
        : 'Resource',
    rating: item.schoolApproved ? 4.8 : 4.2,
    readsOrViews: Math.round((item.progressPercent ?? 0) * 10),
    coverGradient:
      category === 'videos'
        ? 'from-rose-600 to-orange-600'
        : category === 'practice'
          ? 'from-amber-500 to-yellow-600'
          : category === 'textbooks'
            ? 'from-blue-600 to-indigo-700'
            : 'from-emerald-600 to-teal-700',
    badgeText: item.schoolApproved ? 'School approved' : item.accessTier,
    summary: item.description || 'Approved learning resource from your school library.',
    previewSnippet: item.description || item.topic || item.title,
    fullContent: item.description || undefined,
    isPremium: item.accessTier !== 'free',
  };
};

export interface SmartLibraryWidgetProps {
  user?: AuthenticatedUser | UserProfile | null;
  isGuest?: boolean;
  compact?: boolean;
  onOpenModal?: (modalName: string, data?: any) => void;
  onNavigateTab?: (tab: string) => void;
  className?: string;
}

const SAMPLE_LIBRARY_RESOURCES: LibraryResource[] = [
  // 1. Textbooks
  {
    id: 'res-tb-1',
    title: 'New General Mathematics for Senior Secondary Schools (SS1-SS3)',
    category: 'textbooks',
    subject: 'Mathematics',
    gradeLevel: 'SSS 1-3',
    curriculum: 'NERDC',
    authorOrSource: 'Prof. M. F. Macrae et al. / Pearson',
    durationOrPages: '420 Pages',
    rating: 4.9,
    readsOrViews: 12450,
    coverGradient: 'from-blue-600 to-indigo-700',
    badgeText: 'Curriculum Core',
    summary: 'Comprehensive high-school mathematics covering quadratic functions, trigonometry, probability, statistics, and algebraic theorems with worked WAEC examples.',
    previewSnippet: 'Chapter 3: Quadratic Equations by Completing the Square. Consider ax² + bx + c = 0 where a ≠ 0...',
    fullContent: 'Chapter 3: Quadratic Equations & Parabolic Functions.\n\nKey Concepts:\n1. Standard Form: ax² + bx + c = 0 (a ≠ 0)\n2. The Quadratic Formula: x = [-b ± √(b² - 4ac)] / (2a)\n3. Discriminant Analysis:\n   - If Δ > 0: Two distinct real roots.\n   - If Δ = 0: One repeated real root.\n   - If Δ < 0: Complex conjugate roots.\n\nWorked Example:\nSolve 2x² - 7x + 3 = 0 using factorization.\nFactoring: (2x - 1)(x - 3) = 0 => x = 1/2 or x = 3.',
    isPremium: true
  },
  {
    id: 'res-tb-2',
    title: 'Concise Senior Secondary Biology & Ecology Explorer',
    category: 'textbooks',
    subject: 'Biology',
    gradeLevel: 'SSS 1-3',
    curriculum: 'WAEC/NECO',
    authorOrSource: 'Dr. Stella E. Idowu / University Press',
    durationOrPages: '380 Pages',
    rating: 4.8,
    readsOrViews: 9820,
    coverGradient: 'from-emerald-600 to-teal-700',
    badgeText: 'Essential Read',
    summary: 'Illustrated textbook on cell structure, genetics, Mendelian inheritance, ecological adaptations, human circulatory system, and bio-energetics.',
    previewSnippet: 'Section 4.2: Photosynthesis and the Calvin-Benson Cycle inside Chloroplast Stroma...',
    fullContent: 'Section 4.2: Photosynthesis and Cellular Respiration.\n\nLight-Dependent Phase:\nOccurs in the thylakoid membranes where chlorophyll absorbs photons, driving photolysis of water: 2H₂O -> 4H⁺ + 4e⁻ + O₂.\n\nLight-Independent Phase (Calvin Cycle):\nOccurs in the stroma, fixing CO₂ into 3-phosphoglycerate with ATP and NADPH.',
    isPremium: true
  },
  {
    id: 'res-tb-3',
    title: 'African Prose Masterclass: The Lion and the Jewel & Purple Hibiscus',
    category: 'textbooks',
    subject: 'Literature in English',
    gradeLevel: 'SSS 2-3',
    curriculum: 'WAEC/NECO',
    authorOrSource: 'Prof. K. Alabi / Royal Academic Press',
    durationOrPages: '290 Pages',
    rating: 4.9,
    readsOrViews: 14100,
    coverGradient: 'from-amber-600 to-orange-700',
    badgeText: 'Exam Literature',
    summary: 'In-depth critical analysis, character breakdown, symbolic motifs, and past WAEC literature essay prompts for selected African drama and prose.',
    previewSnippet: 'Themes of modernism vs tradition in Wole Soyinka\'s The Lion and the Jewel...',
    fullContent: 'Critical Themes in African Literature:\n\n1. Tradition vs. Modernity in Ilujinle.\n- Baroka represents the preservation of customary African hierarchy and cunning leadership.\n- Lakunle represents superficial westernisation without deep socio-economic substance.\n- Sidi represents the contested prize of cultural identity.',
    isPremium: false
  },

  // 2. Video Lessons
  {
    id: 'res-vid-1',
    title: 'Electrolysis & Faradays Laws: Practical Lab Simulation',
    category: 'videos',
    subject: 'Chemistry',
    gradeLevel: 'SSS 2-3',
    curriculum: 'NERDC',
    authorOrSource: 'Skuggle AI Video Studios (Engr. D. Adeleke)',
    durationOrPages: '24 Mins',
    videoDuration: '24:15',
    rating: 4.9,
    readsOrViews: 18340,
    coverGradient: 'from-purple-600 to-indigo-800',
    badgeText: 'Interactive 4K',
    summary: 'Visual step-by-step breakdown of anode and cathode discharge reactions, electrochemical series, and calculation of electroplated mass using m = (I · t · M) / (z · F).',
    previewSnippet: 'Visualizing copper purification in aqueous CuSO₄ solution with animated ion migration...',
    fullContent: 'Video Chapter Breakdown:\n00:00 - Introduction to Electrochemistry\n04:30 - Anode & Cathode Ion Migrations\n11:20 - Faradays 1st & 2nd Laws\n18:45 - High-yield WAEC Exam Calculation Practice',
    isPremium: true
  },
  {
    id: 'res-vid-2',
    title: 'Kinematics & Projectile Motion: Calculus & Trigonometry Approach',
    category: 'videos',
    subject: 'Physics',
    gradeLevel: 'SSS 1-3',
    curriculum: 'Cambridge / WAEC',
    authorOrSource: 'Dr. H. Mensah / West African STEM League',
    durationOrPages: '32 Mins',
    videoDuration: '32:40',
    rating: 4.8,
    readsOrViews: 11200,
    coverGradient: 'from-sky-600 to-blue-800',
    badgeText: 'Masterclass',
    summary: 'Comprehensive video solving two-dimensional trajectory equations, maximum height, time of flight, horizontal range, and vectors under gravity.',
    previewSnippet: 'Breaking initial velocity u into horizontal ux = u cos(θ) and vertical uy = u sin(θ)...',
    fullContent: 'Video Chapter Breakdown:\n00:00 - Vector components of velocity\n07:15 - Deriving Time of Flight T = 2u sin(θ) / g\n15:30 - Maximum Height H = (u² sin²θ) / 2g\n24:00 - Maximum Range R = (u² sin 2θ) / g at 45 degrees',
    isPremium: true
  },

  // 3. Practice Tests
  {
    id: 'res-test-1',
    title: 'WAEC Mathematics 2024-2026 High-Yield Mock Drill (CBT Simulator)',
    category: 'practice',
    subject: 'Mathematics',
    gradeLevel: 'SSS 3 / UTME',
    curriculum: 'WAEC/NECO',
    authorOrSource: 'WAEC Standardized Item Bank',
    durationOrPages: '50 Questions',
    practiceQuestionsCount: 50,
    rating: 5.0,
    readsOrViews: 28900,
    coverGradient: 'from-rose-600 to-pink-700',
    badgeText: 'Timed CBT',
    summary: '50 randomized past exam questions with instant step-by-step algorithmic scoring, detailed explanations, and performance gap radar.',
    previewSnippet: 'Q1: Find the value of x for which log₁₀(3x + 1) - log₁₀(x - 2) = 1...',
    fullContent: 'Sample Questions in this Drill:\n1. If log₁₀(3x + 1) - log₁₀(x - 2) = 1, find x.\n   Solution: log₁₀[(3x + 1)/(x - 2)] = 1 => (3x + 1)/(x - 2) = 10 => 3x + 1 = 10x - 20 => 7x = 21 => x = 3.\n\n2. The probability of an event A happening is 3/7. Find probability of A not happening: P(A\') = 1 - 3/7 = 4/7.',
    isPremium: true
  },
  {
    id: 'res-test-2',
    title: 'English Language Lexis, Structure & Oral Phonetics Drill',
    category: 'practice',
    subject: 'English Language',
    gradeLevel: 'JSS 3 - SSS 3',
    curriculum: 'NERDC',
    authorOrSource: 'National Council of English Educators',
    durationOrPages: '40 Questions',
    practiceQuestionsCount: 40,
    rating: 4.7,
    readsOrViews: 16700,
    coverGradient: 'from-violet-600 to-indigo-800',
    badgeText: 'CBT Practice',
    summary: 'Sharpen your vocabulary, concord agreement, vowel and consonant sound identification, stress patterns, and idiom mastery.',
    previewSnippet: 'Q1: Choose the word that has the same vowel sound as the one represented in /i:/...',
    fullContent: 'Topics Tested:\n- Subject-Verb Agreement (Proximity rule, each/every rules)\n- Oral English (Monophthongs, Diphthongs, Plosives, Fricatives)\n- Synonyms and Antonyms in Context\n- Reading Comprehension Strategies',
    isPremium: false
  },

  // 4. Documents
  {
    id: 'res-doc-1',
    title: 'Senior Secondary Physics Formula Sheet & Quick Reference Cheat Sheet',
    category: 'documents',
    subject: 'Physics',
    gradeLevel: 'SSS 1-3',
    curriculum: 'NERDC',
    authorOrSource: 'Royal Gateway Academy STEM Faculty',
    durationOrPages: '14 Pages PDF',
    rating: 4.9,
    readsOrViews: 21500,
    coverGradient: 'from-teal-600 to-emerald-800',
    badgeText: 'Verified Handout',
    summary: 'High-density revision document compiling all SI units, dimensional formulas, mechanics, heat, optics, electricity, and modern physics laws.',
    previewSnippet: 'Mechanics: F = dp/dt = ma, W = F·d, P = W/t, Elastic Potential Energy = 1/2 kx²...',
    fullContent: 'Complete Reference Index:\n1. Mechanics & Dynamics (Equations of linear motion, conservation of momentum, Newton\'s laws)\n2. Thermal Physics (Specific heat capacity Q = mcΔθ, Latent heat Q = mL)\n3. Optics (Snell\'s Law n₁ sin θ₁ = n₂ sin θ₂, Mirror formula 1/f = 1/u + 1/v)\n4. Electricity & Magnetism (Ohm\'s Law V = IR, Coulomb\'s Law F = k q₁q₂ / r²)',
    isPremium: true
  },
  {
    id: 'res-doc-2',
    title: 'Civic Education & Nigerian Democratic Institutions Guide',
    category: 'documents',
    subject: 'Civic Education',
    gradeLevel: 'SSS 1-3',
    curriculum: 'NERDC',
    authorOrSource: 'Federal Ministry of Education / NECO Approved',
    durationOrPages: '28 Pages PDF',
    rating: 4.8,
    readsOrViews: 8400,
    coverGradient: 'from-amber-600 to-yellow-700',
    badgeText: 'Revision Guide',
    summary: 'Comprehensive guide covering citizenship values, human rights, rule of law, anti-corruption agencies (EFCC/ICPC), and electoral processes in Nigeria.',
    previewSnippet: 'Chapter 2: Fundamental Human Rights under the 1999 Constitution of Nigeria (as amended)...',
    fullContent: 'Core Summary Pillars:\n- Characteristics of Constitutional Democracy\n- Separation of Powers: Executive, Legislative, Judiciary\n- Role of Civil Society Organizations in Good Governance\n- Youth Leadership & Community Responsibility',
    isPremium: false
  }
];

export const SmartLibraryWidget: React.FC<SmartLibraryWidgetProps> = ({
  user,
  isGuest = false,
  compact = false,
  onOpenModal,
  onNavigateTab,
  className = '',
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<LibraryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);
  const [activeViewerTab, setActiveViewerTab] = useState<'content' | 'ai_tutor' | 'annotations'>('content');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [cbtSelectedOption, setCbtSelectedOption] = useState<number | null>(null);
  const [cbtScoreSubmitted, setCbtScoreSubmitted] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [liveResources, setLiveResources] = useState<LibraryResource[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Determine user access tier
  // 1. Guest: isGuest === true OR user.role === 'landing' OR user is null
  // 2. Subscribed (full access): user with valid role & (hasSubscription !== false) & not guest
  // 3. Registered (limited access): user is logged in, but hasSubscription === false
  const isGuestUser = Boolean(
    isGuest ||
    !user ||
    (typeof user === 'object' && 'role' in user && user.role === 'landing')
  );

  const hasSubscription = Boolean(
    !isGuestUser &&
    user &&
    ((user as AuthenticatedUser).hasSubscription !== false)
  );

  const isRegisteredWithoutSub = Boolean(
    !isGuestUser &&
    user &&
    (user as AuthenticatedUser).hasSubscription === false
  );

  useEffect(() => {
    if (!appConfig.liveApi || !isOpen) return;
    const controller = new AbortController();
    setLiveLoading(true);
    setLiveError(null);
    const load = async () => {
      try {
        const page = isGuestUser
          ? await libraryService.publicList({}, controller.signal)
          : await libraryService.list({}, controller.signal);
        const mapped = page.resources.map(mapSummaryToWidgetResource);
        setLiveResources(mapped);
        setBookmarkedIds(
          page.resources.filter((item) => item.bookmarked).map((item) => item.id),
        );
      } catch (error) {
        setLiveResources([]);
        setLiveError(getApiError(error).message);
      } finally {
        setLiveLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [isOpen, isGuestUser, user]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const catalogue = appConfig.liveApi ? liveResources : SAMPLE_LIBRARY_RESOURCES;

  // Filtered resources
  const filteredResources = catalogue.filter((res) => {
    const matchesCategory =
      activeCategory === 'all' ||
      (activeCategory === 'textbooks' && res.category === 'textbooks') ||
      (activeCategory === 'videos' && res.category === 'videos') ||
      (activeCategory === 'practice' && res.category === 'practice') ||
      (activeCategory === 'documents' && res.category === 'documents');

    const matchesSearch =
      searchQuery.trim() === '' ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.authorOrSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.summary.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Resource Counts
  const counts = {
    all: SAMPLE_LIBRARY_RESOURCES.length,
    textbooks: SAMPLE_LIBRARY_RESOURCES.filter((r) => r.category === 'textbooks').length,
    videos: SAMPLE_LIBRARY_RESOURCES.filter((r) => r.category === 'videos').length,
    practice: SAMPLE_LIBRARY_RESOURCES.filter((r) => r.category === 'practice').length,
    documents: SAMPLE_LIBRARY_RESOURCES.filter((r) => r.category === 'documents').length,
  };

  const handleResourceClick = (resource: LibraryResource) => {
    if (isGuestUser) {
      // Guest users get preview dialog with clear Sign up CTA
      setSelectedResource(resource);
      setShowUpgradePrompt(true);
      return;
    }

    if (isRegisteredWithoutSub && resource.isPremium) {
      // Prompt upgrade
      setSelectedResource(resource);
      setShowUpgradePrompt(true);
      return;
    }

    // Full access user
    setSelectedResource(resource);
    setShowUpgradePrompt(false);
    setActiveViewerTab('content');
    setAiResponse(null);
    setCbtScoreSubmitted(false);
    setCbtSelectedOption(null);
  };

  const handleSignUpTrigger = () => {
    setIsOpen(false);
    if (onOpenModal) {
      onOpenModal('onboarding_wizard');
      return;
    }
    void navigate('/join');
  };

  const handleUpgradeTrigger = () => {
    setIsOpen(false);
    if (onOpenModal) {
      onOpenModal('onboarding_wizard');
    }
  };

  const handleAskAI = (promptOverride?: string) => {
    const query = promptOverride || aiQuestion;
    if (!query.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);

    setTimeout(() => {
      setIsAiLoading(false);
      if (selectedResource?.category === 'textbooks' || selectedResource?.subject === 'Mathematics') {
        setAiResponse(
          `**Skuggle AI Tutor Analysis for ${selectedResource?.title || 'Resource'}**:\n\n` +
          `• **Concept Summary**: Quadratic equations in standard form $ax^2 + bx + c = 0$ can be solved using either factorisation, completing the square, or the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.\n\n` +
          `• **Step-by-step Tip**: Always calculate the discriminant $\\Delta = b^2 - 4ac$ first to determine if roots are real and rational before factoring.\n\n` +
          `• **Recommended Practice**: Review WAEC 2023 Paper 2 Question 4(b) for exam-style multi-step problem solving.`
        );
      } else if (selectedResource?.category === 'videos') {
        setAiResponse(
          `**Skuggle AI Video Notes & Key Formulas**:\n\n` +
          `1. **Faraday's 1st Law**: Mass $m = z \\cdot I \\cdot t$ where $z = \\frac{M}{n \\cdot F}$ ($F = 96,500\\text{ C/mol}$).` +
          `\n2. **Practical Lab Tip**: Clean the electrodes with emery paper prior to immersion to prevent contact resistance error.\n` +
          `3. **Key Exam Question**: Calculate mass of copper deposited at the cathode when 2.5A is passed for 45 minutes.`
        );
      } else {
        setAiResponse(
          `**Skuggle AI Smart Summary**:\n\n` +
          `• **Core Objective**: Master high-frequency curriculum topics tested by NERDC & WAEC.\n` +
          `• **Key Takeaways**: Understand definitions, apply formulas to practical questions, and check working steps.\n` +
          `• **Study Plan**: Allocate 25 minutes daily with active recall drills.`
        );
      }
    }, 750);
  };

  const toggleBookmark = async (id: string) => {
    const currentlyBookmarked = bookmarkedIds.includes(id);
    setBookmarkedIds((prev) =>
      currentlyBookmarked ? prev.filter((item) => item !== id) : [...prev, id],
    );
    if (!appConfig.liveApi || isGuestUser) return;
    try {
      if (currentlyBookmarked) {
        await libraryService.unbookmark(id);
      } else {
        await libraryService.bookmark(id);
      }
    } catch (error) {
      setBookmarkedIds((prev) =>
        currentlyBookmarked ? [...prev, id] : prev.filter((item) => item !== id),
      );
      console.warn(getApiError(error).message);
    }
  };

  // Render Access Badge Label
  const renderAccessBadge = () => {
    if (isGuestUser) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
          Sign up
        </span>
      );
    }
    if (isRegisteredWithoutSub) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
          Upgrade
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <Sparkles className="w-2.5 h-2.5 text-emerald-600 fill-emerald-500" />
        Full access
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* 
        ========================================================================
        TRIGGER BUTTON
        ========================================================================
      */}
      {isGuestUser && !compact ? (
        // Guest Landing / Public Navigation with "LIBRARY" label
        <button
          id="btn-smart-library-guest"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
            isOpen
              ? 'bg-indigo-50/90 text-indigo-700 border-indigo-200 shadow-sm'
              : 'bg-white/80 hover:bg-slate-50 text-slate-700 border-slate-200/80 hover:border-slate-300'
          }`}
          title="Skuggle Smart Digital Library (Preview)"
        >
          <div className="relative">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="tracking-wide">LIBRARY</span>
          {renderAccessBadge()}
        </button>
      ) : (
        // Registered or Subscribed Top Bar Icon Button (Compact or Default)
        <button
          id="btn-smart-library-trigger"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2 rounded-xl transition-all flex items-center justify-center ${
            isOpen
              ? 'bg-indigo-100/80 text-indigo-700 ring-2 ring-indigo-500/20'
              : hasSubscription
              ? 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/80 bg-indigo-50/40 border border-indigo-100'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
          }`}
          title={
            hasSubscription
              ? 'Skuggle Smart Library - Full Access'
              : isRegisteredWithoutSub
              ? 'Skuggle Smart Library - Upgrade for Full Access'
              : 'Skuggle Smart Library - Preview'
          }
        >
          <div className="relative flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
            
            {/* Sparkle indicator for Subscribed Users */}
            {hasSubscription && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 relative z-10" />
              </span>
            )}
          </div>
        </button>
      )}

      {/* 
        ========================================================================
        DROPDOWN / FLYOUT POPUP
        ========================================================================
      */}
      {isOpen && (
        <div
          id="smart-library-flyout"
          className="absolute right-0 mt-2.5 w-[92vw] sm:w-[500px] md:w-[540px] max-w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-0 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col overflow-hidden text-slate-800"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/15">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                      Smart Digital Library
                      {hasSubscription && <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />}
                    </h3>
                  </div>
                  <p className="text-xs text-indigo-200">
                    WAEC, NERDC & Cambridge aligned curriculum resources
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {renderAccessBadge()}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close library"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Access Level Callout Banner if not subscribed */}
            {isGuestUser && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-between text-xs text-amber-100">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Preview Mode: Sign up to unlock 1,000+ textbooks & CBT mock drills.</span>
                </div>
                <button
                  onClick={handleSignUpTrigger}
                  className="ml-2 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-[11px] shadow-sm transition-all whitespace-nowrap"
                >
                  Sign Up Free
                </button>
              </div>
            )}

            {isRegisteredWithoutSub && (
              <div className="mt-3 p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-between text-xs text-purple-100">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>Upgrade your school plan for unlimited AI lessons and past question papers.</span>
                </div>
                <button
                  onClick={handleUpgradeTrigger}
                  className="ml-2 px-3 py-1 bg-purple-400 hover:bg-purple-300 text-slate-950 font-bold rounded-lg text-[11px] shadow-sm transition-all whitespace-nowrap"
                >
                  Upgrade
                </button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search textbooks, video lessons, CBT drills, handouts..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>All</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'all' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('textbooks')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === 'textbooks'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookMarked className="w-3 h-3" />
                <span>Textbooks</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'textbooks' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {counts.textbooks}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('videos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === 'videos'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Video className="w-3 h-3" />
                <span>Video Lessons</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'videos' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {counts.videos}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('practice')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === 'practice'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileCheck2 className="w-3 h-3" />
                <span>Practice Tests</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'practice' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {counts.practice}
                </span>
              </button>

              <button
                onClick={() => setActiveCategory('documents')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeCategory === 'documents'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Documents</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === 'documents' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {counts.documents}
                </span>
              </button>
            </div>
          </div>

          {/* Resource List Body */}
          <div className="max-h-[340px] overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-50">
            {liveLoading ? (
              <div className="py-10 text-center text-slate-500 text-xs font-medium">
                Loading school library…
              </div>
            ) : liveError ? (
              <div className="py-8 text-center text-rose-600 text-xs font-medium px-4">
                {liveError}
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-1" />
                <p className="text-xs font-medium">
                  {appConfig.liveApi
                    ? 'No published library resources yet for this workspace.'
                    : `No educational resources found matching "${searchQuery}"`}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Clear search & filters
                </button>
              </div>
            ) : (
              filteredResources.map((resource) => {
                const isBookmarked = bookmarkedIds.includes(resource.id);
                const isItemLocked = (isGuestUser || (isRegisteredWithoutSub && resource.isPremium));

                return (
                  <div
                    key={resource.id}
                    onClick={() => handleResourceClick(resource)}
                    className="pt-2 first:pt-0 group cursor-pointer"
                  >
                    <div className="p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all flex gap-3 items-start relative bg-white">
                      {/* Thumbnail / Category Icon */}
                      <div
                        className={`w-12 h-14 rounded-lg bg-gradient-to-br ${resource.coverGradient} flex flex-col items-center justify-center text-white shrink-0 shadow-xs relative overflow-hidden`}
                      >
                        {resource.category === 'textbooks' && <BookMarked className="w-5 h-5" />}
                        {resource.category === 'videos' && <Play className="w-5 h-5 fill-white" />}
                        {resource.category === 'practice' && <FileCheck2 className="w-5 h-5" />}
                        {resource.category === 'documents' && <FileText className="w-5 h-5" />}
                        
                        <span className="text-[8px] font-bold uppercase tracking-wider mt-1 opacity-90">
                          {resource.subject.slice(0, 4)}
                        </span>

                        {isItemLocked && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center text-amber-300">
                            <Lock className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {resource.subject}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">
                            {resource.gradeLevel}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            • {resource.curriculum}
                          </span>

                          {resource.badgeText && (
                            <span className="ml-auto text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                              {resource.badgeText}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mt-1">
                          {resource.title}
                        </h4>

                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {resource.summary}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                          <span className="truncate max-w-[200px]">{resource.authorOrSource}</span>
                          <span className="font-medium text-slate-600">{resource.durationOrPages}</span>
                        </div>
                      </div>

                      {/* Bookmark Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(resource.id);
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          isBookmarked ? 'text-amber-500' : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={isBookmarked ? 'Saved in library' : 'Save for later'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar with View All / Navigate to full library */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">4,200+</span>
              <span>total school resources</span>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateTab && (
                <button
                  id="btn-goto-resource-library"
                  onClick={() => {
                    setIsOpen(false);
                    onNavigateTab('resources');
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline px-2 py-1 rounded"
                >
                  <span>Open Full Resource Hub</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              {isGuestUser && (
                <button
                  onClick={handleSignUpTrigger}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1"
                >
                  <span>Join Skuggle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        INTERACTIVE RESOURCE MODAL / VIEWER (PREVIEW, READER, CBT & AI TUTOR)
        ========================================================================
      */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className={`p-4 sm:p-5 bg-gradient-to-r ${selectedResource.coverGradient} text-white flex items-start justify-between relative`}>
              <div className="space-y-1 max-w-[85%]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full uppercase tracking-wider text-white">
                    {selectedResource.category}
                  </span>
                  <span className="text-xs text-white/80">
                    {selectedResource.subject} • {selectedResource.gradeLevel} • {selectedResource.curriculum}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                  {selectedResource.title}
                </h3>
                <p className="text-xs text-white/80">
                  By {selectedResource.authorOrSource} • {selectedResource.durationOrPages}
                </p>
              </div>

              <button
                onClick={() => setSelectedResource(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close resource viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs if user is authorized */}
            {!showUpgradePrompt && (
              <div className="flex items-center border-b border-slate-100 bg-slate-50 px-4 pt-2 gap-2">
                <button
                  onClick={() => setActiveViewerTab('content')}
                  className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
                    activeViewerTab === 'content'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Reader & Study Content</span>
                </button>

                <button
                  onClick={() => setActiveViewerTab('ai_tutor')}
                  className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
                    activeViewerTab === 'ai_tutor'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-purple-600" />
                  <span>Ask Skuggle AI Tutor</span>
                </button>

                <button
                  onClick={() => setActiveViewerTab('annotations')}
                  className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 flex items-center gap-1.5 ${
                    activeViewerTab === 'annotations'
                      ? 'border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                  <span>My Notes & Highlights</span>
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-700 text-xs sm:text-sm space-y-4">
              {showUpgradePrompt ? (
                // Locked Content Upgrade / Sign-up Callout
                <div className="text-center py-6 space-y-4 max-w-md mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {isGuestUser ? 'Sign Up for Full Library Access' : 'Upgrade to School / Learn Plus Plan'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {isGuestUser
                        ? 'Unlock full textbook chapters, past question drills, video lectures, and AI study companion.'
                        : 'Your current account plan does not include unlimited textbook downloads and CBT exam simulations.'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      What's Included in Full Access:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>1,200+ Textbooks & e-Books</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>WAEC/NECO CBT Drills</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Instant AI Tutor Explanations</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Offline PDF Downloads</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setSelectedResource(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl"
                    >
                      Cancel
                    </button>

                    {isGuestUser ? (
                      <button
                        onClick={handleSignUpTrigger}
                        className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-2"
                      >
                        <span>Create Free Account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={handleUpgradeTrigger}
                        className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all flex items-center gap-2"
                      >
                        <span>Upgrade School Subscription</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      </button>
                    )}
                  </div>
                </div>
              ) : activeViewerTab === 'content' ? (
                // Full Content View
                <div className="space-y-4">
                  {selectedResource.category === 'practice' ? (
                    // Interactive CBT Mock Question Simulator
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                          Question 1 of {selectedResource.practiceQuestionsCount || 50}
                        </span>
                        <p className="font-semibold text-slate-900 text-sm mt-2">
                          If $\log_{10}(3x + 1) - \log_{10}(x - 2) = 1$, find the value of $x$.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {['x = 3', 'x = 5', 'x = 1/3', 'x = 7'].map((opt, idx) => (
                          <label
                            key={idx}
                            onClick={() => setCbtSelectedOption(idx)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              cbtSelectedOption === idx
                                ? 'bg-indigo-50 border-indigo-500 font-semibold text-indigo-900'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs">
                              <span className="font-bold mr-2 text-slate-400">{String.fromCharCode(65 + idx)}.</span>
                              {opt}
                            </span>
                            {cbtSelectedOption === idx && <Check className="w-4 h-4 text-indigo-600" />}
                          </label>
                        ))}
                      </div>

                      {cbtScoreSubmitted ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                          <p className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Correct! Option A (x = 3)
                          </p>
                          <p className="mt-1 text-slate-600">
                            <strong>Working:</strong> (3x + 1) / (x - 2) = 10 &rarr; 3x + 1 = 10x - 20 &rarr; 7x = 21 &rarr; x = 3.
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCbtScoreSubmitted(true)}
                          disabled={cbtSelectedOption === null}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                        >
                          Submit & Check Answer
                        </button>
                      )}
                    </div>
                  ) : (
                    // Regular Text / Notes Reader
                    <div className="space-y-4">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                        <strong className="text-slate-900">Summary:</strong> {selectedResource.summary}
                      </div>

                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-line border border-slate-800">
                        {selectedResource.fullContent || selectedResource.previewSnippet}
                      </div>
                    </div>
                  )}
                </div>
              ) : activeViewerTab === 'ai_tutor' ? (
                // Ask AI Tab
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-2.5 text-xs text-purple-900">
                    <Bot className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <p className="font-bold">Ask anything about this resource</p>
                      <p className="text-[11px] text-purple-700">Grounded strictly in WAEC and NERDC curriculum standards.</p>
                    </div>
                  </div>

                  {/* AI Quick Prompt Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleAskAI('Explain this chapter in simple terms')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                    >
                      💡 Explain in simple terms
                    </button>
                    <button
                      onClick={() => handleAskAI('Give me 3 likely WAEC exam questions on this')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                    >
                      📝 3 WAEC Exam Questions
                    </button>
                    <button
                      onClick={() => handleAskAI('Create step-by-step revision flashcards')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                    >
                      ⚡ Revision Flashcards
                    </button>
                  </div>

                  {/* AI Query Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="e.g. Can you explain how to solve step 2 of this formula?"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                    />
                    <button
                      onClick={() => handleAskAI()}
                      disabled={isAiLoading || !aiQuestion.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAiLoading ? 'Analyzing...' : 'Ask AI'}</span>
                    </button>
                  </div>

                  {/* AI Response Output */}
                  {isAiLoading && (
                    <div className="p-6 text-center text-purple-600 animate-pulse space-y-2">
                      <Bot className="w-8 h-8 mx-auto" />
                      <p className="text-xs font-medium">Skuggle AI Tutor is drafting comprehensive curriculum notes...</p>
                    </div>
                  )}

                  {aiResponse && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-line space-y-2">
                      {aiResponse}
                    </div>
                  )}
                </div>
              ) : (
                // Annotations / Notes Tab
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-900 text-xs flex items-center justify-between">
                    <span>Personal highlights and notes saved on this device.</span>
                    <button className="text-amber-800 font-bold hover:underline flex items-center gap-1 text-[11px]">
                      <Bookmark className="w-3 h-3" />
                      <span>Add Note</span>
                    </button>
                  </div>

                  <div className="p-3 border border-slate-200 rounded-xl bg-white space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Highlighted on 22 Aug, 2026</span>
                      <span className="font-bold text-indigo-600">Chapter 3</span>
                    </div>
                    <p className="text-xs font-medium text-slate-800">
                      &ldquo;Remember: Discriminant &Delta; &lt; 0 yields complex roots. WAEC general math strictly tests real domain where &Delta; &ge; 0.&rdquo;
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBookmark(selectedResource.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                    bookmarkedIds.includes(selectedResource.id)
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{bookmarkedIds.includes(selectedResource.id) ? 'Saved in Library' : 'Save for Later'}</span>
                </button>

                <button
                  onClick={() => alert(`Downloading offline package for "${selectedResource.title}"...`)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Offline PDF</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedResource(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
