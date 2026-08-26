import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Upload,
  Plus,
  Search,
  Filter,
  FileText,
  FileSpreadsheet,
  Video,
  Link2,
  Download,
  Eye,
  Trash2,
  Pin,
  Share2,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  HardDrive,
  FolderPlus,
  ExternalLink,
  ChevronDown,
  X,
  FileQuestion,
  GraduationCap,
  Copy,
  QrCode,
  Tag,
  Grid,
  List,
  AlertCircle,
  Camera,
  Scan,
  Check,
  Languages,
  Maximize2,
  BrainCircuit,
  Folder,
  Folders,
  FolderCheck,
  Wand2,
  Cpu,
  CheckCheck,
  RefreshCw,
  ArrowRight,
  FlaskConical,
  StickyNote,
  FileDown,
  HelpCircle
} from 'lucide-react';
import { ResourceItem, ResourceType, ResourceFolderCategory, MLClassificationResult, SmartQuiz } from '../../types';
import { SAMPLE_RESOURCES } from '../../data/mockData';
import { CameraDocumentScannerModal } from '../modals/CameraDocumentScannerModal';
import { BatchAutoTagModal } from '../modals/BatchAutoTagModal';
import { SmartQuizGeneratorModal } from '../modals/SmartQuizGeneratorModal';
import { BatchExportModal } from '../modals/BatchExportModal';
import { DocumentAnnotationModal } from '../modals/DocumentAnnotationModal';
import { searchOcrContent } from '../../lib/ocrEngine';
import { SYSTEM_FOLDERS, classifyDocumentContent, autoCategorizeWithAI } from '../../lib/mlAutoClassifier';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  libraryService,
  mapLibrarySummaryToResourceItem,
} from '@/features/library/libraryService';
import { getApiError } from '@/shared/api/client';
import { ActionSpinner } from '@/shared/ui';

interface ResourceLibraryViewProps {
  onOpenModal?: (modalName: string, data?: any) => void;
  onNavigateTab?: (tab: string) => void;
}

