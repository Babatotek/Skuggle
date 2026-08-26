import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import {
  studentImportService,
  type ImportValidationResult,
} from "@/shared/api/studentImport";
import { getApiError } from "@/shared/api/client";
import { feedbackBus } from "@/shared/feedback/feedbackBus";

export function StudentImportPanel({ onImported }: { onImported: () => void }) {
  const [validation, setValidation] = useState<ImportValidationResult | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const result = await studentImportService.validate(file);
      setValidation(result);
      if (result.errorCount > 0) {
        feedbackBus.error(
          `${result.errorCount} row(s) need correction before import.`,
        );
      } else {
        feedbackBus.success(`${result.validCount} student row(s) ready to import.`);
      }
    } catch (error) {
      feedbackBus.error(getApiError(error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmImport = async () => {
    if (!validation?.rows.length) return;
    setBusy(true);
    try {
      const result = await studentImportService.confirm(validation.rows);
      feedbackBus.success(`${result.imported} student(s) imported.`);
      setValidation(null);
      onImported();
    } catch (error) {
      feedbackBus.error(getApiError(error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void studentImportService.downloadTemplate()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          Download CSV template
        </button>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {validation && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <FileSpreadsheet className="h-4 w-4" />
            {validation.validCount} valid · {validation.errorCount} error(s)
          </div>
          {validation.errors.length > 0 && (
            <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-rose-700">
              {validation.errors.slice(0, 8).map((issue, index) => (
                <li key={`${issue.row}-${issue.field}-${index}`}>
                  Row {issue.row}: {issue.message}
                </li>
              ))}
            </ul>
          )}
          {validation.validCount > 0 && validation.errorCount === 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void confirmImport()}
              className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Import {validation.validCount} student(s)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
