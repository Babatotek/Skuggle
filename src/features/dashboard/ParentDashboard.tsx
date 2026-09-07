import React, { useState } from 'react';
import {
  Users,
  Award,
  Calendar,
  CreditCard,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Building2,
  User,
  Plus,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SkuggleAIBuddy } from '../../components/SkuggleAIBuddy';
import { Button, StatusBadge, MetricCard } from '../../components/ui';

interface ParentDashboardProps {
  onNavigateTab: (tab: string) => void;
  onOpenResultChecker: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onNavigateTab, onOpenResultChecker }) => {
  const { branding, students, currentWorkspace, currentUser, linkedChildren, switchSpaceCategory, showToast } =
    useApp();

  const isPersonal = currentWorkspace.type === 'personal';

  const [selectedChildIndex] = useState(0);
  const currentChild = students[selectedChildIndex] || students[0];
  const schoolWorkspace = currentUser.availableWorkspaces.find((workspace) => workspace.type === 'school');
  const familyName = currentUser.fullName ? `${currentUser.fullName}'s Family Learning Space` : 'Family Learning Space';

  const familyChildren = linkedChildren.map((child) => ({
    id: child.childId,
    name: child.childName,
    level: `${child.classLevel} ${child.arm}`.trim(),
    school: child.schoolName,
    schoolCode: child.schoolCode,
    status: child.status,
  }));

  return (
    <div className="space-y-6">
      {/* 1. IDENTITY BANNER */}
      {isPersonal ? (
        /* PERSONAL FAMILY HUB BANNER */
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xs border border-amber-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-300" />
                  <span>My Skuggle · Family Learning Space</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {familyChildren.length} family {familyChildren.length === 1 ? 'profile' : 'profiles'}
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {familyName}
              </h1>
              <p className="text-xs sm:text-sm text-amber-200 mt-1">
                Private family study routines, learning goals, reminders and homework support
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {schoolWorkspace && (
                <Button
                  variant="outline"
                  size="md"
                  className="bg-white text-indigo-950 hover:bg-slate-100 font-bold"
                  leftIcon={<Building2 className="w-4 h-4 text-indigo-600" />}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  onClick={() => switchSpaceCategory('school')}
                >
                  Switch to {schoolWorkspace.name}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* OFFICIAL SCHOOL WARD PORTAL BANNER */
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xs border border-indigo-800/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                  <span>School Space · Parent Portal</span>
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {branding.schoolCode} · {branding.academicSession} ({branding.currentTerm})
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {branding.schoolName}
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                {currentChild ? (
                  <>
                    Enrolled ward: <strong>{currentChild.firstName} {currentChild.lastName}</strong> ·{' '}
                    {currentChild.classLevel} {currentChild.arm}
                  </>
                ) : (
                  'Your school-linked learners and official records appear here.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="md"
                className="bg-white text-amber-950 hover:bg-slate-100 font-bold"
                leftIcon={<Sparkles className="w-4 h-4 text-amber-600" />}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => switchSpaceCategory('personal')}
              >
                Switch to Personal Family Hub
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ENVIRONMENT CONTENT */}
      {isPersonal ? (
        /* PERSONAL FAMILY HUB */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint="Family Assistant: I can help create home study routines, explain homework topics, set family learning goals, or recommend age-appropriate activities."
          />

          {/* Children Across Schools List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Family Learning Profiles</h3>
                <p className="text-xs text-slate-500">Profiles remain private until you connect them to a school.</p>
              </div>
              <Button
                variant="subtle"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() =>
                  showToast('Link Code Requested', 'Enter the 8-character student code provided by the school.', 'info')
                }
              >
                Add Child Profile
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {familyChildren.length === 0 && (
                <div className="md:col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                  <p className="text-sm font-bold text-slate-800">No family profiles yet</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Add a child profile to begin planning homework, reading, goals and family study routines.
                  </p>
                </div>
              )}

              {familyChildren.map((child, idx) => (
                <div
                  key={child.id}
                  className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-amber-300 hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-sm border border-amber-100/80">
                        {child.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{child.name}</h4>
                        <span className="text-xs text-slate-500 block">{child.level}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100/80">
                      {child.schoolCode}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">School:</span>
                      <strong className="text-slate-800">{child.school}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <StatusBadge status={child.status} variant="success" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="subtle"
                      size="sm"
                      className="flex-1"
                      onClick={onOpenResultChecker}
                    >
                      Check PIN Report
                    </Button>
                    {idx === 0 && schoolWorkspace && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => switchSpaceCategory('school')}
                      >
                        Enter School Space →
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Home Study Routine & Private Tutors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">Home Study & Revision Schedule</h3>
              <p className="text-xs text-slate-500">
                Daily evening 45-minute focus blocks synchronized with current Nigerian curriculum schemes.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                No home study blocks scheduled yet.
              </div>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-slate-900">Private Home Tutor Tracker</h3>
              <p className="text-xs text-slate-500">
                Coordinate weekend lessons and communicate directly with independent verified tutors.
              </p>
              <div className="p-4 bg-purple-50/50 border border-purple-100/60 rounded-xl text-center text-xs text-slate-400">
                No private tutors added yet.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* OFFICIAL SCHOOL WARD PORTAL */
        <div className="space-y-6">
          <SkuggleAIBuddy
            variant="inline"
            contextHint="School parent assistant: Ask about your linked learner's published results, attendance, notices, or fee breakdown."
          />

          {!currentChild ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-3 font-display font-bold text-slate-900">No school-linked learner found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Ask the school to connect your parent account. Official records will appear here after approval.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Overall Term Average"
                value={`${currentChild.termAverage}%`}
                icon={<Award className="w-5 h-5" />}
                variant="primary"
                subtitle={`Class Rank: 2nd / ${currentChild.totalStudentsInClass}`}
                onClick={onOpenResultChecker}
              />
              <MetricCard
                label="Attendance Rate"
                value={`${currentChild.attendanceRate}%`}
                icon={<CheckCircle2 className="w-5 h-5" />}
                variant="success"
                subtitle="Present on 58 of 60 days"
                onClick={() => onNavigateTab('attendance')}
              />
              <MetricCard
                label="School Fee Status"
                value="Cleared"
                icon={<CreditCard className="w-5 h-5" />}
                variant="success"
                subtitle="Electronic Receipt #CHIA-REC-8821"
                onClick={() => onNavigateTab('finance')}
              />
            </div>
          )}

          {/* Quick Access to Result & Payments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">Term Result Card</h3>
                <p className="text-xs text-slate-500 mb-3">
                  View verified subject breakdown, continuous assessment marks, teacher remarks, and digital school stamp.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="w-full"
                onClick={onOpenResultChecker}
              >
                Open Result Sheet
              </Button>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 mb-3">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900">Fee Invoices & Receipts</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Download official school fee receipts, review upcoming term bills, and pay securely via Nigerian bank transfer.
                </p>
              </div>
              <Button
                variant="secondary"
                size="md"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="w-full"
                onClick={() => onNavigateTab('finance')}
              >
                View School Receipts
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
