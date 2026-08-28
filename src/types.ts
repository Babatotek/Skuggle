export type UserRole =
  | 'School Admin'
  | 'Principal'
  | 'Teacher'
  | 'Parent'
  | 'Student'
  | 'Bursar'
  | 'Platform Owner';

export type Persona = 'school' | 'teacher' | 'parent' | 'student' | 'platform';

// Short convenience aliases for components
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  classLevel: string;
  arm: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  attendanceRate: number;
  termAverage: number;
  feeStatus: 'paid' | 'partial' | 'unpaid';
  positionInClass: number;
  totalStudentsInClass: number;
}

export interface FeeTransaction {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  amount: number;
  currency: string;
  title: string;
  status: 'paid' | 'pending' | 'failed';
  paymentMethod: string;
  receiptNumber: string;
  date: string;
}

export interface TenantBranding {
  schoolId: string;
  schoolName: string;
  shortName?: string; // e.g. 'Crown Heights' or 'CHIA'
  schoolCode: string;
  motto?: string;
  logoUrl: string;
  primaryColor: string; // e.g. '#4F46E5'
  secondaryColor: string; // e.g. '#7C3AED'
  accentColor?: string; // e.g. '#F59E0B'
  backgroundStyle?: 'dark-slate' | 'deep-primary' | 'crest-glow' | 'minimal-clean';
  animationStyle?: 'smooth-scale' | 'kinetic-reveal' | 'crest-focal';
  portalSlug?: string; // e.g. 'crownheights' (skuggle.app/crownheights)
  welcomeMessage?: string;
  showPoweredBySkuggle?: boolean;
  address: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  isPublished: boolean;
  contrastRatio?: number;
  contrastValid?: boolean;
  academicSession: string; // e.g. '2025/2026'
  currentTerm: string; // e.g. 'First Term'
}

export interface WorkspaceItem {
  id: string;
  name: string;
  type: 'personal' | 'school' | 'platform';
  role: UserRole;
  persona?: Persona;
  logoUrl?: string;
  schoolCode?: string;
  portalSlug?: string;
  attentionCount?: number;
  unreadMessages?: number;
  activeSession?: string;
  activeTerm?: string;
  isOwner?: boolean;
}

export interface TeacherProfileData {
  photoUrl?: string;
  fullName: string;
  email: string;
  phone: string;
  subjectsTaught: string[];
  classesTaught: string[];
  curriculumUsed: string; // 'NERDC', 'British/Cambridge', 'Hybrid NERDC-Cambridge', 'Montessori'
  yearsOfExperience: number;
  qualifications: string; // 'B.Ed, TRCN Certified', 'PGDE', 'B.Sc'
  location: string;
  teachingPreferences: string[];
  schoolAffiliations: string[];
}

export interface ChildLinkData {
  childId: string;
  childName: string;
  admissionNo: string;
  schoolName: string;
  schoolCode: string;
  classLevel: string;
  arm: string;
  linkCode: string;
  linkedDate: string;
  status: 'Verified' | 'Pending Verification';
}

export interface InvitationRecord {
  id: string;
  schoolId: string;
  schoolName: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  targetRole: UserRole;
  token: string;
  inviteLink: string;
  expiresAt: string;
  isUsed: boolean;
  isRevoked: boolean;
  createdAt: string;
}

export interface PrintableCredentialCard {
  id: string;
  schoolId: string;
  schoolName: string;
  fullName: string;
  role: UserRole;
  identifier: string; // Username or Admission No
  temporaryPassword: string;
  classOrDepartment: string;
  qrCodeValue: string;
  mustChangePasswordOnLogin: boolean;
  generatedDate: string;
}

export type SubscriptionPlanType =
  | 'personal_teacher_free'
  | 'student_free'
  | 'parent_free'
  | 'school_starter_free'
  | 'personal_pro'
  | 'school_core'
  | 'intelligence_addon'
  | 'enterprise';

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
  description?: string;
}

export interface SubscriptionPlan {
  id: SubscriptionPlanType;
  category: 'personal' | 'school' | 'addon';
  name: string;
  tagline: string;
  priceNGN: number;
  billingPeriod: 'free' | 'per_term_per_student' | 'monthly' | 'yearly';
  features: PlanFeature[];
  studentLimit?: number;
  staffLimit?: number;
  highlight?: boolean;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  verified: boolean;
  currentWorkspace: WorkspaceItem;
  availableWorkspaces: WorkspaceItem[];
  teachingGrowthStreak?: number;
  timeSavedMinutes?: number;
  teacherProfile?: TeacherProfileData;
  linkedChildren?: ChildLinkData[];
}

