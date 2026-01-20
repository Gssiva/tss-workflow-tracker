import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import companyLogo from '@/assets/company-logo.png';

const VALID_API_KEY = 'APIKEY-TSS-STUDENT-TRACKER-9f8a7b6c5d4e';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

export default function StudentAuth() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your credentials...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already logged in as student
  useEffect(() => {
    if (user && role === 'student') {
      navigate('/student');
    }
  }, [user, role, navigate]);

  // Handle auto-login from external platform
  useEffect(() => {
    const apiKey = searchParams.get('apikey');
    const userEmail = searchParams.get('useremail');

    if (!apiKey || !userEmail) {
      setStatus('error');
      setMessage('Invalid Access');
      setErrorDetails('Missing API key or email. Please access this page from the main TSS platform.');
      return;
    }

    // Validate API key
    if (apiKey !== VALID_API_KEY) {
      setStatus('error');
      setMessage('Invalid API Key');
      setErrorDetails('The API key provided is not valid. Please contact administrator.');
      return;
    }

    handleAutoLogin(userEmail);
  }, [searchParams]);

  const handleAutoLogin = async (email: string) => {
    try {
      setMessage('Validating credentials...');

      // Call edge function to verify student
      const { data, error } = await supabase.functions.invoke('verify-student', {
        body: { apiKey: VALID_API_KEY, email },
      });

      if (error || !data?.success) {
        console.error('Auto-login failed:', error || data?.error);
        setStatus('error');
        setMessage('Verification Failed');
        setErrorDetails(data?.error || 'Failed to verify student credentials. Please try again.');
        return;
      }

      setMessage('Logging you in...');
      setStatus('success');

      // If magic link is available, redirect to it
      if (data.magicLink) {
        toast.success('Welcome! Redirecting to your dashboard...');
        setTimeout(() => {
          window.location.href = data.magicLink;
        }, 1500);
        return;
      }

      // Fallback: navigate to student dashboard
      toast.success('Welcome! Redirecting to your dashboard...');
      setTimeout(() => {
        navigate('/student');
      }, 1500);
    } catch (error) {
      console.error('Auto-login error:', error);
      setStatus('error');
      setMessage('Connection Error');
      setErrorDetails('Failed to connect to the server. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={scaleIn}
        className="w-full max-w-md"
      >
        <motion.div variants={fadeInUp} className="flex flex-col items-center mb-8">
          <motion.img 
            src={companyLogo} 
            alt="TSS Logo" 
            className="h-20 w-20 rounded-2xl mb-4 object-contain shadow-xl"
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />
          <h1 className="text-2xl font-bold text-foreground">TSS Student Portal</h1>
          <p className="text-muted-foreground">Student Tracker Access</p>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-accent/10">
              <CardTitle className="flex items-center justify-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                Student Verification
              </CardTitle>
              <CardDescription>
                Verifying your access from TSS Platform
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-10">
              <div className="flex flex-col items-center justify-center space-y-6">
                {status === 'loading' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="h-16 w-16 text-primary" />
                  </motion.div>
                )}
                
                {status === 'success' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle2 className="h-16 w-16 text-success" />
                  </motion.div>
                )}
                
                {status === 'error' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  >
                    <AlertTriangle className="h-16 w-16 text-destructive" />
                  </motion.div>
                )}

                <motion.div 
                  className="text-center space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-lg font-medium text-foreground">{message}</p>
                  {errorDetails && (
                    <p className="text-sm text-muted-foreground max-w-xs">{errorDetails}</p>
                  )}
                </motion.div>

                {status === 'error' && (
                  <motion.p 
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Please access from the{' '}
                    <a 
                      href="https://workflow.teamtechsign.in" 
                      className="text-primary hover:underline font-medium"
                    >
                      TSS Platform
                    </a>
                  </motion.p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
