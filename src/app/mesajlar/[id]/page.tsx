'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  type: 'direct' | 'support';
  otherUser: { id: string; name: string; role: string } | null;
  lastMessage?: string;
  lastMessageAt?: string;
  unread: number;
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/giris'); return; }
    init();
  }, [user, isLoading]);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.getMessages(id);
      setMessages(data.messages || []);
    } catch {
      // ignore
    }
  }, [id]);

  const init = async () => {
    try {
      // Get conversation info from list
      const convData = await api.getConversations();
      const conv = (convData.conversations || []).find((c: Conversation) => c.id === id);
      if (conv) setConversation(conv);

      await fetchMessages();
      await api.markRead(id);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Poll every 3 seconds
  useEffect(() => {
    if (!user || loading) return;
    intervalRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, loading, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);
    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      conversationId: id,
      senderId: user!.id,
      senderName: user!.name,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setContent('');
    try {
      const data = await api.sendMessage(id, tempMsg.content);
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setContent(tempMsg.content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherName = conversation?.type === 'support'
    ? (user?.role === 'admin' ? conversation?.otherUser?.name || 'Kullanıcı' : 'TürkEvim Destek')
    : conversation?.otherUser?.name || 'Kullanıcı';

  if (isLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-[80px] z-10">
        <Link href="/mesajlar" className="text-foggy hover:text-hof transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="w-9 h-9 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-semibold text-sm shrink-0">
          {conversation?.type === 'support' && user?.role !== 'admin' ? '🛎' : otherName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-hof text-sm">{otherName}</p>
          {conversation?.type === 'support' && (
            <p className="text-xs text-foggy">Destek Hattı</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-foggy text-sm py-10">
            Henüz mesaj yok. İlk mesajı gönder!
          </div>
        )}
        {messages.map(msg => {
          const isOwn = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                isOwn
                  ? 'bg-gold-500 text-white rounded-br-sm'
                  : 'bg-white text-hof border border-gray-200 rounded-bl-sm shadow-sm'
              }`}>
                {!isOwn && (
                  <p className="text-xs font-semibold mb-1 text-gold-600">{msg.senderName}</p>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-foggy'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın... (Enter ile gönder)"
            rows={1}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none outline-none"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!content.trim() || sending}
            className="bg-gold-500 text-white rounded-xl p-2.5 hover:bg-gold-600 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
