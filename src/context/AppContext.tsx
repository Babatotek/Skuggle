import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserRole,
  Persona,
  TenantBranding,
  WorkspaceItem,
  CurrentUser,
  StudentRecord,
  StaffMember,
  AcademicSession,
  AcademicTerm,
  ClassLevel,
  SubjectItem,
  AttendanceSheet,
  AssessmentRecord,
  ResultPINRecord,
  FeeInvoice,
  TeacherLessonPlan,
  SmartMarkBatch,
  LaunchChecklistItem,
  OfflineQueueItem,
  AttendanceStatus,
  FeeTransaction,
  StudentScoreEntry,
  TeacherProfileData,
  ChildLinkData,
  InvitationRecord,
  PrintableCredentialCard,
  SubscriptionPlan,
  SubscriptionPlanType,
  CBTQuiz,
} from '../types';
import { apiMutation, apiRequest, describeApiError } from '../lib/apiClient';

const demoMode = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';

const backendRole = (value: unknown): UserRole => ({ school_admin: 'School Admin', principal: 'Principal', teacher: 'Teacher', parent: 'Parent', student: 'Student', platform_owner: 'Platform Owner', platform_super_admin: 'Platform Owner', bursar: 'Bursar', examination_officer: 'School Admin', admission_officer: 'School Admin' } as Record<string, UserRole>)[String(value)] ?? 'Student';

// Default initial School Tenant Branding
const defaultBranding: TenantBranding = {
  schoolId: 'sch-001',
  schoolName: 'Crown Heights International Academy',
  shortName: 'Crown Heights',
  schoolCode: 'CHIA-LAGOS',
  portalSlug: 'crownheights',
  motto: 'Knowledge, Character and Excellence',
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
  primaryColor: '#4F46E5',
  secondaryColor: '#7C3AED',
  accentColor: '#F59E0B',
  backgroundStyle: 'crest-glow',
  animationStyle: 'smooth-scale',
  welcomeMessage: 'Welcome to our digital academic campus and learning portal.',
  showPoweredBySkuggle: true,
  address: 'Plot 14, Admiralty Way, Lekki Phase 1',
  city: 'Lekki',
  state: 'Lagos State',
  email: 'admissions@crownheights.edu.ng',
  phone: '+234 803 123 4567',
  isPublished: true,
  contrastRatio: 6.8,
  contrastValid: true,
  academicSession: '2025/2026',
  currentTerm: 'First Term',
};

const platformBranding: TenantBranding = {
  schoolId: '',
  schoolName: 'Skuggle',
  shortName: 'Skuggle',
  schoolCode: '',
  portalSlug: '',
  motto: '',
  logoUrl: '',
  primaryColor: '#4F46E5',
  secondaryColor: '#7C3AED',
  accentColor: '#F59E0B',
  backgroundStyle: 'minimal-clean',
  animationStyle: 'smooth-scale',
  welcomeMessage: '',
  showPoweredBySkuggle: true,
  address: '',
  city: '',
  state: '',
  email: '',
  phone: '',
  isPublished: false,
  academicSession: '',
  currentTerm: '',
};

// Subscription Plans (Free + Paid tiers with Nigerian market defensibility)
export const initialSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'school_starter_free',
    category: 'school',
    name: 'School Starter (Free)',
    tagline: 'A permanent, genuinely useful plan for small institutions',
    priceNGN: 0,
    billingPeriod: 'free',
    studentLimit: 50,
    staffLimit: 10,
    features: [
      { name: '1 Campus', included: true },
      { name: 'Up to 50 active students', included: true, limit: '50 Students' },
      { name: 'Up to 10 staff accounts', included: true, limit: '10 Staff' },
      { name: 'School Branding Studio & Welcome Page', included: true },
      { name: 'Classes, Arms & Subjects setup', included: true },
      { name: '1-Tap Daily Attendance', included: true },
      { name: 'Simple Score Entry & Report Cards', included: true },
      { name: 'Basic Parent & Student Portals', included: true },
      { name: 'Broadcast Announcements', included: true },
      { name: 'Skuggle watermark on documents', included: true, description: 'Powered by Skuggle branding displayed' },
      { name: 'AI Scheme of Work & SmartMark', included: false, description: 'Available via Intelligence add-on' },
    ],
  },
  {
    id: 'school_core',
    category: 'school',
    name: 'Skuggle School Core',
    tagline: 'Complete operating system for growing nursery, primary & secondary schools',
    priceNGN: 1200,
    billingPeriod: 'per_term_per_student',
    highlight: true,
    features: [
      { name: 'More than 50 students (Unlimited tier)', included: true },
      { name: 'Unlimited staff & teacher accounts', included: true },
      { name: 'Full CA & Terminal Exam Workflow', included: true },
      { name: 'Configurable Term Report Cards & PIN generator', included: true },
      { name: 'Complete Parent & Student Portals', included: true },
      { name: 'Fee Management & Payment Reconciliation', included: true },
      { name: 'Bulk Import/Export with Excel & CSV', included: true },
      { name: 'Historical Multi-Term Academic Records', included: true },
      { name: 'Clean Branded Documents (No watermark)', included: true },
      { name: 'Offline sync & automatic retry queue', included: true },
      { name: 'Multi-channel SMS, WhatsApp & Email notices', included: true },
      { name: 'Audit trail & granular role permissions', included: true },
    ],
  },
  {
    id: 'intelligence_addon',
    category: 'addon',
    name: 'Skuggle Intelligence Add-On',
    tagline: 'AI-powered pedagogical intelligence & optical examination scoring',
    priceNGN: 600,
    billingPeriod: 'per_term_per_student',
    features: [
      { name: 'SmartMark Optical Exam Sheet Scanner', included: true },
      { name: 'Automated Objective Marking with confidence scoring', included: true },
      { name: 'Student 360 Performance Intelligence & radar mastery', included: true },
      { name: 'AI Lesson Plan Generator (NERDC Curriculum-grounded)', included: true },
      { name: 'AI Scheme of Work & Curriculum Aligner', included: true },
      { name: 'AI CBT & Exam Question Generator (WAEC/NECO/BECE format)', included: true },
      { name: 'Early-warning academic intervention alerts', included: true },
    ],
  },
  {
    id: 'personal_teacher_free',
    category: 'personal',
    name: 'Personal Teacher Free',
    tagline: 'For independent educators to prepare lessons & track learners',
    priceNGN: 0,
    billingPeriod: 'free',
    features: [
      { name: 'Verified Professional Teacher Profile', included: true },
      { name: '1 Personal Teaching Class', included: true },
      { name: 'NERDC Curriculum Browser', included: true },
      { name: 'Lesson-Plan AI Generation (5/month)', included: true, limit: '5 Plans/mo' },
      { name: 'Curriculum Question Generator (20/mo)', included: true, limit: '20 Qs/mo' },
      { name: 'Basic Assignment Creation & Share Links', included: true },
      { name: 'Personal Resource Repository', included: true },
      { name: 'Skuggle-branded exports', included: true },
    ],
  },
  {
    id: 'personal_pro',
    category: 'personal',
    name: 'Skuggle Personal Pro',
    tagline: 'For high-impact educators, tutors and ambitious learning families',
    priceNGN: 3500,
    billingPeriod: 'monthly',
    highlight: true,
    features: [
      { name: 'Unlimited Personal Classes & Tutoring groups', included: true },
      { name: 'Unlimited AI Lesson & Scheme of Work Generation', included: true },
      { name: 'Comprehensive WAEC/JAMB/BECE Question Bank', included: true },
      { name: 'SmartMark scan grading for personal classes', included: true },
      { name: 'Clean PDF/DOCX exports without watermark', included: true },
      { name: 'Advanced learner mastery analytics', included: true },
      { name: 'Personalized student recommendations', included: true },
    ],
  },
  {
    id: 'parent_free',
    category: 'personal',
    name: 'Parent Free',
    tagline: 'Connect to subscribing schools or manage home study',
    priceNGN: 0,
    billingPeriod: 'free',
    features: [
      { name: 'Family Learning Profile', included: true },
      { name: 'Connection to any subscribing school at no cost', included: true },
      { name: 'Support for up to 3 children', included: true },
      { name: 'Daily Attendance & Term Results access', included: true },
      { name: 'Digital Fee receipts & instant reconciliation', included: true },
      { name: 'Study reminders & weekly learning plans', included: true },
    ],
  },
  {
    id: 'student_free',
    category: 'personal',
    name: 'Student Free',
    tagline: 'Personal learning space with AI buddy and curriculum practice',
    priceNGN: 0,
    billingPeriod: 'free',
    features: [
      { name: 'Personal Learner Profile & Study Streak', included: true },
      { name: 'Weekly Learning Goals & Milestone Badges', included: true },
      { name: 'CBT Quizzes & Practice Tests', included: true },
      { name: 'Skuggle AI Study Buddy assistance', included: true },
      { name: 'Curriculum progress tracking', included: true },
    ],
  },
  {
    id: 'enterprise',
    category: 'school',
    name: 'Multi-Campus & Enterprise',
    tagline: 'For educational groups, diocesan systems & multi-branch institutions',
    priceNGN: 0,
    billingPeriod: 'yearly',
    features: [
      { name: 'Multiple Campuses under 1 central group', included: true },
      { name: 'Central Group-Level Executive Dashboard', included: true },
      { name: 'Custom Domain (e.g. portal.royalgateway.edu.ng)', included: true },
      { name: 'Single Sign-On (SSO) & REST API Access', included: true },
      { name: 'Dedicated Onboarding Specialist & SLA', included: true },
      { name: 'Custom ERP/Fintech Payment Integrations', included: true },
    ],
  },
];

// Initial Workspaces - Separated into School Space and Personal Space
export const initialWorkspaces: WorkspaceItem[] = [
  {
    id: 'ws-school-01',
    name: 'Crown Heights Int’l Academy',
    type: 'school',
    role: 'School Admin',
    schoolCode: 'CHIA-LAGOS',
    attentionCount: 3,
    unreadMessages: 4,
    activeSession: '2025/2026',
    activeTerm: 'First Term',
    isOwner: true,
  },
  {
    id: 'ws-principal-01',
    name: 'Crown Heights Int’l Academy',
    type: 'school',
    role: 'Principal',
    schoolCode: 'CHIA-LAGOS',
    attentionCount: 4,
    unreadMessages: 2,
    activeSession: '2025/2026',
    activeTerm: 'First Term',
  },
  {
    id: 'ws-school-teacher',
    name: 'Crown Heights Int’l Academy (Class Teacher)',
    type: 'school',
    role: 'Teacher',
    schoolCode: 'CHIA-LAGOS',
    attentionCount: 2,
    unreadMessages: 3,
    activeSession: '2025/2026',
    activeTerm: 'First Term',
  },
  {
    id: 'ws-school-parent',
    name: 'Crown Heights Int’l Academy (Parent Portal)',
    type: 'school',
    role: 'Parent',
    schoolCode: 'CHIA-LAGOS',
    attentionCount: 1,
    unreadMessages: 2,
    activeSession: '2025/2026',
    activeTerm: 'First Term',
  },
  {
    id: 'ws-school-student',
    name: 'Crown Heights Int’l Academy (Student Portal)',
    type: 'school',
    role: 'Student',
    schoolCode: 'CHIA-LAGOS',
    attentionCount: 1,
    unreadMessages: 0,
    activeSession: '2025/2026',
    activeTerm: 'First Term',
  },
  {
    id: 'ws-teacher-personal',
    name: 'Tosin Fanimo (Personal Teaching Studio)',
    type: 'personal',
    role: 'Teacher',
    persona: 'teacher',
    attentionCount: 0,
    unreadMessages: 0,
  },
  {
    id: 'ws-parent-personal',
    name: 'Fanimo Family Hub (Home Study & Cross-School)',
    type: 'personal',
    role: 'Parent',
    persona: 'parent',
    attentionCount: 2,
    unreadMessages: 1,
  },
  {
    id: 'ws-student-personal',
    name: 'David Fanimo (Personal Learner Hub)',
    type: 'personal',
    role: 'Student',
    persona: 'student',
    attentionCount: 1,
    unreadMessages: 0,
  },
  {
    id: 'ws-platform-01',
    name: 'Skuggle Platform Operations',
    type: 'platform',
    role: 'Platform Owner',
    attentionCount: 1,
    unreadMessages: 0,
  },
];

