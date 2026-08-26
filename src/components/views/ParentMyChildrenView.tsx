import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  GraduationCap,
  Calendar,
  Heart,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Bus,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Edit3,
  Award,
  BookOpen,
  Sparkles,
  QrCode,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  Eye,
  Camera
} from 'lucide-react';
import { feedbackBus } from '../../shared/feedback/feedbackBus';
import { appConfig } from '@/app/config';
interface ParentMyChildrenViewProps {
  onOpenModal: (modalName: string, data?: any) => void;
  onNavigateTab: (tab: string) => void;
}

interface ChildDetail {
  id: string;
  name: string;
  admissionNo: string;
  gender: string;
  dob: string;
  age: number;
  classArm: string;
  level: string;
  avatar: string;
  classTeacher: {
    name: string;
    email: string;
    phone: string;
  };
  house: string;
  bloodGroup: string;
  genotype: string;
  allergies: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  authorizedPickups: {
    name: string;
    relation: string;
    phone: string;
    idVerified: boolean;
    photo: string;
  }[];
  busRoute: string;
  busStop: string;
  busDriver: {
    name: string;
    phone: string;
    vehicleNo: string;
  };
  termAverage: number;
  position: string;
  attendanceRate: number;
  feeBalance: number;
  recentAchievements: string[];
}

const CHILDREN_DATA: ChildDetail[] = [
  {
    id: 'child_1',
    name: 'Nathan Bello',
    admissionNo: 'RGA/2024/0412',
    gender: 'Male',
    dob: '14 May 2013',
    age: 13,
    classArm: 'JSS 2A',
    level: 'Junior Secondary',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    classTeacher: {
      name: 'Mrs. Chioma Okafor',
      email: 'c.okafor@royalgateway.edu.ng',
      phone: '+234 803 456 7890'
    },
    house: 'Sapphire (Blue House)',
    bloodGroup: 'O+',
    genotype: 'AA',
    allergies: ['Peanuts / Groundnuts', 'Penicillin'],
    emergencyContact: {
      name: 'Mr. Babatunde Bello (Father)',
      relationship: 'Father',
      phone: '+234 802 334 5566'
    },
    authorizedPickups: [
      {
        name: 'Mrs. Folashade Bello',
        relation: 'Mother',
        phone: '+234 803 112 3344',
        idVerified: true,
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Mr. Babatunde Bello',
        relation: 'Father',
        phone: '+234 802 334 5566',
        idVerified: true,
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Mrs. Comfort Adeleke',
        relation: 'Aunt / Designated Driver',
        phone: '+234 809 778 9900',
        idVerified: true,
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      }
    ],
    busRoute: 'Route 4 (Lekki Phase 1 - Admiralty Way)',
    busStop: 'Admiralty Circle Bus Shelter',
    busDriver: {
      name: 'Mr. Sunday Alao',
      phone: '+234 805 123 9988',
      vehicleNo: 'TOYOTA COASTER • APP-492-XG'
    },
    termAverage: 84.6,
    position: '4th out of 38',
    attendanceRate: 96.4,
    feeBalance: 45000,
    recentAchievements: [
      '1st Place in Lagos State STEM Robotics Olympiad (Junior Category)',
      'School Junior Football Team Captain',
      'Excellence Certificate in Basic Technology & Integrated Science'
    ]
  },
  {
    id: 'child_2',
    name: 'Chidera Bello',
    admissionNo: 'RGA/2027/1198',
    gender: 'Female',
    dob: '08 November 2017',
    age: 9,
    classArm: 'Primary 4B',
    level: 'Basic / Primary',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    classTeacher: {
      name: 'Mr. Emmanuel Adeleke',
      email: 'e.adeleke@royalgateway.edu.ng',
      phone: '+234 802 987 6543'
    },
    house: 'Emerald (Green House)',
    bloodGroup: 'A+',
    genotype: 'AA',
    allergies: ['Dust mites', 'Lactose (Mild)'],
    emergencyContact: {
      name: 'Mrs. Folashade Bello (Mother)',
      relationship: 'Mother',
      phone: '+234 803 112 3344'
    },
    authorizedPickups: [
      {
        name: 'Mrs. Folashade Bello',
        relation: 'Mother',
        phone: '+234 803 112 3344',
        idVerified: true,
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Mr. Babatunde Bello',
        relation: 'Father',
        phone: '+234 802 334 5566',
        idVerified: true,
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      }
    ],
    busRoute: 'Route 4 (Lekki Phase 1 - Admiralty Way)',
    busStop: 'Admiralty Circle Bus Shelter',
    busDriver: {
      name: 'Mr. Sunday Alao',
      phone: '+234 805 123 9988',
      vehicleNo: 'TOYOTA COASTER • APP-492-XG'
    },
    termAverage: 88.2,
    position: '2nd out of 32',
    attendanceRate: 98.2,
    feeBalance: 0,
    recentAchievements: [
      'Gold Medal in Inter-House Swimming 50m Freestyle',
      'Best Reader of the Term (Primary Section)',
      'Spelling Bee Semi-Finalist'
    ]
  },
  {
    id: 'child_3',
    name: 'Somto Bello',
    admissionNo: 'RGA/2029/3081',
    gender: 'Male',
    dob: '22 March 2022',
    age: 4,
    classArm: 'Nursery 2A',
    level: 'Early Childhood / Kindergarten',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    classTeacher: {
      name: 'Miss Angela Lawson',
      email: 'a.lawson@royalgateway.edu.ng',
      phone: '+234 806 332 1100'
    },
    house: 'Topaz (Yellow House)',
    bloodGroup: 'O+',
    genotype: 'AA',
    allergies: ['None reported'],
    emergencyContact: {
      name: 'Mrs. Folashade Bello (Mother)',
      relationship: 'Mother',
      phone: '+234 803 112 3344'
    },
    authorizedPickups: [
      {
        name: 'Mrs. Folashade Bello',
        relation: 'Mother',
        phone: '+234 803 112 3344',
        idVerified: true,
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
      },
      {
        name: 'Mr. Babatunde Bello',
        relation: 'Father',
        phone: '+234 802 334 5566',
        idVerified: true,
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      }
    ],
    busRoute: 'Route 4 (Lekki Phase 1 - Admiralty Way)',
    busStop: 'Admiralty Circle Bus Shelter',
    busDriver: {
      name: 'Mr. Sunday Alao',
      phone: '+234 805 123 9988',
      vehicleNo: 'TOYOTA COASTER • APP-492-XG'
    },
    termAverage: 92.5,
    position: '1st out of 24',
    attendanceRate: 95.0,
    feeBalance: 15000,
    recentAchievements: [
      'Early Phonics & Numeracy Star of the Month',
      'Most Creative Clay Modeling & Color Harmony Award',
      'Perfect Manners & Punctuality Star'
    ]
  }
];