export const ResourceLibraryView: React.FC<ResourceLibraryViewProps> = ({
  onOpenModal,
}) => {
  const auth = useAuth();
  const canCreate = Boolean(
    auth.user?.permissions?.includes('library.create') ||
      auth.user?.role === 'school_admin' ||
      auth.user?.role === 'teacher' ||
      auth.user?.role === 'platform_super_admin',
  );

  // State
  const [resources, setResources] = useState<ResourceItem[]>(
    appConfig.liveApi ? [] : SAMPLE_RESOURCES,
  );
  const [loading, setLoading] = useState(appConfig.liveApi);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderCategory, setSelectedFolderCategory] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTerm, setSelectedTerm] = useState<string>('all');
  const [onlyOcrReady, setOnlyOcrReady] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'downloads' | 'title' | 'ocr' | 'mlConfidence'>('recent');

  // Modals / Drawers state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [showBatchAutoTagModal, setShowBatchAutoTagModal] = useState(false);
  const [showQuizGeneratorModal, setShowQuizGeneratorModal] = useState(false);
  const [quizSourceResource, setQuizSourceResource] = useState<ResourceItem | null>(null);
  const [showBatchExportModal, setShowBatchExportModal] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotatingResource, setAnnotatingResource] = useState<ResourceItem | null>(null);
  const [activeUploadTab, setActiveUploadTab] = useState<'file' | 'link' | 'ai'>('file');
  const [previewResource, setPreviewResource] = useState<ResourceItem | null>(null);
  const [showQrModal, setShowQrModal] = useState<ResourceItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [ocrModalSearch, setOcrModalSearch] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<'overview' | 'ocr' | 'ml'>('overview');

  // Form State for new upload
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState<ResourceFolderCategory>('Lecture Notes');
  const [newSubject, setNewSubject] = useState('Physics');
  const [newClassLevels, setNewClassLevels] = useState<string[]>(['SSS 2']);
  const [newTerm, setNewTerm] = useState('First Term');
  const [newResourceType, setNewResourceType] = useState<ResourceType>('document');
  const [newFormat, setNewFormat] = useState('PDF');
  const [newExternalUrl, setNewExternalUrl] = useState('');
  const [newTagsInput, setNewTagsInput] = useState('');
  const [newWeek, setNewWeek] = useState<number>(1);
  const [shareStudents, setShareStudents] = useState(true);
  const [shareParents, setShareParents] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const reloadLibrary = async (signal?: AbortSignal) => {
    if (!appConfig.liveApi) return;
    setLoading(true);
    setLoadError(null);
    try {
      const page = await libraryService.list(
        { search: searchQuery.trim() || undefined },
        signal,
      );
      setResources(page.resources.map(mapLibrarySummaryToResourceItem));
    } catch (error) {
      setResources([]);
      setLoadError(getApiError(error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!appConfig.liveApi) return;
    const controller = new AbortController();
    void reloadLibrary(controller.signal);
    return () => controller.abort();
    // Initial + auth change reload; search is applied client-side for snappy UX.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.id, auth.user?.tenant?.id]);

  // Real-time live ML suggestion for upload form
  const liveMlSuggestion = useMemo(() => {
    if (!newTitle.trim() && !newDescription.trim() && !uploadedFileName) return null;
    const result = classifyDocumentContent({
      title: newTitle || uploadedFileName.replace(/\.[^/.]+$/, ''),
      description: newDescription,
      subject: newSubject,
      fileFormat: newFormat
    });
    return {
      ...result,
      primaryCategory: result.predictedCategory,
      secondaryCategories: result.secondaryPredictions,
    };
  }, [newTitle, newDescription, uploadedFileName, newSubject, newFormat]);

  // AI Generator state in modal
  const [aiTopic, setAiTopic] = useState('');
  const [aiSubject, setAiSubject] = useState('Physics');
  const [aiClass, setAiClass] = useState('SSS 2');
  const [aiResourceType, setAiResourceType] = useState<'summary' | 'worksheet' | 'formula_sheet'>('summary');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Available filters
  const subjectsList = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English Language',
    'Computer Science',
    'Economics',
    'Basic Science'
  ];

  const classLevelsList = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

  // Calculate folder counts across all resources
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Syllabus': 0,
      'Assignments': 0,
      'Exams': 0,
      'Lecture Notes': 0,
      'Lab & Practicals': 0,
      'General': 0
    };
    resources.forEach((r) => {
      const cat = r.folderCategory || 'General';
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts['General']++;
      }
    });
    return counts;
  }, [resources]);

  // Map each resource with its OCR search match info
  const processedResources = useMemo(() => {
    return resources.map((item) => {
      if (!searchQuery.trim()) {
        return { item, ocrMatch: null, isDirectMatch: true };
      }

      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchSubject = item.subject.toLowerCase().includes(q);
      const matchAuthor = item.author.toLowerCase().includes(q);
      const matchFolder = (item.folderCategory || '').toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));

      const ocrSearchResult = searchOcrContent(searchQuery, item.ocrText, item.ocrPages);

      const isDirectMatch = matchTitle || matchDesc || matchSubject || matchAuthor || matchFolder || matchTags;
      const isOcrMatch = ocrSearchResult.matches;

      return {
        item,
        ocrMatch: isOcrMatch ? ocrSearchResult : null,
        isDirectMatch: isDirectMatch || isOcrMatch
      };
    });
  }, [resources, searchQuery]);

  // Filtered and Sorted list
  const filteredResources = useMemo(() => {
    return processedResources
      .filter(({ item, isDirectMatch }) => {
        // Folder category filter
        if (selectedFolderCategory !== 'all') {
          const itemCat = item.folderCategory || 'General';
          if (itemCat !== selectedFolderCategory) {
            return false;
          }
        }
        if (onlyOcrReady && item.ocrStatus !== 'ready') {
          return false;
        }
        if (selectedSubject !== 'all' && item.subject !== selectedSubject) {
          return false;
        }
        if (
          selectedClass !== 'all' &&
          !item.classLevels.includes(selectedClass) &&
          !item.classLevels.includes('All Classes')
        ) {
          return false;
        }
        if (selectedType !== 'all' && item.resourceType !== selectedType) {
          return false;
        }
        if (selectedTerm !== 'all' && item.term !== selectedTerm && item.term !== 'All Terms') {
          return false;
        }
        if (searchQuery.trim() && !isDirectMatch) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // If searching with OCR, prioritize OCR snippet matches
        if (searchQuery.trim()) {
          if (a.ocrMatch && !b.ocrMatch) return -1;
          if (!a.ocrMatch && b.ocrMatch) return 1;
        }

        if (a.item.isPinned && !b.item.isPinned) return -1;
        if (!a.item.isPinned && b.item.isPinned) return 1;

        if (sortBy === 'recent') {
          return new Date(b.item.uploadedAt).getTime() - new Date(a.item.uploadedAt).getTime();
        }
        if (sortBy === 'downloads') {
          return b.item.downloadCount - a.item.downloadCount;
        }
        if (sortBy === 'title') {
          return a.item.title.localeCompare(b.item.title);
        }
        if (sortBy === 'ocr') {
          return (b.item.ocrConfidence || 0) - (a.item.ocrConfidence || 0);
        }
        if (sortBy === 'mlConfidence') {
          return (b.item.mlClassification?.confidence || 0) - (a.item.mlClassification?.confidence || 0);
        }
        return 0;
      });
  }, [processedResources, selectedFolderCategory, selectedSubject, selectedClass, selectedType, selectedTerm, onlyOcrReady, searchQuery, sortBy]);

  // Metric stats
  const stats = useMemo(() => {
    const total = resources.length;
    const studentShared = resources.filter((r) => r.isSharedWithStudents).length;
    const ocrReadyCount = resources.filter((r) => r.ocrStatus === 'ready').length;
    const totalDownloads = resources.reduce((sum, r) => sum + r.downloadCount, 0);
    return { total, studentShared, ocrReadyCount, totalDownloads };
  }, [resources]);

  // Actions
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isPinned: !r.isPinned } : r))
    );
  };

  const handleToggleShare = (id: string, target: 'students' | 'parents', e: React.MouseEvent) => {
    e.stopPropagation();
    setResources((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          if (target === 'students') {
            return { ...r, isSharedWithStudents: !r.isSharedWithStudents };
          } else {
            return { ...r, isSharedWithParents: !r.isSharedWithParents };
          }
        }
        return r;
      })
    );
  };

  const handleDeleteResource = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Archive this resource from the school library?')) {
      return;
    }
    if (!appConfig.liveApi) {
      setResources((prev) => prev.filter((r) => r.id !== id));
      if (previewResource?.id === id) setPreviewResource(null);
      return;
    }
    try {
      await libraryService.archive(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
      if (previewResource?.id === id) setPreviewResource(null);
      feedbackBus.success('Resource archived.');
    } catch (error) {
      feedbackBus.error(getApiError(error).message);
    }
  };

  const handleSimulateDownload = async (resource: ResourceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!appConfig.liveApi) {
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id ? { ...r, downloadCount: r.downloadCount + 1 } : r,
        ),
      );
      feedbackBus.info(`Downloading "${resource.title.slice(0, 32)}..." (${resource.fileFormat})`);
      return;
    }
    try {
      await libraryService.download(
        resource.id,
        `${resource.title}.${resource.fileFormat.toLowerCase()}`,
      );
      setResources((prev) =>
        prev.map((r) =>
          r.id === resource.id ? { ...r, downloadCount: r.downloadCount + 1 } : r,
        ),
      );
      feedbackBus.success(`Download started for "${resource.title.slice(0, 40)}"`);
    } catch (error) {
      feedbackBus.error(getApiError(error).message);
    }
  };

  const handleCopyLink = (resource: ResourceItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const link =
      resource.externalLink ||
      `${window.location.origin}/app?tab=resources&resource=${resource.id}`;
    navigator.clipboard?.writeText(link);
    setCopiedId(resource.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyOcrTranscript = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedOcr(true);
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  // Apply Batch ML Classifications from BatchAutoTagModal
  const handleApplyBatchClassifications = (updatedResources: ResourceItem[]) => {
    setResources(updatedResources);
    feedbackBus.success(`ML Auto-Tag Complete: Successfully organized ${updatedResources.length} documents into intelligent curriculum folders!`);
  };

  // Toggle single item in batch export selection
  const handleToggleBatchSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBatchIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all or clear batch export selection
  const handleSelectAllBatch = () => {
    if (selectedBatchIds.length === filteredResources.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(filteredResources.map(({ item }) => item.id));
    }
  };

  // Launch Smart Quiz Generator for a given resource
  const handleOpenQuizGenerator = (resource: ResourceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQuizSourceResource(resource);
    setShowQuizGeneratorModal(true);
  };

  // Launch Sticky Note Annotations for a given resource
  const handleOpenAnnotations = (resource: ResourceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAnnotatingResource(resource);
    setShowAnnotationModal(true);
  };

  // Save generated quiz
  const handleSaveGeneratedQuiz = (quiz: SmartQuiz) => {
    feedbackBus.success(`Smart Quiz "${quiz.title}" saved & shared with class students!`);
  };

  // Re-classify a single document using local ML
  const handleReclassifySingle = (item: ResourceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const result = classifyDocumentContent({
      title: item.title,
      description: item.description,
      contentPreview: item.contentPreview,
      ocrText: item.ocrText,
      tags: item.tags,
      subject: item.subject,
      curriculumStandard: item.curriculumStandard,
      fileFormat: item.fileFormat
    });

    const newClassification: MLClassificationResult = {
      predictedCategory: result.predictedCategory,
      confidence: result.confidence,
      reasoning: result.reasoning,
      keyFeatures: result.keyFeatures,
      secondaryPredictions: [
        { category: 'Assignments', probability: 2.0 },
        { category: 'Lecture Notes', probability: 1.0 }
      ],
      suggestedTags: result.suggestedTags,
      difficulty: 'Intermediate',
      readingTimeMinutes: Math.max(3, Math.ceil((item.ocrText || item.description || '').split(/\s+/).length / 150)),
      classifiedAt: new Date().toISOString(),
      modelType: 'ML-Bayes-NLP'
    };

    const mergedTags = Array.from(new Set([...item.tags, ...result.suggestedTags])).slice(0, 7);

    const updated: ResourceItem = {
      ...item,
      folderCategory: result.predictedCategory,
      mlClassification: newClassification,
      tags: mergedTags
    };

    setResources((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
    if (previewResource?.id === item.id) {
      setPreviewResource(updated);
    }
    feedbackBus.success(`Auto-categorized "${item.title.slice(0, 24)}..." as 📁 ${result.predictedCategory} (${Math.round(result.confidence)}% ML confidence)`);
  };

  // Submit New Upload / Link — live API when enabled, local mock otherwise
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsUploading(true);

    if (appConfig.liveApi) {
      try {
        if (!canCreate) {
          throw new Error('You do not have permission to publish library resources.');
        }
        const sectionContent =
          activeUploadTab === 'link'
            ? `External reference: ${newExternalUrl.trim()}\n\n${newDescription.trim()}`
            : newDescription.trim();
        const formData = libraryService.buildCreateFormData({
          title: newTitle.trim(),
          description:
            newDescription.trim() ||
            'Uploaded reference teaching material and class handout.',
          author: auth.user?.name || 'School staff',
          resourceType: activeUploadTab === 'link' ? 'link' : newResourceType,
          subject: newSubject,
          className: newClassLevels[0] || 'All Classes',
          term: newTerm,
          topic: newTitle.trim(),
          accessTier: shareStudents ? 'school' : 'learn_plus',
          sourceLabel: 'School upload',
          licenceName: 'School licence',
          copyrightOwner: auth.user?.tenant?.name || 'School',
          status: 'published',
          schoolApproved: true,
          isPublic: shareParents,
          sectionContent,
          file: activeUploadTab === 'file' ? uploadedFile : null,
        });
        await libraryService.create(formData);
        await reloadLibrary();
        setShowUploadModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewExternalUrl('');
        setNewTagsInput('');
        setUploadedFileName('');
        setUploadedFile(null);
        feedbackBus.success('Resource published to the school library.');
      } catch (error) {
        feedbackBus.error(getApiError(error).message);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    setTimeout(() => {
      const tags = newTagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const mlResult = classifyDocumentContent({
        title: newTitle.trim(),
        description: newDescription.trim(),
        tags,
        subject: newSubject,
        fileFormat: activeUploadTab === 'link' ? 'URL' : newFormat
      });

      const effectiveCategory: ResourceFolderCategory = newFolderCategory || mlResult.predictedCategory;
      const combinedTags = Array.from(new Set([...tags, ...mlResult.suggestedTags])).slice(0, 6);

      const newRes: ResourceItem = {
        id: `res_${Date.now()}`,
        title: newTitle.trim(),
        description: newDescription.trim() || 'Uploaded reference teaching material and class handout.',
        subject: newSubject,
        classLevels: newClassLevels.length > 0 ? newClassLevels : ['All Classes'],
        term: newTerm,
        resourceType: activeUploadTab === 'link' ? 'link' : newResourceType,
        fileFormat: activeUploadTab === 'link' ? 'URL' : newFormat,
        fileSize: activeUploadTab === 'link' ? undefined : uploadedFile ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB` : undefined,
        externalLink: activeUploadTab === 'link' ? newExternalUrl : undefined,
        tags: combinedTags.length > 0 ? combinedTags : [newSubject, newTerm, 'Class Material'],
        author: auth.user?.name || 'Teacher',
        authorRole: auth.user?.roleLabel || 'Staff',
        uploadedAt: new Date().toISOString().split('T')[0],
        downloadCount: 0,
        viewCount: 1,
        isPinned: false,
        isSharedWithStudents: shareStudents,
        isSharedWithParents: shareParents,
        curriculumStandard: 'NERDC Aligned',
        weekNumber: newWeek,
        folderCategory: effectiveCategory,
        mlClassification: {
          predictedCategory: effectiveCategory,
          confidence: mlResult.confidence,
          reasoning: mlResult.reasoning,
          keyFeatures: mlResult.keyFeatures,
          secondaryPredictions: [
            { category: 'Lecture Notes', probability: 2.0 },
            { category: 'Assignments', probability: 1.0 }
          ],
          suggestedTags: mlResult.suggestedTags,
          difficulty: 'Intermediate',
          readingTimeMinutes: 5,
          classifiedAt: new Date().toISOString(),
          modelType: 'ML-Bayes-NLP'
        }
      };

      setResources((prev) => [newRes, ...prev]);
      setIsUploading(false);
      setShowUploadModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewExternalUrl('');
      setNewTagsInput('');
      setUploadedFileName('');
      setUploadedFile(null);
    }, 600);
  };

  // AI Material Generation — persists to API in live mode
  const handleGenerateAiMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;

    setIsAiGenerating(true);

    let title = '';
    let format = 'PDF';
    let rType: ResourceType = 'document';
    let content = '';
    let folderCat: ResourceFolderCategory = 'Lecture Notes';

    if (aiResourceType === 'summary') {
      title = `${aiClass} ${aiSubject}: Comprehensive ${aiTopic} Study Guide & Cheat Sheet`;
      rType = 'document';
      folderCat = 'Lecture Notes';
      content = `Key Concepts for ${aiTopic}:\n1. Core Definition & Theoretical Basis\n2. Key Formulas & Worked Example\n3. WAEC Exam Tips & Common Misconceptions\n4. Review Questions for Mastery`;
    } else if (aiResourceType === 'worksheet') {
      title = `${aiClass} ${aiSubject}: 20 Practice Questions on ${aiTopic} (with Answer Key)`;
      rType = 'worksheet';
      folderCat = 'Assignments';
      content = `Section A: 10 Multiple Choice Questions\nSection B: 5 Structured Theory Questions\nSection C: Practical/Real-World Application\nAnswer Explanations included.`;
    } else {
      title = `${aiClass} ${aiSubject}: ${aiTopic} Quick Reference & Formula Chart`;
      rType = 'document';
      folderCat = 'Lecture Notes';
      content = `Essential Symbols, Dimensional Analysis, Standard Constants, and Derivations for ${aiTopic}.`;
    }

    if (appConfig.liveApi) {
      try {
        const formData = libraryService.buildCreateFormData({
          title,
          description: `AI-assisted ${aiResourceType.replace('_', ' ')} for ${aiClass} ${aiSubject}.`,
          author: auth.user?.name || 'Skuggle AI',
          resourceType: rType,
          subject: aiSubject,
          className: aiClass,
          term: 'First Term',
          topic: aiTopic,
          accessTier: 'school',
          sourceLabel: 'AI-assisted draft',
          licenceName: 'School licence',
          status: 'published',
          schoolApproved: true,
          changeSummary: 'Created via Smart Library AI assist',
          learningObjectives: [aiTopic, folderCat, 'Curriculum guide'],
          sectionContent: content,
        });
        const created = await libraryService.create(formData);
        let enrichedContent = content;
        try {
          const summary = await libraryService.summary(created.id);
          enrichedContent = [
            summary.summary,
            '',
            'Key points:',
            ...(summary.keyPoints || []).map((point) => `• ${point}`),
            '',
            content,
          ].join('\n');
        } catch {
          // Summary enrichment is optional if AI quota is exhausted.
        }
        await reloadLibrary();
        const generatedRes: ResourceItem = {
          id: created.id,
          title,
          description: `AI-assisted ${aiResourceType.replace('_', ' ')} for ${aiClass} ${aiSubject}.`,
          subject: aiSubject,
          classLevels: [aiClass],
          term: 'First Term',
          resourceType: rType,
          fileFormat: format,
          tags: [aiTopic, 'AI Assisted', aiClass, folderCat],
          author: auth.user?.name || 'Skuggle AI',
          authorRole: 'AI Curriculum Assistant',
          uploadedAt: new Date().toISOString().split('T')[0],
          downloadCount: 0,
          viewCount: 1,
          isPinned: true,
          isSharedWithStudents: true,
          isSharedWithParents: false,
          curriculumStandard: 'NERDC Standard',
          contentPreview: enrichedContent.slice(0, 400),
          folderCategory: folderCat,
        };
        setShowUploadModal(false);
        setAiTopic('');
        setActivePreviewTab('overview');
        setPreviewResource(generatedRes);
        feedbackBus.success('AI-assisted material published to the school library.');
      } catch (error) {
        feedbackBus.error(getApiError(error).message);
      } finally {
        setIsAiGenerating(false);
      }
      return;
    }

    setTimeout(() => {
      const generatedRes: ResourceItem = {
        id: `res_ai_${Date.now()}`,
        title,
        description: `AI-generated ${aiResourceType.replace('_', ' ')} aligned with NERDC curriculum for ${aiClass} ${aiSubject}.`,
        subject: aiSubject,
        classLevels: [aiClass],
        term: 'First Term',
        resourceType: rType,
        fileFormat: format,
        fileSize: '1.8 MB',
        tags: [aiTopic, 'AI Generated', 'Study Aid', aiClass, folderCat],
        author: 'Skuggle AI Tutor Assistant',
        authorRole: 'AI Curriculum Generator',
        uploadedAt: new Date().toISOString().split('T')[0],
        downloadCount: 0,
        viewCount: 1,
        isPinned: true,
        isSharedWithStudents: true,
        isSharedWithParents: false,
        curriculumStandard: 'NERDC Standard',
        contentPreview: content,
        weekNumber: 3,
        folderCategory: folderCat,
      };

      setResources((prev) => [generatedRes, ...prev]);
      setIsAiGenerating(false);
      setShowUploadModal(false);
      setAiTopic('');
      setActivePreviewTab('overview');
      setPreviewResource(generatedRes);
    }, 1200);
  };

  const getFormatBadge = (format: string, type: ResourceType) => {
    switch (format.toUpperCase()) {
      case 'PDF':
        return <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200">PDF</span>;
      case 'PPTX':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">PPTX</span>;
      case 'DOCX':
        return <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">DOCX</span>;
      case 'URL':
        return <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200 flex items-center gap-1"><Link2 className="w-2.5 h-2.5" /> LINK</span>;
      case 'ZIP':
        return <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">ZIP</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">{format}</span>;
    }
  };

  const getFolderBadge = (folder?: ResourceFolderCategory, size: 'sm' | 'md' = 'sm') => {
    const f = folder || 'General';
    const py = size === 'sm' ? 'py-0.5 px-2 text-[10px]' : 'py-1 px-2.5 text-xs';
    switch (f) {
      case 'Syllabus':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200 ${py}`}>
            <Layers className="w-2.5 h-2.5 text-amber-600 shrink-0" />
            <span>Syllabus</span>
          </span>
        );
      case 'Assignments':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-purple-50 text-purple-800 font-bold border border-purple-200 ${py}`}>
            <FileQuestion className="w-2.5 h-2.5 text-purple-600 shrink-0" />
            <span>Assignments</span>
          </span>
        );
      case 'Exams':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-rose-50 text-rose-800 font-bold border border-rose-200 ${py}`}>
            <GraduationCap className="w-2.5 h-2.5 text-rose-600 shrink-0" />
            <span>Exams</span>
          </span>
        );
      case 'Lecture Notes':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-sky-50 text-sky-800 font-bold border border-sky-200 ${py}`}>
            <BookOpen className="w-2.5 h-2.5 text-sky-600 shrink-0" />
            <span>Lecture Notes</span>
          </span>
        );
      case 'Lab & Practicals':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 ${py}`}>
            <FlaskConical className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
            <span>Lab & Practicals</span>
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200 ${py}`}>
            <Folder className="w-2.5 h-2.5 text-slate-500 shrink-0" />
            <span>General</span>
          </span>
        );
    }
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'presentation':
        return <FileSpreadsheet className="w-4 h-4 text-amber-600" />;
      case 'worksheet':
        return <FileQuestion className="w-4 h-4 text-emerald-600" />;
      case 'past_question':
        return <GraduationCap className="w-4 h-4 text-purple-600" />;
      case 'scheme_of_work':
        return <Layers className="w-4 h-4 text-indigo-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-rose-600" />;
      case 'link':
        return <Link2 className="w-4 h-4 text-sky-600" />;
      case 'document':
      default:
        return <FileText className="w-4 h-4 text-indigo-600" />;
    }
  };

  // Helper to render OCR modal preview matches
  const previewOcrSearchResult = useMemo(() => {
    if (!previewResource || !ocrModalSearch.trim()) return null;
    return searchOcrContent(ocrModalSearch, previewResource.ocrText, previewResource.ocrPages);
  }, [previewResource, ocrModalSearch]);

  return (
    <div id="resource-library-container" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner & Action Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {appConfig.liveApi ? 'School Library' : 'Teacher Workspace'}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">
              {appConfig.liveApi
                ? 'Live catalogue synced from your school tenant'
                : 'Curriculum Materials & OCR Scanned Archives'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Smart Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Publish, search and share approved teaching materials with licence-aware downloads.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Smart Quiz Generator from Syllabus */}
          <button
            id="btn-smart-quiz-generator"
            onClick={() => {
              setQuizSourceResource(resources[0] || null);
              setShowQuizGeneratorModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-100 transition-all cursor-pointer"
            title="Generate curriculum-aligned multiple choice quizzes from syllabus documents"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Smart Quiz Generator</span>
          </button>

          {/* Batch Export Combined Student Handout */}
          <button
            id="btn-batch-export-handout"
            onClick={() => setShowBatchExportModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-200 transition-all cursor-pointer"
            title="Combine multiple study resources into a single structured student handout PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-indigo-300" />
            <span>Batch Export Handout</span>
            {selectedBatchIds.length > 0 && (
              <span className="bg-indigo-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                {selectedBatchIds.length}
              </span>
            )}
          </button>

          {/* ML Auto-Tag & Organize Button */}
          <button
            id="btn-batch-ml-autotag"
            onClick={() => setShowBatchAutoTagModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition-all cursor-pointer"
            title="Run Machine Learning Auto-Tagging across library to categorize documents into Syllabus, Assignments, Exams, and Notes"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>ML Auto-Tag & Organize</span>
            <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
              {resources.length}
            </span>
          </button>

          {/* Scan Physical Document with Camera */}
          <button
            id="btn-scan-camera-resource"
            onClick={() => setShowCameraScanner(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-200" />
            <span>Scan Physical Document (OCR)</span>
          </button>

          {/* Quick AI Lesson Material Generator */}
          {canCreate && (
          <button
            id="btn-ai-generate-resource"
            onClick={() => {
              setActiveUploadTab('ai');
              setShowUploadModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>
          )}

          {canCreate && (
            <>
          {/* Add Web Link / Reference */}
          <button
            id="btn-add-link-resource"
            onClick={() => {
              setActiveUploadTab('link');
              setShowUploadModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Reference Link</span>
          </button>

          {/* Upload Document / Presentation */}
          <button
            id="btn-upload-resource"
            onClick={() => {
              setActiveUploadTab('file');
              setShowUploadModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Material</span>
          </button>
            </>
          )}

          {appConfig.liveApi && (
            <button
              type="button"
              onClick={() => void reloadLibrary()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {appConfig.liveApi && loading && (
        <div className="flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-800">
          <ActionSpinner size="sm" />
          Syncing school library catalogue…
        </div>
      )}

      {appConfig.liveApi && loadError && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void reloadLibrary()}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {appConfig.liveApi && !loading && !loadError && resources.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
          <HardDrive className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-800">No published library resources yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Upload a PDF, DOCX or link to publish the first school-approved resource.
          </p>
        </div>
      )}

      {/* 4 Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Resources */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Teaching Materials</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{stats.total}</p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">Across 8 subject disciplines</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* OCR Scanned & Searchable */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">OCR Indexed Documents</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{stats.ocrReadyCount}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Full-text searchable PDFs</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Scan className="w-5 h-5" />
          </div>
        </div>

        {/* Student Downloads & Views */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Downloads & Accesses</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-0.5">{stats.totalDownloads}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Active student engagement</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
        </div>

        {/* Cloud Storage Usage */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">School Cloud Storage</p>
              <span className="text-[10px] font-bold text-slate-400">38%</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">3.8 <span className="text-sm font-semibold text-slate-500">/ 10 GB</span></p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full w-[38%]" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Filter & Search Hub */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
        
        {/* Row 0: ML Curriculum Folder Hierarchy Tabs */}
        <div className="border-b border-slate-100 pb-3.5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Folders className="w-4 h-4 text-indigo-600" />
              <span>Curriculum Document Folders (ML Auto-Categorized):</span>
            </div>
            <button
              id="btn-trigger-batch-from-folders"
              onClick={() => setShowBatchAutoTagModal(true)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />
              <span>Batch Auto-Tag All Files</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {/* All Folders */}
            <button
              onClick={() => setSelectedFolderCategory('all')}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedFolderCategory === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200/70'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <HardDrive className={`w-3.5 h-3.5 ${selectedFolderCategory === 'all' ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">All Folders</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 shrink-0 ${
                selectedFolderCategory === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {resources.length}
              </span>
            </button>

            {/* Syllabus */}
            <button
              onClick={() => setSelectedFolderCategory('Syllabus')}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedFolderCategory === 'Syllabus'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50/60 text-amber-900 hover:bg-amber-100/70 border-amber-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Layers className={`w-3.5 h-3.5 ${selectedFolderCategory === 'Syllabus' ? 'text-white' : 'text-amber-600'}`} />
                <span className="truncate">Syllabus</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 shrink-0 ${
                selectedFolderCategory === 'Syllabus' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {folderCounts['Syllabus'] || 0}
              </span>
            </button>

            {/* Assignments */}
            <button
              onClick={() => setSelectedFolderCategory('Assignments')}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedFolderCategory === 'Assignments'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-purple-50/60 text-purple-900 hover:bg-purple-100/70 border-purple-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <FileQuestion className={`w-3.5 h-3.5 ${selectedFolderCategory === 'Assignments' ? 'text-white' : 'text-purple-600'}`} />
                <span className="truncate">Assignments</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 shrink-0 ${
                selectedFolderCategory === 'Assignments' ? 'bg-purple-700 text-white' : 'bg-purple-200 text-purple-900'
              }`}>
                {folderCounts['Assignments'] || 0}
              </span>
            </button>

            {/* Exams */}
            <button
              onClick={() => setSelectedFolderCategory('Exams')}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedFolderCategory === 'Exams'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-rose-50/60 text-rose-900 hover:bg-rose-100/70 border-rose-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <GraduationCap className={`w-3.5 h-3.5 ${selectedFolderCategory === 'Exams' ? 'text-white' : 'text-rose-600'}`} />
                <span className="truncate">Exams</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 shrink-0 ${
                selectedFolderCategory === 'Exams' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-900'
              }`}>
                {folderCounts['Exams'] || 0}
              </span>
            </button>

            {/* Lecture Notes */}
            <button
              onClick={() => setSelectedFolderCategory('Lecture Notes')}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedFolderCategory === 'Lecture Notes'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                  : 'bg-sky-50/60 text-sky-900 hover:bg-sky-100/70 border-sky-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <BookOpen className={`w-3.5 h-3.5 ${selectedFolderCategory === 'Lecture Notes' ? 'text-white' : 'text-sky-600'}`} />
                <span className="truncate">Lecture Notes</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 shrink-0 ${
                selectedFolderCategory === 'Lecture Notes' ? 'bg-sky-700 text-white' : 'bg-sky-200 text-sky-900'
              }`}>
                {folderCounts['Lecture Notes'] || 0}
              </span>
            </button>

            {/* Lab & Practicals */}
            <button
              onClick={() => setSelectedFolderCategory('Lab & Practicals')}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedFolderCategory === 'Lab & Practicals'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100/70 border-emerald-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <FlaskConical className={`w-3.5 h-3.5 ${selectedFolderCategory === 'Lab & Practicals' ? 'text-white' : 'text-emerald-600'}`} />
                <span className="truncate">Lab & Practicals</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 shrink-0 ${
                selectedFolderCategory === 'Lab & Practicals' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {folderCounts['Lab & Practicals'] || 0}
              </span>
            </button>

            {/* General */}
            <button
              onClick={() => setSelectedFolderCategory('General')}
              className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedFolderCategory === 'General'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                  : 'bg-slate-100/70 text-slate-800 hover:bg-slate-200/70 border-slate-200/80'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Folder className={`w-3.5 h-3.5 ${selectedFolderCategory === 'General' ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">General</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 shrink-0 ${
                selectedFolderCategory === 'General' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {folderCounts['General'] || 0}
              </span>
            </button>
          </div>
        </div>
        
        {/* Row 1: Search bar, OCR toggle, view mode toggle, sort by */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar with OCR Full-Text Indicator */}
          <div className="relative w-full sm:max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-resources"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, topic, WAEC question, formulas, or scanned OCR text..."
              className="w-full pl-9 pr-24 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 font-medium"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                <Sparkles className="w-2.5 h-2.5" />
                OCR Indexed
              </span>
            </div>
          </div>

          {/* Secondary Controls: OCR Toggle, View mode and Sort */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* OCR Ready Only Quick Filter Pill */}
            <button
              id="btn-filter-ocr-ready"
              onClick={() => setOnlyOcrReady(!onlyOcrReady)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                onlyOcrReady
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
              title="Show only materials that have scanned text recognized by OCR"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>OCR Scanned ({stats.ocrReadyCount})</span>
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
              <span>Sort:</span>
              <select
                id="select-sort-resources"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="recent">Most Recent</option>
                <option value="downloads">Most Downloaded</option>
                <option value="title">Alphabetical (A-Z)</option>
                <option value="ocr">Highest OCR Accuracy</option>
              </select>
            </div>

            {/* Grid / Table Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
              <button
                id="btn-view-grid"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Card Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                id="btn-view-table"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dense List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Subject pills scrollable */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs border-t border-slate-100 pt-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Subject:</span>
          <button
            onClick={() => setSelectedSubject('all')}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 ${
              selectedSubject === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            All Subjects ({resources.length})
          </button>
          {subjectsList.map((subject) => {
            const count = resources.filter((r) => r.subject === subject).length;
            if (count === 0 && selectedSubject !== subject) return null;
            return (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className={`px-3 py-1 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedSubject === subject
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span>{subject}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedSubject === subject ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Class Level, Resource Type, Term Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
          {/* Class Level Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Classes</option>
              {classLevelsList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Resource Type Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Format/Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="document">Lesson Documents (PDF/DOCX)</option>
              <option value="presentation">Slide Presentations (PPTX)</option>
              <option value="worksheet">Worksheets & Practice</option>
              <option value="past_question">Past Questions (WAEC/JAMB)</option>
              <option value="scheme_of_work">Scheme of Work</option>
              <option value="link">Web Links & Virtual Labs</option>
              <option value="video">Video Lessons</option>
            </select>
          </div>

          {/* Term Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Term:</span>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Terms</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>

          {/* Reset Filters button if any active */}
          {(selectedSubject !== 'all' || selectedClass !== 'all' || selectedType !== 'all' || selectedTerm !== 'all' || onlyOcrReady || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSubject('all');
                setSelectedClass('all');
                setSelectedType('all');
                setSelectedTerm('all');
                setOnlyOcrReady(false);
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold ml-auto flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Resource Display: Grid vs Table */}
      {filteredResources.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No matching teaching resources</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No materials or OCR scanned transcripts matched "${searchQuery}". Try using different keywords, subject terms, or reset filters.`
              : 'No materials matched your filter criteria. Try adjusting the subject, class level, or format filter.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setSelectedSubject('all');
                setSelectedClass('all');
                setSelectedType('all');
                setSelectedTerm('all');
                setOnlyOcrReady(false);
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setShowCameraScanner(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan New Document</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredResources.map(({ item, ocrMatch }) => (
            <div
              key={item.id}
              id={`resource-card-${item.id}`}
              onClick={() => {
                setActivePreviewTab(ocrMatch ? 'ocr' : 'overview');
                setOcrModalSearch(searchQuery);
                setPreviewResource(item);
              }}
              className="bg-white rounded-2xl border border-slate-100 hover:border-indigo-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all p-4.5 flex flex-col justify-between cursor-pointer group relative"
            >
              {/* Card Header: Type icon, Format badge, OCR Ready badge, Pin button */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    {/* Batch Selection Checkbox */}
                    <button
                      onClick={(e) => handleToggleBatchSelect(item.id, e)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        selectedBatchIds.includes(item.id)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-slate-300 hover:border-indigo-400 text-transparent'
                      }`}
                      title={selectedBatchIds.includes(item.id) ? 'Deselect from batch export' : 'Select for batch export'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getTypeIcon(item.resourceType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-indigo-600">{item.subject}</span>
                        {item.weekNumber && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            • Wk {item.weekNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {item.classLevels.slice(0, 2).map((cl) => (
                          <span key={cl} className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                            {cl}
                          </span>
                        ))}
                        {item.classLevels.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-medium">+{item.classLevels.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* OCR Ready Badge */}
                    {item.ocrStatus === 'ready' && (
                      <span
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1"
                        title={`OCR Processed with ${item.ocrConfidence || 95}% confidence`}
                      >
                        <Scan className="w-2.5 h-2.5 text-emerald-600" />
                        <span>OCR Ready</span>
                      </span>
                    )}

                    {getFormatBadge(item.fileFormat, item.resourceType)}
                    
                    <button
                      onClick={(e) => handleTogglePin(item.id, e)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.isPinned
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50 opacity-0 group-hover:opacity-100'
                      }`}
                      title={item.isPinned ? 'Unpin resource' : 'Pin to top'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>

                {/* ML Folder Category Badge */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {getFolderBadge(item.folderCategory)}
                  {item.mlClassification && (
                    <span
                      className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[9px] border border-purple-200 flex items-center gap-1"
                      title={`ML Auto-Categorized: ${item.folderCategory} (${Math.round(item.mlClassification.confidence)}% confidence)`}
                    >
                      <BrainCircuit className="w-2.5 h-2.5 text-purple-600" />
                      <span>{Math.round(item.mlClassification.confidence)}% ML</span>
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* OCR Search Highlight Snippet Box */}
                {ocrMatch && ocrMatch.snippets.length > 0 && (
                  <div className="mt-2.5 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 animate-in fade-in">
                    <div className="flex items-center justify-between font-bold text-[10px] text-amber-800 mb-1">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Scanned Text Match (Page {ocrMatch.snippets[0].pageNumber})
                      </span>
                      <span className="text-[9px] bg-amber-200/60 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                        {ocrMatch.hitCount} match{ocrMatch.hitCount > 1 ? 'es' : ''}
                      </span>
                    </div>
                    <p className="italic text-slate-700 font-mono text-[10.5px] leading-snug">
                      "{ocrMatch.snippets[0].snippet}"
                    </p>
                  </div>
                )}

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-2.5">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium">+{item.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {/* Author & File Size */}
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={item.authorAvatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'}
                    alt={item.author}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                  <div className="truncate">
                    <p className="text-[11px] font-semibold text-slate-700 truncate">{item.author}</p>
                    <p className="text-[10px] text-slate-400">
                      {item.fileSize ? `${item.fileSize} • ` : ''}{item.downloadCount} dl
                    </p>
                  </div>
                </div>

                {/* Quick Action Icons */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Sticky Notes / Annotations */}
                  <button
                    onClick={(e) => handleOpenAnnotations(item, e)}
                    className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors relative"
                    title="Open collaborative sticky-note annotations"
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    {item.annotations && item.annotations.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-white rounded-full text-[8.5px] font-bold flex items-center justify-center">
                        {item.annotations.length}
                      </span>
                    )}
                  </button>

                  {/* Smart Quiz Generator button */}
                  <button
                    onClick={(e) => handleOpenQuizGenerator(item, e)}
                    className="p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Generate multiple-choice quiz from this syllabus document"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>

                  {/* ML Re-classify button */}
                  <button
                    onClick={(e) => handleReclassifySingle(item, e)}
                    className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Re-run ML Auto-Tagging & Folder Classification"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                  </button>

                  {/* Share Toggle Student */}
                  <button
                    onClick={(e) => handleToggleShare(item.id, 'students', e)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      item.isSharedWithStudents
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                    title={item.isSharedWithStudents ? 'Visible to Students in Portal' : 'Draft / Teacher Only'}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  {/* QR Code */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQrModal(item);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Generate QR code for smart board / classroom projector"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>

                  {/* Copy Link */}
                  <button
                    onClick={(e) => handleCopyLink(item, e)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors relative"
                    title="Copy resource link"
                  >
                    {copiedId === item.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Download / Open */}
                  {item.externalLink ? (
                    <a
                      href={item.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Open external reference"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <button
                      onClick={(e) => handleSimulateDownload(item, e)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Download material"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table / Dense List View */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-semibold text-[11px]">
                  <th className="py-3 px-4">Title & Subject</th>
                  <th className="py-3 px-3">Folder (ML)</th>
                  <th className="py-3 px-3">Class Levels</th>
                  <th className="py-3 px-3">Type & OCR</th>
                  <th className="py-3 px-3">Author</th>
                  <th className="py-3 px-3">Size/Format</th>
                  <th className="py-3 px-3">Student Access</th>
                  <th className="py-3 px-3">Downloads</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResources.map(({ item, ocrMatch }) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setActivePreviewTab(ocrMatch ? 'ocr' : 'overview');
                      setOcrModalSearch(searchQuery);
                      setPreviewResource(item);
                    }}
                    className="hover:bg-indigo-50/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                          {getTypeIcon(item.resourceType)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 hover:text-indigo-600 line-clamp-1">{item.title}</span>
                            {item.isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-slate-400">{item.subject} • {item.term}</p>
                          
                          {/* OCR Match in Table */}
                          {ocrMatch && ocrMatch.snippets.length > 0 && (
                            <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-flex items-center gap-1 max-w-md truncate">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              <span className="font-bold shrink-0">OCR Pg {ocrMatch.snippets[0].pageNumber}:</span>
                              <span className="truncate italic">"{ocrMatch.snippets[0].snippet}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        {getFolderBadge(item.folderCategory)}
                        {item.mlClassification && (
                          <span className="text-[9px] text-purple-700 font-semibold flex items-center gap-0.5">
                            <BrainCircuit className="w-2.5 h-2.5 text-purple-600" />
                            {Math.round(item.mlClassification.confidence)}% ML
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {item.classLevels.map((c) => (
                          <span key={c} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        <span className="capitalize text-slate-700 font-medium">
                          {item.resourceType.replace('_', ' ')}
                        </span>
                        {item.ocrStatus === 'ready' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 w-fit">
                            <Scan className="w-2.5 h-2.5" />
                            OCR Ready
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">{item.author}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {getFormatBadge(item.fileFormat, item.resourceType)}
                        {item.fileSize && <span className="text-[10px] text-slate-400">{item.fileSize}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.isSharedWithStudents
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.isSharedWithStudents ? 'Published' : 'Teacher Only'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.downloadCount}</td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleReclassifySingle(item, e)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Re-run ML Auto-Classifier"
                        >
                          <BrainCircuit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setActivePreviewTab(ocrMatch ? 'ocr' : 'overview');
                            setOcrModalSearch(searchQuery);
                            setPreviewResource(item);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Preview document & OCR transcript"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleSimulateDownload(item, e)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteResource(item.id, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: Upload & Add Material / Link / AI Generator Modal */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
            
            {/* Modal Header with Tabs */}
            <div className="px-6 pt-5 pb-3 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Add Teaching Material</h3>
                    <p className="text-[11px] text-slate-300">Upload documents, slide decks, reference URLs or generate with AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <button
                  onClick={() => setActiveUploadTab('file')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    activeUploadTab === 'file'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File / Slides</span>
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setShowCameraScanner(true);
                  }}
                  className="px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-white shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Scan Physical Notes (OCR)</span>
                </button>
                <button
                  onClick={() => setActiveUploadTab('link')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    activeUploadTab === 'link'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Reference Link</span>
                </button>
                <button
                  onClick={() => setActiveUploadTab('ai')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    activeUploadTab === 'ai'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>AI Handout Generator</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {activeUploadTab === 'ai' ? (
                /* AI Material Generation Form */
                <form onSubmit={(event) => void handleGenerateAiMaterial(event)} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-purple-900">Skuggle AI Curriculum Handout Generator</h4>
                      <p className="text-[11px] text-purple-700 mt-0.5 leading-relaxed">
                        Instantly synthesize comprehensive class study notes, practice worksheets, and formula cheat sheets grounded in WAEC and NERDC standards.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lesson Topic / Concept <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g. Total Internal Reflection & Optical Fibers, Quadratic Inequalities"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-800"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                      <select
                        value={aiSubject}
                        onChange={(e) => setAiSubject(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-800"
                      >
                        {subjectsList.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Class</label>
                      <select
                        value={aiClass}
                        onChange={(e) => setAiClass(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-800"
                      >
                        {classLevelsList.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Output Format Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiResourceType('summary')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          aiResourceType === 'summary'
                            ? 'border-purple-500 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <p className="font-bold">Study Guide</p>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">Notes & Explanations</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiResourceType('worksheet')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          aiResourceType === 'worksheet'
                            ? 'border-purple-500 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <p className="font-bold">Practice Sheet</p>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">20 Questions + Key</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiResourceType('formula_sheet')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          aiResourceType === 'formula_sheet'
                            ? 'border-purple-500 bg-purple-50/60 text-purple-900 ring-2 ring-purple-500/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <p className="font-bold">Formula Sheet</p>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">Quick Reference</p>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAiGenerating || !aiTopic.trim()}
                      className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isAiGenerating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Generating Material...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate & Save to Library</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* File Upload or Link Form */
                <form onSubmit={handleCreateResource} className="space-y-4">
                  
                  {activeUploadTab === 'file' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Select File (PDF, PPTX, DOCX, ZIP)
                      </label>
                      <div
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setUploadedFile(file);
                              setUploadedFileName(file.name);
                              if (!newTitle) {
                                setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
                              }
                              const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
                              setNewFormat(ext);
                            }
                          };
                          input.click();
                        }}
                        className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 rounded-2xl p-4.5 text-center cursor-pointer transition-colors"
                      >
                        <Upload className="w-6 h-6 text-indigo-600 mx-auto mb-1.5" />
                        {uploadedFileName ? (
                          <p className="text-xs font-bold text-slate-900">{uploadedFileName}</p>
                        ) : (
                          <>
                            <p className="text-xs font-bold text-slate-800">Click to browse or drag & drop</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF notes, PowerPoint slides, and Word docs up to 50MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Reference URL / Web Link <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          value={newExternalUrl}
                          onChange={(e) => setNewExternalUrl(e.target.value)}
                          placeholder="https://phet.colorado.edu/... or https://youtube.com/..."
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                          required={activeUploadTab === 'link'}
                        />
                      </div>
                    </div>
                  )}

                  {/* Title & Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Resource Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. SSS 2 Physics: Light Waves & Mirror Formula Lab Handout"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description / Instructions</label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={2}
                      placeholder="Summary of contents, chapters covered, and assignment guidelines..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 resize-none"
                    />
                  </div>

                  {/* Subject, Class Level, Term, Type */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Subject</label>
                      <select
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        {subjectsList.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Resource Type</label>
                      <select
                        value={newResourceType}
                        onChange={(e: any) => setNewResourceType(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="document">Lesson Document</option>
                        <option value="presentation">Slide Presentation</option>
                        <option value="worksheet">Worksheet</option>
                        <option value="past_question">Past Questions</option>
                        <option value="scheme_of_work">Scheme of Work</option>
                        <option value="video">Video</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Term</label>
                      <select
                        value={newTerm}
                        onChange={(e) => setNewTerm(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="First Term">First Term</option>
                        <option value="Second Term">Second Term</option>
                        <option value="Third Term">Third Term</option>
                        <option value="All Terms">All Terms</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Curriculum Week</label>
                      <input
                        type="number"
                        min={1}
                        max={14}
                        value={newWeek}
                        onChange={(e) => setNewWeek(parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Class Target Checkboxes */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Target Class Cohorts</label>
                    <div className="flex flex-wrap gap-1.5">
                      {classLevelsList.map((c) => {
                        const isSelected = newClassLevels.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setNewClassLevels(newClassLevels.filter((x) => x !== c));
                              } else {
                                setNewClassLevels([...newClassLevels, c]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Folder Category & Live ML Auto-Tag Suggestion */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">
                        Curriculum Folder Category
                      </label>
                      {liveMlSuggestion && (
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md font-semibold">
                          <BrainCircuit className="w-3 h-3 text-purple-600 shrink-0" />
                          <span>ML Suggests: <strong>{liveMlSuggestion.primaryCategory}</strong> ({Math.round(liveMlSuggestion.confidence)}%)</span>
                          <button
                            type="button"
                            onClick={() => {
                              setNewFolderCategory(liveMlSuggestion.primaryCategory);
                              if (liveMlSuggestion.suggestedTags.length > 0) {
                                const currentTags = newTagsInput ? newTagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
                                const combined = Array.from(new Set([...currentTags, ...liveMlSuggestion.suggestedTags]));
                                setNewTagsInput(combined.join(', '));
                              }
                            }}
                            className="ml-1 text-[10px] bg-purple-600 hover:bg-purple-700 text-white px-1.5 py-0.2 rounded font-bold transition-colors cursor-pointer"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {(['Syllabus', 'Assignments', 'Exams', 'Lecture Notes', 'Lab & Practicals', 'General'] as ResourceFolderCategory[]).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewFolderCategory(cat)}
                          className={`p-2 rounded-xl text-xs font-bold text-left transition-all border flex items-center justify-between cursor-pointer ${
                            newFolderCategory === cat
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100/80 border-slate-200'
                          }`}
                        >
                          <span className="truncate">{cat}</span>
                          {newFolderCategory === cat && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={newTagsInput}
                      onChange={(e) => setNewTagsInput(e.target.value)}
                      placeholder="e.g. WAEC 2026, Optics, Formulas, Practical"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  {/* Student & Parent Visibility */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="check-share-students"
                        checked={shareStudents}
                        onChange={(e) => setShareStudents(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="check-share-students" className="text-xs font-semibold text-slate-800 cursor-pointer">
                        Publish to Student Learning Hub
                      </label>
                    </div>
                    <span className="text-[10px] text-slate-400">Students can download & read</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading || !newTitle.trim()}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving to Library...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Add to Resource Library</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Resource Preview Drawer / Modal with OCR Inspector */}
      {/* ========================================================================= */}
      {previewResource && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
            
            {/* Header with Title and Tabs */}
            <div className="px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                    {getTypeIcon(previewResource.resourceType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400">{previewResource.subject}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-300">{previewResource.term}</span>
                      {previewResource.ocrStatus === 'ready' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                          <Scan className="w-2.5 h-2.5" />
                          OCR Searchable ({previewResource.ocrConfidence || 95}%)
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white truncate max-w-lg mt-0.5">{previewResource.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewResource(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tab Selector: Overview vs OCR Transcript vs ML Auto-Categorization */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs flex-wrap">
                <button
                  onClick={() => setActivePreviewTab('overview')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePreviewTab === 'overview'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Material Overview</span>
                </button>

                {previewResource.ocrText && (
                  <button
                    onClick={() => setActivePreviewTab('ocr')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activePreviewTab === 'ocr'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>OCR Scanned Transcript ({previewResource.ocrPages?.length || 1} Pages)</span>
                  </button>
                )}

                <button
                  onClick={() => setActivePreviewTab('ml')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activePreviewTab === 'ml'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-300" />
                  <span>ML Auto-Categorization</span>
                  {previewResource.mlClassification && (
                    <span className="text-[10px] bg-purple-500/40 text-purple-200 px-1.5 py-0.2 rounded font-mono">
                      {Math.round(previewResource.mlClassification.confidence)}%
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Content Preview Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {activePreviewTab === 'ocr' && previewResource.ocrText ? (
                /* OCR Transcript View */
                <div className="space-y-4">
                  {/* OCR Metadata Bar */}
                  <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Scan className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-950">OCR Full-Text Recognition</p>
                        <p className="text-[11px] text-emerald-700">
                          Optical confidence: <span className="font-bold">{previewResource.ocrConfidence || 95}%</span> • Language: English
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyOcrTranscript(previewResource.ocrText || '')}
                        className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        {copiedOcr ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Copy Transcript</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Search inside OCR transcript */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ocrModalSearch}
                      onChange={(e) => setOcrModalSearch(e.target.value)}
                      placeholder="Search text or formulas in this scanned document..."
                      className="w-full pl-9 pr-24 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                    />
                    {ocrModalSearch && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {previewOcrSearchResult?.hitCount || 0} hits
                        </span>
                        <button onClick={() => setOcrModalSearch('')} className="text-slate-400 hover:text-slate-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Highlight snippets if searching */}
                  {previewOcrSearchResult && previewOcrSearchResult.matches && (
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                      <p className="font-bold flex items-center gap-1 text-[11px] text-amber-800">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Search occurrences in this document:
                      </p>
                      {previewOcrSearchResult.snippets.map((snip, idx) => (
                        <div key={idx} className="bg-white/80 p-2 rounded-lg border border-amber-100 font-mono text-[11px]">
                          <span className="font-bold text-amber-700 mr-1.5">[Page {snip.pageNumber}]:</span>
                          <span>"{snip.snippet}"</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Scanned Pages Breakdown */}
                  {previewResource.ocrPages && previewResource.ocrPages.length > 0 ? (
                    <div className="space-y-3">
                      {previewResource.ocrPages.map((page) => (
                        <div key={page.pageNumber} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              Page {page.pageNumber} Scanned Text
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-semibold">{page.wordCount} words</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                                {page.confidence}% Confidence
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed font-normal bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                              {page.text}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback to full OCR text string */
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white p-4">
                      <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed font-normal bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {previewResource.ocrText}
                      </pre>
                    </div>
                  )}
                </div>
              ) : activePreviewTab === 'ml' ? (
                /* ML Auto-Categorization & Intelligence Tab */
                <div className="space-y-4">
                  {/* ML Header Card */}
                  <div className="p-4.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50/60 rounded-2xl border border-purple-200/80">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                          <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-purple-950">
                              Folder: {previewResource.folderCategory || 'Lecture Notes'}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-200/70 text-purple-900 border border-purple-300">
                              {previewResource.mlClassification?.source === 'gemini_flash' ? 'Gemini 3.7 AI' : 'Bayesian ML'}
                            </span>
                          </div>
                          <p className="text-xs text-purple-800/80 mt-0.5">
                            {previewResource.mlClassification?.reasoning || 'Auto-categorized by curriculum term frequency and semantic N-gram analyzer.'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleReclassifySingle(previewResource, e)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Re-analyze</span>
                      </button>
                    </div>

                    {/* Confidence Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-purple-200/60">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-purple-900">Machine Learning Confidence Score</span>
                        <span className="font-bold text-purple-950 font-mono">
                          {Math.round(previewResource.mlClassification?.confidence || 88)}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-purple-200/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${previewResource.mlClassification?.confidence || 88}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Manual Folder Reassignment */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <h5 className="text-xs font-bold text-slate-800 mb-2">Change Folder Location:</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(['Syllabus', 'Assignments', 'Exams', 'Lecture Notes', 'Lab & Practicals', 'General'] as ResourceFolderCategory[]).map((folder) => {
                        const isCurrent = previewResource.folderCategory === folder;
                        return (
                          <button
                            key={folder}
                            onClick={() => {
                              const updated = {
                                ...previewResource,
                                folderCategory: folder,
                                mlClassification: previewResource.mlClassification ? {
                                  ...previewResource.mlClassification,
                                  primaryCategory: folder
                                } : undefined
                              };
                              setPreviewResource(updated);
                              setResources((prev) => prev.map((r) => r.id === updated.id ? updated : r));
                              feedbackBus.success(`Folder updated to ${folder}`);
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                              isCurrent
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <span className="truncate">{folder}</span>
                            {isCurrent && <Check className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Extracted N-gram Features & Keywords */}
                  {previewResource.mlClassification?.keyFeatures && previewResource.mlClassification.keyFeatures.length > 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2">
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-purple-600" />
                        <span>Key Linguistic Features & Keywords Detected:</span>
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {previewResource.mlClassification.keyFeatures.map((feat, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-mono text-[11px] font-semibold border border-purple-100"
                          >
                            "{feat}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Secondary Category Probability Distribution */}
                  {previewResource.mlClassification?.secondaryCategories && previewResource.mlClassification.secondaryCategories.length > 0 && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2.5">
                      <h5 className="text-xs font-bold text-slate-800">Secondary Category Probability Breakdown:</h5>
                      <div className="space-y-2">
                        {previewResource.mlClassification.secondaryCategories.map((sec) => (
                          <div key={sec.category} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700">{sec.category}</span>
                              <span className="font-mono text-slate-500">{Math.round(sec.confidence ?? sec.probability)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-400 rounded-full"
                                style={{ width: `${Math.max(5, sec.confidence ?? sec.probability)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Overview Tab View */
                <>
                  {/* Description */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 mb-1">Resource Overview</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{previewResource.description}</p>
                  </div>

                  {/* Document Outline Preview */}
                  {previewResource.contentPreview && (
                    <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Document Outline & Key Sections</span>
                      </div>
                      <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                        {previewResource.contentPreview}
                      </pre>
                    </div>
                  )}

                  {/* OCR Scanned Quick Preview banner if OCR text exists */}
                  {previewResource.ocrText && (
                    <div
                      onClick={() => setActivePreviewTab('ocr')}
                      className="p-3.5 bg-emerald-50/60 hover:bg-emerald-50 rounded-2xl border border-emerald-200 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Scan className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-emerald-950">Scanned Document OCR Transcript Available</p>
                          <p className="text-[11px] text-emerald-700">Click to inspect searchable pages, extracted formulas, and WAEC notes</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                        View OCR
                      </button>
                    </div>
                  )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Format</p>
                      <p className="font-bold text-slate-800 mt-0.5">{previewResource.fileFormat} {previewResource.fileSize ? `(${previewResource.fileSize})` : ''}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Folder Category</p>
                      <p className="font-bold text-indigo-600 mt-0.5">{previewResource.folderCategory || 'General'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Target Classes</p>
                      <p className="font-bold text-slate-800 mt-0.5">{previewResource.classLevels.join(', ')}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Author</p>
                      <p className="font-bold text-slate-800 mt-0.5 truncate">{previewResource.author}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-1.5">Topic Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {previewResource.tags.map((t) => (
                        <span key={t} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* Collaborative Sticky Notes button */}
                <button
                  onClick={() => {
                    setAnnotatingResource(previewResource);
                    setShowAnnotationModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 flex items-center gap-1.5 transition-colors"
                >
                  <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sticky Notes ({previewResource.annotations?.length || 0})</span>
                </button>

                {/* Smart Quiz Generator button */}
                <button
                  onClick={() => {
                    setQuizSourceResource(previewResource);
                    setShowQuizGeneratorModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-orange-300 bg-orange-50 hover:bg-orange-100 text-xs font-bold text-orange-900 flex items-center gap-1.5 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
                  <span>Generate Quiz</span>
                </button>

                <button
                  onClick={() => setShowQrModal(previewResource)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Classroom QR</span>
                </button>
                <button
                  onClick={(e) => handleCopyLink(previewResource, e)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewResource(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                {previewResource.externalLink ? (
                  <a
                    href={previewResource.externalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Reference URL</span>
                  </a>
                ) : (
                  <button
                    onClick={() => handleSimulateDownload(previewResource)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File ({previewResource.fileFormat})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Classroom Smart Board QR Code Generator */}
      {/* ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-indigo-600">Smart Classroom Projection</span>
              <button onClick={() => setShowQrModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Visual */}
            <div className="w-44 h-44 mx-auto bg-slate-900 text-white p-3 rounded-2xl flex flex-col items-center justify-center border-4 border-indigo-100 shadow-md mb-3">
              <div className="w-full h-full bg-white rounded-xl p-2 flex items-center justify-center">
                <QrCode className="w-32 h-32 text-slate-900" />
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-900">{showQrModal.title}</h4>
            <p className="text-xs text-slate-500 mt-1">
              Students can scan this code with their phones/tablets during class to instantly download this worksheet or slide deck.
            </p>

            <button
              onClick={() => setShowQrModal(null)}
              className="mt-5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Camera Physical Document Scanner Modal */}
      {/* ========================================================================= */}
      <CameraDocumentScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        defaultSubject={selectedSubject !== 'all' ? selectedSubject : 'Physics'}
        defaultClassLevel={selectedClass !== 'all' ? selectedClass : 'SSS 2'}
        onSaveToLibrary={(newResource) => {
          setResources((prev) => {
            const withoutDup = prev.filter((item) => item.id !== newResource.id);
            return [newResource, ...withoutDup];
          });
          if (appConfig.liveApi) {
            void reloadLibrary();
          }
          feedbackBus.success(`Scanned PDF saved to library: "${newResource.title.slice(0, 32)}..."`);
          setActivePreviewTab('ocr');
          setPreviewResource(newResource);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 5: Batch Machine Learning Auto-Tagging & Folder Organization Modal */}
      {/* ========================================================================= */}
      <BatchAutoTagModal
        isOpen={showBatchAutoTagModal}
        onClose={() => setShowBatchAutoTagModal(false)}
        resources={resources}
        onApplyClassifications={(updated) => {
          setResources(updated);
          if (appConfig.liveApi) {
            void reloadLibrary();
          }
          feedbackBus.success(`Successfully updated and organized ${updated.length} resources!`);
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 6: Smart Quiz Generator Modal (Syllabus to MCQ) */}
      {/* ========================================================================= */}
      <SmartQuizGeneratorModal
        isOpen={showQuizGeneratorModal}
        onClose={() => setShowQuizGeneratorModal(false)}
        initialResource={quizSourceResource}
        availableResources={resources}
        onSaveQuiz={handleSaveGeneratedQuiz}
      />

      {/* ========================================================================= */}
      {/* MODAL 7: Batch Handout Export Modal (Combined PDF) */}
      {/* ========================================================================= */}
      <BatchExportModal
        isOpen={showBatchExportModal}
        onClose={() => setShowBatchExportModal(false)}
        selectedResources={
          selectedBatchIds.length > 0
            ? resources.filter((r) => selectedBatchIds.includes(r.id))
            : resources.slice(0, 3)
        }
        allResources={resources}
        onUpdateSelected={(updated) => {
          setSelectedBatchIds(updated.map((u) => u.id));
        }}
      />

      {/* ========================================================================= */}
      {/* MODAL 8: Document Sticky Note Annotation Layer Modal */}
      {/* ========================================================================= */}
      <DocumentAnnotationModal
        isOpen={showAnnotationModal}
        onClose={() => setShowAnnotationModal(false)}
        resource={annotatingResource}
        onUpdateResource={(updated) => {
          setResources((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          if (previewResource?.id === updated.id) {
            setPreviewResource(updated);
          }
        }}
        currentUserRole="teacher"
        currentUserName="Mr. B. Adewale"
      />
    </div>
  );
};
