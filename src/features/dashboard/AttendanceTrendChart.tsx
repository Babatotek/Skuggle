import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { StudentRecord } from '../../types';

interface AttendanceTrendChartProps {
  students?: StudentRecord[];
  onNavigateAttendance?: () => void;
}

// 10-day realistic daily attendance historical dataset
const dailyAttendanceData = [
  {
    date: 'Mon, Feb 16',
    shortDate: 'Mon 16',
    present: 138,
    late: 4,
    absent: 3,
    total: 145,
    rate: 95.2,
    jssRate: 96.0,
    sssRate: 94.2,
  },
  {
    date: 'Tue, Feb 17',
    shortDate: 'Tue 17',
    present: 141,
    late: 2,
    absent: 2,
    total: 145,
    rate: 97.2,
    jssRate: 98.1,
    sssRate: 96.1,
  },
  {
    date: 'Wed, Feb 18',
    shortDate: 'Wed 18',
    present: 139,
    late: 5,
    absent: 1,
    total: 145,
    rate: 95.9,
    jssRate: 97.0,
    sssRate: 94.5,
  },
  {
    date: 'Thu, Feb 19',
    shortDate: 'Thu 19',
    present: 142,
    late: 2,
    absent: 1,
    total: 145,
    rate: 97.9,
    jssRate: 98.5,
    sssRate: 97.2,
  },
  {
    date: 'Fri, Feb 20',
    shortDate: 'Fri 20',
    present: 140,
    late: 3,
    absent: 2,
    total: 145,
    rate: 96.6,
    jssRate: 97.5,
    sssRate: 95.5,
  },
  {
    date: 'Mon, Feb 23',
    shortDate: 'Mon 23',
    present: 136,
    late: 6,
    absent: 3,
    total: 145,
    rate: 93.8,
    jssRate: 95.0,
    sssRate: 92.4,
  },
  {
    date: 'Tue, Feb 24',
    shortDate: 'Tue 24',
    present: 142,
    late: 2,
    absent: 1,
    total: 145,
    rate: 97.9,
    jssRate: 98.7,
    sssRate: 97.0,
  },
  {
    date: 'Wed, Feb 25',
    shortDate: 'Wed 25',
    present: 143,
    late: 1,
    absent: 1,
    total: 145,
    rate: 98.6,
    jssRate: 99.0,
    sssRate: 98.1,
  },
  {
    date: 'Thu, Feb 26',
    shortDate: 'Thu 26',
    present: 140,
    late: 3,
    absent: 2,
    total: 145,
    rate: 96.6,
    jssRate: 97.2,
    sssRate: 95.8,
  },
  {
    date: 'Fri, Feb 27 (Today)',
    shortDate: 'Today',
    present: 141,
    late: 3,
    absent: 1,
    total: 145,
    rate: 97.2,
    jssRate: 98.0,
    sssRate: 96.3,
  },
];

const classBreakdownData = [
  { name: 'JSS 1', present: 38, late: 1, absent: 1, rate: 97.5 },
  { name: 'JSS 2', present: 36, late: 1, absent: 0, rate: 98.6 },
  { name: 'JSS 3', present: 34, late: 1, absent: 0, rate: 98.5 },
  { name: 'SSS 1', present: 33, late: 2, absent: 1, rate: 94.3 },
];

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
  students = [],
  onNavigateAttendance,
}) => {
  const [viewMode, setViewMode] = useState<'rate' | 'headcount' | 'classes'>('rate');
  const [range, setRange] = useState<'5d' | '10d'>('10d');

  const filteredData =
    range === '5d' ? dailyAttendanceData.slice(-5) : dailyAttendanceData;

  // Calculate high-level summary metrics
  const avgRate = (
    filteredData.reduce((acc, curr) => acc + curr.rate, 0) / filteredData.length
  ).toFixed(1);
  const totalPresentToday = dailyAttendanceData[dailyAttendanceData.length - 1].present;
  const totalLateToday = dailyAttendanceData[dailyAttendanceData.length - 1].late;
  const totalAbsentToday = dailyAttendanceData[dailyAttendanceData.length - 1].absent;

  // Custom clean tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs min-w-44 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-semibold text-slate-200">
            <span>{dataPoint.date || label}</span>
            {dataPoint.rate && (
              <span className="text-emerald-400 font-bold">{dataPoint.rate}%</span>
            )}
          </div>
          {viewMode === 'rate' ? (
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Overall Rate:
                </span>
                <span className="font-semibold text-white">{dataPoint.rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                  Junior (JSS):
                </span>
                <span className="font-medium text-slate-200">{dataPoint.jssRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                  Senior (SSS):
                </span>
                <span className="font-medium text-slate-200">{dataPoint.sssRate}%</span>
              </div>
            </div>
          ) : viewMode === 'headcount' ? (
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Present:
                </span>
                <span className="font-bold text-white">{dataPoint.present} students</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-amber-400">
                  <Clock className="w-3 h-3" /> Late:
                </span>
                <span className="font-medium text-slate-200">{dataPoint.late}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1 text-rose-400">
                  <AlertTriangle className="w-3 h-3" /> Absent:
                </span>
                <span className="font-medium text-slate-200">{dataPoint.absent}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Turnout:</span>
                <span className="font-bold text-emerald-400">{dataPoint.rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Present Count:</span>
                <span className="text-white font-medium">{dataPoint.present} students</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Header with Title, Stats Pill and View Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="font-display font-bold text-lg text-slate-900">
              Daily Attendance Trends
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
              {avgRate}% Average
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily roll call analytics across all arms and academic levels.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('rate')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'rate'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Turnout %
            </button>
            <button
              onClick={() => setViewMode('headcount')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'headcount'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Headcount
            </button>
            <button
              onClick={() => setViewMode('classes')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'classes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Class
            </button>
          </div>

          {/* Timeframe selector when in trend mode */}
          {viewMode !== 'classes' && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-0.5 text-xs font-semibold">
              <button
                onClick={() => setRange('5d')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  range === '5d'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                5 Days
              </button>
              <button
                onClick={() => setRange('10d')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  range === '10d'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                10 Days
              </button>
            </div>
          )}

          {onNavigateAttendance && (
            <button
              onClick={onNavigateAttendance}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              <span>Take Roll Call</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium leading-none">Today's Present</div>
            <div className="text-sm font-bold text-slate-900 mt-1">{totalPresentToday} students</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium leading-none">Late Arrivals</div>
            <div className="text-sm font-bold text-amber-900 mt-1">{totalLateToday} students</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium leading-none">Absent</div>
            <div className="text-sm font-bold text-rose-900 mt-1">{totalAbsentToday} recorded</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium leading-none">Highest Rate</div>
            <div className="text-sm font-bold text-indigo-950 mt-1">98.6% (Wed 25)</div>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'rate' ? (
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="jssGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="shortDate"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[85, 100]}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="rate"
                name="Overall Turnout %"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#rateGradient)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
              />
              <Area
                type="monotone"
                dataKey="jssRate"
                name="Junior School"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#jssGradient)"
              />
            </AreaChart>
          ) : viewMode === 'headcount' ? (
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="shortDate"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
              />
              <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="absent" name="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          ) : (
            <BarChart
              data={classBreakdownData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                domain={[80, 100]}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#64748b"
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="rate"
                name="Attendance Rate"
                fill="#10b981"
                radius={[0, 6, 6, 0]}
                maxBarSize={24}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Insight Note */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          NERDC minimum required attendance threshold is 75% for exam qualification.
        </span>
        <span className="font-medium text-slate-700">All classes currently in good standing</span>
      </div>
    </div>
  );
};
