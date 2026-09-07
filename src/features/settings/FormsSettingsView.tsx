import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, GripVertical, Lock, Plus, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button, Drawer, Input, PageHeader, SearchInput, Select } from '../../components/ui';
import { FormField, Textarea } from '../../components/ui/FormField';
import { describeApiError } from '../../lib/apiClient';
import { addFormField, fetchFieldLibrary, fetchFormDefinition, fetchFormGroups, resetFormDefinition, saveFormDefinition } from '../../lib/forms/api';
import { ANSWER_TYPE_LABELS, type FieldTemplate, type FormDefinition, type FormFieldDefinition, type FormGroup } from '../../lib/forms/types';
import { DynamicFormRenderer } from '../../components/forms/DynamicFormRenderer';

const CATEGORY_LABELS: Record<string, string> = {
  people: 'People',
  admissions: 'Admissions',
  academics: 'Academics',
};

const FIELD_ROLE_OPTIONS = [
  ['school_super_admin', 'School Super Admin'], ['school_admin', 'School Admin'], ['principal', 'Principal'],
  ['teacher', 'Teacher'], ['parent', 'Parent'], ['student', 'Student'],
] as const;

export const FormsSettingsView: React.FC = () => {
  const { showToast } = useApp();
  const [groups, setGroups] = useState<FormGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFormKey, setActiveFormKey] = useState<string | null>(null);
  const [form, setForm] = useState<FormDefinition | null>(null);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [library, setLibrary] = useState<{ suggested: FieldTemplate[]; templates: FieldTemplate[] }>({ suggested: [], templates: [] });
  const [customMode, setCustomMode] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customType, setCustomType] = useState('short_answer');
  const [customRequired, setCustomRequired] = useState(false);
  const [customSection, setCustomSection] = useState('additional');
  const [customOptions, setCustomOptions] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string | boolean | number>>({});
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      setGroups(await fetchFormGroups());
    } catch (error) {
      showToast('Could not load forms', describeApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const openCustomizer = useCallback(async (formKey: string) => {
    setBusy(true);
    try {
      const definition = await fetchFormDefinition(formKey);
      setForm(definition);
      setActiveFormKey(formKey);
    } catch (error) {
      showToast('Could not open form', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  }, [showToast]);

  const loadLibrary = useCallback(async (formKey: string, search?: string) => {
    try {
      const data = await fetchFieldLibrary(formKey, search);
      setLibrary({ suggested: data.suggested, templates: data.templates });
    } catch {
      setLibrary({ suggested: [], templates: [] });
    }
  }, []);

  useEffect(() => { void loadGroups(); }, [loadGroups]);

  useEffect(() => {
    if (addOpen && activeFormKey) void loadLibrary(activeFormKey, librarySearch);
  }, [addOpen, activeFormKey, librarySearch, loadLibrary]);

  const allFields = useMemo(() => {
    if (!form) return [];
    return form.sections.flatMap((section) =>
      section.fields.map((field) => ({ ...field, sectionKey: field.sectionKey ?? section.key, sectionName: section.name })),
    );
  }, [form]);

  const sectionOptions = useMemo(() => form?.sections.map((s) => ({ key: s.key, name: s.name })) ?? [], [form]);
  const editingField = useMemo(() => allFields.find((field) => field.id === editingFieldId) ?? null, [allFields, editingFieldId]);

  const patchField = (fieldId: number, patch: Partial<FormFieldDefinition>) => {
    if (!form) return;
    setForm({
      ...form,
      sections: form.sections.map((section) => ({
        ...section,
        fields: section.fields.map((field) => field.id === fieldId ? { ...field, ...patch } : field),
      })),
    });
  };

  const moveField = (fieldId: number, direction: -1 | 1) => {
    if (!form) return;
    const fields = [...allFields];
    const index = fields.findIndex((f) => f.id === fieldId);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const swapped = [...fields];
    [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
    setForm({
      ...form,
      sections: form.sections.map((section) => ({
        ...section,
        fields: swapped
          .filter((f) => (f.sectionKey ?? section.key) === section.key)
          .map((f, i) => ({ ...f, sortOrder: i })),
      })),
    });
  };

  const moveSection = (sectionKey: string, direction: -1 | 1) => {
    if (!form) return;
    const sections = [...form.sections];
    const index = sections.findIndex((section) => section.key === sectionKey);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sections.length) return;
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setForm({ ...form, sections: sections.map((section, sortOrder) => ({ ...section, sortOrder })) });
  };

  const addSection = () => {
    if (!form) return;
    const name = window.prompt('Section name');
    if (!name?.trim()) return;
    const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'section';
    let key = base;
    let suffix = 2;
    while (form.sections.some((section) => section.key === key)) key = `${base}_${suffix++}`;
    setForm({ ...form, sections: [...form.sections, { key, name: name.trim(), sortOrder: form.sections.length, isCustomizable: true, fields: [] }] });
  };

  const moveFieldToSection = (field: FormFieldDefinition, sectionKey: string) => {
    if (!form) return;
    setForm({
      ...form,
      sections: form.sections.map((section) => ({
        ...section,
        fields: section.key === sectionKey
          ? [...section.fields.filter((candidate) => candidate.id !== field.id), { ...field, sectionKey, sortOrder: section.fields.length }]
          : section.fields.filter((candidate) => candidate.id !== field.id),
      })),
    });
  };

  const handleSave = async () => {
    if (!form || !activeFormKey) return;
    setBusy(true);
    try {
      const fields = allFields.map((field, index) => ({
        id: field.id,
        key: field.key,
        label: field.label,
        answerType: field.answerType,
        sectionKey: field.sectionKey,
        sortOrder: index,
        required: field.required,
        visible: field.visible !== false,
        placeholder: field.placeholder,
        helpText: field.helpText,
        showOnRegistration: field.showOnRegistration,
        includeInReports: field.includeInReports,
        includeInDownloads: field.includeInDownloads,
        requiredForCompletion: field.requiredForCompletion,
        sensitive: field.sensitive,
        permissions: field.permissions,
        conditionalRules: field.conditionalRules,
      }));
      const sections = form.sections.map((section, sortOrder) => ({ id: section.id, name: section.name, sortOrder }));
      const saved = await saveFormDefinition(activeFormKey, { sections, fields, status: 'published' });
      setForm(saved);
      showToast('Form saved', 'Your form changes are now live.', 'success');
    } catch (error) {
      showToast('Could not save form', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!activeFormKey || !window.confirm('Reset this form to Skuggle defaults? Your customizations will be removed.')) return;
    setBusy(true);
    try {
      const reset = await resetFormDefinition(activeFormKey);
      setForm(reset);
      showToast('Form reset', 'This form has been restored to defaults.', 'success');
    } catch (error) {
      showToast('Could not reset form', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const addTemplateField = async (template: FieldTemplate) => {
    if (!activeFormKey) return;
    setBusy(true);
    try {
      await addFormField(activeFormKey, {
        templateKey: template.key,
        sectionKey: customSection,
        required: customRequired,
      });
      const refreshed = await fetchFormDefinition(activeFormKey);
      setForm(refreshed);
      setAddOpen(false);
      setCustomMode(false);
      showToast('Field added', `${template.label} has been added to the form.`, 'success');
    } catch (error) {
      showToast('Could not add field', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const addCustomField = async () => {
    if (!activeFormKey || !customLabel.trim()) return;
    setBusy(true);
    try {
      await addFormField(activeFormKey, {
        label: customLabel.trim(),
        answerType: customType,
        sectionKey: customSection,
        required: customRequired,
        options: customType === 'choose_one' || customType === 'choose_many' ? customOptions.split('\n').map((o) => o.trim()).filter(Boolean) : [],
      });
      const refreshed = await fetchFormDefinition(activeFormKey);
      setForm(refreshed);
      setAddOpen(false);
      setCustomMode(false);
      setCustomLabel('');
      setCustomOptions('');
      showToast('Field added', 'Your custom field has been added.', 'success');
    } catch (error) {
      showToast('Could not add field', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleField = (field: FormFieldDefinition, prop: 'required' | 'visible') => {
    if (!form || field.lockLevel === 'system_required') return;
    setForm({
      ...form,
      sections: form.sections.map((section) => ({
        ...section,
        fields: section.fields.map((f) => (f.id === field.id ? { ...f, [prop]: !f[prop] } : f)),
      })),
    });
  };

  if (activeFormKey && form) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => { setActiveFormKey(null); setForm(null); }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Forms
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />} onClick={() => setPreviewOpen(true)}>Preview</Button>
            <Button variant="outline" size="sm" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={() => void handleReset()} disabled={busy}>Reset to Default</Button>
            <Button variant="primary" size="sm" onClick={() => void handleSave()} disabled={busy}>Save Changes</Button>
          </div>
        </div>

        <PageHeader title={form.name} subtitle="Drag fields into position, add new questions, and choose what appears on this form." />

        <div className="space-y-5">
          {form.sections.map((section) => (
            <section key={section.key} className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <header className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">{section.name}</h3>
                  <div className="flex gap-1">
                    <button type="button" className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded" onClick={() => moveSection(section.key, -1)} aria-label={`Move ${section.name} up`}>â†‘</button>
                    <button type="button" className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded" onClick={() => moveSection(section.key, 1)} aria-label={`Move ${section.name} down`}>â†“</button>
                  </div>
                </div>
              </header>
              <div className="divide-y divide-slate-100">
                {section.fields.length === 0 && (
                  <p className="px-5 py-8 text-sm text-slate-400 text-center">No fields in this section yet.</p>
                )}
                {section.fields.map((field) => (
                  <div key={field.id ?? field.key} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50">
                    <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {field.label}
                        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {ANSWER_TYPE_LABELS[field.answerType] ?? field.answerType}
                        {field.systemMessage && (
                          <span className="inline-flex items-center gap-1 ml-2 text-slate-500">
                            <Lock className="w-3 h-3" /> {field.systemMessage}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {field.lockLevel !== 'system_required' && (
                        <>
                          <button type="button" onClick={() => field.id && moveField(field.id, -1)} className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100" aria-label="Move up">↑</button>
                          <button type="button" onClick={() => field.id && moveField(field.id, 1)} className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100" aria-label="Move down">↓</button>
                          <label className="text-xs text-slate-600 flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={field.required ?? false} onChange={() => toggleField(field, 'required')} className="rounded" />
                            Required
                          </label>
                          <label className="text-xs text-slate-600 flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={field.visible !== false} onChange={() => toggleField(field, 'visible')} className="rounded" />
                            Show
                          </label>
                          <Select value={field.sectionKey ?? section.key} onChange={(event) => moveFieldToSection(field, event.target.value)} className="!py-1 !text-xs" aria-label={`Move ${field.label} to section`}>
                            {sectionOptions.map((option) => <option key={option.key} value={option.key}>{option.name}</option>)}
                          </Select>
                          <button type="button" onClick={() => field.id && setEditingFieldId(field.id)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1">More Options</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <footer className="px-5 py-3 border-t border-slate-100">
                <Button variant="ghost" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setCustomSection(section.key); setAddOpen(true); }}>
                  Add Field
                </Button>
              </footer>
            </section>
          ))}
        </div>

        <Button variant="outline" leftIcon={<Plus className="w-4 h-4" />} onClick={addSection}>Add Section</Button>

        <Drawer isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title={`${form.name} Preview`} size="lg">
          <div className="space-y-6">
            <p className="text-sm text-slate-500">This preview uses the current unsaved layout.</p>
            {form.sections.map((section) => (
              <section key={section.key} className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 pb-2">{section.name}</h3>
                <DynamicFormRenderer
                  fields={section.fields}
                  values={previewValues}
                  onChange={(key, value) => setPreviewValues((current) => ({ ...current, [key]: value }))}
                />
              </section>
            ))}
          </div>
        </Drawer>

        <Drawer isOpen={Boolean(editingField)} onClose={() => setEditingFieldId(null)} title="More Options" size="md">
          {editingField?.id && (
            <div className="space-y-5">
              <div><p className="text-sm font-semibold text-slate-900">{editingField.label}</p><p className="text-xs text-slate-500">These settings stay hidden from people filling the form.</p></div>
              <FormField label="Help text"><Input value={editingField.helpText ?? ''} onChange={(event) => patchField(editingField.id!, { helpText: event.target.value })} placeholder="Explain what information to provide" /></FormField>
              <FormField label="Placeholder"><Input value={editingField.placeholder ?? ''} onChange={(event) => patchField(editingField.id!, { placeholder: event.target.value })} /></FormField>
              {[
                ['includeInReports', 'Include in reports'],
                ['includeInDownloads', 'Include in downloaded profiles'],
                ['requiredForCompletion', 'Required for profile completion'],
                ['sensitive', 'Sensitive information'],
              ].map(([property, label]) => (
                <label key={property} className="flex items-center justify-between gap-4 text-sm text-slate-700">{label}<input type="checkbox" checked={Boolean(editingField[property as keyof FormFieldDefinition])} onChange={(event) => patchField(editingField.id!, { [property]: event.target.checked })} /></label>
              ))}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">Only show this field when</p>
                <Select value={String(editingField.conditionalRules?.[0]?.fieldKey ?? '')} onChange={(event) => patchField(editingField.id!, { conditionalRules: event.target.value ? [{ fieldKey: event.target.value, operator: 'is', value: '' }] : [] })}>
                  <option value="">Always show</option>
                  {allFields.filter((field) => field.id !== editingField.id).map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
                </Select>
                {editingField.conditionalRules?.[0]?.fieldKey && (
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={String(editingField.conditionalRules[0].operator ?? 'is')} onChange={(event) => patchField(editingField.id!, { conditionalRules: [{ ...editingField.conditionalRules![0], operator: event.target.value }] })}>
                      <option value="is">is</option><option value="is_not">is not</option><option value="contains">contains</option><option value="is_empty">is empty</option><option value="is_not_empty">is not empty</option>
                    </Select>
                    <Input value={String(editingField.conditionalRules[0].value ?? '')} onChange={(event) => patchField(editingField.id!, { conditionalRules: [{ ...editingField.conditionalRules![0], value: event.target.value }] })} placeholder="Value" />
                  </div>
                )}
              </div>
              <div className="border-t border-slate-200 pt-4 grid sm:grid-cols-2 gap-5">
                {(['viewRoles', 'editRoles'] as const).map((permissionKey) => (
                  <fieldset key={permissionKey} className="space-y-2">
                    <legend className="text-sm font-semibold text-slate-900">Who can {permissionKey === 'viewRoles' ? 'see' : 'edit'} this field?</legend>
                    {FIELD_ROLE_OPTIONS.map(([role, roleLabel]) => {
                      const permissions = (editingField.permissions ?? {}) as Record<string, unknown>;
                      const selected = Array.isArray(permissions[permissionKey]) ? permissions[permissionKey] as string[] : [];
                      return (
                        <label key={role} className="flex items-center gap-2 text-xs text-slate-700">
                          <input type="checkbox" checked={selected.includes(role)} onChange={(event) => patchField(editingField.id!, { permissions: { ...permissions, [permissionKey]: event.target.checked ? [...selected, role] : selected.filter((item) => item !== role) } })} />
                          {roleLabel}
                        </label>
                      );
                    })}
                  </fieldset>
                ))}
              </div>
              <Button variant="primary" className="w-full" onClick={() => setEditingFieldId(null)}>Done</Button>
            </div>
          )}
        </Drawer>

        <Drawer isOpen={addOpen} onClose={() => { setAddOpen(false); setCustomMode(false); }} title="Add a Field" size="md">
          {!customMode ? (
            <div className="space-y-5">
              <SearchInput value={librarySearch} onChange={setLibrarySearch} placeholder="Search NIN, Blood Group, TRCN..." />
              {library.suggested.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Commonly used fields</p>
                  <div className="space-y-2">
                    {library.suggested.map((template) => (
                      <div key={template.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{template.label}</p>
                          <p className="text-xs text-slate-400">{ANSWER_TYPE_LABELS[template.answerType] ?? template.answerType}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => void addTemplateField(template)} disabled={busy}>+ Add</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Suggested Fields</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {library.templates.map((template) => (
                    <div key={template.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2">
                      <p className="text-sm text-slate-800">{template.label}</p>
                      <Button size="sm" variant="ghost" onClick={() => void addTemplateField(template)} disabled={busy}>+ Add</Button>
                    </div>
                  ))}
                </div>
              </div>
              <FormField label="Where should it appear?">
                <Select value={customSection} onChange={(e) => setCustomSection(e.target.value)}>
                  {sectionOptions.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
                </Select>
              </FormField>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={customRequired} onChange={(e) => setCustomRequired(e.target.checked)} className="rounded" />
                Is this required?
              </label>
              <Button variant="outline" className="w-full" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCustomMode(true)}>
                Create Your Own Field
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <FormField label="What do you want to ask?" required>
                <Input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="e.g. House" />
              </FormField>
              <FormField label="What kind of answer?">
                <Select value={customType} onChange={(e) => setCustomType(e.target.value)}>
                  {Object.entries(ANSWER_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </FormField>
              {(customType === 'choose_one' || customType === 'choose_many') && (
                <FormField label="Options (one per line)">
                  <Textarea value={customOptions} onChange={(e) => setCustomOptions(e.target.value)} rows={4} placeholder={'Red\nBlue\nGreen'} />
                </FormField>
              )}
              <FormField label="Where should it appear?">
                <Select value={customSection} onChange={(e) => setCustomSection(e.target.value)}>
                  {sectionOptions.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
                </Select>
              </FormField>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={customRequired} onChange={(e) => setCustomRequired(e.target.checked)} className="rounded" />
                Is this required?
              </label>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={() => setCustomMode(false)}>Back</Button>
                <Button variant="primary" className="flex-1" onClick={() => void addCustomField()} disabled={busy || !customLabel.trim()}>Add Field</Button>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forms"
        subtitle="Customize the questions on enrolment, profiles, and other school forms — no technical setup required."
      />

      {loading && <p className="text-sm text-slate-500">Loading forms...</p>}

      {!loading && groups.map((group) => (
        <section key={group.category} className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <header className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">{CATEGORY_LABELS[group.category] ?? group.label}</h2>
          </header>
          <ul className="divide-y divide-slate-100">
            {group.forms.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5 capitalize">{item.status} · v{item.version}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void openCustomizer(item.key)} disabled={busy}>
                  Customize
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
