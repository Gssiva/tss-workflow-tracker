import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import UserRecords from "./pages/UserRecords";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRecords from "./pages/AdminRecords";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminActivity from "./pages/AdminActivity";
import AdminDailyWork from "./pages/AdminDailyWork";
import AdminStudents from "./pages/AdminStudents";
import UserDailyWork from "./pages/UserDailyWork";
import StudentDashboard from "./pages/StudentDashboard";
import StudentRecords from "./pages/StudentRecords";
import StudentDayUpdate from "./pages/StudentDayUpdate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Employee Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/records"
              element={
                <ProtectedRoute>
                  <UserRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/daily-work"
              element={
                <ProtectedRoute>
                  <UserDailyWork />
                </ProtectedRoute>
              }
            />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute requireStudent>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/records"
              element={
                <ProtectedRoute requireStudent>
                  <StudentRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/day-update"
              element={
                <ProtectedRoute requireStudent>
                  <StudentDayUpdate />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/records"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminActivity />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/daily-work"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDailyWork />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
