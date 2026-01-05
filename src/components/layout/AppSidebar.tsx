import { Home, FileText, Users, BarChart3, LogOut } from 'lucide-react';
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

export function AppSidebar() {
  const { role, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = role === 'admin';

  const userMenuItems = [
    { title: 'Dashboard', icon: Home, path: '/dashboard' },
    { title: 'My Records', icon: FileText, path: '/records' },
  ];

  const adminMenuItems = [
    { title: 'Dashboard', icon: Home, path: '/admin' },
    { title: 'All Records', icon: FileText, path: '/admin/records' },
    { title: 'Users', icon: Users, path: '/admin/users' },
    { title: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">Project Tracker</h2>
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
