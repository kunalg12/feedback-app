import "dotenv/config";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  insertCourseSchema,
  insertCourseEnrollmentSchema,
  insertAttendanceRecordSchema,
  insertFeedbackFormSchema,
  insertFeedbackResponseSchema,
  insertUserSchema,
} from "@shared/schema";
import { calculateAttendanceWeight } from "../client/src/lib/attendance-weight";

const JWT_SECRET =
  process.env.JWT_SECRET ?? (process.env.NODE_ENV !== 'production' ? 'dev-secret-change-me' : undefined);

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('[auth] JWT_SECRET not set. Using insecure dev fallback. Set JWT_SECRET in .env.');
}

export async function registerRoutes(app: Express) {
  // JWT Auth Middleware
  function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfigured: JWT_SECRET not set" });
    }
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, JWT_SECRET as string, (err: any, decoded: any) => {
        if (err) return res.status(401).json({ message: "Unauthorized" });
        (req as any).user = decoded;
        next();
      });
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  }

  // Register endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const existing = await (storage as any).getUserByEmail?.(email);
      if (existing) return res.status(409).json({ message: "User already exists" });
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ email, password: hashed, firstName, lastName, role: "STUDENT" });
      res.status(201).json({ id: user.id, email: user.email });
    } catch (e) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      if (!JWT_SECRET) {
        return res.status(500).json({ message: "Server misconfigured: JWT_SECRET not set" });
      }
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) return res.status(401).json({ message: "Invalid credentials" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Invalid credentials" });
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET as string, { expiresIn: "7d" });
      res.json({ token });
    } catch (e) {
      console.error("Login error:", e);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (_error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User management routes (Admin only)
  app.get('/api/users', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validatedData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/users/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      const validatedData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(id, validatedData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      await storage.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Course routes
  app.get('/api/courses', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let result;
      if (user.role === 'ADMIN') {
        result = await storage.getCourses();
      } else if (user.role === 'TEACHER') {
        result = await storage.getCoursesByTeacher(userId);
      } else {
        result = await storage.getCoursesByStudent(userId);
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.post('/api/courses', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
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
  app.post('/api/enrollments', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
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

  app.get('/api/courses/:courseId/enrollments', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params as { courseId: string };
      const enrollments = await storage.getEnrollmentsByCourse(courseId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  // Attendance routes
  app.put('/api/attendance', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validatedData = insertAttendanceRecordSchema.parse(req.body);
      const attendancePercentage = (validatedData.totalClasses || 0) > 0
        ? ((validatedData.attendedClasses || 0) / (validatedData.totalClasses || 0)) * 100
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

  app.get('/api/students/:studentId/attendance', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params as { studentId: string };
      const attendance = await storage.getAttendanceByStudent(studentId);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Feedback form routes
  app.get('/api/feedback-forms', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let forms: any[] = [];
      if (user.role === 'ADMIN') {
        forms = await storage.getFeedbackForms();
      } else if (user.role === 'TEACHER') {
        forms = await storage.getFeedbackFormsByTeacher(userId);
      } else {
        const enrollments = await storage.getEnrollmentsByStudent(userId);
        const courseIds = enrollments.map(e => e.courseId);
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

  app.post('/api/feedback-forms', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
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
  app.post('/api/feedback-responses', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== 'STUDENT') {
        return res.status(403).json({ message: "Forbidden" });
      }

      const validatedData = insertFeedbackResponseSchema.parse(req.body);

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

  app.get('/api/feedback-forms/:formId/responses', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { formId } = req.params as { formId: string };
      const responses = await storage.getFeedbackResponsesByForm(formId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching feedback responses:", error);
      res.status(500).json({ message: "Failed to fetch feedback responses" });
    }
  });

  app.get('/api/courses/:courseId/feedback-responses', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { courseId } = req.params as { courseId: string };
      const responses = await storage.getFeedbackResponsesByCourse(courseId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching course feedback responses:", error);
      res.status(500).json({ message: "Failed to fetch course feedback responses" });
    }
  });

  // Additional CRUD routes for courses
  app.put('/api/courses/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      const validatedData = insertCourseSchema.partial().parse(req.body);
      const updatedCourse = await storage.updateCourse(id, validatedData);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete('/api/courses/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      await storage.deleteCourse(id);
      res.json({ message: "Course deleted successfully" });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Additional CRUD routes for feedback forms
  app.put('/api/feedback-forms/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      const validatedData = insertFeedbackFormSchema.partial().parse(req.body);
      const updatedForm = await storage.updateFeedbackForm(id, validatedData);
      res.json(updatedForm);
    } catch (error) {
      console.error("Error updating feedback form:", error);
      res.status(500).json({ message: "Failed to update feedback form" });
    }
  });

  app.delete('/api/feedback-forms/:id', authenticateJWT, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { id } = req.params as { id: string };
      await storage.deleteFeedbackForm(id);
      res.json({ message: "Feedback form deleted successfully" });
    } catch (error) {
      console.error("Error deleting feedback form:", error);
      res.status(500).json({ message: "Failed to delete feedback form" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}