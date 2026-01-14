import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, BarChart3, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import companyLogo from '@/assets/company-logo.png';

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [user, role, loading, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        <div className="container mx-auto px-6 py-24 relative text-center">
          <div className="flex justify-center mb-8">
            <img 
              src={companyLogo} 
              alt="TSS Logo" 
              className="h-24 w-24 rounded-3xl shadow-2xl object-contain"
            />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">TSS Tracker</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Track your projects with automatic SLA monitoring. Know when tasks breach their expected completion time.</p>
          <Button size="lg" className="gradient-primary text-lg px-8" onClick={() => navigate('/auth')}>Get Started <ArrowRight className="ml-2 h-5 w-5" /></Button>
        </div>
      </div>
      <div className="container mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-2xl p-8 shadow-lg border"><Clock className="h-10 w-10 text-primary mb-4" /><h3 className="text-xl font-semibold mb-2">SLA Tracking</h3><p className="text-muted-foreground">Auto-detect when tasks breach expected completion time.</p></div>
          <div className="bg-card rounded-2xl p-8 shadow-lg border"><BarChart3 className="h-10 w-10 text-accent mb-4" /><h3 className="text-xl font-semibold mb-2">Analytics</h3><p className="text-muted-foreground">Dashboards and charts for team performance insights.</p></div>
          <div className="bg-card rounded-2xl p-8 shadow-lg border"><Shield className="h-10 w-10 text-success mb-4" /><h3 className="text-xl font-semibold mb-2">Role-Based Access</h3><p className="text-muted-foreground">Admins manage users, team members focus on their work.</p></div>
        </div>
      </div>
    </div>
  );
}
