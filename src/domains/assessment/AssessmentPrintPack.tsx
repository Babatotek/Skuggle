import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui';
import { useAssessmentQuery } from './api';
import { Panel, QueryState, shortDate } from './components';
import { label } from './types';

type PrintQuestion = {
  number: number;
  section?: string | null;
  prompt: string;
  questionType: string;
  options: string[];
  marks: number;
  correctAnswer?: string;
  rationale?: string;
};

type PrintCandidate = {
  number: number;
  id: string;
  name: string;
  admissionNumber: string | null;
  scanCode?: string;
  qrSvg?: string;
};

type OmrItem = {
  number: number;
  choices: string[];
  questionType: string;
  prompt: string;
  marks: number;
};

type OmrLayout = {
  enabled: boolean;
  itemCount: number;
  instructions: string;
  items: OmrItem[];
  answerKey: string[] | null;
};

type PrintPack = {
  header: {
    assessmentId: string;
    code?: string | null;
    title: string;
    className: string;
    subject?: string | null;
    session?: string | null;
    term?: string | null;
    date?: string | null;
    startTime?: string | null;
    duration: number;
    venue?: string | null;
    invigilator?: string | null;
    instructions?: string | null;
    maximumScore: number;
    delivery: string;
    identifier: string;
    qrSvg?: string;
  };
  questions: PrintQuestion[];
  candidates: PrintCandidate[];
  omr?: OmrLayout;
  variants: string[];
};

const VARIANT_LABELS: Record<string, string> = {
  candidate: 'Candidate Paper',
  examiner: 'Examiner Copy',
  scheme: 'Marking Scheme',
  'answer-sheet': 'Answer Sheet',
  'omr-sheet': 'SmartMark OMR Sheet',
  register: 'Attendance Register',
};

function Bubble({ letter }: { letter: string }) {
  return (
    <span className="assessment-omr-bubble" aria-hidden>
      <span>{letter}</span>
    </span>
  );
}

function OmrSheet({
  pack,
  candidate,
  showKey,
}: {
  pack: PrintPack;
  candidate?: PrintCandidate | null;
  showKey?: boolean;
}) {
  const omr = pack.omr;
  if (!omr || omr.items.length === 0) {
    return <p className="assessment-muted">Attach multiple-choice or true/false questions to generate an OMR bubble sheet for SmartMark scanning.</p>;
  }

  return (
    <div className="assessment-omr-sheet">
      <div className="assessment-omr-identity">
        <div>
          <p className="assessment-omr-label">SmartMark optical script</p>
          <p className="assessment-omr-name">{candidate?.name || 'Candidate name: _______________________________'}</p>
          <p className="assessment-omr-admission">
            Admission:{' '}
            <strong className="assessment-omr-admission">{candidate?.admissionNumber || '____________________'}</strong>
          </p>
          <p className="assessment-omr-scan-code">{candidate?.scanCode || `SM|${pack.header.assessmentId}|ADMISSION`}</p>
        </div>
        <div className="assessment-omr-meta">
          {(candidate?.qrSvg || pack.header.qrSvg) && (
            <img className="assessment-omr-qr" src={candidate?.qrSvg || pack.header.qrSvg || ''} alt="Scan code QR" width={96} height={96} />
          )}
          <p>{pack.header.className}</p>
          <p>{pack.header.subject}</p>
          <p>{pack.header.identifier}</p>
          {pack.header.code && <p>Code {pack.header.code}</p>}
        </div>
      </div>
      <p className="assessment-omr-instructions">{omr.instructions}</p>
      <div className="assessment-omr-grid">
        {omr.items.map((item, index) => (
          <div className="assessment-omr-row" key={item.number}>
            <span className="assessment-omr-number">{item.number}</span>
            <div className="assessment-omr-choices">
              {item.choices.map(choice => (
                <label key={choice} className="assessment-omr-choice">
                  <Bubble letter={choice} />
                  <span className="sr-only">Question {item.number} option {choice}</span>
                </label>
              ))}
            </div>
            {showKey && omr.answerKey?.[index] && (
              <span className="assessment-omr-key">Key {omr.answerKey[index]}</span>
            )}
          </div>
        ))}
      </div>
      <p className="assessment-omr-footer-note">Shade one bubble only · Total marks {pack.header.maximumScore}</p>
    </div>
  );
}

