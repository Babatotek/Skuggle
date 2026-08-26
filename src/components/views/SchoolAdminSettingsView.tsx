import React, { useState } from 'react';
import {
  Settings,
  Building,
  Calendar,
  Layers,
  BookOpen,
  Award,
  DollarSign,
  MessageSquare,
  Shield,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Globe,
  Upload,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Send,
  Sliders,
  Check,
  X,
  Database,
  Key,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { INITIAL_SCHOOL_SETTINGS } from '../../data/adminMockData';
import { CustomFieldsSettingsPanel } from '../../features/settings/CustomFieldsSettingsPanel';
import { TenantBrandingSettings } from './TenantBrandingSettings';
import { feedbackBus } from '../../shared/feedback/feedbackBus';

interface SchoolAdminSettingsViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const SchoolAdminSettingsView: React.FC<SchoolAdminSettingsViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  // Navigation tabs within Settings
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'general' | 'branding' | 'registration' | 'academic' | 'classes' | 'subjects' | 'grading' | 'fees' | 'notifications' | 'security'
  >('general');

  // Main settings state
  const [settings, setSettings] = useState(INITIAL_SCHOOL_SETTINGS);

  // New Class Arm Modal
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('SSS 1');
  const [newClassArm, setNewClassArm] = useState('Emerald (Science)');
  const [newClassTutor, setNewClassTutor] = useState('Mr. A. Adeleke');
  const [newClassCapacity, setNewClassCapacity] = useState('40');

  // New Subject Modal
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubCode, setNewSubCode] = useState('AGR');
  const [newSubName, setNewSubName] = useState('Agricultural Science');
  const [newSubCategory, setNewSubCategory] = useState('Vocational');
  const [newSubHod, setNewSubHod] = useState('Dr. S. Olanrewaju');

  const handleSaveSettings = () => {
    feedbackBus.success('School administration settings saved and updated across all portals!');
  };

  // Add new class arm
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const newClassObj = {
      id: `cls_${Date.now()}`,
      name: newClassName,
      arm: newClassArm,
      formTutor: newClassTutor,
      studentCount: 0,
      capacity: parseInt(newClassCapacity, 10) || 40,
    };
    setSettings((prev) => ({
      ...prev,
      classes: [...prev.classes, newClassObj],
    }));
    setShowAddClassModal(false);
    feedbackBus.success(`New class arm "${newClassName} ${newClassArm}" created successfully!`);
  };

  // Add new subject
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const newSubObj = {
      code: newSubCode.toUpperCase(),
      name: newSubName,
      category: newSubCategory,
      levels: ['SSS'],
      hod: newSubHod,
    };
    setSettings((prev) => ({
      ...prev,
      subjectsCatalog: [...prev.subjectsCatalog, newSubObj],
    }));
    setShowAddSubjectModal(false);
    feedbackBus.success(`Curriculum subject "${newSubName} (${newSubCode})" added!`);
  };

  // Delete subject
  const handleDeleteSubject = (code: string) => {
    setSettings((prev) => ({
      ...prev,
      subjectsCatalog: prev.subjectsCatalog.filter((s) => s.code !== code),
    }));
    feedbackBus.success(`Subject ${code} removed from active curriculum.`);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              <Settings className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              School Administration Portal Configuration
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Institutional Settings & Academic Policies
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage school identity, academic session dates, grading rubrics, tuition fees schedule, and communication gateways.
          </p>
        </div>

        {/* Global Save Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Changes</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'general', label: 'School Profile & Crest', icon: Building },
          { id: 'branding', label: 'Branding & Welcome Experience', icon: Sparkles },
          { id: 'registration', label: 'Registration Fields', icon: ClipboardList },
          { id: 'academic', label: 'Academic Terms & Session', icon: Calendar },
          { id: 'classes', label: 'Classes & Arms Setup', icon: Layers },
          { id: 'subjects', label: 'Subjects Catalog', icon: BookOpen },
          { id: 'grading', label: 'Grading Rubric & Pass Mark', icon: Award },
          { id: 'fees', label: 'Tuition Fees & Payments', icon: DollarSign },
          { id: 'notifications', label: 'SMS & WhatsApp Broadcast', icon: MessageSquare },
          { id: 'security', label: 'Security, 2FA & Backups', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSettingsTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB: BRANDING & WELCOME EXPERIENCE */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'branding' && (
        <TenantBrandingSettings />
      )}

      {activeSettingsTab === 'registration' && (
        <div className="grid gap-6">
          <CustomFieldsSettingsPanel
            entity="student"
            title="Student registration"
            description="Add extra student fields for local government, national ID, medical notes, or any requirement specific to your state or country."
          />
          <CustomFieldsSettingsPanel
            entity="staff"
            title="Staff records"
            description="Capture HR or regulatory details such as qualification numbers, pension IDs, or certification references when adding staff."
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SCHOOL PROFILE & IDENTITY */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Form Details (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Institutional Identity & Accreditation</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Official School Name</label>
                <input
                  type="text"
                  value={settings.general.schoolName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, schoolName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">School Short Code</label>
                <input
                  type="text"
                  value={settings.general.shortCode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, shortCode: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">School Motto / Slogan</label>
                <input
                  type="text"
                  value={settings.general.motto}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, motto: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 italic"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">WAEC / NECO Centre No.</label>
                <input
                  type="text"
                  value={settings.general.accreditationNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, accreditationNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ministry Approval No.</label>
                <input
                  type="text"
                  value={settings.general.ministryApprovalNo}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, ministryApprovalNo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Campus Physical Address</label>
                <input
                  type="text"
                  value={settings.general.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, address: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">State</label>
                <input
                  type="text"
                  value={settings.general.state}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, state: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Local Govt Area (LGA)</label>
                <input
                  type="text"
                  value={settings.general.lga}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, lga: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Contact Phone</label>
                <input
                  type="text"
                  value={settings.general.phone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official School Email</label>
                <input
                  type="email"
                  value={settings.general.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Update Profile Info
              </button>
            </div>
          </div>

          {/* Right Column: Crest, Stamps & Signatures */}
          <div className="space-y-6">
            
            {/* School Crest / Logo */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-center space-y-4">
              <h3 className="text-sm font-bold text-slate-900 text-left">Official School Crest / Logo</h3>
              <div className="w-24 h-24 mx-auto rounded-2xl bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden p-2">
                <img
                  src={settings.general.schoolLogoUrl}
                  alt="School Crest"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Printed on broadsheets, certificates, report cards & invoices.
              </p>
              <button
                onClick={() => feedbackBus.success('Crest upload modal ready. Supports PNG/SVG with transparent background.')}
                className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace Logo File</span>
              </button>
            </div>

            {/* Principal Signature Attachment */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Principal Signature & Stamp</h3>
              <div className="text-xs space-y-2">
                <label className="font-bold text-slate-700 block">Principal Full Name & Credentials</label>
                <input
                  type="text"
                  value={settings.general.principalName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, principalName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Digital Signature Stamp</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10.5px] font-bold">
                  Verified & Active
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACADEMIC CALENDAR & TERMS */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'academic' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Session & Term Timelines</h3>
              <p className="text-xs text-slate-500">Configure active session dates, term start/end schedules, and result publication locking</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Result Locking:</span>
              <button
                onClick={() => {
                  setSettings({
                    ...settings,
                    academic: { ...settings.academic, isResultLocked: !settings.academic.isResultLocked },
                  });
                  feedbackBus.success(
                    settings.academic.isResultLocked
                      ? 'Results unlocked for teacher editing.'
                      : 'Results locked! Teachers cannot modify approved grades.'
                  );
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.academic.isResultLocked
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {settings.academic.isResultLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked (Read-Only)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Open for Grading</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Current Academic Session</label>
              <select
                value={settings.academic.currentSession}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    academic: { ...settings.academic, currentSession: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              >
                <option value="2026/2027">2026/2027 Academic Session</option>
                <option value="2027/2028">2027/2028 Academic Session</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Active Term</label>
              <select
                value={settings.academic.currentTerm}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    academic: { ...settings.academic, currentTerm: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Total School Days Opened</label>
              <input
                type="number"
                value={settings.academic.totalSchoolDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    academic: { ...settings.academic, totalSchoolDays: parseInt(e.target.value, 10) || 70 },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Term Commencement Date</label>
              <input
                type="date"
                value={settings.academic.termStartDate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    academic: { ...settings.academic, termStartDate: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Term Closing / Vacation Date</label>
              <input
                type="date"
                value={settings.academic.termEndDate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    academic: { ...settings.academic, termEndDate: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Next Term Resumption Date</label>
              <input
                type="date"
                value={settings.academic.nextResumptionDate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    academic: { ...settings.academic, nextResumptionDate: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-indigo-700"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Update Academic Calendar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CLASSES & ARMS SETUP */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'classes' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Class Levels, Streams & Form Tutors</h3>
              <p className="text-xs text-slate-500">Configure class arms, student capacities, and assigned form teachers</p>
            </div>
            <button
              onClick={() => setShowAddClassModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Class Arm</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-4">Class Level</th>
                  <th className="py-3 px-4">Arm / Stream Title</th>
                  <th className="py-3 px-4">Assigned Form Tutor</th>
                  <th className="py-3 px-3 text-center">Enrolled Students</th>
                  <th className="py-3 px-3 text-center">Class Capacity</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settings.classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-black text-slate-900">{cls.name}</td>
                    <td className="py-3 px-4 font-bold text-indigo-700">{cls.arm}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{cls.formTutor}</td>
                    <td className="py-3 px-3 text-center font-extrabold text-slate-900">
                      {cls.studentCount}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500">{cls.capacity}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => feedbackBus.success(`Form Tutor editing modal opened for ${cls.name} ${cls.arm}`)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                        title="Edit Class Arm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUBJECTS CATALOG */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">School Curriculum & Subjects Catalog</h3>
              <p className="text-xs text-slate-500">Manage subject codes, disciplines, and assigned Heads of Department (HODs)</p>
            </div>
            <button
              onClick={() => setShowAddSubjectModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Curriculum Subject</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-3">Discipline Category</th>
                  <th className="py-3 px-3">Applicable Tiers</th>
                  <th className="py-3 px-4">Head of Department (HOD)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settings.subjectsCatalog.map((sub) => (
                  <tr key={sub.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-indigo-700">{sub.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{sub.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10.5px] font-semibold">
                        {sub.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{sub.levels.join(', ')}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{sub.hod}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleDeleteSubject(sub.code)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GRADING POLICY & PASS MARK */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'grading' && (
        <div className="space-y-6">
          
          {/* Assessment Weightage */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Continuous Assessment (CA) vs Terminal Examination Weightage
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-indigo-900">Total Continuous Assessment (CA)</span>
                  <span className="text-lg font-black text-indigo-700">{settings.gradingPolicy.continuousAssessmentWeight}%</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Includes CA 1 (10%), CA 2 (10%), Homework & Projects (10%), and Mid-Term Test (10%).
                </p>
              </div>

              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-emerald-900">Terminal Examination Weight</span>
                  <span className="text-lg font-black text-emerald-700">{settings.gradingPolicy.examinationWeight}%</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Final comprehensive theory and objective exam paper. Total score normalizes to 100%.
                </p>
              </div>
            </div>
          </div>

          {/* Official WAEC 9-Point Grade Scale */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Official WAEC 9-Point Grade Rubric
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Score Range</th>
                    <th className="py-2.5 px-3">GPA Points</th>
                    <th className="py-2.5 px-4">Standard Official Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {settings.gradingPolicy.gradeScales.map((scale) => (
                    <tr key={scale.grade} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-black text-indigo-700">{scale.grade}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {scale.minScore}% — {scale.maxScore}%
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{scale.gpaPoint.toFixed(1)}</td>
                      <td className="py-2.5 px-4 text-slate-700">{scale.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: TUITION FEES & PAYMENTS */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'fees' && (
        <div className="space-y-6">
          
          {/* Bank Account & Payment Gateway Settings */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              School Bank Account & Online Gateway Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={settings.feesBilling.bankDetails.bankName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      feesBilling: {
                        ...settings.feesBilling,
                        bankDetails: { ...settings.feesBilling.bankDetails, bankName: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                <input
                  type="text"
                  value={settings.feesBilling.bankDetails.accountNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      feesBilling: {
                        ...settings.feesBilling,
                        bankDetails: { ...settings.feesBilling.bankDetails, accountNumber: e.target.value },
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Paystack Gateway Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold">
                    Connected & Live
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Monnify Gateway</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold">
                    Active (Virtual Accounts)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Class-by-Class Fee Schedule */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Termly Fee Structure per Class Level</h3>
              <span className="text-xs text-slate-500 font-semibold">Currency: Nigerian Naira (₦)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-2.5 px-4">Class Level</th>
                    <th className="py-2.5 px-3 text-right">Tuition</th>
                    <th className="py-2.5 px-3 text-right">Science Lab</th>
                    <th className="py-2.5 px-3 text-right">Dev Levy</th>
                    <th className="py-2.5 px-3 text-right">PTA Dues</th>
                    <th className="py-2.5 px-3 text-right">Exam Reg</th>
                    <th className="py-2.5 px-4 text-right font-black text-indigo-900">Total / Student</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {settings.feesBilling.classFeeSchedule.map((fee) => (
                    <tr key={fee.classLevel} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-black text-slate-900">{fee.classLevel}</td>
                      <td className="py-2.5 px-3 text-right">₦{fee.tuition.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">₦{fee.labFee.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">₦{fee.devLevy.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">₦{fee.ptaDues.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right">₦{fee.waecNecoReg.toLocaleString()}</td>
                      <td className="py-2.5 px-4 text-right font-black text-indigo-700">
                        ₦{fee.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: SMS & WHATSAPP BROADCAST */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Parent Broadcast & Automated SMS Gateway</h3>
              <p className="text-xs text-slate-500">Configure SMS balance, Sender ID, and automated trigger templates</p>
            </div>
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700">
              SMS Balance: {settings.notificationsBroadcast.smsBalanceUnits.toLocaleString()} Units
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">SMS Gateway Provider</label>
              <input
                type="text"
                value={settings.notificationsBroadcast.smsProvider}
                readOnly
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Approved Sender ID</label>
              <input
                type="text"
                value={settings.notificationsBroadcast.senderId}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notificationsBroadcast: { ...settings.notificationsBroadcast, senderId: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Automated Message Triggers */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Automated Notification Triggers</h4>
            <div className="space-y-2">
              {[
                { label: 'Instant Daily Absence Alert to Parents', desc: 'Dispatched immediately when teacher marks student absent in morning roll call.' },
                { label: 'Exam Result Publication Announcement', desc: 'Sends secure student result link and portal PIN when term results are published.' },
                { label: 'Automated Fee Balance Reminder', desc: 'Dispatched 7 days prior to school fee deadline.' },
              ].map((trigger, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{trigger.label}</p>
                    <p className="text-[11px] text-slate-500">{trigger.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded cursor-pointer" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Save Notification Settings
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: SECURITY & BACKUPS */}
      {/* ========================================================================= */}
      {activeSettingsTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Authentication & Security Policies</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div>
                  <p className="font-bold text-slate-900">Enforce Two-Factor Authentication (2FA)</p>
                  <p className="text-[11px] text-slate-500">Requires OTP via SMS or authenticator for all staff and admin logins.</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded cursor-pointer" />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div>
                  <p className="font-bold text-slate-900">Session Auto-Timeout</p>
                  <p className="text-[11px] text-slate-500">Automatically logout inactive admin sessions after 30 minutes.</p>
                </div>
                <span className="font-bold text-slate-800">30 mins</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Cloud Backups & School Database Snapshot</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                <p className="font-bold text-emerald-900">Encrypted Cloud Backup Active</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Last automated backup completed on: <strong>22 August 2026, 02:00 AM (WAT)</strong>
                </p>
              </div>

              <button
                onClick={() => feedbackBus.success('Full school data snapshot JSON downloaded safely to your computer!')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-indigo-300" />
                <span>Download Instant School Database Snapshot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW CLASS ARM */}
      {/* ========================================================================= */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add New Class Arm</h3>
              <button onClick={() => setShowAddClassModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Class Level</label>
                <select
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                >
                  <option value="SSS 3">SSS 3</option>
                  <option value="SSS 2">SSS 2</option>
                  <option value="SSS 1">SSS 1</option>
                  <option value="JSS 3">JSS 3</option>
                  <option value="JSS 2">JSS 2</option>
                  <option value="JSS 1">JSS 1</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Arm / Stream Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emerald (Science)"
                  value={newClassArm}
                  onChange={(e) => setNewClassArm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Form Tutor</label>
                <input
                  type="text"
                  required
                  value={newClassTutor}
                  onChange={(e) => setNewClassTutor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Student Capacity</label>
                <input
                  type="number"
                  value={newClassCapacity}
                  onChange={(e) => setNewClassCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Create Class Arm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW CURRICULUM SUBJECT */}
      {/* ========================================================================= */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Curriculum Subject</h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AGR"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agricultural Science"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Discipline Category</label>
                <select
                  value={newSubCategory}
                  onChange={(e) => setNewSubCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  <option value="Core">Core</option>
                  <option value="Science">Science</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Arts">Arts</option>
                  <option value="Vocational">Vocational</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Head of Department (HOD)</label>
                <input
                  type="text"
                  required
                  value={newSubHod}
                  onChange={(e) => setNewSubHod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
