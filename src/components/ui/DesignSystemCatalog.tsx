import React, { useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { Button, IconButton } from './Button';
import { Checkbox, Radio, Switch } from './Controls';
import { Field, Input, Select, Textarea } from './FormField';
import { SegmentedControl, Tabs } from './Navigation';
import { StatusBadge } from './StatusBadge';

/** Development-only local catalog. It is intentionally not imported by the production application. */
export function DesignSystemCatalog() {
  const [enabled, setEnabled] = useState(false); const [segment, setSegment] = useState('one'); const [tab, setTab] = useState('default');
  return <main className="space-y-8 bg-[var(--color-bg-canvas)] p-6 text-[var(--color-text-primary)]">
    <header><h1 className="text-2xl font-bold">Wave 2 component catalog</h1><p className="text-sm text-[var(--color-text-secondary)]">Keyboard, long-content, disabled, invalid, loading, density and reduced-motion reference.</p></header>
    <section aria-labelledby="catalog-actions"><h2 id="catalog-actions" className="mb-3 text-lg font-bold">Actions</h2><div className="flex flex-wrap gap-3"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button><Button variant="link">Link</Button><Button isLoading>Saving</Button><Button disabled>Reason in nearby help</Button><IconButton label="Delete record" icon={<Trash2 className="h-4 w-4" />} /></div></section>
    <section aria-labelledby="catalog-fields" className="grid gap-4 sm:grid-cols-2"><h2 id="catalog-fields" className="col-span-full text-lg font-bold">Fields</h2><Field label="Full name" hint="Long names wrap; they are never shrunk."><Input defaultValue="Adaeze Chiamaka Nwankwo-Adeyemi" /></Field><Field label="Admission number" error="Use the assigned admission number." required><Input aria-invalid defaultValue="" /></Field><Field label="Class"><Select><option>JSS 1</option></Select></Field><Field label="Notes"><Textarea /></Field></section>
    <section aria-labelledby="catalog-choice"><h2 id="catalog-choice" className="mb-3 text-lg font-bold">Choice</h2><div className="space-y-3"><Checkbox label="Include inactive students" /><Radio name="scope" label="Current class" /><Switch checked={enabled} onCheckedChange={setEnabled} label="Notify guardian" /></div></section>
    <section aria-labelledby="catalog-status"><h2 id="catalog-status" className="mb-3 text-lg font-bold">Status</h2><div className="flex flex-wrap gap-2">{['Paid', 'Submitted', 'Pending Approval', 'Rejected', 'Suspended', 'Draft'].map((status) => <StatusBadge key={status} status={status} />)}<StatusBadge tone="informational"><Sparkles className="h-3.5 w-3.5" /> AI</StatusBadge></div></section>
    <section aria-labelledby="catalog-navigation"><h2 id="catalog-navigation" className="mb-3 text-lg font-bold">Navigation and local state</h2><SegmentedControl label="Catalog density" value={segment} onValueChange={setSegment} segments={[{ value: 'one', label: 'Comfortable' }, { value: 'two', label: 'Compact' }]} /><Tabs label="Component states" value={tab} onValueChange={setTab} items={[{ id: 'default', label: 'Default', panel: <p className="p-4">Default state</p> }, { id: 'mobile', label: 'Mobile', panel: <p className="p-4">Test at a narrow viewport.</p> }]} /></section>
  </main>;
}

