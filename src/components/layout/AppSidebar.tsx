import { Home, FileText, Users, BarChart3, LogOut, Settings, Activity, Image as ImageIcon, GraduationCap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import companyLogo from '@/assets/company-logo.png';

export function AppSidebar() {
  const { role, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isStudent = role === 'student';

  const userMenuItems = [
    { title: 'Dashboard', icon: Home, path: '/dashboard' },
    { title: 'My Records', icon: FileText, path: '/records' },
    { title: 'Day Update', icon: ImageIcon, path: '/daily-work' },
  ];

  const studentMenuItems = [
    { title: 'Dashboard', icon: Home, path: '/student' },
    { title: 'My Records', icon: FileText, path: '/student/records' },
    { title: 'Day Update', icon: ImageIcon, path: '/student/day-update' },
  ];

  const adminMenuItems = [
    { title: 'Dashboard', icon: Home, path: '/admin' },
    { title: 'All Records', icon: FileText, path: '/admin/records' },
    { title: 'Day Update', icon: ImageIcon, path: '/admin/daily-work' },
    { title: 'Employees', icon: Users, path: '/admin/users' },
    { title: 'Students', icon: GraduationCap, path: '/admin/students' },
    { title: 'Employee Activity', icon: Activity, path: '/admin/activity' },
    { title: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  ];

  const menuItems = isAdmin ? adminMenuItems : isStudent ? studentMenuItems : userMenuItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <img 
            src={companyLogo} 
            alt="TSS Logo" 
            className="h-10 w-10 rounded-xl object-contain"
          />
          <div>
            <h2 className="font-bold text-sidebar-foreground">TSS Tracker</h2>
            <p className="text-xs text-muted-foreground capitalize">{role || 'User'}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={location.pathname === item.path}
                    className="transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex flex-col gap-3">
          <div className="text-sm">
            <p className="font-medium text-sidebar-foreground truncate">{user?.email}</p>
          </div>
          <EditProfileDialog 
            trigger={
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <Settings className="h-4 w-4" />
                Edit Profile
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
