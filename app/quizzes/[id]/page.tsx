'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Play, Archive, Send, Users, Clock, HelpCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { generateQuizzes, generateQuestions } from '@/lib/mock-data';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

export default function QuizDetailsPage() {
  const params = useParams();
  const allQuizzes = useMemo(() => generateQuizzes(30), []);
  const quiz = useMemo(
    () => allQuizzes.find((q) => q.id === params.id) ?? allQuizzes[0],
    [allQuizzes, params.id]
  );
  const questions = useMemo(() => generateQuestions(quiz.questionCount), [quiz.questionCount]);

  return (
    <DashboardShell>
      <PageHeader
        title={quiz.title}
        description={quiz.description}
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Quizzes', href: '/quizzes' },
          { label: quiz.title },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/quizzes">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/quizzes/${quiz.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
            {quiz.status === 'draft' && (
              <Button onClick={() => toast.success('Quiz published')}>
                <Send className="mr-2 h-4 w-4" /> Publish
              </Button>
            )}
            {quiz.status === 'published' && (
              <Button onClick={() => toast.success('Quiz started')}>
                <Play className="mr-2 h-4 w-4" /> Start
              </Button>
            )}
            <Button variant="outline" onClick={() => toast.success('Quiz archived')}>
              <Archive className="mr-2 h-4 w-4" /> Archive
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Questions" value={quiz.questionCount} icon={HelpCircle} />
        <StatCard title="Participants" value={quiz.participantCount} icon={Users} accent="info" />
        <StatCard title="Duration" value={`${quiz.duration} min`} icon={Clock} accent="warning" />
        <StatCard title="Completion" value={87} icon={CheckCircle2} format="percent" accent="success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quiz Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={quiz.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Difficulty</span>
              <Badge variant="outline" className="capitalize">{quiz.difficulty}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{quiz.categoryName}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(quiz.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{formatDate(quiz.updatedAt)}</span>
            </div>
            {quiz.scheduledAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled</span>
                <span>{formatDate(quiz.scheduledAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Questions ({questions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{q.text}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="secondary" className="text-xs">{q.type.replace('_', ' ')}</Badge>
                    <Badge variant="secondary" className="text-xs">{q.points} pts</Badge>
                    <Badge variant="secondary" className="text-xs">{q.timer}s</Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
