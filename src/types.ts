export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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
}

export interface Stats {
  totalEssays: number;
  correctedEssays: number;
  pendingEssays: number;
  totalStudents: number;
  totalTeachers: number;
}
