import { apiMutation, apiRequest } from './apiClient';

export interface EnrolmentLookupClass {
  id: string;
  name: string;
  className: string;
  arm: string;
  campusId?: string;
  campusName?: string;
}

export interface EnrolmentLookups {
  classes: EnrolmentLookupClass[];
  academicSessions: Array<{ id: string; name: string; isCurrent: boolean; selected?: boolean }>;
  terms: Array<{ id: string; name: string; isCurrent: boolean }>;
  campuses: Array<{ id: string; name: string; code: string }>;
  admissionTypes: Array<{ id: string; label: string }>;
  studentCategories: Array<{ id: string; label: string }>;
  boardingTypes: Array<{ id: string; label: string }>;
  documentTypes: Array<{ id: string; label: string }>;
  lifecycleStatuses: string[];
  admissionNumberPattern: string;
  customFields: Array<Record<string, unknown>>;
}

export interface GuardianFormData {
  guardianId?: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  occupation?: string;
  address?: string;
  preferredContact?: boolean;
  billingResponsible?: boolean;
  authorizedPickup?: boolean;
  livesWithStudent?: boolean;
}

export interface EnrolmentFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  stateOfOrigin: string;
  localGovernmentArea: string;
  countryCode: string;
  religion: string;
  admissionNumber: string;
  admissionNumberOverride: boolean;
  admissionDate: string;
  classId: string;
  academicSessionId: string;
  termId: string;
  admissionType: string;
  studentCategory: string;
  boardingType: string;
  isTransfer: boolean;
  previousSchool: string;
  previousClass: string;
  guardians: GuardianFormData[];
  residential: { address: string; city: string; state: string; country: string };
  emergency: { name: string; relationship: string; phone: string; alternativePhone: string };
  medical: {
    bloodGroup: string;
    genotype: string;
    conditions: string;
    allergies: string;
    medications: string;
    dietaryRestrictions: string;
    disabilityNeeds: string;
    specialEducationalNeeds: string;
    emergencyNotes: string;
  };
  portal: {
    createStudentLogin: boolean;
    linkExistingParent: boolean;
    createParentAccount: boolean;
    sendParentInvitation: boolean;
    parentEmail: string;
  };
  photoFile: File | null;
  photoPreview: string | null;
  skipPhoto: boolean;
  documents: Array<{ type: string; file: File; name: string }>;
  customFields: Record<string, string | boolean | number>;
  saveAsDraft: boolean;
}

export const initialEnrolmentForm = (): EnrolmentFormData => ({
  firstName: '',
  middleName: '',
  lastName: '',
  preferredName: '',
  gender: '',
  dateOfBirth: '',
  nationality: 'Nigerian',
  stateOfOrigin: '',
  localGovernmentArea: '',
  countryCode: 'NG',
  religion: '',
  admissionNumber: '',
  admissionNumberOverride: false,
  admissionDate: new Date().toISOString().slice(0, 10),
  classId: '',
  academicSessionId: '',
  termId: '',
  admissionType: 'new',
  studentCategory: 'regular',
  boardingType: 'day',
  isTransfer: false,
  previousSchool: '',
  previousClass: '',
  guardians: [{ name: '', relationship: 'father', phone: '', email: '', preferredContact: true, billingResponsible: true, authorizedPickup: true, livesWithStudent: true }],
  residential: { address: '', city: '', state: '', country: 'Nigeria' },
  emergency: { name: '', relationship: '', phone: '', alternativePhone: '' },
  medical: { bloodGroup: '', genotype: '', conditions: '', allergies: '', medications: '', dietaryRestrictions: '', disabilityNeeds: '', specialEducationalNeeds: '', emergencyNotes: '' },
  portal: { createStudentLogin: false, linkExistingParent: false, createParentAccount: false, sendParentInvitation: false, parentEmail: '' },
  photoFile: null,
  photoPreview: null,
  skipPhoto: false,
  documents: [],
  customFields: {},
  saveAsDraft: false,
});

export async function fetchEnrolmentLookups(): Promise<EnrolmentLookups> {
  const response = await apiRequest<{ success: true; data: EnrolmentLookups }>('/lookups/student-registration');
  return response.data;
}

export async function previewAdmissionNumber(classId?: string, admissionType?: string): Promise<string> {
  const params = new URLSearchParams();
  if (classId) params.set('classId', classId);
  if (admissionType) params.set('admissionType', admissionType);
  const response = await apiRequest<{ success: true; data: { admissionNumber: string } }>(`/students/admission-number/preview?${params}`);
  return response.data.admissionNumber;
}

