'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Revenue, Expense } from '@/lib/types';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';

interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  title: string;
  category: string;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

type TransactionType = 'revenue' | 'expense';

const REVENUE_CATEGORIES = ['Subscription', 'Ads', 'Sponsorship', 'In-App Purchase', 'Licensing', 'Other'];
const EXPENSE_CATEGORIES = ['Server Costs', 'Salaries', 'Marketing', 'Software', 'Office', 'Other'];

const categoryTranslations: Record<string, string> = {
  // Revenue
  'subscription': 'بەشداریکردن',
  'ads': 'ڕیکلامەکان',
  'sponsorship': 'سپۆنسەری',
  'in-app purchase': 'کڕینی ناو ئەپڵیکەیشن',
  'licensing': 'مۆڵەتدان',
  // Expenses
  'server costs': 'خەرجی سێرڤەر',
  'salaries': 'مووچەکان',
  'marketing': 'مارکێتینگ',
  'software': 'نەرمەکاڵاکان',
  'office': 'نووسینگە',
  // General
  'other': 'هیتر',
};

const translateCategory = (cat: string, language: string) => {
  if (language !== 'ku') return cat;
  const key = cat.toLowerCase().trim();
  return categoryTranslations[key] || cat;
};

export default function RevenueExpensesPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const { data: revenueResult, isLoading: loadingRevenue } = useQuery<{ data: Revenue[] }>({
    queryKey: ['revenue'],
    queryFn: () => api.get('/revenue')
  });

  const { data: expenseResult, isLoading: loadingExpense } = useQuery<{ data: Expense[] }>({
    queryKey: ['expenses'],
    queryFn: () => api.get('/expenses')
  });

  const transactions = useMemo<Transaction[]>(() => {
    const revs = ((revenueResult?.data || []) as any[]).map((r) => ({
      id: r.id,
      type: 'revenue' as const,
      title: r.description || '',
      category: r.source,
      amount: r.amount,
      date: r.date,
      note: r.status,
      created_at: r.createdAt,
      updated_at: r.createdAt,
    }));
    const exps = ((expenseResult?.data || []) as any[]).map((e) => ({
      id: e.id,
      type: 'expense' as const,
      title: e.description || '',
      category: e.category,
      amount: e.amount,
      date: e.date,
      note: e.status,
      created_at: e.createdAt,
      updated_at: e.createdAt,
    }));
    return [...revs, ...exps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [revenueResult, expenseResult]);

  const loading = loadingRevenue || loadingExpense;
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');

  const [formType, setFormType] = useState<TransactionType>('revenue');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formNote, setFormNote] = useState('');

  const deleteMutation = useMutation({
    mutationFn: (tx: Transaction) => {
      if (tx.type === 'revenue') return api.delete(`/revenue/${tx.id}`);
      return api.delete(`/expenses/${tx.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(language === 'ku' ? 'سەوداکە بە سەرکەوتوویی سڕایەوە' : 'Transaction deleted');
      setDeleteTarget(null);
    }
  });

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget);
    }
  };

  const filtered = useMemo(
    () => (filterType === 'all' ? transactions : transactions.filter((t) => t.type === filterType)),
    [transactions, filterType]
  );

  const totals = useMemo(() => {
    let revenue = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === 'revenue') revenue += Number(t.amount);
      else expense += Number(t.amount);
    }
    return { revenue, expense, net: revenue - expense };
  }, [transactions]);

  const openCreate = () => {
    setEditing(null);
    setFormType('revenue');
    setFormTitle('');
    setFormCategory('');
    setFormAmount('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormNote('');
    setEditOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setFormType(tx.type);
    setFormTitle(tx.title);
    setFormCategory(tx.category);
    setFormAmount(String(tx.amount));
    setFormDate(tx.date);
    setFormNote(tx.note ?? '');
    setEditOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => {
      const isRev = payload.type === 'revenue';
      const endpoint = isRev ? '/revenue' : '/expenses';
      const apiPayload = isRev 
        ? { amount: payload.amount, currency: 'USD', source: payload.category.toLowerCase(), description: payload.title, date: payload.date, status: payload.note || 'completed' }
        : { amount: payload.amount, currency: 'USD', category: payload.category.toLowerCase().replace(' ', '_'), description: payload.title, date: payload.date, status: payload.note || 'completed' };
      return api.post(endpoint, apiPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(language === 'ku' ? 'سەوداکە بە سەرکەوتوویی دروستکرا' : 'Transaction created');
      setEditOpen(false);
      setSaving(false);
    },
    onError: () => {
      toast.error(language === 'ku' ? 'تۆمارکردنی سەوداکە سەرکەوتوو نەبوو' : 'Failed to create transaction');
      setSaving(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => {
      const isRev = payload.type === 'revenue';
      const endpoint = isRev ? `/revenue/${editing?.id}` : `/expenses/${editing?.id}`;
      const apiPayload = isRev 
        ? { amount: payload.amount, currency: 'USD', source: payload.category.toLowerCase(), description: payload.title, date: payload.date, status: payload.note || 'completed' }
        : { amount: payload.amount, currency: 'USD', category: payload.category.toLowerCase().replace(' ', '_'), description: payload.title, date: payload.date, status: payload.note || 'completed' };
      return api.put(endpoint, apiPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(language === 'ku' ? 'سەوداکە نوێکرایەوە' : 'Transaction updated');
      setEditOpen(false);
      setSaving(false);
    },
    onError: () => {
      toast.error(language === 'ku' ? 'نوێکردنەوەی سەوداکە سەرکەوتوو نەبوو' : 'Failed to update transaction');
      setSaving(false);
    }
  });

  const categories = formType === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSave = () => {
    if (!formTitle.trim() || !formCategory || !formAmount || !formDate) {
      toast.error(language === 'ku' ? 'تکایە هەموو خانە پێویستەکان پڕبکەرەوە' : 'Please fill in all required fields');
      return;
    }
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error(language === 'ku' ? 'پێویستە بڕەکە ژمارەیەکی دروست و ئەرێنی بێت' : 'Amount must be a valid positive number');
      return;
    }

    setSaving(true);
    const payload = {
      type: formType,
      title: formTitle.trim(),
      category: formCategory,
      amount,
      date: formDate,
      note: formNote.trim() || null,
    };

    if (editing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Revenue & Expenses"
        description="Track income and spending"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Revenue & Expenses' }]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="me-2 h-4 w-4" /> {language === 'ku' ? 'زیادکردنی سەودا' : 'Add Transaction'}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title={language === 'ku' ? 'کۆی داهات' : 'Total Revenue'} value={totals.revenue} icon={TrendingUp} format="currency" accent="success" delay={0} />
        <StatCard title={language === 'ku' ? 'کۆی خەرجییەکان' : 'Total Expenses'} value={totals.expense} icon={TrendingDown} format="currency" accent="destructive" delay={0.05} />
        <StatCard title={language === 'ku' ? 'هاوسەنگیی گشتی' : 'Net Balance'} value={totals.net} icon={Wallet} format="currency" accent={totals.net >= 0 ? 'primary' : 'destructive'} delay={0.1} />
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {language === 'ku' ? 'فلتەر:' : 'Filter:'}
          </span>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | TransactionType)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ku' ? 'هەموو سەوداکان' : 'All Transactions'}</SelectItem>
              <SelectItem value="revenue">{language === 'ku' ? 'تەنها داهات' : 'Revenue Only'}</SelectItem>
              <SelectItem value="expense">{language === 'ku' ? 'تەنها خەرجییەکان' : 'Expenses Only'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {language === 'ku' ? 'تۆمار' : 'records'}
        </span>
      </div>

      {/* Table */}
      <Card className="mt-4">
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={language === 'ku' ? 'هیچ سەودایەک تۆمار نەکراوە' : 'No transactions yet'}
              description={language === 'ku' ? 'یەکەم تۆماری داهات یان خەرجی بنووسە بۆ دەستپێکردنی بەدواداچوون.' : 'Add your first revenue or expense entry to start tracking.'}
              action={
                <Button onClick={openCreate}>
                  <Plus className="me-2 h-4 w-4" /> {language === 'ku' ? 'زیادکردنی سەودا' : 'Add Transaction'}
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{language === 'ku' ? 'جۆر' : 'Type'}</TableHead>
                  <TableHead>{language === 'ku' ? 'ناونیشان' : 'Title'}</TableHead>
                  <TableHead>{language === 'ku' ? 'جۆری بابەت' : 'Category'}</TableHead>
                  <TableHead className="text-end">{language === 'ku' ? 'بڕ' : 'Amount'}</TableHead>
                  <TableHead>{language === 'ku' ? 'ڕێکەوت' : 'Date'}</TableHead>
                  <TableHead>{language === 'ku' ? 'تێبینی' : 'Note'}</TableHead>
                  <TableHead className="w-[80px] text-end">{language === 'ku' ? 'کردارەکان' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group"
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          tx.type === 'revenue'
                            ? 'bg-success/10 text-success border-success/20 capitalize font-medium'
                            : 'bg-destructive/10 text-destructive border-destructive/20 capitalize font-medium'
                        }
                      >
                        {tx.type === 'revenue'
                          ? (language === 'ku' ? 'داهات' : 'revenue')
                          : (language === 'ku' ? 'خەرجی' : 'expense')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tx.title}</TableCell>
                    <TableCell className="text-muted-foreground">{translateCategory(tx.category, language)}</TableCell>
                    <TableCell className="text-end font-semibold">
                      <span className={tx.type === 'revenue' ? 'text-success' : 'text-destructive'}>
                        {tx.type === 'revenue' ? '+' : '-'}
                        {formatCurrency(Number(tx.amount))}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(tx.date)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {tx.note ?? '-'}
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tx)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(tx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? (language === 'ku' ? 'دەستکاری سەودا' : 'Edit Transaction')
                : (language === 'ku' ? 'سەودای نوێ' : 'New Transaction')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ku' ? 'جۆر' : 'Type'}</Label>
              <Select
                value={formType}
                onValueChange={(v) => {
                  setFormType(v as TransactionType);
                  setFormCategory('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">{language === 'ku' ? 'داهات' : 'Revenue'}</SelectItem>
                  <SelectItem value="expense">{language === 'ku' ? 'خەرجی' : 'Expense'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-title">{language === 'ku' ? 'ناونیشان' : 'Title'}</Label>
              <Input
                id="tx-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={language === 'ku' ? 'ناونیشانی سەودا (بۆ نموونە: داهاتی بەشداریکردنی مانگانە)' : 'e.g. Monthly subscription revenue'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ku' ? 'جۆری بابەت' : 'Category'}</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ku' ? 'جۆری بابەت هەڵبژێرە' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {translateCategory(c, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-amount">{language === 'ku' ? 'بڕ ($)' : 'Amount ($)'}</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-date">{language === 'ku' ? 'ڕێکەوت' : 'Date'}</Label>
              <Input
                id="tx-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-note">{language === 'ku' ? 'تێبینی (ئارەزوومەندانە)' : 'Note (optional)'}</Label>
              <Textarea
                id="tx-note"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder={language === 'ku' ? 'زانیاری و وردەکاری زیاتر...' : 'Additional details...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? (language === 'ku' ? 'پاشەکەوت دەکرێت...' : 'Saving...')
                : (language === 'ku' ? 'پاشەکەوتکردن' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={language === 'ku' ? 'سڕینەوەی سەودا؟' : 'Delete transaction?'}
        description={
          language === 'ku'
            ? `سەودای "${deleteTarget?.title}" بەتەواوی دەسڕێتەوە.`
            : `"${deleteTarget?.title}" will be permanently removed.`
        }
        confirmLabel={language === 'ku' ? 'بسڕەوە' : 'Delete'}
        onConfirm={handleDelete}
      />
    </DashboardShell>
  );
}
