import React, { useState } from 'react';
import {
  Users,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  GraduationCap,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
  UserPlus,
  Briefcase,
  Layers,
  Send,
  X,
  FileText
} from 'lucide-react';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface PrincipalStaffViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface FacultyMember {
  id: string;
  name: string;
  department: string;
  subjects: string[];
  formClass?: string;
  weeklyPeriods: number;
  qualification: string;
  trcnStatus: 'Certified' | 'In Progress';
  rating: number; // out of 5
  attendanceRate: number;
  phone: string;
  email: string;
  status: 'Active' | 'On Leave';
}

const FACULTY_MEMBERS: FacultyMember[] = [
  {
    id: 'fac_1',
    name: 'Mr. Babatunde Adewale',
    department: 'Mathematics & Computing',
    subjects: ['Mathematics (JSS 1-2)', 'Further Mathematics (SSS 1)'],
    formClass: 'JSS 2A',
    weeklyPeriods: 18,
    qualification: 'B.Sc (Ed) Mathematics • UNILAG',
    trcnStatus: 'Certified',
    rating: 4.9,
    attendanceRate: 98.4,
    phone: '+234 802 334 5566',
    email: 'b.adewale@royalgateway.edu.ng',
    status: 'Active'
  },
  {
    id: 'fac_2',
    name: 'Mrs. Chioma Eze',
    department: 'Languages & Humanities',
    subjects: ['English Language (JSS 1 & 3)', 'Literature in English (SSS 2)'],
    formClass: 'JSS 1A',
    weeklyPeriods: 16,
    qualification: 'B.A (Ed) English • UNN • M.Ed',
    trcnStatus: 'Certified',
    rating: 4.8,
    attendanceRate: 97.8,
    phone: '+234 803 445 6677',
    email: 'c.eze@royalgateway.edu.ng',
    status: 'Active'
  },
  {
    id: 'fac_3',
    name: 'Engr. Aliyu Ibrahim',
    department: 'Sciences & STEM',
    subjects: ['Physics (SSS 1-3)', 'Technical Drawing'],
    formClass: 'SSS 2 Science',
    weeklyPeriods: 20,
    qualification: 'B.Eng Mechanical • ABU • PGDE',
    trcnStatus: 'Certified',
    rating: 4.9,
    attendanceRate: 99.1,
    phone: '+234 805 667 8899',
    email: 'a.ibrahim@royalgateway.edu.ng',
    status: 'Active'
  },
  {
    id: 'fac_4',
    name: 'Mrs. Folashade Adeleke',
    department: 'Sciences & STEM',
    subjects: ['Chemistry (SSS 1-3)', 'Biology (SSS 1)'],
    formClass: 'SSS 1 Science',
    weeklyPeriods: 18,
    qualification: 'B.Sc (Ed) Chemistry • UI • M.Sc',
    trcnStatus: 'Certified',
    rating: 4.7,
    attendanceRate: 96.5,
    phone: '+234 807 889 0011',
    email: 'f.adeleke@royalgateway.edu.ng',
    status: 'Active'
  },
  {
    id: 'fac_5',
    name: 'Dr. Gabriel Okon',
    department: 'Junior Foundations',
    subjects: ['Basic Science (JSS 1-3)', 'Agricultural Science'],
    formClass: 'JSS 3A',
    weeklyPeriods: 18,
    qualification: 'Ph.D Science Education • UniCal',
    trcnStatus: 'Certified',
    rating: 5.0,
    attendanceRate: 99.5,
    phone: '+234 809 112 2334',
    email: 'g.okon@royalgateway.edu.ng',
    status: 'Active'
  },
  {
    id: 'fac_6',
    name: 'Mr. Emmanuel Danjuma',
    department: 'Vocational & Co-Curricular',
    subjects: ['Physical & Health Education', 'Civic Education'],
    formClass: 'JSS 2B',
    weeklyPeriods: 14,
    qualification: 'B.Ed Human Kinetics • UniIlorin',
    trcnStatus: 'Certified',
    rating: 4.6,
    attendanceRate: 97.0,
    phone: '+234 803 778 9900',
    email: 'e.danjuma@royalgateway.edu.ng',
    status: 'Active'
  },
  {
    id: 'fac_7',
    name: 'Mrs. Zainab Umar',
    department: 'Languages & Humanities',
    subjects: ['French Language (JSS 1-3)', 'Music'],
    weeklyPeriods: 14,
    qualification: 'B.A French • Bayero • PGDE',
    trcnStatus: 'Certified',
    rating: 4.7,
    attendanceRate: 95.0,
    phone: '+234 802 990 1122',
    email: 'z.umar@royalgateway.edu.ng',
    status: 'On Leave'
  }
];

