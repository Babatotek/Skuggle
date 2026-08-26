export type UserRole =
  | 'landing'
  | 'school_admin'
  | 'teacher'
  | 'principal'
  | 'super_admin'
  | 'parent'
  | 'student'
  | 'bursar'
  | 'examination_officer';

export interface UserProfile {
  id: string;
  name: string;
  roleTitle: string;
  role: UserRole;
  avatar: string;
  schoolName: string;
  schoolCode: string;
  email?: string;
  unreadNotifications?: number;
}

export type StudentStatus =
  | 'Active'
  | 'Applicant'
  | 'Suspended'
  | 'Withdrawn'
  | 'Transferred'
  | 'Graduated'
  | 'Alumni'
  | 'Archived';

export interface StudentRecord {
  id: string;
  admissionNo: string;
  name: string;
  firstName: string;
  lastName: string;
  photo: string;
  class: string;
  classArm: string;
  gender: 'Male' | 'Female';
  status: StudentStatus;
  dob: string;
  stateOfOrigin: string;
  localGovernmentArea?: string;
  countryCode?: string;
  nationality: string;
  admissionDate: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelationship: string;
  currentAverage: number;
  attendanceRate: number;
  feesStatus: 'Paid' | 'Partial' | 'Overdue';
  outstandingFees: number;
  trend: 'improving' | 'steady' | 'declining';
  trendPercent: number;
}

export interface ClassScheduleItem {
  id: string;
  time: string;
  class: string;
  subject: string;
  room: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
  attendanceTaken: boolean;
}

export interface ClassPerformanceItem {
  id: string;
  class: string;
  averageScore: number;
  trend: number;
  sparkline: number[];
}

export interface StudentAttentionItem {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  class: string;
  type: 'attendance' | 'low_score' | 'missing_assignment' | 'declining_performance' | 'fees';
  tag: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
}

export type NotificationCategory = 'alert' | 'payment' | 'student_update' | 'system';
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'info';

export interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  subtitle?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  timestamp?: string;
  timeAgo: string;
  isRead?: boolean;
  read?: boolean;
  iconType?: 'assignment' | 'result' | 'parent' | 'meeting' | 'payment' | 'curriculum' | 'alert' | 'student' | string;
  actionLabel?: string;
  actionType?: string;
  targetId?: string;
  metadata?: {
    amount?: number;
    studentName?: string;
    studentClass?: string;
    admissionNo?: string;
    sender?: string;
    badgeText?: string;
  };
}

export interface SchoolRegistrationItem {
  id: string;
  name: string;
  location: string;
  plan: 'Starter' | 'Basic' | 'Standard' | 'Growth' | 'Premium' | 'Enterprise';
  status: 'Active' | 'Trial' | 'Pending';
  created: string;
  studentsCount: number;
}