// Student 360 Record
export interface StudentRecord {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  classLevel: string; // e.g. 'JSS 2'
  arm: string; // e.g. 'Gold', 'A'
  status: 'Active' | 'Suspended' | 'Graduated' | 'Transferred';
  photoUrl: string;
  guardianId: string;
  guardianName: string;
  guardianRelationship: 'Father' | 'Mother' | 'Guardian';
  guardianPhone: string;
  guardianEmail: string;
  attendanceRate: number; // e.g. 96 (%)
  termAverage: number; // e.g. 84.5 (%)
  positionInClass?: number;
  totalStudentsInClass?: number;
  feesStatus: 'Paid' | 'Partial' | 'Pending';
  balanceDue: number;
  academicHistory?: {
    term: string;
    session: string;
    average: number;
    grade: string;
    remarks: string;
  }[];
}

// Staff Member
export interface StaffMember {
  id: string;
  staffNo: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  campus: string;
  assignedClasses: string[];
  assignedSubjects: string[];
  /** Compatibility alias used by compact staff cards. */
  subjects?: string[];
  status: 'Active' | 'Pending Invitation' | 'Suspended';
  temporaryPassword?: string;
  invitedAt?: string;
  avatarUrl?: string;
}

// Academic Setup
export interface AcademicSession {
  id: string;
  name: string; // e.g. '2025/2026'
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export interface AcademicTerm {
  id: string;
  sessionId: string;
  name: string; // e.g. 'First Term'
  isCurrent: boolean;
  startDate: string;
  endDate: string;
}

export interface ClassLevel {
  id: string;
  name: string; // e.g. 'JSS 1', 'JSS 2', 'Primary 4'
  category: 'Nursery' | 'Primary' | 'Junior Secondary' | 'Senior Secondary';
  arms: string[]; // e.g. ['Diamond', 'Gold', 'Emerald']
  subjects: string[];
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string; // e.g. 'Mathematics', 'Basic Science', 'English Language'
  category: 'General' | 'Science' | 'Arts' | 'Commercial' | 'Vocational';
  applicableLevels: string[];
}

// Attendance
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  remark?: string;
}

export interface AttendanceSheet {
  id: string;
  classLevel: string;
  arm: string;
  date: string; // YYYY-MM-DD
  term: string;
  session: string;
  takenBy: string;
  entries: AttendanceEntry[];
  isSynced: boolean;
  lastUpdated: string;
}

// Assessment & Grading
export interface AssessmentWeightConfig {
  ca1Weight: number; // e.g. 15
  ca2Weight: number; // e.g. 15
  midTermWeight: number; // e.g. 10
  terminalExamWeight: number; // e.g. 60
  total: number; // 100
}

export interface StudentScoreEntry {
  id?: string;
  studentId: string;
  studentName?: string;
  ca1: number;
  ca2: number;
  midTerm: number;
  exam: number;
  total: number;
  grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';
  teacherRemark: string;
}

export interface AssessmentRecord {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  arm: string;
  term: string;
  session: string;
  teacherId: string;
  teacherName: string;
  weights: AssessmentWeightConfig;
  scores: StudentScoreEntry[];
  status: 'Draft' | 'Submitted' | 'Validated' | 'Approved' | 'Published';
  reopenReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
}

// Result PINs
export interface ResultPINRecord {
  id?: string;
  pin: string;
  serialNo: string;
  batchId: string;
  assignedAdmissionNo?: string;
  term: string;
  session: string;
  usageCount: number;
  maxUsage: number;
  usedCount?: number;
  maxUses?: number;
  isUsed: boolean;
  generatedDate: string;
}

// Fees and Finance
export interface FeeInvoice {
  id: string;
  invoiceNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  classLevel: string;
  term: string;
  session: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  dueDate: string;
  items: {
    name: string;
    amount: number;
  }[];
  receipts: {
    receiptNo: string;
    amountPaid: number;
    paymentMethod: 'Bank Transfer' | 'Card' | 'Cash' | 'POS';
    date: string;
    reference: string;
  }[];
}

// Teacher Lesson Draft
export interface LessonPlanActivity {
  step: string;
  teacherActivity: string;
  learnerActivity: string;
}

