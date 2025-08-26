import { z } from 'zod';

export const feedbackFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  courseId: z.string().min(1, 'Course is required'),
  startDate: z.date(),
  endDate: z.date(),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['rating', 'text', 'select']),
    required: z.boolean(),
    options: z.array(z.string()).optional()
  })).min(1, 'At least one question is required')
});

export const courseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  code: z.string().min(1, 'Course code is required'),
  department: z.string().min(1, 'Department is required'),
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  teacherId: z.string().optional(),
});

export const attendanceSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  totalClasses: z.number().min(0, 'Total classes must be non-negative'),
  attendedClasses: z.number().min(0, 'Attended classes must be non-negative'),
});

export const feedbackResponseSchema = z.object({
  formId: z.string().min(1, 'Form ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  responses: z.record(z.any()),
});

export type FeedbackFormInput = z.infer<typeof feedbackFormSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type FeedbackResponseInput = z.infer<typeof feedbackResponseSchema>;
