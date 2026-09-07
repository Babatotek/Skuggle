export type StatusTone =
  | 'positive'
  | 'informational'
  | 'attention'
  | 'negative'
  | 'restricted'
  | 'neutral';

export interface StatusDefinition {
  tone: StatusTone;
  label?: string;
}

const REGISTRY: Record<string, StatusDefinition> = {
  not_entered: { tone: 'neutral', label: 'Missing' },
  entered: { tone: 'informational', label: 'Entered' },
  auto_marked: { tone: 'informational', label: 'Auto marked' },
  review_required: { tone: 'attention', label: 'Review required' },
  verified: { tone: 'positive', label: 'Verified' },
  moderated: { tone: 'positive', label: 'Moderated' },
  locked: { tone: 'restricted', label: 'Locked' },
  exempt: { tone: 'neutral', label: 'Exempt' },
  invalidated: { tone: 'negative', label: 'Invalidated' },
  marking: { tone: 'attention', label: 'Marking' },
  moderation: { tone: 'restricted', label: 'Moderation' },
  validated: { tone: 'positive', label: 'Validated' },
  reopened: { tone: 'attention', label: 'Reopened' },
  ready: { tone: 'informational', label: 'Ready' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
  paid: { tone: 'positive' },
  active: { tone: 'positive' },
  approved: { tone: 'positive' },
  published: { tone: 'positive' },
  present: { tone: 'positive' },
  completed: { tone: 'positive' },
  enrolled: { tone: 'positive' },
  passed: { tone: 'positive' },
  accepted: { tone: 'positive' },
  shortlisted: { tone: 'positive' },
  submitted: { tone: 'informational' },
  received: { tone: 'informational' },
  screening: { tone: 'informational' },
  screened: { tone: 'informational' },
  offered: { tone: 'informational' },
  scheduled: { tone: 'informational' },
  graded: { tone: 'informational' },
  excused: { tone: 'informational' },
  pending: { tone: 'attention' },
  partial: { tone: 'attention' },
  'pending approval': { tone: 'attention' },
  'in review': { tone: 'attention' },
  'under review': { tone: 'attention' },
  'requires review': { tone: 'attention' },
  waitlisted: { tone: 'attention' },
  'in progress': { tone: 'attention' },
  late: { tone: 'attention' },
  overdue: { tone: 'negative' },
  rejected: { tone: 'negative' },
  declined: { tone: 'negative' },
  withdrawn: { tone: 'negative' },
  failed: { tone: 'negative' },
  absent: { tone: 'negative' },
  'at-risk': { tone: 'negative' },
  suspended: { tone: 'restricted' },
  restricted: { tone: 'restricted' },
  inactive: { tone: 'neutral' },
  draft: { tone: 'neutral' },
  unpublished: { tone: 'neutral' },
};

export function resolveStatus(value?: string): StatusDefinition {
  if (!value) return { tone: 'neutral' };
  return REGISTRY[value.trim().toLowerCase()] ?? { tone: 'neutral' };
}

export function registerStatus(key: string, definition: StatusDefinition): void {
  REGISTRY[key.trim().toLowerCase()] = definition;
}
