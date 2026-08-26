import type { LucideIcon } from 'lucide-react';
import {
  QrCode,
  Sparkles,
  Camera,
  CheckCircle2,
  FileText,
  Shield,
  Settings,
  CreditCard,
} from 'lucide-react';
import type { UserRole } from '../types';

export type InteractiveToolId =
  | 'smartmark_scan'
  | 'ai_lesson'
  | 'register_student'
  | 'attendance'
  | 'report_card'
  | 'result_checker'
  | 'onboarding_wizard'
  | 'make_payment';

export interface InteractiveTool {
  id: InteractiveToolId;
  modal: string;
  /** When set, navigates instead of opening a modal */
  route?: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind accent classes for the tool chip / card */
  accent: {
    bg: string;
    hover: string;
    text: string;
    border: string;
    icon: string;
  };
  /** Roles that can use this tool in day-to-day work */
  roles: UserRole[];
}

export const INTERACTIVE_TOOLS: InteractiveTool[] = [
  {
    id: 'smartmark_scan',
    modal: 'smartmark_scan',
    label: 'SmartMark OMR Scanner',
    shortLabel: 'SmartMark',
    description: 'Scan & auto-grade OMR scripts',
    icon: QrCode,
    accent: {
      bg: 'bg-purple-50',
      hover: 'hover:bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: 'text-purple-600',
    },
    roles: ['teacher', 'principal', 'school_admin'],
  },
  {
    id: 'ai_lesson',
    modal: 'ai_lesson',
    label: 'AI Lesson Builder',
    shortLabel: 'AI Lesson',
    description: 'Generate NERDC-aligned lesson plans',
    icon: Sparkles,
    accent: {
      bg: 'bg-indigo-50',
      hover: 'hover:bg-indigo-100',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      icon: 'text-indigo-600',
    },
    roles: ['teacher', 'principal'],
  },
  {
    id: 'register_student',
    modal: 'register_student',
    label: 'Register Student',
    shortLabel: 'Register',
    description: 'Webcam photo & SIS enrollment',
    icon: Camera,
    accent: {
      bg: 'bg-blue-50',
      hover: 'hover:bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: 'text-blue-600',
    },
    roles: ['school_admin', 'principal'],
  },
  {
    id: 'attendance',
    modal: 'attendance',
    label: 'Take Attendance',
    shortLabel: 'Attendance',
    description: 'Mark class or day attendance',
    icon: CheckCircle2,
    accent: {
      bg: 'bg-emerald-50',
      hover: 'hover:bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: 'text-emerald-600',
    },
    roles: ['teacher', 'school_admin', 'principal'],
  },
  {
    id: 'report_card',
    modal: 'report_card',
    label: 'Terminal Report Card',
    shortLabel: 'Report Card',
    description: 'View or print term reports',
    icon: FileText,
    accent: {
      bg: 'bg-amber-50',
      hover: 'hover:bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: 'text-amber-600',
    },
    roles: ['school_admin', 'teacher', 'principal', 'parent', 'student'],
  },
  {
    id: 'result_checker',
    modal: 'result_checker',
    route: '/result-checker',
    label: 'Result PIN Checker',
    shortLabel: 'Results',
    description: 'Check results with PIN / admission no.',
    icon: Shield,
    accent: {
      bg: 'bg-rose-50',
      hover: 'hover:bg-rose-100',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: 'text-rose-600',
    },
    roles: ['landing', 'school_admin', 'principal', 'parent', 'student'],
  },
  {
    id: 'onboarding_wizard',
    modal: 'onboarding_wizard',
    route: '/app/setup',
    label: 'School Setup Wizard',
    shortLabel: 'Setup',
    description: '10-step school onboarding',
    icon: Settings,
    accent: {
      bg: 'bg-slate-100',
      hover: 'hover:bg-slate-200',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: 'text-slate-600',
    },
    roles: ['super_admin', 'school_admin'],
  },
  {
    id: 'make_payment',
    modal: 'make_payment',
    label: 'Fee Payment',
    shortLabel: 'Pay Fees',
    description: 'Pay school fees online',
    icon: CreditCard,
    accent: {
      bg: 'bg-teal-50',
      hover: 'hover:bg-teal-100',
      text: 'text-teal-700',
      border: 'border-teal-200',
      icon: 'text-teal-600',
    },
    roles: ['parent', 'school_admin'],
  },
];

export function getToolsForRole(role: UserRole): InteractiveTool[] {
  return INTERACTIVE_TOOLS.filter((tool) => tool.roles.includes(role));
}
