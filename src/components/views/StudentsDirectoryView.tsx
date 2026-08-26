import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  Camera,
  MoreVertical,
  Eye,
  Shield,
  CreditCard,
  Building,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { StudentRecord } from '../../types';

interface StudentsDirectoryViewProps {
  students: StudentRecord[];
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentsDirectoryView: React.FC<StudentsDirectoryViewProps> = ({
  students,
  onOpenModal,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Derive class list from real student data — no hardcoded school-specific classes
  const classesList = ['All', ...Array.from(new Set(students.map((s) => s.class).filter(Boolean))).sort()];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.classArm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.guardianName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'All' || s.class === selectedClass || s.classArm.includes(selectedClass);
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Admission No', 'Name', 'Class Arm', 'Gender', 'Status', 'Term Average', 'Attendance', 'Fee Status', 'Guardian Phone'];
    const rows = filteredStudents.map(s => [
      s.admissionNo,
      `"${s.name}"`,
      s.classArm,
      s.gender,
      s.status,
      `${s.currentAverage}%`,
      `${s.attendanceRate}%`,
      s.feesStatus,
      s.guardianPhone
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Skuggle_Students_${selectedClass}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header & SIS Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Student Information System (SIS) <Users className="w-5 h-5 text-indigo-600" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete database of enrolled students, biometrics, fee records, and terminal academic profiles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onOpenModal('report_card')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Batch PDF Export</span>
          </button>

          <button
            id="btn-add-new-student-sis"
            onClick={() => onOpenModal('register_student')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all hover:shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Student</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, admission no, class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Class Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {classesList.map((cls) => {
            const isSelected = selectedClass === cls;
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                {cls}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Students Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-600">
            Showing <span className="text-indigo-600">{filteredStudents.length}</span> students
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="pb-3 pl-2">Photo & Student</th>
                <th className="pb-3">Admission No.</th>
                <th className="pb-3">Class Arm</th>
                <th className="pb-3">Gender</th>
                <th className="pb-3">Term Average</th>
                <th className="pb-3">Attendance</th>
                <th className="pb-3">Fee Status</th>
                <th className="pb-3">Guardian</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Users className="mx-auto mb-3 h-9 w-9 text-slate-300" />
                    <p className="text-sm font-bold text-slate-600">
                      {students.length === 0 ? 'No students registered yet' : 'No students match your filters'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {students.length === 0
                        ? 'Register or import students from school setup to see them here.'
                        : 'Try adjusting your search term, class, or status filter.'}
                    </p>
                  </td>
                </tr>
              ) : filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => onOpenModal('report_card', student)}
                >
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {student.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {student.stateOfOrigin} State • {student.nationality}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-[11.5px] font-semibold text-slate-600">
                    {student.admissionNo}
                  </td>
                  <td className="py-3 font-bold text-slate-700">
                    {student.classArm}
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className={`w-2 h-2 rounded-full ${student.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`} />
                      {student.gender}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="font-extrabold text-slate-900">{student.currentAverage}%</span>
                  </td>
                  <td className="py-3">
                    <span className="font-bold text-emerald-600">{student.attendanceRate}%</span>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      student.feesStatus === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : student.feesStatus === 'Partial'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {student.feesStatus}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">
                    <p className="font-medium text-slate-800">{student.guardianName}</p>
                    <p className="text-[10px] text-slate-400">{student.guardianPhone}</p>
                  </td>
                  <td className="py-3 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="View Official Terminal Report Card"
                        onClick={() => onOpenModal('report_card', student)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        title="Check Result PIN"
                        onClick={() => onOpenModal('result_checker', student)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
