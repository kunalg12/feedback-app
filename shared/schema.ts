import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  real,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User role enum
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'TEACHER', 'STUDENT']);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default('STUDENT'),
  studentId: varchar("student_id"),
  department: varchar("department"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  code: varchar("code").notNull().unique(),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  department: varchar("department").notNull(),
  semester: varchar("semester").notNull(),
  academicYear: varchar("academic_year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course enrollments table
export const courseEnrollments = pgTable("course_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
}, (table) => [
  unique().on(table.studentId, table.courseId),
]);

// Attendance records table
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  totalClasses: integer("total_classes").notNull().default(0),
  attendedClasses: integer("attended_classes").notNull().default(0),
  attendancePercentage: real("attendance_percentage").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.studentId, table.courseId),
]);

// Feedback forms table
export const feedbackForms = pgTable("feedback_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  questions: jsonb("questions").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Feedback responses table
export const feedbackResponses = pgTable("feedback_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => feedbackForms.id),
  courseId: varchar("course_id").notNull().references(() => courses.id),
  studentAttendancePercentage: real("student_attendance_percentage").notNull(),
  responses: jsonb("responses").notNull(),
  weightFactor: real("weight_factor").notNull().default(1.0),
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