export const ParentMyChildrenView: React.FC<ParentMyChildrenViewProps> = ({
  onOpenModal,
  onNavigateTab
}) => {

  if (appConfig.liveApi) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Children</h1>
          <p className="text-sm text-slate-500 mt-1">Your children's profiles, medical records, and authorised pickup persons will appear here once the school links them to your account.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No children linked yet</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Your school admin needs to register your children and link them to your parent account before their profiles appear here.</p>
        </div>
      </div>
    );
  }
  const [selectedChildId, setSelectedChildId] = useState<string>('child_1');
  const [activeChildSubTab, setActiveChildSubTab] = useState<'profile' | 'medical' | 'pickups' | 'transport' | 'achievements'>('profile');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkAdmissionNo, setLinkAdmissionNo] = useState('');
  const [linkAccessPin, setLinkAccessPin] = useState('');

  const selectedChild = CHILDREN_DATA.find((c) => c.id === selectedChildId) || CHILDREN_DATA[0];

  const handleLinkChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkAdmissionNo || !linkAccessPin) {
      feedbackBus.error('Please enter both Admission Number and Parent Access PIN.');
      return;
    }
    feedbackBus.success(`Verification request submitted for ${linkAdmissionNo}. Bursary desk will approve within 24 hours.`);
    setShowLinkModal(false);
    setLinkAdmissionNo('');
    setLinkAccessPin('');
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      {/* Top Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] uppercase tracking-wide">
              Family & Ward Profiles
            </span>
            <span className="text-xs text-slate-400 font-medium">3 Linked Students</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            My Children & Student Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage comprehensive student biometrics, emergency health data, authorized pickup guardians, and transport schedules.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-indigo-200"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Link Another Child (PIN)</span>
          </button>

          <button
            onClick={() => onOpenModal('report_card', selectedChild)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View {selectedChild.name.split(' ')[0]}'s Term Report</span>
          </button>
        </div>
      </div>

      {/* 3 Child Cards Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHILDREN_DATA.map((child) => {
          const isSelected = selectedChildId === child.id;
          return (
            <div
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-indigo-600 shadow-[0_4px_20px_rgba(79,70,229,0.12)] ring-2 ring-indigo-500/20'
                  : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={child.avatar}
                    alt={child.name}
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-indigo-100"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{child.name}</h3>
                    <p className="text-xs text-indigo-600 font-semibold">{child.classArm} • {child.level}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{child.admissionNo}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isSelected ? 'Active Ward' : 'Select'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium">Term Average</p>
                  <p className="font-extrabold text-indigo-600 text-sm mt-0.5">{child.termAverage}%</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium">Attendance</p>
                  <p className="font-extrabold text-emerald-600 text-sm mt-0.5">{child.attendanceRate}%</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-medium">Fee Due</p>
                  <p className={`font-extrabold text-sm mt-0.5 ${child.feeBalance > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {child.feeBalance > 0 ? `₦${(child.feeBalance / 1000).toFixed(0)}k` : '₦0'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Child Comprehensive Profile Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        
        {/* Workspace Header with Quick Action Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <img
              src={selectedChild.avatar}
              alt={selectedChild.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{selectedChild.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10.5px]">
                  Enrolled & Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Class: <strong className="text-slate-800">{selectedChild.classArm}</strong> • House: <strong className="text-slate-800">{selectedChild.house}</strong> • Reg: <span className="font-mono text-indigo-600">{selectedChild.admissionNo}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigateTab('academics')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Academics</span>
            </button>

            <button
              onClick={() => onNavigateTab('attendance')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Attendance</span>
            </button>

            <button
              onClick={() => onNavigateTab('payments')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              <span>Fee Ledgers</span>
            </button>

            <button
              onClick={() => onNavigateTab('messages')}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-indigo-200"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              <span>Message Teacher</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs for Child Details */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveChildSubTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeChildSubTab === 'profile'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic & Bio Info</span>
          </button>

          <button
            onClick={() => setActiveChildSubTab('medical')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeChildSubTab === 'medical'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Health & Medical Records</span>
          </button>

          <button
            onClick={() => setActiveChildSubTab('pickups')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeChildSubTab === 'pickups'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Pickups & Security</span>
          </button>

          <button
            onClick={() => setActiveChildSubTab('transport')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeChildSubTab === 'transport'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Bus & Transport Shuttle</span>
          </button>

          <button
            onClick={() => setActiveChildSubTab('achievements')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeChildSubTab === 'achievements'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Achievements & Badges</span>
          </button>
        </div>

        {/* SUBTAB 1: Academic & Bio Info */}
        {activeChildSubTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Box 1: Student Demographics */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Student Demographics</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Date of Birth</span>
                  <span className="font-bold text-slate-800">{selectedChild.dob} ({selectedChild.age} yrs)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Gender</span>
                  <span className="font-bold text-slate-800">{selectedChild.gender}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">School Level</span>
                  <span className="font-bold text-slate-800">{selectedChild.level}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">House Color</span>
                  <span className="font-bold text-slate-800">{selectedChild.house}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Class Teacher Information */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>Assigned Form / Class Tutor</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Teacher Name</span>
                  <span className="font-bold text-slate-800">{selectedChild.classTeacher.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Official Email</span>
                  <span className="font-mono text-indigo-600 font-semibold">{selectedChild.classTeacher.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">School Phone</span>
                  <span className="font-bold text-slate-800">{selectedChild.classTeacher.phone}</span>
                </div>
                <div className="pt-1">
                  <button
                    onClick={() => onNavigateTab('messages')}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Teacher a Direct Note</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Box 3: Digital Student ID & SmartCard */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Digital Student ID Card</span>
                </h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Active RFID Student Badge for automated turnstile gate scans, library book checkout, and cafeteria contactless lunch.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-8 h-8 text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedChild.admissionNo}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold">● RFID Gate Pass Verified</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    feedbackBus.success(`Digital Student ID Badge for ${selectedChild.name} downloaded successfully!`);
                  }}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Save</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* SUBTAB 2: Health & Medical Records */}
        {activeChildSubTab === 'medical' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Official Health & Emergency Clinic Profile</h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  This data is synchronized in real-time with the school infirmary nurses, physical education staff, and cafeteria kitchen crew.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-xs">
                <p className="text-slate-500 font-medium">Blood Group</p>
                <p className="text-xl font-extrabold text-slate-900">{selectedChild.bloodGroup}</p>
                <p className="text-[10.5px] text-slate-400">Verified via clinical laboratory submission</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-xs">
                <p className="text-slate-500 font-medium">Genotype</p>
                <p className="text-xl font-extrabold text-slate-900">{selectedChild.genotype}</p>
                <p className="text-[10.5px] text-slate-400">Normal hemoglobin screening confirmed</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2 text-xs">
                <p className="text-slate-500 font-medium">Known Allergies & Dietary Directives</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedChild.allergies.map((allergy, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[10.5px]">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-white space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 text-sm">Emergency Medical Action Protocol</h4>
              <p className="text-slate-600">
                Primary Contact: <strong>{selectedChild.emergencyContact.name}</strong> ({selectedChild.emergencyContact.relationship}) at <strong className="text-indigo-600 font-mono">{selectedChild.emergencyContact.phone}</strong>.
              </p>
              <p className="text-slate-500 text-[11px]">
                In the event of medical emergencies requiring off-campus attention, the student will be immediately transported to <strong>Evercare Hospital Lekki</strong> (School Designated Partner Clinic).
              </p>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Authorized Pickups & Security */}
        {activeChildSubTab === 'pickups' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Authorized Pickup Persons & Gate Security PIN</h4>
                <p className="text-xs text-slate-500">Only verified individuals below with photo ID and SMS gate code are permitted to pick up {selectedChild.name}.</p>
              </div>
              <button
                onClick={() => {
                  feedbackBus.success('New pickup guardian registration form dispatched to parent email.');
                }}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-indigo-200 flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Authorized Guardian</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedChild.authorizedPickups.map((guardian, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={guardian.photo}
                      alt={guardian.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{guardian.name}</h5>
                      <p className="text-[11px] text-indigo-600 font-semibold">{guardian.relation}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{guardian.phone}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Govt ID Verified</span>
                    </span>
                    <span className="text-slate-400 font-medium">OTP Access Enabled</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 4: Bus & Transport Shuttle */}
        {activeChildSubTab === 'transport' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bus className="w-4 h-4 text-indigo-600" />
                  <span>Assigned School Bus Shuttle Information</span>
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  Active Subscription
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-medium">Designated Route</p>
                  <p className="font-bold text-slate-900 mt-1">{selectedChild.busRoute}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-medium">Pick-up / Drop-off Stop</p>
                  <p className="font-bold text-slate-900 mt-1">{selectedChild.busStop}</p>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">Morning Pickup: 07:15 AM • Afternoon Drop: 04:10 PM</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-medium">Bus Driver & Vehicle</p>
                  <p className="font-bold text-slate-900 mt-1">{selectedChild.busDriver.name}</p>
                  <p className="text-[10.5px] text-indigo-600 font-mono mt-0.5">{selectedChild.busDriver.phone}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{selectedChild.busDriver.vehicleNo}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: Achievements & Badges */}
        {activeChildSubTab === 'achievements' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900">Academic & Co-Curricular Commendations</h4>
            <div className="space-y-2.5">
              {selectedChild.recentAchievements.map((ach, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/30 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{ach}</p>
                      <p className="text-[11px] text-slate-500">2026/2027 Academic Session • Royal Gateway Academy</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700 font-bold text-[10.5px]">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Link Ward / Student to Account</h3>
                <p className="text-xs text-slate-500">Enter student admission number and Parent Access PIN from admission letter.</p>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkChild} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student Admission Number</label>
                <input
                  type="text"
                  placeholder="e.g. RGA/2026/0942"
                  value={linkAdmissionNo}
                  onChange={(e) => setLinkAdmissionNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parent Secret Access PIN</label>
                <input
                  type="password"
                  placeholder="6-digit confidential PIN"
                  maxLength={6}
                  value={linkAccessPin}
                  onChange={(e) => setLinkAccessPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-200 transition-all cursor-pointer"
                >
                  Verify & Link Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
