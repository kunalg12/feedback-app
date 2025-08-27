import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useFeedbackForms } from "@/hooks/use-feedback-forms";
import { FeedbackSubmissionForm } from "@/components/forms/feedback-submission-form";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function FeedbackSubmissionPage() {
  const { formId } = useParams<{ formId: string }>();
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: feedbackForms = [], isLoading: formsLoading } = useFeedbackForms();
  const [, setLocation] = useLocation();

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

  if (isLoading || formsLoading || !user) {
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

  const form = feedbackForms.find(f => f.id === formId);

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Feedback form not found</p>
        </div>
      </div>
    );
  }

  // Mock data - in real app this would come from API
  const formWithCourse = {
    ...form,
    course: {
      id: form.courseId,
      name: "Introduction to Computer Science",
      code: "CS101",
      teacher: "Prof. Smith"
    }
  };

  const studentAttendance = 85; // This would come from attendance API

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Your feedback has been submitted successfully",
    });
    setLocation('/student');
  };

  return (
    <FeedbackSubmissionForm 
      form={formWithCourse}
      studentAttendance={studentAttendance}
      onSuccess={handleSuccess}
    />
  );
}
