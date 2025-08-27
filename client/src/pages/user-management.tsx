import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Users } from "lucide-react";

const userSchema = z.object({
  email: z.string().email("Invalid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
  studentId: z.string().optional(),
  department: z.string().optional(),
});

type UserInput = z.infer<typeof userSchema>;

export default function UserManagement() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const form = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "STUDENT",
      studentId: "",
      department: "",
    },
  });

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access Denied: Admin access required</p>
        </div>
      </div>
    );
  }

  const handleCreateUser = async (data: UserInput) => {
    try {
      await createUser.mutateAsync(data);
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (userData: any) => {
    setEditingUser(userData);
    form.reset({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      studentId: userData.studentId || "",
      department: userData.department || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (data: UserInput) => {
    if (!editingUser) return;
    
    try {
      await updateUser.mutateAsync({ id: editingUser.id, user: data });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser.mutateAsync(userId);
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    }
  };

  const columns = [
    { key: 'firstName' as const, header: 'Name', render: (value: string, row: any) => `${row.firstName} ${row.lastName}` },
    { key: 'email' as const, header: 'Email' },
    { 
      key: 'role' as const, 
      header: 'Role',
      render: (value: string) => (
        <Badge variant={value === 'ADMIN' ? 'default' : value === 'TEACHER' ? 'secondary' : 'outline'}>
          {value}
        </Badge>
      )
    },
    { key: 'studentId' as const, header: 'Student ID', render: (value: string) => value || '-' },
    { key: 'department' as const, header: 'Department', render: (value: string) => value || '-' },
    {
      key: 'id' as const,
      header: 'Actions',
      render: (value: string, row: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditUser(row)}
            data-testid={`button-edit-user-${value}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteUser(value)}
            className="text-red-600 hover:text-red-700"
            data-testid={`button-delete-user-${value}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Create and manage user accounts for teachers and students</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary-600 hover:bg-primary-700" data-testid="button-create-user">
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-user-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-user-role">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="STUDENT">Student</SelectItem>
                            <SelectItem value="TEACHER">Teacher</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="For students only" data-testid="input-student-id" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Computer Science" data-testid="input-department" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createUser.isPending}
                      data-testid="button-submit-create"
                    >
                      {createUser.isPending ? "Creating..." : "Create User"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={users}
              columns={columns}
              searchKey="email"
              pageSize={10}
              isLoading={usersLoading}
            />
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdateUser)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-first-name" />
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
                          <Input {...field} data-testid="input-edit-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-role">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="STUDENT">Student</SelectItem>
                          <SelectItem value="TEACHER">Teacher</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-student-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-department" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateUser.isPending}
                    data-testid="button-submit-edit"
                  >
                    {updateUser.isPending ? "Updating..." : "Update User"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}