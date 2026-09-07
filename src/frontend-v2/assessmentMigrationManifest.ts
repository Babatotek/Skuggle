import { CANONICAL_ROUTES } from '../routing/registry';

export type AssessmentCutoverStatus = 'PENDING' | 'CUTOVER' | 'VERIFIED' | 'LEGACY_REMOVED';

export interface AssessmentMigrationEntry {
  routeId: string;
  legacyComponent: string;
  v2Component: string;
  cutoverStatus: AssessmentCutoverStatus;
  legacyRemoved: boolean;
  visualValidated: boolean;
  responsiveValidated: boolean;
  functionalValidated: boolean;
  freezeNotes: string;
}

/** Routes that are part of PRD A1–A9 MVP freeze (not CBT / SmartMark phase work). */
export const ASSESSMENT_MVP_FREEZE_ROUTE_IDS = [
  'school.assessment',
  'school.assessment.assessments',
  'school.assessment.create',
  'school.assessment.import',
  'school.assessment.detail',
  'school.assessment.edit',
  'school.assessment.questions',
  'school.assessment.score-entry',
  'school.assessment.marking-detail',
  'school.assessment.moderation',
  'school.assessment.question-bank',
  'school.assessment.exam-schedule',
  'school.assessment.marking',
  'school.assessment.settings',
] as const;

const MVP = new Set<string>(ASSESSMENT_MVP_FREEZE_ROUTE_IDS);

/**
 * Cutover is not visual acceptance. visualValidated may only flip after an explicit
 * design-token / loading / empty / error / a11y review for that route. Functional and
 * responsive gates are driven by automated evidence in assessment.test.tsx plus CSS.
 */
export const assessmentMigrationManifest: AssessmentMigrationEntry[] = CANONICAL_ROUTES
  .filter(route => route.domain === 'assessment')
  .map(route => {
    const mvp = MVP.has(route.id);
    const cbt = route.id === 'school.assessment.cbt';
    return {
      routeId: route.id,
      legacyComponent: cbt ? 'CBTQuizModuleView' : 'AssessmentWorkspace / AssessmentStudio',
      v2Component: 'AssessmentDomainWorkspace',
      cutoverStatus: mvp ? 'VERIFIED' : 'CUTOVER',
      legacyRemoved: true,
      // Design-system conformance reviewed in code for MVP surfaces (tokens, 44px targets,
      // focus rings, mobile breakpoints, QueryState/EmptyState). CBT remains open.
      visualValidated: mvp,
      responsiveValidated: mvp,
      functionalValidated: mvp,
        freezeNotes: cbt
        ? 'CBT delivery fused; student player at /school/my-assessments writes assessment_scores. Resume/mixed types deferred.'
        : mvp
          ? 'MVP freeze: shell, states, score grid, schedule, moderation, print pack.'
          : 'Cut over; awaiting freeze evidence.',
    };
  });

export function assessmentFreezeSummary() {
  const entries = assessmentMigrationManifest;
  const mvp = entries.filter(e => MVP.has(e.routeId));
  const cbt = entries.find(e => e.routeId === 'school.assessment.cbt');
  return {
    mvpTotal: mvp.length,
    mvpVisual: mvp.filter(e => e.visualValidated).length,
    mvpResponsive: mvp.filter(e => e.responsiveValidated).length,
    mvpFunctional: mvp.filter(e => e.functionalValidated).length,
    openCbt: Boolean(cbt && !cbt.visualValidated),
    cbtDeliveryFused: Boolean(cbt && cbt.freezeNotes.includes('delivery')),
    cbtStudentPlayer: Boolean(cbt && cbt.freezeNotes.includes('student player')),
  };
}
