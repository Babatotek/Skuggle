export interface BroadsheetStudentEntry {
  studentId: string;
  admissionNo: string;
  studentName: string;
  gender: 'Male' | 'Female';
  classArm: string;
  subjectScores: Record<string, { ca: number; exam: number; total: number; grade: string }>;
  totalMarks: number;
  average: number;
  gpa: number;
  position: number;
  totalStudentsInClass: number;
  status: 'Passed' | 'Promoted' | 'Promoted on Trial' | 'Repeat' | 'Withheld';
  attendanceRate: number;
  conductRemark: string;
}

export interface ClassPerformanceSummary {
  classLevel: string;
  totalStudents: number;
  classAverage: number;
  passRate: number; // percentage
  topStudent: { name: string; average: number; admissionNo: string };
  maleCount: number;
  femaleCount: number;
  averageAttendance: number;
  subjectAverages: { subject: string; average: number; passRate: number }[];
}

export interface OutstandingFeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  classArm: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  totalFee: number;
  amountPaid: number;
  outstandingBalance: number;
  status: 'Unpaid' | 'Partial' | 'Overdue' | 'Cleared';
  lastPaymentDate?: string;
  dueDate: string;
}

export interface StaffComplianceRecord {
  id: string;
  staffName: string;
  staffId: string;
  role: string;
  department: string;
  subjectsTaught: string[];
  classesAssigned: string[];
  lessonPlanCompliance: number; // %
  gradebookSubmissionStatus: 'Submitted' | 'Pending Review' | 'Draft' | 'Overdue';
  markedPapersCount: number;
  totalAssignedPapers: number;
  attendanceRate: number; // %
  lastActive: string;
}

export interface AttendanceAnalyticsPoint {
  date: string;
  dayName: string;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  attendanceRate: number;
  teacherAttendanceRate: number;
}

export const ADMIN_BROADSHEET_SUBJECTS = [
  { code: 'MTH', name: 'Mathematics', maxMark: 100 },
  { code: 'ENG', name: 'English Language', maxMark: 100 },
  { code: 'PHY', name: 'Physics', maxMark: 100 },
  { code: 'CHM', name: 'Chemistry', maxMark: 100 },
  { code: 'BIO', name: 'Biology', maxMark: 100 },
  { code: 'FMT', name: 'Further Mathematics', maxMark: 100 },
  { code: 'ECO', name: 'Economics', maxMark: 100 },
  { code: 'CIV', name: 'Civic Education', maxMark: 100 },
  { code: 'DIT', name: 'Data Processing / ICT', maxMark: 100 },
];

