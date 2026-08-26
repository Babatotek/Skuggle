import React, { useEffect, useState } from 'react';
import {
  StickyNote,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  CornerDownRight,
  Send,
  MessageSquare,
  Sparkles,
  User,
  Check,
  Tag,
  Palette,
  Pin,
  Eye
} from 'lucide-react';
import { ResourceItem, ResourceAnnotation } from '../../types';
import { appConfig } from '@/app/config';
import { libraryService } from '@/features/library/libraryService';
import { getApiError } from '@/shared/api/client';
import { feedbackBus } from '@/shared/feedback/feedbackBus';

interface DocumentAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: ResourceItem | null;
  onUpdateResource?: (updated: ResourceItem) => void;
  currentUserRole?: string;
  currentUserName?: string;
}

const mapApiColour = (
  colour: string,
): ResourceAnnotation['color'] => {
  if (colour === 'pink' || colour === 'blue' || colour === 'green' || colour === 'yellow') {
    return colour;
  }
  return 'yellow';
};

const toUiColour = (
  colour: ResourceAnnotation['color'],
): 'yellow' | 'pink' | 'blue' | 'green' => {
  if (colour === 'purple') return 'pink';
  return colour;
};

export const DocumentAnnotationModal: React.FC<DocumentAnnotationModalProps> = ({
  isOpen,
  onClose,
  resource,
  onUpdateResource,
  currentUserRole = 'teacher',
  currentUserName = 'Mr. B. Adewale'
}) => {
  const demoSeed = (resourceId: string): ResourceAnnotation[] => [
      {
        id: 'ann-1',
        resourceId,
        author: 'Mr. B. Adewale (Physics Teacher)',
        authorRole: 'teacher',
        text: '📌 Focus on derivation of equation 3.2 for the upcoming midterm exam. Pay close attention to unit conversions from km/h to m/s.',
        color: 'yellow',
        positionX: 35,
        positionY: 28,
        pageNumber: 1,
        createdAt: '2 hours ago',
        replies: [
          {
            id: 'rep-1',
            author: 'Chinedu Okafor (SSS 2A)',
            authorRole: 'student',
            text: 'Thank you Sir! Will we need to memorize the relativistic formula as well?',
            createdAt: '1 hour ago'
          },
          {
            id: 'rep-2',
            author: 'Mr. B. Adewale',
            authorRole: 'teacher',
            text: 'No Chinedu, classical mechanics only for this term.',
            createdAt: '45 mins ago'
          }
        ]
      },
      {
        id: 'ann-2',
        resourceId,
        author: 'Amina Bello (Student)',
        authorRole: 'student',
        text: '💡 Is question 4 on page 2 referring to vector addition or scalar speed?',
        color: 'blue',
        positionX: 65,
        positionY: 60,
        pageNumber: 1,
        createdAt: '3 hours ago',
        replies: [
          {
            id: 'rep-3',
            author: 'Mr. B. Adewale',
            authorRole: 'teacher',
            text: 'Vector addition with 2D orthogonal components.',
            createdAt: '2 hours ago'
          }
        ]
      }
  ];

  const [annotations, setAnnotations] = useState<ResourceAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [newStickyText, setNewStickyText] = useState('');
  const [selectedColor, setSelectedColor] = useState<'yellow' | 'blue' | 'green' | 'pink' | 'purple'>('yellow');
  const [replyText, setReplyText] = useState('');
  const [activePage, setActivePage] = useState<number>(1);
  const [isPlacingNote, setIsPlacingNote] = useState<boolean>(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    if (!isOpen || !resource) return;
    let cancelled = false;

    const hydrate = async () => {
      if (!appConfig.liveApi) {
        const seed = resource.annotations?.length ? resource.annotations : demoSeed(resource.id);
        setAnnotations(seed);
        setSelectedAnnotationId(seed[0]?.id ?? null);
        return;
      }

      setLoadingNotes(true);
      try {
        const rows = await libraryService.listAnnotations(resource.id);
        if (cancelled) return;
        const mapped: ResourceAnnotation[] = rows.map((row, index) => ({
          id: row.id,
          resourceId: resource.id,
          author: row.author?.name || 'Staff',
          authorRole: (row.author?.roleLabel || '').toLowerCase().includes('student')
            ? 'student'
            : 'teacher',
          text: row.body,
          color: mapApiColour(row.colour),
          positionX: 20 + ((index * 17) % 60),
          positionY: 18 + ((index * 23) % 55),
          pageNumber: 1,
          createdAt: row.createdAt || 'Recently',
          replies: [],
        }));
        setAnnotations(mapped);
        setSelectedAnnotationId(mapped[0]?.id ?? null);
        onUpdateResource?.({ ...resource, annotations: mapped });
      } catch (error) {
        if (!cancelled) {
          setAnnotations([]);
          feedbackBus.error(getApiError(error).message);
        }
      } finally {
        if (!cancelled) setLoadingNotes(false);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resource?.id]);

  if (!isOpen || !resource) return null;

  const colorStyles: Record<string, { bg: string; border: string; text: string; ring: string }> = {
    yellow: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', ring: 'ring-amber-400' },
    blue: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-900', ring: 'ring-sky-400' },
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', ring: 'ring-emerald-400' },
    pink: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', ring: 'ring-rose-400' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', ring: 'ring-purple-400' }
  };

  const handleDocumentClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingNote) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const body =
      newStickyText.trim() ||
      'New note: Click to edit and provide guidance for students.';

    if (appConfig.liveApi) {
      try {
        const created = await libraryService.createAnnotation(resource.id, {
          body,
          colour: toUiColour(selectedColor),
          sectionId: 'section-1',
        });
        const newAnn: ResourceAnnotation = {
          id: created.id,
          resourceId: resource.id,
          author: created.author?.name || currentUserName,
          authorRole: currentUserRole === 'teacher' ? 'teacher' : 'student',
          text: created.body,
          color: mapApiColour(created.colour),
          positionX: Math.max(10, Math.min(85, x)),
          positionY: Math.max(10, Math.min(85, y)),
          pageNumber: activePage,
          createdAt: created.createdAt || 'Just now',
          replies: [],
        };
        const updated = [...annotations, newAnn];
        setAnnotations(updated);
        setSelectedAnnotationId(newAnn.id);
        setIsPlacingNote(false);
        setNewStickyText('');
        onUpdateResource?.({ ...resource, annotations: updated });
        feedbackBus.success('Annotation saved.');
      } catch (error) {
        feedbackBus.error(getApiError(error).message);
      }
      return;
    }

    const newAnn: ResourceAnnotation = {
      id: `ann-${Date.now()}`,
      resourceId: resource.id,
      author: `${currentUserName} (${currentUserRole === 'teacher' ? 'Teacher' : 'Student'})`,
      authorRole: currentUserRole === 'teacher' ? 'teacher' : 'student',
      text: body,
      color: selectedColor,
      positionX: Math.max(10, Math.min(85, x)),
      positionY: Math.max(10, Math.min(85, y)),
      pageNumber: activePage,
      createdAt: 'Just now',
      replies: []
    };

    const updated = [...annotations, newAnn];
    setAnnotations(updated);
    setSelectedAnnotationId(newAnn.id);
    setIsPlacingNote(false);
    setNewStickyText('');

    if (onUpdateResource) {
      onUpdateResource({ ...resource, annotations: updated });
    }
  };

  const handleAddReply = (annotationId: string) => {
    if (!replyText.trim()) return;
    const updated = annotations.map((ann) => {
      if (ann.id === annotationId) {
        return {
          ...ann,
          replies: [
            ...(ann.replies || []),
            {
              id: `rep-${Date.now()}`,
              author: `${currentUserName} (${currentUserRole === 'teacher' ? 'Teacher' : 'Student'})`,
              authorRole: currentUserRole,
              text: replyText.trim(),
              createdAt: 'Just now'
            }
          ]
        };
      }
      return ann;
    });

    setAnnotations(updated);
    setReplyText('');
    if (onUpdateResource) {
      onUpdateResource({ ...resource, annotations: updated });
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    if (appConfig.liveApi) {
      try {
        await libraryService.deleteAnnotation(resource.id, id);
      } catch (error) {
        feedbackBus.error(getApiError(error).message);
        return;
      }
    }
    const updated = annotations.filter((a) => a.id !== id);
    setAnnotations(updated);
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(updated.length > 0 ? updated[0].id : null);
    }
    if (onUpdateResource) {
      onUpdateResource({ ...resource, annotations: updated });
    }
  };

  const selectedAnnotation = annotations.find((a) => a.id === selectedAnnotationId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="modal-document-annotations"
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50/70 via-orange-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Collaborative Document Sticky Notes</h2>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800">
                  Live Annotation Layer
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Annotating: <span className="font-semibold text-slate-800">{resource.title}</span> ({resource.subject})
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

        {/* Action Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">Sticky Note Color:</span>
            <div className="flex items-center gap-1.5">
              {(['yellow', 'blue', 'green', 'pink', 'purple'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    color === 'yellow'
                      ? 'bg-amber-300 border-amber-400'
                      : color === 'blue'
                      ? 'bg-sky-300 border-sky-400'
                      : color === 'green'
                      ? 'bg-emerald-300 border-emerald-400'
                      : color === 'pink'
                      ? 'bg-rose-300 border-rose-400'
                      : 'bg-purple-300 border-purple-400'
                  } ${selectedColor === color ? 'ring-2 ring-indigo-600 scale-110' : 'opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlacingNote(!isPlacingNote)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                isPlacingNote
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-sm animate-pulse'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isPlacingNote ? 'Click on Document Canvas to Drop Note' : 'Add New Sticky Note'}</span>
            </button>
          </div>
        </div>

        {/* Main Canvas & Thread Split */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-100/50">
          {/* Document Canvas with Overlay Sticky Notes (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              onClick={handleDocumentClick}
              className={`relative w-full max-w-[500px] min-h-[580px] bg-white rounded-xl shadow-md border border-slate-200 p-8 select-none transition-all ${
                isPlacingNote ? 'cursor-crosshair ring-2 ring-amber-400' : 'cursor-default'
              }`}
            >
              {/* Document Mock Content */}
              <div className="space-y-4 text-slate-800 pointer-events-none opacity-85">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600">
                    {resource.subject} Module • Lesson Notes
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{resource.title}</h3>
                </div>

                <div className="space-y-2 text-[11px] leading-relaxed text-slate-600">
                  <p>
                    <strong>1. Core Theoretical Foundations:</strong> In this chapter, we examine the quantitative equations governing mechanical motion and energy states under conservative vector fields.
                  </p>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-[10px] text-slate-700">
                    Equation 3.2: F_net = m * (dv / dt) + v * (dm / dt)
                  </div>
                  <p>
                    <strong>2. Experimental Observations:</strong> Laboratory trials conducted across standardized trials demonstrate linear correlation when frictional coefficients remain strictly negligible.
                  </p>
                  <p>
                    <strong>3. Practice Problems for Students:</strong> Calculate the instantaneous velocity for a 4.5 kg mass falling freely from an elevation of 24 meters under standard acceleration g = 9.8 m/s².
                  </p>
                  <div className="h-32 bg-slate-50 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400">
                    [Diagram: Kinematic Trajectory Vector Decomposition]
                  </div>
                </div>
              </div>

              {/* Render Sticky Notes Overlay */}
              {annotations.map((ann) => {
                const isSelected = selectedAnnotationId === ann.id;
                const style = colorStyles[ann.color] || colorStyles.yellow;

                return (
                  <div
                    key={ann.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnnotationId(ann.id);
                    }}
                    style={{
                      left: `${ann.positionX}%`,
                      top: `${ann.positionY}%`
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-xl shadow-lg border cursor-pointer transition-all max-w-[170px] ${
                      style.bg
                    } ${style.border} ${isSelected ? 'scale-110 ring-2 ' + style.ring + ' z-20 shadow-xl' : 'hover:scale-105 z-10'}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1 border-b border-black/5 pb-1">
                      <span className="text-[9px] font-bold text-slate-800 truncate">
                        {ann.authorRole === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student'}
                      </span>
                      {ann.replies && ann.replies.length > 0 && (
                        <span className="text-[8.5px] font-bold px-1 bg-white/80 rounded-full text-slate-700">
                          {ann.replies.length}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] font-medium leading-tight line-clamp-3 ${style.text}`}>
                      {ann.text}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {isPlacingNote
                ? '🎯 Click anywhere on the white document page above to drop your sticky note.'
                : 'Click any note on the document to view full discussion thread or reply.'}
            </p>
          </div>

          {/* Right: Selected Sticky Note Discussion & Reply Thread (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs">
            {selectedAnnotation ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          selectedAnnotation.color === 'yellow'
                            ? 'bg-amber-400'
                            : selectedAnnotation.color === 'blue'
                            ? 'bg-sky-400'
                            : selectedAnnotation.color === 'green'
                            ? 'bg-emerald-400'
                            : selectedAnnotation.color === 'pink'
                            ? 'bg-rose-400'
                            : 'bg-purple-400'
                        }`}
                      />
                      <h4 className="text-xs font-bold text-slate-900">{selectedAnnotation.author}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedAnnotation.createdAt}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnotation(selectedAnnotation.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Main Note Text */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-900 leading-relaxed font-medium">
                  {selectedAnnotation.text}
                </div>

                {/* Reply Thread */}
                <div className="space-y-2.5 pt-2">
                  <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    Discussion & Student Responses ({selectedAnnotation.replies?.length || 0})
                  </h5>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedAnnotation.replies?.map((rep) => (
                      <div key={rep.id} className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-800">{rep.author}</span>
                          <span className="text-slate-400">{rep.createdAt}</span>
                        </div>
                        <p className="text-[11.5px] text-slate-700">{rep.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Reply Input */}
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add a teacher clarification or student reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddReply(selectedAnnotation.id);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleAddReply(selectedAnnotation.id)}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No note selected. Click any sticky note on the canvas or create a new one.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {annotations.length} collaborative sticky notes active on this document
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition-colors"
          >
            Done & Save Annotations
          </button>
        </div>
      </div>
    </div>
  );
};
