export interface Assessment {
  id: string; title: string; type: string; classId: string; className: string; subjectId: string; subject: string;
  date: string | null; scheduledAt: string | null; availableFrom?: string | null; availableUntil?: string | null;
  maxScore: number; status: string; delivery: string;
  marked: number; expected: number; revision: number; scoreEntryAllowed: boolean;
  metadata: Partial<AssessmentInput> & { lockedAt?: string; lockVersion?: number };
}
export interface AssessmentInput {
  title: string; classId: string; subjectId: string; assessmentTypeId: string; date: string; maxScore: number;
  instructions: string; description: string; weighting: number; code: string; participantMode: 'class' | 'selected';
  studentIds: string[]; contentMode: 'score-only' | 'questions'; delivery: string; startTime: string;
  duration: number; venue: string; invigilator: string;
}
export interface Page<T> { data: T[]; meta: { currentPage: number; perPage?: number; total: number; lastPage: number } }
export interface Lookup { id: string; name: string; classIds?: string[] }
export interface Lookups { classes: Lookup[]; subjects: Lookup[]; assessmentTypes: Lookup[]; session: Lookup; term: Lookup }
export interface Overview {
  metrics: { active: number; marking: number; scheduled: number; moderation: number };
  workflow: Record<string, number>; myWork: Assessment[]; recent: Assessment[]; upcoming: Assessment[];
  trend: { month: string; assessments: number; completed: number }[];
  coverage: { id: string; className: string; subject: string; planned: number; completed: number; marked: number }[];
}
export interface Question { id: string; prompt: string; questionType: string; options: string[]; correctAnswer: string; rationale: string; marks: number; difficulty: string; topic: string; curriculum: string; status: string; aiGenerated: boolean; position?: number; section?: string; rubric?: { label: string; maxMarks: number }[] }
export interface ScoreRow { id: string; admissionNumber: string; fullName: string; score: number | null; state: string; comment: string }
export interface Scores { assessmentId: string; title: string; maxScore: number; status: string; editable: boolean; revision: string; students: ScoreRow[] }
export const ASSESSMENT_TYPES = ['continuous-assessment', 'quiz', 'test', 'mid-term-test', 'exam', 'assignment', 'project', 'practical', 'oral', 'presentation'];
export const QUESTION_TYPES = ['multiple-choice', 'true-false', 'multiple-response', 'fill-blank', 'short-answer', 'essay', 'calculation', 'matching'];
export const label = (value: string) => value === 'exam' ? 'Examination' : value.replaceAll(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
