'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api-client';
import type { Category } from '@/lib/types';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import { IconPicker } from '@/components/shared/icon-picker';
import { ColorPicker } from '@/components/shared/color-picker';
import { cn } from '@/lib/utils';

const COLOR_VARIANTS: Record<string, { bg: string, text: string }> = {
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-500' },
  red: { bg: 'bg-red-500/10', text: 'text-red-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
  lime: { bg: 'bg-lime-500/10', text: 'text-lime-500' },
  green: { bg: 'bg-green-500/10', text: 'text-green-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-500' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-500' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-500' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
  fuchsia: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-500' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-500' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-500' },
};

export default function CategoriesPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { data: fetchResult, isLoading } = useQuery<{ data: Category[] }>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories')
  });
  
  const categories: Category[] = fetchResult?.data || [];

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>('blue');
  const [icon, setIcon] = useState<string>('FolderTree');

  const createMutation = useMutation({
    mutationFn: (newCategory: Partial<Category>) => api.post('/categories', newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(language === 'ku' ? 'جۆری بابەتەکە بەسەرکەوتوویی دروستکرا' : 'Category created');
      setEditOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedCategory: Partial<Category>) => api.put(`/categories/${editing?.id}`, updatedCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(language === 'ku' ? 'جۆری بابەتەکە نوێکرایەوە' : 'Category updated');
      setEditOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(language === 'ku' ? 'جۆری بابەتەکە بە سەرکەوتوویی سڕایەوە' : 'Category deleted');
      setDeleteTarget(null);
    }
  });

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setColor('blue');
    setIcon('FolderTree');
    setEditOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setColor(cat.color || 'blue');
    setIcon(cat.icon || 'FolderTree');
    setEditOpen(true);
  };

  const handleSave = () => {
    const payload = {
      name,
      description,
      color,
      icon,
    };
    if (editing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return <DashboardShell><PageHeader title={language === 'ku' ? 'هاوپۆلەکان' : 'Categories'} description={language === 'ku' ? 'چاوەڕێبە...' : 'Loading...'} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'هاوپۆلەکان' : 'Categories'}
        description={language === 'ku' ? 'بەڕێوەبردنی جۆری بابەت و هاوپۆلەکان' : 'Organize quizzes into categories'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'هاوپۆلەکان' : 'Categories' }]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="me-2 h-4 w-4" /> {language === 'ku' ? 'زیادکردنی جۆری بابەت' : 'Add Category'}
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat, i) => {
          const CategoryIcon = cat.icon ? ((LucideIcons as any)[cat.icon] || FolderTree) : FolderTree;
          const variant = COLOR_VARIANTS[cat.color || 'blue'] || COLOR_VARIANTS.blue;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", variant.bg)}>
                      <CategoryIcon className={cn("h-5 w-5", variant.text)} />
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(cat)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold">{cat.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span>{cat.quizCount || 0} {language === 'ku' ? 'کویز' : 'quizzes'}</span>
                    <span>{cat.questionCount || 0} {language === 'ku' ? 'پرسیار' : 'questions'}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? (language === 'ku' ? 'دەستکاری جۆری بابەت' : 'Edit Category')
                : (language === 'ku' ? 'جۆری بابەتی نوێ' : 'New Category')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">{language === 'ku' ? 'ناو' : 'Name'}</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ku' ? 'ناوی جۆری بابەت بنووسە' : 'Category name'}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ku' ? 'ئایکۆن' : 'Icon'}</Label>
                <IconPicker value={icon} onChange={setIcon} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{language === 'ku' ? 'ڕەنگ' : 'Color'}</Label>
              <div className="rounded-lg border p-3">
                <ColorPicker value={color} onChange={setColor} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-desc">{language === 'ku' ? 'ناساندن' : 'Description'}</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'ku' ? 'ناساندنی جۆری بابەت بنووسە' : 'Category description'}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? (language === 'ku' ? 'پاشەکەوت دەکرێت...' : 'Saving...')
                : (language === 'ku' ? 'پاشەکەوتکردن' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={language === 'ku' ? 'جۆری بابەت بسڕدرێتەوە؟' : 'Delete category?'}
        description={
          language === 'ku'
            ? `"${deleteTarget?.name}" لەگەڵ تەواوی پەیوەندییەکانی بەتەواوی دەسڕێتەوە.`
            : `"${deleteTarget?.name}" and all its associations will be removed.`
        }
        confirmLabel={language === 'ku' ? 'بسڕەوە' : 'Delete'}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </DashboardShell>
  );
}