export const ADMIN_MOCK_BROADSHEET: BroadsheetStudentEntry[] = [
  {
    studentId: 'stu_1',
    admissionNo: 'RGA26/1001',
    studentName: 'Aarav Johnson',
    gender: 'Male',
    classArm: 'SSS 2 Diamond',
    subjectScores: {
      MTH: { ca: 36, exam: 58, total: 94, grade: 'A1' },
      ENG: { ca: 34, exam: 52, total: 86, grade: 'A1' },
      PHY: { ca: 38, exam: 54, total: 92, grade: 'A1' },
      CHM: { ca: 35, exam: 53, total: 88, grade: 'A1' },
      BIO: { ca: 32, exam: 50, total: 82, grade: 'A1' },
      FMT: { ca: 37, exam: 55, total: 92, grade: 'A1' },
      ECO: { ca: 30, exam: 48, total: 78, grade: 'B2' },
      CIV: { ca: 38, exam: 52, total: 90, grade: 'A1' },
      DIT: { ca: 39, exam: 57, total: 96, grade: 'A1' },
    },
    totalMarks: 798,
    average: 88.67,
    gpa: 4.88,
    position: 1,
    totalStudentsInClass: 38,
    status: 'Promoted',
    attendanceRate: 98.4,
    conductRemark: 'Exemplary academic and moral performance. Maintains outstanding leadership in STEM.',
  },
  {
    studentId: 'stu_2',
    admissionNo: 'RGA26/1002',
    studentName: 'Fatima Al-Hassan',
    gender: 'Female',
    classArm: 'SSS 2 Diamond',
    subjectScores: {
      MTH: { ca: 34, exam: 55, total: 89, grade: 'A1' },
      ENG: { ca: 38, exam: 54, total: 92, grade: 'A1' },
      PHY: { ca: 33, exam: 51, total: 84, grade: 'A1' },
      CHM: { ca: 36, exam: 52, total: 88, grade: 'A1' },
      BIO: { ca: 35, exam: 52, total: 87, grade: 'A1' },
      FMT: { ca: 32, exam: 49, total: 81, grade: 'A1' },
      ECO: { ca: 34, exam: 52, total: 86, grade: 'A1' },
      CIV: { ca: 37, exam: 53, total: 90, grade: 'A1' },
      DIT: { ca: 38, exam: 54, total: 92, grade: 'A1' },
    },
    totalMarks: 789,
    average: 87.67,
    gpa: 4.85,
    position: 2,
    totalStudentsInClass: 38,
    status: 'Promoted',
    attendanceRate: 100,
    conductRemark: 'Extremely diligent, articulate, and shows exceptional analytical aptitude across all disciplines.',
  },
  {
    studentId: 'stu_3',
    admissionNo: 'RGA26/1003',
    studentName: 'Chukwudi Eze',
    gender: 'Male',
    classArm: 'SSS 2 Diamond',
    subjectScores: {
      MTH: { ca: 35, exam: 52, total: 87, grade: 'A1' },
      ENG: { ca: 30, exam: 46, total: 76, grade: 'B2' },
      PHY: { ca: 36, exam: 54, total: 90, grade: 'A1' },
      CHM: { ca: 32, exam: 48, total: 80, grade: 'B2' },
      BIO: { ca: 31, exam: 47, total: 78, grade: 'B2' },
      FMT: { ca: 36, exam: 52, total: 88, grade: 'A1' },
      ECO: { ca: 28, exam: 44, total: 72, grade: 'B3' },
      CIV: { ca: 34, exam: 50, total: 84, grade: 'A1' },
      DIT: { ca: 37, exam: 55, total: 92, grade: 'A1' },
    },
    totalMarks: 747,
    average: 83.0,
    gpa: 4.55,
    position: 3,
    totalStudentsInClass: 38,
    status: 'Promoted',
    attendanceRate: 96.2,
    conductRemark: 'Strong grasp of physical sciences and mathematics. Active member of Robotics Club.',
  },
  {
    studentId: 'stu_4',
    admissionNo: 'RGA26/1004',
    studentName: 'Zainab Abubakar',
    gender: 'Female',
    classArm: 'SSS 2 Diamond',
    subjectScores: {
      MTH: { ca: 32, exam: 48, total: 80, grade: 'B2' },
      ENG: { ca: 36, exam: 53, total: 89, grade: 'A1' },
      PHY: { ca: 29, exam: 45, total: 74, grade: 'B3' },
      CHM: { ca: 33, exam: 49, total: 82, grade: 'A1' },
      BIO: { ca: 36, exam: 54, total: 90, grade: 'A1' },
      FMT: { ca: 28, exam: 42, total: 70, grade: 'B3' },
      ECO: { ca: 32, exam: 50, total: 82, grade: 'A1' },
      CIV: { ca: 36, exam: 51, total: 87, grade: 'A1' },
      DIT: { ca: 35, exam: 50, total: 85, grade: 'A1' },
    },
    totalMarks: 739,
    average: 82.11,
    gpa: 4.48,
    position: 4,
    totalStudentsInClass: 38,
    status: 'Promoted',
    attendanceRate: 97.5,
    conductRemark: 'Consistent academic dedication and brilliant written communication skills.',
  },
  {
    studentId: 'stu_5',
    admissionNo: 'RGA26/1005',
    studentName: 'Emmanuel Adeyemi',
    gender: 'Male',
    classArm: 'SSS 2 Diamond',
    subjectScores: {
      MTH: { ca: 28, exam: 42, total: 70, grade: 'B3' },
      ENG: { ca: 30, exam: 44, total: 74, grade: 'B3' },
      PHY: { ca: 27, exam: 41, total: 68, grade: 'B3' },
      CHM: { ca: 29, exam: 43, total: 72, grade: 'B3' },
      BIO: { ca: 28, exam: 44, total: 72, grade: 'B3' },
      FMT: { ca: 24, exam: 38, total: 62, grade: 'C4' },
      ECO: { ca: 31, exam: 46, total: 77, grade: 'B2' },
      CIV: { ca: 33, exam: 48, total: 81, grade: 'A1' },
      DIT: { ca: 34, exam: 48, total: 82, grade: 'A1' },
    },
    totalMarks: 658,
    average: 73.11,
    gpa: 3.92,
    position: 12,
    totalStudentsInClass: 38,
    status: 'Promoted',
    attendanceRate: 92.0,
    conductRemark: 'Good overall capability. Needs to dedicate more study time to Further Mathematics.',
  },
  {
    studentId: 'stu_6',
    admissionNo: 'RGA26/1006',
    studentName: 'Blessing Okafor',
    gender: 'Female',
    classArm: 'SSS 2 Diamond',
    subjectScores: {
      MTH: { ca: 22, exam: 32, total: 54, grade: 'C6' },
      ENG: { ca: 26, exam: 38, total: 64, grade: 'C4' },
      PHY: { ca: 20, exam: 28, total: 48, grade: 'D7' },
      CHM: { ca: 23, exam: 31, total: 54, grade: 'C6' },
      BIO: { ca: 25, exam: 35, total: 60, grade: 'C5' },
      FMT: { ca: 16, exam: 22, total: 38, grade: 'F9' },
      ECO: { ca: 24, exam: 36, total: 60, grade: 'C5' },
      CIV: { ca: 30, exam: 42, total: 72, grade: 'B3' },
      DIT: { ca: 28, exam: 40, total: 68, grade: 'B3' },
    },
    totalMarks: 518,
    average: 57.56,
    gpa: 2.65,
    position: 34,
    totalStudentsInClass: 38,
    status: 'Promoted on Trial',
    attendanceRate: 84.6,
    conductRemark: 'Requires structured academic intervention in Physics and Further Mathematics before WAEC registration.',
  }
];

