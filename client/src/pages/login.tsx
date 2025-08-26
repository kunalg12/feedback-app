import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Link } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    
    // Demo login logic - check against demo accounts
    const demoAccounts = {
      'admin@college.edu': { role: 'ADMIN', name: 'Admin User', password: 'admin123' },
      'teacher@college.edu': { role: 'TEACHER', name: 'John Professor', password: 'teacher123' },
      'student@college.edu': { role: 'STUDENT', name: 'Jane Student', password: 'student123' }
    };

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const account = demoAccounts[data.email as keyof typeof demoAccounts];
      
      if (account && data.password === account.password) {
        // Store user data in localStorage (demo purposes)
        localStorage.setItem('user', JSON.stringify({
          email: data.email,
          role: account.role,
          firstName: account.name.split(' ')[0],
          lastName: account.name.split(' ')[1] || '',
          id: `demo-${account.role.toLowerCase()}`,
        }));

        toast({
          title: "Login Successful",
          description: `Welcome back, ${account.name}!`,
        });

        // Redirect based on role
        window.location.href = '/';
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Check demo credentials below.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (email: string, password: string) => {
    form.setValue('email', email);
    form.setValue('password', password);
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap className="text-white text-2xl h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Faculty Feedback System</h2>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border border-slate-200">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email"
                          placeholder="Enter your email"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...field} 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>

            {/* Demo Account Options */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3 font-medium">Demo Accounts (Click to login):</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-left"
                  onClick={() => handleDemoLogin('admin@college.edu', 'admin123')}
                  data-testid="button-demo-admin"
                >
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Admin Account
                  </span>
                  <span className="text-xs text-gray-500">admin@college.edu</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-left"
                  onClick={() => handleDemoLogin('teacher@college.edu', 'teacher123')}
                  data-testid="button-demo-teacher"
                >
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                    Teacher Account
                  </span>
                  <span className="text-xs text-gray-500">teacher@college.edu</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between text-left"
                  onClick={() => handleDemoLogin('student@college.edu', 'student123')}
                  data-testid="button-demo-student"
                >
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Student Account
                  </span>
                  <span className="text-xs text-gray-500">student@college.edu</span>
                </Button>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register">
                  <Button variant="link" className="p-0 h-auto font-medium text-primary-600" data-testid="link-register">
                    Sign up here
                  </Button>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}