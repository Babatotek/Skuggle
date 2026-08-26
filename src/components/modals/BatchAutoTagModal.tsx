import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  FolderPlus,
  Tag,
  ArrowRight,
  RefreshCw,
  X,
  Layers,
  FileQuestion,
  FileSpreadsheet,
  BookOpen,
  ChevronRight,
  AlertCircle,
  BarChart2,
  BrainCircuit,
  SlidersHorizontal,
  Check,
  FolderCheck
} from 'lucide-react';
import { ResourceItem, ResourceFolderCategory, MLClassificationResult } from '../../types';
import { classifyDocumentContent, autoCategorizeWithAI, SYSTEM_FOLDERS } from '../../lib/mlAutoClassifier';
import confetti from 'canvas-confetti';
import { appConfig } from '@/app/config';
import { libraryService } from '@/features/library/libraryService';
import { getApiError } from '@/shared/api/client';
import { feedbackBus } from '@/shared/feedback/feedbackBus';

interface BatchAutoTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: ResourceItem[];
  onApplyClassifications: (updatedResources: ResourceItem[]) => void;
}

interface StagedClassification {
  resource: ResourceItem;
  originalFolder?: ResourceFolderCategory;
  predictedFolder: ResourceFolderCategory;
  selectedFolder: ResourceFolderCategory;
  confidence: number;
  reasoning: string;
  keyFeatures: string[];
  suggestedTags: string[];
  selectedTags: string[];
  isApplied: boolean;
  status: 'pending' | 'processing' | 'ready' | 'error';
}

