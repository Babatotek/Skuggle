import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Send,
  Printer,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Lightbulb,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiMutation, describeApiError } from '../../lib/apiClient';

export const AILessonPlanner: React.FC = () => {
  const { branding, showToast } = useApp();

  const [subject, setSubject] = useState('Mathematics');
  const [classLevel, setClassLevel] = useState('JSS 2');
  const [topic, setTopic] = useState('Linear Equations with Fractional Coefficients');
  const [duration, setDuration] = useState('40 Minutes');
  const [specialInstructions, setSpecialInstructions] = useState('Include everyday Nigerian market trade examples and practical group activities.');

  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(`# NERDC LESSON PLAN: LINEAR EQUATIONS WITH FRACTIONAL COEFFICIENTS

**Subject:** Mathematics  
**Class Level:** JSS 2 (Junior Secondary School)  
**Duration:** 40 Minutes  
**Curriculum Standard:** NERDC Nigerian National Curriculum  
**Topic:** Algebraic Processes: Solving Linear Equations involving Fractions  

---

### 1. Specific Behavioral Objectives
By the end of the 40-minute lesson, learners should be able to:
1. Identify the Lowest Common Multiple (LCM) of denominators in a fractional algebraic equation.
2. Clear fractions by multiplying every term on both sides of the equation by the LCM.
3. Solve linear equations of the form $\\frac{x+2}{3} = \\frac{2x-1}{4}$ accurately.
4. Apply the principle to practical scenarios (e.g., calculating shared market profits and transport fares).

---

### 2. Prerequisite / Previous Knowledge
Learners have mastered basic algebraic substitution, finding the LCM of whole numbers, and solving simple one-step linear equations (e.g., $3x + 5 = 20$).

---

### 3. Instructional Materials & Real-world Aids
- Chalkboard / Whiteboard and colored markers.
- Flashcards displaying sample fractional equations.
- Simulated Naira trade transaction cards demonstrating shared fractions of goods.

---

### 4. Step-by-Step Instructional Presentation

#### Step 1: Introduction & Mental Hook (5 Minutes)
- **Teacher Activity:** Present a real-life Nigerian market dilemma: *"If $\\frac{1}{3}$ of our yam harvest plus $\\frac{1}{4}$ of another bundle gives 7 tubers, how many total tubers were originally harvested?"*
- **Learner Activity:** Attempt mental estimations; identify the difficulty when fractions have different denominators.

#### Step 2: Clearing Fractions using LCM (12 Minutes)
- **Teacher Activity:** Guide students through the rule: *To clear fractions, find the LCM of denominators and multiply each term across the equation.*
- **Board Example 1:** Solve $\\frac{x}{2} + \\frac{x}{3} = 5$.
  - LCM of 2 and 3 = 6.
  - Multiply each term by 6: $6(\\frac{x}{2}) + 6(\\frac{x}{3}) = 6(5) \\implies 3x + 2x = 30 \\implies 5x = 30 \\implies x = 6$.
- **Learner Activity:** Write key rules in notebooks and verify the check step: $\\frac{6}{2} + \\frac{6}{3} = 3 + 2 = 5$.

#### Step 3: Equations with Binomial Numerators (13 Minutes)
- **Board Example 2:** Solve $\\frac{2x - 3}{4} = \\frac{x + 1}{3}$.
  - LCM of 4 and 3 = 12.
  - $12(\\frac{2x - 3}{4}) = 12(\\frac{x + 1}{3}) \\implies 3(2x - 3) = 4(x + 1) \\implies 6x - 9 = 4x + 4$.
  - Group like terms: $6x - 4x = 4 + 9 \\implies 2x = 13 \\implies x = 6.5$.
- **Learner Activity:** Pair up in 2-minute dyads to solve parallel flashcard problems.

#### Step 4: Diagnostic Evaluation & Class Activity (7 Minutes)
- **Exercise:** Solve $\\frac{3y - 1}{2} = \\frac{y + 5}{3}$.
- **Teacher Activity:** Walk the aisles, reviewing struggling students and reinforcing negative sign distribution rules.

#### Step 5: Summary, Conclusion & Homework (3 Minutes)
- **Summary:** Recapitulate that finding the LCM is the master key to removing fraction hurdles.
- **Assignment:** Page 74, Questions 1-6 from *New General Mathematics for Junior Secondary Schools (Book 2)*.`);

  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiMutation<{ success: true; data: { lessonPlan: Record<string, unknown> } }>('/ai/lesson-plan', 'POST', {
          subject,
          topic,
          className: classLevel,
          duration,
          curriculum: `${branding.schoolName} curriculum. ${specialInstructions}`,
      });
      if (response.data.lessonPlan) {
        setGeneratedPlan(JSON.stringify(response.data.lessonPlan, null, 2));
        showToast('Lesson Plan Generated', 'Ready for review and submission to the Principal.');
      } else {
        showToast('Generated offline draft', 'Structured template created based on NERDC standards.');
      }
    } catch (err) {
      showToast('Lesson plan generation failed', describeApiError(err), 'failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedPlan) return;
    navigator.clipboard.writeText(generatedPlan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied to Clipboard', 'Lesson plan markdown ready to paste or print.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              AI Pedagogical Lesson Planner
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate compliant NERDC Nigerian curriculum lesson notes with behavioral objectives, presentation steps, and class exercises.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Note</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (Left) */}
        <div className="lg:col-span-5 space-y-4 no-print">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="font-display font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Curriculum Parameters</span>
            </h3>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="English Language">English Language</option>
                  <option value="Basic Science">Basic Science</option>
                  <option value="Basic Technology">Basic Technology</option>
                  <option value="Civic Education">Civic Education</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Agricultural Science">Agricultural Science</option>
                  <option value="Business Studies">Business Studies</option>
                  <option value="Physics">Physics (Senior)</option>
                  <option value="Chemistry">Chemistry (Senior)</option>
                  <option value="Biology">Biology (Senior)</option>
                  <option value="Economics">Economics (Senior)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Class Level *
                  </label>
                  <select
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="Primary 4">Primary 4</option>
                    <option value="Primary 5">Primary 5</option>
                    <option value="Primary 6">Primary 6</option>
                    <option value="JSS 1">JSS 1</option>
                    <option value="JSS 2">JSS 2</option>
                    <option value="JSS 3">JSS 3</option>
                    <option value="SSS 1">SSS 1</option>
                    <option value="SSS 2">SSS 2</option>
                    <option value="SSS 3">SSS 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Period Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="40 Minutes">Single Period (40 mins)</option>
                    <option value="80 Minutes">Double Period (80 mins)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Lesson Topic / Concept *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis & Light Reactions"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pedagogical Focus & Local Context
                </label>
                <textarea
                  rows={3}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Include local examples, practical experiments, or mnemonic aids"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Structuring NERDC Lesson Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate Structured Lesson Plan</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Output Document Display (Right) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs text-slate-900 min-h-[500px]">
            {generatedPlan ? (
              <div className="prose prose-sm max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
                <div className="whitespace-pre-wrap font-sans text-slate-800">
                  {generatedPlan}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 text-slate-400">
                <BookOpen className="w-12 h-12 text-slate-200 mb-3" />
                <h4 className="font-display font-bold text-base text-slate-700">No Lesson Plan Selected</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Fill in the subject and topic on the left to generate an authentic curriculum lesson note.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
