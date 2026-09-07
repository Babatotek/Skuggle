import { API_BASE_URL } from './apiClient';

export interface StudentPrintProfile {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  className?: string;
  arm?: string;
  gender?: string;
  dateOfBirth?: string;
  photoUrl?: string;
  status?: string;
  guardians?: Array<{ name: string; phone: string; relationship: string }>;
  enrollment?: { sessionName?: string; className?: string; arm?: string };
}

export interface SchoolBranding {
  schoolName: string;
  primaryColor?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export function openPrintDocument(html: string, title: string): Window | null {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200');
  if (!printWindow) return null;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = title;
  return printWindow;
}

export async function fetchProfileSheetHtml(studentId: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/students/${encodeURIComponent(studentId)}/profile-sheet`, {
    credentials: 'include',
    headers: { Accept: 'text/html' },
  });
  if (!response.ok) {
    throw new Error('Could not generate the student profile sheet.');
  }
  return response.text();
}

export async function printStudentProfileSheet(studentId: string, studentName: string): Promise<void> {
  const html = await fetchProfileSheetHtml(studentId);
  const win = openPrintDocument(html, `Student Profile — ${studentName}`);
  if (!win) throw new Error('Pop-up blocked. Allow pop-ups to print the profile sheet.');
}

export function buildStudentIdCardHtml(profile: StudentPrintProfile, branding: SchoolBranding): string {
  const schoolName = branding.schoolName || 'School';
  const primary = branding.primaryColor || '#4f46e5';
  const classLabel = [profile.className || profile.enrollment?.className, profile.arm || profile.enrollment?.arm].filter(Boolean).join(' · ');
  const session = profile.enrollment?.sessionName || new Date().getFullYear();
  const guardian = profile.guardians?.[0];
  const initials = `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase();
  const photoBlock = profile.photoUrl
    ? `<img src="${profile.photoUrl}" alt="" style="width:72px;height:72px;border-radius:12px;object-fit:cover;border:2px solid #fff;" />`
    : `<div style="width:72px;height:72px;border-radius:12px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#64748b;border:2px solid #fff;">${initials}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Student ID — ${profile.admissionNumber}</title>
  <style>
    @page { size: 85.6mm 53.98mm; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 8mm; font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; background: #f8fafc; }
    .toolbar { margin-bottom: 12px; text-align: center; }
    .toolbar button { background: ${primary}; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-weight: 600; cursor: pointer; }
    .sheet { display: flex; flex-direction: column; gap: 6mm; align-items: center; }
    .card { width: 85.6mm; height: 53.98mm; border-radius: 4mm; overflow: hidden; box-shadow: 0 4px 20px rgba(15,23,42,.12); page-break-inside: avoid; }
    .front { background: linear-gradient(135deg, ${primary}, #312e81); color: #fff; padding: 4mm; display: flex; gap: 3mm; height: 100%; }
    .front-main { flex: 1; min-width: 0; }
    .school { font-size: 7px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; opacity: .9; }
    .name { font-size: 11px; font-weight: 800; margin: 2mm 0 1mm; line-height: 1.2; }
    .meta { font-size: 7px; opacity: .92; line-height: 1.35; }
    .id-no { font-family: monospace; font-size: 8px; font-weight: 700; margin-top: 2mm; }
    .back { background: #fff; border: 1px solid #e2e8f0; padding: 4mm; height: 100%; font-size: 6.5px; line-height: 1.4; }
    .back h3 { margin: 0 0 2mm; font-size: 7px; text-transform: uppercase; color: ${primary}; }
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none; }
      .sheet { gap: 0; }
      .card { box-shadow: none; margin: 0; }
      .card + .card { margin-top: 0; page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" onclick="window.print()">Print Student ID Card</button>
  </div>
  <div class="sheet">
    <div class="card">
      <div class="front">
        ${photoBlock}
        <div class="front-main">
          <div class="school">${schoolName}</div>
          <div class="name">${profile.fullName}</div>
          <div class="meta">${classLabel || 'Student'}<br/>Session ${session}</div>
          <div class="id-no">${profile.admissionNumber}</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="back">
        <h3>Emergency / Guardian</h3>
        <div><strong>${guardian?.name || '—'}</strong> (${guardian?.relationship || 'Guardian'})</div>
        <div>${guardian?.phone || '—'}</div>
        <h3 style="margin-top:3mm;">School Contact</h3>
        <div>${branding.address || '—'}</div>
        <div>${branding.phone || ''} ${branding.email ? '· ' + branding.email : ''}</div>
        <div style="margin-top:3mm;color:#64748b;">Verify at skuggle.app · ${profile.admissionNumber}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function printStudentIdCard(profile: StudentPrintProfile, branding: SchoolBranding): void {
  const html = buildStudentIdCardHtml(profile, branding);
  const win = openPrintDocument(html, `Student ID — ${profile.admissionNumber}`);
  if (!win) throw new Error('Pop-up blocked. Allow pop-ups to print the student ID card.');
}
