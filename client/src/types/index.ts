export interface FeedbackQuestion {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'select';
  required: boolean;
  options?: string[];
}

export interface FeedbackFormData {
  title: string;
  description?: string;
  courseId: string;
  questions: FeedbackQuestion[];
  startDate: Date;
  endDate: Date;
}

export interface AttendanceWeight {
  percentage: number;
  weight: number;
  level: 'full' | 'high' | 'moderate' | 'limited' | 'low' | 'minimal';
}

export interface WeightedFeedbackResult {
  averageScore: number;
  totalResponses: number;
  weightedAverage: number;
  attendanceDistribution: AttendanceWeight[];
}

export interface CourseWithStats {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  department: string;
  semester: string;
  academicYear: string;
  createdAt: Date;
  enrollmentCount?: number;
  avgAttendance?: number;
  avgRating?: number;
}

export interface StudentStats {
  enrolledCourses: number;
  avgAttendance: number;
  pendingFeedback: number;
  completedFeedback: number;
}

export interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  avgRating: number;
}

export interface AdminStats {
  totalUsers: number;
  activeCourses: number;
  feedbackForms: number;
  avgRating: number;
}
