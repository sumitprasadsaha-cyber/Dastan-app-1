export interface ChapterNote {
  id: string;
  chapterNo: number; // Only number!
  chapterName: string; // Chapter name
  pdfUrl: string; // Base64 PDF content
  pdfFileName: string; // Original PDF filename
  isCompleted?: boolean; // For tracking revision progress
  remark?: string; // Specific tutor remark on student's performance/difficulty
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  classGrade: string; // "Class 8", "Class 9", "Class 10"
  phone: string;
  parentPhone: string;
  monthlyFee: number;
  feePaidThisMonth: boolean; // Legacy fallback
  registrationDate?: string; // YYYY-MM-DD joining date
  feeMonths?: Record<string, "paid" | "unpaid">; // e.g. {"June 2026": "unpaid", "July 2026": "paid"}
  enrolledSubjects: string[]; // e.g. ["Computer Science", "English", "Mathematics", "Science"]
  avatarUrl?: string; // custom image url
  avatarColor?: string; // fallback background color
  notes: Record<string, ChapterNote[]>; // subject -> list of pdf notes
  attendance: Record<string, boolean>; // date (YYYY-MM-DD) -> present (true) or absent (false)
}

export interface TuitionStats {
  totalEnrolled: number;
  presentToday: number;
  activeClassesCount: number;
  feesPendingCount: number;
  totalRevenue: number;
  monthlyTarget: number;
  monthlyCollected: number;
  subjectProgress: Record<string, number>; // subject -> progress %
}