export interface TeacherLessonPlan {
  id: string;
  title: string;
  subject: string;
  topic: string;
  level: string;
  duration: string;
  curriculum: string;
  theme: string;
  behavioralObjectives: string[];
  instructionalMaterials: string[];
  previousKnowledge: string;
  introduction: string;
  activities: LessonPlanActivity[];
  evaluation: string[];
  homework: string;
  provenance: string;
  isAIGenerated: boolean;
  isReviewed: boolean;
  isPublished: boolean;
  createdAt: string;
}

// SmartMark Optical Scanner
export interface SmartMarkSheet {
  sheetId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  rawScore: number;
  totalQuestions: number;
  confidence: number; // 0 - 100
  needsReview: boolean;
  flagReason?: string;
  detectedAnswers: Record<number, string>;
  isReviewed: boolean;
}

export interface SmartMarkBatch {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  totalSheets: number;
  processedCount: number;
  highConfidenceCount: number;
  flaggedCount: number;
  status: 'Uploading' | 'Processing' | 'Requires Review' | 'Completed' | 'Posted';
  sheets: SmartMarkSheet[];
  createdAt: string;
}

// Launch Checklist for School Admin
export interface LaunchChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'institution' | 'academics' | 'people' | 'preview';
  isCompleted: boolean;
  actionUrl: string;
  requiredForLaunch: boolean;
}

export interface GuidedSetupStep {
  id: string;
  order: number;
  title: string;
  description: string;
  completed: boolean;
  routeTab?: string;
  category: 'foundation' | 'academics' | 'people' | 'launch';
}

// Offline Action Queue
export interface OfflineQueueItem {
  id: string;
  actionType: 'attendance_mark' | 'score_save' | 'lesson_draft_save' | 'fee_payment';
  entityName: string;
  timestamp: string;
  status: 'synced' | 'pending' | 'failed';
  retryCount: number;
  payload?: Record<string, unknown>;
}

// 1. Report Card Types
export interface SubjectReportScore {
  subject: string;
  ca1: number;
  ca2: number;
  midTerm: number;
  exam: number;
  total: number;
  grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';
  classAverage: number;
  highestInClass: number;
  lowestInClass: number;
  teacherRemark: string;
}

export interface PsychomotorRating {
  skill: string;
  rating: 1 | 2 | 3 | 4 | 5; // 5 = Excellent
}

export interface ReportCard {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  classLevel: string;
  arm: string;
  gender: 'Male' | 'Female';
  term: string;
  session: string;
  totalScore: number;
  averageScore: number;
  grade: string;
  position: number;
  totalInClass: number;
  timesSchoolOpened: number;
  timesPresent: number;
  timesAbsent: number;
  nextTermResumption: string;
  classTeacherRemark: string;
  principalRemark: string;
  isPublished: boolean;
  generatedDate: string;
  subjects: SubjectReportScore[];
  affectiveDomain: PsychomotorRating[];
  psychomotorDomain: PsychomotorRating[];
}

// 2. Fee Structure & Invoicing
export interface FeeStructureItem {
  id: string;
  name: string;
  applicableClass: string; // e.g. 'All Junior Secondary', 'JSS 1', 'All Senior Secondary'
  amount: number;
  isMandatory: boolean;
  category: 'Tuition' | 'Development' | 'STEM & Lab' | 'Uniform & Books' | 'Boarding & Lunch' | 'Exam Levy';
}

// 3. Broadcast Announcement Center
export interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  channels: ('sms' | 'whatsapp' | 'email' | 'portal')[];
  recipients: 'all_parents' | 'all_staff' | 'all_students' | 'jss_parents' | 'sss_parents' | 'debtors';
  recipientCount: number;
  sentBy: string;
  sentAt: string;
  status: 'sent' | 'scheduled' | 'draft';
  category: 'Fee Reminder' | 'Academic Notice' | 'Emergency Alert' | 'PTA & Events' | 'Holiday Notice';
  deliveredCount: number;
}

// 4. Timetable & Master Schedule
export interface TimetablePeriod {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName: string;
  teacherId: string;
  room?: string;
}

export interface ClassTimetable {
  id: string;
  classLevel: string;
  arm: string;
  session: string;
  term: string;
  periods: TimetablePeriod[];
}

// 5. CBT & Quiz Module
export interface CBTQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation?: string;
}

export interface CBTQuiz {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  term: string;
  session: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passPercentage: number;
  isPublished: boolean;
  shuffleQuestions: boolean;
  questions: CBTQuestion[];
  status: 'active' | 'upcoming' | 'closed' | 'draft';
  attemptCount: number;
  avgScore: number;
}

export interface CBTAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  answers: Record<string, string>;
}
