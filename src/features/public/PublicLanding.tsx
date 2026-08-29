import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  Building2,
  GraduationCap,
  Users,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Lock,
  Zap,
  Link as LinkIcon,
  BookOpen,
  BarChart3,
  MessageSquare,
  Star,
  CheckCircle2,
  Menu,
  X,
  Send,
  HelpCircle,
  Layers,
  KeyRound,
  ChevronRight,
  School,
  ExternalLink,
} from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { Persona } from '../../types';
import { SubscriptionPlanModal } from '../subscription/SubscriptionPlanModal';
import { WorkspaceChooserModal } from './WorkspaceChooserModal';
import { apiRequest, describeApiError } from '../../lib/apiClient';

// High-fidelity image assets matching the exact design - lazy loaded for performance
const schoolBuildingImg = new URL('../../assets/images/role_school_building_1787852475246.jpg', import.meta.url).href;
const teacherPointingImg = new URL('../../assets/images/role_teacher_pointing_1787852490451.jpg', import.meta.url).href;
const studentBlueImg = new URL('../../assets/images/role_student_blue_1787852506751.jpg', import.meta.url).href;
const parentsPinkImg = new URL('../../assets/images/role_parents_pink_1787852522122.jpg', import.meta.url).href;
const radiantBannerImg = new URL('../../assets/images/radiant_light_banner_1787852576561.jpg', import.meta.url).href;

interface PublicLandingProps {
  onSelectRole: (persona: Persona) => void;
  onOpenResultChecker: () => void;
  onTenantLogin: () => void;
  onEnterAppDirectly: () => void;
  onOpenPersonalAuth: () => void;
  onOpenSchoolAuth: () => void;
}

const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const cardStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};

const cardReveal: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: 'center' | 'left';
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}) => (
  <motion.div
    variants={sectionReveal}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.35 }}
    className={`${align === 'center' ? 'text-center mx-auto' : 'text-left'} max-w-2xl space-y-3 mb-10 sm:mb-12 ${className}`}
  >
    <p className="text-xs sm:text-sm font-semibold text-[#4F46E5] tracking-wide">{eyebrow}</p>
    <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
      {title}
    </h2>
    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{description}</p>
  </motion.div>
);

