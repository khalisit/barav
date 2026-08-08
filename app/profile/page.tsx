'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Camera, KeyRound, Save } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { profileSchema, changePasswordSchema, type ProfileFormValues, type ChangePasswordFormValues } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/components/auth-provider';
import { getInitials } from '@/lib/format';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      bio: '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onProfileSave = (_values: ProfileFormValues) => {
    toast.success('Profile updated successfully');
  };

  const onPasswordChange = (_values: ChangePasswordFormValues) => {
    toast.success('Password changed successfully');
    passwordForm.reset();
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Profile"
        description="Manage your personal account settings"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Profile' }]}
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Avatar</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                      {getInitials(user?.name ?? 'Admin')}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => toast.info('File picker would open here')}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110"
                    aria-label="Change avatar"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-4 text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role.replace('_', ' ')}</p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" {...profileForm.register('name')} />
                      {profileForm.formState.errors.name && (
                        <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" {...profileForm.register('email')} />
                      {profileForm.formState.errors.email && (
                        <p className="text-xs text-destructive">{profileForm.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" rows={4} placeholder="Tell us about yourself" {...profileForm.register('bio')} />
                  </div>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" {...passwordForm.register('currentPassword')} />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" {...passwordForm.register('newPassword')} />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" {...passwordForm.register('confirmPassword')} />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit">
                  <KeyRound className="mr-2 h-4 w-4" /> Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
