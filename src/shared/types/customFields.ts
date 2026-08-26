export type CustomFieldType = "text" | "number" | "date" | "select" | "boolean";

export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  section: string;
  placeholder?: string;
  helpText?: string;
  showOnRegistration: boolean;
  order: number;
  options: string[];
}

export type CustomFieldValues = Record<string, string | number | boolean>;

export const CUSTOM_FIELD_ENTITIES = {
  student: "student",
  staff: "staff",
} as const;

export type CustomFieldEntity =
  (typeof CUSTOM_FIELD_ENTITIES)[keyof typeof CUSTOM_FIELD_ENTITIES];

export const emptyCustomFieldDraft = (): CustomFieldDefinition => ({
  key: "",
  label: "",
  type: "text",
  required: false,
  section: "Additional Information",
  placeholder: "",
  helpText: "",
  showOnRegistration: true,
  order: 0,
  options: [],
});

export const groupCustomFieldsBySection = (
  fields: CustomFieldDefinition[],
): Array<{ section: string; fields: CustomFieldDefinition[] }> => {
  const groups = new Map<string, CustomFieldDefinition[]>();
  fields.forEach((field) => {
    const section = field.section?.trim() || "Additional Information";
    const bucket = groups.get(section) ?? [];
    bucket.push(field);
    groups.set(section, bucket);
  });

  return Array.from(groups.entries()).map(([section, sectionFields]) => ({
    section,
    fields: sectionFields,
  }));
};