export const CLASS_PERFORMANCE_SUMMARIES: ClassPerformanceSummary[] = [
  {
    classLevel: 'SSS 3',
    totalStudents: 184,
    classAverage: 79.4,
    passRate: 96.2,
    topStudent: { name: 'Kelechi Nwosu', average: 94.2, admissionNo: 'RGA24/0912' },
    maleCount: 96,
    femaleCount: 88,
    averageAttendance: 96.8,
    subjectAverages: [
      { subject: 'Mathematics', average: 81.2, passRate: 97.4 },
      { subject: 'English', average: 83.6, passRate: 98.9 },
      { subject: 'Physics', average: 76.8, passRate: 92.5 },
      { subject: 'Chemistry', average: 78.4, passRate: 94.1 },
      { subject: 'Biology', average: 80.1, passRate: 95.8 },
      { subject: 'Economics', average: 82.5, passRate: 96.0 },
    ],
  },
  {
    classLevel: 'SSS 2',
    totalStudents: 226,
    classAverage: 76.8,
    passRate: 93.8,
    topStudent: { name: 'Aarav Johnson', average: 88.67, admissionNo: 'RGA26/1001' },
    maleCount: 118,
    femaleCount: 108,
    averageAttendance: 95.2,
    subjectAverages: [
      { subject: 'Mathematics', average: 74.5, passRate: 91.2 },
      { subject: 'English', average: 79.1, passRate: 96.4 },
      { subject: 'Physics', average: 72.3, passRate: 88.0 },
      { subject: 'Chemistry', average: 75.0, passRate: 92.1 },
      { subject: 'Biology', average: 78.6, passRate: 94.5 },
      { subject: 'Economics', average: 77.2, passRate: 93.0 },
    ],
  },
  {
    classLevel: 'SSS 1',
    totalStudents: 276,
    classAverage: 74.2,
    passRate: 91.5,
    topStudent: { name: 'Amina Danjuma', average: 91.8, admissionNo: 'RGA26/1140' },
    maleCount: 144,
    femaleCount: 132,
    averageAttendance: 94.6,
    subjectAverages: [
      { subject: 'Mathematics', average: 71.8, passRate: 89.4 },
      { subject: 'English', average: 76.5, passRate: 95.0 },
      { subject: 'Physics', average: 69.4, passRate: 85.2 },
      { subject: 'Chemistry', average: 71.2, passRate: 87.8 },
      { subject: 'Biology', average: 76.0, passRate: 93.2 },
      { subject: 'Economics', average: 75.8, passRate: 91.0 },
    ],
  },
  {
    classLevel: 'JSS 3',
    totalStudents: 284,
    classAverage: 78.1,
    passRate: 95.0,
    topStudent: { name: 'David Adeleke', average: 92.4, admissionNo: 'RGA25/0842' },
    maleCount: 152,
    femaleCount: 132,
    averageAttendance: 96.1,
    subjectAverages: [
      { subject: 'Mathematics', average: 76.4, passRate: 93.0 },
      { subject: 'English', average: 81.0, passRate: 97.2 },
      { subject: 'Basic Science', average: 79.5, passRate: 96.0 },
      { subject: 'Basic Tech', average: 77.2, passRate: 94.5 },
      { subject: 'Business Studies', average: 80.4, passRate: 96.8 },
      { subject: 'Civic Education', average: 84.1, passRate: 98.2 },
    ],
  },
  {
    classLevel: 'JSS 2',
    totalStudents: 290,
    classAverage: 75.6,
    passRate: 92.4,
    topStudent: { name: 'Titi Ogundipe', average: 90.1, admissionNo: 'RGA26/1410' },
    maleCount: 156,
    femaleCount: 134,
    averageAttendance: 94.8,
    subjectAverages: [
      { subject: 'Mathematics', average: 73.0, passRate: 90.0 },
      { subject: 'English', average: 78.4, passRate: 95.5 },
      { subject: 'Basic Science', average: 76.2, passRate: 93.4 },
      { subject: 'Basic Tech', average: 74.0, passRate: 91.0 },
      { subject: 'Business Studies', average: 77.8, passRate: 94.0 },
      { subject: 'Civic Education', average: 81.5, passRate: 96.5 },
    ],
  },
  {
    classLevel: 'JSS 1',
    totalStudents: 312,
    classAverage: 77.3,
    passRate: 94.2,
    topStudent: { name: 'Ngozi Okafor', average: 93.5, admissionNo: 'RGA26/1601' },
    maleCount: 168,
    femaleCount: 144,
    averageAttendance: 97.2,
    subjectAverages: [
      { subject: 'Mathematics', average: 75.2, passRate: 92.5 },
      { subject: 'English', average: 80.6, passRate: 96.8 },
      { subject: 'Basic Science', average: 78.0, passRate: 95.0 },
      { subject: 'Basic Tech', average: 75.8, passRate: 93.0 },
      { subject: 'Business Studies', average: 79.2, passRate: 95.4 },
      { subject: 'Civic Education', average: 83.4, passRate: 97.8 },
    ],
  }
];

