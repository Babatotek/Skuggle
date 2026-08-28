import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  PlusCircle,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  Shield,
  Search,
  X,
  UserPlus,
  Send,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StaffMember } from '../../types';

export const StaffManagementView: React.FC = () => {
  const { staff, inviteStaff, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    phone: '+234 ',
    role: 'Teacher',
    subjects: 'Mathematics, Basic Science',
    assignedClasses: 'JSS 2A, JSS 2B',
  });

  const filteredStaff = staff.filter(
    (st) =>
      st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.fullName || !newStaff.email) return;

    inviteStaff({
      fullName: newStaff.fullName,
      email: newStaff.email,
      phone: newStaff.phone,
      role: newStaff.role,
      subjects: newStaff.subjects.split(',').map((s) => s.trim()),
      assignedClasses: newStaff.assignedClasses.split(',').map((c) => c.trim()),
    });

    setIsInviteModalOpen(false);
    showToast('Invitation Dispatched', `Magic invite link sent to ${newStaff.email}.`);
    setNewStaff({
      fullName: '',
      email: '',
      phone: '+234 ',
      role: 'Teacher',
      subjects: 'Mathematics, Basic Science',
      assignedClasses: 'JSS 2A, JSS 2B',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
              Staff Directory & Role Invitations
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 rounded-full">
              {staff.length} Active Staff
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Onboard subject teachers, class masters, and exam officers with scoped tenant permissions.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite New Staff</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-display font-bold text-base text-slate-900">
            Teaching & Administrative Faculty
          </h3>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-purple-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-sm border border-purple-200">
                    {member.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                      member.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {member.status === 'Active' ? 'Active Verified' : 'Invite Sent'}
                  </span>
                </div>

                <h4 className="font-display font-bold text-sm text-slate-900">{member.fullName}</h4>
                <p className="text-xs text-indigo-700 font-semibold mb-2">{member.role}</p>

                <div className="space-y-1 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px]">{member.phone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/80">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Subjects / Classes:
                </div>
                <div className="flex flex-wrap gap-1">
                  {(member.subjects ?? member.assignedSubjects).map((sub, idx) => (
                    <span key={idx} className="px-2 py-0.5 text-[10px] bg-white border border-slate-200 rounded-md font-medium text-slate-700">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Staff Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">Invite Faculty Member</h3>
                  <p className="text-xs text-slate-500">Send an invitation to join Crown Heights Academy workspace.</p>
                </div>
                <button onClick={() => setIsInviteModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Full Name *</label>
                  <input
                    type="text"
                    value={newStaff.fullName}
                    onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                    placeholder="e.g. Mrs. Blessing Okafor"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      placeholder="teacher@school.edu.ng"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      placeholder="+234 803 000 0000"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="Teacher">Subject Teacher</option>
                    <option value="Principal">Vice Principal / Principal</option>
                    <option value="Exam Officer">Examination Officer</option>
                    <option value="Bursar">Bursar / Accountant</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allocated Subjects (comma-separated)</label>
                  <input
                    type="text"
                    value={newStaff.subjects}
                    onChange={(e) => setNewStaff({ ...newStaff, subjects: e.target.value })}
                    placeholder="e.g. Mathematics, Basic Technology"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-xl shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Workspace Invite</span>
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
