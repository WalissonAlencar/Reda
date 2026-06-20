export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PENDING_TEACHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  essay_credits?: number;
  phone?: string;
  pix_key?: string;
  created_at?: string;
  age?: number;
  school_name?: string;
  school_year?: string;
  school_type?: string;
  target_course?: string;
  state?: string;
  city?: string;
  education_level?: string;
  is_enem_evaluator?: boolean;
}

export type EssayStatus = 'sent' | 'correcting' | 'corrected';

export interface Essay {
  id: string;
  studentId: string;
  studentName: string;
  teacherId?: string;
  title: string;
  status: EssayStatus;
  submittedAt: string;
  correctedAt?: string;
  score?: number;
  competencies?: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
  };
  feedback?: string;
  pdfUrl: string;
  correctedPdfUrl?: string;
  correction_type?: 'simple' | 'double';
}

export interface Stats {
  totalEssays: number;
  correctedEssays: number;
  pendingEssays: number;
  totalStudents: number;
  totalTeachers: number;
}

export interface PartnerSchool {
  id: string;
  name: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  teacher_id: string;
  amount: number;
  pix_key: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  teacher?: {
    name: string;
    email: string;
  };
}
