import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  PlusCircle,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  Award,
  X,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StudentRecord } from '../../types';

export const StudentRegistryView: React.FC = () => {
  const { students, addStudent, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    admissionNo: '',
    classLevel: 'JSS 1',
    arm: 'A',
    gender: 'Male' as const,
    dateOfBirth: '2012-05-15',
    guardianName: '',
    guardianPhone: '+234 ',
    guardianEmail: '',
  });

  const filtered = students.filter((s) => {
    const matchesClass = classFilter === 'ALL' || s.classLevel === classFilter;
    const matchesSearch =
      s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.admissionNo) return;

    addStudent({
      id: `std-${Date.now()}`,
      firstName: newStudent.firstName,
      lastName: newStudent.lastName,
      admissionNo: newStudent.admissionNo.toUpperCase(),
      classLevel: newStudent.classLevel,
      arm: newStudent.arm,
      gender: newStudent.gender,
      dateOfBirth: newStudent.dateOfBirth,
      guardianName: newStudent.guardianName,
      guardianPhone: newStudent.guardianPhone,
      guardianEmail: newStudent.guardianEmail,
      attendanceRate: 100,
      termAverage: 0,
      feesStatus: 'Pending',
      positionInClass: students.length + 1,
      totalStudentsInClass: students.length + 1,
      status: 'Active',
      photoUrl: '',
      guardianId: `guardian-${Date.now()}`,
      guardianRelationship: 'Guardian',
      balanceDue: 0,
    });

    setIsAddModalOpen(false);
    showToast('Student Enrolled', `${newStudent.firstName} ${newStudent.lastName} registered successfully.`);
    setNewStudent({
      firstName: '',
      lastName: '',
      admissionNo: '',
      classLevel: 'JSS 1',
      arm: 'A',
      gender: 'Male',
      dateOfBirth: '2012-05-15',
      guardianName: '',
      guardianPhone: '+234 ',
      guardianEmail: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              Student Register & 360 Profiles
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-800 rounded-full">
              {students.length} Total Enrolled
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Maintain verified student bio-data, guardian contacts, academic trajectories, and fee statuses.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>New Student Admission</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Filter:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50"
            >
              <option value="ALL">All Classes</option>
              <option value="JSS 1">JSS 1</option>
              <option value="JSS 2">JSS 2</option>
              <option value="SSS 1">SSS 1</option>
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or admission no..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-3">Admission No</th>
                <th className="py-3 px-3">Class & Arm</th>
                <th className="py-3 px-3">Attendance</th>
                <th className="py-3 px-3">Term Average</th>
                <th className="py-3 px-3">Fee Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-900 font-bold flex items-center justify-center text-xs">
                        {s.firstName[0]}
                        {s.lastName[0]}
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">
                          {s.firstName} {s.lastName}
                        </strong>
                        <span className="text-[11px] text-slate-500">{s.gender} · Born {s.dateOfBirth}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-700">{s.admissionNo}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-800">
                      {s.classLevel} - {s.arm}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-emerald-700">{s.attendanceRate}%</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-900">{s.termAverage}%</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        s.feesStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.feesStatus === 'Partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {s.feesStatus === 'Paid' ? 'Paid Full' : s.feesStatus === 'Partial' ? 'Partial' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>360 Profile</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student 360 Profile Drawer / Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-5 bg-indigo-950 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-xs text-indigo-200 font-mono">{selectedStudent.admissionNo}</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
                {/* Highlights Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Term Average</span>
                    <span className="font-display font-extrabold text-lg text-indigo-950">
                      {selectedStudent.termAverage}%
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Attendance</span>
                    <span className="font-display font-extrabold text-lg text-emerald-950">
                      {selectedStudent.attendanceRate}%
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 text-center">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Class Rank</span>
                    <span className="font-display font-extrabold text-lg text-purple-950">
                      {selectedStudent.positionInClass}nd / {selectedStudent.totalStudentsInClass}
                    </span>
                  </div>
                </div>

                {/* Guardian Details */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">Verified Guardian Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Guardian Name:</span>
                      <strong>{selectedStudent.guardianName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Phone Number:</span>
                      <strong className="font-mono">{selectedStudent.guardianPhone}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">Guardian Email:</span>
                      <span className="text-slate-800">{selectedStudent.guardianEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-right">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl bg-white"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Student Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">New Student Admission</h3>
                  <p className="text-xs text-slate-500">Add student bio-data and parent contact details.</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={newStudent.firstName}
                      onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                      placeholder="e.g. Samuel"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={newStudent.lastName}
                      onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                      placeholder="e.g. Balogun"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Admission No *</label>
                    <input
                      type="text"
                      value={newStudent.admissionNo}
                      onChange={(e) => setNewStudent({ ...newStudent, admissionNo: e.target.value })}
                      placeholder="CHIA/2026/..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-mono uppercase"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Class Level</label>
                    <select
                      value={newStudent.classLevel}
                      onChange={(e) => setNewStudent({ ...newStudent, classLevel: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                    >
                      <option value="JSS 1">JSS 1</option>
                      <option value="JSS 2">JSS 2</option>
                      <option value="SSS 1">SSS 1</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Arm</label>
                    <select
                      value={newStudent.arm}
                      onChange={(e) => setNewStudent({ ...newStudent, arm: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                    >
                      <option value="A">Arm A</option>
                      <option value="B">Arm B</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">Guardian Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Guardian Name</label>
                      <input
                        type="text"
                        value={newStudent.guardianName}
                        onChange={(e) => setNewStudent({ ...newStudent, guardianName: e.target.value })}
                        placeholder="e.g. Chief O. Balogun"
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Guardian Phone</label>
                      <input
                        type="tel"
                        value={newStudent.guardianPhone}
                        onChange={(e) => setNewStudent({ ...newStudent, guardianPhone: e.target.value })}
                        placeholder="+234 803 000 0000"
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs"
                  >
                    Complete Enrollment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
