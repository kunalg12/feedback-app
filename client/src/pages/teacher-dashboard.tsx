import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCourses } from "@/hooks/use-courses";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Star, Plus, MoreVertical } from "lucide-react";
import { Link } from "wouter";

export default function TeacherDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'TEACHER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access Denied: Teacher access required</p>
        </div>
      </div>
    );
  }

  // Calculate stats from actual data
  const stats = {
    totalCourses: courses.length,
    totalStudents: 234, // This would come from enrollment data
    avgRating: 4.3
  };

  // Mock recent feedback data
  const recentFeedback = [
    {
      courseName: "Data Structures",
      comment: "Great explanations and examples. Very helpful course.",
      submittedAt: "2 hours ago",
      rating: 5
    },
    {
      courseName: "Algorithms",
      comment: "Could use more practice problems in class.",
      submittedAt: "1 day ago",
      rating: 4
    },
    {
      courseName: "Database Systems",
      comment: "Excellent course material and presentation.",
      submittedAt: "2 days ago",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.firstName || 'Professor'}
            </h1>
            <p className="text-gray-600">Manage your courses and view student feedback</p>
          </div>
          <Link href="/teacher/feedback-forms/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-create-feedback">
              <Plus className="h-4 w-4 mr-2" />
              Create Feedback Form
            </Button>
          </Link>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Active Courses"
            value={stats.totalCourses}
            icon={BookOpen}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <StatsCard
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            iconColor="text-emerald-600"
            iconBgColor="bg-emerald-100"
          />
          <StatsCard
            title="Average Rating"
            value={stats.avgRating}
            icon={Star}
            iconColor="text-amber-600"
            iconBgColor="bg-amber-100"
          />
        </div>

        {/* Courses & Recent Feedback */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {coursesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg animate-pulse">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No courses found</p>
                    <p className="text-sm">Create your first course to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-medium text-sm">{course.code}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{course.name}</h4>
                            <p className="text-sm text-gray-500">{course.semester} {course.academicYear}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">45</p>
                            <p className="text-xs text-gray-500">Students</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">84%</p>
                            <p className="text-xs text-gray-500">Attendance</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Feedback */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentFeedback.map((feedback, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{feedback.courseName}</span>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i}
                            className={`h-3 w-3 ${i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{feedback.submittedAt}</p>
                    <p className="text-sm text-gray-700">"{feedback.comment}"</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
