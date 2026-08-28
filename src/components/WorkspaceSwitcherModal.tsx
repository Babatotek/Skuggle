import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  User,
  GraduationCap,
  Users,
  ShieldCheck,
  Check,
  PlusCircle,
  ExternalLink,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BrandMark } from './BrandMark';

interface WorkspaceSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToNewSchool?: () => void;
}

export const WorkspaceSwitcherModal: React.FC<WorkspaceSwitcherModalProps> = ({
  isOpen,
  onClose,
  onNavigateToNewSchool,
}) => {
  const { currentUser, currentWorkspace, switchWorkspace, branding } = useApp();

  if (!isOpen) return null;

  const workspaces = currentUser?.availableWorkspaces || [];
  const schoolWorkspaces = workspaces.filter((w) => w.type === 'school');
  const personalWorkspaces = workspaces.filter((w) => w.type === 'personal');
  const platformWorkspaces = workspaces.filter((w) => w.type === 'platform');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'School Admin':
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      case 'Principal':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'Teacher':
        return <GraduationCap className="w-4 h-4 text-purple-600" />;
      case 'Parent':
        return <Users className="w-4 h-4 text-amber-600" />;
      case 'Student':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'Platform Owner':
        return <Sparkles className="w-4 h-4 text-rose-600" />;
      default:
        return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900">Switch Workspace</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                One global verified identity (<span className="font-semibold text-slate-700">{currentUser.email}</span>) with multiple spaces.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* School Workspaces Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  School Memberships ({schoolWorkspaces.length})
                </span>
                <span className="text-[11px] text-indigo-600 font-medium">Tenant Isolated</span>
              </div>
              <div className="space-y-2.5">
                {schoolWorkspaces.map((ws) => {
                  const isCurrent = currentWorkspace.id === ws.id && currentWorkspace.role === ws.role;
                  return (
                    <button
                      key={`${ws.id}-${ws.role}`}
                      onClick={() => {
                        switchWorkspace(ws.id);
                        onClose();
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 font-bold flex items-center justify-center text-sm border border-indigo-200 shadow-2xs">
                          {branding.schoolName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-semibold text-slate-900 text-sm">{ws.name}</span>
                            {ws.isOwner && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md">
                                Owner
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {getRoleIcon(ws.role)}
                              <span>{ws.role}</span>
                            </span>
                            {ws.activeSession && (
                              <span className="text-[11px] text-slate-500">
                                {ws.activeSession} · {ws.activeTerm}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(ws.attentionCount ?? 0) > 0 && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 rounded-full">
                            {ws.attentionCount} actions
                          </span>
                        )}
                        {isCurrent && <Check className="w-5 h-5 text-indigo-600 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal Workspaces Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Personal Spaces ({personalWorkspaces.length})
                </span>
                <span className="text-[11px] text-slate-500">Private & Cross-School</span>
              </div>
              <div className="space-y-2.5">
                {personalWorkspaces.map((ws) => {
                  const isCurrent = currentWorkspace.id === ws.id;
                  return (
                    <button
                      key={ws.id}
                      onClick={() => {
                        switchWorkspace(ws.id);
                        onClose();
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-sm border border-purple-200 shadow-2xs">
                          {getRoleIcon(ws.role)}
                        </div>
                        <div>
                          <span className="font-display font-semibold text-slate-900 text-sm block">{ws.name}</span>
                          <span className="inline-block text-xs font-medium text-slate-500 mt-0.5">
                            Role: <strong className="text-slate-700">{ws.role}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent && <Check className="w-5 h-5 text-indigo-600 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform Operations Section */}
            {platformWorkspaces.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Platform Management
                  </span>
                </div>
                <div className="space-y-2.5">
                  {platformWorkspaces.map((ws) => {
                    const isCurrent = currentWorkspace.id === ws.id;
                    return (
                      <button
                        key={ws.id}
                        onClick={() => {
                          switchWorkspace(ws.id);
                          onClose();
                        }}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isCurrent
                            ? 'border-rose-600 bg-rose-50/40 ring-2 ring-rose-500/20 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-900 font-bold flex items-center justify-center text-sm border border-rose-200">
                            <Sparkles className="w-4 h-4 text-rose-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 text-sm block">{ws.name}</span>
                            <span className="text-xs text-rose-700 font-medium">Platform Operations & Radar</span>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-5 h-5 text-rose-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                if (onNavigateToNewSchool) onNavigateToNewSchool();
              }}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register or Join Another School</span>
            </button>
            <button
              onClick={onClose}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-lg border border-slate-300 bg-white shadow-2xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