export default function AssessmentPrintPack({ assessmentId }: { assessmentId: string }) {
  const query = useAssessmentQuery<PrintPack>(`/assessments/${assessmentId}/papers?answers=1`);
  const pack = query.data;
  const [variant, setVariant] = useState('candidate');
  const [omrMode, setOmrMode] = useState<'blank' | 'roster' | 'key'>('roster');

  useEffect(() => {
    if (!pack) return;
    if (pack.header.delivery === 'smartmark' && pack.variants.includes('omr-sheet')) {
      setVariant('omr-sheet');
    }
  }, [pack?.header.assessmentId, pack?.header.delivery]);

  const headerBits = useMemo(() => {
    if (!pack) return [];
    const h = pack.header;
    return [
      h.className,
      h.subject,
      h.session,
      h.term,
      shortDate(h.date || null),
      h.startTime ? `${h.startTime} · ${h.duration} min` : `${h.duration} min`,
      h.venue,
      h.invigilator ? `Invigilator: ${h.invigilator}` : null,
    ].filter(Boolean);
  }, [pack]);

  return (
    <Panel title="Printable Assessment Pack">
      <QueryState query={query} name="printable pack" />
      {pack && (
        <>
          <div className="assessment-actions assessment-print-controls">
            {pack.variants.map(id => (
              <Button key={id} variant={variant === id ? 'primary' : 'outline'} onClick={() => setVariant(id)}>
                {VARIANT_LABELS[id] || label(id)}
              </Button>
            ))}
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
          </div>
          {variant === 'omr-sheet' && (
            <div className="assessment-filters assessment-print-controls">
              <label>OMR print mode
                <select value={omrMode} onChange={e => setOmrMode(e.target.value as typeof omrMode)}>
                  <option value="roster">One sheet per student (roster)</option>
                  <option value="blank">Blank template</option>
                  <option value="key">Teacher key (shaded answers)</option>
                </select>
              </label>
              {pack.omr && (
                <p className="assessment-muted">
                  {pack.omr.itemCount} bubble item(s)
                  {pack.omr.answerKey ? ` · Key ${pack.omr.answerKey.join(',')}` : ''}
                  {pack.header.delivery === 'smartmark' ? ' · Ready for SmartMark rescan' : ''}
                </p>
              )}
            </div>
          )}
          <div className="assessment-print-pack" data-variant={variant}>
            {variant !== 'omr-sheet' && (
              <header className="assessment-print-header">
                <p className="assessment-print-brand">Skuggle Assessment Pack</p>
                <h2>{pack.header.title}</h2>
                <p>{headerBits.join(' · ')}</p>
                <p className="assessment-muted">{VARIANT_LABELS[variant]} · {pack.header.identifier}{pack.header.code ? ` · ${pack.header.code}` : ''}</p>
                {pack.header.instructions && variant !== 'register' && <p>{pack.header.instructions}</p>}
              </header>
            )}

            {(variant === 'candidate' || variant === 'examiner' || variant === 'scheme') && (
              <ol className="assessment-print-questions">
                {pack.questions.map(q => (
                  <li key={q.number}>
                    <h3>{q.section ? `${q.section} · ` : ''}{q.number}. {q.prompt} <span>({q.marks} marks)</span></h3>
                    {q.options.length > 0 && (
                      <ol type="A">
                        {q.options.map((option, i) => <li key={`${q.number}:${i}`}>{option}</li>)}
                      </ol>
                    )}
                    {variant === 'scheme' && (
                      <p className="assessment-print-scheme">
                        Answer: {q.correctAnswer || '—'}
                        {q.rationale ? ` · ${q.rationale}` : ''}
                      </p>
                    )}
                    {variant === 'examiner' && q.correctAnswer && (
                      <p className="assessment-print-scheme">Key: {q.correctAnswer}</p>
                    )}
                  </li>
                ))}
                {pack.questions.length === 0 && <p className="assessment-muted">No questions attached. Score-only assessments still support the register and answer sheet.</p>}
              </ol>
            )}

            {variant === 'answer-sheet' && (
              <div className="assessment-print-answer-sheet">
                <p>Candidate name: ________________________________</p>
                <p>Admission number: ______________________________</p>
                <table>
                  <thead><tr><th>#</th><th>Response</th><th>Marks</th></tr></thead>
                  <tbody>
                    {(pack.questions.length ? pack.questions : Array.from({ length: 10 }, (_, i) => ({ number: i + 1, marks: '' as unknown as number }))).map(q => (
                      <tr key={q.number}><td>{q.number}</td><td /><td>{typeof q.marks === 'number' ? q.marks : ''}</td></tr>
                    ))}
                  </tbody>
                </table>
                <p>Total / {pack.header.maximumScore}</p>
                {pack.variants.includes('omr-sheet') && (
                  <p className="assessment-muted">For optical SmartMark scoring, use the SmartMark OMR Sheet variant instead of this write-in sheet.</p>
                )}
              </div>
            )}

            {variant === 'omr-sheet' && (
              <div className="assessment-omr-pack">
                <header className="assessment-print-header assessment-omr-pack-header">
                  <p className="assessment-print-brand">Skuggle SmartMark OMR</p>
                  <h2>{pack.header.title}</h2>
                  <p>{headerBits.join(' · ')}</p>
                </header>
                {omrMode === 'blank' && <OmrSheet pack={pack} />}
                {omrMode === 'key' && <OmrSheet pack={pack} showKey />}
                {omrMode === 'roster' && (
                  <>
                    {pack.candidates.length === 0 && <p className="assessment-muted">No roster students yet. Print a blank template, or enrol students first.</p>}
                    {pack.candidates.map(candidate => (
                      <div className="assessment-omr-page" key={candidate.id}>
                        <OmrSheet pack={pack} candidate={candidate} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {variant === 'register' && (
              <table className="assessment-print-register">
                <thead>
                  <tr><th>#</th><th>Admission</th><th>Name</th><th>Present</th><th>Absent</th><th>Signature</th></tr>
                </thead>
                <tbody>
                  {pack.candidates.map(c => (
                    <tr key={c.id}>
                      <td>{c.number}</td>
                      <td>{c.admissionNumber || '—'}</td>
                      <td>{c.name}</td>
                      <td /><td /><td />
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <footer className="assessment-print-footer">
              <span>Generated for school use</span>
              <span>{pack.header.identifier}</span>
            </footer>
          </div>
        </>
      )}
    </Panel>
  );
}