// Initial Students
const initialStudents: StudentRecord[] = [
  {
    id: 'std-001',
    admissionNo: 'CHIA/2024/0142',
    firstName: 'David',
    lastName: 'Fanimo',
    otherName: 'Oluwaseun',
    gender: 'Male',
    dateOfBirth: '2012-05-14',
    classLevel: 'JSS 2',
    arm: 'Diamond',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    guardianId: 'grd-001',
    guardianName: 'Dr. Babatunde Fanimo',
    guardianRelationship: 'Father',
    guardianPhone: '+234 802 334 8899',
    guardianEmail: 'b.fanimo@healthconsult.ng',
    attendanceRate: 98,
    termAverage: 88.4,
    positionInClass: 2,
    totalStudentsInClass: 32,
    feesStatus: 'Paid',
    balanceDue: 0,
    academicHistory: [
      { term: 'Third Term', session: '2024/2025', average: 86.2, grade: 'A', remarks: 'Outstanding diligence in sciences.' },
      { term: 'Second Term', session: '2024/2025', average: 84.8, grade: 'A', remarks: 'Very enthusiastic and cooperative.' },
    ],
  },
  {
    id: 'std-002',
    admissionNo: 'CHIA/2024/0143',
    firstName: 'Amina',
    lastName: 'Bello',
    otherName: 'Zainab',
    gender: 'Female',
    dateOfBirth: '2012-08-22',
    classLevel: 'JSS 2',
    arm: 'Diamond',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    guardianId: 'grd-002',
    guardianName: 'Hajiya Maryam Bello',
    guardianRelationship: 'Mother',
    guardianPhone: '+234 803 776 1122',
    guardianEmail: 'maryam.bello@tradehouse.com',
    attendanceRate: 94,
    termAverage: 91.2,
    positionInClass: 1,
    totalStudentsInClass: 32,
    feesStatus: 'Paid',
    balanceDue: 0,
  },
  {
    id: 'std-003',
    admissionNo: 'CHIA/2024/0150',
    firstName: 'Chinedu',
    lastName: 'Okafor',
    otherName: 'Emeka',
    gender: 'Male',
    dateOfBirth: '2012-02-10',
    classLevel: 'JSS 2',
    arm: 'Diamond',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    guardianId: 'grd-003',
    guardianName: 'Mr. Kenneth Okafor',
    guardianRelationship: 'Father',
    guardianPhone: '+234 805 119 4433',
    guardianEmail: 'k.okafor@logistics.ng',
    attendanceRate: 82,
    termAverage: 64.5,
    positionInClass: 24,
    totalStudentsInClass: 32,
    feesStatus: 'Partial',
    balanceDue: 45000,
  },
  {
    id: 'std-004',
    admissionNo: 'CHIA/2024/0165',
    firstName: 'Fatima',
    lastName: 'Abubakar',
    gender: 'Female',
    dateOfBirth: '2011-11-03',
    classLevel: 'JSS 2',
    arm: 'Diamond',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    guardianId: 'grd-004',
    guardianName: 'Engr. Ibrahim Abubakar',
    guardianRelationship: 'Father',
    guardianPhone: '+234 818 900 2211',
    guardianEmail: 'i.abubakar@energycorp.ng',
    attendanceRate: 78,
    termAverage: 59.8,
    positionInClass: 29,
    totalStudentsInClass: 32,
    feesStatus: 'Pending',
    balanceDue: 180000,
  },
  {
    id: 'std-005',
    admissionNo: 'CHIA/2024/0188',
    firstName: 'Grace',
    lastName: 'Fanimo',
    otherName: 'Eniola',
    gender: 'Female',
    dateOfBirth: '2015-09-18',
    classLevel: 'Primary 5',
    arm: 'Gold',
    status: 'Active',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    guardianId: 'grd-001',
    guardianName: 'Dr. Babatunde Fanimo',
    guardianRelationship: 'Father',
    guardianPhone: '+234 802 334 8899',
    guardianEmail: 'b.fanimo@healthconsult.ng',
    attendanceRate: 99,
    termAverage: 92.5,
    positionInClass: 1,
    totalStudentsInClass: 25,
    feesStatus: 'Paid',
    balanceDue: 0,
  },
];

// Initial Staff
const initialStaff: StaffMember[] = [
  {
    id: 'stf-001',
    staffNo: 'CHIA/STF/008',
    fullName: 'Mr. Emmanuel Adeleke',
    email: 'e.adeleke@crownheights.edu.ng',
    phone: '+234 803 445 6677',
    role: 'Teacher',
    campus: 'Main Lekki Campus',
    assignedClasses: ['JSS 1', 'JSS 2', 'JSS 3'],
    assignedSubjects: ['Mathematics', 'Basic Technology'],
    status: 'Active',
  },
  {
    id: 'stf-002',
    staffNo: 'CHIA/STF/003',
    fullName: 'Mrs. Folashade Adebayo',
    email: 'f.adebayo@crownheights.edu.ng',
    phone: '+234 802 998 1122',
    role: 'Principal',
    campus: 'Main Lekki Campus',
    assignedClasses: ['All Levels'],
    assignedSubjects: ['School Administration'],
    status: 'Active',
  },
  {
    id: 'stf-003',
    staffNo: 'CHIA/STF/015',
    fullName: 'Mr. Jude Nwachukwu',
    email: 'j.nwachukwu@crownheights.edu.ng',
    phone: '+234 814 332 8890',
    role: 'Teacher',
    campus: 'Main Lekki Campus',
    assignedClasses: ['JSS 2', 'SSS 1'],
    assignedSubjects: ['English Language', 'Literature'],
    status: 'Active',
  },
  {
    id: 'stf-004',
    staffNo: 'CHIA/STF/021',
    fullName: 'Alhaji Rasheed Sanusi',
    email: 'bursar@crownheights.edu.ng',
    phone: '+234 806 771 2233',
    role: 'Bursar',
    campus: 'Main Lekki Campus',
    assignedClasses: ['Finance'],
    assignedSubjects: ['Accounts & Invoicing'],
    status: 'Active',
  },
  {
    id: 'stf-005',
    staffNo: 'CHIA/STF/032',
    fullName: 'Miss Chidinma Eze',
    email: 'c.eze@crownheights.edu.ng',
    phone: '+234 811 002 9944',
    role: 'Teacher',
    campus: 'Main Lekki Campus',
    assignedClasses: ['Primary 5', 'JSS 1'],
    assignedSubjects: ['Basic Science', 'Agricultural Science'],
    status: 'Pending Invitation',
    temporaryPassword: 'Skuggle@Temp2026',
    invitedAt: '2026-08-25',
  },
];

// Initial Academic Structure
const initialSessions: AcademicSession[] = [
  { id: 'ses-1', name: '2025/2026', isCurrent: true, startDate: '2025-09-08', endDate: '2026-07-24' },
  { id: 'ses-2', name: '2024/2025', isCurrent: false, startDate: '2024-09-09', endDate: '2025-07-25' },
];

const initialTerms: AcademicTerm[] = [
  { id: 'trm-1', sessionId: 'ses-1', name: 'First Term', isCurrent: true, startDate: '2025-09-08', endDate: '2025-12-18' },
  { id: 'trm-2', sessionId: 'ses-1', name: 'Second Term', isCurrent: false, startDate: '2026-01-12', endDate: '2026-04-03' },
  { id: 'trm-3', sessionId: 'ses-1', name: 'Third Term', isCurrent: false, startDate: '2026-04-27', endDate: '2026-07-24' },
];

