import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Users, BookOpen, UserCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const roleSelectionSchema = z.object({
  role: z.enum(['TEACHER', 'STUDENT']),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  studentId: z.string().optional(),
  department: z.string().optional(),
});

type RoleSelectionInput = z.infer<typeof roleSelectionSchema>;

export default function RoleSelection() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'TEACHER' | 'STUDENT' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoleSelectionInput>({
    resolver: zodResolver(roleSelectionSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      studentId: "",
      department: "",
    },
  });

  const onSubmit = async (data: RoleSelectionInput) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest('PUT', `/api/users/${user.id}`, {
        ...data,
        email: user.email,
      });
      
      toast({
        title: "Success",
        description: "Your profile has been updated successfully",
      });
      
      // Refresh the page to reload user data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
            <GraduationCap className="text-white text-2xl h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600">Select your role to access the appropriate dashboard</p>
        </div>

        <Card className="shadow-lg border border-slate-200">
          <CardHeader>
            <CardTitle>Choose Your Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedRole ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-emerald-50 hover:border-emerald-300"
                  onClick={() => setSelectedRole('TEACHER')}
                  data-testid="button-select-teacher"
                >
                  <BookOpen className="h-8 w-8 text-emerald-600" />
                  <div className="text-center">
                    <div className="font-semibold">Teacher</div>
                    <div className="text-sm text-gray-500">Create feedback forms and view analytics</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-300"
                  onClick={() => setSelectedRole('STUDENT')}
                  data-testid="button-select-student"
                >
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="text-center">
                    <div className="font-semibold">Student</div>
                    <div className="text-sm text-gray-500">Submit feedback for your courses</div>
                  </div>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    {selectedRole === 'TEACHER' ? (
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Users className="h-5 w-5 text-purple-600" />
                    )}
                    <span className="font-semibold">Selected Role: {selectedRole}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRole(null)}
                      data-testid="button-change-role"
                    >
                      Change
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedRole === 'STUDENT' && (
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., CS2024001" data-testid="input-student-id" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Computer Science" data-testid="input-department" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setSelectedRole(null)}
                      data-testid="button-cancel"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      data-testid="button-complete-profile"
                    >
                      {isSubmitting ? "Updating..." : "Complete Profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}