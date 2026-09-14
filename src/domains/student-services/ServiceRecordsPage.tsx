import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MoreVertical, Plus, Search } from 'lucide-react';
import {
  Button,
  DataTable,
  FormField,
  Input,
  Modal,
  Select,
  StatusBadge,
  type Column,
} from '../../components/ui';
import { useApp } from '../../context/AppContext';
import { ListPageLayout } from '../../layouts/ListPageLayout';
import { describeApiError } from '../../lib/apiClient';
import { createServiceRecord, listServiceRecords, updateServiceRecord } from './api';
import { StudentServicesContextNav } from './components';
import type { ServiceModuleDefinition, ServiceRecord } from './types';

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function detailsFor(row: ServiceRecord, definition: ServiceModuleDefinition | null): string {
  if (!definition) return '—';
  return definition.fields
    .map((field) => row.payload?.[field.key])
    .filter(Boolean)
    .slice(0, 3)
    .join(' · ') || '—';
}

export const ServiceRecordsPage: React.FC<{
  moduleKey: string;
  title: string;
  description: string;
}> = ({ moduleKey, title, description }) => {
  const { showToast } = useApp();
  const [definition, setDefinition] = useState<ServiceModuleDefinition | null>(null);
  const [rows, setRows] = useState<ServiceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewer, setViewer] = useState<ServiceRecord | null>(null);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ title: '', status: '' });
  const menuRef = useRef<HTMLDivElement | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    listServiceRecords(moduleKey, { page, q: query.trim() || undefined, status })
      .then((response) => {
        setDefinition(response.data.definition);
        setRows(response.data.data);
        setTotal(response.data.meta.total);
      })
      .catch((err) => setError(describeApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [moduleKey, page, status]);

  useEffect(() => {
    setPage(1);
    setQuery('');
    setStatus('ALL');
    setEditorOpen(false);
    setViewer(null);
    setEditing(null);
  }, [moduleKey]);

  useEffect(() => {
    if (!menuId) return;
    const onPointer = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuId(null);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [menuId]);

  const openCreate = () => {
    setEditing(null);
    const next: Record<string, string> = { title: '', status: definition?.statuses[0] || '' };
    definition?.fields.forEach((field) => {
      next[field.key] = '';
    });
    setForm(next);
    setEditorOpen(true);
  };

  const openEdit = (row: ServiceRecord) => {
    setMenuId(null);
    setEditing(row);
    setForm({
      title: row.title,
      status: row.status,
      ...Object.fromEntries((definition?.fields ?? []).map((field) => [field.key, row.payload?.[field.key] ?? ''])),
    });
    setEditorOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!definition) return;
    setBusy(true);
    const payload: Record<string, string> = {};
    definition.fields.forEach((field) => {
      payload[field.key] = form[field.key] || '';
    });
    const title = form.title.trim() || payload[definition.fields[0]?.key || ''] || 'Untitled';
    const body = { title, status: form.status || definition.statuses[0], payload };
    try {
      if (editing) await updateServiceRecord(moduleKey, editing.id, body);
      else await createServiceRecord(moduleKey, body);
      showToast(editing ? 'Record updated' : 'Record created', `${title} was saved.`, 'success');
      setEditorOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      showToast('Could not save record', describeApiError(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = useMemo<Column<ServiceRecord>[]>(() => [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      accessor: (row) => <span className="font-semibold text-[var(--color-text-primary)]">{row.title}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'details',
      header: 'Details',
      priority: 'secondary',
      accessor: (row) => <span className="text-[var(--color-text-secondary)]">{detailsFor(row, definition)}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      priority: 'optional',
      sortable: true,
      sortValue: (row) => row.createdAt || '',
      accessor: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      accessor: (row) => (
        <div className="relative inline-flex justify-end" ref={menuId === row.id ? menuRef : undefined}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${row.title}`}
            aria-haspopup="menu"
            aria-expanded={menuId === row.id}
            onClick={(event) => {
              event.stopPropagation();
              setMenuId((current) => (current === row.id ? null : row.id));
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          {menuId === row.id && (
            <div role="menu" className="absolute right-0 top-9 z-[var(--z-popover)] w-36 overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] py-1 shadow-[var(--shadow-overlay)]">
              <button type="button" role="menuitem" className="block w-full px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]" onClick={() => { setMenuId(null); setViewer(row); }}>View</button>
              <button type="button" role="menuitem" className="block w-full px-3 py-2 text-left text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]" onClick={() => openEdit(row)}>Edit</button>
            </div>
          )}
        </div>
      ),
    },
  ], [definition, menuId]);

  const toolbar = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <label className="relative block min-w-0 flex-1">
        <span className="sr-only">Search records</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setPage(1);
              load();
            }
          }}
          placeholder={`Search ${title.toLowerCase()} records`}
          className="pl-9"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="min-w-40"
        >
          <option value="ALL">All statuses</option>
          {(definition?.statuses ?? []).map((item) => (
            <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>
          ))}
        </Select>
        <Button type="button" variant="outline" onClick={() => { setPage(1); load(); }}>Search</Button>
      </div>
    </div>
  );

  return (
    <ListPageLayout
      breadcrumb={[{ label: 'Student services', href: '/school/student-services' }, { label: title }]}
      title={title}
      description={description}
      action={<Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>Add record</Button>}
      nav={<StudentServicesContextNav />}
      toolbar={toolbar}
    >
      <DataTable<ServiceRecord>
        columns={columns}
        data={rows}
        keyExtractor={(row) => row.id}
        isLoading={loading}
        error={error ? <p>{error}</p> : undefined}
        onRetry={load}
        emptyTitle={`No ${title.toLowerCase()} records yet`}
        emptyDescription="Create the first record to start tracking this service area."
        emptyAction={{ label: 'Add record', onClick: openCreate }}
        page={page}
        totalItems={total}
        pageSize={10}
        onPageChange={setPage}
        caption={`${title} records`}
      />

      <Modal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? `Edit ${title.toLowerCase()} record` : `Add ${title.toLowerCase()} record`}
        description="Complete the required fields and save. Changes stay scoped to this school."
        size="lg"
      >
        <form className="space-y-4" onSubmit={save}>
          <FormField label="Title" required>
            <Input required value={form.title || ''} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder={`${title} title`} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            {(definition?.fields ?? []).map((field) => (
              <FormField key={field.key} label={field.label} required={field.required} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
                {field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    value={form[field.key] || ''}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    rows={4}
                    className="ds-field-control min-h-24 w-full rounded-[var(--radius-control)] border border-[var(--color-border-default)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  />
                ) : (
                  <Input
                    required={field.required}
                    type={field.type === 'date' ? 'date' : 'text'}
                    value={form[field.key] || ''}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    placeholder={field.label}
                  />
                )}
              </FormField>
            ))}
            <FormField label="Status" required>
              <Select required value={form.status || definition?.statuses[0] || ''} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                {(definition?.statuses ?? []).map((item) => (
                  <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create record'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(viewer)} onClose={() => setViewer(null)} title={viewer?.title || title} description={`${title} record details`}>
        {viewer && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <StatusBadge status={viewer.status} />
              <p className="text-xs text-[var(--color-text-muted)]">Created {formatDate(viewer.createdAt)}</p>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              {(definition?.fields ?? []).map((field) => (
                <div key={field.key}>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{field.label}</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-primary)]">{viewer.payload?.[field.key] || '—'}</dd>
                </div>
              ))}
            </dl>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setViewer(null); openEdit(viewer); }}>Edit</Button>
              <Button type="button" onClick={() => setViewer(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </ListPageLayout>
  );
};
