'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function LoginPage() {
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
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values);
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
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
          <h1 className="text-4xl font-bold leading-tight">
            Manage your quiz platform with confidence.
          </h1>
          <p className="max-w-md text-lg text-primary-foreground/80">
            Monitor users, quizzes, tournaments, and revenue — all from one
            powerful, beautifully designed dashboard.
          </p>
        </motion.div>
        <div className="relative flex gap-8">
          {[
            ['12K+', 'Active users'],
            ['850+', 'Quizzes created'],
            ['99.9%', 'Uptime'],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="text-2xl font-bold">{stat}</p>
              <p className="text-sm text-primary-foreground/70">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6">
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
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your admin account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@baravquiz.com"
                      className="pl-9"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
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
                    'Signing in...'
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Demo credentials: admin@baravquiz.com / password123
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
