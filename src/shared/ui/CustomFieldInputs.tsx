import type { CustomFieldDefinition, CustomFieldValues } from "../types/customFields";
import { groupCustomFieldsBySection } from "../types/customFields";

interface CustomFieldInputsProps {
  fields: CustomFieldDefinition[];
  values: CustomFieldValues;
  onChange: (key: string, value: string | number | boolean) => void;
  disabled?: boolean;
  className?: string;
}

const inputClassName =
  "w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60";

export function CustomFieldInputs({
  fields,
  values,
  onChange,
  disabled = false,
  className = "",
}: CustomFieldInputsProps) {
  if (fields.length === 0) return null;

  const sections = groupCustomFieldsBySection(fields);

  return (
    <div className={`space-y-5 ${className}`}>
      {sections.map(({ section, fields: sectionFields }) => (
        <div key={section}>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            {section}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {sectionFields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                value={values[field.key]}
                disabled={disabled}
                onChange={onChange}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldInput({
  field,
  value,
  disabled,
  onChange,
}: {
  field: CustomFieldDefinition;
  value: string | number | boolean | undefined;
  disabled: boolean;
  onChange: (key: string, value: string | number | boolean) => void;
}) {
  const label = (
    <label className="font-bold text-slate-700 block mb-1">
      {field.label}
      {field.required ? " *" : ""}
    </label>
  );

  if (field.type === "boolean") {
    return (
      <div className="sm:col-span-2">
        {label}
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            disabled={disabled}
            onChange={(event) => onChange(field.key, event.target.checked)}
            className="rounded border-slate-300 text-indigo-600"
          />
          <span className="text-slate-600">
            {field.helpText || "Yes / No"}
          </span>
        </label>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        {label}
        <select
          value={value === undefined ? "" : String(value)}
          required={field.required}
          disabled={disabled}
          onChange={(event) => onChange(field.key, event.target.value)}
          className={inputClassName}
        >
          <option value="">Select {field.label.toLowerCase()}</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {field.helpText ? (
          <p className="mt-1 text-[11px] text-slate-500">{field.helpText}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {label}
      <input
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={value === undefined ? "" : String(value)}
        required={field.required}
        disabled={disabled}
        placeholder={field.placeholder || field.label}
        onChange={(event) =>
          onChange(
            field.key,
            field.type === "number" ? Number(event.target.value) : event.target.value,
          )
        }
        className={inputClassName}
      />
      {field.helpText ? (
        <p className="mt-1 text-[11px] text-slate-500">{field.helpText}</p>
      ) : null}
    </div>
  );
}

export function serializeCustomFieldValues(values: CustomFieldValues): string {
  return JSON.stringify(values);
}