export const OUTSTANDING_FEES_LIST: OutstandingFeeRecord[] = [
  {
    id: 'fee_1',
    studentId: 'stu_6',
    studentName: 'Blessing Okafor',
    admissionNo: 'RGA26/1006',
    classArm: 'SSS 2 Diamond',
    parentName: 'Chief Emeka Okafor',
    parentPhone: '+234 803 555 1204',
    parentEmail: 'emeka.okafor@gmail.com',
    totalFee: 385000,
    amountPaid: 150000,
    outstandingBalance: 235000,
    status: 'Overdue',
    lastPaymentDate: '2026-06-15',
    dueDate: '2026-08-10',
  },
  {
    id: 'fee_2',
    studentId: 'stu_7',
    studentName: 'Tariro Moyo',
    admissionNo: 'RGA26/1007',
    classArm: 'JSS 3 Gold',
    parentName: 'Dr. Tendai Moyo',
    parentPhone: '+234 812 444 8899',
    parentEmail: 'dr.moyo@yahoo.co.uk',
    totalFee: 320000,
    amountPaid: 0,
    outstandingBalance: 320000,
    status: 'Unpaid',
    dueDate: '2026-08-15',
  },
  {
    id: 'fee_3',
    studentId: 'stu_8',
    studentName: 'Yusuf Bello',
    admissionNo: 'RGA26/1008',
    classArm: 'SSS 1 Ruby',
    parentName: 'Alhaji Bello Mustapha',
    parentPhone: '+234 802 333 7741',
    parentEmail: 'mustapha.bello@kaduna.gov.ng',
    totalFee: 350000,
    amountPaid: 200000,
    outstandingBalance: 150000,
    status: 'Partial',
    lastPaymentDate: '2026-07-28',
    dueDate: '2026-08-30',
  },
  {
    id: 'fee_4',
    studentId: 'stu_9',
    studentName: 'Anjolaoluwa Adebayo',
    admissionNo: 'RGA26/1009',
    classArm: 'JSS 1 Emerald',
    parentName: 'Mrs. Funke Adebayo',
    parentPhone: '+234 809 111 9922',
    parentEmail: 'funke.adebayo@accessbankplc.com',
    totalFee: 310000,
    amountPaid: 180000,
    outstandingBalance: 130000,
    status: 'Partial',
    lastPaymentDate: '2026-08-01',
    dueDate: '2026-08-25',
  },
  {
    id: 'fee_5',
    studentId: 'stu_10',
    studentName: 'Chiamaka Nnadi',
    admissionNo: 'RGA26/1010',
    classArm: 'SSS 3 Platinum',
    parentName: 'Engr. Okey Nnadi',
    parentPhone: '+234 805 777 4411',
    parentEmail: 'okey.nnadi@shell.com',
    totalFee: 420000,
    amountPaid: 420000,
    outstandingBalance: 0,
    status: 'Cleared',
    lastPaymentDate: '2026-08-12',
    dueDate: '2026-08-20',
  },
];

