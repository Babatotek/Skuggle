export type AnswerType =
  | 'short_answer'
  | 'long_answer'
  | 'number'
  | 'date'
  | 'date_time'
  | 'yes_no'
  | 'choose_one'
  | 'choose_many'
  | 'phone'
  | 'email'
  | 'address'
  | 'file'
  | 'photo'
  | 'currency'
  | 'percentage';

export interface FormFieldDefinition {
  id?: number;
  fieldId?: number;
  key: string;
  label: string;
  answerType: AnswerType | string;
  source?: string;
  templateKey?: string;
  required?: boolean;
  visible?: boolean;
  lockLevel?: string;
  sectionKey?: string;
  sectionName?: string;
  sortOrder?: number;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  sensitive?: boolean;
  showOnRegistration?: boolean;
  includeInReports?: boolean;
  includeInDownloads?: boolean;
  requiredForCompletion?: boolean;
  systemMessage?: string | null;
  permissions?: Record<string, unknown> | null;
  conditionalRules?: Array<Record<string, unknown>>;
}

export interface FormSectionDefinition {
  id?: number;
  key: string;
  name: string;
  sortOrder?: number;
  isCustomizable?: boolean;
  fields: FormFieldDefinition[];
}

export interface FormDefinition {
  key: string;
  name: string;
  category: string;
  status: 'draft' | 'published';
  version: number;
  sections: FormSectionDefinition[];
}

export interface FormGroup {
  category: string;
  label: string;
  forms: Array<{ key: string; name: string; status: string; version: number }>;
}

export interface FieldTemplate {
  key: string;
  label: string;
  answerType: string;
  entities?: string[];
  sensitive?: boolean;
  jurisdictions?: string[];
  options?: string[];
}

export interface FieldLibraryResponse {
  search?: string | null;
  country?: string;
  suggested: FieldTemplate[];
  templates: FieldTemplate[];
  answerTypes: Record<string, string>;
}

export const ANSWER_TYPE_LABELS: Record<string, string> = {
  short_answer: 'Short Answer',
  long_answer: 'Long Answer',
  number: 'Number',
  date: 'Date',
  date_time: 'Date & Time',
  yes_no: 'Yes / No',
  choose_one: 'Choose One',
  choose_many: 'Choose Many',
  phone: 'Phone Number',
  email: 'Email',
  address: 'Address',
  file: 'File Upload',
  photo: 'Photo',
  currency: 'Currency',
  percentage: 'Percentage',
};

/** Maps enrolment wizard step index to form section keys. */
export const ENROLMENT_STEP_SECTIONS: Record<number, string[]> = {
  0: ['identity', 'government', 'additional'],
  1: ['academic'],
  2: ['guardian'],
  3: ['contact'],
  4: ['medical'],
  5: ['documents'],
  6: ['portal'],
  7: ['identity', 'academic', 'guardian', 'contact', 'medical', 'government', 'additional'],
};

export function flattenCustomFields(form: FormDefinition | null, registrationOnly = true): FormFieldDefinition[] {
  if (!form) return [];
  const fields: FormFieldDefinition[] = [];
  for (const section of form.sections) {
    for (const field of section.fields) {
      if (registrationOnly && field.showOnRegistration === false) continue;
      if (field.visible === false) continue;
      if (field.source === 'system') continue;
      fields.push({ ...field, sectionKey: field.sectionKey ?? section.key, sectionName: field.sectionName ?? section.name });
    }
  }
  return fields.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function legacyFieldsFromDefinition(form: FormDefinition | null, registrationOnly = true): Array<Record<string, unknown>> {
  return flattenCustomFields(form, registrationOnly).map((field) => ({
    key: field.key,
    label: field.label,
    type: legacyTypeFromAnswer(field.answerType),
    required: field.required ?? false,
    section: field.sectionName ?? 'Additional Information',
    placeholder: field.placeholder ?? '',
    helpText: field.helpText ?? '',
    showOnRegistration: field.showOnRegistration ?? true,
    order: field.sortOrder ?? 0,
    options: field.options ?? [],
  }));
}

function legacyTypeFromAnswer(answerType: string): string {
  switch (answerType) {
    case 'number':
    case 'currency':
    case 'percentage':
      return 'number';
    case 'date':
    case 'date_time':
      return 'date';
    case 'yes_no':
      return 'boolean';
    case 'choose_one':
    case 'choose_many':
      return 'select';
    default:
      return 'text';
  }
}
