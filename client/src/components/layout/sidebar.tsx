import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardList, 
  BarChart3, 
  Calendar,
  Presentation,
  University,
  GraduationCap,
  LogOut 
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = {
  ADMIN: [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Feedback Forms', href: '/admin/feedback-forms', icon: ClipboardList },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { name: 'Attendance', href: '/admin/attendance', icon: Calendar },
  ],
  TEACHER: [
    { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    { name: 'My Courses', href: '/teacher/courses', icon: BookOpen },
    { name: 'Feedback Forms', href: '/teacher/feedback-forms', icon: ClipboardList },
    { name: 'Analytics', href: '/teacher/analytics', icon: BarChart3 },
    { name: 'Attendance', href: '/teacher/attendance', icon: Calendar },
  ],
  STUDENT: [
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { name: 'My Courses', href: '/student/courses', icon: BookOpen },
    { name: 'Pending Feedback', href: '/student/feedback', icon: ClipboardList },
    { name: 'My Attendance', href: '/student/attendance', icon: Calendar },
  ],
};

const roleIcons = {
  ADMIN: GraduationCap,
  TEACHER: Presentation,
  STUDENT: University,
};

const roleColors = {
  ADMIN: 'bg-blue-600',
  TEACHER: 'bg-emerald-600',
  STUDENT: 'bg-purple-600',
};

export function Sidebar({ className }: SidebarProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading || !user) {
    return null;
  }

  const roleNav = navigation[user.role as keyof typeof navigation] || [];
  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons];
  const roleColorClass = roleColors[user.role as keyof typeof roleColors];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <aside className={cn("w-64 bg-white shadow-sm border-r border-slate-200 min-h-screen flex flex-col", className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", roleColorClass)}>
            <RoleIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Feedback System</h3>
            <p className="text-xs text-gray-500">
              {user.role === 'ADMIN' ? 'Administrator' : 
               user.role === 'TEACHER' ? 'Faculty Member' : 'Student Access'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {roleNav.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && user.role === 'ADMIN' && "bg-primary-50 text-primary-600 hover:bg-primary-50",
                      isActive && user.role === 'TEACHER' && "bg-emerald-50 text-emerald-600 hover:bg-emerald-50",
                      isActive && user.role === 'STUDENT' && "bg-purple-50 text-purple-600 hover:bg-purple-50"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info and logout */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.firstName || user.email}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.role === 'STUDENT' ? user.studentId : user.department}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-gray-500 hover:text-gray-700"
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
