import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { ApiClientError } from '@/services/api';

// ─────────────────────────────────────────────────────────────────────────────
//  LoginPage — Production Authentication Portal (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

export function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Retrieve previous target location if redirected by ProtectedRoute
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: trimmedEmail, password });
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message || 'Invalid email or password.');
      } else {
        setErrorMessage('Unable to connect to authentication service. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-page flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-500 text-white shadow-sm mb-3">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          BIS Intelligent Platform
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Ministry of Consumer Affairs, Food & Public Distribution (SIH26107)
        </p>
      </div>

      {/* Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg border-surface-border">
          <CardBody className="p-6 sm:p-8">
            <h2 className="text-base font-bold text-text-primary mb-1">
              Welcome back
            </h2>
            <p className="text-xs text-text-secondary mb-6">
              Sign in to access your Indian Standards compliance workspace.
            </p>

            {/* Error Alert Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-status-danger text-xs animate-in fade-in duration-200"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4" noValidate>
              <Input
                label="Official Email Address"
                type="email"
                icon={Mail}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="name@company.com"
                disabled={isSubmitting}
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                type="password"
                icon={Lock}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••••••"
                disabled={isSubmitting}
                autoComplete="current-password"
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                icon={ArrowRight}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-surface-border text-center text-xs text-text-secondary">
              Don&apos;t have a workspace account?{' '}
              <Link to="/register" className="text-accent-600 hover:text-accent-700 font-semibold">
                Register enterprise
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
