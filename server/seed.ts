import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Check if demo accounts already exist
    const existingUsers = await storage.getAllUsers();
    
    if (existingUsers.length > 0) {
      console.log("Database already has users, skipping seed...");
      return;
    }

    // Create admin account
    const adminPassword = await bcrypt.hash('admin123', 10);
    await storage.createUser({
      email: 'admin@college.edu',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      department: 'Administration',
    });
    console.log("✅ Admin account created: admin@college.edu / admin123");

    // Create teacher account
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    await storage.createUser({
      email: 'teacher@college.edu',
      password: teacherPassword,
      firstName: 'John',
      lastName: 'Professor',
      role: 'TEACHER',
      department: 'Computer Science',
    });
    console.log("✅ Teacher account created: teacher@college.edu / teacher123");

    // Create student account
    const studentPassword = await bcrypt.hash('student123', 10);
    await storage.createUser({
      email: 'student@college.edu',
      password: studentPassword,
      firstName: 'Jane',
      lastName: 'Student',
      role: 'STUDENT',
      department: 'Computer Science',
      studentId: 'CS2024001',
    });
    console.log("✅ Student account created: student@college.edu / student123");

    // Create some sample courses
    const teacher = await storage.getUserByEmail('teacher@college.edu');
    if (teacher) {
      await storage.createCourse({
        name: 'Introduction to Computer Science',
        code: 'CS101',
        teacherId: teacher.id,
        department: 'Computer Science',
        semester: 'Fall 2024',
        academicYear: '2024-2025',
      });
      console.log("✅ Sample course created: CS101");

      await storage.createCourse({
        name: 'Data Structures and Algorithms',
        code: 'CS201',
        teacherId: teacher.id,
        department: 'Computer Science',
        semester: 'Fall 2024',
        academicYear: '2024-2025',
      });
      console.log("✅ Sample course created: CS201");
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("\nDemo accounts:");
    console.log("- Admin: admin@college.edu / admin123");
    console.log("- Teacher: teacher@college.edu / teacher123");
    console.log("- Student: student@college.edu / student123");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().then(() => {
  process.exit(0);
});
