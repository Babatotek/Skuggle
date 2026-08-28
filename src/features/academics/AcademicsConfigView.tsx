import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Calendar,
  Layers,
  Percent,
  PlusCircle,
  CheckCircle2,
  Save,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CollapsibleCard, CollapsibleCardGroup } from '../../components/CollapsibleCard';
import { apiMutation, describeApiError } from '../../lib/apiClient';

export const AcademicsConfigView: React.FC = () => {
  const { branding, sessions, terms, subjects: backendSubjects, showToast } = useApp();

  const [activeSession, setActiveSession] = useState(branding.academicSession);
  const [activeTerm, setActiveTerm] = useState(branding.currentTerm);

  // Weights
  const [ca1Weight, setCa1Weight] = useState(15);
  const [ca2Weight, setCa2Weight] = useState(15);
  const [midTermWeight, setMidTermWeight] = useState(10);
  const [examWeight, setExamWeight] = useState(60);

  const totalWeight = ca1Weight + ca2Weight + midTermWeight + examWeight;

  const subjectFallback = [
    { name: 'Mathematics', code: 'MTH', category: 'Core', classes: 'JSS 1 - SSS 3' },
    { name: 'English Language', code: 'ENG', category: 'Core', classes: 'JSS 1 - SSS 3' },
    { name: 'Basic Science', code: 'BSC', category: 'Junior Core', classes: 'JSS 1 - JSS 3' },
    { name: 'Basic Technology', code: 'BTE', category: 'Junior Core', classes: 'JSS 1 - JSS 3' },
    { name: 'Civic Education', code: 'CVE', category: 'National Core', classes: 'JSS 1 - SSS 3' },
    { name: 'Physics', code: 'PHY', category: 'Senior Science', classes: 'SSS 1 - SSS 3' },
    { name: 'Chemistry', code: 'CHM', category: 'Senior Science', classes: 'SSS 1 - SSS 3' },
    { name: 'Biology', code: 'BIO', category: 'Senior Science', classes: 'SSS 1 - SSS 3' },
  ];
  const subjects = backendSubjects.length ? backendSubjects.map((item) => ({ name: item.name, code: item.code, category: item.category, classes: item.applicableLevels.join(', ') || 'Configured classes' })) : subjectFallback;

  const handleSaveAcademics = async () => {
    if (totalWeight !== 100) {
      showToast('Weight Error', `Total assessment weighting must sum to 100% (currently ${totalWeight}%).`);
      return;
    }

    const selectedSession = sessions.find((item) => item.name === activeSession);
    const selectedTerm = terms.find((item) => item.name === activeTerm && (!selectedSession || item.sessionId === selectedSession.id));
    try {
      await Promise.all([
        apiMutation('/onboarding/steps/assessment_structure', 'PATCH', { ca1Weight, ca2Weight, midTermWeight, examWeight }),
        selectedSession && selectedTerm ? apiMutation('/auth/context', 'PUT', { sessionId: selectedSession.id, termId: selectedTerm.id, campusId: null }) : Promise.resolve(),
      ]);
      showToast('Curriculum saved', 'Academic context and assessment weights were saved to the database.');
    } catch (error) { showToast('Academic configuration failed', describeApiError(error), 'failed'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              Academic Curriculum & Session Structure
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full">
              NERDC Compliant
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure academic sessions, terms, grading policy, and national curriculum subjects.
          </p>
        </div>

        <button
          onClick={handleSaveAcademics}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Configurations</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Term & Session Setup + Assessment Weights */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Session Card */}
          <CollapsibleCard
            id="academics-session-card"
            title="Current Session & Term"
            subtitle="Manage active term calendar and promotion cycles"
            icon={<Calendar className="w-4 h-4 text-indigo-600" />}
            badge={activeTerm}
            badgeVariant="indigo"
            defaultOpen={true}
            variant="default"
            padding="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Active Academic Session
                </label>
                <select
                  value={activeSession}
                  onChange={(e) => setActiveSession(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                >
                  <option value="2025/2026">2025/2026 Academic Session</option>
                  <option value="2026/2027">2026/2027 Academic Session</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Active Term Target
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {['First Term', 'Second Term', 'Third Term'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setActiveTerm(t)}
                      className={`py-2 rounded-xl border transition-colors cursor-pointer ${
                        activeTerm === t ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleCard>

          {/* Assessment Grading Weights */}
          <CollapsibleCard
            id="academics-weights-card"
            title="Continuous Assessment Weights"
            subtitle="Standard NERDC 40% CA + 60% Exam grading model"
            icon={<Percent className="w-4 h-4 text-purple-600" />}
            badge={`Total: ${totalWeight}%`}
            badgeVariant={totalWeight === 100 ? 'success' : 'danger'}
            defaultOpen={true}
            variant="default"
            padding="md"
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">CA 1 (Continuous Test 1):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={ca1Weight}
                    onChange={(e) => setCa1Weight(parseInt(e.target.value) || 0)}
                    className="w-14 text-center font-bold p-1 rounded-lg border border-slate-300"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">CA 2 (Continuous Test 2):</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={ca2Weight}
                    onChange={(e) => setCa2Weight(parseInt(e.target.value) || 0)}
                    className="w-14 text-center font-bold p-1 rounded-lg border border-slate-300"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Mid-Term Assessment / Project:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={midTermWeight}
                    onChange={(e) => setMidTermWeight(parseInt(e.target.value) || 0)}
                    className="w-14 text-center font-bold p-1 rounded-lg border border-slate-300"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Terminal Examination:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={examWeight}
                    onChange={(e) => setExamWeight(parseInt(e.target.value) || 0)}
                    className="w-14 text-center font-bold p-1 rounded-lg border border-slate-300"
                  />
                  <span className="font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>
          </CollapsibleCard>
        </div>

        {/* Right: NERDC Subject Catalog */}
        <div className="lg:col-span-7 space-y-4">
          <CollapsibleCard
            id="academics-subjects-card"
            title="Registered NERDC Curriculum Subjects"
            subtitle="Accredited subjects for Junior and Senior secondary schools"
            icon={<BookOpen className="w-4 h-4 text-indigo-600" />}
            badge={`${subjects.length} Active`}
            badgeVariant="indigo"
            defaultOpen={true}
            variant="default"
            padding="md"
          >
            <div className="divide-y divide-slate-100">
              {subjects.map((sub, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-indigo-900 font-bold font-mono flex items-center justify-center text-xs">
                      {sub.code}
                    </div>
                    <div>
                      <strong className="text-xs text-slate-900 block">{sub.name}</strong>
                      <span className="text-[11px] text-slate-500">{sub.category} · {sub.classes}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    Active Syllabus
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleCard>
        </div>
      </div>
    </div>
  );
};
