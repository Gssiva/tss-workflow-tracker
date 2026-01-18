import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireStudent?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireSuperAdmin = false,
  requireStudent = false,
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Super admin check
  if (requireSuperAdmin && role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  // Admin check (both super_admin and admin can access admin routes)
  if (requireAdmin && role !== 'admin' && role !== 'super_admin') {
    if (role === 'student') {
      return <Navigate to="/student" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Student check
  if (requireStudent && role !== 'student') {
    if (role === 'admin' || role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Regular user trying to access student routes
  if (requireStudent && role === 'user') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
