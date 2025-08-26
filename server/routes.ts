import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertCourseSchema,
  insertCourseEnrollmentSchema,
  insertAttendanceRecordSchema,
  insertFeedbackFormSchema,
  insertFeedbackResponseSchema,
} from "@shared/schema";
import { calculateAttendanceWeight } from "../client/src/lib/attendance-weight";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Course routes
  app.get('/api/courses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let courses;
      if (user.role === 'ADMIN') {
        courses = await storage.getCourses();
      } else if (user.role === 'TEACHER') {
        courses = await storage.getCoursesByTeacher(userId);
      } else {
        courses = await storage.getCoursesByStudent(userId);
      }

      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post('/api/courses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse({
        ...validatedData,
        teacherId: user.role === 'TEACHER' ? userId : validatedData.teacherId,
      });

      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // Enrollment routes
  app.post('/api/enrollments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validatedData = insertCourseEnrollmentSchema.parse(req.body);
      const enrollment = await storage.enrollStudent(validatedData);

      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error creating enrollment:", error);
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  app.get('/api/courses/:courseId/enrollments', isAuthenticated, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const enrollments = await storage.getEnrollmentsByCourse(courseId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Attendance routes
  app.put('/api/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validatedData = insertAttendanceRecordSchema.parse(req.body);
      const attendancePercentage = validatedData.totalClasses > 0 
        ? (validatedData.attendedClasses / validatedData.totalClasses) * 100 
        : 0;

      const attendance = await storage.updateAttendance({
        ...validatedData,
        attendancePercentage,
      });

      res.json(attendance);
    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(500).json({ message: "Failed to update attendance" });
    }
  });

  app.get('/api/students/:studentId/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      const attendance = await storage.getAttendanceByStudent(studentId);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Feedback form routes
  app.get('/api/feedback-forms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let forms;
      if (user.role === 'ADMIN') {
        forms = await storage.getFeedbackForms();
      } else if (user.role === 'TEACHER') {
        forms = await storage.getFeedbackFormsByTeacher(userId);
      } else {
        // For students, get forms from their enrolled courses
        const enrollments = await storage.getEnrollmentsByStudent(userId);
        const courseIds = enrollments.map(e => e.courseId);
        forms = [];
        for (const courseId of courseIds) {
          const courseForms = await storage.getFeedbackFormsByCourse(courseId);
          forms.push(...courseForms);
        }
      }

      res.json(forms);
    } catch (error) {
      console.error("Error fetching feedback forms:", error);
      res.status(500).json({ message: "Failed to fetch feedback forms" });
    }
  });

  app.post('/api/feedback-forms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validatedData = insertFeedbackFormSchema.parse(req.body);
      const form = await storage.createFeedbackForm({
        ...validatedData,
        teacherId: user.role === 'TEACHER' ? userId : validatedData.teacherId,
      });

      res.status(201).json(form);
    } catch (error) {
      console.error("Error creating feedback form:", error);
      res.status(500).json({ message: "Failed to create feedback form" });
    }
  });

  // Feedback response routes
  app.post('/api/feedback-responses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'STUDENT') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validatedData = insertFeedbackResponseSchema.parse(req.body);
      
      // Get student's attendance for the course
      const attendance = await storage.getAttendance(userId, validatedData.courseId);
      const attendancePercentage = attendance?.attendancePercentage || 0;
      const weightFactor = calculateAttendanceWeight(attendancePercentage);

      const response = await storage.submitFeedbackResponse({
        ...validatedData,
        studentAttendancePercentage: attendancePercentage,
        weightFactor,
      });

      res.status(201).json(response);
    } catch (error) {
      console.error("Error submitting feedback response:", error);
      res.status(500).json({ message: "Failed to submit feedback response" });
    }
  });

  app.get('/api/feedback-forms/:formId/responses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { formId } = req.params;
      const responses = await storage.getFeedbackResponsesByForm(formId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching feedback responses:", error);
      res.status(500).json({ message: "Failed to fetch feedback responses" });
    }
  });

  app.get('/api/courses/:courseId/feedback-responses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { courseId } = req.params;
      const responses = await storage.getFeedbackResponsesByCourse(courseId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching course feedback responses:", error);
      res.status(500).json({ message: "Failed to fetch course feedback responses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
