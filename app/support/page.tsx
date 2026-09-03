'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, MessageCircle, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useLanguage } from '@/hooks/use-language';
import { formatDateTime } from '@/lib/format';
import { motion, AnimatePresence } from 'framer-motion';
import { SupportChat } from '@/components/users/support-chat';
import { toast } from 'sonner';
import { AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function SupportPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : 'https://barav-backend.arkanstudiokrd.workers.dev');

  const resolveAvatarUrl = (key?: string | null) => {
    if (!key) return undefined;
    if (key.startsWith('http')) return key;
    let cleanKey = key.replace(/^\/+/, '');
    if (cleanKey.startsWith('media/')) cleanKey = cleanKey.replace(/^media\//, '');
    return `${BASE_URL}/media/${cleanKey}`;
  };

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['support-users'],
    queryFn: () => api.get('/support/users'),
    refetchInterval: 3000,
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/support/users/${userId}/chat`),
    onSuccess: () => {
      toast.success(language === 'ku' ? 'چاتەکە سڕایەوە' : 'Chat deleted');
      queryClient.invalidateQueries({ queryKey: ['support-users'] });
      if (activeUserId === deleteTarget) setActiveUserId(null);
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error(language === 'ku' ? 'هەڵە لە سڕینەوە' : 'Failed to delete chat');
      setDeleteTarget(null);
    },
  });

  const users = (usersData as any)?.data || [];

  const filteredUsers = users.filter((u: any) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const activeUser = users.find((u: any) => u.id === activeUserId);

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'پشتیوانی ڕاستەوخۆ' : 'Live Support'}
        description={language === 'ku' ? 'بەڕێوەبردنی نامە و داواکارییەکانی بەکارهێنەران' : 'Manage user support messages'}
      />

      <div className="mt-6 flex h-[calc(100vh-200px)] gap-6" dir={language === 'ku' ? 'rtl' : 'ltr'}>
        {/* Sidebar / User List */}
        <Card className="w-full md:w-1/3 flex flex-col h-full shadow-sm overflow-hidden bg-card">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className={`absolute ${language === 'ku' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                placeholder={language === 'ku' ? 'گەڕان...' : 'Search...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={language === 'ku' ? 'pr-9' : 'pl-9'}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <MessageCircle className="h-10 w-10 opacity-20 mb-3" />
                <p className="text-sm">{language === 'ku' ? 'هیچ نامەیەک نەدۆزرایەوە' : 'No messages found'}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user: any) => {
                  const isActive = activeUserId === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => setActiveUserId(user.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="relative">
                        <Avatar className={isActive ? 'border-2 border-primary-foreground/20' : ''}>
                          {user.avatarKey && (
                            <AvatarImage src={resolveAvatarUrl(user.avatarKey)} alt={user.fullName} />
                          )}
                          <AvatarFallback className={isActive ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'}>
                            {user.fullName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {user.unreadCount > 0 && !isActive && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                            {user.unreadCount > 9 ? '9+' : user.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold truncate text-sm">{user.fullName}</h4>
                          <span className={`text-[10px] whitespace-nowrap ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatDateTime(user.lastMessageAt).split(' ')[1]}
                          </span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {user.lastMessageFromAdmin && <span className="font-semibold opacity-75 mr-1">You:</span>}
                          {user.lastImageUrl && !user.lastMessage ? '📷 وێنە' : user.lastMessage}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="hidden md:flex flex-1 h-full shadow-sm overflow-hidden flex-col bg-card">
          <AnimatePresence mode="wait">
            {activeUserId && activeUser ? (
              <motion.div
                key={activeUserId}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {activeUser.avatarKey && (
                        <AvatarImage src={resolveAvatarUrl(activeUser.avatarKey)} alt={activeUser.fullName} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {activeUser.fullName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold">{activeUser.fullName}</h3>
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        @{activeUser.username} {activeUser.phone ? ` • ${activeUser.phoneCode || ''}${activeUser.phone}` : ''}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(activeUserId)}
                    className="gap-1.5"
                  >
                    <Trash2 size={14} />
                    {language === 'ku' ? 'سڕینەوەی چات' : 'Delete Chat'}
                  </Button>
                </div>

                {/* Chat Messages component */}
                <div className="flex-1 overflow-hidden">
                  <SupportChat userId={activeUserId} fullHeight />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-muted-foreground"
              >
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageCircle size={40} className="text-muted-foreground/50" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  {language === 'ku' ? 'بەخێربێیت بۆ بەشی یارمەتی' : 'Welcome to Support'}
                </h2>
                <p className="text-sm max-w-sm text-center">
                  {language === 'ku' ? 'کەسێک هەڵبژێرە لە لیستەکەوە بۆ دەستپێکردنی گفتوگۆ' : 'Select a user from the list to start messaging'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ku' ? 'سڕینەوەی تەواوی چات' : 'Delete Entire Chat'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ku'
                ? 'ئایا دڵنیایت؟ هەموو نامە و وێنەکانی ئەم یوزەرە بەتەواوی دەسڕێتەوە و ناتوانرێتەوە بگەڕێنرێتەوە.'
                : 'Are you sure? All messages and images for this user will be permanently deleted and cannot be recovered.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending
                ? (language === 'ku' ? 'دەسڕێتەوە...' : 'Deleting...')
                : (language === 'ku' ? 'بەڵێ، بیسڕەوە' : 'Yes, Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
