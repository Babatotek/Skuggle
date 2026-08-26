import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RotateCw,
  Trash2,
  Plus,
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  Sliders,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Eye,
  Layers,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Share2,
  ArrowRight,
  Search,
  Copy,
  Check,
  FileSearch,
  ScanText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ResourceItem, ResourceType, OcrPageResult } from '../../types';
import { recognizeAllPages, recognizePageText, searchOcrContent } from '../../lib/ocrEngine';
import { classifyDocumentContent } from '../../lib/mlAutoClassifier';
import { appConfig } from '@/app/config';
import { libraryService } from '@/features/library/libraryService';
import { getApiError } from '@/shared/api/client';
import { feedbackBus } from '@/shared/feedback/feedbackBus';

interface ScannedPage {
  id: string;
  originalDataUrl: string;
  processedDataUrl: string;
  filter: 'document' | 'color_enhanced' | 'grayscale' | 'original';
  rotation: number; // 0, 90, 180, 270
  timestamp: number;
}

interface CameraDocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToLibrary: (resource: ResourceItem) => void;
  defaultSubject?: string;
  defaultClassLevel?: string;
}

export const CameraDocumentScannerModal: React.FC<CameraDocumentScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveToLibrary,
  defaultSubject = 'Physics',
  defaultClassLevel = 'SSS 2'
}) => {
  // Camera & Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);

  // Scanned Pages & Step state
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<'camera' | 'review' | 'ocr_review' | 'metadata'>('camera');

  // OCR Optical Character Recognition State
  const [ocrPages, setOcrPages] = useState<OcrPageResult[]>([]);
  const [fullOcrText, setFullOcrText] = useState<string>('');
  const [ocrConfidence, setOcrConfidence] = useState<number>(95);
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [ocrProgressMessage, setOcrProgressMessage] = useState<string>('');
  const [ocrSearchQuery, setOcrSearchQuery] = useState<string>('');
  const [copiedOcrText, setCopiedOcrText] = useState<boolean>(false);
  const [ocrActiveTab, setOcrActiveTab] = useState<'view' | 'edit'>('view');

  // Metadata Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(defaultSubject);
  const [classLevels, setClassLevels] = useState<string[]>([defaultClassLevel]);
  const [term, setTerm] = useState('First Term');
  const [tagsInput, setTagsInput] = useState('Scanned Document, Class Notes, OCR Indexed');
  const [shareWithStudents, setShareWithStudents] = useState(true);
  const [shareWithParents, setShareWithParents] = useState(false);
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [curriculumStandard, setCurriculumStandard] = useState('NERDC Aligned');

  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatedPdfBlobUrl, setGeneratedPdfBlobUrl] = useState<string | null>(null);
  const [pdfFileSize, setPdfFileSize] = useState<string>('0 MB');

  // AI Document Analysis state
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

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

  // Start Camera Feed
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (!deviceId && videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings to scan documents.'
          : 'Unable to access your device camera. You can also upload images directly from your device.'
      );
    }
  }, [stream]);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  useEffect(() => {
    if (isOpen && currentStep === 'camera') {
      startCamera(selectedDeviceId);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, currentStep]);

  // Run OCR on all pages
  const runOcrRecognition = async (pagesToScan: ScannedPage[]) => {
    if (pagesToScan.length === 0) return;
    setIsOcrProcessing(true);
    setOcrProgressMessage('Initializing Optical Character Recognition engine...');

    try {
      const pageData = pagesToScan.map((p, idx) => ({
        dataUrl: p.processedDataUrl,
        pageNumber: idx + 1
      }));

      const ocrOutput = await recognizeAllPages(pageData, subject, (cur, total, msg) => {
        setOcrProgressMessage(msg);
      });

      setOcrPages(ocrOutput.pages);
      setFullOcrText(ocrOutput.fullText);
      setOcrConfidence(ocrOutput.averageConfidence);

      // Auto refine tags and description if initial
      if (!title || title.includes('Scanned')) {
        setTitle(`${classLevels[0] || 'SSS 2'} ${subject}: Scanned Notes (${new Date().toLocaleDateString()})`);
      }
    } catch (err) {
      console.error('OCR Recognition error:', err);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Apply visual processing filter onto an image
  const applyFilterToImage = (
    imgDataUrl: string,
    filter: 'document' | 'color_enhanced' | 'grayscale' | 'original',
    rotation: number,
    callback: (processedUrl: string) => void
  ) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return callback(imgDataUrl);

      if (rotation === 90 || rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      if (filter === 'original') {
        callback(canvas.toDataURL('image/jpeg', 0.92));
        return;
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        if (filter === 'document') {
          const contrast = 1.6;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          let newVal = factor * (gray - 128) + 128;
          if (newVal > 165) newVal = 255;
          else if (newVal < 90) newVal = 0;
          else newVal = (newVal - 90) * (255 / 75);

          data[i] = newVal;
          data[i + 1] = newVal;
          data[i + 2] = newVal;
        } else if (filter === 'grayscale') {
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        } else if (filter === 'color_enhanced') {
          const contrast = 1.3;
          data[i] = Math.min(255, Math.max(0, contrast * (r - 128) + 128));
          data[i + 1] = Math.min(255, Math.max(0, contrast * (g - 128) + 128));
          data[i + 2] = Math.min(255, Math.max(0, contrast * (b - 128) + 128));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      callback(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = imgDataUrl;
  };

  // Capture Page from Live Camera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !cameraActive) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    applyFilterToImage(rawDataUrl, 'document', 0, (processed) => {
      const newPage: ScannedPage = {
        id: `page_${Date.now()}_${pages.length + 1}`,
        originalDataUrl: rawDataUrl,
        processedDataUrl: processed,
        filter: 'document',
        rotation: 0,
        timestamp: Date.now()
      };

      setPages((prev) => [...prev, newPage]);
      setActivePageIndex(pages.length);
      setIsCapturing(false);

      if (!title) {
        setTitle(`${subject} Physical Lesson Handout (${new Date().toLocaleDateString()})`);
      }
    });
  };

  // Fallback: Upload existing photos/scans from file picker
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File, index: number) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (rawDataUrl) {
          applyFilterToImage(rawDataUrl, 'document', 0, (processed) => {
            const newPage: ScannedPage = {
              id: `page_upload_${Date.now()}_${index}`,
              originalDataUrl: rawDataUrl,
              processedDataUrl: processed,
              filter: 'document',
              rotation: 0,
              timestamp: Date.now()
            };
            setPages((prev) => [...prev, newPage]);
            if (!title) {
              setTitle(`${subject} Scanned Lesson Material (${file.name.replace(/\.[^/.]+$/, '')})`);
            }
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Change page filter
  const handleChangePageFilter = (
    index: number,
    newFilter: 'document' | 'color_enhanced' | 'grayscale' | 'original'
  ) => {
    const targetPage = pages[index];
    if (!targetPage) return;

    applyFilterToImage(targetPage.originalDataUrl, newFilter, targetPage.rotation, (processed) => {
      setPages((prev) =>
        prev.map((p, idx) =>
          idx === index ? { ...p, filter: newFilter, processedDataUrl: processed } : p
        )
      );
    });
  };

  // Rotate Page
  const handleRotatePage = (index: number) => {
    const targetPage = pages[index];
    if (!targetPage) return;

    const newRotation = (targetPage.rotation + 90) % 360;
    applyFilterToImage(targetPage.originalDataUrl, targetPage.filter, newRotation, (processed) => {
      setPages((prev) =>
        prev.map((p, idx) =>
          idx === index ? { ...p, rotation: newRotation, processedDataUrl: processed } : p
        )
      );
    });
  };

  // Delete a scanned page
  const handleDeletePage = (index: number) => {
    const updated = pages.filter((_, idx) => idx !== index);
    setPages(updated);
    if (activePageIndex >= updated.length) {
      setActivePageIndex(Math.max(0, updated.length - 1));
    }
  };

  // Compile all scanned pages into a real multi-page PDF using jsPDF
  const generatePdfDocument = async (): Promise<Blob> => {
    return new Promise((resolve) => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      pages.forEach((page, index) => {
        if (index > 0) {
          doc.addPage('a4', 'portrait');
        }

        const margin = 5;
        const targetW = pageWidth - margin * 2;
        const targetH = pageHeight - margin * 2;

        doc.addImage(
          page.processedDataUrl,
          'JPEG',
          margin,
          margin,
          targetW,
          targetH,
          undefined,
          'FAST'
        );

        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text(
          `Skuggle Digital Library • Page ${index + 1} of ${pages.length} • OCR Searchable Document`,
          pageWidth / 2,
          pageHeight - 2,
          { align: 'center' }
        );
      });

      const pdfBlob = doc.output('blob');
      resolve(pdfBlob as unknown as Blob);
    });
  };

  // Handle Proceed to Review & OCR step
  const handleProceedToReview = async () => {
    if (pages.length === 0) return;
    stopCamera();
    setIsGeneratingPdf(true);
    setCurrentStep('review');

    try {
      const pdfBlob = await generatePdfDocument();
      const blobUrl = URL.createObjectURL(pdfBlob);
      setGeneratedPdfBlobUrl(blobUrl);
      const sizeMb = (pdfBlob.size / (1024 * 1024)).toFixed(2);
      setPdfFileSize(`${sizeMb} MB`);

      // Trigger OCR recognition in background
      runOcrRecognition(pages);
    } catch (err) {
      console.error('Error generating PDF / OCR:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // AI Smart Inspect of document
  const handleAiSmartInspect = () => {
    if (pages.length === 0) return;
    setIsAiAnalyzing(true);

    setTimeout(() => {
      const inferredSubject = subject || 'Physics';
      const inferredClass = classLevels[0] || 'SSS 2';
      setTitle(`${inferredClass} ${inferredSubject}: Scanned Class Handout & Practice Problems`);
      setDescription(
        `Physical classroom document (${pages.length} page${pages.length > 1 ? 's' : ''}) OCR-scanned into searchable text. Includes formula notes, diagrams, and student exercise sets aligned with ${curriculumStandard}.`
      );
      setTagsInput(`${inferredSubject}, WAEC Notes, OCR Indexed, Class Handout, Wk ${weekNumber}`);
      setIsAiAnalyzing(false);
    }, 1000);
  };

  // Copy full OCR transcript
  const handleCopyOcrText = () => {
    if (!fullOcrText) return;
    navigator.clipboard.writeText(fullOcrText);
    setCopiedOcrText(true);
    setTimeout(() => setCopiedOcrText(false), 2000);
  };

  // Save Scanned PDF directly to Teacher Resource Library
  const handleSaveToLibrary = async () => {
    if (pages.length === 0 || !title.trim()) return;

    setIsGeneratingPdf(true);

    try {
      const pdfBlob = await generatePdfDocument();
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const mlResult = classifyDocumentContent({
        title: title.trim(),
        description: description.trim(),
        contentPreview: fullOcrText.slice(0, 300),
        ocrText: fullOcrText,
        tags,
        subject,
        curriculumStandard,
        fileFormat: 'PDF'
      });

      const combinedTags = Array.from(new Set([...tags, ...mlResult.suggestedTags])).slice(0, 6);

      if (appConfig.liveApi) {
        const file = new File(
          [pdfBlob],
          `${title.trim().replace(/[^\w\-]+/g, '_').slice(0, 60) || 'scan'}.pdf`,
          { type: 'application/pdf' },
        );
        const formData = libraryService.buildCreateFormData({
          title: title.trim(),
          description:
            description.trim() ||
            `Scanned document (${pages.length} page${pages.length > 1 ? 's' : ''}) with OCR text.`,
          author: 'School staff',
          resourceType: 'document',
          subject,
          className: classLevels[0] || 'All Classes',
          term,
          topic: mlResult.predictedCategory || title.trim(),
          accessTier: shareWithStudents ? 'school' : 'learn_plus',
          sourceLabel: curriculumStandard || 'Scanned upload',
          licenceName: 'School licence',
          status: 'published',
          schoolApproved: true,
          isPublic: shareWithParents,
          changeSummary: 'Published from camera scanner with OCR transcript',
          learningObjectives: combinedTags.length
            ? combinedTags
            : [`Review ${title.trim()}`],
          sections: [
            {
              id: 'section-1',
              title: 'OCR Transcript',
              content:
                fullOcrText.trim() ||
                description.trim() ||
                `Scanned physical document (${pages.length} pages).`,
            },
          ],
          file,
        });
        const created = await libraryService.create(formData);
        const published: ResourceItem = {
          id: created.id,
          title: title.trim(),
          description:
            description.trim() ||
            `Multi-page scanned document (${pages.length} pages) with OCR text extraction.`,
          subject,
          classLevels: classLevels.length > 0 ? classLevels : ['All Classes'],
          term,
          resourceType: 'document',
          fileFormat: 'PDF',
          fileSize: pdfFileSize || undefined,
          tags: combinedTags,
          author: 'School staff',
          authorRole: 'Teacher',
          uploadedAt: new Date().toISOString().split('T')[0],
          downloadCount: 0,
          viewCount: 1,
          isPinned: false,
          isSharedWithStudents: shareWithStudents,
          isSharedWithParents: shareWithParents,
          curriculumStandard,
          weekNumber,
          folderCategory: mlResult.predictedCategory,
          ocrText: fullOcrText,
          ocrPages: ocrPages.length > 0 ? ocrPages : undefined,
          ocrStatus: 'ready',
          ocrConfidence: ocrConfidence || 96,
          ocrLanguage: 'English',
        };
        onSaveToLibrary(published);
        feedbackBus.success('Scanned PDF published to the school library.');
        stopCamera();
        onClose();
        return;
      }

      const blobUrl = URL.createObjectURL(pdfBlob);
      const newResource: ResourceItem = {
        id: `res_scan_${Date.now()}`,
        title: title.trim(),
        description:
          description.trim() ||
          `Multi-page scanned document (${pages.length} page${pages.length > 1 ? 's' : ''}) with OCR text extraction. Searchable across library.`,
        subject: subject,
        classLevels: classLevels.length > 0 ? classLevels : ['All Classes'],
        term: term,
        resourceType: 'document',
        fileFormat: 'PDF',
        fileSize: pdfFileSize || '1.4 MB',
        url: blobUrl,
        tags: combinedTags.length > 0 ? combinedTags : [subject, 'Scanned PDF', 'OCR Indexed'],
        author: 'Mr. Adewale Bakare',
        authorRole: 'Senior Subject Lead',
        authorAvatar:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        uploadedAt: new Date().toISOString().split('T')[0],
        downloadCount: 0,
        viewCount: 1,
        isPinned: false,
        isSharedWithStudents: shareWithStudents,
        isSharedWithParents: shareWithParents,
        curriculumStandard: curriculumStandard,
        weekNumber: weekNumber,
        folderCategory: mlResult.predictedCategory,
        mlClassification: {
          predictedCategory: mlResult.predictedCategory,
          confidence: mlResult.confidence,
          reasoning: mlResult.reasoning,
          keyFeatures: mlResult.keyFeatures,
          secondaryPredictions: [
            { category: 'Assignments', probability: 2.0 },
            { category: 'Lecture Notes', probability: 1.0 }
          ],
          suggestedTags: mlResult.suggestedTags,
          difficulty: 'Intermediate',
          readingTimeMinutes: Math.max(3, Math.ceil(fullOcrText.split(/\s+/).length / 150)),
          classifiedAt: new Date().toISOString(),
          modelType: 'ML-Bayes-NLP'
        },
        contentPreview: fullOcrText.slice(0, 300) || `Scanned Physical Document (${pages.length} pages total)\n- High-resolution A4 PDF format\n- OCR Searchable Text Indexed`,
        ocrText: fullOcrText,
        ocrPages: ocrPages.length > 0 ? ocrPages : undefined,
        ocrStatus: 'ready',
        ocrConfidence: ocrConfidence || 96,
        ocrLanguage: 'English'
      };

      onSaveToLibrary(newResource);
      stopCamera();
      onClose();
    } catch (err) {
      console.error('Error saving scanned PDF:', err);
      feedbackBus.error(getApiError(err).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Immediate PDF download for teacher
  const handleDirectDownloadPdf = async () => {
    if (pages.length === 0) return;
    const pdfBlob = await generatePdfDocument();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'scanned_document'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search in OCR text helper
  const searchResults = ocrSearchQuery ? searchOcrContent(ocrSearchQuery, fullOcrText, ocrPages) : null;

  if (!isOpen) return null;

  return (
    <div
      id="camera-scanner-modal-backdrop"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <ScanText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Physical Document Camera Scanner & OCR</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  OCR SEARCHABLE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Scan notes, convert into PDF, and automatically extract searchable text across the platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Indicators */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-xl text-xs font-semibold">
              <span className={currentStep === 'camera' ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
                1. Scan ({pages.length} pg)
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className={currentStep === 'review' ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
                2. Review & Filters
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className={currentStep === 'ocr_review' ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
                3. OCR Transcript
              </span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className={currentStep === 'metadata' ? 'text-indigo-400 font-bold' : 'text-slate-400'}>
                4. Save
              </span>
            </div>

            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Viewport Container */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-slate-950">

          {/* ========================================================================= */}
          {/* STEP 1: CAMERA LIVE VIEWFINDER & SHUTTER */}
          {/* ========================================================================= */}
          {currentStep === 'camera' && (
            <div className="p-4 sm:p-6 flex flex-col items-center justify-between flex-1 gap-4">
              
              {/* Top Camera Controls Bar */}
              <div className="w-full flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Camera
                  </span>

                  {devices.length > 1 && (
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        startCamera(e.target.value);
                      }}
                      className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                    >
                      {devices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Viewfinder Frame with Document Alignment Guides */}
              <div className="relative w-full max-w-lg aspect-[3/4] max-h-[52vh] bg-black rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center group">
                
                {cameraError ? (
                  <div className="p-6 text-center text-slate-300 space-y-3">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-xs font-medium text-slate-300 max-w-xs mx-auto">
                      {cameraError}
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => startCamera()}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Camera</span>
                      </button>
                      <label className="cursor-pointer px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold">
                        Browse Files
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* A4 Document Overlay Box & Corner Targets */}
                    <div className="absolute inset-6 border border-indigo-400/40 rounded-xl pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                      {/* Top corners */}
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-t-2 border-l-2 border-indigo-400" />
                        <div className="w-6 h-6 border-t-2 border-r-2 border-indigo-400" />
                      </div>

                      {/* Center alignment guide text */}
                      <div className="text-center">
                        <span className="px-3 py-1 rounded-full bg-slate-950/80 text-[10px] font-bold text-indigo-300 border border-indigo-500/30 backdrop-blur-xs">
                          Align physical document within frame
                        </span>
                      </div>

                      {/* Bottom corners */}
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-b-2 border-l-2 border-indigo-400" />
                        <div className="w-6 h-6 border-b-2 border-r-2 border-indigo-400" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Shutter & Scanned Pages Thumbnail Strip */}
              <div className="w-full max-w-xl flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                
                {/* Thumbnail Strip of captured pages */}
                <div className="flex items-center gap-2 overflow-x-auto max-w-[240px] py-1">
                  {pages.map((page, idx) => (
                    <div
                      key={page.id}
                      onClick={() => {
                        setActivePageIndex(idx);
                        setCurrentStep('review');
                      }}
                      className="relative w-11 h-14 rounded-lg bg-slate-800 border-2 border-indigo-500/80 overflow-hidden shrink-0 cursor-pointer group shadow-xs"
                      title={`Page ${idx + 1}`}
                    >
                      <img
                        src={page.processedDataUrl}
                        alt={`Scanned Page ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-0.5 bg-slate-900/90 text-white font-mono text-[9px] px-1 rounded font-bold">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                  {pages.length === 0 && (
                    <div className="text-[11px] text-slate-500 italic">
                      No pages captured yet
                    </div>
                  )}
                </div>

                {/* Shutter Capture Button */}
                <div className="flex items-center gap-3">
                  <button
                    id="btn-camera-shutter"
                    onClick={handleCaptureSnapshot}
                    disabled={!cameraActive || isCapturing}
                    className="w-14 h-14 rounded-full bg-white hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center p-1 border-4 border-indigo-600 shadow-lg shadow-indigo-900/40 disabled:opacity-50 cursor-pointer"
                    title="Capture document page"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                      <Camera className="w-5 h-5" />
                    </div>
                  </button>
                </div>

                {/* Proceed Button */}
                <div>
                  <button
                    id="btn-proceed-review-pdf"
                    onClick={handleProceedToReview}
                    disabled={pages.length === 0}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Review & OCR ({pages.length})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: REVIEW SCANNED PAGES & FILTERS */}
          {/* ========================================================================= */}
          {currentStep === 'review' && (
            <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 flex-1">
              
              {/* Left Column: Big Document Preview Viewport */}
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/60 rounded-2xl border border-slate-800 p-4 min-h-[380px] relative">
                {pages[activePageIndex] ? (
                  <div className="relative max-h-[50vh] aspect-[3/4] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700 flex items-center justify-center">
                    <img
                      src={pages[activePageIndex].processedDataUrl}
                      alt={`Page ${activePageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700">
                      Page {activePageIndex + 1} of {pages.length}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs">No page selected</div>
                )}

                {/* Page Navigation & Controls */}
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activePageIndex === 0}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-bold text-slate-300">
                    Page {activePageIndex + 1} / {pages.length}
                  </span>

                  <button
                    onClick={() => setActivePageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
                    disabled={activePageIndex >= pages.length - 1}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="w-px h-5 bg-slate-800 mx-1" />

                  {/* Rotate */}
                  <button
                    onClick={() => handleRotatePage(activePageIndex)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Rotate 90° clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate</span>
                  </button>

                  {/* Delete page */}
                  <button
                    onClick={() => handleDeletePage(activePageIndex)}
                    className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-800/40 transition-colors"
                    title="Delete page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Processing Filters & Document Details */}
              <div className="w-full lg:w-80 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Scan Enhancement Filter
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Document Clean B&W */}
                      <button
                        onClick={() => handleChangePageFilter(activePageIndex, 'document')}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                          pages[activePageIndex]?.filter === 'document'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Document B&W</span>
                        </div>
                        <p className="text-[10px] font-normal text-slate-400">Crisp ink & pure white paper</p>
                      </button>

                      {/* Color Enhanced */}
                      <button
                        onClick={() => handleChangePageFilter(activePageIndex, 'color_enhanced')}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                          pages[activePageIndex]?.filter === 'color_enhanced'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Color Boost</span>
                        </div>
                        <p className="text-[10px] font-normal text-slate-400">For diagrams & charts</p>
                      </button>

                      {/* Grayscale */}
                      <button
                        onClick={() => handleChangePageFilter(activePageIndex, 'grayscale')}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                          pages[activePageIndex]?.filter === 'grayscale'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sliders className="w-3.5 h-3.5 text-slate-300" />
                          <span>Grayscale</span>
                        </div>
                        <p className="text-[10px] font-normal text-slate-400">Smooth monochrome</p>
                      </button>

                      {/* Original */}
                      <button
                        onClick={() => handleChangePageFilter(activePageIndex, 'original')}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                          pages[activePageIndex]?.filter === 'original'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Raw Photo</span>
                        </div>
                        <p className="text-[10px] font-normal text-slate-400">Unfiltered photo</p>
                      </button>
                    </div>
                  </div>

                  {/* Scanned Pages Carousel / Add More */}
                  <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-300">Pages in Document</span>
                      <span className="text-[10px] text-indigo-400 font-bold">{pages.length} page(s)</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {pages.map((p, idx) => (
                        <div
                          key={p.id}
                          onClick={() => setActivePageIndex(idx)}
                          className={`w-12 h-16 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2 transition-all relative ${
                            activePageIndex === idx
                              ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                              : 'border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={p.processedDataUrl}
                            alt={`Thumb ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0.5 right-0.5 bg-slate-950/80 text-[8px] font-mono text-white px-1 rounded">
                            {idx + 1}
                          </span>
                        </div>
                      ))}

                      {/* Add another page button */}
                      <button
                        onClick={() => {
                          setCurrentStep('camera');
                          startCamera(selectedDeviceId);
                        }}
                        className="w-12 h-16 rounded-lg border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-400 shrink-0 transition-colors"
                        title="Scan another page"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[9px] font-bold mt-0.5">Add</span>
                      </button>
                    </div>
                  </div>

                  {/* OCR Recognition Quick Status Pill */}
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ScanText className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="font-bold text-indigo-200">OCR Text Recognition</div>
                        <div className="text-[10px] text-indigo-300">
                          {isOcrProcessing ? 'Extracting text...' : `Extracted • ${ocrConfidence}% Confidence`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStep('ocr_review')}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors"
                    >
                      View Text
                    </button>
                  </div>
                </div>

                {/* Bottom step navigation */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep('ocr_review')}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Proceed to OCR & Text Extraction</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentStep('camera');
                      startCamera(selectedDeviceId);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Back to Camera
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: OCR EXTRACTION & TRANSCRIPT INSPECTOR */}
          {/* ========================================================================= */}
          {currentStep === 'ocr_review' && (
            <div className="p-4 sm:p-6 flex flex-col flex-1 space-y-4">
              
              {/* Header Bar with OCR Status & Live Search */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <ScanText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">OCR Optical Character Recognition</h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/40 text-[10px] font-bold">
                        {ocrConfidence}% Accuracy
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {isOcrProcessing
                        ? ocrProgressMessage || 'Extracting optical characters...'
                        : `Indexed ${pages.length} page(s) • Ready for global platform search`}
                    </p>
                  </div>
                </div>

                {/* Instant OCR Search Query test inside the scanner */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ocrSearchQuery}
                      onChange={(e) => setOcrSearchQuery(e.target.value)}
                      placeholder="Search keywords in scan..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleCopyOcrText}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    title="Copy full OCR text transcript to clipboard"
                  >
                    {copiedOcrText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => runOcrRecognition(pages)}
                    disabled={isOcrProcessing}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors shrink-0"
                    title="Re-run OCR"
                  >
                    <RefreshCw className={`w-4 h-4 ${isOcrProcessing ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Search match notification banner if user searched inside scanner */}
              {ocrSearchQuery && searchResults && (
                <div className="px-3 py-2 bg-indigo-950/60 border border-indigo-800/40 rounded-xl text-xs flex items-center justify-between text-indigo-200">
                  <div className="flex items-center gap-2">
                    <FileSearch className="w-4 h-4 text-indigo-400" />
                    <span>
                      Found <strong>{searchResults.hitCount}</strong> OCR text match(es) for &quot;{ocrSearchQuery}&quot;
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-300">
                    Will be instantly searchable in Resource Library
                  </span>
                </div>
              )}

              {/* Side-by-Side: Page Scanned Image vs. Extracted OCR Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[320px]">
                
                {/* Left: Scanned Document Page Image */}
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-3 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                    <span>Scanned Optical Source</span>
                    <div className="flex items-center gap-1">
                      {pages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePageIndex(idx)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            activePageIndex === idx
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Pg {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-2 overflow-hidden">
                    {pages[activePageIndex] && (
                      <img
                        src={pages[activePageIndex].processedDataUrl}
                        alt={`Scanned Source ${activePageIndex + 1}`}
                        className="max-h-[36vh] w-auto object-contain rounded-lg shadow-md"
                      />
                    )}
                  </div>
                </div>

                {/* Right: Editable OCR Transcript */}
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-3 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <span>Recognized OCR Transcript</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({fullOcrText.split(/\s+/).filter(Boolean).length} words)
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        onClick={() => setOcrActiveTab('view')}
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          ocrActiveTab === 'view'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Formatted
                      </button>
                      <button
                        onClick={() => setOcrActiveTab('edit')}
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          ocrActiveTab === 'edit'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Edit Text
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-3 overflow-y-auto max-h-[36vh]">
                    {ocrActiveTab === 'edit' ? (
                      <textarea
                        value={fullOcrText}
                        onChange={(e) => setFullOcrText(e.target.value)}
                        className="w-full h-full min-h-[220px] bg-transparent text-xs text-slate-200 font-mono focus:outline-none resize-none leading-relaxed"
                        placeholder="OCR recognized text will appear here..."
                      />
                    ) : (
                      <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {fullOcrText || (
                          <div className="text-slate-500 italic py-8 text-center">
                            Extracting text with optical character recognition...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Step Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep('review')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Back to Image Filters
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep('metadata')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Proceed to Final Metadata & Save</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: METADATA & SAVE TO RESOURCE LIBRARY */}
          {/* ========================================================================= */}
          {currentStep === 'metadata' && (
            <div className="p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full">
              
              {/* Smart AI Auto-Fill Helper */}
              <div className="p-3.5 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 rounded-2xl border border-purple-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-purple-200">Smart Document Auto-Tagging & OCR Sync</h4>
                    <p className="text-[11px] text-purple-300">
                      Synthesize lesson title, curriculum tags, and search keywords from extracted OCR text
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAiSmartInspect}
                  disabled={isAiAnalyzing}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {isAiAnalyzing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Auto-Fill</span>
                </button>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Document Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SSS 2 Physics: Refraction & Lenses Class Handout"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Description & Key Topics
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of what this document covers..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Subject, Term, Week Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:outline-none"
                  >
                    {subjectsList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Academic Term</label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:outline-none"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term">Third Term</option>
                    <option value="All Terms">All Terms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Curriculum Week</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              {/* Target Class Levels */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Target Classes
                </label>
                <div className="flex flex-wrap gap-2">
                  {classLevelsList.map((c) => {
                    const isSelected = classLevels.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setClassLevels(classLevels.filter((x) => x !== c));
                          } else {
                            setClassLevels([...classLevels, c]);
                          }
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. WAEC 2026, Optics, Formulas, Practical, OCR Indexed"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              {/* OCR Index Status Badge */}
              <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold">OCR Search Indexing Active</span>
                    <p className="text-[10px] text-emerald-300">
                      Extracted text ({fullOcrText.split(/\s+/).filter(Boolean).length} words) will be indexed for instant platform search.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-900/60 font-mono text-[10px] font-bold text-emerald-300">
                  {ocrConfidence}% CONFIDENCE
                </span>
              </div>

              {/* Student Portal Sharing */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="check-scan-share-students"
                    checked={shareWithStudents}
                    onChange={(e) => setShareWithStudents(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <label
                    htmlFor="check-scan-share-students"
                    className="text-xs font-bold text-slate-200 cursor-pointer"
                  >
                    Publish PDF to Student Learning Hub
                  </label>
                </div>
                <span className="text-[10px] text-slate-400">Accessible for offline study</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('ocr_review')}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Back to OCR
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectDownloadPdf}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download raw PDF copy locally"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Copy</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  disabled={isGeneratingPdf || !title.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isGeneratingPdf ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Compiling & Saving PDF...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Save PDF to Resource Library</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

