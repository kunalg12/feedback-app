import {
  users,
  courses,
  courseEnrollments,
  attendanceRecords,
  feedbackForms,
  feedbackResponses,
  type User,
  type UpsertUser,
  type Course,
  type InsertCourse,
  type CourseEnrollment,
  type InsertCourseEnrollment,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type FeedbackForm,
  type InsertFeedbackForm,
  type FeedbackResponse,
  type InsertFeedbackResponse,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Course operations
  getCourses(): Promise<Course[]>;
  getCoursesByTeacher(teacherId: string): Promise<Course[]>;
  getCoursesByStudent(studentId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: string): Promise<void>;
  
  // Enrollment operations
  enrollStudent(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment>;
  getEnrollmentsByCourse(courseId: string): Promise<CourseEnrollment[]>;
  getEnrollmentsByStudent(studentId: string): Promise<CourseEnrollment[]>;
  
  // Attendance operations
  updateAttendance(attendance: InsertAttendanceRecord): Promise<AttendanceRecord>;
  getAttendance(studentId: string, courseId: string): Promise<AttendanceRecord | undefined>;
  getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]>;
  
  // Feedback form operations
  createFeedbackForm(form: InsertFeedbackForm): Promise<FeedbackForm>;
  getFeedbackForms(): Promise<FeedbackForm[]>;
  getFeedbackFormsByTeacher(teacherId: string): Promise<FeedbackForm[]>;
  getFeedbackFormsByCourse(courseId: string): Promise<FeedbackForm[]>;
  updateFeedbackForm(id: string, form: Partial<InsertFeedbackForm>): Promise<FeedbackForm>;
  deleteFeedbackForm(id: string): Promise<void>;
  
  // Feedback response operations
  submitFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse>;
  getFeedbackResponsesByForm(formId: string): Promise<FeedbackResponse[]>;
  getFeedbackResponsesByCourse(courseId: string): Promise<FeedbackResponse[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .orderBy(desc(courses.createdAt));
  }

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.teacherId, teacherId))
      .orderBy(desc(courses.createdAt));
  }

  async getCoursesByStudent(studentId: string): Promise<Course[]> {
    return await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
        teacherId: courses.teacherId,
        department: courses.department,
        semester: courses.semester,
        academicYear: courses.academicYear,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .innerJoin(courseEnrollments, eq(courses.id, courseEnrollments.courseId))
      .where(eq(courseEnrollments.studentId, studentId))
      .orderBy(desc(courses.createdAt));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db
      .insert(courses)
      .values(course)
      .returning();
    return newCourse;
  }

  async updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course> {
    const [updatedCourse] = await db
      .update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Enrollment operations
  async enrollStudent(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const [newEnrollment] = await db
      .insert(courseEnrollments)
      .values(enrollment)
      .returning();
    return newEnrollment;
  }

  async getEnrollmentsByCourse(courseId: string): Promise<CourseEnrollment[]> {
    return await db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, courseId));
  }

  async getEnrollmentsByStudent(studentId: string): Promise<CourseEnrollment[]> {
    return await db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.studentId, studentId));
  }

  // Attendance operations
  async updateAttendance(attendance: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [updatedAttendance] = await db
      .insert(attendanceRecords)
      .values(attendance)
      .onConflictDoUpdate({
        target: [attendanceRecords.studentId, attendanceRecords.courseId],
        set: {
          ...attendance,
          updatedAt: new Date(),
        },
      })
      .returning();
    return updatedAttendance;
  }

  async getAttendance(studentId: string, courseId: string): Promise<AttendanceRecord | undefined> {
    const [attendance] = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.studentId, studentId),
          eq(attendanceRecords.courseId, courseId)
        )
      );
    return attendance;
  }

  async getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, studentId));
  }

  // Feedback form operations
  async createFeedbackForm(form: InsertFeedbackForm): Promise<FeedbackForm> {
    const [newForm] = await db
      .insert(feedbackForms)
      .values(form)
      .returning();
    return newForm;
  }

  async getFeedbackForms(): Promise<FeedbackForm[]> {
    return await db
      .select()
      .from(feedbackForms)
      .orderBy(desc(feedbackForms.createdAt));
  }

  async getFeedbackFormsByTeacher(teacherId: string): Promise<FeedbackForm[]> {
    return await db
      .select()
      .from(feedbackForms)
      .where(eq(feedbackForms.teacherId, teacherId))
      .orderBy(desc(feedbackForms.createdAt));
  }

  async getFeedbackFormsByCourse(courseId: string): Promise<FeedbackForm[]> {
    return await db
      .select()
      .from(feedbackForms)
      .where(eq(feedbackForms.courseId, courseId))
      .orderBy(desc(feedbackForms.createdAt));
  }

  async updateFeedbackForm(id: string, form: Partial<InsertFeedbackForm>): Promise<FeedbackForm> {
    const [updatedForm] = await db
      .update(feedbackForms)
      .set({ ...form, updatedAt: new Date() })
      .where(eq(feedbackForms.id, id))
      .returning();
    return updatedForm;
  }

  async deleteFeedbackForm(id: string): Promise<void> {
    await db.delete(feedbackForms).where(eq(feedbackForms.id, id));
  }

  // Feedback response operations
  async submitFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse> {
    const [newResponse] = await db
      .insert(feedbackResponses)
      .values(response)
      .returning();
    return newResponse;
  }

  async getFeedbackResponsesByForm(formId: string): Promise<FeedbackResponse[]> {
    return await db
      .select()
      .from(feedbackResponses)
      .where(eq(feedbackResponses.formId, formId))
      .orderBy(desc(feedbackResponses.submittedAt));
  }

  async getFeedbackResponsesByCourse(courseId: string): Promise<FeedbackResponse[]> {
    return await db
      .select()
      .from(feedbackResponses)
      .where(eq(feedbackResponses.courseId, courseId))
      .orderBy(desc(feedbackResponses.submittedAt));
  }
}

export const storage = new DatabaseStorage();
