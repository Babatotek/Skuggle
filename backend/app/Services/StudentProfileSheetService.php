<?php

namespace App\Services;

use App\Domain\Tenancy\TenantContext;
use App\Models\Student;
use Illuminate\Support\Facades\Storage;

final class StudentProfileSheetService
{
    public function __construct(private readonly TenantContext $context) {}

    public function generateHtml(Student $student): string
    {
        $student->loadMissing(['enrollments.schoolClass', 'enrollments.academicSession', 'guardians']);
        $tenant = $this->context->tenant();
        $enrollment = $student->enrollments->first();
        $primaryGuardian = $student->guardians->first();
        $residential = data_get($student->metadata, 'residential', []);
        $emergency = data_get($student->metadata, 'emergency', []);
        $generatedAt = now()->format('d M Y, H:i');
        $classLabel = trim(($enrollment?->schoolClass?->name ?? '').' '.($enrollment?->schoolClass?->arm ?? ''));
        $settings = is_array($tenant->settings) ? $tenant->settings : [];
        $schoolAddress = data_get($settings, 'branding.address', '');

        $photoHtml = $this->buildPhotoHtml($student);

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Student Profile — {$this->e($student->admission_number)}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #fff;
      padding: 14mm 12mm;
      box-shadow: 0 8px 30px rgba(15,23,42,.08);
    }
    .toolbar {
      max-width: 210mm;
      margin: 0 auto 12px;
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 8px;
    }
    .toolbar button {
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .toolbar button.secondary { background: #fff; color: #334155; border: 1px solid #cbd5e1; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .school { font-size: 20px; font-weight: 800; color: #4f46e5; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .meta { font-size: 11px; color: #64748b; text-align: right; }
    .profile {
      display: flex;
      gap: 18px;
      align-items: center;
      margin-bottom: 22px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
    }
    .name { font-size: 24px; font-weight: 800; margin: 0 0 6px; line-height: 1.2; }
    .id { font-family: ui-monospace, monospace; color: #4f46e5; font-size: 14px; font-weight: 700; }
    .badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #eef2ff;
      color: #4338ca;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    section { margin-bottom: 18px; page-break-inside: avoid; }
    h2 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin: 0 0 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
      font-size: 13px;
    }
    .label { color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }
    .value { font-weight: 600; color: #0f172a; }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .page { width: auto; min-height: auto; margin: 0; padding: 0; box-shadow: none; }
    }
    @media screen and (max-width: 900px) {
      .page { width: 100%; min-height: auto; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" onclick="window.print()">Print A4 Profile</button>
    <button type="button" class="secondary" onclick="window.close()">Close</button>
  </div>
  <div class="page">
    <div class="header">
      <div>
        <div class="school">{$this->e($tenant->name)}</div>
        <div class="subtitle">Official Student Information Sheet</div>
        {$this->optionalLine($schoolAddress)}
      </div>
      <div class="meta">
        <div>Generated: {$generatedAt}</div>
        <div>Document ID: {$this->e($student->public_id)}</div>
      </div>
    </div>

    <div class="profile">
      {$photoHtml}
      <div>
        <h1 class="name">{$this->e(trim("{$student->first_name} {$student->middle_name} {$student->last_name}"))}</h1>
        <div class="id">{$this->e($student->admission_number)}</div>
        <div class="subtitle" style="margin-top:6px;">{$this->e($classLabel)} · {$this->e($enrollment?->academicSession?->name ?? '—')}</div>
        <span class="badge">{$this->e(ucfirst($student->status))}</span>
      </div>
    </div>

    <section>
      <h2>Personal Information</h2>
      <div class="grid">
        <div><div class="label">Date of Birth</div><div class="value">{$this->e($student->date_of_birth?->format('d M Y') ?? '—')}</div></div>
        <div><div class="label">Gender</div><div class="value">{$this->e(ucfirst((string) $student->gender))}</div></div>
        <div><div class="label">Nationality</div><div class="value">{$this->e($student->nationality ?? '—')}</div></div>
        <div><div class="label">State of Origin</div><div class="value">{$this->e($student->state_of_origin ?? '—')}</div></div>
        <div><div class="label">Admission Date</div><div class="value">{$this->e($student->admission_date?->format('d M Y') ?? '—')}</div></div>
        <div><div class="label">Profile Completion</div><div class="value">{$student->profile_completion_percent}%</div></div>
      </div>
    </section>

    <section>
      <h2>Academic Placement</h2>
      <div class="grid">
        <div><div class="label">Class</div><div class="value">{$this->e($classLabel ?: '—')}</div></div>
        <div><div class="label">Session</div><div class="value">{$this->e($enrollment?->academicSession?->name ?? '—')}</div></div>
        <div><div class="label">Admission Type</div><div class="value">{$this->e($enrollment?->admission_type ?? '—')}</div></div>
        <div><div class="label">Student Category</div><div class="value">{$this->e($enrollment?->student_category ?? '—')}</div></div>
      </div>
    </section>

    <section>
      <h2>Guardian Information</h2>
      <div class="grid">
        <div><div class="label">Name</div><div class="value">{$this->e($primaryGuardian?->name ?? '—')}</div></div>
        <div><div class="label">Relationship</div><div class="value">{$this->e($primaryGuardian?->pivot?->relationship ?? '—')}</div></div>
        <div><div class="label">Phone</div><div class="value">{$this->e($primaryGuardian?->phone ?? '—')}</div></div>
        <div><div class="label">Email</div><div class="value">{$this->e($primaryGuardian?->email ?? '—')}</div></div>
      </div>
    </section>

    <section>
      <h2>Contact & Emergency</h2>
      <div class="grid">
        <div><div class="label">Residential Address</div><div class="value">{$this->e(trim(($residential['address'] ?? '').' '.($residential['city'] ?? '').' '.($residential['state'] ?? '')) ?: '—')}</div></div>
        <div><div class="label">Emergency Contact</div><div class="value">{$this->e($emergency['name'] ?? '—')}</div></div>
        <div><div class="label">Emergency Phone</div><div class="value">{$this->e($emergency['phone'] ?? '—')}</div></div>
        <div><div class="label">Relationship</div><div class="value">{$this->e($emergency['relationship'] ?? '—')}</div></div>
      </div>
    </section>

    <div class="footer">
      This document was generated by Skuggle for {$this->e($tenant->name)}. Medical information is excluded by default.
    </div>
  </div>
</body>
</html>
HTML;
    }

    private function buildPhotoHtml(Student $student): string
    {
        $initials = e(mb_substr($student->first_name, 0, 1).mb_substr($student->last_name, 0, 1));

        if (! $student->photo_key) {
            return '<div style="width:88px;height:88px;border-radius:12px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#64748b;flex-shrink:0;">'
                .$initials.'</div>';
        }

        try {
            $disk = (string) config('skuggle.library.disk');
            $url = Storage::disk($disk)->url($student->photo_key);

            return '<img src="'.e($url).'" alt="Student photo" style="width:88px;height:88px;border-radius:12px;object-fit:cover;border:2px solid #e2e8f0;flex-shrink:0;" />';
        } catch (\Throwable) {
            return '<div style="width:88px;height:88px;border-radius:12px;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#64748b;flex-shrink:0;">'
                .$initials.'</div>';
        }
    }

    private function optionalLine(?string $value): string
    {
        if (! $value) {
            return '';
        }

        return '<div class="subtitle">'.$this->e($value).'</div>';
    }

    private function e(?string $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}
