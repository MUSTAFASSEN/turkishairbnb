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

const AVATAR_COLORS = [
  'from-violet-400 to-purple-500',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-orange-400 to-rose-500',
  'from-pink-400 to-fuchsia-500',
  'from-amber-400 to-orange-500',
];

function avatarColor(name: string) {
  const idx = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[idx];
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Bugün';
  if (d.toDateString() === yesterday.toDateString()) return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

function groupByDay(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = [];
  let lastDay = '';
  for (const msg of messages) {
    const day = new Date(msg.createdAt).toDateString();
    if (day !== lastDay) {
      groups.push({ label: formatDayLabel(msg.createdAt), messages: [] });
      lastDay = day;
    }
    groups[groups.length - 1].messages.push(msg);
  }
  return groups;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  useEffect(() => {
    if (!user || loading) return;
    intervalRef.current = setInterval(fetchMessages, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [user, loading, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  };

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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

  const isSupport = conversation?.type === 'support';
  const otherName = isSupport
    ? (user?.role === 'admin' ? conversation?.otherUser?.name || 'Kullanıcı' : 'TürkEvim Destek')
    : conversation?.otherUser?.name || 'Kullanıcı';
  const otherRole = conversation?.otherUser?.role || '';
  const gradient = isSupport ? 'from-gold-400 to-amber-500' : avatarColor(otherName);

  const groups = groupByDay(messages);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent mx-auto" />
          <p className="text-foggy text-sm mt-3">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gradient-to-br from-gray-50 to-gray-100" style={{ height: 'calc(100vh - 80px)' }}>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 shrink-0">
        <Link
          href="/mesajlar"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-foggy hover:text-hof hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0`}>
          {isSupport ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            otherName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-hof text-sm leading-tight truncate">{otherName}</p>
          <p className="text-xs text-foggy leading-tight">
            {isSupport ? 'Destek Hattı · 7/24 yanınızdayız' :
              otherRole === 'host' ? 'Ev Sahibi' :
              otherRole === 'admin' ? 'Admin' : 'Misafir'}
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-md`}>
              {isSupport ? '🛎' : otherName.charAt(0).toUpperCase()}
            </div>
            <p className="font-semibold text-hof">{otherName}</p>
            <p className="text-foggy text-sm mt-2">İlk mesajı göndererek konuşmayı başlat!</p>
          </div>
        )}

        {groups.map((group, gi) => (
          <div key={gi}>
            {/* Day separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-foggy font-medium bg-gray-100 px-3 py-1 rounded-full shrink-0">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {group.messages.map((msg, mi) => {
              const isOwn = msg.senderId === user?.id;
              const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
              const showAvatar = !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId);
              const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}
                >
                  {/* Other's avatar */}
                  {!isOwn && (
                    <div className="w-7 h-7 shrink-0 mb-0.5">
                      {showAvatar && (
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold`}>
                          {isSupport ? '🛎' : msg.senderName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[72%]`}>
                    {showAvatar && !isOwn && (
                      <span className="text-xs text-foggy font-medium ml-1 mb-1">{msg.senderName}</span>
                    )}
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isOwn
                          ? 'bg-gradient-to-br from-gold-500 to-amber-500 text-white rounded-br-sm'
                          : 'bg-white text-hof border border-gray-100 rounded-bl-sm'
                      } ${msg.id.startsWith('temp-') ? 'opacity-70' : ''}`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <span className={`text-[10px] mt-1 mx-1 ${isOwn ? 'text-foggy' : 'text-foggy'}`}>
                      {formatMessageTime(msg.createdAt)}
                      {isOwn && msg.id.startsWith('temp-') && ' · Gönderiliyor...'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-3 py-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Bir mesaj yazın..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-hof placeholder:text-foggy resize-none outline-none leading-relaxed py-1"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!content.trim() || sending}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shrink-0 ${
              content.trim() && !sending
                ? 'bg-gradient-to-br from-gold-500 to-amber-500 text-white shadow-md hover:shadow-lg hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-foggy mt-1.5">Enter ile gönder · Shift+Enter ile yeni satır</p>
      </div>
    </div>
  );
}
