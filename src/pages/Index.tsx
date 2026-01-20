import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ArrowRight, BarChart3, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, Variants } from 'framer-motion';
import companyLogo from '@/assets/company-logo.png';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (role === 'student') {
        navigate('/student');
      } else if (role === 'admin' || role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, role, loading, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="container mx-auto px-6 py-24 relative text-center"
        >
          <motion.div variants={scaleIn} className="flex justify-center mb-8">
            <motion.img 
              src={companyLogo} 
              alt="TSS Logo" 
              className="h-24 w-24 rounded-3xl shadow-2xl object-contain"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
          </motion.div>
          <motion.h1 variants={fadeInUp} className="text-5xl font-bold text-foreground mb-6">
            TSS Tracker
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track your projects with automatic SLA monitoring. Know when tasks breach their expected completion time.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="gradient-primary text-lg px-8" onClick={() => navigate('/auth')}>
                Employee Login <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="container mx-auto px-6 py-24"
      >
        <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-center text-foreground mb-12">
          Features
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Clock, title: 'SLA Tracking', desc: 'Auto-detect when tasks breach expected completion time.', color: 'text-primary' },
            { icon: BarChart3, title: 'Analytics', desc: 'Dashboards and charts for team performance insights.', color: 'text-accent' },
            { icon: Shield, title: 'Role-Based Access', desc: 'Admins manage users, team members focus on their work.', color: 'text-success' },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              className="bg-card rounded-2xl p-8 shadow-lg border transition-all duration-300"
            >
              <motion.div
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <feature.icon className={`h-10 w-10 ${feature.color} mb-4`} />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
