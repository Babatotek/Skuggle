import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, StatusBadge } from '../../components/ui';
import { WorkspaceLandingLayout } from '../../layouts/WorkspaceLandingLayout';
import { buildRoute } from '../../routing/builders';
import { describeApiError, listStudentCbt, type StudentCbtListItem } from './api';
import './student-cbt.css';

function windowCopy(item: StudentCbtListItem): string {
  if (!item.availableFrom || !item.availableUntil) return 'Window not set';
  const fmt = new Intl.DateTimeFormat('en-NG', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `${fmt.format(new Date(item.availableFrom))} – ${fmt.format(new Date(item.availableUntil))}`;
}

export default function StudentCbtList() {
  const [items, setItems] = useState<StudentCbtListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    void listStudentCbt()
      .then(r => setItems(r.data.data))
      .catch(e => setError(describeApiError(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <WorkspaceLandingLayout
      className="student-cbt"
      title="My CBT Assessments"
      description="Take assigned computer-based assessments during their open window."
      breadcrumb={[{ label: 'Home', href: buildRoute('school.home') }, { label: 'My CBT Assessments' }]}
    >
      {loading && <div className="student-cbt-skeleton" role="status" aria-label="Loading CBT assessments"><div /><div /></div>}
      {error && <div className="student-cbt-error" role="alert"><p>{error}</p><Button variant="outline" onClick={load}>Retry</Button></div>}
      {!loading && !error && items.length === 0 && <EmptyState title="No CBT assessments assigned." description="When your school activates an online assessment for your class, it will appear here." />}
      {!loading && !error && items.length > 0 && (
        <ul className="student-cbt-list">
          {items.map(item => (
            <li key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <small>{item.className} · {item.subject} · {item.durationMinutes} min · {item.questionCount} questions</small>
                <small>{windowCopy(item)}</small>
              </div>
              <div className="student-cbt-actions">
                <StatusBadge status={item.submitted ? 'submitted' : item.windowState} />
                {item.canAttempt ? (
                  <Link className="student-cbt-link" to={buildRoute('school.student-cbt.take', { assessmentPublicId: item.id })}>Start</Link>
                ) : (
                  <span className="student-cbt-muted">{item.submitted ? 'Submitted' : item.windowState === 'upcoming' ? 'Upcoming' : 'Unavailable'}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </WorkspaceLandingLayout>
  );
}
