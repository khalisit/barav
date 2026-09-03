/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User as UserIcon, Shield, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : 'https://api.baravquiz.com');

function resolveMediaUrl(key?: string | null): string {
  if (!key) return '';
  if (key.startsWith('http')) return key;
  let cleanKey = key.replace(/^\/+/, '');
  if (cleanKey.startsWith('media/')) cleanKey = cleanKey.replace(/^media\//, '');
  return `${BASE_URL}/media/${cleanKey}`;
}

export function SupportChat({ userId, fullHeight = false }: { userId: string; fullHeight?: boolean }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['support', userId],
    queryFn: () => api.get(`/support/users/${userId}/messages`),
    refetchInterval: 1500,
  });

  const messages = (messagesData as any)?.data || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const replyMutation = useMutation({
    mutationFn: (text: string) => api.post(`/support/users/${userId}/reply`, { message: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', userId] });
      setMessage('');
    },
    onError: () => {
      toast.error(language === 'ku' ? 'هەڵە لە ناردنی نامە' : 'Failed to send message');
    },
  });

  const imageMutation = useMutation({
    mutationFn: async (file: File) => {
      const token = document.cookie.split('; ').find((r) => r.startsWith('admin_token='))?.split('=')[1]
        || localStorage.getItem('admin_token')
        || '';
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${BASE_URL}/api/support/users/${userId}/reply-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', userId] });
    },
    onError: () => {
      toast.error(language === 'ku' ? 'هەڵە لە بارکردنی وێنە' : 'Failed to upload image');
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    replyMutation.mutate(message);
  };

  const handleImagePick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) imageMutation.mutate(file);
    e.target.value = '';
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <>
      <div className={`flex flex-col bg-background ${fullHeight ? 'h-full' : 'h-[500px] border rounded-lg'}`}>
        {/* Chat Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              {language === 'ku' ? 'هیچ نامەیەک نییە' : 'No messages yet'}
            </div>
          ) : (
            messages.map((msg: any) => {
              const isAdmin = msg.isFromAdmin;
              const hasImage = !!msg.imageUrl;
              const hasText = msg.message && msg.message.trim() !== '';
              const imageUrl = resolveMediaUrl(msg.imageUrl);

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[80%] ${isAdmin ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
                  >
                    {isAdmin ? <Shield size={14} /> : <UserIcon size={14} />}
                  </div>
                  <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`overflow-hidden rounded-2xl ${isAdmin ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}
                    >
                      {hasImage && (
                        <button
                          onClick={() => setLightboxUrl(imageUrl)}
                          className="block relative group"
                        >
                          <img
                            src={imageUrl}
                            alt="chat image"
                            className="max-w-[240px] max-h-[200px] object-cover cursor-zoom-in"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={28} />
                          </div>
                        </button>
                      )}
                      {hasText && (
                        <div className="px-4 py-2">
                          {msg.message}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateTime(msg.createdAt)}
                      </span>
                      {isAdmin && (
                        <span className={msg.isRead ? "text-primary" : "text-muted-foreground opacity-50"}>
                          {msg.isRead ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 border-t bg-muted/30">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleImagePick}
              disabled={imageMutation.isPending || replyMutation.isPending}
              title={language === 'ku' ? 'ناردنی وێنە' : 'Send image'}
            >
              {imageMutation.isPending
                ? <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                : <ImageIcon size={16} />}
            </Button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'ku' ? 'نامەیەک بنووسە...' : 'Type a message...'}
              disabled={replyMutation.isPending}
              className="bg-background"
            />
            <Button
              type="submit"
              disabled={!message.trim() || replyMutation.isPending}
              size="icon"
            >
              <Send size={16} />
            </Button>
          </form>
        </div>
      </div>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxUrl(null); }}
            className="absolute top-6 right-6 z-[110] bg-white/10 text-white rounded-full p-3 hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={lightboxUrl}
            alt="Full view"
            className="max-h-[90vh] max-w-full rounded-md object-contain shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
