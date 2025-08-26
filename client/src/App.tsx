import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AdminDashboard from "@/pages/admin-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import FeedbackFormBuilderPage from "@/pages/feedback-form-builder";
import FeedbackSubmissionPage from "@/pages/feedback-submission";
import AnalyticsReports from "@/pages/analytics-reports";
import UserManagement from "@/pages/user-management";
import RoleSelection from "@/pages/role-selection";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // If user is logged in but doesn't have a role set (new user), show role selection
  if (user && (!user.role || !user.firstName)) {
    return (
      <Switch>
        <Route path="/" component={RoleSelection} />
        <Route component={RoleSelection} />
      </Switch>
    );
  }

  // Authenticated routes based on user role
  return (
    <Switch>
      {/* Admin Routes */}
      {user?.role === 'ADMIN' && (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/users" component={UserManagement} />
          <Route path="/admin/feedback-forms/new" component={FeedbackFormBuilderPage} />
          <Route path="/admin/reports" component={AnalyticsReports} />
        </>
      )}

      {/* Teacher Routes */}
      {user?.role === 'TEACHER' && (
        <>
          <Route path="/" component={TeacherDashboard} />
          <Route path="/teacher" component={TeacherDashboard} />
          <Route path="/teacher/feedback-forms/new" component={FeedbackFormBuilderPage} />
          <Route path="/teacher/analytics" component={AnalyticsReports} />
        </>
      )}

      {/* Student Routes */}
      {user?.role === 'STUDENT' && (
        <>
          <Route path="/" component={StudentDashboard} />
          <Route path="/student" component={StudentDashboard} />
          <Route path="/student/feedback/:formId" component={FeedbackSubmissionPage} />
        </>
      )}

      {/* Shared Routes */}
      <Route path="/feedback/:formId" component={FeedbackSubmissionPage} />
      <Route path="/analytics" component={AnalyticsReports} />
      
      {/* Fallback to appropriate dashboard */}
      <Route>
        {user?.role === 'ADMIN' && <AdminDashboard />}
        {user?.role === 'TEACHER' && <TeacherDashboard />}
        {user?.role === 'STUDENT' && <StudentDashboard />}
        {!user && <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
