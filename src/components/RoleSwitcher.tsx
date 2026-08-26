import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Briefcase,
  Shield,
  HeartHandshake,
  User,
  Layers,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { UserRole } from '../types';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

const ROLES: {
  id: UserRole;
  label: string;
  icon: React.ElementType;
  color: string;
  desc: string;
}[] = [
  { id: 'landing', label: '1. Landing Page', icon: GraduationCap, color: 'text-indigo-600', desc: 'Marketing & Overview' },
  { id: 'school_admin', label: '2. Admin (Records)', icon: Shield, color: 'text-blue-600', desc: 'Student SIS & Classes' },
  { id: 'teacher', label: '3. Teacher (Mr. Adewale)', icon: Briefcase, color: 'text-indigo-600', desc: 'Schedule & AI Lesson' },
  { id: 'principal', label: '4. Principal (Mrs. Adeyemi)', icon: Users, color: 'text-purple-600', desc: 'Performance & Leadership' },
  { id: 'super_admin', label: '5. Super Admin', icon: Layers, color: 'text-emerald-600', desc: 'SaaS Platform Owner' },
  { id: 'parent', label: '6. Parent (Mrs. Bello)', icon: HeartHandshake, color: 'text-amber-600', desc: 'Children & Fees' },
  { id: 'student', label: '7. Student (Nathan Bello)', icon: User, color: 'text-indigo-500', desc: 'Learning & Streaks' },
];

/** Demo sandbox: switch preview role. Interactive tools live in InteractiveToolsWidget. */
export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onSelectRole,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeLabel = ROLES.find((r) => r.id === currentRole)?.label;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center">
      {isExpanded && (
        <div className="mb-2.5 w-[92vw] max-w-4xl animate-in fade-in slide-in-from-bottom-3 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-2xl backdrop-blur-md duration-200">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Role Navigator
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Use the Tools widget (bottom-right) for role actions
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isActive = currentRole === r.id;

              return (
                <button
                  key={r.id}
                  type="button"
                  id={`switcher-role-${r.id}`}
                  onClick={() => {
                    onSelectRole(r.id);
                    setIsExpanded(false);
                  }}
                  className={`flex flex-col gap-1 rounded-xl border p-2 text-left transition-all ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'border-slate-200/60 bg-slate-50 text-slate-700 hover:bg-indigo-50/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : r.color}`} />
                    <span className="truncate text-[11px] font-bold">{r.label}</span>
                  </div>
                  <span
                    className={`truncate text-[9.5px] leading-tight ${
                      isActive ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    {r.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/90 px-4 py-2 text-white shadow-xl backdrop-blur-md transition-all hover:bg-slate-900">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
          <span className="text-xs font-bold tracking-wide">
            Viewing:{' '}
            <span className="font-semibold text-indigo-300">{activeLabel}</span>
          </span>
        </div>

        <div className="mx-1 h-3.5 w-px bg-slate-700" />

        <button
          type="button"
          id="btn-toggle-role-switcher"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold text-slate-200 transition-colors hover:text-white"
        >
          <span>{isExpanded ? 'Collapse' : 'Switch Role'}</span>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
