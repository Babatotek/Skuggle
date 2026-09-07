import React, { useMemo, useState } from 'react';
import {
  Eye,
  Award,
  UserPlus,
  Upload,
  GraduationCap,
  CircleAlert,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAccess } from '../../state/ApplicationStateProviders';
import { StudentRecord } from '../../types';
import {
  Button,
  StatusBadge,
  MetricCard,
  Modal,
  Select,
  SearchInput,
  DataTable,
  Column,
  FilterBar,
  SegmentedControl,
  PageHeader,
} from '../../components/ui';
import { StudentEnrolmentWizard } from './enrolment/StudentEnrolmentWizard';
import { StudentProfileView } from './StudentProfileView';

interface StudentRegistryViewProps {
  mode?: 'register' | 'import';
  studentPublicId?: string;
  onOpenStudent?: (id: string) => void;
  onCloseStudent?: () => void;
}

/** @deprecated LEGACY_FRONTEND_V1. Retained only as a controlled rollback surface. */
export const StudentRegistryView: React.FC<StudentRegistryViewProps> = ({ mode = 'register', studentPublicId, onOpenStudent, onCloseStudent }) => {
  const { students, refreshStudents, classes, showToast, currentUser, demoMode } = useApp();

  const { hasCapability } = useAccess();
  const canCreate = demoMode || hasCapability('students.profile.create');

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [feeFilter, setFeeFilter] = useState<'ALL' | StudentRecord['feesStatus']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StudentRecord['status']>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(studentPublicId ?? null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(mode === 'import');

  const classOptions = useMemo(
    () => Array.from(new Set(students.map((item) => item.classLevel).filter(Boolean))),
    [students],
  );

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const matchesClass = classFilter === 'ALL' || student.classLevel === classFilter;
      const matchesFee = feeFilter === 'ALL' || student.feesStatus === feeFilter;
      const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter;
      const haystack = `${student.firstName} ${student.lastName} ${student.admissionNo}`.toLowerCase();
      return matchesClass && matchesFee && matchesStatus && haystack.includes(searchQuery.toLowerCase());
    });
  }, [students, classFilter, feeFilter, statusFilter, searchQuery]);

  const kpis = {
    enrolled: students.length,
    active: students.filter((item) => item.status === 'Active').length,
    outstanding: students.filter((item) => item.feesStatus !== 'Paid').length,
    atRisk: students.filter((item) => item.termAverage > 0 && item.termAverage < 50).length,
  };

  React.useEffect(() => {
    if (studentPublicId) {
      setProfileStudentId(studentPublicId);
      setSelectedStudent(students.find((item) => item.id === studentPublicId) || null);
    }
  }, [studentPublicId, students]);

  const openStudent = (student: StudentRecord) => {
    if (onOpenStudent) {
      onOpenStudent(student.id);
      return;
    }
    setSelectedStudent(student);
    setProfileStudentId(student.id);
  };

  const handleEnrolmentComplete = async (studentId: string) => {
    await refreshStudents();
    if (onOpenStudent) onOpenStudent(studentId);
    else setProfileStudentId(studentId);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    showToast('Import queued', `${file.name} will be validated against admission numbers and class codes.`, 'info');
    event.target.value = '';
    setIsImportModalOpen(false);
  };

  const columns: Column<StudentRecord>[] = [
    {
      key: 'name',
      header: 'Student',
      sortable: true,
      sortValue: (row) => `${row.firstName} ${row.lastName}`,
      accessor: (student) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-100/80 shrink-0">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-slate-900 block truncate">
              {student.firstName} {student.lastName}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {student.gender} · <span className="text-slate-400">{student.status}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'admissionNo',
      header: 'Admission No',
      sortable: true,
      accessor: (student) => (
        <span className="font-mono font-medium text-slate-700 text-xs px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60">
          {student.admissionNo}
        </span>
      ),
    },
    {
      key: 'class',
      header: 'Class & Arm',
      sortable: true,
      sortValue: (row) => `${row.classLevel} ${row.arm}`,
      accessor: (student) => (
        <span className="font-medium text-slate-800">
          {student.classLevel} <span className="text-slate-400">({student.arm})</span>
        </span>
      ),
    },
    {
      key: 'attendanceRate',
      header: 'Attendance',
      sortable: true,
      accessor: (student) => (
        <span
          className={`font-semibold ${
            student.attendanceRate >= 85
              ? 'text-emerald-700'
              : student.attendanceRate >= 70
              ? 'text-amber-700'
              : 'text-rose-700'
          }`}
        >
          {student.attendanceRate}%
        </span>
      ),
    },
    {
      key: 'termAverage',
      header: 'Term Avg',
      sortable: true,
      accessor: (student) => (
        <span className="font-semibold text-slate-900 font-display">{student.termAverage}%</span>
      ),
    },
    {
      key: 'feesStatus',
      header: 'Fee Status',
      sortable: true,
      accessor: (student) => <StatusBadge status={student.feesStatus} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      accessor: (student) => (
        <Button
          variant="ghost"
          size="xs"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedStudent(student);
            setProfileStudentId(student.id);
          }}
        >
          Profile
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student registry"
        description="Find, review and enrol students without changing the current workspace or route."
        breadcrumbs={[{ label: 'Students' }, { label: 'Registry' }]}
        primaryAction={canCreate ? <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setIsWizardOpen(true)}>Enrol student</Button> : undefined}
      />
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Enrolled"
          value={kpis.enrolled}
          icon={<Users className="w-5 h-5" />}
          variant="default"
          subtitle="Registered students"
        />
        <MetricCard
          label="Active Students"
          value={kpis.active}
          icon={<GraduationCap className="w-5 h-5" />}
          variant="primary"
          subtitle="In session"
        />
        <MetricCard
          label="Fee Outstanding"
          value={kpis.outstanding}
          icon={<CircleAlert className="w-5 h-5" />}
          variant="warning"
          subtitle="Pending or partial"
        />
        <MetricCard
          label="Academic At-Risk"
          value={kpis.atRisk}
          icon={<Award className="w-5 h-5" />}
          variant="danger"
          subtitle="Average below 50%"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <FilterBar
          resultsLabel={`${filtered.length} students`}
          search={<SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search student or admission no…" className="w-full sm:w-64" aria-label="Search students" />}
          actions={<><Button variant="secondary" size="sm" leftIcon={<Upload className="w-3.5 h-3.5" />} onClick={() => setIsImportModalOpen(true)}>Import</Button></>}
        >
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-auto font-semibold"
              aria-label="Filter by class"
            >
              <option value="ALL">All Classes</option>
              {classOptions.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
              {classes.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </Select>

            <SegmentedControl label="Fee status" value={feeFilter} onValueChange={(value) => setFeeFilter(value as typeof feeFilter)} segments={(['ALL', 'Paid', 'Partial', 'Pending'] as const).map((value) => ({ value, label: value === 'ALL' ? 'All fees' : value }))} />
            <SegmentedControl label="Student status" value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)} segments={(['ALL', 'Active', 'Suspended'] as const).map((value) => ({ value, label: value === 'ALL' ? 'All statuses' : value }))} />
        </FilterBar>

        {/* Canonical Data Grid */}
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          pageSize={10}
          onRowClick={(student) => openStudent(student)}
          emptyTitle="No students found"
          emptyDescription="No students match the selected class, fee status, or search keywords."
          emptyAction={canCreate ? {
            label: 'Enrol Student',
            onClick: () => setIsWizardOpen(true),
          } : undefined}
          caption="Students matching the current filters"
          mobileRenderer={(student) => (
            <button type="button" onClick={() => openStudent(student)} className="ds-focus-ring flex w-full items-center justify-between gap-3 p-4 text-left">
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">{student.firstName} {student.lastName}</span><span className="block text-xs text-[var(--color-text-secondary)]">{student.admissionNo} · {student.classLevel} ({student.arm})</span></span>
              <StatusBadge status={student.status} />
            </button>
          )}
          className="border-none rounded-none shadow-none"
        />
      </div>

      <StudentProfileView
        studentId={profileStudentId}
        fallback={selectedStudent}
        onClose={() => {
          setProfileStudentId(null);
          setSelectedStudent(null);
          onCloseStudent?.();
        }}
        onUpdated={() => void refreshStudents()}
        showToast={showToast}
      />

      <StudentEnrolmentWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={(id) => void handleEnrolmentComplete(id)}
        showToast={showToast}
        canCreate={canCreate}
      />

      {/* Bulk Import Modal — kept separate from enrolment wizard */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Students"
        description="Upload a CSV file containing student records and guardian contact details."
        size="md"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-300 transition-colors bg-slate-50/50">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">Choose CSV file or drag and drop</p>
            <p className="text-xs text-slate-400 mt-1">Columns: Admission No, First Name, Last Name, Class, Arm, Guardian Phone</p>
            <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer hover:bg-indigo-700 transition-colors shadow-xs">
              <Upload className="w-4 h-4" />
              Browse CSV File
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
