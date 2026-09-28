import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Mail, Building, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { ApiClientError } from '@/services/api';

// ─────────────────────────────────────────────────────────────────────────────
//  RegisterPage — Enterprise Registration Portal (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

export function RegisterPage(): React.ReactElement {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    password: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const passwordLengthMet = formData.password.length >= 8;
  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!name) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email) {
      setErrorMessage('Please enter your official email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        name,
        email,
        password,
        organizationName: formData.organization.trim() || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message || 'Registration failed. Please try again.');
      } else {
        setErrorMessage('Unable to connect to registration service. Please try again.');
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
          Create an enterprise compliance workspace
        </p>
      </div>

      {/* Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Card className="shadow-lg border-surface-border">
          <CardBody className="p-6 sm:p-8">
            <h2 className="text-base font-bold text-text-primary mb-1">
              Enterprise Registration
            </h2>
            <p className="text-xs text-text-secondary mb-6">
              Register to begin guided Indian Standards and BIS compliance.
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

            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <Input
                label="Full Name *"
                icon={User}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Compliance Officer Name"
                disabled={isSubmitting}
                autoComplete="name"
                required
              />

              <Input
                label="Official Email *"
                type="email"
                icon={Mail}
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="officer@company.com"
                disabled={isSubmitting}
                autoComplete="email"
                required
              />

              <Input
                label="Organization / Company Name (Optional)"
                icon={Building}
                value={formData.organization}
                onChange={(e) => {
                  setFormData({ ...formData, organization: e.target.value });
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g., Bharat Appliances Ltd."
                disabled={isSubmitting}
                autoComplete="organization"
              />

              <Input
                label="Password *"
                type="password"
                icon={Lock}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="At least 8 characters"
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />

              <Input
                label="Confirm Password *"
                type="password"
                icon={Lock}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Re-enter password"
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />

              {/* Password Requirement Indicator */}
              <div className="space-y-1 pt-1 pb-1">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2
                    size={13}
                    className={passwordLengthMet ? 'text-status-success' : 'text-text-muted'}
                  />
                  <span className={passwordLengthMet ? 'text-text-primary font-medium' : 'text-text-muted'}>
                    Minimum 8 characters
                  </span>
                </div>
                {formData.confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2
                      size={13}
                      className={passwordsMatch ? 'text-status-success' : 'text-status-danger'}
                    />
                    <span className={passwordsMatch ? 'text-status-success font-medium' : 'text-status-danger'}>
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                icon={ArrowRight}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Workspace...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-surface-border text-center text-xs text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-accent-600 hover:text-accent-700 font-semibold">
                Sign in
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
