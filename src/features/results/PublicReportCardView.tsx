import { Printer } from "lucide-react";
import type { PublicReportCard } from "@/shared/api/results";

export function PublicReportCardView({ report }: { report: PublicReportCard }) {
  const accent = report.school.primaryColour ?? "#4338CA";

  return (
    <div className="space-y-6 bg-white text-slate-900">
      <div
        className="rounded-2xl border-b-4 pb-4 text-center"
        style={{ borderColor: accent }}
      >
        <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: accent }}>
          {report.school.name}
        </h2>
        {report.school.motto && (
          <p className="mt-1 text-xs italic text-slate-600">{report.school.motto}</p>
        )}
        <p className="mt-3 text-sm font-bold text-slate-800">
          Terminal Report · {report.session} · {report.term}
        </p>
      </div>

      <dl className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Student</dt>
          <dd className="font-semibold">{report.student.displayName}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Admission no.</dt>
          <dd className="font-semibold">{report.student.admissionNumber}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Class</dt>
          <dd className="font-semibold">{report.student.className || "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Term average</dt>
          <dd className="font-semibold">
            {report.termAverage ?? "—"}
            {report.termGrade ? ` (${report.termGrade})` : ""}
          </dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-bold">Subject</th>
              <th className="px-3 py-2 font-bold">Average</th>
              <th className="px-3 py-2 font-bold">Grade</th>
            </tr>
          </thead>
          <tbody>
            {report.subjects.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-slate-500">
                  No published subject scores are available for this term yet.
                </td>
              </tr>
            ) : (
              report.subjects.map((subject) => (
                <tr key={subject.subject} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{subject.subject}</td>
                  <td className="px-3 py-2">{subject.average}%</td>
                  <td className="px-3 py-2 font-bold">{subject.grade}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {report.attendance.rate !== null && (
        <p className="text-xs text-slate-600">
          Attendance: {report.attendance.rate}% ({report.attendance.present} present,{" "}
          {report.attendance.absent} absent, {report.attendance.late} late)
        </p>
      )}

      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
      >
        <Printer className="h-3.5 w-3.5" />
        Print / save as PDF
      </button>
    </div>
  );
}
