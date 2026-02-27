'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import {
  Mail,
  Lock,
  Store,
  ShieldCheck,
  Zap,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Phone,
  MapPin,
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
    className="flex items-start gap-4 p-4 hover:scale-x-110 hover:scale-y-105 transition-transform duration-300 rounded-2xl backdrop-blur-xs bg-white/2 border hover:bg-white/5 transition-colors group"
  >
    <div className="p-3 r`ounded-xl bg-amber-400/10 text-amber-400 group-hover:scale-110 transition-transform shadow-lg shadow-amber-400/5">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-gray-800 font-bold text-lg mb-1 group-hover:text-amber-300 transition-colors">{title}</h3>
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
    <div className="bg-neutral-950 overflow-hidden flex flex-col lg:flex-row relative">
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
            className="flex items-center gap-3 mb-10"
          >
            {logoUrl ? (
              <div className="h-16 w-16 overflow-hidden pt-2 rounded-md">
                <img src={logoUrl} alt="Logo" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
                <Store className="text-black h-6 w-6" />
              </div>
            )}
            <h1 className="text-xl font-black text-neutral-900 tracking-tighter uppercase">{companyName}</h1>
          </motion.div>

          <div className="max-w-md space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-5xl font-black text-neutral-900 leading-[1.1] mb-4 tracking-tight">
                Next-Gen <br />
                <span className="text-amber-500">Retail</span> Intelligence.
              </h2>
              <p className="text-neutral-500 text-lg leading-relaxed font-semibold max-w-sm">
                Empower your business with real-time analytics, seamless inventory, and secure branch management.
              </p>
            </motion.div>

            <div className="space-y-3">
              <FeatureItem
                icon={Zap}
                title="Lightning Fast Checkout"
                description="Optimize throughput with our sub-50ms search engine."
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
      <div className="flex-1 relative flex items-center justify-center p-6 md:p-8 lg:p-12 overflow-y-auto bg-white/5 backdrop-blur-xs border-l border-neutral-200 h-screen">
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
          <h1 className="text-2xl font-bold text-gray-800 tracking-tighter uppercase">{companyName}</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:text-left">
            <h3 className="text-3xl font-black text-neutral-900 mb-1 tracking-tight">System Login</h3>
            <p className="text-neutral-500 text-xs font-semibold tracking-wide">Enter your authorized credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-bold uppercase tracking-widest text-amber-400 ml-1">Email Identifier</Label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-amber-500 to-amber-600 rounded-xl opacity-0 group-focus-within:opacity-20 transition-opacity" />
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    className="h-14 pl-12 bg-neutral-200 border-white/10 rounded-xl text-gray-800 focus:border-amber-400/50 focus:ring-0"
                    value={signinIdentifier}
                    onChange={e => setSigninIdentifier(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[13px] font-bold uppercase tracking-widest text-amber-400">Security PIN / Password</Label>
                <button type="button" className="text-[10px] font-bold uppercase text-gray-500 hover:text-gray-800 transition-colors">Forgot Access?</button>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-amber-500 to-amber-600 rounded-xl opacity-0 group-focus-within:opacity-20 transition-opacity" />
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-14 pl-12 bg-neutral-200 border-white/10 rounded-xl text-gray-800 focus:border-amber-400/50 focus:ring-0 tracking-widest"
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
              className="w-full h-14 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-xl shadow-[0_8px_30px_rgb(251,191,36,0.2)] transition-all active:scale-[0.98] group"
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

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-neutral-100">
              <div className="flex items-center gap-2 text-neutral-400 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
              </div>
              <div className="flex items-center gap-2 text-neutral-400 justify-end bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest tabular-nums font-mono text-center">v4.2.0-POS</span>
              </div>
            </div>
          </form>

          {/* --- CONTACT INFO SECTION --- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <div className="grid grid-cols-1 gap-3 mb-4">
              <p className="text-neutral-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-neutral-100 pb-1.5">Support Center</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <Phone size={14} />
                  </div>
                  <p className="text-xs text-neutral-900 font-bold tabular-nums">0333-1116842 | 0332-5394285</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
                    <Mail size={14} />
                  </div>
                  <p className="text-xs text-neutral-900 font-bold">marketing@clickmasters.pk</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-neutral-50 border border-neutral-100">
              <MapPin size={16} className="text-rose-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-neutral-500 leading-relaxed font-semibold">
                Main PWD Rd, PWD Housing Society Sector A PWD Society, Islamabad, Punjab 45700, Pakistan
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => window.open('https://clickmasters.pk/contact-us/', '_blank')}
              className="w-full h-12 bg-white border-neutral-200 hover:bg-neutral-900 hover:text-white text-neutral-900 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all shadow-sm relative overflow-hidden group"
            >
              {/* Multi-color Shine Animation */}
              <motion.div
                initial={{ x: "-150%" }}
                animate={{ x: "150%" }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "linear",
                  repeatDelay: 0.5
                }}
                className="absolute inset-0 w-[80%] h-full bg-linear-to-r from-transparent via-amber-400/30 via-emerald-400/30 via-sky-400/30 to-transparent -skew-x-20 pointer-events-none"
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                Visit Contact Center <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Desktop subtle footer */}
        <div className="hidden lg:block absolute bottom-12 right-12">
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.17em]">
            Powered by Clickmasters &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;