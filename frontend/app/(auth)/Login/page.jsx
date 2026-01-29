'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Loading from '@/app/loading';
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
        <Loading/>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
      <BackgroundBeams />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center bg-transparent p-4">
        {/* Main Container */}
        <div className="relative w-full max-w-2xl h-auto bg-card/5 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-12">
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2 text-center">
              Welcome Back!
            </h2>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base text-center">
              Sign in to your account.
            </p>

            <form className="space-y-4" onSubmit={handleLogin}>
              {/* Email */}
              <div>
                <Label htmlFor="signin-identifier" className="sr-only">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <Input
                    id="signin-identifier"
                    type="email"
                    placeholder="Email"
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
                <p className="text-sm text-red-500 text-center">{loginError}</p>
              )}

              <Button
                type="submit"
                disabled={loginMutation.isPending} // Use isPending for mutations
                className="w-full h-11 sm:h-12 rounded-full bg-primary hover:bg-primary/90 text-card font-semibold text-sm sm:text-base"
              >
                {loginMutation.isPending ? 'Signing In...' : 'LOG IN'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;