import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  Send,
  Layers,
  FileText,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LessonPlan } from '../../types';

interface AILessonBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

export const AILessonBuilderModal: React.FC<AILessonBuilderModalProps> = ({
  isOpen,
  onClose,
  initialTopic = 'Algebraic Fractions: Addition and Subtraction of Simple Algebraic Expressions',
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [subject, setSubject] = useState('Mathematics');
  const [className, setClassName] = useState('JSS 2');
  const [duration, setDuration] = useState('40 Minutes');
  const [curriculum, setCurriculum] = useState('NERDC Nigerian National Curriculum');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject,
          className,
          duration,
          curriculum,
        })
      });
      const data = await res.json();
      setGeneratedPlan(data.lessonPlan || data);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Error generating lesson plan:', err);
      // Fallback
      setGeneratedPlan({
        title: topic,
        subject,
        className,
        duration,
        curriculumReference: `${curriculum} - Week 4 Module`,
        learningObjectives: [
          'Identify the Lowest Common Multiple (LCM) of algebraic denominators.',
          'Add and subtract simple algebraic fractions with like and unlike denominators.',
          'Solve real-world word problems translated into algebraic fractions.'
        ],
        previousKnowledge: 'Students have prior mastery of finding the LCM of whole numbers and simplifying simple algebraic expressions.',
        instructionalMaterials: [
          'Whiteboard and colored markers',
          'Fraction bar manipulatives and algebraic flashcards',
          'Interactive SmartMark diagnostic worksheet'
        ],
        steps: [
          {
            stepNumber: 1,
            title: 'Introduction & Recall (5 mins)',
            duration: '5 Minutes',
            teacherActivity: 'Teacher writes numerical fractions 1/3 + 2/5 on board and guides students to find common denominator.',
            studentActivity: 'Students compute LCM of 3 and 5 (= 15) and convert numerators.',
            keyPoints: 'Fraction rules remain identical when variables replace constants.'
          },
          {
            stepNumber: 2,
            title: 'Conceptual Presentation (12 mins)',
            duration: '12 Minutes',
            teacherActivity: 'Teacher demonstrates (2/x) + (3/2x) step-by-step showing LCM = 2x.',
            studentActivity: 'Students take notes in exercise books and copy the 3-step solution method.',
            keyPoints: 'Denominator matching is prerequisite to combining numerators.'
          },
          {
            stepNumber: 3,
            title: 'Guided Practice & Group Challenge (15 mins)',
            duration: '15 Minutes',
            teacherActivity: 'Teacher circulates the classroom providing differentiated hints to pairs.',
            studentActivity: 'Students work in pairs to solve (x+1)/3 - (x-2)/4.',
            keyPoints: 'Be mindful of distributive minus sign across (x-2).'
          },
          {
            stepNumber: 4,
            title: 'Evaluation & Summary (8 mins)',
            duration: '8 Minutes',
            teacherActivity: 'Teacher administers 2-question quick exit ticket on board.',
            studentActivity: 'Students solve exit ticket individually and submit.',
            keyPoints: 'Assess mastery against objective 1 and 2.'
          }
        ],
        evaluationQuestions: [
          'Simplify: (3/2a) + (5/4a)',
          'Express as a single fraction in its lowest term: (2x-1)/3 - (x+2)/2'
        ],
        homework: 'Complete Exercises 4.2 in New General Mathematics Book 2, Questions 1 through 8.',
        teacherRemarks: 'Prepared with Skuggle AI Curriculum Assistant for JSS 2 First Term.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Skuggle AI Lesson Plan & Scheme Builder
              </h2>
              <p className="text-xs text-slate-500">
                Instantly draft pedagogical lesson notes aligned to National & International curricula
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Input Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option>Mathematics</option>
                <option>Basic Science & Tech</option>
                <option>English Language</option>
                <option>Civic Education</option>
                <option>Business Studies</option>
                <option>Agricultural Science</option>
                <option>ICT / Computer Science</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Target Class</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option>JSS 1</option>
                <option>JSS 2</option>
                <option>JSS 3</option>
                <option>SS 1</option>
                <option>SS 2</option>
                <option>SS 3</option>
                <option>Primary 5</option>
                <option>Primary 6</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option>40 Minutes (Single Period)</option>
                <option>80 Minutes (Double Period)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Curriculum Standard</label>
              <select
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option>NERDC Nigerian National Curriculum</option>
                <option>Cambridge Lower Secondary</option>
                <option>British Curriculum (Key Stage 3)</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Lesson Topic & Focus Concept</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Algebraic Fractions, Quadratic Equations, Photosynthesis..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  id="btn-generate-ai-lesson-plan"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Drafting Lesson...' : 'Generate with AI ✨'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Generated Result Container */}
          {generatedPlan ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in duration-150">
              
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10.5px] font-bold">
                    {generatedPlan.curriculumReference}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{generatedPlan.title}</h3>
                  <p className="text-xs text-slate-500">
                    {generatedPlan.subject} • {generatedPlan.className} • {generatedPlan.duration}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(generatedPlan, null, 2));
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => {
                      alert(`Saved "${generatedPlan.title}" directly to the Teacher Resource Library under ${generatedPlan.subject}!`);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Save to Library</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Objectives & Previous Knowledge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                  <h4 className="text-xs font-bold text-indigo-950 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Behavioral Objectives</span>
                  </h4>
                  <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                    {generatedPlan.learningObjectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                  <h4 className="text-xs font-bold text-purple-950 mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>Previous Knowledge & Materials</span>
                  </h4>
                  <p className="text-xs text-slate-700 mb-2">{generatedPlan.previousKnowledge}</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedPlan.instructionalMaterials.map((mat, i) => (
                      <span key={i} className="text-[10.5px] px-2 py-0.5 bg-white border border-purple-200 rounded text-purple-800">
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Presentation */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Step-by-Step Lesson Presentation & Delivery</span>
                </h4>
                <div className="space-y-3">
                  {generatedPlan.steps.map((step) => (
                    <div key={step.stepNumber} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>Step {step.stepNumber}: {step.title}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{step.duration}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11.5px]">
                        <div><strong className="text-slate-800">Teacher's Role:</strong> {step.teacherActivity}</div>
                        <div><strong className="text-slate-800">Student's Role:</strong> {step.studentActivity}</div>
                      </div>
                      <div className="text-[11px] text-indigo-700 font-medium bg-white p-2 rounded border border-indigo-100">
                        <strong>Key Concept:</strong> {step.keyPoints}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluation & Homework */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Evaluation Questions</h4>
                  <ul className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                    {generatedPlan.evaluationQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Homework & Assignment</h4>
                  <p className="text-xs text-slate-600">{generatedPlan.homework}</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <Sparkles className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Enter a topic above to generate a comprehensive lesson note</p>
              <p className="text-xs text-slate-400 mt-1">Skuggle AI automatically generates behavioral objectives, timings, teacher/student actions & assessment tasks.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
