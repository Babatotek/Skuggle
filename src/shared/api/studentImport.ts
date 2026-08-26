import { apiDownload, apiRequest } from "./client";

export interface ImportValidationResult {
  validCount: number;
  errorCount: number;
  preview: Array<Record<string, string>>;
  errors: Array<{ row: number; field: string; message: string }>;
  rows: Array<Record<string, string>>;
}

export interface ImportConfirmResult {
  imported: number;
  errors: Array<{ row: number; field: string; message: string }>;
}

export const studentImportService = {
  downloadTemplate: () =>
    apiDownload("/students/imports/template", "skuggle-student-import-template.csv"),

  validate: (file: File) => {
    const formData = new FormData();
    formData.set("file", file);
    return apiRequest<ImportValidationResult>("/students/imports/validate", {
      method: "POST",
      body: formData,
    });
  },

  confirm: (rows: Array<Record<string, string>>) =>
    apiRequest<ImportConfirmResult>("/students/imports/confirm", {
      method: "POST",
      body: { rows },
    }),
};
