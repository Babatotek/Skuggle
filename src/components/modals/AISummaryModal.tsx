import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Share2,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  Clock,
  GraduationCap,
  Download,
  BrainCircuit,
  Wand2,
  FileText,
  Tag,
  Flame,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ResourceItem, ResourceAISummary } from '../../types';
import {
  generateResourceAISummary,
  SummaryLevel,
  speakSummaryText,
  pauseSummarySpeech,
  resumeSummarySpeech,
  stopSummarySpeech,
  isSpeechSynthesisSupported
} from '../../lib/aiSummarizer';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceItem | null;
  onUpdateResource?: (updated: ResourceItem) => void;
}

export const AISummaryModal: React.FC<AISummaryModalProps> = ({
  isOpen,
  onClose,
  resource,
  onUpdateResource
}) => {
  if (!isOpen || !resource) return null;

  const [summary, setSummary] = useState<ResourceAISummary | null>(resource.aiSummary || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summaryLevel, setSummaryLevel] = useState<SummaryLevel>('standard');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isAudioPaused, setIsAudioPaused] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // When modal opens, if no summary exists or level changes, generate one
  useEffect(() => {
    if (isOpen && resource) {
      if (!resource.aiSummary) {
        handleGenerate(summaryLevel);
      } else {
        setSummary(resource.aiSummary);
      }
    }

    return () => {
      stopSummarySpeech();
      setIsPlayingAudio(false);
      setIsAudioPaused(false);
    };
  }, [isOpen, resource?.id]);

  const handleGenerate = async (level: SummaryLevel) => {
    if (!resource) return;
    setIsLoading(true);
    stopSummarySpeech();
    setIsPlayingAudio(false);
    setIsAudioPaused(false);

    try {
      const generated = await generateResourceAISummary(resource, level);
      setSummary(generated);

      const updatedResource: ResourceItem = {
        ...resource,
        aiSummary: generated,
      };

      if (onUpdateResource) {
        onUpdateResource(updatedResource);
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevelChange = (newLevel: SummaryLevel) => {
    setSummaryLevel(newLevel);
    handleGenerate(newLevel);
  };

  // Audio Playback
  const handleToggleAudio = () => {
    if (!summary) return;

    if (isPlayingAudio && !isAudioPaused) {
      pauseSummarySpeech();
      setIsAudioPaused(true);
    } else if (isPlayingAudio && isAudioPaused) {
      resumeSummarySpeech();
      setIsAudioPaused(false);
    } else {
      const fullSpeechText = `
        Resource Summary for ${resource.title}. 
        Subject: ${resource.subject}. 
        Overview: ${summary.briefSummary}. 
        Key Takeaways: ${summary.keyTakeaways.join('. ')}. 
        Study tip: ${summary.studentActionableTip}.
      `;

      setIsPlayingAudio(true);
      setIsAudioPaused(false);

      const started = speakSummaryText(
        fullSpeechText,
        playbackRate,
        () => {
          setIsPlayingAudio(false);
          setIsAudioPaused(false);
        },
        () => {
          setIsPlayingAudio(false);
          setIsAudioPaused(false);
        }
      );

      if (!started) {
        setIsPlayingAudio(false);
      }
    }
  };

  const handleStopAudio = () => {
    stopSummarySpeech();
    setIsPlayingAudio(false);
    setIsAudioPaused(false);
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const textToCopy = `📖 AI STUDENT PREVIEW: ${resource.title} (${resource.subject})\n\n` +
      `📌 SUMMARY:\n${summary.briefSummary}\n\n` +
      `🎯 KEY TAKEAWAYS:\n` + summary.keyTakeaways.map(k => `• ${k}`).join('\n') + `\n\n` +
      `💡 EXAM & MASTERY TIP:\n${summary.studentActionableTip}\n\n` +
      `Generated via Skuggle AI (Powered by Gemini 3.7 Flash)`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWithStudents = () => {
    if (!resource) return;
    const updated = {
      ...resource,
      isSharedWithStudents: true
    };
    if (onUpdateResource) {
      onUpdateResource(updated);
    }
    setShareToast('AI Summary & Resource shared to Student Portal!');
    setTimeout(() => setShareToast(null), 3000);
  };

  return (
    <div
      id="modal-ai-summary"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200 shadow-sm shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-500/40 text-purple-200 border border-purple-400/30 flex items-center gap-1">
                    <BrainCircuit className="w-3 h-3 text-purple-300" />
                    <span>Gemini 3.7 Flash</span>
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200">
                    {resource.subject}
                  </span>
                  {resource.folderCategory && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                      {resource.folderCategory}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug line-clamp-1">
                  {resource.title}
                </h3>
              </div>
            </div>

            <button
              id="btn-close-ai-summary"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Level Switcher & Audio Bar */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
            {/* Level Selector */}
            <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleLevelChange('standard')}
                disabled={isLoading}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  summaryLevel === 'standard'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('simplified')}
                disabled={isLoading}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  summaryLevel === 'simplified'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Simplified
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('exam_prep')}
                disabled={isLoading}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  summaryLevel === 'exam_prep'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-300" />
                <span>WAEC / Exam Focus</span>
              </button>
            </div>

            {/* Audio Text-To-Speech Player */}
            {isSpeechSynthesisSupported() && summary && !isLoading && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-purple-200 transition-colors cursor-pointer"
                >
                  {isPlayingAudio && !isAudioPaused ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-300" />
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{isAudioPaused ? 'Resume' : 'Listen'}</span>
                    </>
                  )}
                </button>

                {isPlayingAudio && (
                  <>
                    <div className="flex items-center gap-0.5 px-1">
                      <span className="w-1 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-4 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>

                    <button
                      type="button"
                      onClick={handleStopAudio}
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Stop audio"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const r = parseFloat(e.target.value);
                    setPlaybackRate(r);
                    if (isPlayingAudio) {
                      handleStopAudio();
                    }
                  }}
                  className="bg-transparent text-[11px] font-bold text-purple-200 outline-none cursor-pointer"
                  title="Playback Speed"
                >
                  <option value="0.9" className="text-slate-900">0.9x</option>
                  <option value="1.0" className="text-slate-900">1.0x</option>
                  <option value="1.25" className="text-slate-900">1.25x</option>
                  <option value="1.5" className="text-slate-900">1.5x</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Share Toast Notification */}
        {shareToast && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{shareToast}</span>
            </div>
            <button onClick={() => setShareToast(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {isLoading ? (
            /* Loading Skeleton */
            <div className="space-y-4 py-8 text-center">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-inner animate-pulse">
                <Wand2 className="w-7 h-7 text-purple-600 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Generating AI Student Summary...</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Distilling core concepts, formulas, and high-yield exam takeaways for quick student preview.
                </p>
              </div>

              {/* Shimmer skeleton bars */}
              <div className="max-w-md mx-auto space-y-2.5 pt-4">
                <div className="h-4 bg-slate-100 rounded-md animate-pulse w-full" />
                <div className="h-4 bg-slate-100 rounded-md animate-pulse w-5/6 mx-auto" />
                <div className="h-4 bg-slate-100 rounded-md animate-pulse w-4/6 mx-auto" />
              </div>
            </div>
          ) : summary ? (
            /* Generated AI Summary Content */
            <div className="space-y-5">
              {/* Executive Brief Overview */}
              <div className="p-4.5 bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white rounded-2xl border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>Quick Student Preview</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{summary.estimatedReadTime || '2 min read'}</span>
                  </span>
                </div>
                <p className="text-slate-800 text-sm leading-relaxed font-normal">
                  {summary.briefSummary}
                </p>
              </div>

              {/* Key Takeaways */}
              {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>What You Will Master:</span>
                  </h4>
                  <div className="space-y-2">
                    {summary.keyTakeaways.map((takeaway, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-normal"
                      >
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="flex-1 font-medium">{takeaway}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Concepts & Terminology */}
              {summary.coreConcepts && summary.coreConcepts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Core Curriculum Concepts & Formulas:</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.coreConcepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100 text-xs font-bold"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Mastery & Exam Tip */}
              {summary.studentActionableTip && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 shadow-xs">
                    <Lightbulb className="w-4 h-4 text-amber-800" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Mastery & Exam Tip:
                    </h5>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      {summary.studentActionableTip}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata Footer info */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">Target:</span>
                  <span>{summary.readingLevel || resource.classLevels.join(', ')}</span>
                </div>
                {summary.targetExam && (
                  <div className="flex items-center gap-1 text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                    <GraduationCap className="w-3 h-3 text-purple-600" />
                    <span>{summary.targetExam}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              No summary generated yet. Click "Generate Summary" below to create one.
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGenerate(summaryLevel)}
              disabled={isLoading}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              disabled={!summary || isLoading}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWithStudents}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share with Students</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
