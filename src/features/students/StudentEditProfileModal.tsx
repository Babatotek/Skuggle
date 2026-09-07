import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal, Button, FormField, Input, Select } from '../../components/ui';
import { apiMutation, describeApiError } from '../../lib/apiClient';
import { DynamicFormRenderer } from '../../components/forms/DynamicFormRenderer';
import { flattenCustomFields, type FormDefinition } from '../../lib/forms/types';

interface EditFormState {
  firstName: string;
  middleName: string;
  preferredName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  stateOfOrigin: string;
  religion: string;
  status: string;
  residentialAddress: string;
  residentialCity: string;
  residentialState: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
}

interface StudentEditProfileModalProps {
  isOpen: boolean;
  studentId: string | null;
  initial: Partial<EditFormState> & { residential?: { address?: string; city?: string; state?: string }; emergency?: { name?: string; phone?: string; relationship?: string }; customFields?: Record<string, string | boolean | number | string[]> };
  profileForm?: FormDefinition;
  onClose: () => void;
  onSaved: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'failed' | 'info' | 'error') => void;
}

export const StudentEditProfileModal: React.FC<StudentEditProfileModalProps> = ({ isOpen, studentId, initial, profileForm, onClose, onSaved, showToast }) => {
  const [form, setForm] = useState<EditFormState>({
    firstName: '', middleName: '', preferredName: '', lastName: '', gender: '', dateOfBirth: '',
    nationality: '', stateOfOrigin: '', religion: '', status: 'active',
    residentialAddress: '', residentialCity: '', residentialState: '',
    emergencyName: '', emergencyPhone: '', emergencyRelationship: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<Record<string, string | boolean | number>>({});

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      firstName: initial.firstName ?? '',
      middleName: initial.middleName ?? '',
      preferredName: initial.preferredName ?? '',
      lastName: initial.lastName ?? '',
      gender: initial.gender?.toLowerCase() ?? '',
      dateOfBirth: initial.dateOfBirth ?? '',
      nationality: initial.nationality ?? '',
      stateOfOrigin: initial.stateOfOrigin ?? '',
      religion: initial.religion ?? '',
      status: initial.status?.toLowerCase() ?? 'active',
      residentialAddress: initial.residential?.address ?? initial.residentialAddress ?? '',
      residentialCity: initial.residential?.city ?? initial.residentialCity ?? '',
      residentialState: initial.residential?.state ?? initial.residentialState ?? '',
      emergencyName: initial.emergency?.name ?? initial.emergencyName ?? '',
      emergencyPhone: initial.emergency?.phone ?? initial.emergencyPhone ?? '',
      emergencyRelationship: initial.emergency?.relationship ?? initial.emergencyRelationship ?? '',
    });
    setCustomFields(Object.fromEntries(Object.entries(initial.customFields ?? {}).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : value])));
    setErrors({});
  }, [isOpen, initial]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!form.gender) next.gender = 'Gender is required.';
    if (!form.dateOfBirth) next.dateOfBirth = 'Date of birth is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentId || !validate()) return;
    setSaving(true);
    try {
      await apiMutation(`/students/${encodeURIComponent(studentId)}`, 'PATCH', {
        firstName: form.firstName,
        middleName: form.middleName || null,
        preferredName: form.preferredName || null,
        lastName: form.lastName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        nationality: form.nationality || null,
        stateOfOrigin: form.stateOfOrigin || null,
        religion: form.religion || null,
        status: form.status,
        residential: {
          address: form.residentialAddress,
          city: form.residentialCity,
          state: form.residentialState,
        },
        emergency: {
          name: form.emergencyName,
          phone: form.emergencyPhone,
          relationship: form.emergencyRelationship,
        },
        customFields,
      });
      showToast('Profile updated', 'Student record saved successfully.', 'success');
      onSaved();
      onClose();
    } catch (error) {
      showToast('Update failed', describeApiError(error), 'failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Student Profile" description="Update student bio, contact, and status information." size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" form="student-edit-profile-form" disabled={saving} leftIcon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
            Save Changes
          </Button>
        </>
      }
    >
      <form id="student-edit-profile-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="First Name" required error={errors.firstName}><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></FormField>
          <FormField label="Last Name" required error={errors.lastName}><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></FormField>
          <FormField label="Middle Name"><Input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} /></FormField>
          <FormField label="Preferred Name"><Input value={form.preferredName} onChange={(e) => setForm({ ...form, preferredName: e.target.value })} /></FormField>
          <FormField label="Date of Birth" required error={errors.dateOfBirth}><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></FormField>
          <FormField label="Gender" required error={errors.gender}>
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </Select>
          </FormField>
          <FormField label="Nationality"><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></FormField>
          <FormField label="State of Origin"><Input value={form.stateOfOrigin} onChange={(e) => setForm({ ...form, stateOfOrigin: e.target.value })} /></FormField>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="enrolled">Enrolled</option>
              <option value="draft">Draft</option>
              <option value="suspended">Suspended</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="transferred">Transferred</option>
              <option value="graduated">Graduated</option>
            </Select>
          </FormField>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Residential Address</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Address" className="sm:col-span-2"><Input value={form.residentialAddress} onChange={(e) => setForm({ ...form, residentialAddress: e.target.value })} /></FormField>
            <FormField label="City"><Input value={form.residentialCity} onChange={(e) => setForm({ ...form, residentialCity: e.target.value })} /></FormField>
            <FormField label="State"><Input value={form.residentialState} onChange={(e) => setForm({ ...form, residentialState: e.target.value })} /></FormField>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Emergency Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Name"><Input value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} /></FormField>
            <FormField label="Relationship"><Input value={form.emergencyRelationship} onChange={(e) => setForm({ ...form, emergencyRelationship: e.target.value })} /></FormField>
            <FormField label="Phone"><Input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} /></FormField>
          </div>
        </div>
        {profileForm?.sections.map((section) => {
          const fields = flattenCustomFields({ ...profileForm, sections: [section] }, false);
          if (fields.length === 0) return null;
          return (
            <div key={section.key}>
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">{section.name}</h4>
              <DynamicFormRenderer fields={fields} values={customFields} errors={errors} onChange={(key, value) => setCustomFields((current) => ({ ...current, [key]: value }))} />
            </div>
          );
        })}
      </form>
    </Modal>
  );
};