export const STAFF_COMPLIANCE_LIST: StaffComplianceRecord[] = [
  {
    id: 'stf_1',
    staffName: 'Mr. Babatunde Adewale',
    staffId: 'RGA/STAFF/014',
    role: 'Senior Teacher & HOD',
    department: 'Mathematics & Further Maths',
    subjectsTaught: ['Mathematics', 'Further Mathematics'],
    classesAssigned: ['SSS 2 Diamond', 'SSS 3 Platinum'],
    lessonPlanCompliance: 100,
    gradebookSubmissionStatus: 'Submitted',
    markedPapersCount: 76,
    totalAssignedPapers: 76,
    attendanceRate: 98.8,
    lastActive: '10 mins ago',
  },
  {
    id: 'stf_2',
    staffName: 'Mrs. Chioma Okonkwo',
    staffId: 'RGA/STAFF/022',
    role: 'Subject Teacher',
    department: 'Languages',
    subjectsTaught: ['English Language', 'Literature in English'],
    classesAssigned: ['SSS 1 Ruby', 'SSS 2 Diamond', 'SSS 3 Platinum'],
    lessonPlanCompliance: 92,
    gradebookSubmissionStatus: 'Submitted',
    markedPapersCount: 114,
    totalAssignedPapers: 114,
    attendanceRate: 97.5,
    lastActive: '1 hour ago',
  },
  {
    id: 'stf_3',
    staffName: 'Dr. Ibrahim Garba',
    staffId: 'RGA/STAFF/008',
    role: 'HOD Physical Sciences',
    department: 'Science',
    subjectsTaught: ['Physics'],
    classesAssigned: ['SSS 2 Diamond', 'SSS 3 Platinum'],
    lessonPlanCompliance: 95,
    gradebookSubmissionStatus: 'Submitted',
    markedPapersCount: 76,
    totalAssignedPapers: 76,
    attendanceRate: 99.1,
    lastActive: '25 mins ago',
  },
  {
    id: 'stf_4',
    staffName: 'Mrs. Folake Salami',
    staffId: 'RGA/STAFF/031',
    role: 'Subject Teacher',
    department: 'Science',
    subjectsTaught: ['Chemistry'],
    classesAssigned: ['SSS 1 Ruby', 'SSS 2 Diamond', 'SSS 3 Platinum'],
    lessonPlanCompliance: 88,
    gradebookSubmissionStatus: 'Pending Review',
    markedPapersCount: 98,
    totalAssignedPapers: 114,
    attendanceRate: 94.2,
    lastActive: '3 hours ago',
  },
  {
    id: 'stf_5',
    staffName: 'Mr. Jude Onuoha',
    staffId: 'RGA/STAFF/045',
    role: 'Junior School Lead',
    department: 'Vocational & Tech',
    subjectsTaught: ['Basic Tech', 'Data Processing'],
    classesAssigned: ['JSS 2 Gold', 'JSS 3 Emerald', 'SSS 2 Diamond'],
    lessonPlanCompliance: 78,
    gradebookSubmissionStatus: 'Draft',
    markedPapersCount: 65,
    totalAssignedPapers: 114,
    attendanceRate: 91.0,
    lastActive: 'Yesterday',
  },
];

