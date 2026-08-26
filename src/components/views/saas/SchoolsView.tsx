import React, { useState } from 'react';import {
  Building2,
  Users,
  Search,
  Plus,
  Filter,
  ExternalLink,
  ShieldCheck,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Sparkles,
  DollarSign,
  Cpu,
  Database,
  ArrowUpRight,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Globe,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { SaaSSchoolTenant, SaaSSchoolStatus, SaaSPlanTier } from '../../../types';
import { feedbackBus } from '../../../shared/feedback/feedbackBus';
import { fetchPlatformSchools } from '@/shared/api/platform';
import { getApiError } from '@/shared/api/client';
import { appConfig } from '@/app/config';

interface SchoolsViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

const mapLiveSchool = (row: Record<string, unknown>): SaaSSchoolTenant => {
  const quota = (row.quota as Record<string, number> | undefined) ?? {};
  const statusRaw = String(row.status ?? 'active');
  const status: SaaSSchoolStatus =
    statusRaw === 'active' || statusRaw === 'trial'
      ? 'Active'
      : statusRaw === 'suspended'
        ? 'Suspended'
        : 'Active';

  return {
    id: String(row.id),
    name: String(row.name ?? 'School'),
    code: String(row.code ?? ''),
    subdomain: `${String(row.slug ?? row.code ?? 'school')}.skuggle.app`,
    location: '—',
    state: '—',
    zone: 'South West',
    plan: (String(row.subscriptionPlan ?? 'pilot') === 'enterprise'
      ? 'Enterprise'
      : String(row.subscriptionPlan ?? 'pilot') === 'growth'
        ? 'Growth'
        : 'Starter') as SaaSPlanTier,
    status,
    studentsCount: Number(quota.students ?? 0),
    teachersCount: Number(quota.users ?? 0),
    adminName: '—',
    adminEmail: '—',
    adminPhone: '—',
    created: String(row.createdAt ?? '').slice(0, 10),
    lastActive: '—',
    storageUsedGB: Number(quota.storageBytes ?? 0) / (1024 * 1024 * 1024),
    smartMarkScansCount: 0,
    geminiTokensUsed: 0,
    renewalDate: '—',
    healthScore: status === 'Active' ? 90 : 60,
    paymentGateway: 'Paystack',
  };
};

export const SchoolsView: React.FC<SchoolsViewProps> = ({
  onOpenModal,
  onNavigateTab,
}) => {
  const [schools, setSchools] = useState<SaaSSchoolTenant[]>([]);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [selectedSchool, setSelectedSchool] = useState<SaaSSchoolTenant | null>(null);

  React.useEffect(() => {
    if (!appConfig.liveApi) {
      setLiveError('Live API disabled — school directory unavailable.');
      return;
    }
    void (async () => {
      try {
        const result = await fetchPlatformSchools(searchTerm);
        setSchools(result.data.map(mapLiveSchool));
        setLiveError(null);
      } catch (error) {
        setLiveError(getApiError(error).message);
      }
    })();
  }, [searchTerm]);

  const handleToggleSchoolStatus = (id: string) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const newStatus: SaaSSchoolStatus = s.status === 'Active' ? 'Suspended' : 'Active';
          feedbackBus.success(`${s.name} status updated to ${newStatus}`);
          return { ...s, status: newStatus };
        }
        return s;
      })
    );
    if (selectedSchool && selectedSchool.id === id) {
      setSelectedSchool((prev) => (prev ? { ...prev, status: prev.status === 'Active' ? 'Suspended' : 'Active' } : null));
    }
  };

  const handleExportCSV = () => {
    const headers = 'School Name,Code,Subdomain,Location,State,Zone,Plan,Status,Students,Teachers,Admin Name,Admin Email,Storage GB\n';
    const rows = filteredSchools.map(s =>
      `"${s.name}","${s.code}","${s.subdomain}","${s.location}","${s.state}","${s.zone}","${s.plan}","${s.status}",${s.studentsCount},${s.teachersCount},"${s.adminName}","${s.adminEmail}",${s.storageUsedGB}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Skuggle_Schools_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    feedbackBus.success('Exported schools directory as CSV');
  };

  const filteredSchools = schools.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = selectedPlan === 'All' || s.plan === selectedPlan;
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;
    const matchesZone = selectedZone === 'All' || s.zone === selectedZone;

    return matchesSearch && matchesPlan && matchesStatus && matchesZone;
  });

  const totalStudents = schools.reduce((acc, s) => acc + s.studentsCount, 0);
  const totalTeachers = schools.reduce((acc, s) => acc + s.teachersCount, 0);
  const activeCount = schools.filter((s) => s.status === 'Active').length;
  const trialCount = schools.filter((s) => s.status === 'Trial').length;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200 overflow-x-hidden">
      {liveError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {liveError}
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <span className="text-indigo-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigateTab('overview')}>
              Super Admin HQ
            </span>
            <span>/</span>
            <span className="text-slate-800 font-bold">Schools Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-indigo-600" />
            <span>Multi-Tenant Schools Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Directory of live partner schools from the platform API (tenant records).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onOpenModal('onboarding_wizard')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard New School</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Schools</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">342</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {activeCount} Active • {trialCount} Trial
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Enrolled Students</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">184,290</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Across 36 States + FCT
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Active Teachers & Staff</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">12,480</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              +8.4% this term
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Platform Health Avg</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">94.8%</p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
              99.98% System Uptime
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search school name, code, state, or admin email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Plan Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium">Plan:</span>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-xs"
            >
              <option value="All">All Plans</option>
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Premium">Premium</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Trial">Trial</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {/* Zone Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 font-medium">Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-xs"
            >
              <option value="All">All Geozones</option>
              <option value="South West">South West</option>
              <option value="South East">South East</option>
              <option value="South South">South South</option>
              <option value="North Central">North Central</option>
              <option value="North West">North West</option>
              <option value="North East">North East</option>
            </select>
          </div>

          {(searchTerm || selectedPlan !== 'All' || selectedStatus !== 'All' || selectedZone !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedPlan('All');
                setSelectedStatus('All');
                setSelectedZone('All');
              }}
              className="p-2 text-slate-400 hover:text-slate-700 text-xs font-semibold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Schools Table and Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Schools Table (Full or 8 cols if drawer open) */}
        <div className={`${selectedSchool ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden`}>
          <div className="p-4.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Partner Schools & Tenants</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                {filteredSchools.length}
              </span>
            </h2>
            <span className="text-[11px] text-slate-400">Click row to inspect tenant telemetry</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10.5px] bg-slate-50/50">
                  <th className="py-3 pl-4">School & Subdomain</th>
                  <th className="py-3">Location & State</th>
                  <th className="py-3">Plan Tier</th>
                  <th className="py-3">Enrollment</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Health Score</th>
                  <th className="py-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                      No schools match your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSchools.map((sch) => {
                    const isSelected = selectedSchool?.id === sch.id;
                    return (
                      <tr
                        key={sch.id}
                        onClick={() => setSelectedSchool(sch)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3.5 pl-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {sch.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{sch.name}</p>
                              <p className="text-[11px] text-indigo-600 font-mono mt-0.5 flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" />
                                {sch.subdomain}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5">
                          <p className="font-semibold text-slate-700">{sch.location}</p>
                          <p className="text-[11px] text-slate-400">{sch.state} • {sch.zone}</p>
                        </td>

                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${
                              sch.plan === 'Enterprise'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : sch.plan === 'Premium'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : sch.plan === 'Growth'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {sch.plan}
                          </span>
                        </td>

                        <td className="py-3.5">
                          <p className="font-bold text-slate-800">{sch.studentsCount.toLocaleString()} Students</p>
                          <p className="text-[11px] text-slate-400">{sch.teachersCount} Teachers</p>
                        </td>

                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                              sch.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : sch.status === 'Trial'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : sch.status === 'Pending'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                sch.status === 'Active'
                                  ? 'bg-emerald-500'
                                  : sch.status === 'Trial'
                                  ? 'bg-amber-500'
                                  : sch.status === 'Pending'
                                  ? 'bg-blue-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {sch.status}
                          </span>
                        </td>

                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  sch.healthScore >= 90
                                    ? 'bg-emerald-500'
                                    : sch.healthScore >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${sch.healthScore}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700 text-[11px]">{sch.healthScore}%</span>
                          </div>
                        </td>

                        <td className="py-3.5 pr-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSchool(sch);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Inspect Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected School Tenant Inspector Drawer (4 cols) */}
        {selectedSchool && (
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4 animate-in slide-in-from-right-4 duration-200 flex flex-col justify-between">
            <div>
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-200">
                    {selectedSchool.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{selectedSchool.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{selectedSchool.code}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Subdomain & Portal Link */}
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10.5px] text-slate-400 uppercase font-bold">Tenant Subdomain</p>
                  <p className="font-mono font-bold text-indigo-700">{selectedSchool.subdomain}</p>
                </div>
                <a
                  href={`https://${selectedSchool.subdomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white text-indigo-600 rounded-lg border border-slate-200 hover:bg-indigo-50 shadow-xs transition-colors"
                  title="Open School Portal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Key Tenant Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] text-slate-400 font-medium">Students Enrolled</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedSchool.studentsCount}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] text-slate-400 font-medium">Staff & Faculty</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedSchool.teachersCount}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] text-slate-400 font-medium">Storage Consumed</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedSchool.storageUsedGB} GB</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] text-slate-400 font-medium">SmartMark Scans</span>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedSchool.smartMarkScansCount.toLocaleString()}</p>
                </div>
              </div>

              {/* Administrator Contact */}
              <div className="mt-4 space-y-2 text-xs">
                <p className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">Administrator Contact</p>
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold">{selectedSchool.adminName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`mailto:${selectedSchool.adminEmail}`} className="text-indigo-600 hover:underline truncate">
                    {selectedSchool.adminEmail}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedSchool.adminPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedSchool.location}</span>
                </div>
              </div>

              {/* Subscription & Renewal */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] text-slate-400 font-medium">Renewal Date</p>
                  <p className="font-bold text-slate-800">{selectedSchool.renewalDate}</p>
                </div>
                <div>
                  <p className="text-[10.5px] text-slate-400 font-medium">Payment Gateway</p>
                  <p className="font-bold text-indigo-600">{selectedSchool.paymentGateway}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => onOpenModal('onboarding_wizard', selectedSchool)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Configure Tenant Settings</span>
              </button>

              <button
                onClick={() => handleToggleSchoolStatus(selectedSchool.id)}
                className={`w-full py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedSchool.status === 'Active'
                    ? 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {selectedSchool.status === 'Active' ? 'Suspend Tenant Access' : 'Reactivate Tenant Access'}
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
