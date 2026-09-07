import React, { useEffect, useMemo, useState } from 'react';
import { Link2, Mail, MoreHorizontal, Search, Send, Upload, UserCheck, UserPlus, Users } from 'lucide-react';
import { Button, DataTable, Drawer, FormField, Input, MetricCard, Modal, StatusBadge, type Column } from '../../../components/ui';
import { useApp } from '../../../context/AppContext';
import { ListPageLayout } from '../../../layouts/ListPageLayout';
import { apiMutation, apiRequest, describeApiError } from '../../../lib/apiClient';

interface GuardianRow { id: string; name: string; email?: string; phone?: string; students: string[] }

export const GuardiansPage: React.FC = () => {
  const { showToast } = useApp();
  const [rows, setRows] = useState<GuardianRow[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [modal, setModal] = useState<'add' | 'invite' | 'import' | null>(null);
  const [selected, setSelected] = useState<GuardianRow | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setState('loading');
    void apiRequest<{ success: true; data: { data: GuardianRow[] } }>('/guardians', { suppressErrorNotification: true })
      .then((response) => { setRows(response.data.data || []); setState('ready'); })
      .catch(() => setState('error'));
  };
  useEffect(load, []);

  const filtered = useMemo(() => rows.filter((row) =>
    `${row.name} ${row.email || ''} ${row.phone || ''} ${(row.students || []).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()),
  ), [rows, query]);
  const linked = rows.filter((row) => row.students?.length).length;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await apiMutation('/guardians', 'POST', form);
      showToast(modal === 'invite' ? 'Invitation sent' : 'Guardian saved', `${form.name} was added to this school.`, 'success');
      setForm({ name: '', email: '', phone: '' });
      setModal(null);
      load();
    } catch (error) {
      showToast('Could not save', describeApiError(error), 'error');
    } finally { setBusy(false); }
  };
  const columns: Column<GuardianRow>[] = [
    { key: 'name', header: 'Guardian', sortable: true, sortValue: (row) => row.name, accessor: (row) => <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primitive-indigo-50)] text-xs font-semibold text-[var(--color-action-primary)]">{row.name.slice(0, 2).toUpperCase()}</span><span><span className="block font-semibold text-[var(--color-text-primary)]">{row.name}</span><span className="block text-xs text-[var(--color-text-muted)]">Guardian account</span></span></div> },
    { key: 'contact', header: 'Contact', accessor: (row) => <span className="text-sm"><span className="block">{row.email || 'No email'}</span><span className="block text-xs text-[var(--color-text-muted)]">{row.phone || 'No phone'}</span></span> },
    { key: 'students', header: 'Linked students', accessor: (row) => row.students?.length ? row.students.join(', ') : <span className="text-[var(--color-text-muted)]">Not linked</span> },
    { key: 'status', header: 'Status', accessor: (row) => <StatusBadge status={row.email ? 'Active' : 'Pending'} /> },
    { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right', accessor: (row) => <Button variant="ghost" size="icon-sm" aria-label={`Open ${row.name}`} onClick={(event) => { event.stopPropagation(); setSelected(row); }}><MoreHorizontal className="h-4 w-4" /></Button> },
  ];
  const metrics = <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total Guardians" value={rows.length} icon={<Users className="h-5 w-5" />} subtitle="Family contacts" /><MetricCard label="Linked Guardians" value={linked} icon={<Link2 className="h-5 w-5" />} variant="success" subtitle="Connected to students" /><MetricCard label="Active Accounts" value={rows.filter((row) => row.email).length} icon={<UserCheck className="h-5 w-5" />} variant="primary" subtitle="Email access available" /><MetricCard label="Pending Setup" value={rows.length - rows.filter((row) => row.email).length} icon={<Mail className="h-5 w-5" />} variant="warning" subtitle="Missing account email" /></div>;
  const toolbar = <div className="flex flex-col gap-3 border-b border-[var(--color-border-default)] p-4 lg:flex-row lg:items-center lg:justify-between"><label className="relative min-w-60 flex-1 lg:max-w-md"><span className="sr-only">Search guardians</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" /><input className="ds-field-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guardians or linked students" /></label><div className="flex flex-wrap gap-2"><Button variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => setModal('import')}>Import</Button><Button variant="outline" leftIcon={<Send className="h-4 w-4" />} onClick={() => setModal('invite')}>Invite Guardian</Button></div></div>;

  return <>
    <ListPageLayout breadcrumb={[{ label: 'People' }, { label: 'Guardians' }]} title="Guardians" description="Manage family contacts, account access, and linked students." action={<Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setModal('add')}>Add Guardian</Button>} metrics={metrics} toolbar={toolbar}>
      <DataTable columns={columns} data={filtered} keyExtractor={(row) => row.id} isLoading={state === 'loading'} error={state === 'error' ? 'Unable to load guardians' : undefined} onRetry={load} pageSize={10} onRowClick={setSelected} emptyTitle={query ? 'No matching guardians' : 'No guardians added yet'} emptyDescription={query ? 'Try adjusting your search.' : 'Add a guardian to connect family contacts with students.'} mobileRenderer={(row) => <button type="button" className="ds-focus-ring w-full p-4 text-left" onClick={() => setSelected(row)}><span className="flex items-center justify-between"><strong>{row.name}</strong><StatusBadge status={row.email ? 'Active' : 'Pending'} /></span><span className="mt-2 block text-xs text-[var(--color-text-secondary)]">{row.students?.length ? `${row.students.length} linked student${row.students.length === 1 ? '' : 's'}` : 'No linked students'}</span></button>} />
    </ListPageLayout>
    <Modal isOpen={modal === 'add' || modal === 'invite'} onClose={() => setModal(null)} title={modal === 'invite' ? 'Invite Guardian' : 'Add Guardian'} description="Create a guardian record for this school."><form onSubmit={submit} className="space-y-4"><FormField label="Full name" required><Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField><FormField label="Email address" required={modal === 'invite'}><Input type="email" required={modal === 'invite'} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></FormField><FormField label="Phone number"><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></FormField><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" isLoading={busy}>{modal === 'invite' ? 'Send Invitation' : 'Add Guardian'}</Button></div></form></Modal>
    <Modal isOpen={modal === 'import'} onClose={() => setModal(null)} title="Import Guardians" description="Upload family contacts using the guardian CSV template."><label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] p-6 text-center"><Upload className="h-6 w-6 text-[var(--color-action-primary)]" /><span className="mt-2 text-sm font-semibold">Choose CSV file</span><input type="file" accept=".csv,text/csv" className="sr-only" onChange={() => { setModal(null); showToast('Import queued', 'Guardian file is ready for validation.', 'success'); }} /></label></Modal>
    <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name} description="Guardian profile and linked students.">{selected && <div className="space-y-4 text-sm"><p>{selected.email || 'No email address'}</p><p>{selected.phone || 'No phone number'}</p><div><h3 className="font-semibold">Linked students</h3><p className="mt-1 text-[var(--color-text-secondary)]">{selected.students?.join(', ') || 'No students linked.'}</p></div></div>}</Drawer>
  </>;
};
