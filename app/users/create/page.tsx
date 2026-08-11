'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, User, Mail, Lock, AtSign, Phone, Shield } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useLanguage } from '@/hooks/use-language';

const userSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  status: z.enum(['active', 'banned']),
});

type UserFormValues = z.infer<typeof userSchema>;

export default function CreateUserPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      status: 'active',
    },
  });

  const watchUsername = watch('username');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!watchUsername || watchUsername.length < 3) {
      clearErrors('username');
      setIsUsernameAvailable(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await api.post<{ available: boolean }>('/users/check-availability', { field: 'username', value: watchUsername });
        if (!res.available) {
          setIsUsernameAvailable(false);
          setError('username', { type: 'manual', message: language === 'ku' ? 'ئەم ناوە پێشتر گیراوە' : 'Username is already taken' });
        } else {
          setIsUsernameAvailable(true);
          clearErrors('username');
        }
      } catch (err) {
        // Ignore API errors
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [watchUsername, language, setError, clearErrors]);

  const onSubmit = async (values: UserFormValues) => {
    try {
      const payload = {
        ...values,
        provider: 'email', // By default, manually created users use 'email' provider
      };

      const newUser = await api.post('/users', payload);

      if (!newUser) {
        throw new Error('Failed to create user');
      }

      toast.success(language === 'ku' ? 'بەکارهێنەرەکە بە سەرکەوتوویی دروستکرا' : 'User created successfully');
      router.push('/users');
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.error?.includes('unique constraint')) {
        toast.error(language === 'ku' ? 'ئەم ئیمەیڵە یان ناوی بەکارهێنەرە پێشتر بەکارهاتووە' : 'Email or Username already exists');
      } else {
        toast.error(language === 'ku' ? 'هەڵەیەک ڕوویدا لە کاتی دروستکردنی بەکارهێنەر' : 'An error occurred while creating the user');
      }
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'زیادکردنی بەکارهێنەر' : 'Add User'}
        description={language === 'ku' ? 'بەکارهێنەرێکی نوێ بۆ پلاتفۆرمەکە دروست بکە' : 'Create a new user manually for the platform'}
        breadcrumbs={[
          { label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' },
          { label: language === 'ku' ? 'بەکارهێنەران' : 'Users', href: '/users' },
          { label: language === 'ku' ? 'زیادکردن' : 'Add' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" /> {language === 'ku' ? 'گەڕانەوە' : 'Back'}
          </Button>
        }
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <Card className="border-t-4 border-t-primary shadow-sm">

            <CardContent className="grid gap-6 sm:grid-cols-2 pt-6">

              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-semibold">{language === 'ku' ? 'ناوی تەواو' : 'Full Name'}</Label>
                <div className="relative">
                  <User className="absolute ms-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="fullName" className="ps-10 bg-background" placeholder={language === 'ku' ? 'ناوی سیانی بنووسە' : 'Enter full name'} {...register('fullName')} />
                </div>
                {errors.fullName && <p className="text-sm text-destructive font-medium">{language === 'ku' ? 'ناو کورتە (لانی کەم ٣ پیت)' : errors.fullName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="font-semibold">{language === 'ku' ? 'ناوی بەکارهێنەر' : 'Username'}</Label>
                <div className="relative">
                  <AtSign className="absolute ms-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    dir="ltr"
                    className={`ps-10 bg-background ${errors.username ? 'border-destructive focus-visible:ring-destructive' : isUsernameAvailable ? 'border-success focus-visible:ring-success' : ''}`}
                    placeholder={language === 'ku' ? 'e.g. john_doe' : 'e.g. john_doe'}
                    autoComplete="off"
                    {...register('username', {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                      }
                    })}
                  />
                </div>
                {errors.username && <p className="text-sm text-destructive font-medium">{errors.username.message || (language === 'ku' ? 'ناوی بەکارهێنەر هەڵەیە' : 'Invalid username')}</p>}
                {!errors.username && isUsernameAvailable && <p className="text-sm text-success font-medium">{language === 'ku' ? 'ئەم ناوە بەردەستە' : 'Username is available'}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">{language === 'ku' ? 'ئیمەیڵ' : 'Email Address'}</Label>
                <div className="relative">
                  <Mail className="absolute ms-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" className="ps-10 bg-background" placeholder="user@example.com" {...register('email')} />
                </div>
                {errors.email && <p className="text-sm text-destructive font-medium">{language === 'ku' ? 'ئیمەیڵەکە دروست نییە' : errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-semibold">{language === 'ku' ? 'ژمارەی تەلەفۆن' : 'Phone Number'}</Label>
                <div className="relative">
                  <Phone className="absolute ms-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" dir="ltr" className="ps-10 bg-background" placeholder="07XX XXX XXXX" {...register('phone')} />
                </div>
                {errors.phone && <p className="text-sm text-destructive font-medium">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold">{language === 'ku' ? 'وشەی تێپەڕ (پاسۆرد)' : 'Password'}</Label>
                <div className="relative">
                  <Lock className="absolute ms-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <PasswordInput id="password" autoComplete="new-password" className="ps-10 bg-background" placeholder="••••••••" {...register('password')} />
                </div>
                {errors.password && <p className="text-sm text-destructive font-medium">{language === 'ku' ? 'پاسۆرد کورتە (لانی کەم ٦ پیت)' : errors.password.message}</p>}
              </div>

            </CardContent>
            <CardFooter className="flex items-center justify-end gap-3 bg-muted/20 border-t p-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="shadow-md">
                {isSubmitting ? (language === 'ku' ? 'پاشەکەوت دەکرێت...' : 'Saving...') : (language === 'ku' ? 'دروستکردنی بەکارهێنەر' : 'Create User')}
                {!isSubmitting && <Save className="ms-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardShell>
  );
}
