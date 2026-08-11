'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Camera, KeyRound, Save, ShieldCheck, User as UserIcon, LogOut, CheckCircle2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/components/auth-provider';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { useLogout } from '@/features/auth/hooks/use-auth-mutations';
import { getInitials } from '@/lib/format';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useLanguage } from '@/hooks/use-language';

// Schemas for validation
const profileSchema = z.object({
  username: z.string().min(3, 'ناوی بەکارهێنەر دەبێت لانی کەم ٣ پیت بێت'),
  avatarUrl: z.string().optional().or(z.literal('')),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'وشەی تێپەڕ دەبێت لانی کەم ٦ پیت بێت'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'وشەی تێپەڕی نوێ و دووبارەکردنەوەی یەکناگرنەوە',
  path: ['confirmPassword']
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { setUser } = useAuthStore();
  const logout = useLogout();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const previewImage = selectedFile ? URL.createObjectURL(selectedFile) : user?.avatarUrl;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.name ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      let finalAvatarUrl = values.avatarUrl;
      let finalAvatarKey = undefined;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        // Upload to Cloudflare Worker R2 endpoint
        const client = (await import('@/lib/api-client')).default;
        const uploadRes = await client.post('/media-items/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (uploadRes.data?.success) {
          // Send only the key to the backend to keep the database clean
          finalAvatarUrl = uploadRes.data.data.key;
          finalAvatarKey = uploadRes.data.data.key;
        }
      }

      return api.put(`/admins/${user!.id}`, { 
        username: values.username, 
        avatarKey: finalAvatarKey
      });
    },
    onSuccess: (res: any) => {
      // Update global user state without reloading the page
      if (res) {
        setUser({
          ...user!,
          name: res.username || user!.name,
          avatarUrl: res.avatarUrl || user!.avatarUrl,
        });
      }
      setSelectedFile(null); // Clear selected file to show new avatarUrl
      toast.success(language === 'ku' ? 'پڕۆفایلەکە بە سەرکەوتوویی نوێکرایەوە' : 'Profile updated successfully');
    },
    onError: () => {
      toast.error(language === 'ku' ? 'هەڵەیەک ڕوویدا لە کاتی نوێکردنەوەدا' : 'Error updating profile');
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (values: ChangePasswordFormValues) => {
      return api.put(`/admins/${user!.id}`, { password: values.newPassword });
    },
    onSuccess: () => {
      toast.success(language === 'ku' ? 'وشەی تێپەڕ بە سەرکەوتوویی گۆڕدرا' : 'Password changed successfully');
      passwordForm.reset();
    },
    onError: () => {
      toast.error(language === 'ku' ? 'هەڵەیەک ڕوویدا لە کاتی گۆڕینی وشەی تێپەڕدا' : 'Error changing password');
    }
  });

  const onProfileSave = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  const onPasswordChange = (values: ChangePasswordFormValues) => {
    updatePasswordMutation.mutate(values);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'ku' ? 'قەبارەی وێنەکە نابێت لە ٢ مێگابایت زیاتر بێت' : 'Image size must be less than 2MB');
      return;
    }

    setSelectedFile(file);
    profileForm.setValue('avatarUrl', 'pending_upload', { shouldDirty: true });
  };

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'ڕێکخستنەکانی پڕۆفایل' : 'Profile Settings'}
        description={language === 'ku' ? 'زانیارییە کەسییەکانت ڕێکبخە و وێنەکەت بگۆڕە' : 'Manage your personal account settings and avatar'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'پڕۆفایل' : 'Profile' }]}
      />

      <Tabs defaultValue="profile" className="w-full max-w-4xl mx-auto space-y-8 mt-4">
        <div className="flex justify-center border-b pb-1">
          <TabsList className="bg-transparent space-x-4 space-x-reverse w-full max-w-sm justify-center">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-full px-6 transition-all"
            >
              <UserIcon className="h-4 w-4 me-2" />
              {language === 'ku' ? 'زانیارییەکان' : 'Details'}
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning data-[state=active]:shadow-none rounded-full px-6 transition-all"
            >
              <KeyRound className="h-4 w-4 me-2" />
              {language === 'ku' ? 'ئاسایش' : 'Security'}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="focus:outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-8 md:grid-cols-12">
            
            {/* Avatar Section */}
            <Card className="md:col-span-4 border-none shadow-md overflow-hidden bg-gradient-to-b from-primary/5 to-transparent h-fit">
              <CardContent className="flex flex-col items-center pt-8 pb-6">
                <div className="relative group cursor-pointer" onClick={handleImageClick}>
                  <Avatar className="h-32 w-32 shadow-xl ring-4 ring-background transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/20">
                    <AvatarImage src={previewImage || undefined} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-4xl font-bold text-primary">
                      {getInitials(user?.name ?? 'Admin')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleFileChange}
                  />
                </div>
                
                <h3 className="mt-5 text-xl font-bold tracking-tight">{user?.name}</h3>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {language === 'ku' ? 'بەڕێوەبەری سەرەکی' : 'Super Admin'}
                </div>
              </CardContent>
            </Card>

            {/* Profile Form Section */}
            <Card className="md:col-span-8 border-none shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{language === 'ku' ? 'گۆڕینی زانیارییەکان' : 'Edit Information'}</CardTitle>
                <CardDescription>
                  {language === 'ku' 
                    ? 'ئەگەر دەتەوێت ناوەکەت بگۆڕیت، لێرە بینووسە پاشان پاشەکەوتی بکە.' 
                    : 'Update your display name here.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="profile-form" onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">{language === 'ku' ? 'ناوی بەکارهێنەر' : 'Username'}</Label>
                    <Input 
                      id="username" 
                      className="h-12 bg-muted/30 focus-visible:bg-transparent text-base transition-colors" 
                      {...profileForm.register('username')} 
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-xs text-destructive">{profileForm.formState.errors.username.message}</p>
                    )}
                  </div>
                </form>
              </CardContent>
              <CardFooter className="pt-2 pb-6 px-6 flex justify-between items-center border-t border-muted/50 mt-6">
                <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => logout.mutate()}>
                  <LogOut className="h-4 w-4 me-2 rtl:rotate-180" />
                  {language === 'ku' ? 'چوونەدەرەوە' : 'Log out'}
                </Button>
                
                <Button 
                  type="submit" 
                  form="profile-form" 
                  size="lg" 
                  disabled={updateProfileMutation.isPending || (!profileForm.formState.isDirty && !selectedFile)}
                  className="rounded-full px-8 shadow-md"
                >
                  {updateProfileMutation.isPending ? (
                    language === 'ku' ? 'چاوەڕێبە...' : 'Saving...'
                  ) : (
                    <>
                      <CheckCircle2 className="me-2 h-4 w-4" /> 
                      {language === 'ku' ? 'پاشەکەوتکردن' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="focus:outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
            <Card className="w-full max-w-2xl border-none shadow-md">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-warning/10 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                  <KeyRound className="h-6 w-6 text-warning" />
                </div>
                <CardTitle className="text-xl">{language === 'ku' ? 'گۆڕینی وشەی تێپەڕ' : 'Change Password'}</CardTitle>
                <CardDescription>
                  {language === 'ku' ? 'دڵنیابە لە بەکارهێنانی وشەیەکی تێپەڕی بەهێز کە لە ٦ پیت زیاتر بێت.' : 'Ensure you use a strong password.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form id="password-form" onSubmit={passwordForm.handleSubmit(onPasswordChange)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{language === 'ku' ? 'وشەی تێپەڕی نوێ' : 'New Password'}</Label>
                    <PasswordInput 
                      id="new-password" 
                      className="h-12 bg-muted/30 focus-visible:bg-transparent" 
                      {...passwordForm.register('newPassword')} 
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{language === 'ku' ? 'دووبارەکردنەوەی وشەی تێپەڕی نوێ' : 'Confirm New Password'}</Label>
                    <PasswordInput 
                      id="confirm-password" 
                      className="h-12 bg-muted/30 focus-visible:bg-transparent" 
                      {...passwordForm.register('confirmPassword')} 
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </form>
              </CardContent>
              <CardFooter className="pt-4 pb-8 flex justify-center">
                <Button 
                  type="submit" 
                  form="password-form"
                  variant="default" 
                  size="lg" 
                  disabled={updatePasswordMutation.isPending || !passwordForm.formState.isDirty} 
                  className="w-full sm:w-2/3 rounded-full shadow-md bg-warning hover:bg-warning/90 text-warning-foreground"
                >
                  <KeyRound className="me-2 h-4 w-4" /> 
                  {updatePasswordMutation.isPending 
                    ? (language === 'ku' ? 'دەگۆڕدرێت...' : 'Changing...') 
                    : (language === 'ku' ? 'نوێکردنەوەی وشەی تێپەڕ' : 'Update Password')}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