export const PublicLanding: React.FC<PublicLandingProps> = ({
  onSelectRole,
  onOpenResultChecker,
  onTenantLogin,
  onEnterAppDirectly,
  onOpenPersonalAuth,
  onOpenSchoolAuth,
}) => {
  const [showPricingModal, setShowPricingModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Get Started Space Modal State
  const [showSpaceModal, setShowSpaceModal] = useState<boolean>(false);
  const [activeSpaceTab, setActiveSpaceTab] = useState<'both' | 'personal' | 'school'>('both');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Demo Form State
  const [demoFormData, setDemoFormData] = useState({
    fullName: '',
    workEmail: '',
    schoolName: '',
    phone: '',
    message: '',
  });
  const [demoSubmitted, setDemoSubmitted] = useState<boolean>(false);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleOpenGetStarted = (initialTab: 'both' | 'personal' | 'school' = 'both') => {
    setActiveSpaceTab(initialTab);
    setShowSpaceModal(true);
  };

  const handleStartPersonalOnboarding = (persona: Persona) => {
    setShowSpaceModal(false);
    // Personal auth page handles all personal onboarding (sign in + register)
    onOpenPersonalAuth();
  };

  const handleStartSchoolRegistration = () => {
    setShowSpaceModal(false);
    onSelectRole('school');
  };

  const handleOpenSchoolSignIn = () => {
    setShowSpaceModal(false);
    onOpenSchoolAuth();
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoFormData.workEmail || !demoFormData.fullName || demoSubmitting) return;
    setDemoError(null);
    setDemoSubmitting(true);
    try {
      await apiRequest('/public/contact', {
        method: 'POST',
        suppressErrorNotification: true,
        body: JSON.stringify({
          fullName: demoFormData.fullName.trim(),
          workEmail: demoFormData.workEmail.trim().toLowerCase(),
          schoolName: demoFormData.schoolName.trim() || undefined,
          phone: demoFormData.phone.trim() || undefined,
          message: demoFormData.message.trim() || undefined,
        }),
      });
      setDemoSubmitted(true);
      setTimeout(() => {
        setDemoSubmitted(false);
        setDemoFormData({
          fullName: '',
          workEmail: '',
          schoolName: '',
          phone: '',
          message: '',
        });
      }, 4000);
    } catch (cause) {
      setDemoError(describeApiError(cause));
    } finally {
      setDemoSubmitting(false);
    }
  };

  const faqItems = [
    {
      q: 'Can I use Skuggle without joining a school?',
      a: 'Yes! My Skuggle provides personal study tools, AI tutoring, smart revision flashcards, homework helpers, and private learning history completely free without needing to be tied to a specific institution.',
    },
    {
      q: 'What is the difference between My Skuggle and a school workspace?',
      a: 'My Skuggle is your private, lifelong personal learning hub that travels with you throughout your academic journey. A school workspace is an isolated, official institutional portal managed by your school for official attendance, NERDC curriculum grading, CBT examinations, and fee billing.',
    },
    {
      q: 'Can one account connect to multiple schools?',
      a: 'Absolutely. Educators teaching at multiple academies and parents with children in different schools can switch seamlessly between distinct institutional portals with a single click—no duplicate accounts needed.',
    },
    {
      q: 'Does Skuggle work on mobile and low bandwidth?',
      a: 'Yes. Skuggle is engineered with offline-first caching and ultra-lightweight asset footprints, ensuring swift performance on smartphones, tablets, and intermittent 2G/3G network conditions.',
    },
    {
      q: 'Is my personal information visible to my school?',
      a: 'No. Strict cryptographic tenant isolation guarantees that your private "My Skuggle" workspace, notes, personal chats, and personal learning metrics remain 100% confidential and are never shared with school administrators.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFE] text-slate-900 flex flex-col font-sans relative selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION BAR                                                     */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left Brand Identity: Logo + Skuggle */}
          <div className="flex items-center gap-2.5">
            <BrandMark size="md" showText={true} />
          </div>

          {/* Center Navigation Links: HOME, FEATURES, SUBSCRIPTION, CONTACT, FAQ */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-slate-700">
            <button
              onClick={() => scrollToSection('home')}
              className="hover:text-indigo-600 transition-colors cursor-pointer py-1"
            >
              HOME
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-indigo-600 transition-colors cursor-pointer py-1"
            >
              FEATURES
            </button>
            <button
              onClick={() => scrollToSection('subscription')}
              className="hover:text-indigo-600 transition-colors cursor-pointer py-1"
            >
              SUBSCRIPTION
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="hover:text-indigo-600 transition-colors cursor-pointer py-1"
            >
              CONTACT
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-indigo-600 transition-colors cursor-pointer py-1"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Quick Sign In Link */}
            <button
              onClick={onOpenSchoolAuth}
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-full transition-colors cursor-pointer"
            >
              Sign In
            </button>

            {/* Primary Filled Pill Button: Get started free */}
            <button
              id="header-get-started-btn"
              onClick={() => handleOpenGetStarted('both')}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xs hover:shadow-indigo-500/25 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get started free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Outlined Pill Button: Explore Skuggle */}
            <button
              id="header-explore-skuggle-btn"
              onClick={onEnterAppDirectly}
              className="bg-white hover:bg-slate-50 text-[#4F46E5] border border-[#6366F1]/50 text-xs font-bold px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore Skuggle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => handleOpenGetStarted('both')}
              className="bg-[#4F46E5] text-white text-xs font-bold px-3 py-1.5 rounded-full"
            >
              Get started
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden border-b border-slate-200 bg-white px-5 py-4 space-y-3 font-semibold text-sm"
            >
              <button
                onClick={() => scrollToSection('home')}
                className="w-full text-left py-1 text-slate-700"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="w-full text-left py-1 text-slate-700"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('subscription')}
                className="w-full text-left py-1 text-slate-700"
              >
                Subscription
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="w-full text-left py-1 text-slate-700"
              >
                Contact
              </button>
              <button
                onClick={() => scrollToSection('faq')}
                className="w-full text-left py-1 text-slate-700"
              >
                FAQ
              </button>
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenSchoolAuth(); }}
                  className="w-full py-2.5 text-center text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl"
                >
                  School Space (Sign In)
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenPersonalAuth(); }}
                  className="w-full py-2.5 text-center text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-xl"
                >
                  Personal Space (My Skuggle)
                </button>
                <button
                  onClick={onOpenResultChecker}
                  className="w-full py-2 text-center text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Student Scratch PIN Checker
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION    */}
      {/* ========================================================================= */}
      <section
        id="home"
        className="relative pt-12 pb-14 sm:pt-20 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_40%,rgba(139,92,246,0.08),transparent_70%)] pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
          {/* Left Hero Text Column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-7 sm:space-y-8"
          >
            <p className="text-sm sm:text-base font-semibold text-[#4F46E5] tracking-tight">
              One identity. Every learning space.
            </p>

            <div className="space-y-1.5">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.75rem] xl:text-[5.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.02]">
                Smart School now.
              </h1>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.75rem] xl:text-[5.25rem] font-extrabold tracking-tight hero-gradient-text leading-[1.02]">
                global relevance tommorrow.
              </h1>
            </div>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Skuggle unifies school administration, classroom tools, and personal learning in one
              secure platform for principals, teachers, students, and parents.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                id="hero-get-started-btn"
                onClick={() => handleOpenGetStarted('both')}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm sm:text-base font-bold px-7 sm:px-8 py-3.5 sm:py-4 rounded-full shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get started free</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                id="hero-explore-skuggle-btn"
                onClick={onEnterAppDirectly}
                className="bg-white hover:bg-slate-50 text-[#4F46E5] border border-[#6366F1]/50 text-sm sm:text-base font-bold px-6 sm:px-7 py-3.5 sm:py-4 rounded-full shadow-2xs transition-all flex items-center gap-2.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Explore Skuggle</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                'Free personal workspace',
                'Multi-school support',
                'Works on low bandwidth',
              ].map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-1.5 text-xs sm:text-sm font-semibold text-indigo-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right Hero Mascot Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 relative flex items-end justify-center min-h-[420px] sm:min-h-[540px] lg:min-h-[580px]"
          >
            <div className="relative w-full max-w-[560px] h-[420px] sm:h-[540px] lg:h-[580px] flex items-end justify-center">
              <img
                src="/BackgroundHero.png"
                alt=""
                aria-hidden="true"
                className="hero-swirl absolute inset-x-[-8%] bottom-[-6%] w-[118%] max-w-none h-[92%] object-contain object-bottom mix-blend-screen opacity-90 pointer-events-none select-none"
              />

              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="hero-mascot-float relative z-10 w-full h-full flex items-end justify-center"
              >
                <img
                  src="/skuggleAiHero.png"
                  alt="Skuggle AI mascot waving and holding a learning book"
                  referrerPolicy="no-referrer"
                  className="w-auto h-[94%] max-w-full object-contain object-bottom drop-shadow-[0_28px_48px_rgba(79,70,229,0.28)]"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FOUR ROLE CARDS ROW (School, Teacher, Student, Parent with 3D art)     */}
      {/* ========================================================================= */}
      <section className="py-4 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          eyebrow="Built for every role"
          title="Choose your learning space"
          description="Whether you run a school, teach a class, study independently, or support a child — Skuggle gives each role a dedicated workspace with the tools they need."
        />

        <motion.div
          variants={cardStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {/* Card 1: School */}
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.015 }}
            onClick={() => handleOpenGetStarted('school')}
            className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 block leading-none">School</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Register & Sign In</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Set up your institution portal — manage students, fees, CBT exams, and NERDC-aligned reporting.
            </p>

            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-50/50 to-purple-50/50 flex items-center justify-center">
              <img
                src={schoolBuildingImg}
                alt="School campus illustration"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>

          {/* Card 2: Teacher */}
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.015 }}
            onClick={() => { setShowSpaceModal(false); onOpenPersonalAuth(); }}
            className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-900">Teacher</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Plan lessons with AI, mark assessments faster, and connect to multiple school workspaces.
            </p>

            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-b from-amber-50/50 to-orange-50/50 flex items-center justify-center">
              <img
                src={teacherPointingImg}
                alt="Teacher instructing illustration"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>

          {/* Card 3: Student */}
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.015 }}
            onClick={() => { setShowSpaceModal(false); onOpenPersonalAuth(); }}
            className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-900">Student</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Practice CBT questions, track progress, and keep a private study hub that follows you everywhere.
            </p>

            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-b from-blue-50/50 to-sky-50/50 flex items-center justify-center">
              <img
                src={studentBlueImg}
                alt="Student with backpack illustration"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>

          {/* Card 4: Parent */}
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.015 }}
            onClick={() => { setShowSpaceModal(false); onOpenPersonalAuth(); }}
            className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-lg hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-slate-900">Parent</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Monitor attendance, results, and school updates for all your children from one dashboard.
            </p>

            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-b from-rose-50/50 to-pink-50/50 flex items-center justify-center">
              <img
                src={parentsPinkImg}
                alt="Parents together illustration"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BENTO GRID FEATURES (Unified Progress, AI that supports, etc.)          */}
      {/* ========================================================================= */}
      <section id="features" className="py-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          eyebrow="Platform capabilities"
          title="Everything your school community needs"
          description="From AI-assisted teaching to secure tenant isolation — Skuggle brings institutional tools and personal learning together in one connected ecosystem."
        />

        <motion.div
          variants={cardStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {/* Left Column (2 cards stacked) */}
          <div className="space-y-5 flex flex-col justify-between">
            <motion.div
              variants={cardReveal}
              whileHover={{ y: -5, scale: 1.01 }}
              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group flex-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="w-28 h-12">
                  <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                    <path
                      d="M0 35 Q 25 32, 45 20 T 90 8"
                      fill="none"
                      stroke="#818CF8"
                      strokeWidth="2.5"
                      strokeDasharray="3 3"
                    />
                    <circle cx="90" cy="8" r="4" fill="#6366F1" />
                  </svg>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
                    Unified progress
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  See learning outcomes across classes, terms, and subjects in one dashboard — no more scattered spreadsheets.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardReveal}
              whileHover={{ y: -5, scale: 1.01 }}
              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group flex-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-indigo-50/80 to-purple-50/80 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Lock className="w-6 h-6" />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
                    Secure by design
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Cryptographic tenant isolation keeps school data separate from your private My Skuggle workspace.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Center Column: AI that supports */}
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.012 }}
            className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between items-center text-center relative overflow-hidden group min-h-[380px]"
          >
            <div className="w-full flex-1 flex flex-col items-center justify-center pt-2">
              <div className="w-48 h-56 rounded-full bg-gradient-to-b from-indigo-50 to-purple-50 p-2 flex items-end justify-center relative shadow-inner overflow-hidden">
                <img
                  src="/skuggleAiHero.png"
                  alt="Skuggle AI mascot"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain object-bottom drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            <div className="w-full pt-6 space-y-2 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
                  AI that supports
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Lesson planning, smart marking, and an AI study buddy that adapts to each learner&apos;s pace.
              </p>
            </div>
          </motion.div>

          {/* Right Column (2 cards stacked) */}
          <div className="space-y-5 flex flex-col justify-between">
            <motion.div
              variants={cardReveal}
              whileHover={{ y: -5, scale: 1.01 }}
              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group flex-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
                    Stronger together
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Teachers, parents, and admins collaborate in real time — announcements, attendance, and results stay in sync.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={cardReveal}
              whileHover={{ y: -5, scale: 1.01 }}
              className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group flex-1"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/30 via-indigo-50/20 to-blue-50/30 pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-6 space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
                    Built for what&apos;s next
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Offline-first architecture and lightweight assets keep Skuggle fast on any device or network.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DUAL WORKSPACE MOCKUP COMPARISON (My Skuggle <-> School workspace)     */}
      {/* ========================================================================= */}
      <section className="py-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          eyebrow="Two spaces, one account"
          title="Personal learning meets institutional excellence"
          description="My Skuggle is your private, lifelong study hub. Your school workspace is the official portal for grades, fees, and administration — linked seamlessly under a single identity."
        />

        <motion.div
          variants={cardStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch"
        >
          {/* Left Panel: My Skuggle Mockup */}
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">My Skuggle</h3>
              </div>
              <button
                onClick={() => handleOpenGetStarted('personal')}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Launch Personal →
              </button>
            </div>

            {/* Embedded Mockup UI Box */}
            <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 space-y-3 font-sans">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center">
                    S
                  </div>
                  <span className="text-xs font-bold text-slate-800">My Skuggle</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
              </div>

              {/* Mock Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* My learning */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs space-y-2">
                  <p className="text-[11px] font-bold text-slate-700">My learning</p>
                  <p className="text-[9px] text-slate-400">Course progress</p>
                  <div className="w-full bg-indigo-600 h-2 rounded-full" />
                  <div className="w-3/4 bg-indigo-200 h-1.5 rounded-full" />
                </div>

                {/* Focus today */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-700">Focus today</p>
                  <div className="space-y-1 text-[9px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[8px]">
                        1
                      </span>
                      <span className="w-16 bg-slate-200 h-1.5 rounded-full" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[8px]">
                        2
                      </span>
                      <span className="w-12 bg-slate-200 h-1.5 rounded-full" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[8px]">
                        3
                      </span>
                      <span className="w-20 bg-slate-200 h-1.5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Tiles */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="bg-white rounded-xl p-2.5 border border-slate-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-slate-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-slate-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-slate-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Star className="w-4 h-4" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Central Linking Bridge Badge */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white border-2 border-indigo-200 shadow-lg items-center justify-center text-indigo-600">
            <LinkIcon className="w-5 h-5" />
          </div>

          {/* Right Panel: School Workspace Mockup */}
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-lg transition-all space-y-4 flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">School workspace</h3>
              </div>
              <button
                onClick={() => handleOpenGetStarted('school')}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Access School Space →
              </button>
            </div>

            {/* Embedded Mockup UI Box */}
            <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 space-y-3 font-sans">
              {/* Window Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-700 text-white font-bold text-[9px] flex items-center justify-center">
                    S
                  </div>
                  <span className="text-xs font-bold text-slate-800">School workspace</span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">Overview</span>
                  <span className="px-1.5 py-0.5 bg-slate-200/70 rounded">Students</span>
                  <span className="px-1.5 py-0.5 bg-slate-200/70 rounded">Reports</span>
                </div>
              </div>

              {/* Mock Charts & Classes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Learner Overview Bar Chart */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-700">Learner overview</p>
                    <span className="text-[8px] text-emerald-600 font-bold">+12%</span>
                  </div>
                  <div className="flex items-end justify-between gap-1.5 h-16 pt-2">
                    <div className="w-3 bg-indigo-200 h-[35%] rounded-t" />
                    <div className="w-3 bg-indigo-300 h-[50%] rounded-t" />
                    <div className="w-3 bg-indigo-400 h-[40%] rounded-t" />
                    <div className="w-3 bg-indigo-500 h-[75%] rounded-t" />
                    <div className="w-3 bg-indigo-600 h-[90%] rounded-t" />
                    <div className="w-3 bg-indigo-700 h-[65%] rounded-t" />
                  </div>
                  <div className="flex justify-between text-[7px] text-slate-400 font-mono">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                  </div>
                </div>

                {/* Classes list */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs space-y-2">
                  <p className="text-[11px] font-bold text-slate-700">Classes</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 text-[9px] font-bold text-slate-700">
                      <span>Classroom</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 text-[9px] font-bold text-slate-700">
                      <span>Mathematics</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 text-[9px] font-bold text-slate-700">
                      <span>Science</span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 6. PRICING SECTION ("Simple plans that grow with you.")                   */}
      {/* ========================================================================= */}
      <section id="subscription" className="py-12 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          eyebrow="Simple plans that"
          title="Grow with you"
          description="Start free with a personal workspace, then scale to a full school portal when you're ready — no lock-in, no hidden fees."
        />

        <motion.div
          variants={cardStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
        >
          {/* Card 1: Starter */}
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.01 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs hover:shadow-lg flex flex-col justify-between space-y-6 transition-all"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-2xl text-slate-900">Starter</h3>
                <p className="text-xs text-slate-500 mt-1">
                  For individuals and small schools
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>My Skuggle personal workspace</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Core learning tools</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Progress tracking</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Secure and private</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenGetStarted('personal')}
              className="w-full py-3 rounded-2xl border border-indigo-200/80 bg-white hover:bg-slate-50 text-indigo-600 text-xs font-bold transition-all cursor-pointer hover:scale-[1.01]"
            >
              Start free
            </button>
          </motion.div>

          {/* Card 2: Business (Featured / Highlighted) */}
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.015 }}
            className="bg-white rounded-3xl border-2 border-indigo-500 p-7 sm:p-8 shadow-lg hover:shadow-xl relative flex flex-col justify-between space-y-6 transition-all"
          >
            {/* "MOST POPULAR" Pill Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#4F46E5] text-white text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
              MOST POPULAR
            </div>

            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-2xl text-slate-900">Business</h3>
                <p className="text-xs text-slate-500 mt-1">
                  For growing schools and connected teams
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-700 font-semibold">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Everything in Starter</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>School workspace</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Class and assignment tools</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Reports and analytics</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Priority support</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenGetStarted('school')}
              className="w-full py-3.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer hover:scale-[1.01]"
            >
              Choose Business
            </button>
          </motion.div>

          {/* Card 3: Enterprise */}
          <motion.div
            variants={cardReveal}
            whileHover={{ y: -6, scale: 1.01 }}
            className="bg-white rounded-3xl border border-slate-200/90 p-7 sm:p-8 shadow-xs hover:shadow-lg flex flex-col justify-between space-y-6 transition-all"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-2xl text-slate-900">Enterprise</h3>
                <p className="text-xs text-slate-500 mt-1">
                  For large schools and school groups
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Everything in Business</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Advanced admin controls</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Custom integrations</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 stroke-[3]" />
                  <span>Dedicated support</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => scrollToSection('contact')}
              className="w-full py-3 rounded-2xl border border-indigo-200/80 bg-white hover:bg-slate-50 text-indigo-600 text-xs font-bold transition-all cursor-pointer hover:scale-[1.01]"
            >
              Contact sales
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CONTACT / "Request a demo" SECTION (Dual Column Layout)                 */}
      {/* ========================================================================= */}
      <section id="contact" className="py-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          eyebrow="We're here to help"
          title="See Skuggle in action"
          description="Book a personalized demo and discover how Skuggle can support your school community — from onboarding to daily operations."
        />

        <motion.div
          variants={sectionReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Left Column: Contact details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#4F46E5]">Talk to our team</p>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                Reach out directly or fill in the form — we typically respond within one business day.
              </p>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700 pt-2">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>hello@skuggle.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>+1 (555) 012-3456</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>123 Learning Way, Education City</span>
              </div>
            </div>
          </div>

          {/* Right Column: Request a demo Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900">Request a demo</h3>

            {demoSubmitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-950">Demo Request Received!</h4>
                <p className="text-xs text-emerald-700">
                  Our educational solutions team will reach out to {demoFormData.workEmail || 'you'} within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="space-y-3.5 text-xs">
                {demoError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">
                    {demoError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full name</label>
                    <input
                      type="text"
                      required
                      placeholder="Your full name"
                      value={demoFormData.fullName}
                      onChange={(e) => setDemoFormData({ ...demoFormData, fullName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Work email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@school.edu"
                      value={demoFormData.workEmail}
                      onChange={(e) => setDemoFormData({ ...demoFormData, workEmail: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">School name</label>
                    <input
                      type="text"
                      placeholder="Your school name"
                      value={demoFormData.schoolName}
                      onChange={(e) => setDemoFormData({ ...demoFormData, schoolName: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={demoFormData.phone}
                      onChange={(e) => setDemoFormData({ ...demoFormData, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your school and goals..."
                    value={demoFormData.message}
                    onChange={(e) => setDemoFormData({ ...demoFormData, message: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={demoSubmitting}
                  className="w-full py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold transition-all shadow-sm hover:shadow-indigo-500/25 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {demoSubmitting ? 'Sending…' : 'Book a demo'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FREQUENTLY ASKED QUESTIONS (Accordion List)                            */}
      {/* ========================================================================= */}
      <section id="faq" className="py-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <SectionHeader
          eyebrow="Got questions?"
          title="Frequently asked questions"
          description="Everything you need to know about personal workspaces, school portals, privacy, and getting started with Skuggle."
        />

        <motion.div
          variants={cardStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="max-w-3xl mx-auto space-y-3"
        >
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <motion.div
                key={index}
                variants={cardReveal}
                whileHover={{ scale: 1.005 }}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4.5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-900">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-indigo-600 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4.5 pb-4.5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100"
                    >
                      <p className="pt-2">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BOTTOM RADIANT CTA BANNER (Exact visual styling with light ribbons)     */}
      {/* ========================================================================= */}
      <section className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="relative rounded-3xl border border-indigo-100 overflow-hidden bg-gradient-to-r from-[#F5F3FF] via-[#EDE9FE] to-[#FDF4FF] p-8 sm:p-12 text-center shadow-xs">
          {/* Ethereal glowing background */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url(${radiantBannerImg})` }}
          />

          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <div className="flex justify-center mb-1">
              <BrandMark size="md" showText={true} />
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              One identity.{' '}
              <span className="bg-gradient-to-r from-[#6366F1] to-[#9333EA] bg-clip-text text-transparent">
                Every learning space.
              </span>
            </h2>

            {/* Dual CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                onClick={() => handleOpenGetStarted('both')}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get started free</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onEnterAppDirectly}
                className="bg-white hover:bg-slate-50 text-[#4F46E5] border border-[#6366F1]/50 text-xs sm:text-sm font-bold px-5 py-3 rounded-full shadow-2xs transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Explore Skuggle</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Demo Launcher Pill */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onEnterAppDirectly}
        className="fixed bottom-6 right-6 z-30 bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl border border-slate-700/80 flex items-center gap-2 cursor-pointer hover:bg-slate-900"
      >
        <Layers className="w-3.5 h-3.5 text-amber-400" />
        <span>Explore prototype</span>
      </motion.button>

      {/* ========================================================================= */}
      {/* 10. "CHOOSE YOUR SPACE" GET STARTED MODAL                                 */}
      {/* Displays Personal Space and School Space, with School Registration and     */}
      {/* ─── Workspace Chooser Modal ───────────────────────────────────────── */}
      <WorkspaceChooserModal
        isOpen={showSpaceModal}
        onClose={() => setShowSpaceModal(false)}
        onSelectPersonal={() => { setShowSpaceModal(false); onOpenPersonalAuth(); }}
        onSelectSchool={() => { setShowSpaceModal(false); onOpenSchoolAuth(); }}
      />

      {/* Subscription Pricing Modal */}
      <SubscriptionPlanModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
      />
    </div>
  );
};