const initialClasses: ClassLevel[] = [
  { id: 'cls-1', name: 'Primary 5', category: 'Primary', arms: ['Gold', 'Silver'], subjects: ['Mathematics', 'English', 'Basic Science', 'Social Studies'] },
  { id: 'cls-2', name: 'JSS 1', category: 'Junior Secondary', arms: ['Diamond', 'Ruby', 'Emerald'], subjects: ['Mathematics', 'English', 'Basic Science', 'Basic Technology', 'Civic Education'] },
  { id: 'cls-3', name: 'JSS 2', category: 'Junior Secondary', arms: ['Diamond', 'Gold', 'Silver'], subjects: ['Mathematics', 'English', 'Basic Science', 'Basic Technology', 'Agricultural Science', 'Civic Education', 'Computer Studies'] },
  { id: 'cls-4', name: 'JSS 3', category: 'Junior Secondary', arms: ['Diamond', 'Ruby'], subjects: ['Mathematics', 'English', 'Basic Science', 'Basic Technology', 'Business Studies'] },
  { id: 'cls-5', name: 'SSS 1', category: 'Senior Secondary', arms: ['Science A', 'Arts A', 'Commercial A'], subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics'] },
];

const initialSubjects: SubjectItem[] = [
  { id: 'sbj-1', code: 'MTH', name: 'Mathematics', category: 'General', applicableLevels: ['Primary 5', 'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1'] },
  { id: 'sbj-2', code: 'ENG', name: 'English Language', category: 'General', applicableLevels: ['Primary 5', 'JSS 1', 'JSS 2', 'JSS 3', 'SSS 1'] },
  { id: 'sbj-3', code: 'BSC', name: 'Basic Science', category: 'Science', applicableLevels: ['JSS 1', 'JSS 2', 'JSS 3'] },
  { id: 'sbj-4', code: 'BTE', name: 'Basic Technology', category: 'Vocational', applicableLevels: ['JSS 1', 'JSS 2', 'JSS 3'] },
  { id: 'sbj-5', code: 'AGR', name: 'Agricultural Science', category: 'Vocational', applicableLevels: ['JSS 1', 'JSS 2', 'JSS 3'] },
  { id: 'sbj-6', code: 'CIV', name: 'Civic Education', category: 'General', applicableLevels: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1'] },
  { id: 'sbj-7', code: 'CMP', name: 'Computer Studies', category: 'Science', applicableLevels: ['JSS 1', 'JSS 2', 'JSS 3'] },
];

// Initial Assessments
const initialAssessments: AssessmentRecord[] = [
  {
    id: 'asm-001',
    title: 'First Term Continuous Assessment & Exam',
    subject: 'Mathematics',
    classLevel: 'JSS 2',
    arm: 'Diamond',
    term: 'First Term',
    session: '2025/2026',
    teacherId: 'stf-001',
    teacherName: 'Mr. Emmanuel Adeleke',
    weights: { ca1Weight: 15, ca2Weight: 15, midTermWeight: 10, terminalExamWeight: 60, total: 100 },
    status: 'Submitted',
    submittedAt: '2026-08-24 14:30',
    scores: [
      { studentId: 'std-001', ca1: 14, ca2: 13, midTerm: 9, exam: 54, total: 90, grade: 'A1', teacherRemark: 'Excellent computational clarity.' },
      { studentId: 'std-002', ca1: 15, ca2: 14, midTerm: 10, exam: 56, total: 95, grade: 'A1', teacherRemark: 'Outstanding mastery of algebraic concepts.' },
      { studentId: 'std-003', ca1: 9, ca2: 8, midTerm: 5, exam: 34, total: 56, grade: 'C5', teacherRemark: 'Shows improvement. Needs practice in factorisation.' },
      { studentId: 'std-004', ca1: 7, ca2: 8, midTerm: 4, exam: 30, total: 49, grade: 'D7', teacherRemark: 'Requires guided tutorial in quadratic basics.' },
    ],
  },
  {
    id: 'asm-002',
    title: 'First Term Continuous Assessment & Exam',
    subject: 'English Language',
    classLevel: 'JSS 2',
    arm: 'Diamond',
    term: 'First Term',
    session: '2025/2026',
    teacherId: 'stf-003',
    teacherName: 'Mr. Jude Nwachukwu',
    weights: { ca1Weight: 15, ca2Weight: 15, midTermWeight: 10, terminalExamWeight: 60, total: 100 },
    status: 'Approved',
    submittedAt: '2026-08-22 10:15',
    approvedAt: '2026-08-23 16:00',
    scores: [
      { studentId: 'std-001', ca1: 13, ca2: 14, midTerm: 9, exam: 51, total: 87, grade: 'A1', teacherRemark: 'Eloquent comprehension and essay structure.' },
      { studentId: 'std-002', ca1: 14, ca2: 13, midTerm: 9, exam: 52, total: 88, grade: 'A1', teacherRemark: 'Great vocabulary and punctuation.' },
      { studentId: 'std-003', ca1: 10, ca2: 11, midTerm: 7, exam: 42, total: 70, grade: 'B3', teacherRemark: 'Good effort in oral comprehension.' },
      { studentId: 'std-004', ca1: 9, ca2: 9, midTerm: 6, exam: 38, total: 62, grade: 'C4', teacherRemark: 'Focus on grammatical concord.' },
    ],
  },
];

// Initial Invoices & Fees
const initialInvoices: FeeInvoice[] = [
  {
    id: 'inv-001',
    invoiceNo: 'INV/2025/T1/0142',
    studentId: 'std-001',
    studentName: 'David Fanimo',
    admissionNo: 'CHIA/2024/0142',
    classLevel: 'JSS 2',
    term: 'First Term',
    session: '2025/2026',
    totalAmount: 220000,
    paidAmount: 220000,
    balance: 0,
    status: 'Paid',
    dueDate: '2025-09-30',
    items: [
      { name: 'Tuition & Development Fee', amount: 150000 },
      { name: 'STEM & Robotics Lab Levy', amount: 35000 },
      { name: 'E-Learning & Skuggle Portal', amount: 15000 },
      { name: 'First Aid & Medical Insurance', amount: 20000 },
    ],
    receipts: [
      {
        receiptNo: 'REC-2025-0914',
        amountPaid: 220000,
        paymentMethod: 'Bank Transfer',
        date: '2025-09-14',
        reference: 'TRX-CHIA-9921445',
      },
    ],
  },
  {
    id: 'inv-002',
    invoiceNo: 'INV/2025/T1/0150',
    studentId: 'std-003',
    studentName: 'Chinedu Okafor',
    admissionNo: 'CHIA/2024/0150',
    classLevel: 'JSS 2',
    term: 'First Term',
    session: '2025/2026',
    totalAmount: 220000,
    paidAmount: 175000,
    balance: 45000,
    status: 'Partial',
    dueDate: '2025-09-30',
    items: [
      { name: 'Tuition & Development Fee', amount: 150000 },
      { name: 'STEM & Robotics Lab Levy', amount: 35000 },
      { name: 'E-Learning & Skuggle Portal', amount: 15000 },
      { name: 'First Aid & Medical Insurance', amount: 20000 },
    ],
    receipts: [
      {
        receiptNo: 'REC-2025-0922',
        amountPaid: 175000,
        paymentMethod: 'Card',
        date: '2025-09-22',
        reference: 'PAY-CHIA-7712390',
      },
    ],
  },
];

// Initial Result PINs
const initialPINs: ResultPINRecord[] = [
  { id: 'pin-001', pin: 'SKG-9482-1102-7741', serialNo: 'SRN-2025-001', batchId: 'BATCH-2025-T1', assignedAdmissionNo: 'CHIA/2024/0142', term: 'First Term', session: '2025/2026', usageCount: 2, maxUsage: 5, isUsed: true, generatedDate: '2026-08-20' },
  { id: 'pin-002', pin: 'SKG-8812-4491-3320', serialNo: 'SRN-2025-002', batchId: 'BATCH-2025-T1', assignedAdmissionNo: 'CHIA/2024/0143', term: 'First Term', session: '2025/2026', usageCount: 1, maxUsage: 5, isUsed: true, generatedDate: '2026-08-20' },
  { id: 'pin-003', pin: 'SKG-1194-5502-8831', serialNo: 'SRN-2025-003', batchId: 'BATCH-2025-T1', term: 'First Term', session: '2025/2026', usageCount: 0, maxUsage: 5, isUsed: false, generatedDate: '2026-08-20' },
  { id: 'pin-004', pin: 'SKG-3390-7712-4465', serialNo: 'SRN-2025-004', batchId: 'BATCH-2025-T1', term: 'First Term', session: '2025/2026', usageCount: 0, maxUsage: 5, isUsed: false, generatedDate: '2026-08-20' },
];

// Initial Launch Checklist
const initialLaunchChecklist: LaunchChecklistItem[] = [
  { id: 'chk-1', title: 'Confirm School Identity & Branding', description: 'Upload crest, choose brand primary colour, verify contrast & preview welcome.', category: 'institution', isCompleted: true, actionUrl: '/app/branding', requiredForLaunch: true },
  { id: 'chk-2', title: 'Set Active Academic Session & Terms', description: 'Define 2025/2026 session with First, Second, and Third terms.', category: 'academics', isCompleted: true, actionUrl: '/app/academics', requiredForLaunch: true },
  { id: 'chk-3', title: 'Configure Classes, Arms & Subjects', description: 'Setup JSS 1-3, SSS 1-3, and assign curriculum subjects.', category: 'academics', isCompleted: true, actionUrl: '/app/academics', requiredForLaunch: true },
  { id: 'chk-4', title: 'Onboard Teaching & Administrative Staff', description: 'Invite teachers, assign classes & subjects with least-privilege roles.', category: 'people', isCompleted: true, actionUrl: '/app/people', requiredForLaunch: true },
  { id: 'chk-5', title: 'Import Student Register & Guardian Links', description: 'Add students via 1-by-1 capture or validated bulk CSV upload.', category: 'people', isCompleted: true, actionUrl: '/app/students', requiredForLaunch: true },
  { id: 'chk-6', title: 'Preview Branded Experiences & Launch', description: 'Test role dashboards and publish official tenant portal to community.', category: 'preview', isCompleted: false, actionUrl: '/welcome', requiredForLaunch: true },
];

// Initial Fee Transactions
const initialFeeTransactions: FeeTransaction[] = [
  {
    id: 'tx-001',
    studentId: 'std-001',
    studentName: 'David Fanimo',
    admissionNo: 'CHIA/2024/0142',
    amount: 220000,
    currency: 'NGN',
    title: 'First Term Tuition & STEM Levy',
    status: 'paid',
    paymentMethod: 'Bank Transfer (Zenith Bank)',
    receiptNumber: 'REC-2025-0914',
    date: '2025-09-14',
  },
  {
    id: 'tx-002',
    studentId: 'std-003',
    studentName: 'Chinedu Okafor',
    admissionNo: 'CHIA/2024/0150',
    amount: 175000,
    currency: 'NGN',
    title: 'First Term Tuition (Part Payment)',
    status: 'paid',
    paymentMethod: 'Paystack Card Online',
    receiptNumber: 'REC-2025-0922',
    date: '2025-09-22',
  },
  {
    id: 'tx-003',
    studentId: 'std-005',
    studentName: 'Grace Fanimo',
    admissionNo: 'CHIA/2024/0188',
    amount: 180000,
    currency: 'NGN',
    title: 'First Term Primary 5 Tuition',
    status: 'paid',
    paymentMethod: 'Bank Transfer',
    receiptNumber: 'REC-2025-0918',
    date: '2025-09-18',
  },
];

// Initial Teacher Profile
const initialTeacherProfile: TeacherProfileData = {
  fullName: 'Oluwatosin Fanimo',
  email: 'analytictosin@gmail.com',
  phone: '+234 802 888 7766',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  subjectsTaught: ['Mathematics', 'Further Mathematics', 'Basic Science & Tech'],
  classesTaught: ['JSS 2 Diamond', 'JSS 3 Gold', 'SSS 1 Emerald'],
  curriculumUsed: 'NERDC (Nigerian National Curriculum)',
  yearsOfExperience: 8,
  qualifications: 'B.Sc (Ed) Mathematics, TRCN Certified Educator',
  location: 'Lekki / Victoria Island, Lagos State',
  teachingPreferences: ['Project-Based STEM Learning', 'Formative Exit Checks', 'Visual Geometry'],
  schoolAffiliations: ['Crown Heights International Academy', 'Apex STEM Tutorial Hub'],
};

// Initial Linked Children for Parents (Supports multi-school linking)
const initialLinkedChildren: ChildLinkData[] = [
  {
    childId: 'std-001',
    childName: 'David Fanimo',
    admissionNo: 'CHIA/2024/0142',
    schoolName: 'Crown Heights Int’l Academy',
    schoolCode: 'CHIA-LAGOS',
    classLevel: 'JSS 2',
    arm: 'Diamond',
    linkCode: 'CHIA-LNK-8821',
    linkedDate: '2025-09-01',
    status: 'Verified',
  },
  {
    childId: 'std-005',
    childName: 'Grace Fanimo',
    admissionNo: 'CHIA/2024/0188',
    schoolName: 'Crown Heights Int’l Academy',
    schoolCode: 'CHIA-LAGOS',
    classLevel: 'Primary 5',
    arm: 'Emerald',
    linkCode: 'CHIA-LNK-9943',
    linkedDate: '2025-09-01',
    status: 'Verified',
  },
];

// Initial Invitations
const initialInvitations: InvitationRecord[] = [
  {
    id: 'inv-001',
    schoolId: 'sch-001',
    schoolName: 'Crown Heights Int’l Academy',
    recipientName: 'Mr. Kelechi Nwosu',
    recipientEmail: 'k.nwosu@crownheights.edu.ng',
    recipientPhone: '+234 803 445 6677',
    targetRole: 'Teacher',
    token: 'INV-TCH-77492',
    inviteLink: 'https://skuggle.app/join/chia-lagos?t=INV-TCH-77492',
    expiresAt: '2026-09-10',
    isUsed: false,
    isRevoked: false,
    createdAt: '2026-08-25',
  },
  {
    id: 'inv-002',
    schoolId: 'sch-001',
    schoolName: 'Crown Heights Int’l Academy',
    recipientName: 'Mrs. Funke Balogun (PTA Secretary)',
    recipientEmail: 'f.balogun@gmail.com',
    recipientPhone: '+234 802 119 4433',
    targetRole: 'Parent',
    token: 'INV-PAR-33108',
    inviteLink: 'https://skuggle.app/join/chia-lagos?t=INV-PAR-33108',
    expiresAt: '2026-09-12',
    isUsed: false,
    isRevoked: false,
    createdAt: '2026-08-25',
  },
];

// Initial Printable Login Cards (Contains username + temp pass + QR code)
const initialPrintableCards: PrintableCredentialCard[] = [
  {
    id: 'crd-001',
    schoolId: 'sch-001',
    schoolName: 'Crown Heights Int’l Academy',
    fullName: 'David Fanimo',
    role: 'Student',
    identifier: 'CHIA/2024/0142',
    temporaryPassword: 'PASS-DAVID-88',
    classOrDepartment: 'JSS 2 Diamond',
    qrCodeValue: 'skuggle://auth?u=CHIA/2024/0142&s=CHIA-LAGOS',
    mustChangePasswordOnLogin: true,
    generatedDate: '2026-08-25',
  },
  {
    id: 'crd-002',
    schoolId: 'sch-001',
    schoolName: 'Crown Heights Int’l Academy',
    fullName: 'Grace Fanimo',
    role: 'Student',
    identifier: 'CHIA/2024/0188',
    temporaryPassword: 'PASS-GRACE-52',
    classOrDepartment: 'Primary 5 Emerald',
    qrCodeValue: 'skuggle://auth?u=CHIA/2024/0188&s=CHIA-LAGOS',
    mustChangePasswordOnLogin: true,
    generatedDate: '2026-08-25',
  },
  {
    id: 'crd-003',
    schoolId: 'sch-001',
    schoolName: 'Crown Heights Int’l Academy',
    fullName: 'Amina Bello',
    role: 'Student',
    identifier: 'CHIA/2024/0164',
    temporaryPassword: 'PASS-AMINA-31',
    classOrDepartment: 'JSS 3 Gold',
    qrCodeValue: 'skuggle://auth?u=CHIA/2024/0164&s=CHIA-LAGOS',
    mustChangePasswordOnLogin: true,
    generatedDate: '2026-08-25',
  },
];

// Initial 10-Step Guided School Setup Roadmap
export const initialGuidedSetup = [
  { step: 1, title: 'Create campus & branch details', isDone: true, category: 'campus' },
  { step: 2, title: 'Configure academic session & current term', isDone: true, category: 'academics' },
  { step: 3, title: 'Add school levels (Nursery, Primary, JSS, SSS)', isDone: true, category: 'academics' },
  { step: 4, title: 'Create classes & arms (e.g. Diamond, Gold)', isDone: true, category: 'academics' },
  { step: 5, title: 'Configure curriculum subjects', isDone: true, category: 'academics' },
  { step: 6, title: 'Set assessment & grading structure (CA1, CA2, Exam)', isDone: true, category: 'academics' },
  { step: 7, title: 'Import or register student roster', isDone: true, category: 'people' },
  { step: 8, title: 'Add teaching & administrative staff', isDone: true, category: 'people' },
  { step: 9, title: 'Invite parents & students with secure codes', isDone: false, category: 'people' },
  { step: 10, title: 'Preview & launch school workspace', isDone: false, category: 'preview' },
];

interface AppContextType {
  currentUser: CurrentUser;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser>>;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  branding: TenantBranding;
  updateBranding: (updates: Partial<TenantBranding>) => void;
  currentWorkspace: WorkspaceItem;
  switchWorkspace: (workspaceId: string) => void;
  switchSpaceCategory: (category: 'school' | 'personal') => void;
  loginAsPreset: (spaceType: 'school' | 'personal', role: UserRole) => void;
  students: StudentRecord[];
  addStudent: (student: StudentRecord) => void;
  updateStudent: (id: string, updates: Partial<StudentRecord>) => void;
  staff: StaffMember[];
  addStaff: (member: StaffMember) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  inviteStaff: (data: {
    fullName: string;
    email: string;
    phone: string;
    role: UserRole | string;
    subjects?: string[];
    assignedClasses?: string[];
  }) => void;
  sessions: AcademicSession[];
  terms: AcademicTerm[];
  classes: ClassLevel[];
  subjects: SubjectItem[];
  assessments: AssessmentRecord[];
  cbtQuizzes: CBTQuiz[];
  setCbtQuizzes: React.Dispatch<React.SetStateAction<CBTQuiz[]>>;
  addAssessment: (assessment: AssessmentRecord) => void;
  updateAssessment: (id: string, updates: Partial<AssessmentRecord>) => void;
  updateAssessmentScore: (assessmentId: string, scoreIdOrStudentId: string, updates: Partial<StudentScoreEntry>) => void;
  lockAssessment: (assessmentId: string, isLocked: boolean) => void;
  invoices: FeeInvoice[];
  recordPayment: (invoiceId: string, amount: number, method: 'Bank Transfer' | 'Card' | 'Cash' | 'POS') => void;
  feeTransactions: FeeTransaction[];
  addFeeTransaction: (tx: Omit<FeeTransaction, 'id' | 'receiptNumber' | 'date'> & { id?: string; receiptNumber?: string; date?: string }) => void;
  resultPINs: ResultPINRecord[];
  generatePINBatch: (count: number, term: string, session: string) => void;
  generatePINs: (count: number, term: string, session: string) => void;
  launchChecklist: LaunchChecklistItem[];
  checklistItems: (LaunchChecklistItem & { stepNumber: number; status: 'completed' | 'pending'; required: boolean })[];
  toggleChecklistStep: (stepId: string) => void;
  toggleChecklistItem: (stepId: string) => void;
  recordAttendance: (studentId: string, date: string, status: AttendanceStatus, reason?: string) => void;
  offlineQueue: OfflineQueueItem[];
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  syncOfflineQueue: () => void;
  activeChildId: string;
  setActiveChildId: (id: string) => void;
  showToast: (title: string, description?: string, type?: 'success' | 'warning' | 'error' | 'failed' | 'info') => void;
  hideToast: () => void;
  toast: { title: string; description?: string; type: 'success' | 'warning' | 'error' | 'failed' | 'info'; show: boolean } | null;
  lessonPlans: TeacherLessonPlan[];
  saveLessonPlan: (plan: TeacherLessonPlan) => void;
  
  // New features for 5 key specifications:
  teacherProfile: TeacherProfileData;
  updateTeacherProfile: (profile: Partial<TeacherProfileData>) => void;
  linkedChildren: ChildLinkData[];
  linkChildWithCode: (code: string) => { success: boolean; message: string };
  invitations: InvitationRecord[];
  createInvitationLink: (recipientName: string, role: UserRole, email?: string, phone?: string) => InvitationRecord;
  revokeInvitation: (id: string) => void;
  printableCards: PrintableCredentialCard[];
  generatePrintableCard: (fullName: string, role: UserRole, identifier: string, classOrDept: string) => PrintableCredentialCard;
  subscriptionPlans: SubscriptionPlan[];
  activeSchoolPlan: SubscriptionPlanType;
  activePersonalPlan: SubscriptionPlanType;
  upgradePlan: (planId: SubscriptionPlanType) => void;
  guidedSetupSteps: typeof initialGuidedSetup;
  toggleGuidedSetupStep: (stepNum: number) => void;
  registerPersonalAccount: (params: {
    persona: 'teacher' | 'student' | 'parent';
    fullName: string;
    email: string;
    phone: string;
    password: string;
    birthDate?: string;
    guardianName?: string;
    guardianEmail?: string;
    actionIntent?: 'personal_space' | 'join_school' | 'both';
    schoolInviteCode?: string;
  }) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const tenantScope = (workspace: WorkspaceItem) =>
  workspace.type === 'school' ? `school:${workspace.schoolCode ?? workspace.id}` : `personal:${workspace.id}`;
const tenantStorageKey = (workspace: WorkspaceItem, resource: string) =>
  `skuggle:${tenantScope(workspace)}:${resource}`;
const readStored = <T,>(key: string, fallback: T): T => {
  if (!demoMode) return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<TenantBranding>(() => {
    if (!demoMode) return platformBranding;
    const saved = localStorage.getItem('skuggle_branding');
    return saved ? JSON.parse(saved) : defaultBranding;
  });

  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceItem>(() => {
    if (!demoMode) return { id: '', name: 'Skuggle', type: 'personal', role: 'Student' };
    const saved = localStorage.getItem('skuggle_active_workspace');
    return saved ? JSON.parse(saved) : initialWorkspaces[0];
  });

  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    id: demoMode ? 'usr-001' : '',
    fullName: demoMode ? 'Oluwatosin Fanimo' : '',
    email: demoMode ? 'analytictosin@gmail.com' : '',
    phone: demoMode ? '+234 802 888 7766' : '',
    verified: Boolean(demoMode),
    avatarUrl: demoMode ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : '',
    currentWorkspace: demoMode ? initialWorkspaces[0] : { id: '', name: 'Skuggle', type: 'personal', role: 'Student' },
    availableWorkspaces: demoMode ? initialWorkspaces : [],
    teachingGrowthStreak: demoMode ? 14 : 0,
    timeSavedMinutes: demoMode ? 380 : 0,
  });

  const [students, setStudents] = useState<StudentRecord[]>(() => {
    return readStored(tenantStorageKey(currentWorkspace, 'students'), demoMode ? initialStudents : []);
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    return readStored(tenantStorageKey(currentWorkspace, 'staff'), demoMode ? initialStaff : []);
  });

  const [sessions, setSessions] = useState<AcademicSession[]>(demoMode ? initialSessions : []);
  const [terms, setTerms] = useState<AcademicTerm[]>(demoMode ? initialTerms : []);
  const [classes, setClasses] = useState<ClassLevel[]>(demoMode ? initialClasses : []);
  const [subjects, setSubjects] = useState<SubjectItem[]>(demoMode ? initialSubjects : []);

  const [assessments, setAssessments] = useState<AssessmentRecord[]>(() => {
    return readStored(tenantStorageKey(currentWorkspace, 'assessments'), demoMode ? initialAssessments : []);
  });
  const [cbtQuizzes, setCbtQuizzes] = useState<CBTQuiz[]>([]);

  const [invoices, setInvoices] = useState<FeeInvoice[]>(() => {
    return readStored(tenantStorageKey(currentWorkspace, 'invoices'), demoMode ? initialInvoices : []);
  });

  const [feeTransactions, setFeeTransactions] = useState<FeeTransaction[]>(() => {
    return readStored(tenantStorageKey(currentWorkspace, 'fee-transactions'), demoMode ? initialFeeTransactions : []);
  });

  const [resultPINs, setResultPINs] = useState<ResultPINRecord[]>(() => {
    return readStored(tenantStorageKey(currentWorkspace, 'pins'), demoMode ? initialPINs : []);
  });

  const [launchChecklist, setLaunchChecklist] = useState<LaunchChecklistItem[]>(() => {
    const saved = demoMode ? localStorage.getItem('skuggle_launch_checklist') : null;
    return saved ? JSON.parse(saved) : initialLaunchChecklist;
  });

  const [lessonPlans, setLessonPlans] = useState<TeacherLessonPlan[]>(() => {
    const saved = demoMode ? localStorage.getItem('skuggle_lesson_plans') : null;
    return saved ? JSON.parse(saved) : [
      {
        id: 'lp-01',
        title: 'Linear & Quadratic Algebraic Equations',
        subject: 'Mathematics',
        topic: 'Algebraic Expressions & Factorisation',
        level: 'JSS 2',
        duration: '40 Minutes',
        curriculum: 'NERDC Standard Curriculum',
        theme: 'Algebraic Processes',
        behavioralObjectives: [
          'Define algebraic expression terms and coefficients accurately.',
          'Identify common factors and simplify 2-variable expressions.',
          'Solve basic linear word equations with practical trade examples.',
        ],
        instructionalMaterials: ['Whiteboard & Markers', 'Skuggle Graph Worksheet', 'Algebra tiles / physical tokens'],
        previousKnowledge: 'Learners are familiar with basic arithmetic operations and unknown variables x and y.',
        introduction: 'Warm-up game: "Guess the hidden number in the market bag" to illustrate unknown variables (5 mins).',
        activities: [
          { step: 'Step 1: Terminology & Rules (10 mins)', teacherActivity: 'Explains coefficients, variables, and like terms with real-world examples.', learnerActivity: 'Identify terms and match like variables in notebooks.' },
          { step: 'Step 2: Group Problem Solving (15 mins)', teacherActivity: 'Demonstrates factorisation on board and facilitates peer discussions.', learnerActivity: 'Work in pairs on 4 worksheet problems and compare answers.' },
          { step: 'Step 3: Quick Formative Check (10 mins)', teacherActivity: 'Administers 3-item exit ticket check.', learnerActivity: 'Submit individual solutions.' },
        ],
        evaluation: ['1. Simplify: 4x + 7y - 2x + 3y', '2. Factorise: 6ab + 9ac', '3. Solve: 3x - 5 = 16'],
        homework: 'Complete Exercises 4.2 in New General Mathematics JSS2, questions 1-8.',
        provenance: 'Generated with Skuggle AI Teaching Assistant & verified for Nigerian NERDC syllabus.',
        isAIGenerated: true,
        isReviewed: true,
        isPublished: true,
        createdAt: '2026-08-25',
      },
    ];
  });

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfileData>(() => {
    const saved = demoMode ? localStorage.getItem('skuggle_teacher_profile') : null;
    return saved ? JSON.parse(saved) : initialTeacherProfile;
  });

  const [linkedChildren, setLinkedChildren] = useState<ChildLinkData[]>(() => {
    const saved = demoMode ? localStorage.getItem('skuggle_linked_children') : null;
    return saved ? JSON.parse(saved) : initialLinkedChildren;
  });

  const [invitations, setInvitations] = useState<InvitationRecord[]>(() => {
    const saved = demoMode ? localStorage.getItem('skuggle_invitations') : null;
    return saved ? JSON.parse(saved) : initialInvitations;
  });

  const [printableCards, setPrintableCards] = useState<PrintableCredentialCard[]>(() => {
    const saved = demoMode ? localStorage.getItem('skuggle_printable_cards') : null;
    return saved ? JSON.parse(saved) : initialPrintableCards;
  });

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(demoMode ? initialSubscriptionPlans : []);
  const [activeSchoolPlan, setActiveSchoolPlan] = useState<SubscriptionPlanType>('school_core');
  const [activePersonalPlan, setActivePersonalPlan] = useState<SubscriptionPlanType>('personal_pro');

  const [guidedSetupSteps, setGuidedSetupSteps] = useState(initialGuidedSetup);

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    const loadStudents = async () => {
      try {
        const response = await apiRequest<{
          success: true;
          data: { data: Array<Record<string, unknown>> };
        }>('/students?perPage=100', { suppressErrorNotification: true });
        if (!active) return;
        setStudents(response.data.data.map((row) => {
          const guardians = Array.isArray(row.guardians) ? row.guardians as Array<Record<string, unknown>> : [];
          const guardian = guardians[0] || {};
          const rawStatus = String(row.status || 'active');
          const rawGender = String(row.gender || 'male');
          const rawFees = String(row.feesStatus || 'Pending');
          return {
            id: String(row.id),
            admissionNo: String(row.admissionNumber || ''),
            firstName: String(row.firstName || ''),
            lastName: String(row.lastName || ''),
            gender: rawGender.toLowerCase() === 'female' ? 'Female' : 'Male',
            dateOfBirth: String(row.dateOfBirth || ''),
            classLevel: String(row.className || ''),
            arm: String(row.classArm || '').replace(String(row.className || ''), '').trim(),
            status: ({ active: 'Active', suspended: 'Suspended', graduated: 'Graduated', transferred: 'Transferred' } as const)[rawStatus.toLowerCase() as 'active'] || 'Active',
            photoUrl: String(row.photoUrl || ''),
            guardianId: String(guardian.id || ''),
            guardianName: String(guardian.name || ''),
            guardianRelationship: ['Father', 'Mother'].includes(String(guardian.relationship)) ? guardian.relationship as 'Father' | 'Mother' : 'Guardian',
            guardianPhone: String(guardian.phone || ''),
            guardianEmail: String(guardian.email || ''),
            attendanceRate: Number(row.attendanceRate || 0),
            termAverage: Number(row.currentAverage || 0),
            feesStatus: rawFees === 'Paid' || rawFees === 'Partial' ? rawFees : 'Pending',
            balanceDue: Number(row.outstandingFees || 0),
          };
        }));
      } catch {
        if (active) setStudents([]);
      }
    };

    window.addEventListener('skuggle:authenticated', loadStudents);
    window.addEventListener('skuggle:workspace-changed', loadStudents);
    return () => {
      active = false;
      window.removeEventListener('skuggle:authenticated', loadStudents);
      window.removeEventListener('skuggle:workspace-changed', loadStudents);
    };
  }, []);

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    const list = async (path: string) => {
      const response = await apiRequest<{ success: true; data: { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>> }>(path, { suppressErrorNotification: true });
      const payload = response.data;
      return Array.isArray(payload) ? payload : (payload.data ?? []);
    };
    const hydrate = async () => {
      const [sessionRows, classRows, subjectRows, staffRows, assessmentRows, paymentRows, inviteRows, onboarding, planRows, lessonRows, me] = await Promise.allSettled([
        list('/academic-sessions?perPage=100'), list('/classes?perPage=100'), list('/subjects?perPage=100'), list('/employees?perPage=100'),
        list('/assessments?perPage=100'), list('/payments?perPage=100'), list('/invites'),
        apiRequest<{ success: true; data: Record<string, unknown> }>('/onboarding', { suppressErrorNotification: true }), list('/plans'), list('/lesson-plans'),
        apiRequest<{ success: true; data: { user: Record<string, unknown> } }>('/auth/me', { suppressErrorNotification: true }),
      ]);
      if (!active) return;
      if (sessionRows.status === 'fulfilled') {
        setSessions(sessionRows.value.map((row) => ({ id: String(row.id), name: String(row.name), isCurrent: Boolean(row.isCurrent), startDate: String(row.startsAt ?? ''), endDate: String(row.endsAt ?? '') })));
        setTerms(sessionRows.value.flatMap((row) => (Array.isArray(row.terms) ? row.terms : []).map((term: Record<string, unknown>) => ({ id: String(term.id), sessionId: String(row.id), name: String(term.name), isCurrent: Boolean(term.isCurrent), startDate: String(term.startsAt ?? ''), endDate: String(term.endsAt ?? '') }))));
      }
      if (classRows.status === 'fulfilled') setClasses(classRows.value.map((row) => ({ id: String(row.id), name: String(row.name), category: (String(row.educationalLevel || 'Junior Secondary') as ClassLevel['category']), arms: row.arm ? [String(row.arm)] : [], subjects: [] })));
      if (subjectRows.status === 'fulfilled') setSubjects(subjectRows.value.map((row) => ({ id: String(row.id), code: String(row.code), name: String(row.name), category: 'General', applicableLevels: [] })));
      if (staffRows.status === 'fulfilled') setStaff(staffRows.value.map((row) => ({ id: String(row.id), staffNo: String(row.employeeNumber), fullName: String(row.name), email: String(row.email ?? ''), phone: String(row.phone ?? ''), role: 'Teacher', campus: String((row.department as Record<string, unknown> | null)?.name ?? ''), assignedClasses: [], assignedSubjects: [], status: String(row.status).toLowerCase() === 'active' ? 'Active' : 'Suspended' })));
      if (assessmentRows.status === 'fulfilled') setAssessments(assessmentRows.value.map((row) => ({ id: String(row.id), title: String(row.title), subject: String(row.subject ?? ''), classLevel: String(row.className ?? ''), arm: '', term: '', session: '', teacherId: '', teacherName: '', weights: { ca1Weight: 0, ca2Weight: 0, midTermWeight: 0, terminalExamWeight: Number(row.maxScore ?? 100), total: Number(row.maxScore ?? 100) }, scores: [], status: ({ draft: 'Draft', submitted: 'Submitted', validated: 'Validated', approved: 'Approved', published: 'Published' } as Record<string, AssessmentRecord['status']>)[String(row.status)] ?? 'Draft' })));
      if (paymentRows.status === 'fulfilled') setFeeTransactions(paymentRows.value.map((row) => ({ id: String(row.id), studentId: String((row.metadata as Record<string, unknown> | null)?.studentId ?? ''), studentName: String((row.metadata as Record<string, unknown> | null)?.studentName ?? 'Account payment'), admissionNo: String((row.metadata as Record<string, unknown> | null)?.admissionNo ?? ''), amount: Number(row.amountMinor ?? 0) / 100, currency: String(row.currency ?? 'NGN'), title: String((row.metadata as Record<string, unknown> | null)?.title ?? 'School fee payment'), status: String(row.status) === 'succeeded' ? 'paid' : 'pending', paymentMethod: String(row.provider ?? 'Card'), receiptNumber: String(row.providerReference ?? ''), date: String(row.paidAt ?? row.createdAt ?? '').slice(0, 10) })));
      if (inviteRows.status === 'fulfilled') setInvitations(inviteRows.value.map((row) => ({ id: String(row.id), schoolId: branding.schoolId, schoolName: branding.schoolName, recipientName: String(row.name ?? row.email ?? ''), recipientEmail: String(row.email ?? ''), targetRole: String(row.roleLabel ?? row.role ?? 'Teacher') as UserRole, token: String(row.tokenHint ?? ''), inviteLink: '', expiresAt: String(row.expiresAt ?? ''), isUsed: String(row.status) === 'accepted', isRevoked: String(row.status) === 'revoked', createdAt: String(row.createdAt ?? '') })));
      if (onboarding.status === 'fulfilled') {
        const data = onboarding.value.data;
        const rows = Array.isArray(data.steps) ? data.steps as Array<Record<string, unknown>> : [];
        setLaunchChecklist(rows.map((row) => ({ id: String(row.id), title: String(row.title), description: String(row.blocker ?? ''), category: 'institution', isCompleted: row.status === 'complete', actionUrl: String(row.id), requiredForLaunch: ['campuses', 'academic_session', 'classes', 'subjects', 'import_students'].includes(String(row.id)) })));
      }
      if (planRows.status === 'fulfilled') setSubscriptionPlans(planRows.value.map((row) => { const limits = (row.limits ?? {}) as Record<string, unknown>; return { id: String(row.code) as SubscriptionPlanType, category: String(row.code).includes('personal') ? 'personal' : 'school', name: String(row.name), tagline: 'Secure, scalable Skuggle plan', priceNGN: Number(row.priceMinor ?? 0) / 100, billingPeriod: String(row.billingInterval) === 'yearly' ? 'yearly' : Number(row.priceMinor ?? 0) === 0 ? 'free' : 'monthly', features: Array.isArray(row.features) ? row.features.map((feature) => ({ name: String(feature), included: true })) : [], studentLimit: Number(limits.students ?? 0) || undefined, staffLimit: Number(limits.users ?? 0) || undefined, highlight: false } as SubscriptionPlan; }));
      if (lessonRows.status === 'fulfilled') setLessonPlans(lessonRows.value.map((row) => ({ ...((row.content ?? {}) as TeacherLessonPlan), id: String(row.id), title: String(row.title), createdAt: String(row.createdAt ?? '').slice(0, 10) })));
      if (me.status === 'fulfilled') {
        const user = me.value.data.user;
        const tenant = user.tenant as Record<string, unknown>;
        const memberships = Array.isArray(user.memberships) ? user.memberships as Array<Record<string, unknown>> : [];
        const availableWorkspaces: WorkspaceItem[] = memberships.map((membership) => ({ id: String(membership.tenantId), name: String(membership.tenantName), type: String(membership.tenantType) === 'individual' ? 'personal' : 'school', role: backendRole(membership.role), logoUrl: String(membership.logoUrl ?? ''), schoolCode: String(membership.tenantCode ?? '') }));
        const activeWorkspace = availableWorkspaces.find((workspace) => workspace.id === String(tenant.id)) ?? availableWorkspaces[0];
        setCurrentUser((current) => ({ ...current, id: String(user.id), fullName: String(user.name), email: String(user.email), verified: Boolean(user.emailVerified), avatarUrl: String(user.avatarUrl ?? ''), availableWorkspaces, currentWorkspace: activeWorkspace ?? current.currentWorkspace }));
        if (activeWorkspace) setCurrentWorkspace(activeWorkspace);
        setBranding((current) => ({ ...current, schoolId: String(tenant.id), schoolName: String(tenant.name), schoolCode: String(tenant.code), logoUrl: String(tenant.logoUrl ?? current.logoUrl) }));
      }
    };
    window.addEventListener('skuggle:authenticated', hydrate);
    window.addEventListener('skuggle:workspace-changed', hydrate);
    return () => { active = false; window.removeEventListener('skuggle:authenticated', hydrate); window.removeEventListener('skuggle:workspace-changed', hydrate); };
  }, []);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('skuggle_teacher_profile', JSON.stringify(teacherProfile));
  }, [teacherProfile]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('skuggle_linked_children', JSON.stringify(linkedChildren));
  }, [linkedChildren]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('skuggle_invitations', JSON.stringify(invitations));
  }, [invitations]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('skuggle_printable_cards', JSON.stringify(printableCards));
  }, [printableCards]);

  const updateTeacherProfile = (profile: Partial<TeacherProfileData>) => {
    setTeacherProfile((prev) => ({ ...prev, ...profile }));
    showToast('Profile updated', 'Your professional teaching credentials have been saved.');
  };

  const linkChildWithCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a valid school linking code.' };
    }

    // Check if already linked
    if (linkedChildren.some((c) => c.linkCode === cleanCode)) {
      return { success: false, message: 'This child profile is already linked to your family space.' };
    }

    // Match code pattern or generate verified link
    const newChild: ChildLinkData = {
      childId: `std-${Date.now().toString().slice(-4)}`,
      childName: cleanCode.includes('DAVID')
        ? 'David Fanimo'
        : cleanCode.includes('GRACE')
        ? 'Grace Fanimo'
        : cleanCode.includes('AMINA')
        ? 'Amina Bello'
        : 'Emmanuel Adeleke Jr.',
      admissionNo: `CHIA/2024/${Math.floor(1000 + Math.random() * 9000)}`,
      schoolName: 'Crown Heights Int’l Academy',
      schoolCode: 'CHIA-LAGOS',
      classLevel: 'JSS 1',
      arm: 'Gold',
      linkCode: cleanCode,
      linkedDate: new Date().toISOString().split('T')[0],
      status: 'Verified',
    };

    setLinkedChildren((prev) => [...prev, newChild]);
    showToast('Child connected', `Successfully linked ${newChild.childName} (${newChild.schoolName}).`);
    return { success: true, message: `Successfully verified link for ${newChild.childName}.` };
  };

  const createInvitationLink = (
    recipientName: string,
    role: UserRole,
    email?: string,
    phone?: string
  ): InvitationRecord => {
    const token = `INV-${role.slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newInvite: InvitationRecord = {
      id: `inv-${Date.now().toString().slice(-5)}`,
      schoolId: branding.schoolId,
      schoolName: branding.schoolName,
      recipientName,
      recipientEmail: email,
      recipientPhone: phone,
      targetRole: role,
      token,
      inviteLink: `https://skuggle.app/join/${branding.portalSlug || branding.schoolCode.toLowerCase()}?t=${token}`,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isUsed: false,
      isRevoked: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setInvitations((prev) => [newInvite, ...prev]);
    if (demoMode) showToast('Invitation Link Generated', `Secure single-use link created for ${recipientName} (${role}).`);
    else if (!email) showToast('Email required', 'Enter an email address so the secure invitation can be delivered.', 'warning');
    else void apiMutation<{ success: true; data: { invite: Record<string, unknown>; registrationLink: string; token: string } }>('/invites', 'POST', { name: recipientName, email, role: String(role).toLowerCase().replace(/ /g, '_'), expiresInDays: 14 })
      .then((response) => { setInvitations((items) => items.map((item) => item.id === newInvite.id ? { ...item, id: String(response.data.invite.id), token: response.data.token, inviteLink: response.data.registrationLink } : item)); showToast('Invitation sent', `A secure invitation was emailed to ${email}.`); })
      .catch((error) => { setInvitations((items) => items.filter((item) => item.id !== newInvite.id)); showToast('Invitation failed', describeApiError(error), 'failed'); });
    return newInvite;
  };

  const revokeInvitation = (id: string) => {
    const previous = invitations;
    setInvitations((prev) => prev.map((inv) => (inv.id === id ? { ...inv, isRevoked: true } : inv)));
    if (demoMode) { showToast('Invitation Revoked', 'The invitation link has been invalidated.'); return; }
    void apiMutation(`/invites/${encodeURIComponent(id)}`, 'DELETE').then(() => showToast('Invitation revoked', 'The database invitation and link were invalidated.')).catch((error) => { setInvitations(previous); showToast('Revoke failed', describeApiError(error), 'failed'); });
  };

  const generatePrintableCard = (
    fullName: string,
    role: UserRole,
    identifier: string,
    classOrDept: string
  ): PrintableCredentialCard => {
    const tempPass = `PASS-${fullName.split(' ')[0].toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`;
    const newCard: PrintableCredentialCard = {
      id: `crd-${Date.now().toString().slice(-5)}`,
      schoolId: branding.schoolId,
      schoolName: branding.schoolName,
      fullName,
      role,
      identifier,
      temporaryPassword: tempPass,
      classOrDepartment: classOrDept,
      qrCodeValue: `skuggle://auth?u=${encodeURIComponent(identifier)}&s=${branding.schoolCode}&t=${Date.now()}`,
      mustChangePasswordOnLogin: true,
      generatedDate: new Date().toISOString().split('T')[0],
    };

    setPrintableCards((prev) => [newCard, ...prev]);
    showToast('Login Card Generated', `Printable QR card generated for ${fullName}.`);
    return newCard;
  };

  const upgradePlan = (planId: SubscriptionPlanType) => {
    if (planId.startsWith('school_') || planId === 'enterprise' || planId === 'intelligence_addon') {
      setActiveSchoolPlan(planId);
      showToast('School Plan Upgraded', `Your institution is now on ${planId.replace(/_/g, ' ').toUpperCase()}.`);
    } else {
      setActivePersonalPlan(planId);
      showToast('Personal Plan Upgraded', `Your personal account is now on ${planId.replace(/_/g, ' ').toUpperCase()}.`);
    }
  };

  const toggleGuidedSetupStep = (stepNum: number) => {
    setGuidedSetupSteps((prev) =>
      prev.map((s) => (s.step === stepNum ? { ...s, isDone: !s.isDone } : s))
    );
  };

  const registerPersonalAccount = async (params: {
    persona: 'teacher' | 'student' | 'parent';
    fullName: string;
    email: string;
    phone: string;
    password: string;
    birthDate?: string;
    guardianName?: string;
    guardianEmail?: string;
    actionIntent?: 'personal_space' | 'join_school' | 'both';
    schoolInviteCode?: string;
  }) => {
    const role: UserRole = params.persona === 'teacher' ? 'Teacher' : params.persona === 'student' ? 'Student' : 'Parent';

    if (!demoMode) {
      const names = params.fullName.trim().split(/\s+/);
      const firstName = names.shift() || '';
      const lastName = names.join(' ') || firstName;
      await apiMutation('/individuals/register', 'POST', {
        accountType: params.persona,
        firstName,
        lastName,
        email: params.email,
        password: params.password,
        passwordConfirmation: params.password,
        birthDate: params.birthDate,
        className: params.persona === 'student' ? 'Unassigned' : undefined,
        schoolInvitationCode: params.schoolInviteCode || undefined,
        guardianName: params.guardianName,
        guardianEmail: params.guardianEmail,
        guardianConsent: params.persona === 'student' ? true : undefined,
      });
      showToast('Check your email', 'Your account was created. Verify your email before signing in.', 'success');
      return;
    }

    const newWorkspace: WorkspaceItem = {
      id: `ws-${params.persona}-${Date.now().toString().slice(-4)}`,
      name:
        params.persona === 'teacher'
          ? `${params.fullName} (Personal Teaching Space)`
          : params.persona === 'parent'
          ? `${params.fullName.split(' ')[1] || params.fullName} Family Space`
          : `${params.fullName} (Personal Learner Hub)`,
      type: 'personal',
      role,
      persona: params.persona,
      attentionCount: 0,
      unreadMessages: 0,
    };

    const updatedUser: CurrentUser = {
      ...currentUser,
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      verified: true,
      currentWorkspace: newWorkspace,
      availableWorkspaces: [newWorkspace, ...currentUser.availableWorkspaces],
    };

    setCurrentUser(updatedUser);
    setCurrentWorkspace(newWorkspace);
    if (demoMode) localStorage.setItem('skuggle_active_workspace', JSON.stringify(newWorkspace));
    showToast(
      'Account Created',
      `Welcome to Skuggle, ${params.fullName}! Your personal ${role} workspace is ready.`
    );
  };

  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const attendancePending = useRef<Record<string, { date: string; statuses: Record<string, AttendanceStatus> }>>({});
  const attendanceTimer = useRef<number | null>(null);
  const [activeChildId, setActiveChildId] = useState<string>('std-001'); // David Fanimo default for parent

  const [toast, setToast] = useState<{ title: string; description?: string; type: 'success' | 'warning' | 'error' | 'failed' | 'info'; show: boolean } | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((title: string, description?: string, type: 'success' | 'warning' | 'error' | 'failed' | 'info' = 'success') => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    setToast({ title, description, type, show: true });
    window.dispatchEvent(new CustomEvent('skuggle:notification', { detail: { id: crypto.randomUUID(), title, description, type, createdAt: new Date().toISOString() } }));
    toastTimer.current = window.setTimeout(() => {
      setToast((prev) => (prev ? { ...prev, show: false } : null));
      toastTimer.current = null;
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = null;
    setToast(null);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('skuggle_branding', JSON.stringify(branding));
  }, [branding]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem(tenantStorageKey(currentWorkspace, 'students'), JSON.stringify(students));
  }, [currentWorkspace, students]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem(tenantStorageKey(currentWorkspace, 'staff'), JSON.stringify(staff));
  }, [currentWorkspace, staff]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem(tenantStorageKey(currentWorkspace, 'assessments'), JSON.stringify(assessments));
  }, [currentWorkspace, assessments]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem(tenantStorageKey(currentWorkspace, 'invoices'), JSON.stringify(invoices));
  }, [currentWorkspace, invoices]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem(tenantStorageKey(currentWorkspace, 'fee-transactions'), JSON.stringify(feeTransactions));
  }, [currentWorkspace, feeTransactions]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem(tenantStorageKey(currentWorkspace, 'pins'), JSON.stringify(resultPINs));
  }, [currentWorkspace, resultPINs]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('skuggle_launch_checklist', JSON.stringify(launchChecklist));
  }, [launchChecklist]);

  useEffect(() => {
    if (!demoMode) return;
    localStorage.setItem('skuggle_lesson_plans', JSON.stringify(lessonPlans));
  }, [lessonPlans]);

  const updateBranding = (updates: Partial<TenantBranding>) => {
    const previous = branding;
    setBranding((prev) => ({ ...prev, ...updates }));
    if (demoMode) { showToast('Branding updated', 'School visual identity saved successfully.'); return; }
    void apiMutation('/settings/branding', 'PUT', { schoolName: updates.schoolName, motto: updates.motto, primaryColor: updates.primaryColor, secondaryColor: updates.secondaryColor, logoUrl: updates.logoUrl?.startsWith('http') ? updates.logoUrl : undefined, address: updates.address, city: updates.city, state: updates.state, email: updates.email, phone: updates.phone })
      .then(() => showToast('Branding updated', 'School visual identity was saved to the database.'))
      .catch((error) => { setBranding(previous); showToast('Branding update failed', describeApiError(error), 'failed'); });
  };

  const activateWorkspace = (target: WorkspaceItem) => {
    // Hydrate tenant-owned collections before changing scope so one school's
    // cached records can never bleed into another workspace.
    setStudents(readStored(tenantStorageKey(target, 'students'), demoMode ? initialStudents : []));
    setStaff(readStored(tenantStorageKey(target, 'staff'), demoMode ? initialStaff : []));
    setAssessments(readStored(tenantStorageKey(target, 'assessments'), demoMode ? initialAssessments : []));
    setInvoices(readStored(tenantStorageKey(target, 'invoices'), demoMode ? initialInvoices : []));
    setFeeTransactions(readStored(tenantStorageKey(target, 'fee-transactions'), demoMode ? initialFeeTransactions : []));
    setResultPINs(readStored(tenantStorageKey(target, 'pins'), demoMode ? initialPINs : []));
    setCurrentWorkspace(target);
    if (demoMode) localStorage.setItem('skuggle_active_workspace', JSON.stringify(target));
  };

  const switchWorkspace = (workspaceId: string) => {
    const target = currentUser.availableWorkspaces.find((w) => w.id === workspaceId) || (demoMode ? initialWorkspaces.find((w) => w.id === workspaceId) : undefined);
    if (target) {
      if (demoMode) { activateWorkspace(target); showToast(`Switched workspace`, `Now working in ${target.name} as ${target.role}.`); return; }
      void apiMutation('/auth/switch-workspace', 'POST', { tenantId: target.id })
        .then(() => { activateWorkspace(target); window.dispatchEvent(new Event('skuggle:workspace-changed')); showToast('Switched workspace', `Now working in ${target.name} as ${target.role}.`); })
        .catch((error) => showToast('Workspace switch failed', describeApiError(error), 'failed'));
    }
  };

  const switchSpaceCategory = (category: 'school' | 'personal') => {
    if (!demoMode) {
      const target = currentUser.availableWorkspaces.find((workspace) => workspace.type === category);
      if (target) switchWorkspace(target.id);
      else showToast('Workspace unavailable', `Your account has no ${category} workspace membership.`, 'warning');
      return;
    }
    if (category === 'school') {
      // Find matching school workspace for current role or fallback to teacher / admin
      const matchingSchool =
        initialWorkspaces.find((w) => w.type === 'school' && w.role === currentWorkspace.role) ||
        initialWorkspaces.find((w) => w.type === 'school' && w.id === 'ws-school-teacher') ||
        initialWorkspaces.find((w) => w.type === 'school');
      if (matchingSchool) {
        activateWorkspace(matchingSchool);
        showToast('Switched to School Space', `Now in ${matchingSchool.name} (${matchingSchool.role}).`);
      }
    } else {
      // Find matching personal workspace for current role or default to personal teacher
      const matchingPersonal =
        initialWorkspaces.find((w) => w.type === 'personal' && w.role === currentWorkspace.role) ||
        initialWorkspaces.find((w) => w.type === 'personal' && w.id === 'ws-teacher-personal') ||
        initialWorkspaces.find((w) => w.type === 'personal');
      if (matchingPersonal) {
        activateWorkspace(matchingPersonal);
        showToast('Switched to Personal Space', `Now in ${matchingPersonal.name} (${matchingPersonal.role}).`);
      }
    }
  };

  const loginAsPreset = (spaceType: 'school' | 'personal', role: UserRole) => {
    if (!demoMode) {
      showToast('Demo role switching disabled', 'Use an authorised account membership to change roles.', 'warning');
      return;
    }
    const target = initialWorkspaces.find((w) => w.type === spaceType && w.role === role);
    if (target) {
      activateWorkspace(target);
      showToast(`Logged In (${spaceType === 'school' ? 'School Space' : 'Personal Space'})`, `Active Role: ${role}`);
    }
  };

  const setCurrentRole = (role: UserRole) => {
    if (!demoMode) {
      setCurrentWorkspace((prev) => ({ ...prev, role }));
      return;
    }
    const matchingWs = initialWorkspaces.find(
      (w) => w.type === currentWorkspace.type && w.role === role
    ) || initialWorkspaces.find((w) => w.role === role);
    if (matchingWs) {
      activateWorkspace(matchingWs);
    } else {
      setCurrentWorkspace((prev) => ({ ...prev, role }));
    }
  };

  const addStudent = (student: StudentRecord) => {
    setStudents((prev) => [student, ...prev]);
    if (demoMode) { showToast('Student registered', `${student.firstName} ${student.lastName} (${student.admissionNo}) added to ${student.classLevel}.`); return; }
    const schoolClass = classes.find((item) => item.name === student.classLevel || `${item.name} ${item.arms[0] ?? ''}`.trim() === `${student.classLevel} ${student.arm}`.trim());
    void apiMutation<{ success: true; data: Record<string, unknown> }>('/students', 'POST', {
      admissionNumber: student.admissionNo || undefined, firstName: student.firstName, middleName: student.otherName,
      lastName: student.lastName, gender: student.gender.toLowerCase(), dateOfBirth: student.dateOfBirth,
      admissionDate: new Date().toISOString().slice(0, 10), classId: schoolClass?.id,
      guardians: JSON.stringify([{ name: student.guardianName, relationship: student.guardianRelationship, phone: student.guardianPhone, email: student.guardianEmail }]),
    }).then((response) => {
      setStudents((items) => items.map((item) => item.id === student.id ? { ...item, id: String(response.data.id), admissionNo: String(response.data.admissionNumber ?? item.admissionNo) } : item));
      showToast('Student registered', `${student.firstName} ${student.lastName} was saved to the school database.`);
    }).catch((error) => { setStudents((items) => items.filter((item) => item.id !== student.id)); showToast('Student registration failed', describeApiError(error), 'failed'); });
  };

  const updateStudent = (id: string, updates: Partial<StudentRecord>) => {
    const previous = students.find((item) => item.id === id);
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    if (demoMode) { showToast('Student updated', 'Record updated successfully.'); return; }
    void apiMutation(`/students/${encodeURIComponent(id)}`, 'PATCH', { firstName: updates.firstName, middleName: updates.otherName, lastName: updates.lastName, gender: updates.gender?.toLowerCase(), dateOfBirth: updates.dateOfBirth, status: updates.status?.toLowerCase() })
      .then(() => showToast('Student updated', 'The database record was updated successfully.'))
      .catch((error) => { if (previous) setStudents((items) => items.map((item) => item.id === id ? previous : item)); showToast('Student update failed', describeApiError(error), 'failed'); });
  };

  const addStaff = (member: StaffMember) => {
    setStaff((prev) => [member, ...prev]);
    if (demoMode) { showToast('Staff member added', `${member.fullName} has been granted ${member.role} access.`); return; }
    void apiMutation<{ success: true; data: Record<string, unknown> }>('/employees', 'POST', { employee_number: member.staffNo, name: member.fullName, employment_type: 'full_time', started_at: new Date().toISOString().slice(0, 10), status: 'active' })
      .then((response) => { setStaff((items) => items.map((item) => item.id === member.id ? { ...item, id: String(response.data.id) } : item)); showToast('Staff member added', `${member.fullName} was saved to the database.`); })
      .catch((error) => { setStaff((items) => items.filter((item) => item.id !== member.id)); showToast('Staff creation failed', describeApiError(error), 'failed'); });
  };

  const updateStaff = (id: string, updates: Partial<StaffMember>) => {
    const previous = staff.find((item) => item.id === id);
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    if (demoMode) { showToast('Staff updated', 'Staff permissions and details updated.'); return; }
    void apiMutation(`/employees/${encodeURIComponent(id)}`, 'PATCH', { name: updates.fullName, status: updates.status?.toLowerCase().replace('pending invitation', 'inactive') })
      .then(() => showToast('Staff updated', 'The database record was updated.'))
      .catch((error) => { if (previous) setStaff((items) => items.map((item) => item.id === id ? previous : item)); showToast('Staff update failed', describeApiError(error), 'failed'); });
  };

  const inviteStaff = (data: {
    fullName: string;
    email: string;
    phone: string;
    role: UserRole | string;
    subjects?: string[];
    assignedClasses?: string[];
  }) => {
    const newStaffMember: StaffMember = {
      id: `stf-${Date.now().toString().slice(-4)}`,
      staffNo: `CHIA/STF/${Math.floor(100 + Math.random() * 900)}`,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: (data.role as UserRole) || 'Teacher',
      campus: 'Main Lekki Campus',
      assignedClasses: data.assignedClasses || ['JSS 1', 'JSS 2'],
      assignedSubjects: data.subjects || ['General Studies'],
      status: 'Pending Invitation',
      temporaryPassword: `SKG-${Math.floor(1000 + Math.random() * 9000)}`,
      invitedAt: new Date().toISOString().split('T')[0],
    };
    setStaff((prev) => [newStaffMember, ...prev]);
    if (demoMode) { showToast('Invitation sent', `Invited ${data.fullName} as ${data.role}. Credentials generated.`); return; }
    const backendRole = String(data.role).toLowerCase().replace(/ /g, '_');
    void apiMutation<{ success: true; data: { invite: Record<string, unknown> } }>('/invites', 'POST', { name: data.fullName, email: data.email, role: backendRole, expiresInDays: 7 })
      .then((response) => { setStaff((items) => items.map((item) => item.id === newStaffMember.id ? { ...item, id: String(response.data.invite.id) } : item)); showToast('Invitation sent', `The secure invitation was emailed to ${data.email}.`); })
      .catch((error) => { setStaff((items) => items.filter((item) => item.id !== newStaffMember.id)); showToast('Invitation failed', describeApiError(error), 'failed'); });
  };

  const addAssessment = (asm: AssessmentRecord) => {
    setAssessments((prev) => [asm, ...prev]);
    if (demoMode) { showToast('Assessment created', `${asm.title} for ${asm.subject} (${asm.classLevel}) is ready for score entry.`); return; }
    const schoolClass = classes.find((item) => item.name === asm.classLevel || asm.classLevel.startsWith(item.name));
    const subject = subjects.find((item) => item.name === asm.subject || item.id === asm.subject);
    void apiMutation<{ success: true; data: { id: string } }>('/assessments', 'POST', { title: asm.title, classId: schoolClass?.id, subjectId: subject?.id, assessmentTypeId: 'test', maxScore: asm.weights.total || 100, date: new Date().toISOString().slice(0, 10) })
      .then((response) => { setAssessments((items) => items.map((item) => item.id === asm.id ? { ...item, id: response.data.id } : item)); showToast('Assessment created', `${asm.title} was saved to the database.`); })
      .catch((error) => { setAssessments((items) => items.filter((item) => item.id !== asm.id)); showToast('Assessment creation failed', describeApiError(error), 'failed'); });
  };

  const updateAssessment = (id: string, updates: Partial<AssessmentRecord>) => {
    const previous = assessments.find((item) => item.id === id);
    setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    if (demoMode) { showToast('Assessment updated', 'Scores and status saved successfully.'); return; }
    const status = updates.status?.toLowerCase().replace(' ', '_');
    void apiMutation(`/assessments/${encodeURIComponent(id)}`, 'PATCH', { title: updates.title, status }).then(() => showToast('Assessment updated', 'Changes were saved to the database.')).catch((error) => { if (previous) setAssessments((items) => items.map((item) => item.id === id ? previous : item)); showToast('Assessment update failed', describeApiError(error), 'failed'); });
  };

  const updateAssessmentScore = (
    assessmentId: string,
    scoreIdOrStudentId: string,
    updates: Partial<StudentScoreEntry>
  ) => {
    setAssessments((prev) =>
      prev.map((asm) => {
        if (asm.id === assessmentId) {
          const newScores = asm.scores.map((sc: any) => {
            if (sc.studentId === scoreIdOrStudentId || sc.id === scoreIdOrStudentId) {
              const merged = { ...sc, ...updates };
              const ca1 = merged.ca1 ?? 0;
              const ca2 = merged.ca2 ?? 0;
              const midTerm = merged.midTerm ?? 0;
              const exam = merged.exam ?? 0;
              const total = ca1 + ca2 + midTerm + exam;
              let grade: StudentScoreEntry['grade'] = 'F9';
              if (total >= 75) grade = 'A1';
              else if (total >= 70) grade = 'B2';
              else if (total >= 65) grade = 'B3';
              else if (total >= 60) grade = 'C4';
              else if (total >= 55) grade = 'C5';
              else if (total >= 50) grade = 'C6';
              else if (total >= 45) grade = 'D7';
              else if (total >= 40) grade = 'E8';
              return { ...merged, total, grade };
            }
            return sc;
          });
          return { ...asm, scores: newScores };
        }
        return asm;
      })
    );
    if (!demoMode) {
      const assessment = assessments.find((item) => item.id === assessmentId);
      const existing = assessment?.scores.find((score) => score.studentId === scoreIdOrStudentId || score.id === scoreIdOrStudentId);
      const merged = { ...existing, ...updates } as StudentScoreEntry;
      const total = Number(merged.ca1 ?? 0) + Number(merged.ca2 ?? 0) + Number(merged.midTerm ?? 0) + Number(merged.exam ?? 0);
      void apiRequest<{ success: true; data: { revision: string } }>(`/assessments/${encodeURIComponent(assessmentId)}/scores`, { suppressErrorNotification: true })
        .then((response) => apiMutation(`/assessments/${encodeURIComponent(assessmentId)}/scores`, 'PUT', { revision: response.data.revision, scores: { [merged.studentId || scoreIdOrStudentId]: total } }))
        .catch((error) => showToast('Score save failed', describeApiError(error), 'failed'));
    }
  };

  const lockAssessment = (assessmentId: string, isLocked: boolean) => {
    setAssessments((prev) =>
      prev.map((a) =>
        a.id === assessmentId
          ? {
              ...a,
              status: isLocked ? 'Approved' : 'Draft',
              approvedAt: isLocked ? new Date().toISOString().replace('T', ' ').slice(0, 16) : undefined,
            }
          : a
      )
    );
    showToast(
      isLocked ? 'Assessment Locked' : 'Assessment Unlocked',
      isLocked ? 'Scores locked and approved for reporting.' : 'Assessment reopened for score adjustments.'
    );
    if (!demoMode) void apiMutation(`/assessments/${encodeURIComponent(assessmentId)}`, 'PATCH', { status: isLocked ? 'approved' : 'reopened' }).catch((error) => showToast('Assessment status update failed', describeApiError(error), 'failed'));
  };

  const recordPayment = (invoiceId: string, amount: number, method: 'Bank Transfer' | 'Card' | 'Cash' | 'POS') => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!demoMode) {
      void apiMutation<{ success: true; data: Record<string, unknown> }>('/payments', 'POST', { provider: method.toLowerCase().replace(/ /g, '_'), amount_minor: Math.round(amount * 100), currency: 'NGN', metadata: { invoiceId, studentId: invoice?.studentId, studentName: invoice?.studentName, admissionNo: invoice?.admissionNo, title: 'School fee payment' } })
        .then((response) => { const row = response.data; setFeeTransactions((items) => [{ id: String(row.id), studentId: invoice?.studentId ?? '', studentName: invoice?.studentName ?? '', admissionNo: invoice?.admissionNo ?? '', amount, currency: 'NGN', title: 'School fee payment', status: 'pending', paymentMethod: method, receiptNumber: String(row.providerReference ?? ''), date: new Date().toISOString().slice(0, 10) }, ...items]); showToast('Payment initiated', 'The payment is pending provider confirmation.', 'info'); })
        .catch((error) => showToast('Payment failed', describeApiError(error), 'failed'));
      return;
    }
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newPaid = inv.paidAmount + amount;
          const newBal = Math.max(0, inv.totalAmount - newPaid);
          const newStatus = newBal === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Pending';
          const newReceipt = {
            receiptNo: `REC-${Date.now().toString().slice(-6)}`,
            amountPaid: amount,
            paymentMethod: method,
            date: new Date().toISOString().split('T')[0],
            reference: `TRX-SKG-${Math.floor(100000 + Math.random() * 900000)}`,
          };
          return {
            ...inv,
            paidAmount: newPaid,
            balance: newBal,
            status: newStatus,
            receipts: [newReceipt, ...inv.receipts],
          };
        }
        return inv;
      })
    );
    showToast('Payment recorded', `₦${amount.toLocaleString()} payment credited with official digital receipt.`);
  };

  const addFeeTransaction = (tx: Omit<FeeTransaction, 'id' | 'receiptNumber' | 'date'> & { id?: string; receiptNumber?: string; date?: string }) => {
    const fullTx: FeeTransaction = {
      id: tx.id || `tx-${Date.now().toString().slice(-6)}`,
      studentId: tx.studentId,
      studentName: tx.studentName,
      admissionNo: tx.admissionNo,
      amount: tx.amount,
      currency: tx.currency || 'NGN',
      title: tx.title,
      status: tx.status || 'paid',
      paymentMethod: tx.paymentMethod,
      receiptNumber: tx.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
      date: tx.date || new Date().toISOString().split('T')[0],
    };
    setFeeTransactions((prev) => [fullTx, ...prev]);
    if (!demoMode) {
      void apiMutation<{ success: true; data: Record<string, unknown> }>('/payments', 'POST', { provider: String(fullTx.paymentMethod || 'manual').toLowerCase().replace(/ /g, '_'), amount_minor: Math.round(fullTx.amount * 100), currency: fullTx.currency, metadata: { studentId: fullTx.studentId, studentName: fullTx.studentName, admissionNo: fullTx.admissionNo, title: fullTx.title } })
        .then((response) => setFeeTransactions((items) => items.map((item) => item.id === fullTx.id ? { ...item, id: String(response.data.id), receiptNumber: String(response.data.providerReference), status: 'pending' } : item)))
        .catch((error) => { setFeeTransactions((items) => items.filter((item) => item.id !== fullTx.id)); showToast('Payment failed', describeApiError(error), 'failed'); });
      return;
    }
    showToast('Payment Recorded', `₦${fullTx.amount.toLocaleString()} transaction processed with digital receipt.`);
  };

  const generatePINBatch = (count: number, term: string, session: string) => {
    if (!demoMode) {
      void apiRequest<{ success: true; data: Array<Record<string, unknown>> }>('/results?status=locked', { suppressErrorNotification: true })
        .then((response) => apiMutation<{ success: true; data: { items: Array<Record<string, unknown>>; failed: number } }>('/results/bulk-publish', 'POST', { ids: response.data.slice(0, count).map((item) => item.id) }))
        .then((response) => { const batchId = `PUB-${Date.now().toString().slice(-6)}`; const issued = response.data.items.filter((item) => item.issuedPin).map((item, index) => ({ id: String(item.id), pin: String(item.issuedPin), serialNo: `RESULT-${index + 1}`, batchId, assignedAdmissionNo: String(item.admissionNumber ?? ''), term: String(item.term ?? term), session: String(item.session ?? session), usageCount: 0, maxUsage: 5, isUsed: false, generatedDate: new Date().toISOString().slice(0, 10) })); setResultPINs((items) => [...issued, ...items]); showToast('Results published', `${issued.length} secure result PIN(s) were issued and are shown once for printing.`); })
        .catch((error) => showToast('PIN generation failed', describeApiError(error), 'failed'));
      return;
    }
    const batchId = `BATCH-${Date.now().toString().slice(-6)}`;
    const newItems: ResultPINRecord[] = Array.from({ length: count }).map((_, i) => {
      const p1 = Math.floor(1000 + Math.random() * 9000);
      const p2 = Math.floor(1000 + Math.random() * 9000);
      const p3 = Math.floor(1000 + Math.random() * 9000);
      const p4 = Math.floor(1000 + Math.random() * 9000);
      const serial = `SRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        id: `pin-${Date.now()}-${i}-${Math.floor(100 + Math.random() * 900)}`,
        pin: `SKG-${p1}-${p2}-${p3}-${p4}`,
        serialNo: serial,
        batchId,
        term,
        session,
        usageCount: 0,
        maxUsage: 5,
        isUsed: false,
        generatedDate: new Date().toISOString().split('T')[0],
      };
    });
    setResultPINs((prev) => [...newItems, ...prev]);
    showToast('PINs generated', `Batch ${batchId} generated ${count} secure result check PINs.`);
  };

  const toggleChecklistStep = (stepId: string) => {
    setLaunchChecklist((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step))
    );
  };

  const recordAttendance = (studentId: string, date: string, status: AttendanceStatus, reason?: string) => {
    const attendanceStudent = students.find((item) => item.id === studentId);
    const attendanceClass = classes.find((item) => item.name === attendanceStudent?.classLevel || attendanceStudent?.classLevel.startsWith(item.name));
    if (!isOnline) {
      setOfflineQueue((prev) => [
        ...prev,
        {
          id: `off-${Date.now()}`,
          actionType: 'attendance_mark',
          entityName: `Attendance: ${studentId} (${status})`,
          timestamp: new Date().toISOString(),
          status: 'pending',
          retryCount: 0,
          payload: { student_id: studentId, class_id: attendanceClass?.id, academic_session_id: sessions.find((item) => item.isCurrent)?.id, term_id: terms.find((item) => item.isCurrent)?.id, attendance_date: date, status, reason },
        },
      ]);
    }
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const delta = status === 'present' ? 1 : status === 'absent' ? -1 : 0;
          return {
            ...s,
            attendanceRate: Math.min(100, Math.max(0, s.attendanceRate + delta)),
          };
        }
        return s;
      })
    );
    if (!demoMode && isOnline) {
      const student = attendanceStudent;
      const schoolClass = attendanceClass;
      if (!schoolClass) { showToast('Attendance not saved', 'The selected student is not linked to a database class.', 'error'); return; }
      const pending = attendancePending.current[schoolClass.id] ?? { date, statuses: {} };
      pending.date = date;
      pending.statuses[studentId] = status;
      attendancePending.current[schoolClass.id] = pending;
      if (attendanceTimer.current !== null) window.clearTimeout(attendanceTimer.current);
      attendanceTimer.current = window.setTimeout(() => {
        const batches = attendancePending.current;
        attendancePending.current = {};
        void Promise.all(Object.entries(batches).map(async ([classId, batch]) => {
          const sheet = await apiRequest<{ success: true; data: { revision: string; students: Array<{ id: string; status: AttendanceStatus | null }> } }>(`/attendance/classes/${encodeURIComponent(classId)}?date=${encodeURIComponent(batch.date)}`, { suppressErrorNotification: true });
          const statuses = Object.fromEntries(sheet.data.students.map((item) => [item.id, batch.statuses[item.id] ?? item.status ?? 'present']));
          return apiMutation(`/attendance/classes/${encodeURIComponent(classId)}`, 'PUT', { date: batch.date, revision: sheet.data.revision, statuses });
        })).then(() => showToast('Attendance recorded', 'The class roll was saved to the database.')).catch((error) => showToast('Attendance save failed', describeApiError(error), 'failed'));
      }, 300);
    }
  };

  const syncOfflineQueue = () => {
    if (demoMode) { setOfflineQueue([]); showToast('Sync completed', 'All offline drafts and attendance sheets have synchronized with the server.'); return; }
    const deviceId = localStorage.getItem('skuggle_device_id') || crypto.randomUUID();
    localStorage.setItem('skuggle_device_id', deviceId);
    void apiMutation<{ success: true; data: { conflicts: unknown[]; new_sync_token: string } }>('/sync', 'POST', { device_id: deviceId, last_sync_token: localStorage.getItem('skuggle_sync_token'), changes: offlineQueue.map((item) => ({ type: item.actionType === 'score_save' ? 'score' : 'attendance', client_change_id: item.id, revision: 0, payload: item.payload ?? {} })) })
      .then((response) => { if (response.data.conflicts.length) { showToast('Sync needs attention', `${response.data.conflicts.length} change(s) conflict with newer server data.`, 'warning'); return; } localStorage.setItem('skuggle_sync_token', response.data.new_sync_token); setOfflineQueue([]); showToast('Sync completed', 'Queued changes were accepted by the server.'); })
      .catch((error) => showToast('Sync failed', describeApiError(error), 'failed'));
  };

  const saveLessonPlan = (plan: TeacherLessonPlan) => {
    setLessonPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === plan.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = plan;
        return next;
      }
      return [plan, ...prev];
    });
    if (demoMode) { showToast('Lesson plan saved', `"${plan.title}" saved to your curriculum repository.`); return; }
    const persisted = !plan.id.startsWith('lp-') && !plan.id.startsWith('temp-');
    void apiMutation<{ success: true; data: { id: string } }>(persisted ? `/lesson-plans/${encodeURIComponent(plan.id)}` : '/lesson-plans', persisted ? 'PUT' : 'POST', { title: plan.title, content: plan, status: plan.isPublished ? 'published' : plan.isReviewed ? 'reviewed' : 'draft' })
      .then((response) => { setLessonPlans((items) => items.map((item) => item.id === plan.id ? { ...item, id: response.data.id } : item)); showToast('Lesson plan saved', `"${plan.title}" was saved to the database.`); })
      .catch((error) => showToast('Lesson plan save failed', describeApiError(error), 'failed'));
  };

  const checklistItems = launchChecklist.map((item, idx) => ({
    ...item,
    stepNumber: idx + 1,
    status: item.isCompleted ? ('completed' as const) : ('pending' as const),
    required: item.requiredForLaunch,
  }));

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentRole: currentWorkspace.role,
        setCurrentRole,
        branding,
        updateBranding,
        currentWorkspace,
        switchWorkspace,
        switchSpaceCategory,
        loginAsPreset,
        students,
        addStudent,
        updateStudent,
        staff,
        addStaff,
        updateStaff,
        inviteStaff,
        sessions,
        terms,
        classes,
        subjects,
        assessments,
        cbtQuizzes,
        setCbtQuizzes,
        addAssessment,
        updateAssessment,
        updateAssessmentScore,
        lockAssessment,
        invoices,
        recordPayment,
        feeTransactions,
        addFeeTransaction,
        resultPINs,
        generatePINBatch,
        generatePINs: generatePINBatch,
        launchChecklist,
        checklistItems,
        toggleChecklistStep,
        toggleChecklistItem: toggleChecklistStep,
        recordAttendance,
        offlineQueue,
        isOnline,
        setIsOnline,
        syncOfflineQueue,
        activeChildId,
        setActiveChildId,
        showToast,
        hideToast,
        toast,
        lessonPlans,
        saveLessonPlan,
        teacherProfile,
        updateTeacherProfile,
        linkedChildren,
        linkChildWithCode,
        invitations,
        createInvitationLink,
        revokeInvitation,
        printableCards,
        generatePrintableCard,
        subscriptionPlans,
        activeSchoolPlan,
        activePersonalPlan,
        upgradePlan,
        guidedSetupSteps,
        toggleGuidedSetupStep,
        registerPersonalAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