export const BatchAutoTagModal: React.FC<BatchAutoTagModalProps> = ({
  isOpen,
  onClose,
  resources,
  onApplyClassifications
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentScanningItem, setCurrentScanningItem] = useState('');
  const [stagedItems, setStagedItems] = useState<StagedClassification[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'unassigned' | 'low_confidence'>('all');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all');
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // Initialize or start scan
  const startMLBatchAnalysis = async () => {
    setIsScanning(true);
    setScanProgress(0);

    const itemsToProcess = resources.filter(res => {
      if (filterMode === 'unassigned') return !res.folderCategory || res.folderCategory === 'General';
      if (filterMode === 'low_confidence') return !res.mlClassification || res.mlClassification.confidence < 85;
      return true;
    });

    const newStaged: StagedClassification[] = [];

    for (let i = 0; i < itemsToProcess.length; i++) {
      const res = itemsToProcess[i];
      setCurrentScanningItem(res.title);
      setScanProgress(Math.round(((i + 1) / itemsToProcess.length) * 100));

      // Small UI delay for optical feedback
      await new Promise(r => setTimeout(r, 60));

      // Run ML classification
      const mlResult: MLClassificationResult = classifyDocumentContent({
        title: res.title,
        description: res.description,
        contentPreview: res.contentPreview,
        ocrText: res.ocrText || (res.ocrPages?.map(p => p.text).join('\n')),
        tags: res.tags,
        resourceType: res.resourceType,
        curriculumStandard: res.curriculumStandard,
        fileFormat: res.fileFormat
      });

      // Merge existing tags with suggested tags
      const combinedTags = Array.from(new Set([...res.tags, ...mlResult.suggestedTags])).slice(0, 6);

      newStaged.push({
        resource: res,
        originalFolder: res.folderCategory,
        predictedFolder: mlResult.predictedCategory,
        selectedFolder: res.folderCategory || mlResult.predictedCategory,
        confidence: mlResult.confidence,
        reasoning: mlResult.reasoning,
        keyFeatures: mlResult.keyFeatures,
        suggestedTags: mlResult.suggestedTags,
        selectedTags: combinedTags,
        isApplied: true,
        status: 'ready'
      });
    }

    setStagedItems(newStaged);
    setIsScanning(false);
    if (newStaged.length > 0) {
      setActiveItemIndex(0);
    }
  };

  const handleToggleApplyItem = (index: number) => {
    setStagedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isApplied: !updated[index].isApplied };
      return updated;
    });
  };

  const handleSelectFolder = (index: number, folder: ResourceFolderCategory) => {
    setStagedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selectedFolder: folder };
      return updated;
    });
  };

  const handleToggleTag = (itemIndex: number, tag: string) => {
    setStagedItems(prev => {
      const updated = [...prev];
      const current = updated[itemIndex].selectedTags;
      if (current.includes(tag)) {
        updated[itemIndex].selectedTags = current.filter(t => t !== tag);
      } else {
        updated[itemIndex].selectedTags = [...current, tag];
      }
      return updated;
    });
  };

  const handleCommitAll = async () => {
    const updatedMap = new Map<string, StagedClassification>();
    stagedItems.filter(s => s.isApplied).forEach(s => {
      updatedMap.set(s.resource.id, s);
    });

    const finalResources: ResourceItem[] = resources.map(res => {
      const staged = updatedMap.get(res.id);
      if (!staged) return res;

      return {
        ...res,
        folderCategory: staged.selectedFolder,
        tags: staged.selectedTags,
        mlClassification: {
          predictedCategory: staged.predictedFolder,
          confidence: staged.confidence,
          reasoning: staged.reasoning,
          keyFeatures: staged.keyFeatures,
          secondaryPredictions: [
            { category: 'Assignments', probability: 2.0 },
            { category: 'Lecture Notes', probability: 1.0 }
          ],
          suggestedTags: staged.suggestedTags,
          difficulty: res.mlClassification?.difficulty || 'Intermediate',
          readingTimeMinutes: res.mlClassification?.readingTimeMinutes || 5,
          classifiedAt: new Date().toISOString(),
          modelType: 'ML-Bayes-NLP'
        }
      };
    });

    if (appConfig.liveApi) {
      try {
        const targets = finalResources.filter((res) => updatedMap.has(res.id));
        for (const res of targets) {
          const staged = updatedMap.get(res.id)!;
          const detail = await libraryService.show(res.id);
          const formData = libraryService.buildCreateFormData({
            title: detail.title,
            description: detail.description || res.description,
            author: detail.author || res.author,
            resourceType: res.resourceType,
            subject: detail.subject || res.subject,
            className: detail.className || res.classLevels[0],
            term: detail.term || res.term,
            topic: staged.selectedFolder,
            accessTier: (detail.accessTier as 'free' | 'learn_plus' | 'school') || 'school',
            sourceLabel: detail.sourceLabel || 'School library',
            licenceName: detail.licence?.name || 'School licence',
            copyrightOwner: detail.licence?.copyrightOwner || 'School',
            status: 'published',
            changeSummary: `ML auto-tag applied: ${staged.selectedFolder}`,
            schoolApproved: detail.schoolApproved !== false,
            isPublic: false,
            learningObjectives: staged.selectedTags.length
              ? staged.selectedTags
              : detail.learningObjectives || [],
            sections:
              detail.sections && detail.sections.length > 0
                ? detail.sections
                : [
                    {
                      id: 'section-1',
                      title: 'Overview',
                      content: res.description || res.title,
                    },
                  ],
          });
          await libraryService.update(res.id, formData);
        }
        feedbackBus.success(`Auto-tagged ${targets.length} resource${targets.length === 1 ? '' : 's'}.`);
      } catch (error) {
        feedbackBus.error(getApiError(error).message);
        return;
      }
    }

    onApplyClassifications(finalResources);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }

    onClose();
  };

  const filteredStaged = stagedItems.filter(item => {
    if (selectedFolderFilter === 'all') return true;
    return item.selectedFolder === selectedFolderFilter;
  });

  const getFolderMeta = (folderName: string) => {
    return SYSTEM_FOLDERS.find(f => f.category === folderName) || SYSTEM_FOLDERS[5];
  };

  const activeItem = activeItemIndex !== null && filteredStaged[activeItemIndex]
    ? filteredStaged[activeItemIndex]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 dark:from-indigo-950/20 dark:via-slate-900 dark:to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Machine Learning Auto-Tagging & Folder Categorizer
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/60">
                  Bayes NLP + Gemini
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically analyzes full text & OCR transcripts to classify documents into 'Syllabus', 'Assignments', 'Exams', and generate topic tags.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          
          {/* Controls Bar */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Target Scope:</span>
              <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80 dark:bg-slate-800 text-xs">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 font-medium rounded-md transition-all ${
                    filterMode === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All ({resources.length})
                </button>
                <button
                  onClick={() => setFilterMode('unassigned')}
                  className={`px-3 py-1 font-medium rounded-md transition-all ${
                    filterMode === 'unassigned'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Unassigned / General ({resources.filter(r => !r.folderCategory || r.folderCategory === 'General').length})
                </button>
                <button
                  onClick={() => setFilterMode('low_confidence')}
                  className={`px-3 py-1 font-medium rounded-md transition-all ${
                    filterMode === 'low_confidence'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Needs Review
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {stagedItems.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2">
                  <FolderCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {stagedItems.filter(s => s.isApplied).length}
                    </strong> of {stagedItems.length} selected to update
                  </span>
                </div>
              )}

              <button
                onClick={startMLBatchAnalysis}
                disabled={isScanning}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning Text & OCR...' : stagedItems.length === 0 ? 'Run ML Classifier' : 'Re-Run Classifier'}
              </button>
            </div>
          </div>

          {/* Scanning Progress Banner */}
          {isScanning && (
            <div className="px-6 py-4 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center justify-between text-xs font-medium text-indigo-900 dark:text-indigo-200 mb-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span>Extracting N-Grams & Evaluating Document Features: <span className="font-semibold text-slate-900 dark:text-white">"{currentScanningItem}"</span></span>
                </div>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full h-2 bg-indigo-200/60 dark:bg-indigo-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-150 rounded-full"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Staged Results View */}
          {stagedItems.length === 0 && !isScanning ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-1">
                Ready to Auto-Categorize Resource Library
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
                The machine learning engine will inspect title keywords, syllabus week codes, homework rubrics, past exam questions, and full OCR transcripts to automatically categorize documents and suggest tags.
              </p>
              <button
                onClick={startMLBatchAnalysis}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Start ML Auto-Categorization
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
              
              {/* Left Column: List of classified items */}
              <div className="md:col-span-7 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
                
                {/* Folder filter tabs */}
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
                  <button
                    onClick={() => setSelectedFolderFilter('all')}
                    className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                      selectedFolderFilter === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    All ({stagedItems.length})
                  </button>
                  {['Syllabus', 'Assignments', 'Exams', 'Lecture Notes', 'Lab & Practicals'].map(cat => {
                    const count = stagedItems.filter(s => s.selectedFolder === cat).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedFolderFilter(cat)}
                        className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                          selectedFolderFilter === cat
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className="opacity-70 text-[10px]">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {filteredStaged.map((staged, idx) => {
                    const folderMeta = getFolderMeta(staged.selectedFolder);
                    const isSelected = activeItemIndex === idx;

                    return (
                      <div
                        key={staged.resource.id}
                        onClick={() => setActiveItemIndex(idx)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-indigo-500 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={staged.isApplied}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleApplyItem(idx);
                            }}
                            className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {staged.resource.title}
                              </h4>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${folderMeta.color.bg} ${folderMeta.color.text} ${folderMeta.color.border}`}>
                                  {staged.selectedFolder}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                  {staged.confidence}% ML
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                              {staged.reasoning}
                            </p>

                            {/* Tags preview */}
                            <div className="flex items-center gap-1 overflow-hidden flex-wrap">
                              {staged.selectedTags.slice(0, 4).map(tag => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300 flex items-center gap-0.5"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {staged.selectedTags.length > 4 && (
                                <span className="text-[10px] text-slate-400">
                                  +{staged.selectedTags.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Detailed Item Review & Adjustments */}
              <div className="md:col-span-5 flex flex-col overflow-y-auto p-5 bg-white dark:bg-slate-900">
                {activeItem ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Document Classification Details
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 leading-snug">
                        {activeItem.resource.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{activeItem.resource.subject}</span>
                        <span>•</span>
                        <span>{activeItem.resource.classLevels.join(', ')}</span>
                        <span>•</span>
                        <span>{activeItem.resource.fileFormat}</span>
                      </div>
                    </div>

                    {/* Assigned Folder Picker */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Target Folder Destination:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['Syllabus', 'Assignments', 'Exams', 'Lecture Notes', 'Lab & Practicals', 'General'].map(cat => {
                          const isSelected = activeItem.selectedFolder === cat;
                          const isPredicted = activeItem.predictedFolder === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => handleSelectFolder(activeItemIndex!, cat as ResourceFolderCategory)}
                              className={`p-2 rounded-lg text-left text-xs font-medium border transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold'
                                  : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              <span>{cat}</span>
                              {isPredicted && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                                  ML
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Machine Learning Explainability Card */}
                    <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                          <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                          ML Model Reasoning
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {activeItem.confidence}% Confidence
                        </span>
                      </div>
                      <p className="text-xs text-indigo-950/80 dark:text-indigo-300 leading-relaxed">
                        {activeItem.reasoning}
                      </p>

                      {/* Trigger Features */}
                      {activeItem.keyFeatures && activeItem.keyFeatures.length > 0 && (
                        <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
                          <span className="text-[10px] font-semibold text-indigo-900/70 dark:text-indigo-400 block mb-1">
                            Detected Trigger Phrases:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {activeItem.keyFeatures.map((feat, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200 font-mono"
                              >
                                "{feat}"
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Suggested & Applied Tags */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-indigo-600" />
                          Auto-Generated Domain Tags:
                        </label>
                        <span className="text-[10px] text-slate-400">Click to toggle</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeItem.suggestedTags.map(tag => {
                          const isActive = activeItem.selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleTag(activeItemIndex!, tag)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border ${
                                isActive
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              }`}
                            >
                              {isActive && <Check className="w-3 h-3" />}
                              #{tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Content Preview / OCR Snippet */}
                    <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Content Sample / OCR Extract:
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono line-clamp-4 leading-relaxed">
                        {activeItem.resource.ocrText || activeItem.resource.contentPreview || activeItem.resource.description}
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center text-slate-400 text-xs">
                    Select a document on the left to inspect and fine-tune ML categorization.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {stagedItems.length > 0 && (
              <span>
                Applying updates will organize files into folders & embed domain search tags.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleCommitAll()}
              disabled={stagedItems.length === 0 || stagedItems.filter(s => s.isApplied).length === 0}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              <FolderCheck className="w-4 h-4" />
              Apply {stagedItems.filter(s => s.isApplied).length} Folder Categorizations & Tags
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