export const ATTENDANCE_WEEKLY_TRENDS: AttendanceAnalyticsPoint[] = [
  { date: '2026-08-17', dayName: 'Mon', presentStudents: 1215, absentStudents: 33, lateStudents: 18, attendanceRate: 97.4, teacherAttendanceRate: 100 },
  { date: '2026-08-18', dayName: 'Tue', presentStudents: 1228, absentStudents: 20, lateStudents: 12, attendanceRate: 98.4, teacherAttendanceRate: 98.5 },
  { date: '2026-08-19', dayName: 'Wed', presentStudents: 1220, absentStudents: 28, lateStudents: 15, attendanceRate: 97.8, teacherAttendanceRate: 100 },
  { date: '2026-08-20', dayName: 'Thu', presentStudents: 1205, absentStudents: 43, lateStudents: 22, attendanceRate: 96.6, teacherAttendanceRate: 97.0 },
  { date: '2026-08-21', dayName: 'Fri', presentStudents: 1190, absentStudents: 58, lateStudents: 31, attendanceRate: 95.4, teacherAttendanceRate: 95.5 },
];

export const INITIAL_SCHOOL_SETTINGS = {
  general: {
    schoolName: 'Royal Gateway Academy',
    shortCode: 'RGA',
    motto: 'Excellence, Integrity & Innovation',
    establishedYear: '2008',
    accreditationNumber: 'WAEC/NG/LAG/2026/8940',
    ministryApprovalNo: 'MOE/SCH/LAG/0942',
    address: '14 Admiralty Way, Lekki Phase 1',
    state: 'Lagos State',
    lga: 'Eti-Osa',
    phone: '+234 1 890 2341',
    secondaryPhone: '+234 803 999 8811',
    email: 'info@royalgateway.edu.ng',
    adminEmail: 'admin@royalgateway.edu.ng',
    website: 'https://royalgateway.edu.ng',
    principalName: 'Mrs. B. Adeyemi (M.Ed, F.IoD)',
    principalSignatureUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    schoolLogoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80',
    colorTheme: 'Indigo & Amber',
  },
  academic: {
    currentSession: '2026/2027',
    currentTerm: 'First Term',
    termStartDate: '2026-09-08',
    termEndDate: '2026-12-15',
    nextResumptionDate: '2027-01-11',
    totalSchoolDays: 70,
    workingDaysPerWeek: 5,
    midTermBreakStart: '2026-10-26',
    midTermBreakEnd: '2026-10-30',
    resultPublicationDate: '2026-12-18',
    isResultLocked: false,
  },
  gradingPolicy: {
    continuousAssessmentWeight: 40,
    examinationWeight: 60,
    components: [
      { name: '1st Continuous Assessment (CA 1)', maxScore: 10, weight: 10 },
      { name: '2nd Continuous Assessment (CA 2)', maxScore: 10, weight: 10 },
      { name: 'Assignments & Class Project', maxScore: 10, weight: 10 },
      { name: 'Mid-Term Test', maxScore: 10, weight: 10 },
      { name: 'Terminal Examination', maxScore: 60, weight: 60 },
    ],
    gradeScales: [
      { grade: 'A1', minScore: 75, maxScore: 100, gpaPoint: 5.0, remark: 'Distinction / Excellent', color: 'emerald' },
      { grade: 'B2', minScore: 70, maxScore: 74, gpaPoint: 4.0, remark: 'Very Good', color: 'teal' },
      { grade: 'B3', minScore: 65, maxScore: 69, gpaPoint: 3.5, remark: 'Good', color: 'blue' },
      { grade: 'C4', minScore: 60, maxScore: 64, gpaPoint: 3.0, remark: 'Credit', color: 'indigo' },
      { grade: 'C5', minScore: 55, maxScore: 59, gpaPoint: 2.5, remark: 'Credit', color: 'cyan' },
      { grade: 'C6', minScore: 50, maxScore: 54, gpaPoint: 2.0, remark: 'Credit', color: 'sky' },
      { grade: 'D7', minScore: 45, maxScore: 49, gpaPoint: 1.5, remark: 'Pass', color: 'amber' },
      { grade: 'E8', minScore: 40, maxScore: 44, gpaPoint: 1.0, remark: 'Fair Pass', color: 'orange' },
      { grade: 'F9', minScore: 0, maxScore: 39, gpaPoint: 0.0, remark: 'Fail', color: 'rose' },
    ],
    promotionRules: {
      minimumPassMark: 50,
      mustPassSubjects: ['Mathematics', 'English Language'],
      minimumSubjectsPassed: 6,
    }
  },
  classes: [
    { id: 'cls_1', name: 'SSS 3', arm: 'Diamond (Science)', formTutor: 'Mr. B. Adewale', studentCount: 38, capacity: 40 },
    { id: 'cls_2', name: 'SSS 3', arm: 'Platinum (Arts & Commercial)', formTutor: 'Mrs. C. Okonkwo', studentCount: 36, capacity: 40 },
    { id: 'cls_3', name: 'SSS 2', arm: 'Diamond (Science)', formTutor: 'Dr. I. Garba', studentCount: 38, capacity: 40 },
    { id: 'cls_4', name: 'SSS 2', arm: 'Gold (Commercial)', formTutor: 'Mr. E. Danladi', studentCount: 35, capacity: 40 },
    { id: 'cls_5', name: 'SSS 1', arm: 'Ruby (General)', formTutor: 'Mrs. F. Salami', studentCount: 40, capacity: 42 },
    { id: 'cls_6', name: 'JSS 3', arm: 'Gold', formTutor: 'Mr. J. Onuoha', studentCount: 42, capacity: 45 },
    { id: 'cls_7', name: 'JSS 2', arm: 'Emerald', formTutor: 'Miss T. Adeleke', studentCount: 41, capacity: 45 },
    { id: 'cls_8', name: 'JSS 1', arm: 'Sapphire', formTutor: 'Mr. K. Balogun', studentCount: 44, capacity: 45 },
  ],
  subjectsCatalog: [
    { code: 'MTH', name: 'Mathematics', category: 'Core', levels: ['JSS', 'SSS'], hod: 'Mr. B. Adewale' },
    { code: 'ENG', name: 'English Language', category: 'Core', levels: ['JSS', 'SSS'], hod: 'Mrs. C. Okonkwo' },
    { code: 'PHY', name: 'Physics', category: 'Science', levels: ['SSS'], hod: 'Dr. I. Garba' },
    { code: 'CHM', name: 'Chemistry', category: 'Science', levels: ['SSS'], hod: 'Mrs. F. Salami' },
    { code: 'BIO', name: 'Biology', category: 'Science', levels: ['SSS'], hod: 'Mr. S. Olanrewaju' },
    { code: 'FMT', name: 'Further Mathematics', category: 'Science', levels: ['SSS'], hod: 'Mr. B. Adewale' },
    { code: 'ECO', name: 'Economics', category: 'Commercial/Arts', levels: ['SSS'], hod: 'Mr. E. Danladi' },
    { code: 'ACC', name: 'Financial Accounting', category: 'Commercial', levels: ['SSS'], hod: 'Mr. E. Danladi' },
    { code: 'LIT', name: 'Literature in English', category: 'Arts', levels: ['SSS'], hod: 'Mrs. C. Okonkwo' },
    { code: 'CIV', name: 'Civic Education', category: 'Core', levels: ['JSS', 'SSS'], hod: 'Mrs. T. Adeleke' },
    { code: 'DIT', name: 'Data Processing & ICT', category: 'Vocational', levels: ['JSS', 'SSS'], hod: 'Mr. J. Onuoha' },
  ],
  feesBilling: {
    currency: 'NGN (₦)',
    bankDetails: {
      bankName: 'Guaranty Trust Bank (GTBank)',
      accountName: 'Royal Gateway Academy Ltd',
      accountNumber: '0129482710',
      sortCode: '058152062',
    },
    paymentGateways: {
      paystackEnabled: true,
      paystackPublicKey: 'pk_live_892348923489234823904',
      flutterwaveEnabled: false,
      monnifyEnabled: true,
      monnifyContractCode: 'RGA-MON-99234',
      bankTransferReceiptVerification: true,
    },
    classFeeSchedule: [
      { classLevel: 'SSS 3', tuition: 280000, labFee: 40000, devLevy: 25000, ptaDues: 15000, waecNecoReg: 60000, total: 420000 },
      { classLevel: 'SSS 2', tuition: 260000, labFee: 35000, devLevy: 25000, ptaDues: 15000, waecNecoReg: 0, total: 335000 },
      { classLevel: 'SSS 1', tuition: 250000, labFee: 30000, devLevy: 35000, ptaDues: 15000, waecNecoReg: 0, total: 330000 },
      { classLevel: 'JSS 3', tuition: 240000, labFee: 20000, devLevy: 25000, ptaDues: 15000, waecNecoReg: 20000, total: 320000 },
      { classLevel: 'JSS 1 - 2', tuition: 230000, labFee: 15000, devLevy: 25000, ptaDues: 15000, waecNecoReg: 0, total: 285000 },
    ],
    installmentPolicy: {
      allowInstallments: true,
      maxInstallments: 3,
      minimumFirstInstallmentPercent: 50,
      latePaymentFee: 15000,
    }
  },
  notificationsBroadcast: {
    smsProvider: 'Termii (Nigeria)',
    smsApiKey: 'TER_live_981249129034',
    senderId: 'ROYAL_GATE',
    smsBalanceUnits: 14250,
    whatsappGatewayActive: true,
    whatsappBusinessNumber: '+234 818 900 1200',
    automatedTriggers: {
      dailyAbsentAlert: true,
      dailyLateArrivalAlert: true,
      examResultPublishedAlert: true,
      termFeeReminderDaysBeforeDue: 7,
      birthDayWishes: true,
    },
    messageTemplates: {
      absenteeSMS: 'Dear Parent, your child {STUDENT_NAME} ({ADMISSION_NO}) was marked ABSENT today {DATE} at Royal Gateway Academy. Call admin on {PHONE}.',
      feeReminderSMS: 'Dear Parent, a friendly reminder that the outstanding fee of {AMOUNT} for {STUDENT_NAME} is due on {DUE_DATE}. Pay safely on Skuggle Portal.',
      resultSMS: 'Royal Gateway Academy: {TERM} results for {STUDENT_NAME} are now published. Access PIN/Portal to view broadsheet slip.',
    }
  },
  securityAndAudit: {
    twoFactorAuthEnforced: true,
    sessionTimeoutMinutes: 30,
    auditTrailEnabled: true,
    autoBackupFrequency: 'Daily at 02:00 AM (West Africa Time)',
    lastBackupTimestamp: '2026-08-22T02:00:15Z',
    backupCloudDestination: 'Encrypted Skuggle Cloud Storage (Frankfurt Region)',
    ipWhitelistEnabled: false,
    lockReportCardsAfterApproval: true,
  }
};
