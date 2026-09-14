import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui';
import { ListPageLayout } from '../../layouts/ListPageLayout';
import { buildRoute } from '../../routing/builders';
import { STUDENT_SERVICE_SECTIONS, type StudentServiceSectionId } from '../../routing/studentServices';
import { StudentServicesContextNav } from './components';
import { ServiceRecordsPage } from './ServiceRecordsPage';

export { StudentServicesContextNav } from './components';

export const StudentServicesLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Student services', href: '/school/student-services' }, { label: 'Library' }]}
      title="Library"
      description="Learning resources and library materials live in the dedicated Learning Resources workspace."
      nav={<StudentServicesContextNav />}
    >
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-status-information-bg)] text-[var(--color-status-information-text)]">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Open Learning Resources</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Browse, annotate, and assign curriculum resources from the full library experience. This tab keeps Student Services connected while the operational library lives under Learning.
            </p>
          </div>
          <Button leftIcon={<ArrowUpRight className="h-4 w-4" />} onClick={() => navigate(buildRoute('school.learning-resources'))}>
            Go to Learning Resources
          </Button>
        </div>
      </div>
    </ListPageLayout>
  );
};

export const StudentServicesPage: React.FC<{ sectionId?: string }> = ({ sectionId = 'behaviour' }) => {
  const section = STUDENT_SERVICE_SECTIONS.find((item) => item.id === sectionId)
    ?? STUDENT_SERVICE_SECTIONS[0];

  if (section.id === 'library') {
    return <StudentServicesLibraryPage />;
  }

  return (
    <ServiceRecordsPage
      moduleKey={section.moduleKey as string}
      title={section.label}
      description={section.description}
    />
  );
};

export function studentServicesSectionFromRoute(routeId: string, pageContextSection?: string): StudentServiceSectionId {
  if (pageContextSection && STUDENT_SERVICE_SECTIONS.some((item) => item.id === pageContextSection)) {
    return pageContextSection as StudentServiceSectionId;
  }
  const match = STUDENT_SERVICE_SECTIONS.find((item) => item.routeId === routeId);
  return match?.id ?? 'behaviour';
}
