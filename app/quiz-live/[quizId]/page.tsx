export const runtime = 'edge';
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import {
  Users, Eye, Timer, Trophy, Play, ChevronRight, CheckCircle2,
  XCircle, ArrowLeft, Zap,
} from 'lucide-react';

// ════════════════════════════════
// Types
// ════════════════════════════════
type Phase =
  | 'loading'
  | 'lobby'
  | 'countdown'   // 30s before start
  | 'question'
  | 'reveal'
  | 'finished';

interface QuizStatus {
  quizId: string;
  quizStatus: string;
  currentQuestionIndex: number;
  scheduledAt: string | null;
  participants: {
    waiting: number;
    active: number;
    spectator: number;
    left: number;
    winner: number;
  };
}

interface LiveQuestion {
  questionIndex: number;
  totalQuestions: number;
  question: {
    id: string;
    text: string;
    type: string;
    options: { id: string; text: string }[];
    timer: number;
    points: number;
    mediaUrl: string | null;
    categoryId: string | null;
    categoryName: string | null;
  };
}

interface RevealData {
  correctOptionId: string;
  correctOptionText: string;
  explanation: string | null;
  survivors: number;
  spectators: number;
  answerStats: { selectedOptionId: string | null; count: number }[];
}

// ════════════════════════════════
// Helpers
// ════════════════════════════════
function useInterval(callback: () => void, delay: number | null) {
  const savedCb = useRef(callback);
  useEffect(() => { savedCb.current = callback; }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCb.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ════════════════════════════════
// Main Component
// ════════════════════════════════
export default function QuizLivePage() {
  const { quizId } = useParams<{ quizId: string }>();
  const router = useRouter();
  const { language } = useLanguage();

  const [phase, setPhase] = useState<Phase>('loading');
  const [countdown, setCountdown] = useState(30);
  const [questionTimer, setQuestionTimer] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<LiveQuestion | null>(null);
  const [revealData, setRevealData] = useState<RevealData | null>(null);
  const [revealCountdown, setRevealCountdown] = useState(5);
  const [localStatus, setLocalStatus] = useState<QuizStatus | null>(null);

  // ──────────────────────────────
  // Quiz status initial fetch & state sync
  // ──────────────────────────────
  const { data: statusData } = useQuery<QuizStatus>({
    queryKey: ['quiz-live-status', quizId],
    queryFn: () => api.get(`/quiz-live/${quizId}/status`),
    refetchInterval: false,
    enabled: !!quizId,
  });

  const activeStatus = localStatus || statusData;

  // ──────────────────────────────
  // Load current question
  // ──────────────────────────────
  const loadCurrentQuestion = useCallback(async () => {
    try {
      const q = await api.get<LiveQuestion>(`/quiz-live/${quizId}/question/current`);
      setCurrentQuestion(q);
      setQuestionTimer(q.question.timer);
      setRevealData(null);
      setPhase('question');
    } catch {
      toast.error(language === 'ku' ? 'پرسیاری داهاتوو نەدۆزرایەوە' : 'Next question not found');
    }
  }, [quizId, language]);

  // ──────────────────────────────
  // Reveal answer
  // ──────────────────────────────
  const revealAnswer = useCallback(async () => {
    if (!currentQuestion) return;
    try {
      const data = await api.get<RevealData>(
        `/quiz-live/${quizId}/question/${currentQuestion.question.id}/reveal`
      );
      setRevealData(data);
      setRevealCountdown(5);
      setPhase('reveal');
    } catch {
      toast.error(language === 'ku' ? 'کێشەیەک هەیە لە ئاشکراکردنی وەڵامەکە' : 'Failed to reveal answer');
    }
  }, [quizId, currentQuestion, language]);

  // ──────────────────────────────
  // Realtime WebSockets Sync
  // ──────────────────────────────
  useEffect(() => {
    if (!quizId) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let isDisposed = false;

    function connect() {
      if (isDisposed) return;
      const clientId = 'admin-' + Math.random().toString(36).substring(2, 10);
      const token = localStorage.getItem('barav-access-token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.baravquiz.com/api';
      const wsBase = apiUrl.replace(/^http/, 'ws').replace(/\/$/, '');
      const wsUrl = `${wsBase}/quiz-live/${quizId}/ws?clientId=${encodeURIComponent(clientId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'waiting_room_state') {
              const state = msg.data;
              setLocalStatus({
                quizId,
                quizStatus: state.sessionStatus === 'WAITING' ? 'waiting' : state.sessionStatus === 'LIVE' ? 'running' : state.sessionStatus.toLowerCase(),
                currentQuestionIndex: state.currentQuestion ? state.currentQuestion.questionIndex - 1 : 0,
                scheduledAt: null,
                participants: {
                  waiting: state.participantCount,
                  active: state.participantCount,
                  spectator: 0,
                  left: 0,
                  winner: 0
                }
              });

              if (state.sessionStatus === 'LIVE') {
                if (state.currentQuestion) {
                  loadCurrentQuestion();
                } else if (state.introEndAt) {
                  const remaining = Math.max(0, Math.round((state.introEndAt - Date.now()) / 1000));
                  setCountdown(remaining);
                  setPhase('countdown');
                }
              } else if (state.sessionStatus === 'FINISHED') {
                setPhase('finished');
              } else {
                setPhase('lobby');
              }
            } else if (msg.type === 'participant_joined' || msg.type === 'participant_left') {
              setLocalStatus(prev => {
                const base = prev || statusData;
                if (!base) return null;
                return {
                  ...base,
                  participants: {
                    ...base.participants,
                    active: msg.data.participantCount,
                    waiting: msg.data.participantCount
                  }
                };
              });
            } else if (msg.type === 'SESSION_STARTED' || msg.type === 'session_started') {
              setLocalStatus(prev => {
                const base = prev || statusData;
                if (!base) return null;
                return {
                  ...base,
                  quizStatus: 'running'
                };
              });
              setCountdown(30);
              setPhase('countdown');
            } else if (msg.type === 'QUESTION_STARTED') {
              setLocalStatus(prev => {
                const base = prev || statusData;
                if (!base) return null;
                return {
                  ...base,
                  quizStatus: 'running',
                  currentQuestionIndex: msg.data.questionIndex - 1
                };
              });
              loadCurrentQuestion();
            } else if (msg.type === 'REVEAL_ANSWER') {
              revealAnswer();
            } else if (msg.type === 'QUIZ_FINISHED' || msg.type === 'quiz_finished') {
              setLocalStatus(prev => {
                const base = prev || statusData;
                if (!base) return null;
                return {
                  ...base,
                  quizStatus: 'finished'
                };
              });
              setPhase('finished');
            }
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        };

        ws.onclose = () => {
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (e) {
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      isDisposed = true;
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [quizId, statusData, loadCurrentQuestion, revealAnswer]);

  // ──────────────────────────────
  // Mutations
  // ──────────────────────────────
  const startMutation = useMutation({
    mutationFn: () => api.post(`/quiz-live/${quizId}/start`),
    onSuccess: () => {
      toast.success(language === 'ku' ? 'کویز دەستپێکرد!' : 'Quiz started!');
      setCountdown(30);
      setPhase('countdown');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || (language === 'ku' ? 'نەتوانرا کویز دەستپێبکرێت' : 'Failed to start quiz'));
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => api.post(`/quiz-live/${quizId}/finish`),
    onSuccess: () => {
      toast.success(language === 'ku' ? 'کویز کۆتایی هات!' : 'Quiz finished!');
      setPhase('finished');
    },
  });

  const nextQuestionMutation = useMutation({
    mutationFn: () => api.post(`/quiz-live/${quizId}/next-question`),
    onSuccess: async (data: any) => {
      if (data.finished) {
        finishMutation.mutate();
        return;
      }
      await loadCurrentQuestion();
    },
  });

  // ──────────────────────────────
  // Phase transitions based on initial quiz status (fallback)
  // ──────────────────────────────
  useEffect(() => {
    if (!statusData || localStatus) return;

    if (phase === 'loading') {
      if (statusData.quizStatus === 'running') {
        loadCurrentQuestion();
      } else if (['published', 'scheduled', 'waiting'].includes(statusData.quizStatus)) {
        setPhase('lobby');
      } else if (statusData.quizStatus === 'finished') {
        setPhase('finished');
      }
    }
  }, [statusData, localStatus, phase, loadCurrentQuestion]);

  // ──────────────────────────────
  // Countdown timers (visual decrement)
  // ──────────────────────────────
  const handleStartCountdown = () => {
    startMutation.mutate();
  };

  useInterval(
    () => {
      setCountdown((prev) => Math.max(0, prev - 1));
    },
    phase === 'countdown' ? 1000 : null
  );

  useInterval(
    () => {
      setQuestionTimer((prev) => Math.max(0, prev - 1));
    },
    phase === 'question' ? 1000 : null
  );

  useInterval(
    () => {
      setRevealCountdown((prev) => Math.max(0, prev - 1));
    },
    phase === 'reveal' ? 1000 : null
  );

  const totalActive = activeStatus?.participants
    ? activeStatus.participants.waiting + activeStatus.participants.active
    : 0;
  const totalSpectators = activeStatus?.participants?.spectator ?? 0;

  // ════════════════════════════════
  // RENDER
  // ════════════════════════════════
  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ku' ? 'کویزی ڕاستەوخۆ (لایڤ)' : 'Live Quiz Room'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {language === 'ku' ? 'بەڕێوەبردنی کویز لە لایەن ئەدمینەوە' : 'Administer and orchestrate the live quiz session'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant={phase === 'question' ? 'default' : 'secondary'}
            className={phase === 'question' ? 'animate-pulse bg-red-500' : ''}
          >
            {phase === 'lobby' && (language === 'ku' ? '⏳ لۆبی' : '⏳ Lobby')}
            {phase === 'countdown' && (language === 'ku' ? '🔔 دەستپێدەکات...' : '🔔 Starting...')}
            {phase === 'question' && (language === 'ku' ? '🔴 ڕاستەوخۆ' : '🔴 LIVE')}
            {phase === 'reveal' && (language === 'ku' ? '✅ ئاشکراکردن' : '✅ Reveal')}
            {phase === 'finished' && (language === 'ku' ? '🏆 کۆتایی هات' : '🏆 Finished')}
          </Badge>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {language === 'ku' ? 'بەژداربووان' : 'Participants'}
              </span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {activeStatus?.participants.active ?? activeStatus?.participants.waiting ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">
                {language === 'ku' ? 'تەماشاچیان' : 'Spectators'}
              </span>
            </div>
            <div className="text-2xl font-bold mt-1">{totalSpectators}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">
                {language === 'ku' ? 'پرسیار' : 'Question'}
              </span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {currentQuestion
                ? `${currentQuestion.questionIndex}/${currentQuestion.totalQuestions}`
                : '—'}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                {language === 'ku' ? 'براوەکان' : 'Survivors'}
              </span>
            </div>
            <div className="text-2xl font-bold mt-1">{revealData?.survivors ?? '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* ════ Phase: LOBBY ════ */}
      {phase === 'lobby' && (
        <Card className="border-2 border-dashed border-primary/30">
          <CardHeader>
            <CardTitle className="text-center text-xl font-bold">
              {language === 'ku' ? '⏳ هۆڵی چاوەڕوانی (لۆبی) — چاوەڕێی بەژداربووان' : '⏳ Waiting Room (Lobby) — Waiting for Players'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl font-black text-primary">{totalActive}</div>
            <p className="text-muted-foreground">
              {language === 'ku' ? 'بەژداربوو تۆمارکراون' : 'players are registered'}
            </p>
            <Button
              size="lg"
              className="gap-2 px-10 py-6 text-lg font-bold"
              onClick={handleStartCountdown}
            >
              <Play className="h-5 w-5" />
              {language === 'ku' ? 'دەستپێکردنی کویز' : 'Start Quiz'}
            </Button>
            <p className="text-xs text-muted-foreground">
              {language === 'ku'
                ? 'کاتێک دەستپێدەکەیت، ٣٠ چرکە ژماردنی پێچەوانە دەستپێدەکات و پاشان پرسیارەکان دەردەکەون.'
                : 'Once started, a 30-second countdown begins, after which questions start.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ════ Phase: COUNTDOWN ════ */}
      {phase === 'countdown' && (
        <Card className="border-2 border-orange-400/40 bg-orange-500/5">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-lg font-medium text-muted-foreground">
              {language === 'ku' ? 'کویز دەستپێدەکات لە' : 'Quiz starts in'}
            </p>
            <div className="text-8xl font-black text-orange-500 tabular-nums leading-none">
              {countdown}
            </div>
            <p className="text-muted-foreground">
              {language === 'ku' ? 'چرکەدا' : 'seconds'}
            </p>
            <Progress value={((30 - countdown) / 30) * 100} className="h-2 mt-4" />
            <p className="text-sm text-muted-foreground">
              {language === 'ku'
                ? `${totalActive} کەس بەژدارن — لە چاوەڕوانیدان`
                : `${totalActive} players are waiting in lobby`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ════ Phase: QUESTION ════ */}
      {phase === 'question' && currentQuestion && (
        <div className="space-y-4">
          {/* Timer bar */}
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-orange-500" />
            <Progress
              value={(questionTimer / currentQuestion.question.timer) * 100}
              className="flex-1 h-3"
            />
            <span
              className={`text-2xl font-black tabular-nums w-12 text-center ${
                questionTimer <= 5 ? 'text-red-500 animate-pulse' : 'text-orange-500'
              }`}
            >
              {questionTimer}
            </span>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentQuestion.question.categoryName && (
                    <Badge variant="secondary">{currentQuestion.question.categoryName}</Badge>
                  )}
                  <Badge variant="outline">
                    {language === 'ku'
                      ? `پرسیار ${currentQuestion.questionIndex} / ${currentQuestion.totalQuestions}`
                      : `Question ${currentQuestion.questionIndex} of ${currentQuestion.totalQuestions}`}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  {currentQuestion.question.points} {language === 'ku' ? 'خاڵ' : 'pts'}
                </div>
              </div>
              <CardTitle className="text-xl leading-relaxed mt-2">
                {currentQuestion.question.text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.question.options.map((opt, i) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-3 rounded-xl border-2 border-border p-4 bg-muted/20"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-medium">{opt.text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  <Users className="inline h-4 w-4 mr-1" />
                  {language === 'ku'
                    ? `${activeStatus?.participants.active ?? 0} یاریزان دەتوانن وەڵام بدەنەوە`
                    : `${activeStatus?.participants.active ?? 0} players can answer`}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revealAnswer}
                >
                  {language === 'ku' ? 'وڵامی ڕاست نیشان بدە' : 'Reveal Correct Answer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════ Phase: REVEAL ════ */}
      {phase === 'reveal' && revealData && currentQuestion && (
        <div className="space-y-4">
          <Card className="border-2 border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 font-bold">
                <CheckCircle2 className="h-6 w-6" />
                {language === 'ku'
                  ? `وڵامی ڕاست: ${revealData.correctOptionText}`
                  : `Correct Answer: ${revealData.correctOptionText}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Answer distribution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.question.options.map((opt, i) => {
                  const stat = revealData.answerStats.find((s) => s.selectedOptionId === opt.id);
                  const count = stat?.count ?? 0;
                  const isCorrect = opt.id === revealData.correctOptionId;
                  const total = revealData.answerStats.reduce((s, a) => s + a.count, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

                  return (
                    <div
                      key={opt.id}
                      className={`relative rounded-xl border-2 p-4 overflow-hidden transition-all ${
                        isCorrect
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-red-400/30 bg-red-500/5'
                      }`}
                    >
                      <div
                        className={`absolute inset-y-0 left-0 ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/10'}`}
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                          <span className="font-medium text-sm">{opt.text}</span>
                        </div>
                        <span className="text-sm font-bold">{count} ({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {revealData.explanation && (
                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  💡 {revealData.explanation}
                </div>
              )}

              {/* Survivors */}
              <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">
                    {language === 'ku'
                      ? `${revealData.survivors} یاریزان مانەوە`
                      : `${revealData.survivors} players survived`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Eye className="h-4 w-4" />
                  {language === 'ku' ? `${revealData.spectators} تەماشاچی` : `${revealData.spectators} spectators`}
                </div>
              </div>

              {/* Auto-advance countdown */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {language === 'ku'
                    ? `پرسیاری داهاتوو لە ${revealCountdown} چرکەدا`
                    : `Next question in ${revealCountdown}s`}
                </p>
                <Button
                  size="sm"
                  className="gap-2 font-bold"
                  onClick={() => {
                    if (revealData.survivors > 0) {
                      nextQuestionMutation.mutate();
                    } else {
                      finishMutation.mutate();
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                  {revealData.survivors > 0
                    ? (language === 'ku' ? 'پرسیاری داهاتوو' : 'Next Question')
                    : (language === 'ku' ? 'کۆتایی کویز' : 'Finish Quiz')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════ Phase: FINISHED ════ */}
      {phase === 'finished' && (
        <Card className="border-2 border-yellow-400/30 bg-yellow-500/5">
          <CardContent className="py-10 text-center space-y-4">
            <div className="text-6xl">🏆</div>
            <h2 className="text-2xl font-bold">
              {language === 'ku' ? 'کویزەکە کۆتایی پێهات!' : 'Quiz Finished!'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ku'
                ? 'ئەنجامەکان پاشەکەوت کران. بۆ بینینیان بچۆ بۆ لاپەڕەی ئەنجامی کویزەکان.'
                : 'Results have been saved. Go to results page to view.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.back()} className="font-bold">
                {language === 'ku' ? 'گەڕانەوە' : 'Go Back'}
              </Button>
              <Button onClick={() => router.push(`/quiz-live/${quizId}/results`)} className="font-bold">
                {language === 'ku' ? 'بینینی ئەنجامەکان' : 'View Results'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  );
}
