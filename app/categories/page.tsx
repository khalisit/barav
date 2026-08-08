'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
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
import { generateCategories } from '@/lib/mock-data';
import type { Category } from '@/lib/types';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(() => generateCategories());
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setEditOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description);
    setEditOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      setCategories((prev) => prev.map((c) => (c.id === editing.id ? { ...c, name, description } : c)));
      toast.success('Category updated');
    } else {
      setCategories((prev) => [
        ...prev,
        {
          id: `cat_${String(prev.length + 1).padStart(3, '0')}`,
          name,
          description,
          color: 'bg-blue-500',
          icon: 'FolderTree',
          quizCount: 0,
          questionCount: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      toast.success('Category created');
    }
    setEditOpen(false);
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Categories"
        description="Organize quizzes into categories"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Categories' }]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${cat.color}/10`}>
                    <FolderTree className={`h-5 w-5 ${cat.color.replace('bg-', 'text-')}`} />
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
                  <span>{cat.quizCount} quizzes</span>
                  <span>{cat.questionCount} questions</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Category description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete category?"
        description={`"${deleteTarget?.name}" and all its associations will be removed.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            toast.success('Category deleted');
            setDeleteTarget(null);
          }
        }}
      />
    </DashboardShell>
  );
}
