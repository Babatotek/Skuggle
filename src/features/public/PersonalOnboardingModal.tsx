import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  User,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Key,
  BookOpen,
  QrCode,
  X,
  Lock,
  Award,
  Calendar,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Persona, UserRole } from '../../types';
import confetti from 'canvas-confetti';
import { describeApiError } from '../../lib/apiClient';

interface PersonalOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona; // 'teacher' | 'student' | 'parent'
  onComplete: () => void;
}

export const PersonalOnboardingModal: React.FC<PersonalOnboardingModalProps> = ({
  isOpen,
  onClose,
  persona,
  onComplete,
}) => {
  const { registerPersonalAccount, linkChildWithCode, showToast } = useApp();

  // Mode: 'choose_path' | 'join_school' | 'personal_space' | 'success'
  const [onboardingMode, setOnboardingMode] = useState<'choose_path' | 'join_school' | 'personal_space'>('choose_path');

  // Common user details
  const [fullName, setFullName] = useState(
    persona === 'teacher' ? 'Oluwatosin Fanimo' : persona === 'parent' ? 'Mrs. Ronke Fanimo' : 'David Fanimo'
  );
  const [email, setEmail] = useState(
    persona === 'teacher'
      ? 'analytictosin@gmail.com'
      : persona === 'parent'
      ? 'ronke.fanimo@gmail.com'
      : 'david.fanimo@student.ng'
  );
  const [phone, setPhone] = useState('+234 802 888 7766');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('2010-01-01');
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // School Joining Inputs
  const [schoolCodeOrInvite, setSchoolCodeOrInvite] = useState('');
  const [parentChildLinkCode, setParentChildLinkCode] = useState('CHIA-LNK-8821');

  // Teacher specific state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics', 'Further Mathematics']);
  const [curriculumUsed, setCurriculumUsed] = useState('NERDC (Nigerian National Curriculum)');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['JSS 2', 'JSS 3']);
  const [trcnCertified, setTrcnCertified] = useState(true);

  // Student specific state
  const [studentLevel, setStudentLevel] = useState('JSS 2');
  const [studentGoals, setStudentGoals] = useState<string[]>([
    'Daily NERDC Homework Practice',
    'BECE & WAEC Exam Prep',
    'Master STEM Concepts',
  ]);

  // Parent specific state
  const [childrenList, setChildrenList] = useState<Array<{ name: string; classLevel: string; school?: string }>>([
    { name: 'David Fanimo', classLevel: 'JSS 2', school: 'Crown Heights Int’l Academy' },
    { name: 'Grace Fanimo', classLevel: 'Primary 5', school: 'Crown Heights Int’l Academy' },
  ]);
  const [newChildName, setNewChildName] = useState('');
  const [newChildClass, setNewChildClass] = useState('Primary 5');

  if (!isOpen) return null;

  const handleAddChild = () => {
    if (!newChildName.trim()) return;
    setChildrenList((prev) => [...prev, { name: newChildName.trim(), classLevel: newChildClass }]);
    setNewChildName('');
  };

  const handleFinishJoinSchool = async () => {
    if (persona === 'parent') {
      if (!parentChildLinkCode.trim()) {
        showToast('Linking code required', 'Please enter your child’s secure linking code from the school.', 'warning');
        return;
      }
      linkChildWithCode(parentChildLinkCode);
    }

    setSubmitting(true);
    try {
      await registerPersonalAccount({ persona: persona as 'teacher' | 'student' | 'parent', fullName, email, phone, password, birthDate, guardianName, guardianEmail, actionIntent: 'join_school', schoolInviteCode: schoolCodeOrInvite });
    } catch (error) { showToast('Account creation failed', describeApiError(error), 'failed'); setSubmitting(false); return; }

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    onComplete();
  };

  const handleFinishPersonalSpace = async () => {
    setSubmitting(true);
    try {
      await registerPersonalAccount({ persona: persona as 'teacher' | 'student' | 'parent', fullName, email, phone, password, birthDate, guardianName, guardianEmail, actionIntent: 'personal_space' });
    } catch (error) { showToast('Account creation failed', describeApiError(error), 'failed'); setSubmitting(false); return; }

    try {
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
    } catch (e) {}

    onComplete();
  };

  const getPersonaMeta = () => {
    switch (persona) {
      case 'teacher':
        return {
          title: 'Teacher Onboarding',
          subtitle: 'Create lessons, assessments and manage learning',
          badge: 'Educator Space',
          icon: GraduationCap,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        };
      case 'student':
        return {
          title: 'Student Onboarding',
          subtitle: 'Learn, practise and monitor your progress',
          badge: 'Learner Hub',
          icon: User,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        };
      case 'parent':
        return {
          title: 'Parent & Guardian Onboarding',
          subtitle: 'Follow and support your child’s learning',
          badge: 'Family Space',
          icon: Users,
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
        };
      default:
        return {
          title: 'Get Started',
          subtitle: 'Join your educational workspace',
          badge: 'Skuggle Space',
          icon: Sparkles,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
        };
    }
  };

  const meta = getPersonaMeta();
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${meta.bgColor} ${meta.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-slate-900">{meta.title}</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-200/80 text-slate-700">
                  {meta.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500">{meta.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: CHOOSE PATH */}
          {onboardingMode === 'choose_path' && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto">
                <h4 className="font-display text-xl font-bold text-slate-900 mb-1">
                  How would you like to get started?
                </h4>
                <p className="text-xs text-slate-500">
                  Skuggle separates your personal account from school memberships. You can connect to schools at any time.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Join School */}
                <button
                  type="button"
                  onClick={() => setOnboardingMode('join_school')}
                  className="p-5 rounded-2xl border-2 border-slate-200 hover:border-indigo-600 bg-white hover:bg-indigo-50/30 text-left transition-all group flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h5 className="font-display font-bold text-base text-slate-900 mb-1">
                      {persona === 'teacher'
                        ? 'Join a School'
                        : persona === 'student'
                        ? 'Join my School'
                        : 'Connect to Child’s School'}
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {persona === 'teacher'
                        ? 'Enter a school invitation token or single-use link provided by your administrator.'
                        : persona === 'student'
                        ? 'Enter your school student admission code or scan your printable login card.'
                        : 'Link directly using a secure child verification code from the school.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform">
                    <span>Enter School Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Option 2: Personal Space */}
                <button
                  type="button"
                  onClick={() => setOnboardingMode('personal_space')}
                  className="p-5 rounded-2xl border-2 border-slate-200 hover:border-purple-600 bg-white hover:bg-purple-50/30 text-left transition-all group flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h5 className="font-display font-bold text-base text-slate-900 mb-1">
                      {persona === 'teacher'
                        ? 'Personal Teaching Space'
                        : persona === 'student'
                        ? 'Personal Learning Space'
                        : 'Family Learning Space'}
                    </h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {persona === 'teacher'
                        ? 'Prepare NERDC lesson plans, build CBT question banks, and tutor privately.'
                        : persona === 'student'
                        ? 'Study independently, practice quizzes, and get help from the Skuggle AI buddy.'
                        : 'Track home study, set weekly goals, and support multiple children across schools.'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-purple-700 group-hover:translate-x-1 transition-transform">
                    <span>Set up Personal Space</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Create Password *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50" required />
                </div>
                {persona === 'student' && <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Date of Birth *</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50" required />
                </div>}
              </div>
              {persona === 'student' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Guardian full name" className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50" required />
                <input type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} placeholder="Guardian email" className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50" required />
              </div>}

              {/* Account persistence note */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Persistent Identity:</strong> Skuggle remembers all your personal spaces and school memberships. You will never be asked to re-select your role on subsequent logins.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2A: JOIN SCHOOL FLOW */}
          {onboardingMode === 'join_school' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-display font-bold text-base text-slate-900">
                  {persona === 'parent' ? 'Link Child & Connect to School' : 'Connect with School Invitation'}
                </h4>
                <button
                  type="button"
                  onClick={() => setOnboardingMode('choose_path')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  ← Change Option
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Create Password *</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50" required />
                </div>
                {persona === 'student' && <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Date of Birth *</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50" required />
                </div>}
              </div>
              {persona === 'student' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Guardian full name" className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50" required />
                <input type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} placeholder="Guardian email" className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50" required />
              </div>}

              {persona === 'parent' ? (
                <div className="space-y-4">
                  {/* Security Rule Highlight */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs text-amber-900">Mandatory Security Verification</h5>
                      <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                        To protect learner privacy, parents cannot search for children by name. Enter the unique <strong>Parent-Child Linking Code</strong> provided on your child's admission slip or printable card.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Child Linking Code *
                    </label>
                    <input
                      type="text"
                      value={parentChildLinkCode}
                      onChange={(e) => setParentChildLinkCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CHIA-LNK-8821"
                      className="w-full text-sm px-4 py-3 rounded-xl border-2 border-indigo-300 font-mono uppercase bg-indigo-50/40 text-indigo-950 font-bold focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Sample active test codes: <code className="bg-slate-100 px-1 py-0.5 rounded">CHIA-LNK-8821</code> (David Fanimo) or <code className="bg-slate-100 px-1 py-0.5 rounded">CHIA-LNK-9943</code> (Grace Fanimo).
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {persona === 'teacher' ? 'School Invitation Token / Code *' : 'Student Code or Login Token *'}
                  </label>
                  <input
                    type="text"
                    value={schoolCodeOrInvite}
                    onChange={(e) => setSchoolCodeOrInvite(e.target.value.toUpperCase())}
                    placeholder={persona === 'teacher' ? 'e.g. INV-TCH-77492 or CHIA-LAGOS' : 'e.g. CHIA/2024/0142'}
                    className="w-full text-sm px-4 py-3 rounded-xl border border-slate-300 font-mono uppercase bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter the code from your school invitation or credentials card.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOnboardingMode('choose_path')}
                  className="text-xs font-semibold text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinishJoinSchool}
                  disabled={submitting || !password || !email || !fullName}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs flex items-center gap-2"
                >
                  <span>{submitting ? 'Creating account...' : 'Verify & Join School Space'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2B: PERSONAL SPACE SETUP */}
          {onboardingMode === 'personal_space' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-display font-bold text-base text-slate-900">
                  {persona === 'teacher'
                    ? 'Configure Teacher Profile & Curriculum'
                    : persona === 'student'
                    ? 'Configure Personal Learner Profile'
                    : 'Family Learning Hub Setup'}
                </h4>
                <button
                  type="button"
                  onClick={() => setOnboardingMode('choose_path')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  ← Change Option
                </button>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* TEACHER SPECIFIC FIELDS */}
              {persona === 'teacher' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Curriculum Standard *
                    </label>
                    <select
                      value={curriculumUsed}
                      onChange={(e) => setCurriculumUsed(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50"
                    >
                      <option value="NERDC (Nigerian National Curriculum)">NERDC (Nigerian National Curriculum)</option>
                      <option value="British-Nigerian Blended Curriculum">British-Nigerian Blended Curriculum</option>
                      <option value="Cambridge International (IGCSE/Checkpoint)">Cambridge International</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Subjects Taught (Personal Repository)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Mathematics', 'Further Mathematics', 'English Language', 'Basic Science', 'Physics', 'Chemistry', 'Biology', 'Civic Education'].map(
                        (sub) => {
                          const isSel = selectedSubjects.includes(sub);
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => {
                                setSelectedSubjects((prev) =>
                                  isSel ? prev.filter((s) => s !== sub) : [...prev, sub]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                                isSel
                                  ? 'bg-purple-900 text-white border-purple-900'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {sub}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                    <Award className="w-5 h-5 text-purple-700 shrink-0" />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-purple-950 block">TRCN Certification Status</span>
                      <span className="text-[11px] text-purple-800">
                        Teachers Registration Council of Nigeria verified badge displayed on your public profile.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={trcnCertified}
                      onChange={(e) => setTrcnCertified(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                  </div>
                </div>
              )}

              {/* STUDENT SPECIFIC FIELDS */}
              {persona === 'student' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Current Class Level *
                    </label>
                    <select
                      value={studentLevel}
                      onChange={(e) => setStudentLevel(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50"
                    >
                      {['Primary 4', 'Primary 5', 'Primary 6', 'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'].map(
                        (lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Learning Objectives & Exam Focus
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        'Daily NERDC Homework Practice',
                        'BECE & WAEC Exam Prep',
                        'Master STEM Concepts',
                        'JAMB / UTME Preparation',
                        'National Mathematics Olympiad',
                      ].map((goal) => {
                        const isChecked = studentGoals.includes(goal);
                        return (
                          <label
                            key={goal}
                            className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 ${
                              isChecked
                                ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setStudentGoals((prev) =>
                                  isChecked ? prev.filter((g) => g !== goal) : [...prev, goal]
                                );
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span>{goal}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* PARENT SPECIFIC FIELDS */}
              {persona === 'parent' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Children in Family Learning Space
                    </label>
                    <div className="space-y-2 mb-3">
                      {childrenList.map((ch, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                              {ch.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{ch.name}</span>
                              <span className="text-[11px] text-slate-500">
                                {ch.classLevel} {ch.school ? `· ${ch.school}` : '(Home Study)'}
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Add another child */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Child's full name"
                        value={newChildName}
                        onChange={(e) => setNewChildName(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <select
                        value={newChildClass}
                        onChange={(e) => setNewChildClass(e.target.value)}
                        className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      >
                        {['Nursery 2', 'Primary 1', 'Primary 3', 'Primary 5', 'JSS 1', 'JSS 2', 'SSS 1', 'SSS 2'].map(
                          (c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          )
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddChild}
                        className="px-3 py-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOnboardingMode('choose_path')}
                  className="text-xs font-semibold text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinishPersonalSpace}
                  disabled={submitting || !password || !email || !fullName}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-indigo-900 rounded-xl shadow-xs flex items-center gap-2"
                >
                  <span>{submitting ? 'Creating account...' : 'Create Personal Workspace'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
