import React, { useMemo } from 'react';
import { FormField, Input, Select, Textarea } from '../ui/FormField';
import type { FormFieldDefinition } from '../../lib/forms/types';

export interface DynamicFormRendererProps {
  fields: FormFieldDefinition[];
  values: Record<string, string | boolean | number>;
  errors?: Record<string, string>;
  onChange: (key: string, value: string | boolean | number) => void;
  disabled?: boolean;
  columns?: 1 | 2;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  values,
  errors = {},
  onChange,
  disabled = false,
  columns = 2,
}) => {
  const gridClass = columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3';

  const visibleFields = useMemo(() => fields.filter((field) => {
    if (field.visible === false) return false;
    const rules = field.conditionalRules ?? [];
    return rules.every((rule) => {
      const sourceKey = String(rule.fieldKey ?? rule.field ?? '');
      if (!sourceKey) return true;
      const actual = values[sourceKey];
      const expected = rule.value;
      switch (String(rule.operator ?? 'is')) {
        case 'is_not': return String(actual ?? '') !== String(expected ?? '');
        case 'contains': return String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
        case 'is_empty': return actual === undefined || actual === null || actual === '';
        case 'is_not_empty': return actual !== undefined && actual !== null && actual !== '';
        default: return String(actual ?? '') === String(expected ?? '');
      }
    });
  }), [fields, values]);

  if (visibleFields.length === 0) return null;

  return (
    <div className={gridClass}>
      {visibleFields.map((field) => {
        const key = field.key;
        const error = errors[key] || errors[`customFields.${key}`];
        const value = values[key];
        const required = Boolean(field.required);
        const label = (
          <span className="inline-flex items-center gap-1.5">
            {field.label}
            {field.systemMessage && (
              <span className="text-[10px] font-medium text-slate-400 normal-case" title={field.systemMessage}>
                🔒 {field.systemMessage}
              </span>
            )}
          </span>
        );

        if (field.answerType === 'yes_no' || field.answerType === 'boolean') {
          return (
            <FormField key={key} label={label} hint={field.helpText} error={error} required={required}>
              <Select
                value={value === true || value === 'true' ? 'true' : value === false || value === 'false' ? 'false' : ''}
                onChange={(e) => onChange(key, e.target.value === 'true')}
                disabled={disabled}
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </FormField>
          );
        }

        if (field.answerType === 'choose_one' || field.answerType === 'select') {
          return (
            <FormField key={key} label={label} hint={field.helpText} error={error} required={required}>
              <Select value={String(value ?? '')} onChange={(e) => onChange(key, e.target.value)} disabled={disabled}>
                <option value="">{field.placeholder || 'Select an option'}</option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Select>
            </FormField>
          );
        }

        if (field.answerType === 'choose_many') {
          const selected = String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
          return (
            <fieldset key={key} className="space-y-2" aria-describedby={error ? `${key}-error` : undefined}>
              <legend className="text-sm font-medium text-slate-700">{label}{required && <span className="text-rose-500"> *</span>}</legend>
              {(field.options ?? []).map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    disabled={disabled}
                    onChange={(event) => {
                      const next = event.target.checked ? [...selected, option] : selected.filter((item) => item !== option);
                      onChange(key, next.join(','));
                    }}
                  />
                  {option}
                </label>
              ))}
              {field.helpText && <p className="text-xs text-slate-500">{field.helpText}</p>}
              {error && <p id={`${key}-error`} className="text-xs text-rose-600">{error}</p>}
            </fieldset>
          );
        }

        if (field.answerType === 'long_answer') {
          return (
            <FormField key={key} label={label} hint={field.helpText} error={error} required={required} className="sm:col-span-2">
              <Textarea
                value={String(value ?? '')}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder={field.placeholder}
                disabled={disabled}
                rows={3}
              />
            </FormField>
          );
        }

        const inputType = field.answerType === 'number' || field.answerType === 'currency' || field.answerType === 'percentage'
          ? 'number'
          : field.answerType === 'date'
            ? 'date'
            : field.answerType === 'date_time'
              ? 'datetime-local'
            : field.answerType === 'email'
              ? 'email'
              : field.answerType === 'phone'
                ? 'tel'
                : 'text';

        return (
          <FormField key={key} label={label} hint={field.helpText} error={error} required={required}>
            <Input
              type={inputType}
              value={String(value ?? '')}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
            />
          </FormField>
        );
      })}
    </div>
  );
};

/** Renders legacy custom field shape from enrolment lookups. */
export const LegacyCustomFieldsRenderer: React.FC<{
  fields: Array<Record<string, unknown>>;
  values: Record<string, string | boolean | number>;
  errors?: Record<string, string>;
  onChange: (key: string, value: string | boolean | number) => void;
}> = ({ fields, values, errors, onChange }) => {
  const normalized: FormFieldDefinition[] = fields.map((field, index) => ({
    key: String(field.key),
    label: String(field.label),
    answerType: String(field.type) === 'boolean' ? 'yes_no' : String(field.type) === 'select' ? 'choose_one' : String(field.type) === 'number' ? 'number' : String(field.type) === 'date' ? 'date' : 'short_answer',
    required: Boolean(field.required),
    options: Array.isArray(field.options) ? field.options.map(String) : [],
    placeholder: String(field.placeholder ?? ''),
    helpText: String(field.helpText ?? ''),
    sortOrder: Number(field.order ?? index),
    visible: true,
  }));

  return <DynamicFormRenderer fields={normalized} values={values} errors={errors} onChange={onChange} />;
};
