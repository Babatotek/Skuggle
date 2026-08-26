import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { appConfig } from "@/app/config";
import { customFieldService } from "@/shared/api/customFields";
import { getApiError } from "@/shared/api/client";
import { feedbackBus } from "@/shared/feedback/feedbackBus";
import {
  emptyCustomFieldDraft,
  type CustomFieldDefinition,
  type CustomFieldEntity,
} from "@/shared/types/customFields";
import { LoadingButton } from "@/shared/ui/LoadingButton";

interface CustomFieldsSettingsPanelProps {
  entity: CustomFieldEntity;
  title: string;
  description: string;
}

export function CustomFieldsSettingsPanel({
  entity,
  title,
  description,
}: CustomFieldsSettingsPanelProps) {
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(appConfig.liveApi);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appConfig.liveApi) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    void customFieldService
      .list(entity, controller.signal)
      .then((response) => setFields(response.fields))
      .catch((caught: unknown) => setError(getApiError(caught).message))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [entity]);

  const updateField = (
    index: number,
    patch: Partial<CustomFieldDefinition>,
  ): void => {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    );
  };

  const addField = (): void => {
    setFields((current) => [...current, emptyCustomFieldDraft()]);
  };

  const removeField = (index: number): void => {
    setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index));
  };

  const save = async (): Promise<void> => {
    if (!appConfig.liveApi) {
      feedbackBus.warning("Connect the live API to save custom fields.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await customFieldService.save(
        entity,
        fields.map((field, index) => ({ ...field, order: index })),
      );
      setFields(response.fields);
      feedbackBus.success(`${title} fields saved.`);
    } catch (caught: unknown) {
      const apiError = getApiError(caught);
      setError(apiError.message);
      feedbackBus.error(apiError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading {title.toLowerCase()} fields…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {fields.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No custom fields yet. Add fields your school needs for local or
            regulatory requirements.
          </div>
        ) : (
          fields.map((field, index) => (
            <div
              key={`${field.key || "new"}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Field {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-700">
                  Label *
                  <input
                    value={field.label}
                    onChange={(event) =>
                      updateField(index, { label: event.target.value })
                    }
                    placeholder="e.g. Local Government Area"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Field key
                  <input
                    value={field.key}
                    onChange={(event) =>
                      updateField(index, { key: event.target.value })
                    }
                    placeholder="Auto-generated from label if blank"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Type
                  <select
                    value={field.type}
                    onChange={(event) =>
                      updateField(index, {
                        type: event.target.value as CustomFieldDefinition["type"],
                        options:
                          event.target.value === "select" ? field.options : [],
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                    <option value="boolean">Yes / No</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-700">
                  Section
                  <input
                    value={field.section}
                    onChange={(event) =>
                      updateField(index, { section: event.target.value })
                    }
                    placeholder="Additional Information"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal"
                  />
                </label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">
                  Placeholder
                  <input
                    value={field.placeholder ?? ""}
                    onChange={(event) =>
                      updateField(index, { placeholder: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal"
                  />
                </label>
                {field.type === "select" ? (
                  <label className="text-xs font-bold text-slate-700 sm:col-span-2">
                    Options (one per line)
                    <textarea
                      value={field.options.join("\n")}
                      onChange={(event) =>
                        updateField(index, {
                          options: event.target.value
                            .split("\n")
                            .map((option) => option.trim())
                            .filter(Boolean),
                        })
                      }
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-normal"
                    />
                  </label>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-4 text-xs">
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(event) =>
                      updateField(index, { required: event.target.checked })
                    }
                  />
                  Required on registration
                </label>
                <label className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={field.showOnRegistration}
                    onChange={(event) =>
                      updateField(index, {
                        showOnRegistration: event.target.checked,
                      })
                    }
                  />
                  Show on registration form
                </label>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <Plus className="size-4" />
          Add field
        </button>
        <LoadingButton
          type="button"
          loading={saving}
          loadingText="Saving…"
          onClick={() => {
            void save();
          }}
          icon={<Save className="size-4" />}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
        >
          Save {title.toLowerCase()} fields
        </LoadingButton>
      </div>
    </div>
  );
}
