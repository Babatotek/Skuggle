import React, { useState } from 'react';
import {
  Users,
  Building,
  UserPlus,
  ArrowUpRight,
  MoreVertical,
  Camera,
  FileText,
  FileSpreadsheet,
  ArrowRight,
  Shield,
  Download,
  Eye,
  Edit2
} from 'lucide-react';
import { SetupProgressBanner } from '../../features/onboarding/SetupProgressBanner';
import { StudentRecord } from '../../types';

interface AdminDashboardViewProps {
  students: StudentRecord[];
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  students,
  onOpenModal,
  onNavigateTab,
}) => {
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<string | null>(null);

  // Class breakdown data
  const classBreakdown = [
    { name: 'Grade 6', count: 312, color: '#3B82F6', percentage: 25 },
    { name: 'Grade 7', count: 284, color: '#14B8A6', percentage: 22.7 },
    { name: 'Grade 8', count: 276, color: '#F59E0B', percentage: 22.1 },
    { name: 'Grade 9', count: 226, color: '#8B5CF6', percentage: 18.1 },
    { name: 'Grade 10', count: 150, color: '#EC4899', percentage: 12.1 },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      <SetupProgressBanner onNavigateTab={onNavigateTab} />

      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Welcome back, Admin <span className="animate-bounce inline-block text-xl">👋</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 text-slate-600 font-medium text-sm">
            <div className="w-5 h-5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 text-xs font-bold">
              🛡️
            </div>
            <span>Royal Gateway Academy</span>
          </div>
        </div>

        {/* Decorative school building illustration / badge on top right */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 border border-indigo-100 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Academic Session 2026/2027</p>
            <p className="text-[11px] text-slate-500">First Term In Progress (Week 8)</p>
          </div>
        </div>
      </div>

      {/* 5 Metric Stat Cards - Exact Layout from Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Total Students</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">1,248</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>6.3% from last session</span>
            </p>
          </div>
        </div>

        {/* Card 2: Male Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="10" cy="14" r="5" />
                <line x1="19" y1="5" x2="13.5" y2="10.5" />
                <polyline points="15 5 19 5 19 9" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Male Students</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">672</p>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">
              53.8% of total students
            </p>
          </div>
        </div>

        {/* Card 3: Female Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="9" r="5" />
                <line x1="12" y1="14" x2="12" y2="21" />
                <line x1="9" y1="18" x2="15" y2="18" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Female Students</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">576</p>
            <p className="text-[11px] text-pink-600 font-semibold mt-1">
              46.2% of total students
            </p>
          </div>
        </div>

        {/* Card 4: Active Classes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">Active Classes</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">48</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Across all levels
            </p>
          </div>
        </div>

        {/* Card 5: Register Student (CTA Gradient Card) */}
        <div
          id="btn-register-student-card"
          onClick={() => onOpenModal('register_student')}
          className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl p-5 shadow-md shadow-indigo-200 flex flex-col justify-between cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-base font-bold">Register Student</p>
            <p className="text-xs text-indigo-100 mt-0.5">Add a new student record</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Recent Students (Left) + Class Breakdown & Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Recent Students Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Recent Students</h2>
            </div>

            <button
              id="btn-view-all-students"
              onClick={() => onNavigateTab('students')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              <span>View all students</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">Photo</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Admission No.</th>
                  <th className="pb-3">Class</th>
                  <th className="pb-3">Gender</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.slice(0, 5).map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => onOpenModal('report_card', student)}
                  >
                    <td className="py-3 pl-2">
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                    </td>
                    <td className="py-3 font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {student.name}
                    </td>
                    <td className="py-3 text-slate-500 font-medium font-mono text-[11px]">
                      {student.admissionNo}
                    </td>
                    <td className="py-3 text-slate-700 font-medium">
                      {student.classArm}
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            student.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'
                          }`}
                        />
                        <span>{student.gender}</span>
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{student.status}</span>
                      </span>
                    </td>
                    <td className="py-3 text-right pr-2" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          onClick={() => setSelectedStudentForAction(selectedStudentForAction === student.id ? null : student.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {selectedStudentForAction === student.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 animate-in fade-in duration-100">
                            <button
                              onClick={() => {
                                setSelectedStudentForAction(null);
                                onOpenModal('report_card', student);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Report Card</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudentForAction(null);
                                onOpenModal('result_checker', student);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>Check Result PIN</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (4 cols): Students by Class & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: Students by Class (Donut Chart & Breakdown) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Students by Class</h3>
              </div>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
              >
                <span>View report</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-6 pt-2">
              {/* SVG Donut representation */}
              <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background track */}
                  <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                  
                  {/* Slices */}
                  <circle cx="50" cy="50" r="38" stroke="#3B82F6" strokeWidth="12" fill="none" strokeDasharray="59.7 238.8" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="38" stroke="#14B8A6" strokeWidth="12" fill="none" strokeDasharray="54.2 238.8" strokeDashoffset="-59.7" />
                  <circle cx="50" cy="50" r="38" stroke="#F59E0B" strokeWidth="12" fill="none" strokeDasharray="52.8 238.8" strokeDashoffset="-113.9" />
                  <circle cx="50" cy="50" r="38" stroke="#8B5CF6" strokeWidth="12" fill="none" strokeDasharray="43.2 238.8" strokeDashoffset="-166.7" />
                  <circle cx="50" cy="50" r="38" stroke="#EC4899" strokeWidth="12" fill="none" strokeDasharray="28.9 238.8" strokeDashoffset="-209.9" />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-base font-extrabold text-slate-900 leading-tight">1,248</span>
                  <span className="text-[10px] text-slate-400 font-medium">Total</span>
                </div>
              </div>

              {/* Legend with exact numbers */}
              <div className="flex-1 space-y-2 text-xs">
                {classBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card: Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-indigo-600 font-bold">⚡</span>
              <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              
              {/* Action 1: Capture Photo */}
              <div
                id="qa-capture-photo"
                onClick={() => onOpenModal('register_student')}
                className="flex flex-col items-center text-center p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100/80 cursor-pointer transition-all hover:scale-105 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">Capture Photo</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Take student photo</p>
              </div>

              {/* Action 2: Export PDF */}
              <div
                id="qa-export-pdf"
                onClick={() => onOpenModal('report_card')}
                className="flex flex-col items-center text-center p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/80 cursor-pointer transition-all hover:scale-105 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">Export PDF</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Export student list</p>
              </div>

              {/* Action 3: Export Excel */}
              <div
                id="qa-export-excel"
                onClick={() => onNavigateTab('students')}
                className="flex flex-col items-center text-center p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100/80 cursor-pointer transition-all hover:scale-105 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-900">Export Excel</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Export student data</p>
              </div>

            </div>

            {/* Quick Links to Reports & Settings */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigateTab('reports')}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 font-bold text-indigo-700 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Broadsheets & Reports</span>
              </button>
              <button
                onClick={() => onNavigateTab('settings')}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 font-bold text-slate-700 transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>School Settings</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