export interface LessonPlan {
  title: string;
  subject: string;
  className: string;
  duration: string;
  curriculumReference: string;
  learningObjectives: string[];
  previousKnowledge: string;
  instructionalMaterials: string[];
  steps: {
    stepNumber: number;
    title: string;
    duration: string;
    teacherActivity: string;
    studentActivity: string;
    keyPoints: string;
  }[];
  evaluationQuestions: string[];
  homework: string;
  teacherRemarks: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SmartMarkScanResult {
  assessmentId: string;
  detectedStudentId: string;
  studentName: string;
  classArm: string;
  subject: string;
  totalQuestions: number;
  score: number;
  percentage: number;
  status: 'Auto Marked' | 'Review Required';
  flaggedExceptions: number;
  responses: Record<number, {
    selected: string;
    confidence: number;
    isUncertain: boolean;
    correct: string;
  }>;
  scannedAt: string;
}

export interface TerminalReportCard {
  student: StudentRecord;
  school: {
    name: string;
    address: string;
    motto: string;
    logo: string;
    contact: string;
  };
  session: string;
  term: string;
  classAverage: number;
  position: string;
  totalSubjects: number;
  subjects: {
    name: string;
    ca1: number; // /10
    ca2: number; // /10
    assignment: number; // /10
    project: number; // /10
    exam: number; // /60
    total: number; // /100
    grade: string;
    remark: string;
    classAverage: number;
  }[];
  behavioral: {
    punctuality: number; // 1-5
    attentiveness: number;
    neatness: number;
    politeness: number;
    honesty: number;
    leadership: number;
  };
  attendance: {
    daysPresent: number;
    daysSchoolOpened: number;
    daysLate: number;
    daysAbsent: number;
  };
  classTeacherRemarks: string;
  principalRemarks: string;
  nextTermBegins: string;
}

export type ResourceType =
  | 'document'
  | 'presentation'
  | 'worksheet'
  | 'past_question'
  | 'scheme_of_work'
  | 'link'
  | 'video'
  | 'audio';

export type ResourceFolderCategory =
  | 'Syllabus'
  | 'Assignments'
  | 'Exams'
  | 'Lecture Notes'
  | 'Lab & Practicals'
  | 'General'
  | string;

export interface MLClassificationResult {
  predictedCategory: ResourceFolderCategory;
  /** Alias used by some library UI surfaces; prefer predictedCategory. */
  primaryCategory?: ResourceFolderCategory;
  confidence: number; // 0 - 100
  reasoning: string;
  keyFeatures: string[]; // trigger terms/keywords extracted
  secondaryPredictions: { category: ResourceFolderCategory; probability: number }[];
  /** Alias for secondaryPredictions in older UI bindings. */
  secondaryCategories?: {
    category: ResourceFolderCategory;
    probability: number;
    confidence?: number;
  }[];
  suggestedTags: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readingTimeMinutes?: number;
  classifiedAt: string;
  modelType: 'ML-Bayes-NLP' | 'Gemini-3.7-Flash' | 'Hybrid-Ensemble';
  /** Optional classifier provenance tag (e.g. gemini_flash). */
  source?: string;
}

export interface ResourceFolderInfo {
  id: string;
  name: ResourceFolderCategory;
  description: string;
  color: string;
  iconName: string;
  isSystem: boolean;
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
  wordCount: number;
  highlightSnippets?: string[];
}

export interface ResourceAISummary {
  briefSummary: string;
  keyTakeaways: string[];
  coreConcepts: string[];
  studentActionableTip: string;
  readingLevel: string;
  estimatedReadTime: string;
  targetExam?: string;
  generatedAt: string;
  model: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  classLevels: string[];
  term: string;
  resourceType: ResourceType;
  fileFormat: string;
  fileSize?: string;
  url?: string;
  externalLink?: string;
  tags: string[];
  author: string;
  authorRole: string;
  authorAvatar?: string;
  uploadedAt: string;
  downloadCount: number;
  viewCount: number;
  isPinned?: boolean;
  isSharedWithStudents: boolean;
  isSharedWithParents: boolean;
  curriculumStandard?: string;
  contentPreview?: string;
  weekNumber?: number;
  // AI Summary for student quick preview
  aiSummary?: ResourceAISummary;
  // Folder & ML Categorization properties
  folderCategory?: ResourceFolderCategory;
  mlClassification?: MLClassificationResult;
  // OCR searchable properties
  ocrText?: string;
  ocrPages?: OcrPageResult[];
  ocrStatus?: 'ready' | 'processing' | 'failed' | 'none';
  ocrLanguage?: string;
  ocrConfidence?: number;
  // Sticky-note style annotations
  annotations?: ResourceAnnotation[];
}

export interface ResourceAnnotation {
  id: string;
  resourceId: string;
  author: string;
  authorRole: 'teacher' | 'student' | 'admin';
  authorAvatar?: string;
  text: string;
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
  positionX: number; // percentage 0-100 on page
  positionY: number; // percentage 0-100 on page
  pageNumber: number;
  createdAt: string;
  isResolved?: boolean;
  replies?: {
    id: string;
    author: string;
    authorRole: string;
    text: string;
    createdAt: string;
  }[];
}

export interface SmartQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  learningOutcome: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface SmartQuiz {
  id: string;
  title: string;
  sourceDocumentId?: string;
  sourceDocumentTitle?: string;
  subject: string;
  classLevel: string;
  learningOutcomes: string[];
  questions: SmartQuizQuestion[];
  totalPoints: number;
  timeLimitMinutes: number;
  createdAt: string;
}

// SaaS Management Types for Super Admin & Platform Menu
export type SaaSPlanTier = 'Starter' | 'Growth' | 'Premium' | 'Enterprise';
export type SaaSSchoolStatus = 'Active' | 'Trial' | 'Pending' | 'Suspended' | 'Archived';

export interface SaaSSchoolTenant {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  location: string;
  state: string;
  zone: 'South West' | 'South East' | 'South South' | 'North Central' | 'North West' | 'North East';
  plan: SaaSPlanTier;
  status: SaaSSchoolStatus;
  studentsCount: number;
  teachersCount: number;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  created: string;
  lastActive: string;
  storageUsedGB: number;
  smartMarkScansCount: number;
  geminiTokensUsed: number;
  renewalDate: string;
  healthScore: number; // 0-100
  paymentGateway: 'Paystack' | 'Flutterwave' | 'Direct Bank';
}

export interface SaaSPlanDefinition {
  id: string;
  name: SaaSPlanTier;
  tagline: string;
  termlyPriceNGN: number;
  annualPriceNGN: number;
  maxStudents: number | 'Unlimited';
  maxTeachers: number | 'Unlimited';
  storageGB: number;
  smartMarkMonthlyScans: number | 'Unlimited';
  geminiAICredits: string;
  smsCreditsPerTerm: number;
  badge?: string;
  popular?: boolean;
  features: {
    title: string;
    included: boolean;
  }[];
  activeSchoolsCount: number;
}

export interface SaaSSubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  schoolId: string;
  schoolName: string;
  plan: SaaSPlanTier;
  cycle: 'Termly' | 'Annual' | 'Monthly';
  amountNGN: number;
  discountNGN?: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Canceled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  gateway: 'Paystack' | 'Flutterwave' | 'NIBSS Transfer';
  reference: string;
  receiptUrl?: string;
}

