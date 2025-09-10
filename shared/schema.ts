import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  mysqlTable as table,
  timestamp,
  varchar,
  text,
  boolean,
  int,
  double,
  mysqlEnum,
  uniqueIndex,
  json,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Removed sessions table (was used for Replit Auth sessions)

// User role enum
// Note: MySQL enum is usually defined inline per column

// Users table for Replit Auth
export const users = table("users", {
  id: varchar("id", { length: 191 }).primaryKey(),
  email: varchar("email", { length: 191 }).unique(),
  password: varchar("password", { length: 255 }),
  firstName: varchar("first_name", { length: 191 }),
  lastName: varchar("last_name", { length: 191 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  role: mysqlEnum("role", ['ADMIN', 'TEACHER', 'STUDENT']).notNull().default('STUDENT'),
  studentId: varchar("student_id", { length: 191 }),
  department: varchar("department", { length: 191 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = table("courses", {
  id: varchar("id", { length: 191 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 191 }).notNull().unique(),
  teacherId: varchar("teacher_id", { length: 191 }).notNull().references(() => users.id),
  department: varchar("department", { length: 191 }).notNull(),
  semester: varchar("semester", { length: 191 }).notNull(),
  academicYear: varchar("academic_year", { length: 191 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course enrollments table
export const courseEnrollments = table("course_enrollments", {
  id: varchar("id", { length: 191 }).primaryKey(),
  studentId: varchar("student_id", { length: 191 }).notNull().references(() => users.id),
  courseId: varchar("course_id", { length: 191 }).notNull().references(() => courses.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
}, (t) => [
  uniqueIndex('enrollment_unique').on(t.studentId, t.courseId),
]);

// Attendance records table
export const attendanceRecords = table("attendance_records", {
  id: varchar("id", { length: 191 }).primaryKey(),
  studentId: varchar("student_id", { length: 191 }).notNull().references(() => users.id),
  courseId: varchar("course_id", { length: 191 }).notNull().references(() => courses.id),
  totalClasses: int("total_classes").notNull().default(0),
  attendedClasses: int("attended_classes").notNull().default(0),
  attendancePercentage: double("attendance_percentage").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  uniqueIndex('attendance_unique').on(t.studentId, t.courseId),
]);

// Feedback forms table
export const feedbackForms = table("feedback_forms", {
  id: varchar("id", { length: 191 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  courseId: varchar("course_id", { length: 191 }).notNull().references(() => courses.id),
  teacherId: varchar("teacher_id", { length: 191 }).notNull().references(() => users.id),
  questions: json("questions").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feedback responses table
export const feedbackResponses = table("feedback_responses", {
  id: varchar("id", { length: 191 }).primaryKey(),
  formId: varchar("form_id", { length: 191 }).notNull().references(() => feedbackForms.id),
  courseId: varchar("course_id", { length: 191 }).notNull().references(() => courses.id),
  studentAttendancePercentage: double("student_attendance_percentage").notNull(),
  responses: json("responses").notNull(),
  weightFactor: double("weight_factor").notNull().default(1.0),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  taughtCourses: many(courses),
  enrollments: many(courseEnrollments),
  attendanceRecords: many(attendanceRecords),
  createdForms: many(feedbackForms),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
  }),
  enrollments: many(courseEnrollments),
  attendanceRecords: many(attendanceRecords),
  feedbackForms: many(feedbackForms),
  feedbackResponses: many(feedbackResponses),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  student: one(users, {
    fields: [courseEnrollments.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [courseEnrollments.courseId],
    references: [courses.id],
  }),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  student: one(users, {
    fields: [attendanceRecords.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [attendanceRecords.courseId],
    references: [courses.id],
  }),
}));

export const feedbackFormsRelations = relations(feedbackForms, ({ one, many }) => ({
  course: one(courses, {
    fields: [feedbackForms.courseId],
    references: [courses.id],
  }),
  teacher: one(users, {
    fields: [feedbackForms.teacherId],
    references: [users.id],
  }),
  responses: many(feedbackResponses),
}));

export const feedbackResponsesRelations = relations(feedbackResponses, ({ one }) => ({
  form: one(feedbackForms, {
    fields: [feedbackResponses.formId],
    references: [feedbackForms.id],
  }),
  course: one(courses, {
    fields: [feedbackResponses.courseId],
    references: [courses.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  updatedAt: true,
});

export const insertFeedbackFormSchema = createInsertSchema(feedbackForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  endDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
});

export const insertFeedbackResponseSchema = createInsertSchema(feedbackResponses).omit({
  id: true,
  submittedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertFeedbackForm = z.infer<typeof insertFeedbackFormSchema>;
export type FeedbackForm = typeof feedbackForms.$inferSelect;
export type InsertFeedbackResponse = z.infer<typeof insertFeedbackResponseSchema>;
export type FeedbackResponse = typeof feedbackResponses.$inferSelect;
