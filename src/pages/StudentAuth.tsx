import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Key, Mail, Lock, User, Phone, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import companyLogo from '@/assets/company-logo.png';

const apiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

const studentSignupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  studentId: z.string().min(1, 'Student ID is required'),
  batch: z.string().optional(),
  course: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const studentLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type ApiKeyFormData = z.infer<typeof apiKeySchema>;
type StudentSignupFormData = z.infer<typeof studentSignupSchema>;
type StudentLoginFormData = z.infer<typeof studentLoginSchema>;

export default function StudentAuth() {
  const [step, setStep] = useState<'apikey' | 'choose' | 'signup' | 'login'>('apikey');
  const [validatedApiKey, setValidatedApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, user, role } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in as student
  useEffect(() => {
    if (user && role === 'student') {
      navigate('/student');
    }
  }, [user, role, navigate]);

  const apiKeyForm = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: { apiKey: '' },
  });

  const signupForm = useForm<StudentSignupFormData>({
    resolver: zodResolver(studentSignupSchema),
    defaultValues: { 
      fullName: '', 
      email: '', 
      password: '', 
      confirmPassword: '',
      studentId: '',
      batch: '',
      course: '',
      phone: '',
    },
  });

  const loginForm = useForm<StudentLoginFormData>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onValidateApiKey = async (data: ApiKeyFormData) => {
    setLoading(true);
    
    // Validate API key directly
    const { data: keyData, error } = await supabase
      .from('student_api_keys')
      .select('api_key, is_active')
      .eq('api_key', data.apiKey)
      .eq('is_active', true)
      .maybeSingle();

    setLoading(false);

    if (error || !keyData) {
      toast.error('Invalid or inactive API key');
      return;
    }

    setValidatedApiKey(data.apiKey);
    toast.success('API key validated!');
    setStep('choose');
  };

  const onStudentSignup = async (data: StudentSignupFormData) => {
    if (!validatedApiKey) {
      toast.error('Please validate your API key first');
      setStep('apikey');
      return;
    }

    setLoading(true);

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (authError) {
      setLoading(false);
      if (authError.message.includes('already registered')) {
        toast.error('This email is already registered. Please login instead.');
        setStep('login');
      } else {
        toast.error(authError.message);
      }
      return;
    }

    if (!authData.user) {
      setLoading(false);
      toast.error('Failed to create account');
      return;
    }

    // Wait a moment for auth to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create student record
    const { error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: authData.user.id,
        student_id: data.studentId,
        batch: data.batch || null,
        course: data.course || null,
        phone: data.phone || null,
        is_profile_complete: true,
      });

    if (studentError) {
      setLoading(false);
      toast.error('Failed to create student profile: ' + studentError.message);
      return;
    }

    // Assign student role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'student',
      });

    if (roleError) {
      setLoading(false);
      toast.error('Failed to assign role: ' + roleError.message);
      return;
    }

    setLoading(false);
    toast.success('Account created successfully!');
    
    // Sign in the user
    await signIn(data.email, data.password);
    navigate('/student');
  };

  const onStudentLogin = async (data: StudentLoginFormData) => {
    if (!validatedApiKey) {
      toast.error('Please validate your API key first');
      setStep('apikey');
      return;
    }

    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);

    if (error) {
      toast.error('Invalid email or password');
      return;
    }

    toast.success('Welcome back!');
    navigate('/student');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img 
            src={companyLogo} 
            alt="TSS Logo" 
            className="h-16 w-16 rounded-2xl mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-foreground">TSS Student Portal</h1>
          <p className="text-muted-foreground">Access your student dashboard</p>
        </div>

        <Card className="border-none shadow-xl">
          {step === 'apikey' && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Student Access
                </CardTitle>
                <CardDescription>
                  Enter your API key to access the student portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...apiKeyForm}>
                  <form onSubmit={apiKeyForm.handleSubmit(onValidateApiKey)} className="space-y-4">
                    <FormField
                      control={apiKeyForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                className="pl-10" 
                                placeholder="APIKEY-TSS-STUDENT-TRACKER-XXXX" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                      {loading ? 'Validating...' : 'Validate Key'}
                    </Button>
                  </form>
                </Form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Not a student?{' '}
                    <a href="/auth" className="text-primary hover:underline font-medium">
                      Employee Login
                    </a>
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {step === 'choose' && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Welcome, Student!
                </CardTitle>
                <CardDescription>
                  Choose an option to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setStep('signup')} 
                  className="w-full gradient-primary"
                  size="lg"
                >
                  <User className="h-4 w-4 mr-2" />
                  New Student? Create Account
                </Button>
                <Button 
                  onClick={() => setStep('login')} 
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Existing Student? Login
                </Button>
                <Button 
                  onClick={() => setStep('apikey')} 
                  variant="ghost"
                  className="w-full"
                >
                  ← Back to API Key
                </Button>
              </CardContent>
            </>
          )}

          {step === 'signup' && (
            <>
              <CardHeader className="text-center">
                <CardTitle>Create Student Account</CardTitle>
                <CardDescription>Fill in your details to register</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onStudentSignup)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" placeholder="John Doe" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student ID *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" placeholder="STU001" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" placeholder="you@example.com" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={signupForm.control}
                        name="batch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Batch</FormLabel>
                            <FormControl>
                              <Input placeholder="2024" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="course"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Course</FormLabel>
                            <FormControl>
                              <Input placeholder="Web Dev" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={signupForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" placeholder="+1234567890" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" type="password" placeholder="••••••••" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" type="password" placeholder="••••••••" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => setStep('choose')} 
                      variant="ghost"
                      className="w-full"
                    >
                      ← Back
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          )}

          {step === 'login' && (
            <>
              <CardHeader className="text-center">
                <CardTitle>Student Login</CardTitle>
                <CardDescription>Sign in to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onStudentLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" placeholder="you@example.com" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-10" type="password" placeholder="••••••••" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                    <Button 
                      type="button"
                      onClick={() => setStep('choose')} 
                      variant="ghost"
                      className="w-full"
                    >
                      ← Back
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
