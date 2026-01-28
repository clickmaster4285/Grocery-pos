'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Github, Linkedin, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLogin, useRegister, useGetMe } from '@/features/authApi';
import { toast } from 'sonner';

// ✅ Responsive AnimatedBackground
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-linear-to-br from-background via-background to-muted">
      {/* Animated Curvy Lines - Hidden on mobile */}
      <svg
        className="absolute inset-0 w-full h-full hidden sm:block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.1"
            />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Lines */}
        <path
          d="M -200 100 Q 200 200, 600 150 T 1400 200 T 2200 100"
          stroke="url(#gradient1)"
          strokeWidth="3"
          fill="none"
          className="animate-[draw_20s_ease-in-out_infinite]"
        />
        <path
          d="M -100 250 Q 300 300, 700 280 T 1500 320 T 2300 250"
          stroke="url(#gradient2)"
          strokeWidth="2.5"
          fill="none"
          className="animate-[draw_25s_ease-in-out_infinite_reverse]"
        />
        <path
          d="M -150 400 Q 250 500, 650 420 T 1450 480 T 2250 400"
          stroke="url(#gradient3)"
          strokeWidth="2"
          fill="none"
          className="animate-[draw_30s_ease-in-out_infinite]"
        />
        <path
          d="M -100 550 Q 350 600, 750 570 T 1550 620 T 2350 550"
          stroke="url(#gradient1)"
          strokeWidth="2.5"
          fill="none"
          className="animate-[draw_22s_ease-in-out_infinite_reverse]"
        />
        <path
          d="M -200 700 Q 200 800, 600 720 T 1400 780 T 2200 700"
          stroke="url(#gradient2)"
          strokeWidth="3"
          fill="none"
          className="animate-[draw_28s_ease-in-out_infinite]"
        />
      </svg>

      {/* Floating Orbs */}
      <div className="absolute top-10 left-4 w-40 h-40 sm:top-20 sm:left-10 sm:w-64 sm:h-64 bg-primary/10 rounded-full blur-3xl animate-[float_15s_ease-in-out_infinite]" />
      <div className="absolute top-20 right-8 w-48 h-48 sm:top-40 sm:right-20 sm:w-80 sm:h-80 bg-purple-500/10 rounded-full blur-3xl animate-[float_20s_ease-in-out_infinite_reverse]" />
      <div className="absolute bottom-10 left-1/4 w-44 h-44 sm:bottom-20 sm:left-1/3 sm:w-72 sm:h-72 bg-indigo-500/10 rounded-full blur-3xl animate-[float_18s_ease-in-out_infinite]" />

      {/* Gradient Mesh Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%),radial-gradient(circle_at_70%_80%,hsl(var(--primary)/0.1),transparent_50%)]" />
    </div>
  );
}

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const router = useRouter();
  const { data: user, isLoading, error } = useGetMe();
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  // ✅ One field for email or phone
  const [signinIdentifier, setSigninIdentifier] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Sign up form state (cleaned duplicate phone)
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'technician',
    department: 'installation',
  });
  const [signupError, setSignupError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    // Decide if user entered email or phone
    const trimmed = signinIdentifier.trim();
    const isPhone = /^\+?[0-9\s\-]{7,15}$/.test(trimmed);

    // Validate input
    if (!trimmed) {
      toast.error('Please enter email or phone number');
      return;
    }

    if (!signinPassword) {
      toast.error('Please enter password');
      return;
    }

    const payload = {
      password: signinPassword,
    };

    if (isPhone) {
      payload.phone = trimmed;
    } else {
      // Check if it looks like an email
      if (trimmed.includes('@')) {
        payload.email = trimmed;
      } else {
        toast.error('Please enter a valid email or phone number');
        return;
      }
    }

    try {
      const toastId = toast.loading('Signing in...');
      const result = await loginMutation.mutateAsync(payload);

      if (result.data.success) {
        // Update toast to success
        toast.success('Login successful!', {
          id: toastId,
          description: `Welcome back, ${result.data.user.name}!`,
        });

        // Wait a moment for the auth state to update
        setTimeout(() => {
          const userRole = result.data.user.role;
          router.push(`/${userRole}/dashboard/`);
        }, 100);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please check your credentials.';

      setLoginError(errorMessage);
      toast.error('Login Failed', {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const isPhoneInput =
    signinIdentifier &&
    /^\+?[0-9\s\-]+$/.test(signinIdentifier) &&
    !signinIdentifier.includes('@');

  return (
    <>
      <AnimatedBackground />

      <div className="min-h-screen flex items-center justify-center /80 p-4">
        {/* Main Container */}
        <div className="relative w-full max-w-4xl h-auto min-h-[600px] sm:h-[600px] bg-card rounded-3xl shadow-2xl overflow-hidden">
          {/* Mobile header */}
          <div className="sm:hidden w-full bg-primary p-5 rounded-md text-white space-y-1 py-3">
            <h2 className="text-lg font-semibold pt-3">Welcome back</h2>
            <p className="text-sm opacity-90 pb-3">
              Enter your details to access your account.
            </p>
          </div>

          {/* Animated Overlay Panel - Desktop only */}
          <div
            className={`hidden sm:flex absolute top-0 h-full w-1/2 bg-primary z-10 transition-all duration-700 ease-in-out items-center justify-center text-card ${isSignUp
                ? 'left-0 rounded-r-[200px]'
                : 'left-1/2 rounded-l-[200px]'
              }`}
          >
            <div className="text-center px-8 lg:px-12">
              {isSignUp ? (
                <div className="animate-fade-in">
                  <h2 className="text-2xl lg:text-4xl font-bold mb-4">
                    Welcome Back!
                  </h2>
                  <p className="mb-6 lg:mb-8 opacity-90 text-sm lg:text-base">
                    Enter your details to access your account.
                  </p>
                </div>
              ) : (
                <div className="animate-fade-in"></div>
              )}
            </div>
          </div>

          {/* Sign In Form */}
          <div
            className={`w-full sm:absolute top-0 right-0 sm:w-1/2 h-full flex items-center justify-center p-6 sm:p-12 transition-all duration-700 ${isSignUp
                ? 'block'
                : 'sm:opacity-0 sm:pointer-events-none hidden sm:block'
              }`}
          >
            <div className="w-full max-w-sm">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Sign in to Account
              </h2>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                Use your email or phone number to log in.
              </p>

              {/* Social buttons */}
              <div className="flex gap-2 sm:gap-3 mb-6 justify-center sm:justify-start">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg w-10 h-10 sm:w-12 sm:h-12 border-border hover:bg-secondary"
                >
                  {/* Google icon */}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg w-10 h-10 sm:w-12 sm:h-12 border-border hover:bg-secondary"
                >
                  {/* Facebook icon */}
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg w-10 h-10 sm:w-12 sm:h-12 border-border hover:bg-secondary"
                >
                  <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg w-10 h-10 sm:w-12 sm:h-12 border-border hover:bg-secondary"
                >
                  <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              <form className="space-y-4" onSubmit={handleLogin}>
                {/* Email or Phone */}
                <div>
                  <Label htmlFor="signin-identifier" className="sr-only">
                    Email or phone number
                  </Label>
                  <div className="relative">
                    {isPhoneInput ? (
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    ) : (
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    )}

                    <Input
                      id="signin-identifier"
                      type="text"
                      placeholder="Email or phone number"
                      className="pl-10 h-11 sm:h-12 bg-secondary border-0 rounded-lg text-sm sm:text-base"
                      value={signinIdentifier}
                      onChange={(e) => setSigninIdentifier(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="signin-password" className="sr-only">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Password"
                      className="pl-10 h-11 sm:h-12 bg-secondary border-0 rounded-lg text-sm sm:text-base"
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {loginError && (
                  <p className="text-sm text-red-500">{loginError}</p>
                )}

                <button
                  type="button"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors inline-block"
                >
                  Forgot your password?
                </button>

                <Button
                  type="submit"
                  disabled={loginMutation.isLoading}
                  className="w-full h-11 sm:h-12 rounded-full bg-primary hover:bg-primary/90 text-card font-semibold text-sm sm:text-base"
                >
                  {loginMutation.isLoading ? 'Signing In...' : 'LOG IN'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;