export interface SaaSTelemetryMetric {
  timestamp: string;
  apiRequests: number;
  geminiTokens: number;
  smartMarkScans: number;
  activeUsers: number;
  storageGB: number;
}

export interface SaaSSupportTicket {
  id: string;
  ticketNumber: string;
  schoolId: string;
  schoolName: string;
  requesterName: string;
  requesterRole: string;
  requesterEmail: string;
  subject: string;
  category: 'SmartMark OCR' | 'Gradebook & Results' | 'Billing & Subscription' | 'Portal Access' | 'Feature Request';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Waiting on School' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  assignedAgent: string;
  slaMinutesRemaining: number;
  satisfactionRating?: number;
  messages: {
    id: string;
    sender: string;
    senderType: 'school' | 'support_agent' | 'system';
    avatar?: string;
    content: string;
    timestamp: string;
    attachments?: string[];
  }[];
}

export interface SaaSSystemNode {
  id: string;
  name: string;
  region: string;
  type: 'API Microservice' | 'Database Cluster' | 'AI Inference Pool' | 'Vision OCR Worker' | 'Payment Webhook' | 'Edge CDN';
  status: 'Healthy' | 'Degraded' | 'Maintenance' | 'Offline';
  uptimePercentage: number;
  latencyMs: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
}

export interface SaaSSystemIncident {
  id: string;
  title: string;
  impact: 'None' | 'Minor' | 'Major' | 'Critical';
  status: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
  servicesAffected: string[];
  startTime: string;
  resolvedTime?: string;
  updates: {
    time: string;
    message: string;
    author: string;
  }[];
}

export interface SaaSAuditLog {
  id: string;
  actor: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  target: string;
  category: 'Security' | 'Tenant' | 'Billing' | 'System' | 'AI Model';
  ipAddress: string;
  timestamp: string;
  status: 'Success' | 'Warning' | 'Blocked';
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  roleTitle?: string;
  role: UserRole;
  avatar?: string;
  schoolName?: string;
  schoolCode?: string;
  email?: string;
  tenant?: string | null;
  hasSubscription?: boolean;
  subscriptionPlan?: 'free' | 'learn_plus' | 'school' | 'enterprise';
  unreadNotifications?: number;
}

export interface SaaSAnnouncement {
  id: string;
  title: string;
  summary: string;
  body: string;
  channel: 'In-App Banner' | 'Email Digest' | 'SMS Alert' | 'All Channels';
  targetAudience:
    | 'All Schools'
    | 'School Admins Only'
    | 'Teachers & Principals'
    | 'Teachers Only'
    | 'Trial Accounts';
  publishedAt: string;
  status: 'Sent' | 'Scheduled' | 'Draft';
  recipientCount: number;
  openRatePercent: number;
}

// Tenant Branding & Welcome Experience Types
export type WelcomeBackgroundStyle = 'subtle_glow' | 'solid' | 'gradient';
export type WelcomeAnimationType = 'soft_zoom' | 'fade' | 'float' | 'minimal';
export type AuthStage = 'welcome' | 'transitioning' | 'login' | 'authenticated';

export interface TenantBrandingConfig {
  tenantId: string;
  school_name: string;
  school_code: string;
  school_logo: string;
  logo_badge_text?: string;
  welcome_tagline?: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  background_style: WelcomeBackgroundStyle;
  welcome_animation: WelcomeAnimationType;
  animation_duration: number; // In seconds (e.g. 2.4s)
  show_skuggle_branding: boolean;
  audio_enabled: boolean;
  motto?: string;
  crestIcon?: string;
}

