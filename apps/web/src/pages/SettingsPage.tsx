import React, { useState, useEffect } from 'react';
import {
  User,
  Sliders,
  Bell,
  Shield,
  Globe,
  Save,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
//  SettingsPage — User & Organization Settings
// ─────────────────────────────────────────────────────────────────────────────

export function SettingsPage(): React.ReactElement {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'security' | 'language'>('profile');

  const [profile, setProfile] = useState({
    name: user?.name || 'Compliance Officer',
    email: user?.email || 'compliance.officer@enterprise.in',
    organization: user?.organizationName || 'National Industrial Corporation',
    role: user?.role === 'ADMIN' ? 'Enterprise Administrator' : 'Compliance Officer',
    phone: '+91 98765 43210',
    msmeRegNo: 'UDYAM-TN-01-0012345',
  });

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        organization: user.organizationName || prev.organization,
        role: user.role === 'ADMIN' ? 'Enterprise Administrator' : 'Compliance Officer',
      }));
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'success',
      title: 'Settings Saved (Demo)',
      message: 'Your workspace preferences have been updated.',
    });
  };

  const navItems = [
    { id: 'profile', label: 'Profile & Organization', icon: User },
    { id: 'preferences', label: 'Workspace Preferences', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Access', icon: Shield },
    { id: 'language', label: 'Language & Region', icon: Globe },
  ] as const;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <div className="pb-4 border-b border-surface-border">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Settings & Preferences
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your enterprise profile, team permissions, notification rules, and regulatory alert preferences.
        </p>
      </div>

      {/* ── Settings Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer ${
                  active
                    ? 'bg-accent-50 text-accent-700 font-bold'
                    : 'text-text-secondary hover:bg-white hover:text-text-primary'
                }`}
              >
                <Icon size={16} className={active ? 'text-accent-600' : 'text-text-muted'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Tab Content */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <form onSubmit={handleSave}>
                <CardHeader>
                  <CardTitle>Profile & Organization Details</CardTitle>
                  <CardDescription>
                    Information used to auto-populate BIS standard application dossiers and laboratory bookings.
                  </CardDescription>
                </CardHeader>

                <CardBody className="space-y-5">
                  <div className="flex items-center gap-4 pb-4 border-b border-surface-border">
                    <Avatar name={profile.name} size="lg" />
                    <div>
                      <h2 className="text-sm font-bold text-text-primary">{profile.name}</h2>
                      <p className="text-xs text-text-secondary">{profile.role}</p>
                      <span className="inline-block mt-1 text-[11px] font-medium text-accent-600 bg-accent-50 px-2 py-0.5 rounded">
                        Enterprise Admin
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                    <Input
                      label="Official Email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Organization / Company Name"
                      value={profile.organization}
                      onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                    />
                    <Input
                      label="Designation / Role"
                      value={profile.role}
                      onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Contact Number"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                    <Input
                      label="Udyam / MSME Registration No."
                      value={profile.msmeRegNo}
                      onChange={(e) => setProfile({ ...profile, msmeRegNo: e.target.value })}
                    />
                  </div>
                </CardBody>

                <CardFooter className="flex justify-end">
                  <Button type="submit" variant="primary" icon={Save}>
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card>
              <CardHeader>
                <CardTitle>Workspace Preferences</CardTitle>
                <CardDescription>
                  Configure display defaults and regulatory auto-mapping triggers.
                </CardDescription>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-page border border-surface-border">
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Gazette Regulatory Alert Feed
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Receive instant notices when a new Quality Control Order (QCO) affects your categories.
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded border-surface-border" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-page border border-surface-border">
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Automatic Document Clause Pre-Validation
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Run automated OCR checks whenever test certificates are uploaded.
                    </p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded border-surface-border" />
                </div>
              </CardBody>
              <CardFooter className="flex justify-end">
                <Button variant="primary" icon={Save} onClick={handleSave}>
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Choose how you want to be alerted for compliance deadlines and laboratory test results.
                </CardDescription>
              </CardHeader>
              <CardBody className="space-y-3">
                {['Email Notifications for License Renewal', 'SMS Alerts for Lab Sample Dispatch', 'Weekly Compliance Status Digest'].map((item, idx) => (
                  <label key={idx} className="flex items-center justify-between p-3 rounded-lg bg-surface-page border border-surface-border cursor-pointer">
                    <span className="text-xs font-medium text-text-primary">{item}</span>
                    <input type="checkbox" defaultChecked className="rounded border-surface-border" />
                  </label>
                ))}
              </CardBody>
              <CardFooter className="flex justify-end">
                <Button variant="primary" icon={Save} onClick={handleSave}>
                  Save Notification Settings
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle>Security & Access Control</CardTitle>
                <CardDescription>
                  Two-factor authentication and session security settings.
                </CardDescription>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="p-3 bg-surface-muted/50 rounded-lg border border-surface-border text-xs text-text-secondary">
                  Authentication infrastructure (JWT, Aadhaar/DigiLocker verification, RBAC) will be implemented in Phase 2.
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'language' && (
            <Card>
              <CardHeader>
                <CardTitle>Language & Regionalization</CardTitle>
                <CardDescription>
                  Select your preferred interface language.
                </CardDescription>
              </CardHeader>
              <CardBody className="space-y-4">
                <Select
                  label="Default Platform Language"
                  options={[
                    { value: 'en', label: 'English (Default)' },
                    { value: 'hi', label: 'हिन्दी (Hindi)' },
                    { value: 'ta', label: 'தமிழ் (Tamil)' },
                    { value: 'te', label: 'తెలుగు (Telugu)' },
                    { value: 'bn', label: 'বাংলা (Bengali)' },
                    { value: 'mr', label: 'मराठी (Marathi)' },
                  ]}
                  value="en"
                  hint="Multilingual assistance support connects in Phase 7"
                />
              </CardBody>
              <CardFooter className="flex justify-end">
                <Button variant="primary" icon={Save} onClick={handleSave}>
                  Save Language
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
