'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import {
  Mail,
  Lock,
  Sparkles,
  Store,
  ShieldCheck,
  Zap,
  BarChart3,
  Globe,
  ArrowRight,
  TrendingUp,
  Package,
  Users,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Loading from '@/app/loading/page';
import BackgroundBeams from '@/components/ui/BackgroundBeams';
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL
// --- SUB-COMPONENTS FOR THE MARKETING SIDE ---

const FeatureItem = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group"
  >
    <div className="p-3 rounded-xl bg-amber-400/10 text-amber-400 group-hover:scale-110 transition-transform shadow-lg shadow-amber-400/5">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-white font-bold text-lg mb-1 group-hover:text-amber-300 transition-colors">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const Login = () => {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading, loginMutation } = useAuth();
  const { companyName, logoUrl } = useSettings();

  const [signinIdentifier, setSigninIdentifier] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const userPrimaryRole = user.role ? user.role.toLowerCase() : 'customer';
      router.replace(`/${userPrimaryRole}/dashboard`);
    }
  }, [isAuthenticated, user, authLoading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const trimmedIdentifier = signinIdentifier.trim();
    if (!trimmedIdentifier) return toast.error('Please enter email');
    if (!signinPassword) return toast.error('Please enter password');

    const toastId = toast.loading('Signing in...');
    try {
      const result = await loginMutation.mutateAsync({
        email: trimmedIdentifier,
        password: signinPassword,
      });

      toast.success('Login successful!', {
        id: toastId,
        description: `Welcome back, ${result.data.user.firstName}!`,
      });
    } catch (error) {
      const errorMessage = error?.data?.message || error?.message || 'Login failed.';
      setLoginError(errorMessage);
      toast.error('Login Failed', { id: toastId, description: errorMessage });
    }
  };

  if (authLoading || isAuthenticated) return <Loading />;

  return (
    <div className="min-h-screen bg-neutral-950 overflow-hidden flex flex-col lg:flex-row relative">
      {/* Global Animated Background */}
      <div className="absolute inset-0 z-0">
        <BackgroundBeams />
        <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 to-transparent pointer-events-none" />
      </div>

      {/* --- LEFT SIDE: MARKETING & FEATURES --- */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 flex-col justify-between overflow-hidden">
        <div className="relative z-10">
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-16"
          >
            {logoUrl ? (
              <div className="h-20 w-20 overflow-hidden pt-3 rounded-md">
                <img src={logoUrl} alt="Logo"  />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
                <Store className="text-black h-7 w-7" />
              </div>
            )}
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">{companyName}</h1>
          </motion.div>

          <div className="max-w-md space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-5xl font-black text-white leading-tight mb-6">
                Next-Gen <span className="text-amber-400">Retail</span> Intelligence.
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed font-light">
                Empower your business with real-time analytics, seamless inventory, and secure branch management.
              </p>
            </motion.div>

            <div className="space-y-4">
              <FeatureItem
                icon={Zap}
                title="Lightning Fast Checkout"
                description="Optimize throughput with our sub-50ms hybrid search engine."
                delay={0.4}
              />
              <FeatureItem
                icon={BarChart3}
                title="Unified Analytics"
                description="Consolidated reporting across all branches in a single view."
                delay={0.5}
              />
              <FeatureItem
                icon={ShieldCheck}
                title="Enterprise Security"
                description="Granular permissions and hierarchical data isolation."
                delay={0.6}
              />
            </div>
          </div>
        </div>

        {/* Subtle decorative circle */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]" />
      </div>

      {/* --- RIGHT SIDE: LOGIN FORM --- */}
      <div className="flex-1 relative flex items-center justify-center p-6 md:p-12 lg:p-24 overflow-y-auto">
        {/* Mobile Logo Only */}
        <div className="lg:hidden absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
          {logoUrl ? (
            <div className="h-20 w-20 rounded-xl overflow-hidden  p-1 backdrop-blur-sm">
              <img src={logoUrl} alt="Logo" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
              {/* <Store className="text-black h-7 w-7" /> */}
            </div>
          )}
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">{companyName}</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">System Login</h3>
            <p className="text-gray-500 font-medium tracking-wide">Enter your authorized credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-amber-400 ml-1">Email Identifier</Label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-amber-500 to-amber-600 rounded-xl opacity-0 group-focus-within:opacity-20 transition-opacity" />
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    className="h-14 pl-12 bg-neutral-900 border-white/10 rounded-xl text-white focus:border-amber-400/50 focus:ring-0"
                    value={signinIdentifier}
                    onChange={e => setSigninIdentifier(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-amber-400">Security PIN / Password</Label>
                <button type="button" className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">Forgot Access?</button>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-amber-500 to-amber-600 rounded-xl opacity-0 group-focus-within:opacity-20 transition-opacity" />
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-14 pl-12 bg-neutral-900 border-white/10 rounded-xl text-white focus:border-amber-400/50 focus:ring-0 tracking-widest"
                    value={signinPassword}
                    onChange={e => setSigninPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center"
              >
                {loginError}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-14 bg-amber-400 hover:bg-amber-500 text-black font-black rounded-xl shadow-[0_8px_30px_rgb(251,191,36,0.2)] transition-all active:scale-[0.98] group"
            >
              {loginMutation.isPending ? (
                <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>ENTER TERMINAL</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-2 text-gray-500">
                <CheckCircle2 size={14} className="text-amber-400/50" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Active Sessions: 12</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 justify-end">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-tight">Ver 4.2.0-POS</span>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Desktop subtle footer */}
        <div className="hidden lg:block absolute bottom-12 right-12">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
            Powered by Clickmasters &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;