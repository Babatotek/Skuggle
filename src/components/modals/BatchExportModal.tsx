import React, { useState } from 'react';
import {
  FileDown,
  X,
  CheckCircle2,
  Layers,
  FileText,
  GripVertical,
  Trash2,
  Plus,
  BookOpen,
  Download,
  QrCode,
  Sparkles,
  Check,
  Building,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { ResourceItem } from '../../types';
import jsPDF from 'jspdf';
import { appConfig } from '@/app/config';
import { libraryService } from '@/features/library/libraryService';
import { getApiError } from '@/shared/api/client';
import { feedbackBus } from '@/shared/feedback/feedbackBus';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedResources: ResourceItem[];
  allResources?: ResourceItem[];
  onUpdateSelected?: (resources: ResourceItem[]) => void;
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  selectedResources,
  allResources = [],
  onUpdateSelected
}) => {
  if (!isOpen) return null;

  const [handoutTitle, setHandoutTitle] = useState('Comprehensive Student Revision Package');
  const [targetClass, setTargetClass] = useState('SSS 2 Science');
  const [term, setTerm] = useState('First Term 2026/2027');
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true);
  const [includeAISummaries, setIncludeAISummaries] = useState(true);
  const [includeOCRTranscripts, setIncludeOCRTranscripts] = useState(true);
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [schoolName, setSchoolName] = useState('Royal Gateway International Academy');
  const [teacherName, setTeacherName] = useState('Mr. Babatunde Adewale (HOD Sciences)');
  const [items, setItems] = useState<ResourceItem[]>(selectedResources);
  const [isExporting, setIsExporting] = useState(false);
  const [exportCompleteToast, setExportCompleteToast] = useState<string | null>(null);

  const handleRemoveItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    if (onUpdateSelected) onUpdateSelected(updated);
  };

  const handleAddItem = (res: ResourceItem) => {
    if (items.some((i) => i.id === res.id)) return;
    const updated = [...items, res];
    setItems(updated);
    if (onUpdateSelected) onUpdateSelected(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
    if (onUpdateSelected) onUpdateSelected(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
    if (onUpdateSelected) onUpdateSelected(newItems);
  };

  const handleGeneratePDF = async () => {
    if (items.length === 0) return;
    setIsExporting(true);

    if (appConfig.liveApi) {
      try {
        const job = await libraryService.createExport({
          resourceIds: items.map((item) => item.id),
          title: handoutTitle.trim() || 'Student revision pack',
          includeCoverPage,
          format: 'pdf',
        });

        let current = job;
        for (let attempt = 0; attempt < 40; attempt += 1) {
          if (current.state === 'complete') break;
          if (current.state === 'failed') {
            throw new Error(current.message || 'Export job failed.');
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
          current = await libraryService.exportJob(job.id);
        }

        if (current.state !== 'complete') {
          throw new Error('Export is still processing. Open again shortly and retry download.');
        }

        await libraryService.downloadExport(
          current.id,
          current.filename || `${handoutTitle.replace(/\s+/g, '_')}.pdf`,
        );
        setExportCompleteToast('Licence-aware handout PDF ready and downloading.');
        setTimeout(() => setExportCompleteToast(null), 4000);
        feedbackBus.success('Batch export completed.');
      } catch (error) {
        feedbackBus.error(getApiError(error).message);
      } finally {
        setIsExporting(false);
      }
      return;
    }

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        let pageNum = 1;

        // COVER PAGE
        if (includeCoverPage) {
          // Purple gradient top bar
          doc.setFillColor(79, 70, 229);
          doc.rect(0, 0, 210, 45, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.setFont('helvetica', 'bold');
          doc.text(schoolName.toUpperCase(), 15, 22);

          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.text('OFFICIAL CURRICULUM STUDENT REVISION COMPENDIUM', 15, 33);

          // Title Section
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text(handoutTitle, 15, 75);

          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`Target Class: ${targetClass}`, 15, 90);
          doc.text(`Academic Period: ${term}`, 15, 98);
          doc.text(`Instructor: ${teacherName}`, 15, 106);
          doc.text(`Total Bundled Documents: ${items.length} Modules`, 15, 114);

          // Info Box
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(15, 130, 180, 50, 4, 4, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(15, 130, 180, 50, 4, 4, 'D');

          doc.setTextColor(79, 70, 229);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('STUDENT INSTRUCTIONS', 22, 142);

          doc.setTextColor(71, 85, 105);
          doc.setFontSize(9.5);
          doc.setFont('helvetica', 'normal');
          doc.text('1. Read each section carefully and complete highlighted learning objectives.', 22, 152);
          doc.text('2. Review AI-synthesized concept takeaways before end-of-term examinations.', 22, 160);
          doc.text('3. Scan the accompanying document QR codes to access interactive audio notes on Skuggle.', 22, 168);

          // Footer
          doc.setFontSize(8.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`Compiled via Skuggle EduSuite • Page ${pageNum}`, 15, 285);
        }

        // TABLE OF CONTENTS
        if (includeTableOfContents) {
          doc.addPage();
          pageNum++;

          doc.setFillColor(241, 245, 249);
          doc.rect(0, 0, 210, 20, 'F');
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('TABLE OF CONTENTS & CURRICULUM SYLLABUS INDEX', 15, 14);

          let tocY = 35;
          items.forEach((item, idx) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(79, 70, 229);
            doc.text(`${idx + 1}.`, 15, tocY);
            doc.setTextColor(30, 41, 59);
            doc.text(`${item.title}`, 24, tocY);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`[${item.subject} • ${item.folderCategory || 'General'}]`, 150, tocY);

            tocY += 5;
            doc.text(`Description: ${item.description.slice(0, 75)}...`, 24, tocY);
            tocY += 8;

            doc.setDrawColor(241, 245, 249);
            doc.line(15, tocY - 2, 195, tocY - 2);
            tocY += 4;
          });

          doc.setFontSize(8.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`Compiled via Skuggle EduSuite • Page ${pageNum}`, 15, 285);
        }

        // INDIVIDUAL RESOURCE MODULES
        items.forEach((item, idx) => {
          doc.addPage();
          pageNum++;

          // Module Header banner
          doc.setFillColor(79, 70, 229);
          doc.rect(0, 0, 210, 22, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`MODULE ${idx + 1}: ${item.title.toUpperCase()}`, 15, 12);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`${item.subject} • ${item.classLevels.join(', ')} • Week ${item.weekNumber || idx + 1}`, 15, 18);

          let y = 34;

          // Overview Box
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(15, y, 180, 24, 3, 3, 'F');
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(9.5);
          doc.text(`Author: ${item.author} (${item.authorRole})`, 20, y + 8);
          doc.text(`Curriculum Category: ${item.folderCategory || 'General Notes'}`, 20, y + 15);
          doc.text(`Format: ${item.fileFormat} • Tags: ${item.tags.join(', ')}`, 20, y + 21);

          y += 34;

          // AI Key Takeaways if enabled
          if (includeAISummaries && item.aiSummary) {
            doc.setFillColor(245, 243, 255);
            doc.roundedRect(15, y, 180, 36, 3, 3, 'F');
            doc.setDrawColor(221, 214, 254);
            doc.roundedRect(15, y, 180, 36, 3, 3, 'D');

            doc.setTextColor(109, 40, 217);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('✨ AI CORE CONCEPTS & LEARNING OBJECTIVES', 20, y + 8);

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(67, 56, 202);
            doc.text(`Summary: ${item.aiSummary.briefSummary.slice(0, 95)}...`, 20, y + 16);
            if (item.aiSummary.keyTakeaways[0]) {
              doc.text(`• ${item.aiSummary.keyTakeaways[0].slice(0, 85)}`, 20, y + 23);
            }
            if (item.aiSummary.keyTakeaways[1]) {
              doc.text(`• ${item.aiSummary.keyTakeaways[1].slice(0, 85)}`, 20, y + 30);
            }

            y += 44;
          }

          // Full Text / OCR Content
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('DOCUMENT LESSON CONTENT & SYLLABUS NOTES', 15, y);
          y += 6;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(51, 65, 85);

          const sampleText =
            item.ocrText ||
            item.contentPreview ||
            `This module covers essential principles in ${item.subject} for students in ${item.classLevels.join(
              ', '
            )}. Students are expected to master fundamental definitions, formulas, and real-world diagnostic applications outlined in this curriculum unit.\n\nKey Focus Areas:\n1. Theoretical framework and operational laws\n2. Practical demonstrations and lab experiments\n3. Problem-solving steps and step-by-step WAEC standard solutions\n4. Revision exercises and self-assessment milestones.`;

          const splitLines = doc.splitTextToSize(sampleText, 180);
          doc.text(splitLines.slice(0, 22), 15, y);

          // Page Footer
          doc.setFontSize(8.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`Compiled via Skuggle EduSuite • Page ${pageNum}`, 15, 285);
        });

        doc.save(`Skuggle_Handout_${targetClass.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
        setIsExporting(false);
        setExportCompleteToast(`Combined PDF handout (${items.length} modules) exported successfully!`);
        setTimeout(() => setExportCompleteToast(null), 4000);
      } catch (err) {
        console.error('Batch export failed:', err);
        setIsExporting(false);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="modal-batch-export"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Batch Resource Exporter</h2>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-100 text-indigo-700">
                  Combined PDF Handout
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Select and merge multiple study resources into a unified, formatted printable student booklet
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {exportCompleteToast && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {exportCompleteToast}
              </span>
              <button onClick={() => setExportCompleteToast(null)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Configuration Form (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Handout Booklet Settings
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Handout Booklet Title
                </label>
                <input
                  type="text"
                  value={handoutTitle}
                  onChange={(e) => setHandoutTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class</label>
                  <input
                    type="text"
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Term</label>
                  <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">School Header</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Compiler / Teacher</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Inclusion Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCoverPage}
                    onChange={(e) => setIncludeCoverPage(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Include Formal Cover Page & Instructions</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTableOfContents}
                    onChange={(e) => setIncludeTableOfContents(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Include Table of Contents</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAISummaries}
                    onChange={(e) => setIncludeAISummaries(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Include AI Key Concept Boxes</span>
                </label>
              </div>
            </div>

            {/* Right: Selected Resources List & Reordering (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bundled Modules ({items.length} Selected)
                </h3>
                <span className="text-[11px] text-slate-400">Reorder with arrows to structure handout</span>
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                  No resources selected. Pick resources from the list below to build your booklet.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto p-1">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{item.title}</p>
                          <p className="text-[10.5px] text-slate-500 truncate">
                            {item.subject} • {item.folderCategory || 'General'} • {item.fileFormat}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 rounded text-slate-700 text-[10px] font-bold"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === items.length - 1}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 rounded text-slate-700 text-[10px] font-bold"
                          title="Move down"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove from batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Add Available Resources */}
              {allResources.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-bold text-slate-600">Add other library resources to bundle:</p>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {allResources
                      .filter((r) => !items.some((i) => i.id === r.id))
                      .map((res) => (
                        <button
                          key={res.id}
                          onClick={() => handleAddItem(res)}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{res.title}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {items.length} document{items.length !== 1 ? 's' : ''} ready to assemble
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={() => void handleGeneratePDF()}
              disabled={isExporting || items.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isExporting ? (
                <span>Compiling Combined PDF...</span>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Combined Student Handout (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
