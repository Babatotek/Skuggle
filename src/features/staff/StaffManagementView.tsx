import React, { useState } from 'react';
import {
  GraduationCap,
  Mail,
  Phone,
  Search,
  UserPlus,
  Send,
  Eye,
  BookOpen,
  LayoutGrid,
  List,
  ShieldCheck,
  Award,
  Upload,
  Plus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StaffMember } from '../../types';
import {
  Button,
  StatusBadge,
  MetricCard,
  Modal,
  Drawer,
  FormField,
  Input,
  Select,
  SearchInput,
  DataTable,
  Column,
  PageHeader,
} from '../../components/ui';

interface StaffManagementViewProps { context?: 'teachers' | 'staff' }

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({ context = 'staff' }) => {
  const { staff, inviteStaff, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    phone: '+234 ',
    role: 'Teacher',
    subjects: 'Mathematics, Basic Science',
    assignedClasses: 'JSS 2A, JSS 2B',
  });

  const contextualStaff = context === 'teachers' ? staff.filter((member) => member.role.toLowerCase().includes('teacher')) : staff;
  const filteredStaff = contextualStaff.filter(
    (st) =>
      st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeCount = staff.filter((s) => s.status === 'Active').length;
  const teacherCount = staff.filter((s) => s.role.toLowerCase().includes('teacher')).length;

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
    showToast('Invitation Dispatched', `Magic invite link sent to ${newStaff.email}.`, 'success');
    setNewStaff({
      fullName: '',
      email: '',
      phone: '+234 ',
      role: 'Teacher',
      subjects: 'Mathematics, Basic Science',
      assignedClasses: 'JSS 2A, JSS 2B',
    });
  };

  const columns: Column<StaffMember>[] = [
    {
      key: 'name',
      header: 'Faculty Member',
      sortable: true,
      accessor: (member) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-xs border border-purple-100/80 shrink-0">
            {member.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-slate-900 block truncate">{member.fullName}</span>
            <span className="text-[11px] text-slate-500 block">{member.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      accessor: (member) => <span className="font-medium text-indigo-700">{member.role}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      accessor: (member) => <span className="font-mono text-xs text-slate-600">{member.phone}</span>,
    },
    {
      key: 'subjects',
      header: 'Subjects / Classes',
      accessor: (member) => {
        const subjects = member.subjects ?? member.assignedSubjects ?? [];
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {subjects.slice(0, 2).map((sub, i) => (
              <span key={i} className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-md font-medium">
                {sub}
              </span>
            ))}
            {subjects.length > 2 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-500 rounded-md font-medium">
                +{subjects.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (member) => (
        <StatusBadge status={member.status === 'Active' ? 'Active' : 'Pending'} />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      accessor: (member) => (
        <Button
          variant="ghost"
          size="xs"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedStaff(member);
          }}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label={context === 'teachers' ? 'Total Teachers' : 'Total Staff'}
          value={contextualStaff.length}
          icon={<GraduationCap className="w-5 h-5" />}
          variant="default"
          subtitle={context === 'teachers' ? 'Teaching personnel' : 'All staff members'}
        />
        <MetricCard
          label="Active Verified"
          value={contextualStaff.filter((s) => s.status === 'Active').length}
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="success"
          subtitle="Full access granted"
        />
        <MetricCard
          label="Teaching Staff"
          value={teacherCount}
          icon={<BookOpen className="w-5 h-5" />}
          variant="primary"
          subtitle="Subject educators"
        />
        <MetricCard
          label="Pending Invites"
          value={contextualStaff.filter((s) => s.status !== 'Active').length}
          icon={<Award className="w-5 h-5" />}
          variant="warning"
          subtitle="Awaiting sign-up"
        />
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-base text-slate-900">{context === 'teachers' ? 'Teaching Personnel' : 'Teaching & Administrative Staff'}</h3>
            <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              {filteredStaff.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search faculty by name, email, or role..."
              className="w-full sm:w-64 h-9 text-xs"
            />

            <div className="flex items-center rounded-xl bg-slate-200/60 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-label="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Button variant="outline" size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />} onClick={() => setIsImportModalOpen(true)}>Bulk Import</Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => { setCreateMode(false); setIsInviteModalOpen(true); }}
            >
              Invite {context === 'teachers' ? 'Teacher' : 'Staff'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => { setCreateMode(true); setIsInviteModalOpen(true); }}
            >
              Create {context === 'teachers' ? 'Teacher' : 'Staff'}
            </Button>
          </div>
        </div>

        {/* View Content: Grid vs DataTable */}
        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={filteredStaff}
            keyExtractor={(item) => item.id}
            pageSize={10}
            onRowClick={(member) => setSelectedStaff(member)}
            emptyTitle="No faculty members found"
            emptyDescription="Try adjusting your search criteria or invite a new staff member."
            emptyAction={{
              label: 'Invite Staff',
              onClick: () => setIsInviteModalOpen(true),
            }}
            className="border-none rounded-none shadow-none"
          />
        ) : (
          <div className="p-5">
            {filteredStaff.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-slate-700">No faculty members found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStaff.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedStaff(member)}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-sm border border-purple-100/80">
                          {member.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <StatusBadge
                          status={member.status === 'Active' ? 'Active' : 'Pending'}
                        />
                      </div>

                      <h4 className="font-display font-bold text-sm text-slate-900">{member.fullName}</h4>
                      <p className="text-xs text-indigo-600 font-semibold mb-3">{member.role}</p>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px]">{member.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Subjects / Classes:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(member.subjects ?? member.assignedSubjects ?? []).map((sub, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[10px] bg-slate-50 border border-slate-200/80 rounded-md font-medium text-slate-700"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Staff Details Drawer */}
      <Drawer
        isOpen={!!selectedStaff}
        onClose={() => setSelectedStaff(null)}
        title={
          selectedStaff && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                {selectedStaff.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedStaff.fullName}</h3>
                <p className="text-xs text-indigo-600 font-medium">{selectedStaff.role}</p>
              </div>
            </div>
          )
        }
        footer={
          selectedStaff && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => showToast('Dispatched', `Magic access link resent to ${selectedStaff.email}.`, 'info')}
            >
              Resend Access Link
            </Button>
          )
        }
      >
        {selectedStaff && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contact Information</h4>
              <div className="space-y-2 text-xs">
                <p className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400" /> {selectedStaff.email}
                </p>
                <p className="flex items-center gap-2 text-slate-700 font-mono">
                  <Phone className="w-4 h-4 text-slate-400" /> {selectedStaff.phone}
                </p>
                <div className="pt-2">
                  <StatusBadge status={selectedStaff.status === 'Active' ? 'Active' : 'Pending'} />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Assigned Subjects & Arms</h4>
              <div className="flex flex-wrap gap-1.5">
                {(selectedStaff.subjects ?? selectedStaff.assignedSubjects ?? []).map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 text-slate-800 rounded-lg font-medium"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={`${createMode ? 'Create' : 'Invite'} ${context === 'teachers' ? 'Teacher' : 'Staff Member'}`}
        description={createMode ? 'Create a profile and send workspace access.' : 'Send an invitation to join the school workspace.'}
        size="md"
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          <FormField label="Staff Full Name" required>
            <Input
              required
              value={newStaff.fullName}
              onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
              placeholder="e.g. Mrs. Blessing Okafor"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Email Address" required>
              <Input
                type="email"
                required
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="teacher@school.edu.ng"
              />
            </FormField>
            <FormField label="Phone Number">
              <Input
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                placeholder="+234 803 000 0000"
              />
            </FormField>
          </div>

          <FormField label="Assigned Role" required>
            <Select value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}>
              <option value="Teacher">Subject Teacher</option>
              <option value="Principal">Vice Principal / Principal</option>
              <option value="Exam Officer">Examination Officer</option>
              <option value="Bursar">Bursar / Accountant</option>
            </Select>
          </FormField>

          <FormField label="Allocated Subjects (comma-separated)">
            <Input
              value={newStaff.subjects}
              onChange={(e) => setNewStaff({ ...newStaff, subjects: e.target.value })}
              placeholder="e.g. Mathematics, Basic Technology"
            />
          </FormField>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" leftIcon={<Send className="w-3.5 h-3.5" />}>
              {createMode ? 'Create Profile' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title={`Bulk Import ${context === 'teachers' ? 'Teachers' : 'Staff'}`} description="Upload a CSV file using the school people template.">
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center"><Upload className="mx-auto h-7 w-7 text-indigo-600" /><p className="mt-3 text-sm font-semibold text-slate-800">Choose CSV file or drag and drop</p><p className="mt-1 text-xs text-slate-400">Name, email, phone, role and department columns are supported.</p><label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"><Upload className="h-4 w-4" />Browse CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={() => { setIsImportModalOpen(false); showToast('Import queued', 'The selected people file is ready for validation.', 'success'); }} /></label></div>
      </Modal>
    </div>
  );
};
