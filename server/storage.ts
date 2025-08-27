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
import { nanoid } from "nanoid";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  createUser(user: any): Promise<User>;
  updateUser(id: string, user: any): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if this is the first user - make them admin
    const existingUsers = await db.select().from(users);
    const isFirstUser = existingUsers.length === 0;
    
    const id = userData.id ?? nanoid();
    await db
      .insert(users)
      .values({
        ...userData,
        id,
        role: isFirstUser ? 'ADMIN' : (userData.role || 'STUDENT'),
      })
      .onDuplicateKeyUpdate({
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      });
    const [user] = await db.select().from(users).where(eq(users.id, id));
      
    // Create some demo accounts if this is the first user (admin)
    if (isFirstUser) {
      await this.createDemoAccounts();
    }
    
    return user;
  }

  async createDemoAccounts(): Promise<void> {
    try {
      // Check for existing demo accounts
      const existingUsers = await db.select().from(users).where(
        sql`email IN ('admin@college.edu', 'teacher@college.edu', 'student@college.edu')`
      );
      
      const existingEmails = existingUsers.map(u => u.email);
      
      // Create admin account if it doesn't exist
      if (!existingEmails.includes('admin@college.edu')) {
        const adminHashed = await bcrypt.hash('admin123', 10);
        await db.insert(users).values({
          id: 'demo-admin-1',
          email: 'admin@college.edu',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          password: adminHashed,
          department: 'Administration',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Create teacher account if it doesn't exist
      if (!existingEmails.includes('teacher@college.edu')) {
        const teacherHashed = await bcrypt.hash('teacher123', 10);
      await db.insert(users).values({
        id: 'demo-teacher-1',
        email: 'teacher@college.edu',
        firstName: 'John',
        lastName: 'Professor',
        role: 'TEACHER',
          password: teacherHashed,
        department: 'Computer Science',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      }

      // Create student account if it doesn't exist
      if (!existingEmails.includes('student@college.edu')) {
        const studentHashed = await bcrypt.hash('student123', 10);
      await db.insert(users).values({
        id: 'demo-student-1', 
        email: 'student@college.edu',
        firstName: 'Jane',
        lastName: 'Student',
        role: 'STUDENT',
          password: studentHashed,
        studentId: 'CS2024001',
        department: 'Computer Science',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      }

      console.log('Demo accounts created successfully');
    } catch (error) {
      console.log('Demo accounts creation failed:', error);
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: any): Promise<User> {
    const id = nanoid();
    await db
      .insert(users)
      .values({
        ...userData,
        id,
      });
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user!;
  }

  async updateUser(id: string, userData: any): Promise<User> {
    await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id));
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user!;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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
    const id = nanoid();
    await db
      .insert(courses)
      .values({ ...course, id });
    const [row] = await db.select().from(courses).where(eq(courses.id, id));
    return row!;
  }

  async updateCourse(id: string, course: Partial<InsertCourse>): Promise<Course> {
    await db
      .update(courses)
      .set(course)
      .where(eq(courses.id, id));
    const [row] = await db.select().from(courses).where(eq(courses.id, id));
    return row!;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Enrollment operations
  async enrollStudent(enrollment: InsertCourseEnrollment): Promise<CourseEnrollment> {
    const id = nanoid();
    await db
      .insert(courseEnrollments)
      .values({ ...enrollment, id })
      .onDuplicateKeyUpdate({
        set: { ...enrollment },
      });
    const [row] = await db.select().from(courseEnrollments).where(eq(courseEnrollments.id, id));
    return row!;
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
    const id = nanoid();
    await db
      .insert(attendanceRecords)
      .values({ ...attendance, id })
      .onDuplicateKeyUpdate({
        set: {
          ...attendance,
          updatedAt: new Date(),
        },
      });
    const [row] = await db
      .select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.studentId, attendance.studentId!),
        eq(attendanceRecords.courseId, attendance.courseId!)
      ));
    return row!;
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
    const id = nanoid();
    await db
      .insert(feedbackForms)
      .values({ ...form, id });
    const [row] = await db.select().from(feedbackForms).where(eq(feedbackForms.id, id));
    return row!;
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
    await db
      .update(feedbackForms)
      .set({ ...form, updatedAt: new Date() })
      .where(eq(feedbackForms.id, id));
    const [row] = await db.select().from(feedbackForms).where(eq(feedbackForms.id, id));
    return row!;
  }

  async deleteFeedbackForm(id: string): Promise<void> {
    await db.delete(feedbackForms).where(eq(feedbackForms.id, id));
  }

  // Feedback response operations
  async submitFeedbackResponse(response: InsertFeedbackResponse): Promise<FeedbackResponse> {
    const id = nanoid();
    await db
      .insert(feedbackResponses)
      .values({ ...response, id });
    const [row] = await db.select().from(feedbackResponses).where(eq(feedbackResponses.id, id));
    return row!;
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
