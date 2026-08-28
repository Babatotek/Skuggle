import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Scan,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Save,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';

export const SmartMarkScanner: React.FC = () => {
  const { students, assessments, showToast } = useApp();

  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedClass, setSelectedClass] = useState('JSS 2');
  const [assessmentType, setAssessmentType] = useState<'ca1' | 'ca2' | 'exam'>('ca1');

  const [isScanning, setIsScanning] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [answerKey, setAnswerKey] = useState('A,C,B,D,A,B,C,D,A,B,C,D,A,C,B');
  const pollRef = useRef<number | null>(null);

  // Mock OCR Optical Scan Results for JSS 2
  const demoResults = [
    {
      studentId: 'std-1',
      studentName: 'David Adeleke',
      admissionNo: 'CHIA/2024/0142',
      detectedScore: 14,
      maxScore: 15,
      confidence: 99.4,
      flagged: false,
      answers: ['A', 'C', 'B', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'C', 'B'],
    },
    {
      studentId: 'std-2',
      studentName: 'Zainab Bello',
      admissionNo: 'CHIA/2024/0155',
      detectedScore: 15,
      maxScore: 15,
      confidence: 98.8,
      flagged: false,
      answers: ['A', 'C', 'B', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'C', 'A'],
    },
    {
      studentId: 'std-3',
      studentName: 'Chukwuebuka Obi',
      admissionNo: 'CHIA/2024/0168',
      detectedScore: 11,
      maxScore: 15,
      confidence: 84.2,
      flagged: true,
      flagReason: 'Faint shading on Question 8 & double mark on Question 12',
      answers: ['A', 'C', 'B', '?', 'A', 'B', 'C', 'D', 'A', '?', 'C', 'D', 'A', 'C', 'B'],
    },
    {
      studentId: 'std-4',
      studentName: 'Amina Yusuf',
      admissionNo: 'CHIA/2024/0179',
      detectedScore: 13,
      maxScore: 15,
      confidence: 97.5,
      flagged: false,
      answers: ['A', 'C', 'B', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'A', 'D', 'A', 'C', 'B'],
    },
  ];
  const [scannedResults, setScannedResults] = useState<any[]>(import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true' ? demoResults : []);

  useEffect(() => () => { if (pollRef.current) window.clearInterval(pollRef.current); }, []);

  const loadBatch = async (id: string) => {
    const response = await apiRequest<{ data: any }>(`/smartmark/batches/${encodeURIComponent(id)}`, { suppressErrorNotification: true });
    if (response.data.state === 'failed') throw new Error(response.data.error || 'OCR processing failed.');
    if (response.data.state === 'review' || response.data.state === 'committed') {
      setScannedResults(response.data.sheets || []); setScanCompleted(true); setIsScanning(false);
      if (pollRef.current) window.clearInterval(pollRef.current); pollRef.current = null;
      showToast('SmartMark scan complete', `${response.data.sheets?.length || 0} sheet(s) are ready for human review.`, 'success');
    }
  };

  const handleStartScan = async () => {
    if (!selectedFile) { showToast('Scan file required', 'Choose a JPG, PNG, WebP, or PDF answer-sheet scan.', 'warning'); return; }
    const assessment = assessments.find((item) => item.subject === selectedSubject && item.classLevel === selectedClass) || assessments[0];
    if (!assessment) { showToast('Assessment required', 'Create the target assessment before scanning answer sheets.', 'warning'); return; }
    setIsScanning(true);
    setScanCompleted(false);
    try {
      const form = new FormData(); form.append('file', selectedFile); form.append('assessmentId', assessment.id); form.append('maxScore', assessmentType === 'exam' ? '60' : '15');
      answerKey.split(',').map((value) => value.trim().toUpperCase()).filter(Boolean).forEach((value) => form.append('answerKey[]', value));
      const response = await apiMutation<{ data: { id: string } }>('/smartmark/batches', 'POST', form);
      setBatchId(response.data.id); showToast('Scan queued', 'The private upload passed validation and OCR processing has started.', 'info');
      pollRef.current = window.setInterval(() => void loadBatch(response.data.id).catch((error) => { if (pollRef.current) window.clearInterval(pollRef.current); pollRef.current = null; setIsScanning(false); showToast('OCR processing failed', error instanceof Error ? error.message : describeApiError(error), 'failed'); }), 2500);
    } catch (error) { setIsScanning(false); showToast('Scan upload failed', describeApiError(error), 'failed'); }
  };

  const handleUpdateScore = (index: number, newScore: number) => {
    const updated = [...scannedResults];
    updated[index].detectedScore = newScore;
    updated[index].flagged = false;
    setScannedResults(updated);
    void apiMutation(`/smartmark/sheets/${encodeURIComponent(updated[index].id)}`, 'PATCH', { detectedScore: newScore, answers: updated[index].answers, approved: true })
      .then(() => showToast('Score confirmed', `The reviewed score was saved for ${updated[index].studentName || updated[index].admissionNo}.`, 'success'))
      .catch((error) => showToast('Review save failed', describeApiError(error), 'failed'));
  };

  const handlePushToGradebook = () => {
    if (!batchId) return;
    void apiMutation(`/smartmark/batches/${encodeURIComponent(batchId)}/commit`, 'POST')
      .then(() => showToast('Gradebook updated', `${scannedResults.length} reviewed score(s) were committed atomically.`, 'success'))
      .catch((error) => showToast('Gradebook commit failed', describeApiError(error), 'failed'));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Scan className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              SmartMark Optical Test Scoring
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-full">
              Optical Computer Vision
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Digitally score paper bubble sheets, quizzes, and continuous assessment tests with side-by-side verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {scanCompleted && (
            <button
              onClick={handlePushToGradebook}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Push All to Gradebook</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scan Controls & Camera Capture Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600" />
              <span>Assessment & Sheet Setup</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Subject & Class
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="English Language">English Language</option>
                  <option value="Basic Science">Basic Science</option>
                </select>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50"
                >
                  <option value="JSS 1">JSS 1</option>
                  <option value="JSS 2">JSS 2 (A & B)</option>
                  <option value="SSS 1">SSS 1</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assessment Score Category
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAssessmentType('ca1')}
                  className={`py-2 rounded-xl border transition-colors ${
                    assessmentType === 'ca1' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200'
                  }`}
                >
                  CA 1 (15%)
                </button>
                <button
                  type="button"
                  onClick={() => setAssessmentType('ca2')}
                  className={`py-2 rounded-xl border transition-colors ${
                    assessmentType === 'ca2' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200'
                  }`}
                >
                  CA 2 (15%)
                </button>
                <button
                  type="button"
                  onClick={() => setAssessmentType('exam')}
                  className={`py-2 rounded-xl border transition-colors ${
                    assessmentType === 'exam' ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200'
                  }`}
                >
                  Exam (60%)
                </button>
              </div>
            </div>

            {/* Scan Capture Visualizer */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 relative overflow-hidden">
              {isScanning && (
                <div className="absolute inset-0 bg-indigo-900/10 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                  <span className="text-xs font-bold text-indigo-900">Processing Optical Alignments...</span>
                </div>
              )}

              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 mx-auto flex items-center justify-center mb-3">
                <Scan className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-sm text-slate-900 mb-1">
                Batch Optical Script Scanner
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Position standard 15-question NERDC answer sheets in view or upload scanned PDF.
              </p>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className="w-full mb-3 text-xs rounded-xl border border-slate-300 bg-white p-2"
              />
              <label className="block text-left text-[11px] font-bold text-slate-600 mb-1">Answer key (comma-separated)</label>
              <input
                value={answerKey}
                onChange={(event) => setAnswerKey(event.target.value)}
                className="w-full mb-3 text-xs font-mono rounded-xl border border-slate-300 bg-white p-2"
              />

              <button
                type="button"
                onClick={handleStartScan}
                disabled={isScanning}
                className="w-full py-2.5 px-4 bg-indigo-900 hover:bg-indigo-950 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>{scanCompleted ? 'Upload and rescan sheets' : 'Upload and process answer sheets'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Optical Results & Human-in-the-loop verification */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Optical Scan Results & Audit Inspection</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {scannedResults.length} scripts detected
              </span>
            </div>

            <div className="space-y-3">
              {scannedResults.map((item, idx) => (
                <div
                  key={item.studentId}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.flagged
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900 font-bold">{item.studentName}</strong>
                        <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                          {item.admissionNo}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        OCR Optical Confidence: <strong className="text-slate-800">{item.confidence}%</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Detected Score:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={item.detectedScore}
                          onChange={(e) => handleUpdateScore(idx, parseInt(e.target.value) || 0)}
                          max={15}
                          min={0}
                          className="w-14 text-center font-bold text-sm px-2 py-1 rounded-lg border border-slate-300 bg-white"
                        />
                        <span className="text-xs font-bold text-slate-400">/ 15</span>
                      </div>
                    </div>
                  </div>

                  {item.flagged && (
                    <div className="p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-[11px] text-amber-900 flex items-start gap-1.5 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Human Verification Flag:</strong> {item.flagReason}. Review pencil marks and confirm score.
                      </div>
                    </div>
                  )}

                  {/* Shaded bubble pattern preview */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
                    <span className="text-slate-400 mr-1 shrink-0">P1-15:</span>
                    {item.answers.map((ans, aIdx) => (
                      <span
                        key={aIdx}
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-bold shrink-0 ${
                          ans === '?'
                            ? 'bg-amber-300 text-amber-950 animate-pulse'
                            : 'bg-indigo-50 text-indigo-900 border border-indigo-200/60'
                        }`}
                      >
                        {ans}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2 text-xs text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Human-Approved Guarantee:</strong> Optical recognition assists speed; all continuous assessment marks remain editable and confirmed by the subject teacher before gradebook entry.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
