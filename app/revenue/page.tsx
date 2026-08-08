'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { supabase } from '@/lib/supabase-client';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

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

export default function RevenueExpensesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) {
      toast.error('Failed to load transactions');
    } else {
      setTransactions((data as Transaction[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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

  const categories = formType === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSave = async () => {
    if (!formTitle.trim() || !formCategory || !formAmount || !formDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Amount must be a valid positive number');
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
      const { error } = await supabase
        .from('transactions')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editing.id);
      if (error) {
        toast.error('Failed to update transaction');
      } else {
        toast.success('Transaction updated');
        setTransactions((prev) =>
          prev.map((t) => (t.id === editing.id ? { ...t, ...payload } as Transaction : t))
        );
        setEditOpen(false);
      }
    } else {
      const { data, error } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();
      if (error) {
        toast.error('Failed to create transaction');
      } else {
        toast.success('Transaction created');
        setTransactions((prev) => [data as Transaction, ...prev]);
        setEditOpen(false);
      }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('transactions').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Failed to delete transaction');
    } else {
      toast.success('Transaction deleted');
      setTransactions((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
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
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Revenue" value={totals.revenue} icon={TrendingUp} format="currency" accent="success" delay={0} />
        <StatCard title="Total Expenses" value={totals.expense} icon={TrendingDown} format="currency" accent="destructive" delay={0.05} />
        <StatCard title="Net Balance" value={totals.net} icon={Wallet} format="currency" accent={totals.net >= 0 ? 'primary' : 'destructive'} delay={0.1} />
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | TransactionType)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="revenue">Revenue Only</SelectItem>
              <SelectItem value="expense">Expenses Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} records</span>
      </div>

      {/* Table */}
      <Card className="mt-4">
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              description="Add your first revenue or expense entry to start tracking."
              action={
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
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
                            ? 'bg-success/10 text-success border-success/20 capitalize'
                            : 'bg-destructive/10 text-destructive border-destructive/20 capitalize'
                        }
                      >
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tx.title}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.category}</TableCell>
                    <TableCell className="text-right font-semibold">
                      <span className={tx.type === 'revenue' ? 'text-success' : 'text-destructive'}>
                        {tx.type === 'revenue' ? '+' : '-'}
                        {formatCurrency(Number(tx.amount))}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(tx.date)}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {tx.note ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
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
            <DialogTitle>{editing ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
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
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-title">Title</Label>
              <Input
                id="tx-title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Monthly subscription revenue"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-amount">Amount ($)</Label>
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
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-note">Note (optional)</Label>
              <Textarea
                id="tx-note"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="Additional details..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete transaction?"
        description={`"${deleteTarget?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </DashboardShell>
  );
}
