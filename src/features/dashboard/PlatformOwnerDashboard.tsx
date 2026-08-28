import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Building2,
  Server,
  ShieldAlert,
  Activity,
  DollarSign,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  Search,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiMutation, apiRequest, describeApiError } from '../../lib/apiClient';

interface PlatformTenant { id: string; name: string; code: string; location: string; plan: string; students: number; mrr: string; status: string; syncHealth: string }

export const PlatformOwnerDashboard: React.FC = () => {
  const { showToast } = useApp();

  const demoTenants: PlatformTenant[] = [
    {
      id: 'tenant-1',
      name: 'Crown Heights International Academy',
      code: 'CHIA-LAGOS',
      location: 'Lekki, Lagos State',
      plan: 'Growth Pro',
      students: 480,
      mrr: '₦450,000/mo',
      status: 'active',
      syncHealth: '100% Synced',
    },
    {
      id: 'tenant-2',
      name: 'Bethel Grace College',
      code: 'BGIC-IBADAN',
      location: 'Challenge, Ibadan, Oyo State',
      plan: 'Growth Pro',
      students: 620,
      mrr: '₦580,000/mo',
      status: 'active',
      syncHealth: '99.8% Synced',
    },
    {
      id: 'tenant-3',
      name: 'St. Gregory Comprehensive',
      code: 'SGC-ENUGU',
      location: 'Independence Layout, Enugu',
      plan: 'Starter Free',
      students: 210,
      mrr: '₦0 (Free)',
      status: 'active',
      syncHealth: '100% Synced',
    },
    {
      id: 'tenant-4',
      name: 'Ahmadu Bello Model School',
      code: 'ABMS-KANO',
      location: 'Nasarawa, Kano State',
      plan: 'Enterprise Multi-Campus',
      students: 1400,
      mrr: '₦1,200,000/mo',
      status: 'active',
      syncHealth: '100% Synced',
    },
  ];
  const [tenants, setTenants] = useState<PlatformTenant[]>(
    import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true' ? demoTenants : [],
  );

  useEffect(() => {
    let active = true;
    apiRequest<{ success: true; data: { data: Array<Record<string, any>> } }>('/platform/schools?perPage=100', { suppressErrorNotification: true }).then((response) => { if (active) setTenants(response.data.data.map((row) => ({ id: String(row.id), name: String(row.name), code: String(row.code), location: String(row.slug ?? ''), plan: String(row.subscriptionPlan ?? 'Unassigned'), students: Number(row.quota?.students ?? 0), mrr: 'See subscriptions', status: String(row.status), syncHealth: 'Server managed' }))); }).catch((error) => showToast('Platform schools unavailable', describeApiError(error), 'error'));
    return () => { active = false; };
  }, [showToast]);

  const toggleTenantLock = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    void apiMutation(`/platform/schools/${encodeURIComponent(id)}/status`, 'PATCH', { status: nextStatus }).then(() => { setTenants(tenants.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))); showToast(nextStatus === 'suspended' ? 'Tenant suspended' : 'Tenant activated', `Updated platform access for tenant ${id}.`); }).catch((error) => showToast('Tenant status update failed', describeApiError(error), 'failed'));
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-rose-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30">
                Platform Operations & Governance Radar
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Multi-Tenant Root Control · Lagos/Abuja Cloud Clusters
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Skuggle Core Platform Radar
            </h1>
            <p className="text-xs sm:text-sm text-rose-200 mt-1">
              Cross-institution isolation, offline queue telemetry, billing lifecycle, and audit logs.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Active Schools
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-slate-900">{tenants.filter((tenant) => tenant.status === 'active').length} Institutions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{tenants.reduce((sum, tenant) => sum + tenant.students, 0).toLocaleString()} managed students</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Monthly Platform MRR
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-indigo-950">Live billing</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">See the subscription ledger for verified revenue</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            System Uptime & Sync
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-emerald-700">Operational</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Monitor via /health endpoint</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            SmartMark OCR API
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-2xl text-purple-900">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Gemini Multimodal pipeline</p>
        </div>
      </div>

      {/* Tenant Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-display font-bold text-base text-slate-900">Registered Tenant Institutions</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-800 font-bold">
                <th className="py-3 px-4">School Institution</th>
                <th className="py-3 px-3">Tenant Code</th>
                <th className="py-3 px-3">Plan</th>
                <th className="py-3 px-3">Enrolled</th>
                <th className="py-3 px-3">Sync Health</th>
                <th className="py-3 px-3">MRR</th>
                <th className="py-3 px-4 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <strong className="text-xs text-slate-900 block">{t.name}</strong>
                    <span className="text-[11px] text-slate-500">{t.location}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-indigo-900">{t.code}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                      {t.plan}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">{t.students} students</td>
                  <td className="py-3 px-3">
                    <span className="text-emerald-700 font-semibold">{t.syncHealth}</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900">{t.mrr}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => toggleTenantLock(t.id, t.status)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1 ${
                        t.status === 'active'
                          ? 'bg-slate-100 text-slate-700 hover:bg-rose-100 hover:text-rose-800'
                          : 'bg-rose-600 text-white hover:bg-rose-700'
                      }`}
                    >
                      {t.status === 'active' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{t.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}</span>
                    </button>
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
