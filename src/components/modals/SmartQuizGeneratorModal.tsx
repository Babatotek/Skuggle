import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  BookOpen,
  BrainCircuit,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  Download,
  Plus,
  Trash2,
  Edit3,
  Check,
  Layers,
  FileText,
  Share2,
  RefreshCw,
  Award,
  ListOrdered,
  Save
} from 'lucide-react';
import { ResourceItem, SmartQuiz, SmartQuizQuestion } from '../../types';
import jsPDF from 'jspdf';
import { appConfig } from '@/app/config';
import { libraryService } from '@/features/library/libraryService';
import { getApiError } from '@/shared/api/client';
import { feedbackBus } from '@/shared/feedback/feedbackBus';

interface SmartQuizGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialResource?: ResourceItem | null;
  availableResources?: ResourceItem[];
  onSaveQuiz?: (quiz: SmartQuiz) => void;
}

export const SmartQuizGeneratorModal: React.FC<SmartQuizGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialResource,
  availableResources = [],
  onSaveQuiz
}) => {
  if (!isOpen) return null;

  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(
    initialResource || (availableResources.length > 0 ? availableResources[0] : null)
  );
  const [customSyllabusText, setCustomSyllabusText] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'Mixed' | 'Easy' | 'Medium' | 'Hard'>('Mixed');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<SmartQuiz | null>(null);
  const [apiQuizId, setApiQuizId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'configure' | 'preview' | 'take'>('configure');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync when initialResource changes
  useEffect(() => {
    if (initialResource) {
      setSelectedResource(initialResource);
    }
  }, [initialResource]);

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setApiQuizId(null);

    if (appConfig.liveApi) {
      try {
        const sourceText =
          customSyllabusText.trim() ||
          selectedResource?.ocrText?.trim() ||
          selectedResource?.contentPreview?.trim() ||
          selectedResource?.description?.trim() ||
          '';
        if (!sourceText && !selectedResource) {
          throw new Error('Select a syllabus resource or paste syllabus text first.');
        }

        let detailSections = '';
        if (selectedResource && !customSyllabusText.trim()) {
          try {
            const detail = await libraryService.show(selectedResource.id);
            detailSections = (detail.sections || [])
              .map((section) => `${section.title}\n${section.content}`)
              .join('\n\n');
          } catch {
            // Fall back to local text fields.
          }
        }

        const syllabusBody =
          customSyllabusText.trim() ||
          detailSections ||
          [
            selectedResource?.title,
            selectedResource?.subject,
            selectedResource?.description,
            selectedResource?.ocrText,
            selectedResource?.contentPreview,
          ]
            .filter(Boolean)
            .join('\n\n');

        if (syllabusBody.trim().length < 40) {
          throw new Error(
            'Syllabus text is too short for generation. Paste more outcomes or open a richer resource.',
          );
        }

        const inspectForm = new FormData();
        inspectForm.append(
          'file',
          libraryService.textToSyllabusFile(
            syllabusBody,
            `${(selectedResource?.title || 'syllabus').slice(0, 40)}.txt`,
          ),
        );
        if (selectedResource?.subject) {
          inspectForm.append('subject', selectedResource.subject);
        }
        if (selectedResource?.classLevels?.[0]) {
          inspectForm.append('className', selectedResource.classLevels[0]);
        }

        const inspected = await libraryService.inspectSyllabus(inspectForm);
        const outcomeIds = inspected.outcomes.slice(0, 12).map((item) => item.id);
        if (outcomeIds.length === 0) {
          throw new Error('No learning outcomes could be detected from this syllabus.');
        }

        const generated = await libraryService.generateQuiz({
          uploadToken: inspected.uploadToken,
          outcomeIds,
          questionCount: Math.min(30, Math.max(5, questionCount)),
          difficulty: libraryService.mapApiDifficulty(difficulty),
        });
        setApiQuizId(generated.id);
        setGeneratedQuiz(libraryService.mapApiQuizToSmartQuiz(generated));
        setActiveTab('preview');
        setUserAnswers({});
        setShowResults(false);
        feedbackBus.success('Quiz draft generated for teacher review.');
      } catch (error) {
        feedbackBus.error(getApiError(error).message);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    const sourceTitle = selectedResource ? selectedResource.title : 'Custom Syllabus';
    const sourceSubject = selectedResource ? selectedResource.subject : 'General Science';
    const sourceClass = selectedResource ? selectedResource.classLevels[0] : 'SSS 2';

    // Simulate intelligent syllabus outcome extraction & question synthesis
    setTimeout(() => {
      let extractedOutcomes = [
        'Identify fundamental laws and operational definitions',
        'Apply mathematical relationships to solve quantitative problems',
        'Distinguish between real-world applications and theoretical concepts',
        'Demonstrate critical analysis of system dynamics'
      ];

      let generatedQuestions: SmartQuizQuestion[] = [];

      if (sourceSubject.toLowerCase().includes('physics')) {
        extractedOutcomes = [
          'Master Newton’s Laws of Motion & Momentum conservation',
          'Calculate centripetal force and projectile trajectories',
          'Analyze electrical circuit resistance and Ohm’s Law',
          'Understand wave mechanics and optical refraction indices'
        ];
        generatedQuestions = [
          {
            id: 'q-1',
            question: 'Which of the following describes the principle of conservation of linear momentum?',
            options: [
              'Total momentum remains constant if no external net force acts on the system',
              'Energy cannot be created or destroyed, only transformed',
              'Rate of change of momentum is inversely proportional to mass',
              'Momentum is equal to mass multiplied by acceleration'
            ],
            correctIndex: 0,
            explanation: 'In an isolated system without external net forces, the total initial momentum equals the total final momentum.',
            learningOutcome: 'Master Newton’s Laws of Motion & Momentum conservation',
            difficulty: 'Easy'
          },
          {
            id: 'q-2',
            question: 'A 2 kg projectile is fired with an initial velocity of 40 m/s at 30° to the horizontal. What is its vertical velocity component at peak height?',
            options: ['20 m/s', '0 m/s', '40 m/s', '34.6 m/s'],
            correctIndex: 1,
            explanation: 'At the maximum height of a projectile trajectory, the instantaneous vertical component of velocity (Vy) is always 0 m/s.',
            learningOutcome: 'Calculate centripetal force and projectile trajectories',
            difficulty: 'Medium'
          },
          {
            id: 'q-3',
            question: 'Three identical 6Ω resistors are connected in parallel. What is the equivalent resistance of the network?',
            options: ['18 Ω', '6 Ω', '2 Ω', '0.5 Ω'],
            correctIndex: 2,
            explanation: 'For n identical parallel resistors: Req = R / n = 6Ω / 3 = 2Ω.',
            learningOutcome: 'Analyze electrical circuit resistance and Ohm’s Law',
            difficulty: 'Medium'
          },
          {
            id: 'q-4',
            question: 'When light passes from a denser medium (glass, n=1.5) to a less dense medium (water, n=1.33), the refracted ray bends:',
            options: [
              'Towards the normal',
              'Away from the normal',
              'Continues straight with no deviation',
              'Reflects entirely at 0° incidence'
            ],
            correctIndex: 1,
            explanation: 'Light entering a medium of lower optical refractive index speeds up and bends away from the normal.',
            learningOutcome: 'Understand wave mechanics and optical refraction indices',
            difficulty: 'Hard'
          },
          {
            id: 'q-5',
            question: 'What is the SI unit of gravitational field strength?',
            options: ['N/kg (or m/s²)', 'Joule / kg', 'Pascal', 'Watt / meter'],
            correctIndex: 0,
            explanation: 'Gravitational field strength is force per unit mass (N/kg), equivalent to acceleration due to gravity (m/s²).',
            learningOutcome: 'Identify fundamental laws and operational definitions',
            difficulty: 'Easy'
          }
        ];
      } else if (sourceSubject.toLowerCase().includes('math')) {
        extractedOutcomes = [
          'Solve quadratic equations using factorization and quadratic formula',
          'Evaluate simultaneous linear and non-linear systems',
          'Compute trigonometric ratios in right-angled and non-right triangles',
          'Calculate probability of mutually exclusive and independent events'
        ];
        generatedQuestions = [
          {
            id: 'q-1',
            question: 'Find the roots of the quadratic equation: x² - 5x + 6 = 0.',
            options: ['x = 2 or x = 3', 'x = -2 or x = -3', 'x = 1 or x = 6', 'x = -1 or x = -6'],
            correctIndex: 0,
            explanation: 'Factorizing: (x - 2)(x - 3) = 0, giving roots x = 2 and x = 3.',
            learningOutcome: 'Solve quadratic equations using factorization',
            difficulty: 'Easy'
          },
          {
            id: 'q-2',
            question: 'If sin(θ) = 3/5 in a right-angled triangle, what is the value of cos(θ)?',
            options: ['4/5', '5/4', '3/4', '1/2'],
            correctIndex: 0,
            explanation: 'Using Pythagorean identity: cos²(θ) = 1 - sin²(θ) = 1 - 9/25 = 16/25 => cos(θ) = 4/5.',
            learningOutcome: 'Compute trigonometric ratios',
            difficulty: 'Medium'
          },
          {
            id: 'q-3',
            question: 'A bag contains 4 red and 6 blue marbles. If two marbles are drawn without replacement, what is the probability that both are red?',
            options: ['2/15', '4/25', '1/3', '2/5'],
            correctIndex: 0,
            explanation: 'P(Red 1) = 4/10 = 2/5. P(Red 2 | Red 1) = 3/9 = 1/3. Total P = (2/5) * (1/3) = 2/15.',
            learningOutcome: 'Calculate probability of independent events',
            difficulty: 'Hard'
          }
        ];
      } else {
        extractedOutcomes = [
          'Comprehend key terminology and foundational principles',
          'Analyze case study scenarios and deduce standard conclusions',
          'Synthesize experimental evidence to validate hypotheses'
        ];
        generatedQuestions = [
          {
            id: 'q-1',
            question: `Based on the key learning outcomes in "${sourceTitle}", which statement best captures the primary principle?`,
            options: [
              'System equilibrium is achieved when internal reactions match external drivers',
              'Variables are strictly invariant under all experimental constraints',
              'Energy loss in closed networks is consistently 100%',
              'Qualitative measurements supersede standardized metrics'
            ],
            correctIndex: 0,
            explanation: 'Standard foundational dynamics establish equilibrium as dynamic balance.',
            learningOutcome: 'Comprehend key terminology and foundational principles',
            difficulty: 'Easy'
          },
          {
            id: 'q-2',
            question: 'Which methodology is most effective for isolating confounding variables in this syllabus unit?',
            options: [
              'Controlled empirical testing with randomized replicates',
              'Uncalibrated historical observation without baseline',
              'Extrapolation from non-related theoretical paradigms',
              'Manual approximation without error margin accounting'
            ],
            correctIndex: 0,
            explanation: 'Controlled empirical testing isolates independent parameters rigorously.',
            learningOutcome: 'Synthesize experimental evidence to validate hypotheses',
            difficulty: 'Medium'
          }
        ];
      }

      // Adjust questions based on requested count
      const slicedQuestions = generatedQuestions.slice(0, questionCount);

      const newQuiz: SmartQuiz = {
        id: `quiz-${Date.now()}`,
        title: `Smart Quiz: ${sourceTitle}`,
        sourceDocumentId: selectedResource?.id,
        sourceDocumentTitle: sourceTitle,
        subject: sourceSubject,
        classLevel: sourceClass,
        learningOutcomes: extractedOutcomes,
        questions: slicedQuestions,
        totalPoints: slicedQuestions.length * 2,
        timeLimitMinutes: Math.max(10, slicedQuestions.length * 3),
        createdAt: new Date().toISOString()
      };

      setGeneratedQuiz(newQuiz);
      setIsGenerating(false);
      setActiveTab('preview');
      setUserAnswers({});
      setShowResults(false);
    }, 1200);
  };

  const handleExportPDF = () => {
    if (!generatedQuiz) return;
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SKUGGLE SMART QUIZ HANDOUT', 15, 14);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${generatedQuiz.subject} • ${generatedQuiz.classLevel} • ${generatedQuiz.timeLimitMinutes} Mins`, 15, 21);

      // Student info block
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.text(`Student Name: __________________________   Date: ____________   Score: _____ / ${generatedQuiz.totalPoints}`, 15, 35);
      doc.text(`Syllabus Source: ${generatedQuiz.sourceDocumentTitle}`, 15, 42);
      
      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 46, 195, 46);

      // Questions
      let y = 55;
      generatedQuiz.questions.forEach((q, idx) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`Q${idx + 1}. ${q.question}`, 15, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        q.options.forEach((opt, oIdx) => {
          const optLetter = String.fromCharCode(65 + oIdx);
          doc.text(`[   ] ${optLetter}. ${opt}`, 20, y);
          y += 5;
        });

        y += 4;
      });

      // Answer Key Page
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(79, 70, 229);
      doc.text('TEACHER ANSWER KEY & LEARNING OUTCOME MAPPING', 15, 20);

      doc.setDrawColor(200, 200, 200);
      doc.line(15, 25, 195, 25);

      y = 35;
      generatedQuiz.questions.forEach((q, idx) => {
        const correctLetter = String.fromCharCode(65 + q.correctIndex);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.text(`Q${idx + 1}: Option (${correctLetter}) - ${q.options[q.correctIndex]}`, 15, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`Outcome: ${q.learningOutcome}`, 20, y);
        y += 4;
        doc.text(`Rationale: ${q.explanation}`, 20, y);
        y += 7;
      });

      doc.save(`Skuggle_Quiz_${generatedQuiz.subject}_${Date.now()}.pdf`);
      setSaveSuccessToast('Quiz PDF handout with teacher answer key exported successfully!');
      setTimeout(() => setSaveSuccessToast(null), 3500);
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  const handleSaveToPlatform = async () => {
    if (!generatedQuiz) return;
    if (appConfig.liveApi) {
      if (!apiQuizId) {
        feedbackBus.error('Generate a live quiz draft before saving to assessments.');
        return;
      }
      setIsSaving(true);
      try {
        const saved = await libraryService.saveQuiz(apiQuizId, {
          title: generatedQuiz.title,
        });
        onSaveQuiz?.(generatedQuiz);
        setSaveSuccessToast(
          `Quiz saved as assessment draft (${saved.assessmentId}). Review before publishing.`,
        );
        setTimeout(() => setSaveSuccessToast(null), 3500);
      } catch (error) {
        feedbackBus.error(getApiError(error).message);
      } finally {
        setIsSaving(false);
      }
      return;
    }
    if (onSaveQuiz) {
      onSaveQuiz(generatedQuiz);
    }
    setSaveSuccessToast('Quiz saved to school assessment repository and shared with students!');
    setTimeout(() => {
      setSaveSuccessToast(null);
    }, 3500);
  };

  const calculateScore = () => {
    if (!generatedQuiz) return { correct: 0, total: 0, percent: 0 };
    let correct = 0;
    generatedQuiz.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });
    return {
      correct,
      total: generatedQuiz.questions.length,
      percent: Math.round((correct / generatedQuiz.questions.length) * 100)
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="modal-smart-quiz-generator"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Smart Quiz Generator</h2>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-100 text-indigo-700">
                  AI Learning Outcomes
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transform any uploaded syllabus document into curriculum-aligned multiple-choice assessments
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('configure')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'configure'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Source & Configuration
          </button>
          <button
            onClick={() => {
              if (generatedQuiz) setActiveTab('preview');
            }}
            disabled={!generatedQuiz}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'preview'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : generatedQuiz
                ? 'text-slate-500 hover:text-slate-800'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            2. Generated Quiz ({generatedQuiz?.questions.length || 0} Questions)
          </button>
          <button
            onClick={() => {
              if (generatedQuiz) setActiveTab('take');
            }}
            disabled={!generatedQuiz}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'take'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : generatedQuiz
                ? 'text-slate-500 hover:text-slate-800'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            3. Interactive Student Preview
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {saveSuccessToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {saveSuccessToast}
              </span>
              <button onClick={() => setSaveSuccessToast(null)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: CONFIGURE */}
          {activeTab === 'configure' && (
            <div className="space-y-5">
              {/* Document Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Source Syllabus / Curriculum Document
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                  {availableResources.map((res) => {
                    const isSelected = selectedResource?.id === res.id;
                    return (
                      <div
                        key={res.id}
                        onClick={() => setSelectedResource(res)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{res.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {res.subject} • {res.classLevels.join(', ')}
                          </p>
                          {res.folderCategory && (
                            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                              📁 {res.folderCategory}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Or manual text input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Or Paste Syllabus / Topic Outcomes Text Directly
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. SSS 2 Physics: Week 4 Projectile Motion, Trajectory Calculations, Range and Maximum Height Formulas..."
                  value={customSyllabusText}
                  onChange={(e) => setCustomSyllabusText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Quiz Generation Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Number of Questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={3}>3 Questions (Quick Check)</option>
                    <option value={5}>5 Questions (Standard Quiz)</option>
                    <option value={10}>10 Questions (Comprehensive Test)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Mixed">Mixed (Standard WAEC Distribution)</option>
                    <option value="Easy">Easy (Recall & Definition)</option>
                    <option value="Medium">Medium (Application & Problem Solving)</option>
                    <option value="Hard">Hard (Analysis & Synthesis)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Subject & Class
                  </label>
                  <div className="p-2 bg-slate-100 rounded-xl text-xs text-slate-700 font-semibold">
                    {selectedResource ? `${selectedResource.subject} (${selectedResource.classLevels[0]})` : 'General (SSS 2)'}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => void handleGenerateQuiz()}
                  disabled={isGenerating || (!selectedResource && !customSyllabusText.trim())}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Learning Outcomes & Questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Smart Multiple-Choice Quiz</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PREVIEW & EDIT */}
          {activeTab === 'preview' && generatedQuiz && (
            <div className="space-y-6">
              {/* Quiz Summary Header */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{generatedQuiz.title}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Source: <span className="font-semibold">{generatedQuiz.sourceDocumentTitle}</span> • {generatedQuiz.questions.length} Items • {generatedQuiz.totalPoints} Marks • {generatedQuiz.timeLimitMinutes} Mins
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export PDF Handout</span>
                  </button>

                  <button
                    onClick={() => void handleSaveToPlatform()}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Share Quiz</span>
                  </button>
                </div>
              </div>

              {/* Extracted Learning Outcomes */}
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl">
                <p className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  Identified Syllabus Learning Outcomes
                </p>
                <ul className="space-y-1.5 text-xs text-purple-800">
                  {generatedQuiz.learningOutcomes.map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-purple-200 text-purple-800 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Question List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Generated Questions ({generatedQuiz.questions.length})
                </h4>

                {generatedQuiz.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{q.question}</p>
                          <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            🎯 Outcome: {q.learningOutcome}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {q.difficulty}
                      </span>
                    </div>

                    {/* Options grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = oIdx === q.correctIndex;
                        const letter = String.fromCharCode(65 + oIdx);
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                : 'bg-slate-50 border-slate-100 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                {letter}
                              </span>
                              <span>{opt}</span>
                            </span>
                            {isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100">
                      <span className="font-bold text-slate-800">Pedagogical Rationale:</span> {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TAKE QUIZ INTERACTIVELY */}
          {activeTab === 'take' && generatedQuiz && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Student Interactive Testing Mode</h3>
                  <p className="text-xs text-slate-500">Test how students will experience this assessment on Skuggle</p>
                </div>

                {showResults && (
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-xl">
                    <span>Score: {calculateScore().correct} / {calculateScore().total} ({calculateScore().percent}%)</span>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {generatedQuiz.questions.map((q, idx) => {
                  const selected = userAnswers[q.id];
                  const isAnswered = selected !== undefined;
                  const isCorrect = selected === q.correctIndex;

                  return (
                    <div key={q.id} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-bold text-slate-900">{q.question}</p>
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isOptionSelected = selected === oIdx;
                          const letter = String.fromCharCode(65 + oIdx);

                          let borderStyle = 'border-slate-200 hover:border-indigo-300';
                          let bgStyle = 'bg-white';

                          if (isOptionSelected) {
                            borderStyle = 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600';
                          }

                          if (showResults) {
                            if (oIdx === q.correctIndex) {
                              borderStyle = 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900';
                            } else if (isOptionSelected && !isCorrect) {
                              borderStyle = 'border-rose-400 bg-rose-50 text-rose-800';
                            }
                          }

                          return (
                            <div
                              key={oIdx}
                              onClick={() => {
                                if (!showResults) {
                                  setUserAnswers((prev) => ({ ...prev, [q.id]: oIdx }));
                                }
                              }}
                              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${borderStyle} ${bgStyle}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                                  {letter}
                                </span>
                                <span>{opt}</span>
                              </div>

                              {showResults && oIdx === q.correctIndex && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {showResults && (
                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                          <p className="font-bold text-indigo-700">Explanation:</p>
                          <p className="text-[11.5px] mt-0.5 text-slate-600">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setUserAnswers({});
                    setShowResults(false);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Reset Answers
                </button>

                <button
                  onClick={() => setShowResults(!showResults)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  {showResults ? 'Hide Results' : 'Submit & Reveal Scores'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Powered by Skuggle AI & Nigerian National Curriculum Framework
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
