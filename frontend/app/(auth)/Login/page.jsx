'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Loading from '@/app/loading/page';
import BackgroundBeams from '@/components/ui/BackgroundBeams';

const Login = () => {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading, loginMutation } = useAuth();

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

    if (!trimmedIdentifier) {
      toast.error('Please enter email');
      return;
    }

    if (!signinPassword) {
      toast.error('Please enter password');
      return;
    }

    const payload = {
      email: trimmedIdentifier,
      password: signinPassword,
    };

    const toastId = toast.loading('Signing in...');
    try {
      const result = await loginMutation.mutateAsync(payload);

      toast.success('Login successful!', {
        id: toastId,
        description: `Welcome back, ${result.data.user.firstName}!`,
      });

    } catch (error) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        'Login failed. Please check your credentials.';

      setLoginError(errorMessage);
      toast.error('Login Failed', {
        id: toastId,
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  if (authLoading || isAuthenticated) {
    return (
      <Loading />
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
        <BackgroundBeams />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center bg-transparent p-4 md:p-6">
        {/* Main Container - Enhanced Design */}
        <div className="relative w-full max-w-2xl h-auto bg-linear-to-br from-card/20 to-card/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-primary/10 overflow-hidden p-8 md:p-12">

          {/* Decorative top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-amber-400 to-transparent opacity-70" />

          {/* Logo/Brand area */}
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-amber-400" />
                <div className="absolute -inset-1 bg-amber-400/20 blur-md rounded-full" />
              </div>
              <span className="text-2xl font-bold tracking-tighter bg-linear-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                GroceryStore
              </span>
            </div>
          </div>

          {/* Header Section */}
          <div className="text-center mb-5">
            <p className="text-gray-400 text-base md:text-lg tracking-wide leading-relaxed font-light">
              Sign in to access your personalized dashboard
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email Input */}
            <div className="space-y-2.5">
              <Label htmlFor="signin-identifier" className="text-sm font-medium tracking-wide text-primary pl-1">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-linear-to-r from-amber-500/0 via-amber-400/10 to-amber-500/0 rounded-xl blur-sm group-focus-within:blur-md transition-all duration-300" />
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70" />
                  <Input
                    id="signin-identifier"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-12 h-14 bg-card/10 border border-white/20 rounded-xl text-base placeholder:text-gray-400 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300 text-white font-medium tracking-wide"
                    value={signinIdentifier}
                    onChange={(e) => setSigninIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2.5">
              <Label htmlFor="signin-password" className="text-sm font-medium tracking-wide text-primary pl-1">
                Password
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-linear-to-r from-amber-500/0 via-amber-400/10 to-amber-500/0 rounded-xl blur-sm group-focus-within:blur-md transition-all duration-300" />
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400/70" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 h-14 bg-card/10 border border-white/20 rounded-xl text-base placeholder:text-gray-400 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 tracking-widest transition-all duration-300 text-white font-medium"
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400 text-center font-medium tracking-wide">
                  {loginError}
                </p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-14 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-base tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  LOGIN
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </Button>

            {/* Help Text */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-center text-sm text-muted-foreground/90 tracking-wide">
                Need help?{' '}
                <a href="#" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
                  Contact Support
                </a>
              </p>
            </div>
          </form>

          {/* Decorative bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-amber-400/50 to-transparent opacity-50" />
        </div>
      </div>
    </>
  );
};

export default Login;