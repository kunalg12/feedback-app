import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Login Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap className="text-white text-2xl h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Faculty Feedback System</h2>
          <p className="text-sm text-gray-600">Sign in to access your dashboard</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border border-slate-200">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Welcome to the Faculty Feedback System. Please sign in with your institutional account to continue.
                </p>
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
                  <p className="font-semibold mb-1">Getting Started:</p>
                  <p>First user becomes Admin automatically. Admins can then create Teacher and Student accounts through the User Management panel.</p>
                </div>
              </div>

              <Button 
                onClick={handleLogin}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium"
                data-testid="button-sign-in"
              >
                Sign in with Replit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Role Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">Access levels: Admin • Teacher • Student</p>
        </div>
      </div>
    </div>
  );
}
