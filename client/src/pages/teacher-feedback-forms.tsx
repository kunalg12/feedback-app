import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useFeedbackForms } from "@/hooks/use-feedback-forms";
import { useCourses } from "@/hooks/use-courses";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash2, Calendar, Users } from "lucide-react";
import { Link } from "wouter";

export default function TeacherFeedbackFormsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: feedbackForms = [], isLoading: formsLoading } = useFeedbackForms();
  const { data: courses = [] } = useCourses();

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

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? `${course.code} - ${course.name}` : 'Unknown Course';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isActive = (form: any) => {
    const now = new Date();
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);
    return form.isActive && startDate <= now && endDate >= now;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback Forms</h1>
            <p className="text-gray-600">Manage and view your feedback forms</p>
          </div>
          <Link href="/teacher/feedback-forms/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Form
            </Button>
          </Link>
        </div>

        {/* Forms List */}
        <div className="space-y-6">
          {formsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : feedbackForms.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Plus className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback forms yet</h3>
                <p className="text-gray-600 mb-6">Create your first feedback form to start collecting student feedback</p>
                <Link href="/teacher/feedback-forms/new">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Form
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            feedbackForms.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                        <Badge variant={isActive(form) ? "default" : "secondary"}>
                          {isActive(form) ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      {form.description && (
                        <p className="text-gray-600 mb-3">{form.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{getCourseName(form.courseId)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(form.startDate)} - {formatDate(form.endDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{form.questions?.length || 0} questions</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
