import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button, FormField, Input, Modal } from '../../../components/ui';
import { apiMutation, describeApiError, initializeCsrf } from '../../../lib/apiClient';

interface ImportError { row: number; field: string; message: string }
interface ValidateResult {
  validCount: number;
  errorCount: number;
  preview: Array<Record<string, string>>;
  errors: ImportError[];
  rows: Array<Record<string, string>>;
}

export const WorkforceImportModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
  showToast: (title: string, description: string, tone?: 'success' | 'error' | 'info' | 'warning' | 'failed') => void;
}> = ({ open, onClose, onImported, showToast }) => {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
  };

  const downloadTemplate = async () => {
    try {
      await initializeCsrf();
      const response = await fetch('/api/v1/employees/imports/template', { credentials: 'include' });
      if (!response.ok) throw new Error('Template download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'skuggle-workforce-import-template.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast('Template unavailable', describeApiError(error), 'error');
    }
  };

  const validate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await apiMutation<{ success: true; data: ValidateResult }>('/employees/imports/validate', 'POST', body);
      setResult(response.data);
      if (response.data.validCount === 0) {
        showToast('No valid rows', 'Fix the CSV errors and try again.', 'warning');
      }
    } catch (error) {
      showToast('Validation failed', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!result?.rows.length) return;
    setBusy(true);
    try {
      const response = await apiMutation<{ success: true; data: { imported: number; errors: ImportError[] } }>(
        '/employees/imports/confirm',
        'POST',
        { rows: result.rows },
      );
      onImported(response.data.imported);
      showToast('Workforce imported', `${response.data.imported} staff records were created.`, 'success');
      reset();
      onClose();
    } catch (error) {
      showToast('Import failed', describeApiError(error), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => { reset(); onClose(); }}
      title="Import workforce"
      description="Upload a CSV of employment records. Login accounts are not created by import."
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => void downloadTemplate()}>
            Download template
          </Button>
        </div>
        <form onSubmit={validate} className="space-y-4">
          <FormField label="CSV file" required>
            <Input required type="file" accept=".csv,text/csv" onChange={(event) => { setFile(event.target.files?.[0] || null); setResult(null); }} />
          </FormField>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Required: employee_number, name, employment_type. Optional: status, staff_category, position_name, department_name, campus_name, email, phone, started_at.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={!file || busy} leftIcon={<Upload className="h-4 w-4" />}>{busy ? 'Validating…' : 'Validate CSV'}</Button>
          </div>
        </form>

        {result && (
          <div className="space-y-3 rounded-[var(--radius-card)] border border-[var(--color-border-default)] p-4 text-sm">
            <p><strong>{result.validCount}</strong> valid · <strong>{result.errorCount}</strong> errors</p>
            {result.errors.slice(0, 8).map((error) => (
              <p key={`${error.row}-${error.field}-${error.message}`} className="text-[var(--color-status-negative-text)]">
                Row {error.row} ({error.field}): {error.message}
              </p>
            ))}
            {result.preview.length > 0 && (
              <div>
                <p className="mb-2 font-semibold">Preview</p>
                <ul className="space-y-1 text-xs text-[var(--color-text-secondary)]">
                  {result.preview.map((row) => (
                    <li key={row.employee_number}>{row.employee_number} — {row.name} ({row.position_name || 'No position'})</li>
                  ))}
                </ul>
              </div>
            )}
            <Button type="button" disabled={busy || result.validCount < 1} onClick={() => void confirm()}>
              {busy ? 'Importing…' : `Import ${result.validCount} staff`}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

