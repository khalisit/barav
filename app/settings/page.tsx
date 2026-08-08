'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [general, setGeneral] = useState({
    siteName: 'Barav Quiz',
    siteUrl: 'https://baravquiz.com',
    description: 'The ultimate quiz platform for competitive trivia.',
    supportEmail: 'support@baravquiz.com',
  });

  const [features, setFeatures] = useState({
    registration: true,
    emailVerification: false,
    twoFactor: true,
    maintenanceMode: false,
    liveChat: true,
    analytics: true,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Settings"
        description="Configure platform-wide settings and preferences"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Settings' }]}
      />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input id="site-name" value={general.siteName} onChange={(e) => setGeneral({ ...general, siteName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-url">Site URL</Label>
                  <Input id="site-url" value={general.siteUrl} onChange={(e) => setGeneral({ ...general, siteUrl: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={general.description} onChange={(e) => setGeneral({ ...general, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input id="support-email" type="email" value={general.supportEmail} onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })} />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feature Flags</CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'registration', label: 'User Registration', desc: 'Allow new users to sign up' },
                { key: 'emailVerification', label: 'Email Verification', desc: 'Require email verification for new accounts' },
                { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Enable 2FA for admin accounts' },
                { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Take the platform offline for maintenance' },
                { key: 'liveChat', label: 'Live Chat Support', desc: 'Enable in-app live chat' },
                { key: 'analytics', label: 'Analytics Tracking', desc: 'Collect usage analytics' },
              ].map((f) => (
                <div key={f.key} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                  <Switch
                    checked={features[f.key as keyof typeof features]}
                    onCheckedChange={(v) => setFeatures({ ...features, [f.key]: v })}
                  />
                </div>
              ))}
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security Settings</CardTitle>
              <CardDescription>Configure security policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input id="session-timeout" type="number" defaultValue={60} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-login">Max Login Attempts</Label>
                <Input id="max-login" type="number" defaultValue={5} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-policy">Password Policy</Label>
                <Textarea id="password-policy" defaultValue="Minimum 8 characters, at least 1 uppercase, 1 number" />
              </div>
              <Separator />
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">IP Whitelist</p>
                  <p className="text-xs text-muted-foreground">Restrict admin access to specific IPs</p>
                </div>
                <Switch />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integrations</CardTitle>
              <CardDescription>Connect external services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Stripe', desc: 'Payment processing', connected: true },
                { name: 'SendGrid', desc: 'Email delivery', connected: true },
                { name: 'Twilio', desc: 'SMS notifications', connected: false },
                { name: 'Slack', desc: 'Team notifications', connected: false },
              ].map((int) => (
                <div key={int.name} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">{int.name}</p>
                    <p className="text-xs text-muted-foreground">{int.desc}</p>
                  </div>
                  <Button variant={int.connected ? 'outline' : 'default'} size="sm">
                    {int.connected ? 'Connected' : 'Connect'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