export const PrincipalStaffView: React.FC<PrincipalStaffViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'appraisals' | 'leaves' | 'training'>('roster');
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaculty = FACULTY_MEMBERS.filter((fac) => {
    const matchesDept = selectedDept === 'All' || fac.department.includes(selectedDept);
    const matchesSearch = fac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          fac.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-sm text-slate-500 mt-1">Faculty profiles, CPD records, and leave requests will appear once staff are added to the system.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No staff records yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Invite staff members or add them manually through school setup to see staff management tools here.</p>
          <button type="button" onClick={() => onOpenModal('onboarding_wizard')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
            Invite staff members
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] uppercase tracking-wide">
              Faculty Leadership & HR Intelligence
            </span>
            <span className="text-xs text-slate-400 font-medium">Academic Session 2026/2027</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Faculty Directory, Workload Allocation & Appraisals
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Teaching period distributions, TRCN professional compliance, weekly lesson note audits, and duty master rosters.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenModal('onboarding_wizard')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add New Faculty Member</span>
          </button>

          <button
            onClick={() => {
              const headers = 'Name,Department,Subjects,FormClass,WeeklyPeriods,Qualification,TRCN,Rating\n';
              const rows = FACULTY_MEMBERS.map((f) => `"${f.name}","${f.department}","${f.subjects.join('; ')}","${f.formClass || 'None'}",${f.weeklyPeriods},"${f.qualification}","${f.trcnStatus}",${f.rating}`).join('\n');
              const blob = new Blob([headers + rows], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'Royal_Gateway_Staff_Directory.csv';
              a.click();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Roster (CSV)</span>
          </button>
        </div>
      </div>

      {/* 6 Executive Staff KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card 1: Academic Staff */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Academic Faculty</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">58</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              100% Subject Coverage
            </p>
          </div>
        </div>

        {/* Card 2: Support Staff */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Non-Academic & Admin</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-0.5">20</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              Bursary, Clinic, Estate & IT
            </p>
          </div>
        </div>

        {/* Card 3: Teacher-Student Ratio */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Teacher : Student Ratio</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">1 : 21</p>
            <p className="text-[10.5px] text-emerald-600 font-semibold mt-0.5">
              Optimal UNESCO benchmark
            </p>
          </div>
        </div>

        {/* Card 4: Mean Faculty Rating */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Mean Appraisal Score</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">4.8 / 5.0</p>
            <p className="text-[10.5px] text-amber-600 font-semibold mt-0.5">
              Term HOD observation
            </p>
          </div>
        </div>

        {/* Card 5: TRCN Certified */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">TRCN Certification</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-0.5">96.5%</p>
            <p className="text-[10.5px] text-purple-600 font-semibold mt-0.5">
              56 / 58 fully certified
            </p>
          </div>
        </div>

        {/* Card 6: Average Weekly Load */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div className="mt-2.5">
            <p className="text-[11.5px] font-medium text-slate-500">Average Period Load</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">17.4</p>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
              Periods / week per tutor
            </p>
          </div>
        </div>

      </div>

      {/* Sub-Tabs Navigation & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-1.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            id="tab-principal-staff-roster"
            onClick={() => setActiveSubTab('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'roster'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Faculty Roster & Allocations</span>
          </button>

          <button
            id="tab-principal-staff-appraisals"
            onClick={() => setActiveSubTab('appraisals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'appraisals'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Lesson Note & Peer Appraisals</span>
          </button>

          <button
            id="tab-principal-staff-leaves"
            onClick={() => setActiveSubTab('leaves')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'leaves'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Leave & Substitution Roster</span>
          </button>

          <button
            id="tab-principal-staff-training"
            onClick={() => setActiveSubTab('training')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'training'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>TRCN & CPD Training</span>
          </button>
        </div>

        {/* Search & Department filters */}
        {activeSubTab === 'roster' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="Sciences">Sciences & STEM</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Languages">Languages & Humanities</option>
              <option value="Junior">Junior Foundations</option>
              <option value="Vocational">Vocational</option>
            </select>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: FACULTY ROSTER */}
      {activeSubTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Teaching Faculty Directory & Workload Matrix</h3>
              <p className="text-xs text-slate-500">Showing {filteredFaculty.length} faculty members • Verified credentials & TRCN licensure.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3">Faculty Member</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Subject Allocations</th>
                  <th className="py-3 px-3 text-center">Form Class</th>
                  <th className="py-3 px-3 text-center">Periods/Wk</th>
                  <th className="py-3 px-3">Academic Qualification</th>
                  <th className="py-3 px-3 text-center">TRCN Status</th>
                  <th className="py-3 px-3 text-center">Rating</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFaculty.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {fac.name}
                          {fac.status === 'On Leave' && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-800 font-bold">
                              On Leave
                            </span>
                          )}
                        </p>
                        <p className="text-[10.5px] text-slate-400">{fac.email}</p>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{fac.department}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {fac.subjects.map((sub, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10.5px] px-2 py-0.5 rounded-md font-medium">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-indigo-600">
                      {fac.formClass || '—'}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {fac.weeklyPeriods}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {fac.qualification}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10.5px] border border-emerald-200">
                        ✓ {fac.trcnStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-amber-600">
                      ★ {fac.rating}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          feedbackBus.success(`Opened faculty dossier for ${fac.name}`);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 text-xs"
                      >
                        Inspect File
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: APPRAISALS */}
      {activeSubTab === 'appraisals' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Termly Lesson Plan Audit & Class Observation Scores</h3>
              <p className="text-xs text-slate-500">Evaluation based on Pedagogical Clarity, Syllabus Alignment, Punctuality & OMR SmartMark adoption.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-bold">
                Distinguished Excellence (5.0 / 5.0)
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Dr. Gabriel Okon</h4>
              <p className="text-xs text-slate-600">Outstanding laboratory demonstrations in Basic Science; 100% on-time lesson plan delivery.</p>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10.5px] font-bold">
                High Performer (4.9 / 5.0)
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Engr. Aliyu Ibrahim</h4>
              <p className="text-xs text-slate-600">Exceptional physics mock preparation; effective utilization of SmartMark scanner for instant feedback.</p>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10.5px] font-bold">
                High Performer (4.9 / 5.0)
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Mr. Babatunde Adewale</h4>
              <p className="text-xs text-slate-600">Junior mathematics clinic leadership; highly commended for remedial student transformation.</p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LEAVES & SUBSTITUTIONS */}
      {activeSubTab === 'leaves' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Faculty Leave Registry & Substitution Coverage</h3>
              <p className="text-xs text-slate-500">Automated coverage pairing to guarantee zero unattended periods.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                  Active Approved Leave
                </span>
                <span className="font-bold text-slate-900 text-sm">Mrs. Zainab Umar (French & Music)</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">Duration: 14 Oct 2026 – 28 Oct 2026 (Medical)</p>
              <p className="text-xs text-slate-700 font-medium mt-0.5">
                Covering Tutors: <strong>Mrs. Chioma Eze</strong> (French JSS 1) & <strong>Mr. Danjuma</strong> (Music JSS 2)
              </p>
            </div>

            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              100% Classes Covered
            </span>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TRCN & CPD */}
      {activeSubTab === 'training' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Continuous Professional Development (CPD) Schedule</h3>
              <p className="text-xs text-slate-500">TRCN mandatory annual credits & modern pedagogical workshops.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">AI in Lesson Planning & Automated OMR Grading</h4>
                <p className="text-[11px] text-slate-500">Completed 12 Oct 2026 • Facilitated by EdTech Leads • 58 / 58 Attended</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10.5px]">
                Completed (100%)
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">Inclusive Education & Neurodiverse Student Support</h4>
                <p className="text-[11px] text-slate-500">Scheduled 25 Nov 2026 • 2 CPD Credits</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10.5px]">
                Upcoming
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
