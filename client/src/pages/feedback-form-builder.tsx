import { FeedbackFormBuilder } from "@/components/forms/feedback-form-builder";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function FeedbackFormBuilderPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
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

  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access Denied: Teacher or Admin access required</p>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Feedback form created successfully",
    });
    setLocation(user.role === 'TEACHER' ? '/teacher/feedback-forms' : '/admin/feedback-forms');
  };

  const handleCancel = () => {
    setLocation(user.role === 'TEACHER' ? '/teacher' : '/admin');
  };

  return (
    <FeedbackFormBuilder 
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
