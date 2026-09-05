'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { User, Key, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas';
import { useLogin } from '@/features/auth/hooks/use-auth-mutations';
import { useAuth } from '@/features/auth/components/auth-provider';

import { useLanguage } from '@/hooks/use-language';

export default function LoginPage() {
  const { language } = useLanguage();
  const { isAuthenticated, hasHydrated } = useAuth();
  const router = useRouter();
  const login = useLogin();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) router.replace('/dashboard');
  }, [hasHydrated, isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values);
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden p-8 text-white lg:flex lg:p-12">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom left, #8B5CFF 0%, #6C3BFF 55%, #4A1FB8 100%)',
          }}
        />
        <div className="absolute inset-0 bg-grid opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Barav Quiz"
              width={44}
              height={44}
              className="rounded-xl object-cover"
            />
            <span className="text-xl font-bold tracking-tight">Barav Quiz</span>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative space-y-4"
        >
          <h1 className="text-2xl font-bold leading-tight md:text-3xl lg:text-4xl">
            {language === 'ku' ? 'پلاتفۆرمی کویزەکانت بە متمانەوە بەڕێوەبەرە.' : 'Manage your quiz platform with confidence.'}
          </h1>
          <p className="max-w-md text-lg text-primary-foreground/80">
            {language === 'ku' ? 'چاودێری بەکارهێنەران، کویزەکان، پاڵەوانێتییەکان و داهاتەکان بکە — هەمووی لە یەک داشبۆردی بەهێز و جوانەوە.' : 'Monitor users, quizzes, tournaments, and revenue — all from one powerful, beautifully designed dashboard.'}
          </p>
        </motion.div>
        <div className="relative flex gap-8">
          {[
            ['12K+', language === 'ku' ? 'بەکارهێنەری چالاک' : 'Active users'],
            ['850+', language === 'ku' ? 'کویزی دروستکراو' : 'Quizzes created'],
            ['99.9%', language === 'ku' ? 'کاتی کارکردن' : 'Uptime'],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="text-2xl font-bold">{stat}</p>
              <p className="text-sm text-primary-foreground/70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Image
              src="/logo.png"
              alt="Barav Quiz"
              width={36}
              height={36}
              className="rounded-lg object-cover"
            />
            <span className="text-lg font-bold">Barav Quiz</span>
          </div>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">{language === 'ku' ? 'بەخێربێیتەوە' : 'Welcome back'}</CardTitle>
              <CardDescription>
                {language === 'ku' ? 'چوونەژوورەوە بۆ هەژماری بەڕێوەبەر بۆ بەردەوامبوون' : 'Sign in to your admin account to continue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">{language === 'ku' ? 'ناوی بەکارهێنەر' : 'Username'}</Label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="admin"
                      className="ps-9"
                      {...register('username')}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-destructive">
                      {errors.username.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{language === 'ku' ? 'وشەی نهێنی' : 'Password'}</Label>
                  <div className="relative">
                    <Key className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                    <PasswordInput
                      id="password"
                      placeholder="••••••••"
                      className="ps-9"
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={login.isPending}
                >
                  {login.isPending ? (
                    language === 'ku' ? 'چوونەژوورەوە...' : 'Signing in...'
                  ) : (
                    <>
                      {language === 'ku' ? 'چوونەژوورەوە' : 'Sign in'}
                      <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                    </>
                  )}
                </Button>
              </form>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