export async function checkDuplicates(payload: Partial<EnrolmentFormData>) {
  const response = await apiMutation<{ success: true; data: { hasDuplicates: boolean; matches: Array<Record<string, string>> } }>(
    '/students/check-duplicates',
    'POST',
    {
      firstName: payload.firstName,
      lastName: payload.lastName,
      dateOfBirth: payload.dateOfBirth || undefined,
      admissionNumber: payload.admissionNumber || undefined,
      guardians: payload.guardians?.map((g) => ({ phone: g.phone, email: g.email })),
    },
  );
  return response.data;
}

export async function searchGuardians(phone?: string, email?: string) {
  const params = new URLSearchParams();
  if (phone) params.set('phone', phone);
  if (email) params.set('email', email);
  const response = await apiRequest<{ success: true; data: { matches: Array<Record<string, unknown>> } }>(`/students/guardians/search?${params}`);
  return response.data.matches;
}

export function buildEnrolmentFormData(form: EnrolmentFormData): FormData {
  const body = new FormData();
  body.append('firstName', form.firstName);
  body.append('lastName', form.lastName);
  if (form.middleName) body.append('middleName', form.middleName);
  if (form.preferredName) body.append('preferredName', form.preferredName);
  if (form.gender) body.append('gender', form.gender);
  if (form.dateOfBirth) body.append('dateOfBirth', form.dateOfBirth);
  if (form.nationality) body.append('nationality', form.nationality);
  if (form.stateOfOrigin) body.append('stateOfOrigin', form.stateOfOrigin);
  if (form.localGovernmentArea) body.append('localGovernmentArea', form.localGovernmentArea);
  if (form.countryCode) body.append('countryCode', form.countryCode);
  if (form.religion) body.append('religion', form.religion);
  if (form.admissionNumberOverride && form.admissionNumber) body.append('admissionNumber', form.admissionNumber);
  if (form.admissionDate) body.append('admissionDate', form.admissionDate);
  if (form.classId) body.append('classId', form.classId);
  if (form.academicSessionId) body.append('academicSessionId', form.academicSessionId);
  if (form.termId) body.append('termId', form.termId);
  if (form.admissionType) body.append('admissionType', form.admissionType);
  if (form.studentCategory) body.append('studentCategory', form.studentCategory);
  if (form.boardingType) body.append('boardingType', form.boardingType);
  if (form.saveAsDraft) {
    body.append('saveAsDraft', '1');
    body.append('status', 'draft');
  }
  if (form.guardians.length > 0) {
    body.append('guardians', JSON.stringify(form.guardians.filter((g) => g.guardianId || g.name)));
  }
  if (form.residential.address) body.append('residential', JSON.stringify(form.residential));
  if (form.emergency.phone || form.emergency.name) body.append('emergency', JSON.stringify(form.emergency));
  if (form.isTransfer || form.previousSchool) {
    body.append('admission', JSON.stringify({ isTransfer: form.isTransfer, previousSchool: form.previousSchool, previousClass: form.previousClass }));
  }
  if (Object.values(form.medical).some(Boolean)) body.append('medical', JSON.stringify(form.medical));
  if (Object.values(form.portal).some((v) => v === true || (typeof v === 'string' && v))) body.append('portal', JSON.stringify(form.portal));
  if (form.photoFile) body.append('photo', form.photoFile);
  if (Object.keys(form.customFields).length > 0) {
    body.append('customFields', JSON.stringify(form.customFields));
  }
  return body;
}

export async function submitEnrolment(form: EnrolmentFormData) {
  const body = buildEnrolmentFormData(form);
  return apiMutation<{ success: true; data: Record<string, unknown> }>('/students', 'POST', body);
}

export function enrolmentStepForCustomField(section: string): number {
  const normalized = section.toLowerCase();
  if (normalized.includes('academic')) return 1;
  if (normalized.includes('guardian') || normalized.includes('parent')) return 2;
  if (normalized.includes('contact') || normalized.includes('emergency')) return 3;
  if (normalized.includes('medical') || normalized.includes('welfare')) return 4;
  if (normalized.includes('document')) return 5;
  return 0;
}
export function compressImage(file: File, maxWidth = 800, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not process image')); };
    img.src = url;
  });
}
