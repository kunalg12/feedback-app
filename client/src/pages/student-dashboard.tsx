import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCourses } from "@/hooks/use-courses";
import { useFeedbackForms } from "@/hooks/use-feedback-forms";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, ClipboardList, CheckCircle, Info } from "lucide-react";
import { Link } from "wouter";

export default function StudentDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: feedbackForms = [], isLoading: formsLoading } = useFeedbackForms();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'STUDENT') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access Denied: Student access required</p>
        </div>
      </div>
    );
  }

  // Calculate stats from actual data
  const activeForms = feedbackForms.filter(form => 
    form.isActive && new Date(form.endDate) > new Date()
  );
  
  const stats = {
    enrolledCourses: courses.length,
    avgAttendance: 87,
    pendingFeedback: activeForms.length,
    completedFeedback: 12 // This would come from submission history
  };

  // Mock attendance data for courses
  const coursesWithAttendance = courses.map(course => ({
    ...course,
    attendance: Math.floor(Math.random() * 30) + 70, // Random 70-100%
    teacher: "Prof. Smith" // This would come from course.teacher relation
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.firstName || 'Student'}
          </h1>
          <p className="text-gray-600">Complete pending feedback forms and track your progress</p>
        </div>

        {/* Student Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Enrolled Courses"
            value={stats.enrolledCourses}
            icon={BookOpen}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatsCard
            title="Avg Attendance"
            value={`${stats.avgAttendance}%`}
            icon={Calendar}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
          />
          <StatsCard
            title="Pending Forms"
            value={stats.pendingFeedback}
            icon={ClipboardList}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
          <StatsCard
            title="Forms Completed"
            value={stats.completedFeedback}
            icon={CheckCircle}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>

        {/* Pending Feedback & Course Overview */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Pending Feedback Forms */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Pending Feedback Forms</CardTitle>
                <p className="text-sm text-gray-600">Complete these forms to help improve your courses</p>
              </CardHeader>
              <CardContent>
                {formsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : activeForms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No pending feedback forms</p>
                    <p className="text-sm">Check back later for new feedback opportunities</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeForms.map((form) => {
                      const course = courses.find(c => c.id === form.courseId);
                      const mockAttendance = Math.floor(Math.random() * 30) + 70;
                      
                      return (
                        <div key={form.id} className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{form.title}</h4>
                              <p className="text-sm text-gray-600">
                                {course?.code} - {course?.name}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                <span>Due: {new Date(form.endDate).toLocaleDateString()}</span>
                                <span>{(form.questions as any[])?.length || 0} questions</span>
                                <div className="flex items-center">
                                  <span>Your attendance: </span>
                                  <span className="ml-1 font-medium text-emerald-600">{mockAttendance}%</span>
                                </div>
                              </div>
                            </div>
                            <Link href={`/student/feedback/${form.id}`}>
                              <Button 
                                className="bg-purple-600 hover:bg-purple-700"
                                data-testid={`button-complete-${form.id}`}
                              >
                                Complete
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Overview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
                          <div className="space-y-1">
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-2 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-8"></div>
                      </div>
                    ))}
                  </div>
                ) : coursesWithAttendance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No courses enrolled</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {coursesWithAttendance.map((course) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-medium text-xs">{course.code}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{course.name}</p>
                            <p className="text-xs text-gray-500">{course.teacher}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{course.attendance}%</p>
                          <p className="text-xs text-gray-500">Attendance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
