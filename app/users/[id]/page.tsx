'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Trophy, Gamepad2, Target, Ban, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { generateUsers } from '@/lib/mock-data';
import { formatDate, formatDateTime, getInitials } from '@/lib/format';
import { toast } from 'sonner';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const allUsers = useMemo(() => generateUsers(50), []);
  const user = useMemo(
    () => allUsers.find((u) => u.id === params.id) ?? allUsers[0],
    [allUsers, params.id]
  );
  const [banOpen, setBanOpen] = useState(false);

  const activity = [
    { action: 'Completed quiz', target: 'World Capitals', time: '2 hours ago', points: 85 },
    { action: 'Won tournament', target: 'Weekly Championship', time: '1 day ago', points: 500 },
    { action: 'Joined room', target: 'Trivia Night #42', time: '2 days ago', points: 0 },
    { action: 'Completed quiz', target: 'Science Basics', time: '3 days ago', points: 72 },
    { action: 'Completed quiz', target: 'History Masters', time: '5 days ago', points: 90 },
  ];

  return (
    <DashboardShell>
      <PageHeader
        title={user.name}
        description="User profile and activity overview"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Users', href: '/users' },
          { label: user.name },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="outline" onClick={() => setBanOpen(true)}>
              <Ban className="mr-2 h-4 w-4" /> Ban
            </Button>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex gap-2">
              <Badge variant="outline" className="capitalize">
                {user.role.replace('_', ' ')}
              </Badge>
              <StatusBadge status={user.status} />
            </div>
            <Separator className="my-4" />
            <div className="w-full space-y-3 text-left text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> {user.email}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Joined {formatDate(user.joinedAt)}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Last active {formatDateTime(user.lastActiveAt)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard title="Quizzes Played" value={user.quizzesPlayed} icon={Gamepad2} />
          <StatCard title="Quizzes Won" value={user.quizzesWon} icon={Trophy} accent="success" />
          <StatCard title="Total Points" value={user.totalPoints} icon={Target} accent="warning" />
          <StatCard title="Win Rate" value={user.quizzesPlayed > 0 ? Math.round((user.quizzesWon / user.quizzesPlayed) * 100) : 0} icon={Trophy} format="percent" accent="info" />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {activity.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="text-sm">
                  <span className="font-medium">{item.action}</span>{' '}
                  <span className="text-muted-foreground">{item.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
              {item.points > 0 && (
                <Badge variant="secondary" className="text-success">
                  +{item.points} pts
                </Badge>
              )}
            </motion.div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={banOpen}
        onOpenChange={setBanOpen}
        title="Ban user?"
        description={`${user.name} will no longer be able to access the platform.`}
        confirmLabel="Ban"
        onConfirm={() => {
          toast.success(`User ${user.name} has been banned`);
          setBanOpen(false);
        }}
      />
    </DashboardShell>
  );
}
