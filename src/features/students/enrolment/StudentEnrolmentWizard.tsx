import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Plus, Trash2, UserCheck } from 'lucide-react';
import { Modal, Button, FormField, Input, Select } from '../../../components/ui';
import {
  EnrolmentFormData,
  EnrolmentLookups,
  checkDuplicates,
  enrolmentStepForCustomField,
  fetchEnrolmentLookups,
  initialEnrolmentForm,
  previewAdmissionNumber,
  searchGuardians,
  submitEnrolment,
} from '../../../lib/studentEnrolment';
import { LegacyCustomFieldsRenderer } from '../../../components/forms/DynamicFormRenderer';
import { describeApiError } from '../../../lib/apiClient';
import { StudentPhotoCapture } from './StudentPhotoCapture';
import { WIZARD_STEPS, WizardStepper } from './WizardStepper';

interface StudentEnrolmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (studentId: string) => void;
  showToast: (title: string, message: string, type?: 'success' | 'failed' | 'info' | 'error') => void;
  canCreate: boolean;
}

export const StudentEnrolmentWizard: React.FC<StudentEnrolmentWizardProps> = ({ isOpen, onClose, onComplete, showToast, canCreate }) => {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<EnrolmentFormData>(initialEnrolmentForm);
  const [lookups, setLookups] = useState<EnrolmentLookups | null>(null);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateMatches, setDuplicateMatches] = useState<Array<Record<string, string>>>([]);
  const [guardianMatches, setGuardianMatches] = useState<Array<Record<string, unknown>>>([]);

  const patch = useCallback((updates: Partial<EnrolmentFormData>) => setForm((prev) => ({ ...prev, ...updates })), []);

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setCompleted(new Set());
    setForm(initialEnrolmentForm());
    setErrors({});
    setDuplicateMatches([]);
    setLoadingLookups(true);
    fetchEnrolmentLookups()
      .then((data) => {
        setLookups(data);
        const currentSession = data.academicSessions.find((s) => s.selected || s.isCurrent);
        patch({
          academicSessionId: currentSession?.id ?? '',
          classId: data.classes[0]?.id ?? '',
        });
        return previewAdmissionNumber(data.classes[0]?.id, 'new');
      })
      .then((num) => patch({ admissionNumber: num }))
      .catch(() => showToast('Could not load enrolment data', 'Check your connection and try again.', 'failed'))
      .finally(() => setLoadingLookups(false));
  }, [isOpen, patch, showToast]);

  useEffect(() => {
    if (!form.classId || form.admissionNumberOverride) return;
    void previewAdmissionNumber(form.classId, form.admissionType).then((num) => patch({ admissionNumber: num }));
  }, [form.classId, form.admissionType, form.admissionNumberOverride, patch]);

  const validateStep = (stepIndex: number): boolean => {
    const nextErrors: Record<string, string> = {};
    if (stepIndex === 0) {
      if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.';
      if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.';
      if (!form.dateOfBirth) nextErrors.dateOfBirth = 'Date of birth is required.';
      if (!form.gender) nextErrors.gender = 'Gender is required.';
    }
    if (stepIndex === 1) {
      if (!form.classId) nextErrors.classId = 'Class is required.';
      if (!form.admissionDate) nextErrors.admissionDate = 'Admission date is required.';
    }
    if (stepIndex === 2) {
      const primary = form.guardians[0];
      if (!primary?.guardianId && !primary?.name?.trim()) nextErrors.guardianName = 'Primary guardian name is required.';
      if (!primary?.guardianId && !primary?.phone?.trim()) nextErrors.guardianPhone = 'Primary guardian phone is required.';
    }
    Object.assign(nextErrors, validateCustomFieldsForStep(stepIndex));
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = async () => {
    if (!validateStep(step)) return;
    if (step === 0) {
      try {
        const result = await checkDuplicates(form);
        setDuplicateMatches(result.matches);
      } catch { /* non-blocking */ }
    }
    if (step === 2 && form.guardians[0]?.phone) {
      try {
        const matches = await searchGuardians(form.guardians[0].phone, form.guardians[0].email);
        setGuardianMatches(matches);
      } catch { /* non-blocking */ }
    }
    setCompleted((prev) => new Set([...prev, step]));
    setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (asDraft = false) => {
    if (!asDraft) {
      for (let i = 0; i <= 5; i += 1) {
        if (!validateStep(i)) { setStep(i); return; }
      }
    } else if (!validateStep(0)) {
      setStep(0);
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, saveAsDraft: asDraft };
      const response = await submitEnrolment(payload);
      showToast(asDraft ? 'Draft saved' : 'Student enrolled', `${form.firstName} ${form.lastName} has been ${asDraft ? 'saved as draft' : 'registered'}.`, 'success');
      onComplete(String(response.data.id));
      onClose();
    } catch (error) {
      showToast('Enrolment failed', describeApiError(error), 'failed');
    } finally {
      setSubmitting(false);
    }
  };

  const linkGuardian = (match: Record<string, unknown>) => {
    const updated = [...form.guardians];
    updated[0] = { ...updated[0], guardianId: String(match.id), name: String(match.name), phone: String(match.phone), email: String(match.email ?? '') };
    patch({ guardians: updated });
    setGuardianMatches([]);
    showToast('Guardian linked', 'Existing guardian profile will be used.', 'info');
  };

  const selectedClass = lookups?.classes.find((c) => c.id === form.classId);

  const customFieldsForStep = useMemo(() => {
    const fields = lookups?.customFields ?? [];
    return fields.filter((field) => enrolmentStepForCustomField(String(field.section ?? '')) === step);
  }, [lookups?.customFields, step]);

  const patchCustomField = useCallback((key: string, value: string | boolean | number) => {
    setForm((prev) => ({ ...prev, customFields: { ...prev.customFields, [key]: value } }));
  }, []);

  const validateCustomFieldsForStep = (stepIndex: number): Record<string, string> => {
    const stepErrors: Record<string, string> = {};
    const fields = (lookups?.customFields ?? []).filter((field) => enrolmentStepForCustomField(String(field.section ?? '')) === stepIndex);
    for (const field of fields) {
      const key = String(field.key);
      if (!field.required) continue;
      const value = form.customFields[key];
      if (value === undefined || value === null || value === '') {
        stepErrors[key] = `${String(field.label)} is required.`;
      }
    }
    return stepErrors;
  };

  const footer = (
    <div className="flex items-center justify-between w-full gap-3">
      <div>
        {step > 0 && (
          <Button variant="outline" size="md" onClick={goBack} disabled={submitting}>Back</Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="md" onClick={() => void handleSubmit(true)} disabled={submitting || !canCreate}>
          Save Draft
        </Button>
        {step < WIZARD_STEPS.length - 1 ? (
          <Button variant="primary" size="md" onClick={() => void goNext()} disabled={loadingLookups}>Continue</Button>
        ) : (
          <Button variant="primary" size="md" onClick={() => void handleSubmit(false)} disabled={submitting || !canCreate} leftIcon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
            Complete Enrolment
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enrol New Student" description="Complete the guided enrolment workflow to register a new student." size="2xl" footer={footer}>
      <div className="space-y-5">
        <WizardStepper currentStep={step} completedSteps={completed} onStepClick={(i) => i <= step && setStep(i)} />

        {loadingLookups && (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading school configuration...
          </div>
        )}

        {!loadingLookups && step === 0 && (
          <div className="space-y-5">
            <StudentPhotoCapture preview={form.photoPreview} onPhotoChange={(file, preview) => patch({ photoFile: file, photoPreview: preview, skipPhoto: !file })} onSkip={() => patch({ skipPhoto: true })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="First Name" required error={errors.firstName}><Input value={form.firstName} onChange={(e) => patch({ firstName: e.target.value })} placeholder="e.g. Amina" /></FormField>
              <FormField label="Last Name" required error={errors.lastName}><Input value={form.lastName} onChange={(e) => patch({ lastName: e.target.value })} placeholder="e.g. Bello" /></FormField>
              <FormField label="Middle Name"><Input value={form.middleName} onChange={(e) => patch({ middleName: e.target.value })} /></FormField>
              <FormField label="Preferred Name"><Input value={form.preferredName} onChange={(e) => patch({ preferredName: e.target.value })} /></FormField>
              <FormField label="Date of Birth" required error={errors.dateOfBirth}><Input type="date" value={form.dateOfBirth} onChange={(e) => patch({ dateOfBirth: e.target.value })} /></FormField>
              <FormField label="Gender" required error={errors.gender}>
                <Select value={form.gender} onChange={(e) => patch({ gender: e.target.value })}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </Select>
              </FormField>
              <FormField label="Nationality"><Input value={form.nationality} onChange={(e) => patch({ nationality: e.target.value })} /></FormField>
              <FormField label="State of Origin"><Input value={form.stateOfOrigin} onChange={(e) => patch({ stateOfOrigin: e.target.value })} /></FormField>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Student ID</p>
                  <p className="font-mono text-sm font-bold text-indigo-700 mt-1">{form.admissionNumber || '—'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Automatically generated</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={form.admissionNumberOverride} onChange={(e) => patch({ admissionNumberOverride: e.target.checked })} className="rounded" />
                  Override ID
                </label>
              </div>
              {form.admissionNumberOverride && (
                <Input className="mt-3 font-mono" value={form.admissionNumber} onChange={(e) => patch({ admissionNumber: e.target.value.toUpperCase() })} placeholder="Custom admission number" />
              )}
            </div>
            {duplicateMatches.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold"><AlertTriangle className="w-4 h-4" /> Possible existing student found</div>
                {duplicateMatches.map((m) => (
                  <div key={m.id} className="text-xs text-amber-900 flex justify-between items-center">
                    <span>{m.fullName} · {m.admissionNumber} · {m.className}</span>
                  </div>
                ))}
                <p className="text-xs text-amber-700">Review before continuing to avoid duplicate records.</p>
              </div>
            )}
            {customFieldsForStep.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase">School-specific fields</h4>
                <LegacyCustomFieldsRenderer fields={customFieldsForStep} values={form.customFields} errors={errors} onChange={patchCustomField} />
              </div>
            )}
          </div>
        )}

        {!loadingLookups && step === 1 && (
          <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Admission Date" required error={errors.admissionDate}><Input type="date" value={form.admissionDate} onChange={(e) => patch({ admissionDate: e.target.value })} /></FormField>
            <FormField label="Academic Session">
              <Select value={form.academicSessionId} onChange={(e) => patch({ academicSessionId: e.target.value })}>
                {lookups?.academicSessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Term">
              <Select value={form.termId} onChange={(e) => patch({ termId: e.target.value })}>
                <option value="">Current term</option>
                {lookups?.terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Class Level" required error={errors.classId}>
              <Select value={form.classId} onChange={(e) => patch({ classId: e.target.value })}>
                <option value="">Select class</option>
                {lookups?.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Admission Type">
              <Select value={form.admissionType} onChange={(e) => patch({ admissionType: e.target.value })}>
                {lookups?.admissionTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Student Category">
              <Select value={form.studentCategory} onChange={(e) => patch({ studentCategory: e.target.value })}>
                {lookups?.studentCategories.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </FormField>
            <FormField label="Boarding / Day">
              <Select value={form.boardingType} onChange={(e) => patch({ boardingType: e.target.value })}>
                {lookups?.boardingTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </FormField>
            <div className="sm:col-span-2 flex items-center gap-2 pt-1">
              <input type="checkbox" id="isTransfer" checked={form.isTransfer} onChange={(e) => patch({ isTransfer: e.target.checked })} className="rounded" />
              <label htmlFor="isTransfer" className="text-sm text-slate-700 cursor-pointer">Transfer student</label>
            </div>
            {form.isTransfer && (
              <>
                <FormField label="Previous School"><Input value={form.previousSchool} onChange={(e) => patch({ previousSchool: e.target.value })} /></FormField>
                <FormField label="Previous Class"><Input value={form.previousClass} onChange={(e) => patch({ previousClass: e.target.value })} /></FormField>
              </>
            )}
          </div>
          {customFieldsForStep.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase">School-specific fields</h4>
              <LegacyCustomFieldsRenderer fields={customFieldsForStep} values={form.customFields} errors={errors} onChange={patchCustomField} />
            </div>
          )}
          </div>
        )}

        {!loadingLookups && step === 2 && (
          <div className="space-y-4">
            {guardianMatches.length > 0 && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-indigo-900 flex items-center gap-2"><UserCheck className="w-4 h-4" /> Existing guardian found</p>
                {guardianMatches.map((m) => (
                  <div key={String(m.id)} className="flex items-center justify-between text-xs">
                    <span className="text-indigo-800">{String(m.name)} · {String(m.phone)}</span>
                    <Button size="xs" variant="primary" onClick={() => linkGuardian(m)}>Link Guardian</Button>
                  </div>
                ))}
              </div>
            )}
            {form.guardians.map((guardian, index) => (
              <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 uppercase">{index === 0 ? 'Primary Guardian' : `Guardian ${index + 1}`}</p>
                  {index > 0 && <Button type="button" variant="ghost" size="xs" leftIcon={<Trash2 className="w-3 h-3" />} onClick={() => patch({ guardians: form.guardians.filter((_, i) => i !== index) })}>Remove</Button>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Full Name" required={index === 0} error={index === 0 ? errors.guardianName : undefined}><Input value={guardian.name} onChange={(e) => { const g = [...form.guardians]; g[index] = { ...g[index], name: e.target.value }; patch({ guardians: g }); }} /></FormField>
                  <FormField label="Relationship">
                    <Select value={guardian.relationship} onChange={(e) => { const g = [...form.guardians]; g[index] = { ...g[index], relationship: e.target.value }; patch({ guardians: g }); }}>
                      <option value="father">Father</option><option value="mother">Mother</option><option value="guardian">Guardian</option><option value="other">Other</option>
                    </Select>
                  </FormField>
                  <FormField label="Phone" required={index === 0} error={index === 0 ? errors.guardianPhone : undefined}><Input value={guardian.phone} onChange={(e) => { const g = [...form.guardians]; g[index] = { ...g[index], phone: e.target.value }; patch({ guardians: g }); }} /></FormField>
                  <FormField label="Email"><Input type="email" value={guardian.email ?? ''} onChange={(e) => { const g = [...form.guardians]; g[index] = { ...g[index], email: e.target.value }; patch({ guardians: g }); }} /></FormField>
                  <FormField label="Occupation"><Input value={guardian.occupation ?? ''} onChange={(e) => { const g = [...form.guardians]; g[index] = { ...g[index], occupation: e.target.value }; patch({ guardians: g }); }} /></FormField>
                  <FormField label="Address"><Input value={guardian.address ?? ''} onChange={(e) => { const g = [...form.guardians]; g[index] = { ...g[index], address: e.target.value }; patch({ guardians: g }); }} /></FormField>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {(['preferredContact', 'billingResponsible', 'authorizedPickup', 'livesWithStudent'] as const).map((flag) => (
                    <label key={flag} className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                      <input type="checkbox" checked={!!guardian[flag]} onChange={(e) => { const g = [...form.guardians]; g[index] = { ...g[index], [flag]: e.target.checked }; patch({ guardians: g }); }} className="rounded" />
                      {flag.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {form.guardians.length < 3 && (
              <Button type="button" variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => patch({ guardians: [...form.guardians, { name: '', relationship: 'guardian', phone: '', email: '' }] })}>
                Add Secondary Guardian
              </Button>
            )}
            {customFieldsForStep.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase">School-specific fields</h4>
                <LegacyCustomFieldsRenderer fields={customFieldsForStep} values={form.customFields} errors={errors} onChange={patchCustomField} />
              </div>
            )}
          </div>
        )}

        {!loadingLookups && step === 3 && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase">Residential Address</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Address" className="sm:col-span-2"><Input value={form.residential.address} onChange={(e) => patch({ residential: { ...form.residential, address: e.target.value } })} /></FormField>
              <FormField label="City / Town"><Input value={form.residential.city} onChange={(e) => patch({ residential: { ...form.residential, city: e.target.value } })} /></FormField>
              <FormField label="State"><Input value={form.residential.state} onChange={(e) => patch({ residential: { ...form.residential, state: e.target.value } })} /></FormField>
              <FormField label="Country"><Input value={form.residential.country} onChange={(e) => patch({ residential: { ...form.residential, country: e.target.value } })} /></FormField>
            </div>
            <h4 className="text-xs font-bold text-slate-700 uppercase pt-2">Emergency Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Name"><Input value={form.emergency.name} onChange={(e) => patch({ emergency: { ...form.emergency, name: e.target.value } })} /></FormField>
              <FormField label="Relationship"><Input value={form.emergency.relationship} onChange={(e) => patch({ emergency: { ...form.emergency, relationship: e.target.value } })} /></FormField>
              <FormField label="Emergency Phone"><Input value={form.emergency.phone} onChange={(e) => patch({ emergency: { ...form.emergency, phone: e.target.value } })} /></FormField>
              <FormField label="Alternative Phone"><Input value={form.emergency.alternativePhone} onChange={(e) => patch({ emergency: { ...form.emergency, alternativePhone: e.target.value } })} /></FormField>
            </div>
            {customFieldsForStep.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase">School-specific fields</h4>
                <LegacyCustomFieldsRenderer fields={customFieldsForStep} values={form.customFields} errors={errors} onChange={patchCustomField} />
              </div>
            )}
          </div>
        )}

        {!loadingLookups && step === 4 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">Medical information is stored securely and only visible to authorized staff.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Blood Group"><Input value={form.medical.bloodGroup} onChange={(e) => patch({ medical: { ...form.medical, bloodGroup: e.target.value } })} placeholder="e.g. O+" /></FormField>
              <FormField label="Genotype"><Input value={form.medical.genotype} onChange={(e) => patch({ medical: { ...form.medical, genotype: e.target.value } })} placeholder="e.g. AA" /></FormField>
              <FormField label="Allergies" className="sm:col-span-2"><Input value={form.medical.allergies} onChange={(e) => patch({ medical: { ...form.medical, allergies: e.target.value } })} /></FormField>
              <FormField label="Medical Conditions" className="sm:col-span-2"><Input value={form.medical.conditions} onChange={(e) => patch({ medical: { ...form.medical, conditions: e.target.value } })} /></FormField>
              <FormField label="Current Medication" className="sm:col-span-2"><Input value={form.medical.medications} onChange={(e) => patch({ medical: { ...form.medical, medications: e.target.value } })} /></FormField>
              <FormField label="Dietary Restrictions"><Input value={form.medical.dietaryRestrictions} onChange={(e) => patch({ medical: { ...form.medical, dietaryRestrictions: e.target.value } })} /></FormField>
              <FormField label="Disability / Accessibility"><Input value={form.medical.disabilityNeeds} onChange={(e) => patch({ medical: { ...form.medical, disabilityNeeds: e.target.value } })} /></FormField>
              <FormField label="Special Educational Needs" className="sm:col-span-2"><Input value={form.medical.specialEducationalNeeds} onChange={(e) => patch({ medical: { ...form.medical, specialEducationalNeeds: e.target.value } })} /></FormField>
              <FormField label="Emergency Medical Notes" className="sm:col-span-2"><Input value={form.medical.emergencyNotes} onChange={(e) => patch({ medical: { ...form.medical, emergencyNotes: e.target.value } })} /></FormField>
            </div>
            {customFieldsForStep.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase">School-specific fields</h4>
                <LegacyCustomFieldsRenderer fields={customFieldsForStep} values={form.customFields} errors={errors} onChange={patchCustomField} />
              </div>
            )}
          </div>
        )}

        {!loadingLookups && step === 5 && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Upload enrolment documents. PDF and images up to 8MB each.</p>
            {lookups?.documentTypes.slice(0, 6).map((docType) => {
              const existing = form.documents.find((d) => d.type === docType.id);
              return (
                <div key={docType.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{docType.label}</p>
                    {existing && <p className="text-xs text-emerald-600 mt-0.5">{existing.name}</p>}
                  </div>
                  <label className="text-xs font-semibold text-indigo-600 cursor-pointer hover:text-indigo-800">
                    {existing ? 'Replace' : 'Upload'}
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const docs = form.documents.filter((d) => d.type !== docType.id);
                      patch({ documents: [...docs, { type: docType.id, file, name: file.name }] });
                    }} />
                  </label>
                </div>
              );
            })}
            <p className="text-xs text-slate-400">Documents are uploaded after the student record is created.</p>
            {customFieldsForStep.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase">School-specific fields</h4>
                <LegacyCustomFieldsRenderer fields={customFieldsForStep} values={form.customFields} errors={errors} onChange={patchCustomField} />
              </div>
            )}
          </div>
        )}

        {!loadingLookups && step === 6 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Student Portal</p>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.portal.createStudentLogin} onChange={(e) => patch({ portal: { ...form.portal, createStudentLogin: e.target.checked } })} className="rounded" />
                Create student login (invitation will be sent)
              </label>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Parent Portal</p>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.portal.sendParentInvitation} onChange={(e) => patch({ portal: { ...form.portal, sendParentInvitation: e.target.checked } })} className="rounded" />
                Send parent invitation email
              </label>
              {form.portal.sendParentInvitation && (
                <FormField label="Parent Email"><Input type="email" value={form.portal.parentEmail || form.guardians[0]?.email || ''} onChange={(e) => patch({ portal: { ...form.portal, parentEmail: e.target.value } })} /></FormField>
              )}
            </div>
          </div>
        )}

        {!loadingLookups && step === 7 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-slate-400 uppercase font-semibold mb-1">Student</p><p className="font-semibold text-slate-900">{form.firstName} {form.lastName}</p><p className="font-mono text-xs text-indigo-600 mt-1">{form.admissionNumber}</p></div>
              <div><p className="text-xs text-slate-400 uppercase font-semibold mb-1">Academic</p><p className="text-slate-800">{selectedClass?.name ?? '—'}</p><p className="text-xs text-slate-500">{form.admissionDate}</p></div>
              <div><p className="text-xs text-slate-400 uppercase font-semibold mb-1">Guardian</p><p className="text-slate-800">{form.guardians[0]?.name || '—'}</p><p className="text-xs text-slate-500">{form.guardians[0]?.phone}</p></div>
              <div><p className="text-xs text-slate-400 uppercase font-semibold mb-1">Documents</p><p className="text-slate-800">{form.documents.length} attached</p><p className="text-xs text-slate-500">{form.photoPreview ? 'Photo included' : 'No photo'}</p></div>
            </div>
            {duplicateMatches.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {duplicateMatches.length} possible duplicate(s) detected. Confirm before completing.
              </div>
            )}
            {!form.guardians[0]?.name && <p className="text-xs text-rose-600">Guardian information is incomplete.</p>}
            {!form.classId && <p className="text-xs text-rose-600">Class placement is missing.</p>}
          </div>
        )}
      </div>
    </Modal>
  );
};
